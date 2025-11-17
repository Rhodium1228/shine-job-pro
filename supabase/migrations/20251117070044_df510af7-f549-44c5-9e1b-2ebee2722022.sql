-- Migration: Add tenant context sync triggers
-- Purpose: Automatically sync salon_id to user metadata for JWT access

-- Function to sync salon_id to auth.users metadata when profile is updated
CREATE OR REPLACE FUNCTION public.sync_user_salon_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  salon_uuid uuid;
  user_role text;
BEGIN
  -- Get the salon_id (prefer default_salon_id, fallback to salon_id)
  salon_uuid := COALESCE(NEW.default_salon_id, NEW.salon_id);
  
  -- Get user's primary role
  SELECT role::text INTO user_role
  FROM public.user_roles
  WHERE user_id = NEW.id
  ORDER BY 
    CASE role::text
      WHEN 'super_admin' THEN 1
      WHEN 'salon_owner' THEN 2
      WHEN 'admin' THEN 3
      WHEN 'staff' THEN 4
    END
  LIMIT 1;
  
  -- Update auth.users metadata with salon_id and role
  -- This makes them available in JWT tokens
  UPDATE auth.users
  SET raw_user_meta_data = 
    raw_user_meta_data 
    || jsonb_build_object(
      'salon_id', salon_uuid::text,
      'role', COALESCE(user_role, 'staff'),
      'full_name', NEW.full_name
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger on profiles table to sync metadata
DROP TRIGGER IF EXISTS sync_salon_metadata_on_profile_update ON public.profiles;
CREATE TRIGGER sync_salon_metadata_on_profile_update
  AFTER INSERT OR UPDATE OF salon_id, default_salon_id, full_name
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_salon_metadata();

-- Function to sync role changes to auth metadata
CREATE OR REPLACE FUNCTION public.sync_user_role_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update auth.users metadata with new role
  UPDATE auth.users
  SET raw_user_meta_data = 
    raw_user_meta_data || jsonb_build_object('role', NEW.role::text)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger on user_roles table to sync role metadata
DROP TRIGGER IF EXISTS sync_role_metadata_on_role_change ON public.user_roles;
CREATE TRIGGER sync_role_metadata_on_role_change
  AFTER INSERT OR UPDATE OF role
  ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_metadata();

-- Function to sync staff_salons changes to profile and metadata
CREATE OR REPLACE FUNCTION public.sync_staff_salon_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is marked as default salon, update profile
  IF NEW.is_default = true THEN
    UPDATE public.profiles
    SET default_salon_id = NEW.salon_id
    WHERE id = NEW.staff_id;
  END IF;
  
  -- If user has no default salon set, set this as default
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = NEW.staff_id
    AND default_salon_id IS NOT NULL
  ) THEN
    UPDATE public.profiles
    SET default_salon_id = NEW.salon_id
    WHERE id = NEW.staff_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on staff_salons to update profile when salon is assigned
DROP TRIGGER IF EXISTS sync_profile_on_salon_assignment ON public.staff_salons;
CREATE TRIGGER sync_profile_on_salon_assignment
  AFTER INSERT OR UPDATE OF is_default
  ON public.staff_salons
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_staff_salon_assignment();

-- Add helpful comment
COMMENT ON FUNCTION public.sync_user_salon_metadata IS 
  'Syncs salon_id and role from profiles to auth.users metadata for JWT access';
COMMENT ON FUNCTION public.sync_user_role_metadata IS 
  'Syncs role changes from user_roles to auth.users metadata for JWT access';
COMMENT ON FUNCTION public.sync_staff_salon_assignment IS 
  'Updates profile default_salon_id when staff is assigned to a salon';
