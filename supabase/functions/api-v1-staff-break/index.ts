import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { verifyAuth, corsHeaders } from '../_shared/auth-middleware.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const context = await verifyAuth(authHeader);

    const { action, duration } = await req.json();

    if (!action || !['start', 'end'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "start" or "end"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString();

    if (action === 'start') {
      if (!duration || duration < 1) {
        return new Response(
          JSON.stringify({ error: 'Break duration (in minutes) is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already on break
      const { data: existingBreak } = await supabase
        .from('break_sessions')
        .select('id')
        .eq('staff_id', context.userId)
        .eq('status', 'active')
        .maybeSingle();

      if (existingBreak) {
        return new Response(
          JSON.stringify({ error: 'Break already in progress' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const endsAt = new Date(Date.now() + duration * 60000).toISOString();

      const { data: breakSession, error: insertError } = await supabase
        .from('break_sessions')
        .insert({
          staff_id: context.userId,
          break_duration_minutes: duration,
          started_at: now,
          ends_at: endsAt,
          status: 'active',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Break start error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to start break' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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

      console.log('Break started:', { breakId: breakSession.id, userId: context.userId });

      return new Response(
        JSON.stringify({ success: true, breakSession }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // End break
    const { data: activeBreak, error: fetchError } = await supabase
      .from('break_sessions')
      .select('*')
      .eq('staff_id', context.userId)
      .eq('status', 'active')
      .maybeSingle();

    if (fetchError || !activeBreak) {
      return new Response(
        JSON.stringify({ error: 'No active break found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: updateError } = await supabase
      .from('break_sessions')
      .update({ status: 'completed' })
      .eq('id', activeBreak.id);

    if (updateError) {
      console.error('Break end error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to end break' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    console.log('Break ended:', { breakId: activeBreak.id, userId: context.userId });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in break management:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: error instanceof Error && error.message.includes('Invalid') ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
