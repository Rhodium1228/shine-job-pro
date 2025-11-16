import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { verifyAuth, requireAdmin, corsHeaders } from '../_shared/auth-middleware.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication and require admin role
    const authHeader = req.headers.get('Authorization');
    const context = await verifyAuth(authHeader);
    requireAdmin(context); // Only admins can create staff

    // Validate input
    const staffCreateSchema = z.object({
      email: z.string().email('Invalid email format').max(255, 'Email cannot exceed 255 characters'),
      fullName: z.string().trim().min(1, 'Full name is required').max(100, 'Full name cannot exceed 100 characters'),
      phone: z.string().trim().max(20, 'Phone cannot exceed 20 characters').optional(),
      branchId: z.string().uuid('Invalid branch ID format'),
      assignedRole: z.enum(['admin', 'staff'], { errorMap: () => ({ message: 'Role must be admin or staff' }) }),
      hourlyRate: z.number().positive('Hourly rate must be positive').max(1000, 'Hourly rate cannot exceed 1000').optional(),
      specialties: z.array(z.string().max(50, 'Specialty cannot exceed 50 characters')).max(10, 'Cannot have more than 10 specialties').optional()
    });

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validationResult = staffCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationResult.error.issues.map(i => i.message)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, fullName, phone, branchId, assignedRole, hourlyRate, specialties } = validationResult.data;

    console.log(`Admin ${context.email} creating staff member: ${email}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error('Error creating user account:', authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    const userId = authData.user.id;

    // Update profile with additional details
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone || null,
        hourly_rate: hourlyRate || null,
        specialties: specialties || null,
        default_branch_id: branchId,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Continue anyway, profile might be created by trigger
    }

    // Assign role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: assignedRole,
      });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    // Assign to branch
    const { error: branchError } = await supabase
      .from('staff_branches')
      .insert({
        staff_id: userId,
        branch_id: branchId,
        is_default: true,
      });

    if (branchError) {
      console.error('Error assigning branch:', branchError);
      throw new Error(`Failed to assign branch: ${branchError.message}`);
    }

    // Fetch complete staff data
    const { data: staffData, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles!inner(role),
        staff_branches(branch_id, is_default)
      `)
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching staff data:', fetchError);
    }

    console.log(`Successfully created staff member: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        staff: staffData || { id: userId, email, full_name: fullName },
        message: 'Staff member created successfully',
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in staff creation:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to create staff member';
    const status = errorMessage === 'Admin access required' ? 403 :
                   errorMessage?.includes('authorization') ? 401 : 500;

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: status === 500 ? 'Internal server error' : undefined,
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
