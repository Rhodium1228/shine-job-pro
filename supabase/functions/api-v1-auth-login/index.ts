import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { corsHeaders, checkRateLimit } from '../_shared/auth-middleware.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit: 5 login attempts per 5 minutes per email
    try {
      checkRateLimit(email.toLowerCase(), 5, 5 * 60 * 1000);
    } catch (rateLimitError) {
      console.log('Rate limit exceeded for:', email);
      return new Response(
        JSON.stringify({ error: 'Too many login attempts. Please try again in 5 minutes.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Attempt login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      console.error('Login error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    // Get user branches
    const { data: branchData } = await supabase
      .from('staff_branches')
      .select('branch_id, is_default')
      .eq('staff_id', authData.user.id);

    const branchIds = branchData?.map(b => b.branch_id) || [];
    const defaultBranch = branchData?.find(b => b.is_default)?.branch_id || branchIds[0];

    console.log('Login successful:', { userId: authData.user.id, email, role: roleData?.role });

    return new Response(
      JSON.stringify({
        token: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresIn: authData.session.expires_in,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          fullName: authData.user.user_metadata?.full_name,
        },
        role: roleData?.role || null,
        branchIds,
        defaultBranch,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in login function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
