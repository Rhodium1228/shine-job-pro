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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get staff profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        avatar_url,
        bio,
        specialties,
        hourly_rate,
        rating,
        total_reviews,
        availability_status,
        working_hours,
        default_branch_id
      `)
      .eq('id', context.userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get branches
    const { data: branches } = await supabase
      .from('staff_branches')
      .select('branch_id, is_default, branches(id, name, address, phone, logo_url)')
      .eq('staff_id', context.userId);

    console.log('Profile fetched:', { userId: context.userId });

    return new Response(
      JSON.stringify({
        profile: {
          ...profile,
          role: context.role,
        },
        branches: branches?.map(b => ({
          id: b.branch_id,
          isDefault: b.is_default,
          ...b.branches,
        })) || [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in staff profile:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: error instanceof Error && error.message.includes('Invalid') ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
