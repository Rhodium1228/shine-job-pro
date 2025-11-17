import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'super_admin' | 'salon_owner' | 'staff' | 'admin';

export const useUserRole = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSalonOwner, setIsSalonOwner] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsSalonOwner(false);
          setRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking role:", error);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsSalonOwner(false);
          setRole(null);
        } else {
          const userRole = data?.role as UserRole || null;
          setRole(userRole);
          setIsAdmin(userRole === 'admin' || userRole === 'super_admin' || userRole === 'salon_owner');
          setIsSuperAdmin(userRole === 'super_admin');
          setIsSalonOwner(userRole === 'salon_owner');
        }
      } catch (error) {
        console.error("Error in checkRole:", error);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsSalonOwner(false);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, []);

  return { isAdmin, isSuperAdmin, isSalonOwner, role, loading };
};
