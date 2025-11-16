import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StaffService {
  id: string;
  staff_id: string;
  service_name: string;
  base_price: number;
  custom_price: number | null;
  is_active: boolean;
  requires_admin_approval: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffServiceInput {
  service_name: string;
  base_price: number;
  custom_price?: number | null;
  is_active?: boolean;
  requires_admin_approval?: boolean;
}

export const useStaffServices = (staffId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch services for a staff member
  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ['staff-services', staffId],
    queryFn: async () => {
      if (!staffId) return [];
      
      const { data, error } = await supabase
        .from('staff_services')
        .select('*')
        .eq('staff_id', staffId)
        .order('service_name');

      if (error) throw error;
      return data as StaffService[];
    },
    enabled: !!staffId,
  });

  // Add service mutation
  const addService = useMutation({
    mutationFn: async ({ staffId, service }: { staffId: string; service: StaffServiceInput }) => {
      console.log('Adding service:', { staffId, service });
      
      const { data, error } = await supabase
        .from('staff_services')
        .insert({
          staff_id: staffId,
          ...service,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding service:', error);
        throw error;
      }
      console.log('Service added successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-services'] });
      toast({
        title: "Success",
        description: "Service added successfully",
      });
    },
    onError: (error: any) => {
      console.error('Add service mutation error:', error);
      const errorMessage = error.message?.includes('permission')
        ? "You don't have permission to add services for this staff member"
        : error.message || "Failed to add service";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update service mutation
  const updateService = useMutation({
    mutationFn: async ({ serviceId, updates }: { serviceId: string; updates: Partial<StaffServiceInput> }) => {
      console.log('Updating service:', { serviceId, updates });
      
      const { data, error } = await supabase
        .from('staff_services')
        .update(updates)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) {
        console.error('Error updating service:', error);
        throw error;
      }
      console.log('Service updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-services'] });
      toast({
        title: "Success",
        description: "Service updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Update service mutation error:', error);
      const errorMessage = error.message?.includes('permission')
        ? "You don't have permission to update this service"
        : error.message || "Failed to update service";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Approve service mutation (admin only)
  const approveService = useMutation({
    mutationFn: async (serviceId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('staff_services')
        .update({
          requires_admin_approval: false,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-services'] });
      toast({
        title: "Success",
        description: "Service approved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve service",
        variant: "destructive",
      });
    },
  });

  // Delete service mutation
  const deleteService = useMutation({
    mutationFn: async (serviceId: string) => {
      console.log('Deleting service:', serviceId);
      
      const { error } = await supabase
        .from('staff_services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        console.error('Error deleting service:', error);
        throw error;
      }
      console.log('Service deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-services'] });
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Delete service mutation error:', error);
      const errorMessage = error.message?.includes('permission')
        ? "You don't have permission to delete this service"
        : error.message || "Failed to delete service";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Fetch all services pending approval (admin only)
  const { data: pendingServices = [] } = useQuery({
    queryKey: ['pending-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_services')
        .select(`
          *,
          profiles:staff_id (full_name, email)
        `)
        .eq('requires_admin_approval', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return {
    services,
    isLoading,
    refetch,
    addService: addService.mutate,
    updateService: updateService.mutate,
    approveService: approveService.mutate,
    deleteService: deleteService.mutate,
    pendingServices,
  };
};
