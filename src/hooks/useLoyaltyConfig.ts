import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LoyaltyConfig {
  id: string;
  branch_id: string | null;
  points_per_dollar: number;
  redeem_rate: number;
  minimum_redeem_points: number;
  points_expiry_days: number | null;
  welcome_bonus_points: number | null;
  referral_bonus_points: number | null;
  birthday_bonus_points: number | null;
}

export interface LoyaltyTier {
  id: string;
  branch_id: string | null;
  name: string;
  min_points: number;
  max_points: number | null;
  points_multiplier: number;
  discount_percentage: number | null;
  tier_order: number;
  color: string | null;
  benefits: any;
}

export const useLoyaltyConfig = (branchId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const configQuery = useQuery({
    queryKey: ['loyalty-config', branchId],
    queryFn: async () => {
      if (!branchId) return null;

      const { data, error } = await supabase
        .from('loyalty_config')
        .select('*')
        .eq('branch_id', branchId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to fetch loyalty config: ${error.message}`);
      }

      return data as LoyaltyConfig | null;
    },
    enabled: !!branchId,
  });

  const tiersQuery = useQuery({
    queryKey: ['loyalty-tiers', branchId],
    queryFn: async () => {
      if (!branchId) return [];

      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .eq('branch_id', branchId)
        .order('tier_order');

      if (error) {
        throw new Error(`Failed to fetch loyalty tiers: ${error.message}`);
      }

      return data as LoyaltyTier[];
    },
    enabled: !!branchId,
  });

  const updateConfig = useMutation({
    mutationFn: async (config: Partial<LoyaltyConfig>) => {
      if (!branchId) throw new Error('Branch ID is required');

      const { error } = await supabase
        .from('loyalty_config')
        .upsert({
          branch_id: branchId,
          ...config,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-config', branchId] });
      toast({
        title: 'Success',
        description: 'Loyalty configuration updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update configuration',
        variant: 'destructive',
      });
    },
  });

  const updateTiers = useMutation({
    mutationFn: async (tiers: Partial<LoyaltyTier>[]) => {
      if (!branchId) throw new Error('Branch ID is required');

      // Validate no overlapping ranges
      const sortedTiers = [...tiers].sort((a, b) => (a.min_points || 0) - (b.min_points || 0));
      for (let i = 0; i < sortedTiers.length - 1; i++) {
        const current = sortedTiers[i];
        const next = sortedTiers[i + 1];
        
        if (current.max_points && next.min_points && current.max_points >= next.min_points) {
          throw new Error(`Tier ranges overlap: ${current.name} and ${next.name}`);
        }
      }

      // Delete existing tiers
      await supabase
        .from('loyalty_tiers')
        .delete()
        .eq('branch_id', branchId);

      // Insert new tiers
      const { error } = await supabase
        .from('loyalty_tiers')
        .insert(tiers.map(tier => ({
          branch_id: branchId,
          name: tier.name!,
          min_points: tier.min_points!,
          max_points: tier.max_points || null,
          points_multiplier: tier.points_multiplier!,
          discount_percentage: tier.discount_percentage || 0,
          tier_order: tier.tier_order!,
          color: tier.color || '#6366f1',
          benefits: tier.benefits || [],
        })));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-tiers', branchId] });
      toast({
        title: 'Success',
        description: 'Loyalty tiers updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update tiers',
        variant: 'destructive',
      });
    },
  });

  return {
    config: configQuery.data,
    tiers: tiersQuery.data ?? [],
    isLoading: configQuery.isLoading || tiersQuery.isLoading,
    error: configQuery.error || tiersQuery.error,
    updateConfig: updateConfig.mutate,
    updateTiers: updateTiers.mutate,
    isUpdating: updateConfig.isPending || updateTiers.isPending,
  };
};