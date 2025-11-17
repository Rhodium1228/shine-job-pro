-- =====================================================================
-- MULTI-TENANT SAAS TRANSFORMATION
-- Phase 1E: Complete Remaining RLS Policies
-- =====================================================================

-- ========== STAFF SALONS TABLE ==========
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'staff_salons') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON staff_salons';
    END LOOP;
END $$;

CREATE POLICY "Super admins can manage all staff-salon assignments"
ON staff_salons FOR ALL TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Salon owners can manage their salon staff assignments"
ON staff_salons FOR ALL TO authenticated
USING (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()))
WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()));

CREATE POLICY "Staff can view their own salon assignments"
ON staff_salons FOR SELECT TO authenticated
USING (staff_id = auth.uid());

-- ========== USER ROLES TABLE ==========
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_roles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON user_roles';
    END LOOP;
END $$;

CREATE POLICY "Super admins can manage all roles"
ON user_roles FOR ALL TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ========== LOYALTY CONFIG TABLE ==========
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'loyalty_config') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON loyalty_config';
    END LOOP;
END $$;

CREATE POLICY "Super admins can manage all loyalty configs"
ON loyalty_config FOR ALL TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Salon owners can manage their salon loyalty config"
ON loyalty_config FOR ALL TO authenticated
USING (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()))
WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()));

CREATE POLICY "Staff can view their salon loyalty config"
ON loyalty_config FOR SELECT TO authenticated
USING (salon_id = get_user_salon_id());

-- ========== LOYALTY TIERS TABLE ==========
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'loyalty_tiers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON loyalty_tiers';
    END LOOP;
END $$;

CREATE POLICY "Super admins can manage all loyalty tiers"
ON loyalty_tiers FOR ALL TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Salon owners can manage their salon loyalty tiers"
ON loyalty_tiers FOR ALL TO authenticated
USING (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()))
WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()));

CREATE POLICY "Staff can view their salon loyalty tiers"
ON loyalty_tiers FOR SELECT TO authenticated
USING (salon_id = get_user_salon_id());

-- ========== LOYALTY TRANSACTIONS TABLE ==========
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'loyalty_transactions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON loyalty_transactions';
    END LOOP;
END $$;

CREATE POLICY "Super admins can view all loyalty transactions"
ON loyalty_transactions FOR SELECT TO authenticated
USING (is_super_admin());

CREATE POLICY "Super admins can insert loyalty transactions"
ON loyalty_transactions FOR INSERT TO authenticated
WITH CHECK (is_super_admin());

CREATE POLICY "Salon owners can view their salon transactions"
ON loyalty_transactions FOR SELECT TO authenticated
USING (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()));

CREATE POLICY "Staff can view transactions for their salon"
ON loyalty_transactions FOR SELECT TO authenticated
USING (salon_id = get_user_salon_id());

-- ========== LOYALTY PROMOTIONS TABLE ==========
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'loyalty_promotions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON loyalty_promotions';
    END LOOP;
END $$;

CREATE POLICY "Super admins can manage all loyalty promotions"
ON loyalty_promotions FOR ALL TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Salon owners can manage their salon promotions"
ON loyalty_promotions FOR ALL TO authenticated
USING (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()))
WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()));

CREATE POLICY "Staff can view promotions for their salon"
ON loyalty_promotions FOR SELECT TO authenticated
USING (salon_id = get_user_salon_id());

-- ========== PLATFORM AUDIT LOG TABLE ==========
CREATE POLICY "Super admins can view all audit logs"
ON platform_audit_log FOR SELECT TO authenticated
USING (is_super_admin());

CREATE POLICY "Super admins can insert audit logs"
ON platform_audit_log FOR INSERT TO authenticated
WITH CHECK (is_super_admin());

CREATE POLICY "Salon owners can view their salon audit logs"
ON platform_audit_log FOR SELECT TO authenticated
USING (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()));

-- ========== CUSTOMER REVIEWS TABLE ==========
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'customer_reviews') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON customer_reviews';
    END LOOP;
END $$;

CREATE POLICY "Super admins can manage all reviews"
ON customer_reviews FOR ALL TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Salon owners can manage their salon reviews"
ON customer_reviews FOR ALL TO authenticated
USING (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()))
WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()));

CREATE POLICY "Staff can view reviews for their salon"
ON customer_reviews FOR SELECT TO authenticated
USING (salon_id = get_user_salon_id());

-- ========== FEEDBACK SURVEYS TABLE ==========
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'feedback_surveys') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON feedback_surveys';
    END LOOP;
END $$;

CREATE POLICY "Super admins can view all surveys"
ON feedback_surveys FOR SELECT TO authenticated
USING (is_super_admin());

CREATE POLICY "Salon owners can view their salon surveys"
ON feedback_surveys FOR SELECT TO authenticated
USING (salon_id IN (SELECT id FROM salons WHERE owner_user_id = auth.uid()));

CREATE POLICY "Staff can view surveys for their salon"
ON feedback_surveys FOR SELECT TO authenticated
USING (salon_id = get_user_salon_id());