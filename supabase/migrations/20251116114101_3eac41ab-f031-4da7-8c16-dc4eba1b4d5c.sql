-- Phase 1: Convert price fields from text to numeric

-- Add new numeric price column
ALTER TABLE public.bookings ADD COLUMN price_numeric DECIMAL(10,2);
ALTER TABLE public.active_jobs ADD COLUMN price_numeric DECIMAL(10,2);

-- Migrate existing data (remove currency symbols and convert)
UPDATE public.bookings 
SET price_numeric = CAST(regexp_replace(price, '[^0-9.]', '', 'g') AS DECIMAL(10,2))
WHERE price IS NOT NULL AND price != '';

UPDATE public.active_jobs 
SET price_numeric = CAST(regexp_replace(price, '[^0-9.]', '', 'g') AS DECIMAL(10,2))
WHERE price IS NOT NULL AND price != '';

-- Drop old text column and rename new column
ALTER TABLE public.bookings DROP COLUMN price;
ALTER TABLE public.bookings RENAME COLUMN price_numeric TO price;
ALTER TABLE public.bookings ALTER COLUMN price SET NOT NULL;

ALTER TABLE public.active_jobs DROP COLUMN price;
ALTER TABLE public.active_jobs RENAME COLUMN price_numeric TO price;
ALTER TABLE public.active_jobs ALTER COLUMN price SET NOT NULL;

-- Add hourly_rate as numeric if not already
ALTER TABLE public.profiles ALTER COLUMN hourly_rate TYPE DECIMAL(10,2);

-- Add validation constraints
ALTER TABLE public.bookings ADD CONSTRAINT price_positive CHECK (price >= 0);
ALTER TABLE public.active_jobs ADD CONSTRAINT price_positive CHECK (price >= 0);
ALTER TABLE public.profiles ADD CONSTRAINT hourly_rate_positive CHECK (hourly_rate IS NULL OR hourly_rate >= 0);

-- Loyalty configuration constraints
ALTER TABLE public.loyalty_config ADD CONSTRAINT points_per_dollar_positive CHECK (points_per_dollar >= 0);
ALTER TABLE public.loyalty_config ADD CONSTRAINT redeem_rate_positive CHECK (redeem_rate > 0);
ALTER TABLE public.loyalty_config ADD CONSTRAINT minimum_redeem_positive CHECK (minimum_redeem_points >= 0);

-- Loyalty tiers validation
ALTER TABLE public.loyalty_tiers ADD CONSTRAINT tier_points_valid CHECK (
  max_points IS NULL OR max_points > min_points
);
ALTER TABLE public.loyalty_tiers ADD CONSTRAINT points_multiplier_positive CHECK (points_multiplier > 0);

-- Create index for break session lookups
CREATE INDEX idx_break_sessions_staff_status ON public.break_sessions(staff_id, status);

-- Create function to prevent concurrent breaks
CREATE OR REPLACE FUNCTION public.check_concurrent_break()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if staff already has an active break
  IF EXISTS (
    SELECT 1 FROM public.break_sessions
    WHERE staff_id = NEW.staff_id
    AND status = 'active'
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Staff member already has an active break session';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce no concurrent breaks
CREATE TRIGGER prevent_concurrent_breaks
BEFORE INSERT OR UPDATE ON public.break_sessions
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION public.check_concurrent_break();