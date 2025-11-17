import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTenantContext } from "@/contexts/TenantContext";

interface TenantRouteProps {
  children: React.ReactNode;
}

/**
 * TenantRoute - Validates that users can only access their assigned salon's routes
 * 
 * Security Rules:
 * 1. Extracts salonId from URL params
 * 2. Validates user has access to that salon via TenantContext
 * 3. Super admins bypass validation and can access any salon
 * 4. Redirects unauthorized users to branch selector
 */
const TenantRoute = ({ children }: TenantRouteProps) => {
  const navigate = useNavigate();
  const { salonId } = useParams<{ salonId: string }>();
  const { userId, role, loading: contextLoading, validateTenantAccess } = useTenantContext();
  const [validating, setValidating] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const validateAccess = async () => {
      if (contextLoading) return;

      try {
        // User not authenticated
        if (!userId) {
          navigate('/auth');
          return;
        }

        // No salonId in URL - redirect to selector
        if (!salonId) {
          navigate('/branch-selector');
          return;
        }

        // Super admin bypass - can access any salon
        if (role === "super_admin") {
          console.log(`Super admin ${userId} accessing salon ${salonId}`);
          setHasAccess(true);
          setValidating(false);
          return;
        }

        // Validate tenant access using context
        const validation = await validateTenantAccess(salonId);

        if (!validation.isValid) {
          console.warn(`User ${userId} attempted to access unauthorized salon ${salonId}`);
          navigate('/branch-selector');
          return;
        }

        // User has access
        console.log(`User ${userId} validated for salon ${salonId}`);
        setHasAccess(true);
      } catch (error) {
        console.error("Error in tenant validation:", error);
        navigate('/branch-selector');
      } finally {
        setValidating(false);
      }
    };

    validateAccess();
  }, [salonId, userId, role, contextLoading, validateTenantAccess, navigate]);

  if (contextLoading || validating) {
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
