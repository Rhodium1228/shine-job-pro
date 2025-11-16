import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Booking {
  id: string;
  staff_id: string;
  client_name: string;
  service: string;
  booking_time: string;
  duration: string;
  price: number;
  status: string;
  client_phone?: string | null;
  client_email?: string | null;
  notes?: string | null;
  branch_id?: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
  branches?: {
    name: string;
  } | null;
}

interface UseBookingsOptions {
  status?: string;
  branchId?: string;
  staffId?: string;
  service?: string;
  dateFrom?: string;
  dateTo?: string;
  enabled?: boolean;
}

export const useBookings = (options: UseBookingsOptions = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['bookings', options],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          profiles(full_name, email),
          branches(name)
        `)
        .order('booking_time', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.branchId) {
        query = query.eq('branch_id', options.branchId);
      }

      if (options.staffId) {
        query = query.eq('staff_id', options.staffId);
      }

      if (options.service) {
        query = query.ilike('service', `%${options.service}%`);
      }

      if (options.dateFrom) {
        query = query.gte('booking_time', options.dateFrom);
      }

      if (options.dateTo) {
        query = query.lte('booking_time', options.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch bookings: ${error.message}`);
      }

      return data as Booking[];
    },
    enabled: options.enabled !== false,
  });

  const updateBooking = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Booking> }) => {
      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: 'Success',
        description: 'Booking updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update booking',
        variant: 'destructive',
      });
    },
  });

  const deleteBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: 'Success',
        description: 'Booking deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete booking',
        variant: 'destructive',
      });
    },
  });

  return {
    bookings: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateBooking: updateBooking.mutate,
    deleteBooking: deleteBooking.mutate,
    isUpdating: updateBooking.isPending,
    isDeleting: deleteBooking.isPending,
  };
};