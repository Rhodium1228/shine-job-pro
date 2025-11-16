import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { verifyAuth, requireAdmin, corsHeaders } from '../_shared/auth-middleware.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const loyaltyConfigSchema = z.object({
  branchId: z.string().uuid(),
  pointsPerDollar: z.number().min(0),
  redeemRate: z.number().positive(),
  minimumRedeemPoints: z.number().min(0),
  welcomeBonusPoints: z.number().min(0).optional(),
  referralBonusPoints: z.number().min(0).optional(),
  birthdayBonusPoints: z.number().min(0).optional(),
  pointsExpiryDays: z.number().positive().optional(),
});

const loyaltyTierSchema = z.object({
  branchId: z.string().uuid(),
  name: z.string().min(1),
  minPoints: z.number().min(0),
  maxPoints: z.number().positive().nullable(),
  pointsMultiplier: z.number().positive(),
  discountPercentage: z.number().min(0).max(100).optional(),
  tierOrder: z.number().int().min(0),
  color: z.string().optional(),
  benefits: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.maxPoints !== null && data.maxPoints <= data.minPoints) {
    return false;
  }
  return true;
}, {
  message: "maxPoints must be greater than minPoints",
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const context = await verifyAuth(authHeader);
    requireAdmin(context);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle GET - Fetch loyalty config
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const branchId = url.searchParams.get('branchId');

      if (!branchId) {
        return new Response(
          JSON.stringify({ error: 'branchId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: config, error: configError } = await supabase
        .from('loyalty_config')
        .select('*')
        .eq('branch_id', branchId)
        .maybeSingle();

      const { data: tiers, error: tiersError } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .eq('branch_id', branchId)
        .order('tier_order');

      if (configError || tiersError) {
        throw configError || tiersError;
      }

      return new Response(
        JSON.stringify({ config, tiers }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle POST - Create/Update loyalty config
    if (req.method === 'POST') {
      const body = await req.json();
      const { config, tiers } = body;

      // Validate config
      const validatedConfig = loyaltyConfigSchema.parse(config);

      // Validate all tiers
      const validatedTiers = tiers.map((tier: any) => loyaltyTierSchema.parse(tier));

      // Check for overlapping tier ranges
      const sortedTiers = [...validatedTiers].sort((a, b) => a.minPoints - b.minPoints);
      for (let i = 0; i < sortedTiers.length - 1; i++) {
        const current = sortedTiers[i];
        const next = sortedTiers[i + 1];
        
        if (current.maxPoints !== null && current.maxPoints >= next.minPoints) {
          return new Response(
            JSON.stringify({ 
              error: 'Tier ranges overlap',
              details: `Tier "${current.name}" (${current.minPoints}-${current.maxPoints}) overlaps with "${next.name}" (${next.minPoints}-${next.maxPoints || '∞'})`
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Upsert loyalty config
      const { error: configError } = await supabase
        .from('loyalty_config')
        .upsert({
          branch_id: validatedConfig.branchId,
          points_per_dollar: validatedConfig.pointsPerDollar,
          redeem_rate: validatedConfig.redeemRate,
          minimum_redeem_points: validatedConfig.minimumRedeemPoints,
          welcome_bonus_points: validatedConfig.welcomeBonusPoints || 0,
          referral_bonus_points: validatedConfig.referralBonusPoints || 0,
          birthday_bonus_points: validatedConfig.birthdayBonusPoints || 0,
          points_expiry_days: validatedConfig.pointsExpiryDays || null,
        });

      if (configError) {
        throw configError;
      }

      // Delete existing tiers for this branch
      await supabase
        .from('loyalty_tiers')
        .delete()
        .eq('branch_id', validatedConfig.branchId);

      // Insert new tiers
      const { error: tiersError } = await supabase
        .from('loyalty_tiers')
        .insert(
          validatedTiers.map((tier: any) => ({
            branch_id: tier.branchId,
            name: tier.name,
            min_points: tier.minPoints,
            max_points: tier.maxPoints,
            points_multiplier: tier.pointsMultiplier,
            discount_percentage: tier.discountPercentage || 0,
            tier_order: tier.tierOrder,
            color: tier.color || '#6366f1',
            benefits: tier.benefits || [],
          }))
        );

      if (tiersError) {
        throw tiersError;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Loyalty configuration saved successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in loyalty config:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: error.errors
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to manage loyalty configuration';
    const status = errorMessage === 'Admin access required' ? 403 :
                   errorMessage?.includes('authorization') ? 401 : 500;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});