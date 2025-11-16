import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { verifyAuth, corsHeaders } from '../_shared/auth-middleware.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const context = await verifyAuth(authHeader);

    const { customerId, points, reason, branchId } = await req.json();

    if (!customerId || !points || points <= 0) {
      return new Response(
        JSON.stringify({ error: 'Customer ID and valid points amount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call ACSU API to award points
    const acsuResponse = await supabase.functions.invoke('acsu-points-award', {
      body: {
        customerId,
        points,
        reason: reason || 'Points awarded by staff',
        staffId: context.userId,
      },
    });

    if (acsuResponse.error) {
      console.error('ACSU award error:', acsuResponse.error);
      return new Response(
        JSON.stringify({ error: 'Failed to award points' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log transaction in loyalty_transactions table
    const { data: existingTransactions } = await supabase
      .from('loyalty_transactions')
      .select('balance_after')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1);

    const previousBalance = existingTransactions?.[0]?.balance_after || 0;

    await supabase
      .from('loyalty_transactions')
      .insert({
        customer_id: customerId,
        staff_id: context.userId,
        branch_id: branchId || null,
        transaction_type: 'earned',
        points_amount: points,
        balance_after: previousBalance + points,
        description: reason || 'Points awarded by staff',
        metadata: acsuResponse.data,
      });

    console.log('Points awarded:', { customerId, points, userId: context.userId });

    return new Response(
      JSON.stringify({
        success: true,
        transaction: acsuResponse.data,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ACSU award:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: error instanceof Error && error.message.includes('Invalid') ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
