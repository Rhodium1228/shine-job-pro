import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

interface TenantRouteProps {
  children: React.ReactNode;
}

/**
 * TenantRoute - Validates that users can only access their assigned salon's routes
 * 
 * Security Rules:
 * 1. Extracts salonId from URL params
 * 2. Validates user has access to that salon via staff_salons table
 * 3. Super admins bypass validation and can access any salon
 * 4. Redirects unauthorized users to branch selector
 */
const TenantRoute = ({ children }: TenantRouteProps) => {
  const navigate = useNavigate();
  const { salonId } = useParams<{ salonId: string }>();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [validating, setValidating] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const validateTenantAccess = async () => {
      if (roleLoading) return;

      try {
        // Super admin bypass - can access any salon
        if (isAdmin) {
          setHasAccess(true);
          setValidating(false);
          return;
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        // No salonId in URL - redirect to selector
        if (!salonId) {
          navigate('/branch-selector');
          return;
        }

        // Check if user has access to this salon
        const { data: staffSalon, error } = await supabase
          .from("staff_salons")
          .select("salon_id")
          .eq("staff_id", user.id)
          .eq("salon_id", salonId)
          .maybeSingle();

        if (error) {
          console.error("Error validating tenant access:", error);
          navigate('/branch-selector');
          return;
        }

        if (!staffSalon) {
          console.warn(`User ${user.id} attempted to access unauthorized salon ${salonId}`);
          navigate('/branch-selector');
          return;
        }

        // User has access
        setHasAccess(true);
      } catch (error) {
        console.error("Error in tenant validation:", error);
        navigate('/branch-selector');
      } finally {
        setValidating(false);
      }
    };

    validateTenantAccess();
  }, [salonId, isAdmin, roleLoading, navigate]);

  if (roleLoading || validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Validating access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
};

export default TenantRoute;
