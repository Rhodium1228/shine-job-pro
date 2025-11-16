-- Create loyalty configuration table
CREATE TABLE public.loyalty_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  points_per_dollar numeric NOT NULL DEFAULT 1.00,
  redeem_rate numeric NOT NULL DEFAULT 0.01,
  minimum_redeem_points integer NOT NULL DEFAULT 100,
  points_expiry_days integer,
  welcome_bonus_points integer DEFAULT 0,
  referral_bonus_points integer DEFAULT 0,
  birthday_bonus_points integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(branch_id)
);

-- Create loyalty tiers table
CREATE TABLE public.loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  min_points integer NOT NULL,
  max_points integer,
  points_multiplier numeric NOT NULL DEFAULT 1.00,
  discount_percentage numeric DEFAULT 0,
  color text DEFAULT '#6366f1',
  benefits jsonb DEFAULT '[]'::jsonb,
  tier_order integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(branch_id, tier_order)
);

-- Create loyalty transactions table
CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text NOT NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'adjustment', 'bonus', 'expiry')),
  points_amount integer NOT NULL,
  balance_after integer NOT NULL,
  description text,
  reference_id text,
  staff_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create loyalty promotions table
CREATE TABLE public.loyalty_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  promotion_type text NOT NULL CHECK (promotion_type IN ('multiplier', 'bonus', 'discount')),
  value numeric NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  conditions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_config
CREATE POLICY "Admins can manage loyalty config"
ON public.loyalty_config
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view loyalty config for their branches"
ON public.loyalty_config
FOR SELECT
TO authenticated
USING (
  branch_id IN (
    SELECT branch_id FROM public.staff_branches WHERE staff_id = auth.uid()
  )
);

-- RLS Policies for loyalty_tiers
CREATE POLICY "Admins can manage loyalty tiers"
ON public.loyalty_tiers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view loyalty tiers for their branches"
ON public.loyalty_tiers
FOR SELECT
TO authenticated
USING (
  branch_id IN (
    SELECT branch_id FROM public.staff_branches WHERE staff_id = auth.uid()
  )
);

-- RLS Policies for loyalty_transactions
CREATE POLICY "Admins can view all loyalty transactions"
ON public.loyalty_transactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view transactions for their branches"
ON public.loyalty_transactions
FOR SELECT
TO authenticated
USING (
  branch_id IN (
    SELECT branch_id FROM public.staff_branches WHERE staff_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert loyalty transactions"
ON public.loyalty_transactions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for loyalty_promotions
CREATE POLICY "Admins can manage loyalty promotions"
ON public.loyalty_promotions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view promotions for their branches"
ON public.loyalty_promotions
FOR SELECT
TO authenticated
USING (
  branch_id IN (
    SELECT branch_id FROM public.staff_branches WHERE staff_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_loyalty_transactions_customer ON public.loyalty_transactions(customer_id);
CREATE INDEX idx_loyalty_transactions_branch ON public.loyalty_transactions(branch_id);
CREATE INDEX idx_loyalty_transactions_created ON public.loyalty_transactions(created_at DESC);
CREATE INDEX idx_loyalty_promotions_dates ON public.loyalty_promotions(start_date, end_date);
CREATE INDEX idx_loyalty_tiers_branch ON public.loyalty_tiers(branch_id, tier_order);

-- Create updated_at trigger for tables
CREATE TRIGGER update_loyalty_config_updated_at
BEFORE UPDATE ON public.loyalty_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_tiers_updated_at
BEFORE UPDATE ON public.loyalty_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_promotions_updated_at
BEFORE UPDATE ON public.loyalty_promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();