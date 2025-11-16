import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { verifyAuth, requireAdmin, corsHeaders } from '../_shared/auth-middleware.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication and require admin role
    const authHeader = req.headers.get('Authorization');
    const context = await verifyAuth(authHeader);
    requireAdmin(context); // Only admins can delete staff

    const url = new URL(req.url);
    const staffId = url.searchParams.get('staffId');

    if (!staffId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: staffId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent admin from deleting themselves
    if (staffId === context.userId) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${context.email} deleting staff member: ${staffId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete user (cascade will handle related records)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(staffId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      throw new Error(`Failed to delete staff: ${deleteError.message}`);
    }

    console.log(`Successfully deleted staff member: ${staffId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Staff member deleted successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in staff deletion:', error);

    const status = error.message === 'Admin access required' ? 403 :
                   error.message?.includes('authorization') ? 401 : 500;

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to delete staff member',
        details: status === 500 ? 'Internal server error' : undefined,
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
