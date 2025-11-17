-- =====================================================================
-- MULTI-TENANT SAAS TRANSFORMATION
-- Phase 1A: Add Enum Values First
-- =====================================================================

-- Add new roles to app_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'super_admin' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'super_admin';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'salon_owner' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'salon_owner';
  END IF;
END $$;