import { Database } from "@/integrations/supabase/types";

/**
 * Multi-Tenant Type Definitions
 * 
 * These types define the structure for tenant-aware authentication and access control
 */

/**
 * User roles in the multi-tenant system (using database enum)
 */
export type UserRole = Database["public"]["Enums"]["app_role"];

/**
 * Auth metadata stored in JWT tokens
 */
export interface AuthMetadata {
  role?: UserRole;
  salon_id?: string;
  full_name?: string;
  email?: string;
}

/**
 * Tenant context for the current user session
 */
export interface TenantContext {
  userId: string | null;
  salonId: string | null;
  role: UserRole | null;
  email: string | null;
  fullName: string | null;
  loading: boolean;
}

/**
 * Tenant validation result
 */
export interface TenantValidation {
  isValid: boolean;
  salonId: string | null;
  canAccessSalon: (salonId: string) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

/**
 * Branch/Salon information
 */
export interface Salon {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  color_theme: string | null;
  opening_hours: any;
  is_active: boolean | null;
  owner_user_id: string | null;
}
