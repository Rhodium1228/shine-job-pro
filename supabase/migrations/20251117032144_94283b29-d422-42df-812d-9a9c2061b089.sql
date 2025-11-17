-- =====================================================================
-- MULTI-TENANT SAAS TRANSFORMATION
-- Phase 1D: Tenant-Isolated RLS Policies (Safe)
-- =====================================================================

-- Drop all existing policies first
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'salons') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON salons';
    END LOOP;
    
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
    
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'bookings') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON bookings';
    END LOOP;
    
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'active_jobs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON active_jobs';
    END LOOP;
END $$;

-- ========== SALONS TABLE ==========
CREATE POLICY "Super admins can view all salons"
ON salons FOR SELECT TO authenticated
USING (is_super_admin());

CREATE POLICY "Super admins can insert salons"
ON salons FOR INSERT TO authenticated
WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update salons"
ON salons FOR UPDATE TO authenticated
USING (is_super_admin());

CREATE POLICY "Super admins can delete salons"
ON salons FOR DELETE TO authenticated
USING (is_super_admin());

CREATE POLICY "Salon owners can view their salon"
ON salons FOR SELECT TO authenticated
USING (owner_user_id = auth.uid());

CREATE POLICY "Salon owners can update their salon"
ON salons FOR UPDATE TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Staff can view their salon"
ON salons FOR SELECT TO authenticated
USING (id = get_user_salon_id());

-- ========== PROFILES TABLE ==========
CREATE POLICY "Super admins can view all profiles"
ON profiles FOR SELECT TO authenticated
USING (is_super_admin());

CREATE POLICY "Super admins can manage all profiles"
ON profiles FOR ALL TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Salon owners can view their salon staff"
ON profiles FOR SELECT TO authenticated
USING (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()));

CREATE POLICY "Salon owners can update their salon staff"
ON profiles FOR UPDATE TO authenticated
USING (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()));

CREATE POLICY "Staff can view salon colleagues"
ON profiles FOR SELECT TO authenticated
USING (salon_id = get_user_salon_id());

-- ========== BOOKINGS TABLE ==========
CREATE POLICY "Super admins can view all bookings"
ON bookings FOR SELECT TO authenticated
USING (is_super_admin());

CREATE POLICY "Super admins can manage all bookings"
ON bookings FOR ALL TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Salon owners can manage their salon bookings"
ON bookings FOR ALL TO authenticated
USING (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()))
WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()));

CREATE POLICY "Staff can view their salon bookings"
ON bookings FOR SELECT TO authenticated
USING (salon_id = get_user_salon_id());

CREATE POLICY "Staff can manage their own bookings"
ON bookings FOR ALL TO authenticated
USING (staff_id = auth.uid() AND salon_id = get_user_salon_id())
WITH CHECK (staff_id = auth.uid() AND salon_id = get_user_salon_id());

-- ========== ACTIVE JOBS TABLE ==========
CREATE POLICY "Super admins can view all jobs"
ON active_jobs FOR SELECT TO authenticated
USING (is_super_admin());

CREATE POLICY "Super admins can manage all jobs"
ON active_jobs FOR ALL TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Staff can view their salon jobs"
ON active_jobs FOR SELECT TO authenticated
USING (salon_id = get_user_salon_id());

CREATE POLICY "Staff can manage their own salon jobs"
ON active_jobs FOR ALL TO authenticated
USING (staff_id = auth.uid() AND salon_id = get_user_salon_id())
WITH CHECK (staff_id = auth.uid() AND salon_id = get_user_salon_id());