import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { verifyAuth, corsHeaders } from '../_shared/auth-middleware.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const context = await verifyAuth(authHeader);

    // Validate input
    const jobActionSchema = z.object({
      jobId: z.string().uuid('Invalid job ID format'),
      action: z.enum(['start', 'pause', 'resume', 'complete', 'cancel'], { 
        errorMap: () => ({ message: 'Invalid action' }) 
      }),
      reason: z.string().trim().max(500, 'Reason cannot exceed 500 characters').optional()
    });

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validationResult = jobActionSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationResult.error.issues.map(i => i.message)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { jobId, action, reason } = validationResult.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString();

    if (action === 'start') {
      // Create new active job from booking
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', jobId)
        .eq('staff_id', context.userId)
        .single();

      if (!booking) {
        return new Response(
          JSON.stringify({ error: 'Booking not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: activeJob, error: insertError } = await supabase
        .from('active_jobs')
        .insert({
          booking_id: booking.id,
          staff_id: context.userId,
          branch_id: booking.branch_id,
          client_name: booking.client_name,
          service: booking.service,
          price: booking.price,
          duration: booking.duration,
          status: 'active',
          started_at: now,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Job start error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to start job' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update booking status
      await supabase
        .from('bookings')
        .update({ status: 'in_progress' })
        .eq('id', jobId);

      // Log status history
      await supabase
        .from('status_history')
        .insert({
          staff_id: context.userId,
          status: 'busy',
          started_at: now,
        });

      console.log('Job started:', { jobId: activeJob.id, userId: context.userId });

      return new Response(
        JSON.stringify({ success: true, job: activeJob }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For other actions, verify active job exists
    const { data: activeJob, error: fetchError } = await supabase
      .from('active_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('staff_id', context.userId)
      .single();

    if (fetchError || !activeJob) {
      return new Response(
        JSON.stringify({ error: 'Active job not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different actions
    switch (action) {
      case 'pause': {
        const { error } = await supabase
          .from('active_jobs')
          .update({
            status: 'paused',
            paused_at: now,
            pause_reason: reason || 'manual',
          })
          .eq('id', jobId);

        if (error) throw error;

        // Update status history
        await supabase
          .from('status_history')
          .update({ ended_at: now, duration_seconds: 0 })
          .eq('staff_id', context.userId)
          .is('ended_at', null);

        await supabase
          .from('status_history')
          .insert({
            staff_id: context.userId,
            status: 'on_break',
            started_at: now,
          });

        break;
      }

      case 'resume': {
        const pausedSeconds = activeJob.total_paused_seconds || 0;
        const pausedDuration = activeJob.paused_at 
          ? Math.floor((Date.now() - new Date(activeJob.paused_at).getTime()) / 1000)
          : 0;

        const { error } = await supabase
          .from('active_jobs')
          .update({
            status: 'active',
            paused_at: null,
            pause_reason: null,
            total_paused_seconds: pausedSeconds + pausedDuration,
          })
          .eq('id', jobId);

        if (error) throw error;

        // Update status history
        await supabase
          .from('status_history')
          .update({ ended_at: now, duration_seconds: 0 })
          .eq('staff_id', context.userId)
          .is('ended_at', null);

        await supabase
          .from('status_history')
          .insert({
            staff_id: context.userId,
            status: 'busy',
            started_at: now,
          });

        break;
      }

      case 'complete': {
        const { error } = await supabase
          .from('active_jobs')
          .update({
            status: 'completed',
            completed_at: now,
          })
          .eq('id', jobId);

        if (error) throw error;

        // Update booking status
        await supabase
          .from('bookings')
          .update({ status: 'completed' })
          .eq('id', activeJob.booking_id);

        // Update status history
        await supabase
          .from('status_history')
          .update({ ended_at: now, duration_seconds: 0 })
          .eq('staff_id', context.userId)
          .is('ended_at', null);

        await supabase
          .from('status_history')
          .insert({
            staff_id: context.userId,
            status: 'available',
            started_at: now,
          });

        break;
      }

      case 'cancel': {
        const { error } = await supabase
          .from('active_jobs')
          .delete()
          .eq('id', jobId);

        if (error) throw error;

        // Update booking status
        await supabase
          .from('bookings')
          .update({ status: 'cancelled', notes: reason || 'Job cancelled' })
          .eq('id', activeJob.booking_id);

        // Update status history
        await supabase
          .from('status_history')
          .update({ ended_at: now, duration_seconds: 0 })
          .eq('staff_id', context.userId)
          .is('ended_at', null);

        await supabase
          .from('status_history')
          .insert({
            staff_id: context.userId,
            status: 'available',
            started_at: now,
          });

        break;
      }
    }

    console.log('Job action completed:', { jobId, action, userId: context.userId });

    return new Response(
      JSON.stringify({ success: true, action }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in job action:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: error instanceof Error && error.message.includes('Invalid') ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
