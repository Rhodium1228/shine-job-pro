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
    const { customerId, staffId, bookingId } = await req.json();
    
    console.log('ACSU Link Customer:', { customerId, staffId, bookingId });

    // Placeholder API call - replace with actual ACSU API
    const ACSU_API_URL = Deno.env.get('ACSU_API_URL') || 'https://api.acsu.placeholder';
    const ACSU_API_KEY = Deno.env.get('ACSU_API_KEY') || 'placeholder-key';

    // TODO: Replace with actual API call when provided
    // const response = await fetch(`${ACSU_API_URL}/linkCustomer`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${ACSU_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ customerId, staffId, bookingId }),
    // });

    // Mock response for now
    const mockResponse = {
      success: true,
      linkId: 'link_' + Math.random().toString(36).substr(2, 9),
      customerId,
      staffId,
      bookingId,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(mockResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in acsu-link-customer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});