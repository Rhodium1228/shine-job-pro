import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  rating: number | null;
  total_reviews: number | null;
}

interface UseStaffListOptions {
  branchId?: string;
  availabilityStatus?: string;
  includeRoles?: boolean;
  includeBranches?: boolean;
  enabled?: boolean;
}

export const useStaffList = (options: UseStaffListOptions = {}) => {
  return useQuery({
    queryKey: ['staff', options],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url, hourly_rate, specialties, is_suspended, availability_status, default_salon_id, rating, total_reviews')
        .order('full_name', { ascending: true });

      if (options.availabilityStatus) {
        query = query.eq('availability_status', options.availabilityStatus);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch staff: ${error.message}`);
      }

      let filteredData = data || [];

      // Client-side filter by branch if needed
      if (options.branchId && filteredData.length > 0) {
        const { data: branchStaff } = await supabase
          .from('staff_branches')
          .select('staff_id')
          .eq('salon_id', options.branchId);

        const staffIds = new Set(branchStaff?.map(sb => sb.staff_id) || []);
        filteredData = filteredData.filter(staff => staffIds.has(staff.id));
      }

      return filteredData as StaffMember[];
    },
    enabled: options.enabled !== false,
  });
};