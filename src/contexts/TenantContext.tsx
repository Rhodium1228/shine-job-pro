import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'super_admin' | 'salon_owner' | 'staff';

interface TenantContextValue {
  salonId: string | null;
  userRole: UserRole | null;
  isSuperAdmin: boolean;
  isSalonOwner: boolean;
  isStaff: boolean;
  loading: boolean;
  refreshTenantContext: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [salonId, setSalonId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenantContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSalonId(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const role = roleData?.role as UserRole || null;
      setUserRole(role);

      // Get salon_id from profile (unless super admin)
      if (role !== 'super_admin') {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('salon_id')
          .eq('id', user.id)
          .single();

        setSalonId(profileData?.salon_id || null);
      } else {
        setSalonId(null); // Super admins don't have a specific salon
      }
    } catch (error) {
      console.error('Error fetching tenant context:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantContext();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchTenantContext();
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: TenantContextValue = {
    salonId,
    userRole,
    isSuperAdmin: userRole === 'super_admin',
    isSalonOwner: userRole === 'salon_owner',
    isStaff: userRole === 'staff',
    loading,
    refreshTenantContext: fetchTenantContext,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};
