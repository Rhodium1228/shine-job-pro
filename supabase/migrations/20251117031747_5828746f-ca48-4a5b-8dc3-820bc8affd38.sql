-- =====================================================================
-- MULTI-TENANT SAAS TRANSFORMATION
-- Phase 1B: Schema Transformation
-- =====================================================================

-- 1. Rename branches table to salons (our tenant entity)
ALTER TABLE branches RENAME TO salons;

-- 2. Add owner_user_id to salons table
ALTER TABLE salons ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id);

-- 3. Rename branch_id to salon_id across all tables

-- Update bookings
ALTER TABLE bookings RENAME COLUMN branch_id TO salon_id;
ALTER TABLE bookings ALTER COLUMN salon_id SET NOT NULL;

-- Update active_jobs  
ALTER TABLE active_jobs RENAME COLUMN branch_id TO salon_id;
ALTER TABLE active_jobs ALTER COLUMN salon_id SET NOT NULL;

-- Update customer_reviews
ALTER TABLE customer_reviews RENAME COLUMN branch_id TO salon_id;

-- Update feedback_surveys
ALTER TABLE feedback_surveys RENAME COLUMN branch_id TO salon_id;

-- Update loyalty_config
ALTER TABLE loyalty_config RENAME COLUMN branch_id TO salon_id;
ALTER TABLE loyalty_config ALTER COLUMN salon_id SET NOT NULL;
ALTER TABLE loyalty_config DROP CONSTRAINT IF EXISTS loyalty_config_branch_id_key;
ALTER TABLE loyalty_config ADD CONSTRAINT loyalty_config_salon_id_key UNIQUE (salon_id);

-- Update loyalty_promotions
ALTER TABLE loyalty_promotions RENAME COLUMN branch_id TO salon_id;

-- Update loyalty_tiers
ALTER TABLE loyalty_tiers RENAME COLUMN branch_id TO salon_id;

-- Update loyalty_transactions
ALTER TABLE loyalty_transactions RENAME COLUMN branch_id TO salon_id;

-- Update staff_branches to staff_salons
ALTER TABLE staff_branches RENAME TO staff_salons;
ALTER TABLE staff_salons RENAME COLUMN branch_id TO salon_id;

-- Update staff_invitations
ALTER TABLE staff_invitations RENAME COLUMN branch_id TO salon_id;

-- Update profiles
ALTER TABLE profiles RENAME COLUMN default_branch_id TO default_salon_id;

-- 4. Add salon_id to profiles for tenant assignment
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salon_id uuid REFERENCES salons(id);

-- 5. Create composite indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_salon_created ON bookings(salon_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_salon_staff ON bookings(salon_id, staff_id);
CREATE INDEX IF NOT EXISTS idx_active_jobs_salon_staff ON active_jobs(salon_id, staff_id);
CREATE INDEX IF NOT EXISTS idx_profiles_salon ON profiles(salon_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_salon ON loyalty_transactions(salon_id, created_at DESC);