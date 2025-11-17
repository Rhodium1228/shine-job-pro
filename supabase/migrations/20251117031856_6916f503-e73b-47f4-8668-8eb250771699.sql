-- =====================================================================
-- MULTI-TENANT SAAS TRANSFORMATION  
-- Phase 1C: Helper Functions & RLS Policies
-- =====================================================================

-- 1. Create tenant context function
CREATE OR REPLACE FUNCTION public.get_user_salon_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT salon_id FROM public.profiles WHERE id = auth.uid()
$$;

-- 2. Create super admin check function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(auth.uid(), 'super_admin'::app_role)
$$;

-- 3. Create salon owner check function
CREATE OR REPLACE FUNCTION public.is_salon_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(auth.uid(), 'salon_owner'::app_role)
$$;

-- 4. Auto-set salon_id trigger function
CREATE OR REPLACE FUNCTION public.set_salon_id_from_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.salon_id IS NULL THEN
    NEW.salon_id := get_user_salon_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Apply triggers to tables
DROP TRIGGER IF EXISTS set_salon_id_bookings ON bookings;
CREATE TRIGGER set_salon_id_bookings
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_salon_id_from_user();

DROP TRIGGER IF EXISTS set_salon_id_active_jobs ON active_jobs;
CREATE TRIGGER set_salon_id_active_jobs
  BEFORE INSERT ON active_jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_salon_id_from_user();

-- 5. Create audit log table
CREATE TABLE IF NOT EXISTS platform_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id),
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_salon_created ON platform_audit_log(salon_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_created ON platform_audit_log(user_id, created_at DESC);

ALTER TABLE platform_audit_log ENABLE ROW LEVEL SECURITY;