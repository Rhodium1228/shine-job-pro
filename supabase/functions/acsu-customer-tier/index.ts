import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerId } = await req.json();
    
    console.log('ACSU Customer Tier:', { customerId });

    // Placeholder API call - replace with actual ACSU API
    const ACSU_API_URL = Deno.env.get('ACSU_API_URL') || 'https://api.acsu.placeholder';
    const ACSU_API_KEY = Deno.env.get('ACSU_API_KEY') || 'placeholder-key';

    // TODO: Replace with actual API call when provided
    // const response = await fetch(`${ACSU_API_URL}/customer/tier?customerId=${customerId}`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${ACSU_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    // });

    // Mock response for now
    const mockTier = {
      customerId,
      currentTier: 'Gold',
      tierColor: '#FFD700',
      tierIcon: '👑',
      currentPoints: 1250,
      nextTier: 'Platinum',
      nextTierPoints: 2000,
      pointsToNextTier: 750,
      progressPercentage: 62.5,
      benefits: [
        '2x points on all services',
        'Priority booking',
        'Exclusive promotions',
        'Birthday bonus: 1000 points',
      ],
      nextTierBenefits: [
        '3x points on all services',
        'VIP support',
        'Free upgrades',
        'Special events access',
      ],
    };

    return new Response(JSON.stringify(mockTier), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in acsu-customer-tier:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});