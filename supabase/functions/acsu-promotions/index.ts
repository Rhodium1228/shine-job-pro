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
    
    console.log('ACSU Active Promotions:', { customerId });

    // Placeholder API call - replace with actual ACSU API
    const ACSU_API_URL = Deno.env.get('ACSU_API_URL') || 'https://api.acsu.placeholder';
    const ACSU_API_KEY = Deno.env.get('ACSU_API_KEY') || 'placeholder-key';

    // TODO: Replace with actual API call when provided
    // const response = await fetch(`${ACSU_API_URL}/promotions/active?customerId=${customerId}`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${ACSU_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    // });

    // Mock response for now
    const mockPromotions = [
      {
        id: 'promo_1',
        title: 'Double Points Weekend',
        description: 'Earn 2x points on all services this weekend!',
        type: 'multiplier',
        value: 2,
        validUntil: '2025-01-20',
        image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400',
      },
      {
        id: 'promo_2',
        title: '500 Bonus Points',
        description: 'Complete 3 services this month for bonus points',
        type: 'bonus',
        value: 500,
        progress: { current: 1, target: 3 },
        validUntil: '2025-01-31',
        image: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=400',
      },
      {
        id: 'promo_3',
        title: 'Birthday Special',
        description: 'Get 1000 points on your birthday month!',
        type: 'special',
        value: 1000,
        validUntil: '2025-01-31',
        image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400',
      },
    ];

    return new Response(JSON.stringify(mockPromotions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in acsu-promotions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});