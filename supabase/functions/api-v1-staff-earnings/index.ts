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

    const url = new URL(req.url);
    const dateFrom = url.searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = url.searchParams.get('dateTo') || new Date().toISOString();
    const branchId = url.searchParams.get('branchId');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get staff hourly rate
    const { data: profile } = await supabase
      .from('profiles')
      .select('hourly_rate')
      .eq('id', context.userId)
      .single();

    const hourlyRate = profile?.hourly_rate || 0;

    // Get completed jobs
    let jobsQuery = supabase
      .from('active_jobs')
      .select('*')
      .eq('staff_id', context.userId)
      .eq('status', 'completed')
      .gte('completed_at', dateFrom)
      .lte('completed_at', dateTo);

    if (branchId) {
      jobsQuery = jobsQuery.eq('branch_id', branchId);
    }

    const { data: completedJobs, error: jobsError } = await jobsQuery;

    if (jobsError) {
      console.error('Jobs fetch error:', jobsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch earnings data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate earnings
    let totalHours = 0;
    let totalRevenue = 0;
    const jobCount = completedJobs?.length || 0;

    completedJobs?.forEach(job => {
      const startTime = new Date(job.started_at).getTime();
      const endTime = new Date(job.completed_at).getTime();
      const pausedSeconds = job.total_paused_seconds || 0;
      
      const workSeconds = Math.floor((endTime - startTime) / 1000) - pausedSeconds;
      const workHours = workSeconds / 3600;
      
      totalHours += workHours;
      totalRevenue += parseFloat(job.price) || 0;
    });

    const estimatedEarnings = totalHours * hourlyRate;

    // Get breakdown by date
    const dailyBreakdown: Record<string, { jobs: number; hours: number; revenue: number }> = {};
    
    completedJobs?.forEach(job => {
      const date = new Date(job.completed_at).toISOString().split('T')[0];
      
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = { jobs: 0, hours: 0, revenue: 0 };
      }
      
      const startTime = new Date(job.started_at).getTime();
      const endTime = new Date(job.completed_at).getTime();
      const pausedSeconds = job.total_paused_seconds || 0;
      const workHours = (Math.floor((endTime - startTime) / 1000) - pausedSeconds) / 3600;
      
      dailyBreakdown[date].jobs++;
      dailyBreakdown[date].hours += workHours;
      dailyBreakdown[date].revenue += parseFloat(job.price) || 0;
    });

    console.log('Earnings fetched:', { userId: context.userId, totalJobs: jobCount });

    return new Response(
      JSON.stringify({
        summary: {
          totalJobs: jobCount,
          totalHours: Math.round(totalHours * 100) / 100,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          estimatedEarnings: Math.round(estimatedEarnings * 100) / 100,
          hourlyRate,
          averageJobValue: jobCount > 0 ? Math.round((totalRevenue / jobCount) * 100) / 100 : 0,
        },
        dailyBreakdown: Object.entries(dailyBreakdown).map(([date, data]) => ({
          date,
          ...data,
          hours: Math.round(data.hours * 100) / 100,
          revenue: Math.round(data.revenue * 100) / 100,
        })),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in earnings:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: error instanceof Error && error.message.includes('Invalid') ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
