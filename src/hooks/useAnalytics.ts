import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, eachDayOfInterval } from 'date-fns';

interface UseAnalyticsOptions {
  branchId?: string;
  staffId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  enabled?: boolean;
}

export interface AnalyticsData {
  totalRevenue: number;
  completedRevenue: number;
  totalBookings: number;
  completedBookings: number;
  dailyRevenue: Array<{
    date: string;
    fullDate: Date;
    revenue: number;
    bookings: number;
    averageValue: number;
  }>;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
  serviceBreakdown: Array<{
    name: string;
    revenue: number;
    count: number;
  }>;
}

export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  return useQuery({
    queryKey: ['analytics', options],
    queryFn: async (): Promise<AnalyticsData> => {
      let query = supabase
        .from('bookings')
        .select('*');

      if (options.branchId) {
        query = query.eq('salon_id', options.branchId);
      }

      if (options.staffId) {
        query = query.eq('staff_id', options.staffId);
      }

      if (options.dateFrom) {
        query = query.gte('booking_time', options.dateFrom.toISOString());
      }

      if (options.dateTo) {
        query = query.lte('booking_time', options.dateTo.toISOString());
      }

      const { data: bookings, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch analytics: ${error.message}`);
      }

      // Calculate total revenue
      const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.price), 0) || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
      const completedRevenue = completedBookings.reduce((sum, b) => sum + Number(b.price), 0);

      // Calculate daily revenue
      const dailyRevenue = options.dateFrom && options.dateTo
        ? eachDayOfInterval({ start: options.dateFrom, end: options.dateTo }).map(date => {
            const dayBookings = bookings?.filter(b => 
              format(new Date(b.booking_time), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
            ) || [];
            
            const revenue = dayBookings.reduce((sum, b) => sum + Number(b.price), 0);

            return {
              date: format(date, 'MMM dd'),
              fullDate: date,
              revenue: parseFloat(revenue.toFixed(2)),
              bookings: dayBookings.length,
              averageValue: dayBookings.length > 0 ? revenue / dayBookings.length : 0,
            };
          })
        : [];

      // Calculate peak hours
      const hourCounts: Record<number, number> = {};
      bookings?.forEach(booking => {
        const hour = new Date(booking.booking_time).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const peakHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count);

      // Calculate service breakdown
      const serviceStats: Record<string, { revenue: number; count: number }> = {};
      bookings?.forEach(booking => {
        if (!serviceStats[booking.service]) {
          serviceStats[booking.service] = { revenue: 0, count: 0 };
        }
        serviceStats[booking.service].revenue += Number(booking.price);
        serviceStats[booking.service].count++;
      });

      const serviceBreakdown = Object.entries(serviceStats).map(([name, stats]) => ({
        name,
        ...stats,
      }));

      return {
        totalRevenue,
        completedRevenue,
        totalBookings: bookings?.length || 0,
        completedBookings: completedBookings.length,
        dailyRevenue,
        peakHours,
        serviceBreakdown,
      };
    },
    enabled: options.enabled !== false,
  });
};