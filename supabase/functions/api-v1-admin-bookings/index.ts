import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Query params validation schema
const QueryParamsSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
  branchId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  service: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['booking_time', 'created_at', 'price', 'status']).default('booking_time'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Admin Bookings API] Request received:', req.method);

    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[Admin Bookings API] No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[Admin Bookings API] Authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      console.error('[Admin Bookings API] User is not an admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate query parameters
    const url = new URL(req.url);
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const validationResult = QueryParamsSchema.safeParse(queryParams);
    if (!validationResult.success) {
      console.error('[Admin Bookings API] Validation failed:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid query parameters', 
          details: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const params = validationResult.data;
    console.log('[Admin Bookings API] Validated params:', params);

    // Build query with filters
    let query = supabase
      .from('bookings')
      .select(`
        *,
        profiles:staff_id (
          id,
          full_name,
          email,
          phone,
          avatar_url
        ),
        branches:branch_id (
          id,
          name,
          address
        )
      `, { count: 'exact' });

    // Apply filters
    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.branchId) {
      query = query.eq('branch_id', params.branchId);
    }

    if (params.staffId) {
      query = query.eq('staff_id', params.staffId);
    }

    if (params.service) {
      query = query.ilike('service', `%${params.service}%`);
    }

    if (params.dateFrom) {
      query = query.gte('booking_time', params.dateFrom);
    }

    if (params.dateTo) {
      query = query.lte('booking_time', params.dateTo);
    }

    // Apply sorting
    query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' });

    // Apply pagination
    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;
    query = query.range(from, to);

    // Execute query
    const { data: bookings, error: bookingsError, count } = await query;

    if (bookingsError) {
      console.error('[Admin Bookings API] Database error:', bookingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch bookings', details: bookingsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / params.limit) : 0;
    const hasNextPage = params.page < totalPages;
    const hasPreviousPage = params.page > 1;

    console.log(`[Admin Bookings API] Success: ${bookings?.length || 0} bookings, total: ${count}`);

    return new Response(
      JSON.stringify({
        data: bookings || [],
        pagination: {
          page: params.page,
          limit: params.limit,
          totalCount: count || 0,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
        filters: {
          status: params.status,
          branchId: params.branchId,
          staffId: params.staffId,
          service: params.service,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
        },
        sorting: {
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        },
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[Admin Bookings API] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
