import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

export interface AuthContext {
  userId: string;
  email: string;
  role: 'admin' | 'staff' | null;
  branchIds: string[];
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Verify JWT token and extract user context
 * Returns AuthContext with user details and permissions
 */
export async function verifyAuth(authHeader: string | null): Promise<AuthContext> {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verify the JWT token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    throw new Error('Invalid or expired token');
  }

  // Get user role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  // Get user branches
  const { data: branchData } = await supabase
    .from('staff_branches')
    .select('branch_id')
    .eq('staff_id', user.id);

  return {
    userId: user.id,
    email: user.email!,
    role: roleData?.role || null,
    branchIds: branchData?.map(b => b.branch_id) || [],
  };
}

/**
 * Check if user has admin role
 */
export function requireAdmin(context: AuthContext) {
  if (context.role !== 'admin') {
    throw new Error('Admin access required');
  }
}

/**
 * Check if user has access to specific branch
 */
export function requireBranchAccess(context: AuthContext, branchId: string) {
  if (context.role === 'admin') return; // Admins have access to all branches
  
  if (!context.branchIds.includes(branchId)) {
    throw new Error('Access denied to this branch');
  }
}

/**
 * Filter query by branch access
 * Returns branch IDs the user can access based on query params and permissions
 */
export function filterByBranchAccess(
  context: AuthContext,
  requestedBranchId?: string
): string[] {
  if (context.role === 'admin') {
    return requestedBranchId ? [requestedBranchId] : [];
  }
  
  if (requestedBranchId) {
    if (!context.branchIds.includes(requestedBranchId)) {
      throw new Error('Access denied to this branch');
    }
    return [requestedBranchId];
  }
  
  return context.branchIds;
}
