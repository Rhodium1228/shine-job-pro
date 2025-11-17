import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface StaffMember {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  hourly_rate: number | null;
  specialties: string[] | null;
  is_suspended: boolean | null;
  availability_status: string | null;
  default_salon_id: string | null;
  salon_id: string | null;
  rating: number | null;
  total_reviews: number | null;
}

interface UseStaffListOptions {
  salonId?: string;
  availabilityStatus?: string;
  includeRoles?: boolean;
  enabled?: boolean;
}

export const useStaffList = (options: UseStaffListOptions = {}) => {
  const { salonId: contextSalonId, isSuperAdmin } = useTenant();
  const targetSalonId = options.salonId || contextSalonId;

  return useQuery({
    queryKey: ['staff', targetSalonId, options],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url, hourly_rate, specialties, is_suspended, availability_status, default_salon_id, salon_id, rating, total_reviews')
        .order('full_name', { ascending: true });

      // Tenant isolation - only show staff from user's salon unless super admin
      if (!isSuperAdmin && targetSalonId) {
        query = query.eq('salon_id', targetSalonId);
      }

      if (options.availabilityStatus) {
        query = query.eq('availability_status', options.availabilityStatus);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch staff: ${error.message}`);
      }

      return (data || []) as StaffMember[];
    },
    enabled: options.enabled !== false,
  });
};