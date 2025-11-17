-- =====================================================================
-- MULTI-TENANT SAAS TRANSFORMATION
-- Phase 1D: Tenant-Isolated RLS Policies
-- =====================================================================

-- ========== SALONS TABLE ==========
DROP POLICY IF EXISTS "Admins can manage all branches" ON salons;
DROP POLICY IF EXISTS "Staff can view branches they belong to" ON salons;

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
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

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
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update any booking" ON bookings;
DROP POLICY IF EXISTS "Admins can delete any booking" ON bookings;
DROP POLICY IF EXISTS "Admins can insert any booking" ON bookings;

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
DROP POLICY IF EXISTS "Staff can view all active/paused jobs" ON active_jobs;
DROP POLICY IF EXISTS "Staff can insert their own jobs" ON active_jobs;
DROP POLICY IF EXISTS "Staff can update their own jobs" ON active_jobs;
DROP POLICY IF EXISTS "Staff can delete their own jobs" ON active_jobs;

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