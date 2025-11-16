import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { verifyAuth, requireAdmin, corsHeaders } from '../_shared/auth-middleware.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const context = await verifyAuth(authHeader);
    requireAdmin(context);

    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build base query for bookings
    let query = supabase
      .from('bookings')
      .select('*');

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    if (dateFrom) {
      query = query.gte('booking_time', dateFrom);
    }

    if (dateTo) {
      query = query.lte('booking_time', dateTo);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings for analytics:', error);
      throw error;
    }

    // Calculate revenue metrics
    const totalRevenue = bookings?.reduce((sum, b) => sum + (Number(b.price) || 0), 0) || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
    const completedRevenue = completedBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    // Calculate daily revenue
    const revenueByDate: Record<string, number> = {};
    bookings?.forEach(booking => {
      const date = new Date(booking.booking_time).toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + (Number(booking.price) || 0);
    });

    // Calculate peak hours (bookings per hour)
    const bookingsByHour: Record<number, number> = {};
    bookings?.forEach(booking => {
      const hour = new Date(booking.booking_time).getHours();
      bookingsByHour[hour] = (bookingsByHour[hour] || 0) + 1;
    });

    // Calculate service distribution
    const serviceRevenue: Record<string, number> = {};
    const serviceCount: Record<string, number> = {};
    bookings?.forEach(booking => {
      const service = booking.service;
      serviceRevenue[service] = (serviceRevenue[service] || 0) + (Number(booking.price) || 0);
      serviceCount[service] = (serviceCount[service] || 0) + 1;
    });

    // Calculate staff performance
    const staffStats: Record<string, { revenue: number; bookings: number; completed: number }> = {};
    bookings?.forEach(booking => {
      const staffId = booking.staff_id;
      if (!staffStats[staffId]) {
        staffStats[staffId] = { revenue: 0, bookings: 0, completed: 0 };
      }
      staffStats[staffId].revenue += Number(booking.price) || 0;
      staffStats[staffId].bookings += 1;
      if (booking.status === 'completed') {
        staffStats[staffId].completed += 1;
      }
    });

    return new Response(
      JSON.stringify({
        totalRevenue,
        completedRevenue,
        totalBookings: bookings?.length || 0,
        completedBookings: completedBookings.length,
        revenueByDate: Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue })),
        peakHours: Object.entries(bookingsByHour)
          .map(([hour, count]) => ({ hour: parseInt(hour), count }))
          .sort((a, b) => b.count - a.count),
        serviceBreakdown: Object.entries(serviceRevenue).map(([service, revenue]) => ({
          service,
          revenue,
          count: serviceCount[service],
        })),
        staffPerformance: Object.entries(staffStats).map(([staffId, stats]) => ({
          staffId,
          ...stats,
        })),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics';
    const status = errorMessage === 'Admin access required' ? 403 :
                   errorMessage?.includes('authorization') ? 401 : 500;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});