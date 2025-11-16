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
    requireAdmin(context); // Only admins can update staff

    const { 
      staffId, 
      fullName, 
      phone, 
      hourlyRate, 
      specialties, 
      defaultBranchId,
      isSuspended,
      role,
    } = await req.json();

    if (!staffId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: staffId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${context.email} updating staff member: ${staffId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build update object with only provided fields
    const profileUpdates: any = {};
    if (fullName !== undefined) profileUpdates.full_name = fullName;
    if (phone !== undefined) profileUpdates.phone = phone;
    if (hourlyRate !== undefined) profileUpdates.hourly_rate = hourlyRate;
    if (specialties !== undefined) profileUpdates.specialties = specialties;
    if (defaultBranchId !== undefined) profileUpdates.default_branch_id = defaultBranchId;
    if (isSuspended !== undefined) profileUpdates.is_suspended = isSuspended;

    // Update profile if there are changes
    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', staffId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }
    }

    // Update role if provided
    if (role !== undefined) {
      // Delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', staffId);

      // Insert new role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: staffId,
          role: role,
        });

      if (roleError) {
        console.error('Error updating role:', roleError);
        throw new Error(`Failed to update role: ${roleError.message}`);
      }
    }

    // Fetch updated staff data
    const { data: staffData, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles(role),
        staff_branches(branch_id, is_default)
      `)
      .eq('id', staffId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated staff data:', fetchError);
    }

    console.log(`Successfully updated staff member: ${staffId}`);

    return new Response(
      JSON.stringify({
        success: true,
        staff: staffData,
        message: 'Staff member updated successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in staff update:', error);

    const status = error.message === 'Admin access required' ? 403 :
                   error.message?.includes('authorization') ? 401 : 500;

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to update staff member',
        details: status === 500 ? 'Internal server error' : undefined,
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
