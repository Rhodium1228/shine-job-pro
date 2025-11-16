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
    
    console.log('ACSU Wallet Balance:', { customerId });

    // Placeholder API call - replace with actual ACSU API
    const ACSU_API_URL = Deno.env.get('ACSU_API_URL') || 'https://api.acsu.placeholder';
    const ACSU_API_KEY = Deno.env.get('ACSU_API_KEY') || 'placeholder-key';

    // TODO: Replace with actual API call when provided
    // const response = await fetch(`${ACSU_API_URL}/wallet/balance?customerId=${customerId}`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${ACSU_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    // });

    // Mock response for now
    const mockBalance = {
      customerId,
      balance: 1250,
      lifetimePoints: 5430,
      pointsExpiring: 150,
      expiryDate: '2025-12-31',
      recentTransactions: [
        { date: '2025-01-10', type: 'earned', points: 100, description: 'Service completed' },
        { date: '2025-01-05', type: 'redeemed', points: -50, description: 'Discount applied' },
        { date: '2025-01-01', type: 'earned', points: 200, description: 'Bonus points' },
      ],
    };

    return new Response(JSON.stringify(mockBalance), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in acsu-wallet-balance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});