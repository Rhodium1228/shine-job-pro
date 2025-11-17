import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTenant } from '@/contexts/TenantContext';

export interface Salon {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean | null;
  owner_user_id: string | null;
  created_at: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  logo_url: string | null;
  color_theme: string | null;
}

export const useSalons = () => {
  const { isSuperAdmin, salonId } = useTenant();
  
  return useQuery({
    queryKey: ['salons', isSuperAdmin, salonId],
    queryFn: async () => {
      let query = supabase
        .from('salons')
        .select('*')
        .order('name', { ascending: true });

      // If not super admin, only show their salon
      if (!isSuperAdmin && salonId) {
        query = query.eq('id', salonId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch salons: ${error.message}`);
      }

      return data as Salon[];
    },
    enabled: true,
  });
};

export const useCurrentSalon = () => {
  const { salonId } = useTenant();
  
  return useQuery({
    queryKey: ['salon', salonId],
    queryFn: async () => {
      if (!salonId) return null;

      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .eq('id', salonId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch salon: ${error.message}`);
      }

      return data as Salon;
    },
    enabled: !!salonId,
  });
};

export const useUpdateSalon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Salon> }) => {
      const { error } = await supabase
        .from('salons')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salons'] });
      queryClient.invalidateQueries({ queryKey: ['salon'] });
      toast.success('Salon updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update salon: ${error.message}`);
    },
  });
};

export const useCreateSalon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (salon: Partial<Salon>) => {
      const { data, error } = await supabase
        .from('salons')
        .insert(salon)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salons'] });
      toast.success('Salon created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create salon: ${error.message}`);
    },
  });
};
