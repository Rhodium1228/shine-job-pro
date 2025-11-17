import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TenantContext as TenantContextType, UserRole, TenantValidation } from "@/types/tenant";
import { User } from "@supabase/supabase-js";

interface TenantProviderProps {
  children: ReactNode;
}

const TenantContext = createContext<TenantContextType & { 
  validateTenantAccess: (requestedSalonId: string) => Promise<TenantValidation>;
  refreshTenantContext: () => Promise<void>;
} | undefined>(undefined);

/**
 * TenantProvider - Manages tenant context and validates access throughout the app
 * 
 * Responsibilities:
 * 1. Extract salon_id and role from user metadata/JWT
 * 2. Validate tenant access for all operations
 * 3. Provide tenant context to all child components
 * 4. Handle super admin bypass logic
 */
export const TenantProvider = ({ children }: TenantProviderProps) => {
  const [tenantContext, setTenantContext] = useState<TenantContextType>({
    userId: null,
    salonId: null,
    role: null,
    email: null,
    fullName: null,
    loading: true,
  });

  /**
   * Extract tenant context from user session
   */
  const extractTenantContext = async (user: User | null): Promise<TenantContextType> => {
    if (!user) {
      return {
        userId: null,
        salonId: null,
        role: null,
        email: null,
        fullName: null,
        loading: false,
      };
    }

    try {
      // Get user role from user_roles table
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const role = roleData?.role as UserRole | null;

      // For super admins, no need to fetch salon_id
      if (role === "super_admin") {
        return {
          userId: user.id,
          salonId: null,
          role: "super_admin",
          email: user.email || null,
          fullName: user.user_metadata?.full_name || null,
          loading: false,
        };
      }

      // Get user's default salon from profiles
      const { data: profileData } = await supabase
        .from("profiles")
        .select("default_salon_id, salon_id, full_name")
        .eq("id", user.id)
        .maybeSingle();

      const salonId = profileData?.default_salon_id || profileData?.salon_id || null;

      return {
        userId: user.id,
        salonId,
        role: role || "staff",
        email: user.email || null,
        fullName: profileData?.full_name || user.user_metadata?.full_name || null,
        loading: false,
      };
    } catch (error) {
      console.error("Error extracting tenant context:", error);
      return {
        userId: user.id,
        salonId: null,
        role: null,
        email: user.email || null,
        fullName: null,
        loading: false,
      };
    }
  };

  /**
   * Validate if user can access a specific salon
   */
  const validateTenantAccess = async (requestedSalonId: string): Promise<TenantValidation> => {
    const { userId, role, salonId } = tenantContext;

    // Not authenticated
    if (!userId) {
      return {
        isValid: false,
        salonId: null,
        canAccessSalon: () => false,
        isSuperAdmin: false,
        isAdmin: false,
      };
    }

    // Super admin bypass - can access any salon
    const isSuperAdmin = role === "super_admin";
    if (isSuperAdmin) {
      return {
        isValid: true,
        salonId: requestedSalonId,
        canAccessSalon: () => true,
        isSuperAdmin: true,
        isAdmin: true,
      };
    }

    // Check if user has access to requested salon via staff_salons
    const { data: staffSalon } = await supabase
      .from("staff_salons")
      .select("salon_id")
      .eq("staff_id", userId)
      .eq("salon_id", requestedSalonId)
      .maybeSingle();

    const hasAccess = !!staffSalon;
    const isAdmin = role === "admin" || role === "salon_owner";

    return {
      isValid: hasAccess,
      salonId: hasAccess ? requestedSalonId : salonId,
      canAccessSalon: (checkSalonId: string) => {
        return checkSalonId === requestedSalonId && hasAccess;
      },
      isSuperAdmin: false,
      isAdmin,
    };
  };

  /**
   * Refresh tenant context (useful after profile updates)
   */
  const refreshTenantContext = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const newContext = await extractTenantContext(user);
    setTenantContext(newContext);
  };

  useEffect(() => {
    // Initialize tenant context
    const initializeTenantContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const context = await extractTenantContext(user);
      setTenantContext(context);
    };

    initializeTenantContext();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const context = await extractTenantContext(session?.user || null);
        setTenantContext(context);
      } else if (event === 'SIGNED_OUT') {
        setTenantContext({
          userId: null,
          salonId: null,
          role: null,
          email: null,
          fullName: null,
          loading: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <TenantContext.Provider value={{ ...tenantContext, validateTenantAccess, refreshTenantContext }}>
      {children}
    </TenantContext.Provider>
  );
};

/**
 * Hook to access tenant context
 * @throws Error if used outside TenantProvider
 */
export const useTenantContext = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenantContext must be used within a TenantProvider");
  }
  return context;
};

/**
 * Hook to check if current user is super admin
 */
export const useIsSuperAdmin = () => {
  const { role, loading } = useTenantContext();
  return { isSuperAdmin: role === "super_admin", loading };
};

/**
 * Hook to check if current user is admin (salon_owner or admin)
 */
export const useIsAdmin = () => {
  const { role, loading } = useTenantContext();
  const isAdmin = role === "admin" || role === "salon_owner" || role === "super_admin";
  return { isAdmin, loading };
};
