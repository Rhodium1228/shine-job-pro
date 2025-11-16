-- Create customer reviews table
CREATE TABLE public.customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text,
  staff_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  service text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score numeric,
  response_text text,
  responded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  responded_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'responded', 'flagged')),
  is_featured boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create feedback surveys table
CREATE TABLE public.feedback_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text,
  staff_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  service text NOT NULL,
  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  service_quality_rating integer CHECK (service_quality_rating >= 1 AND service_quality_rating <= 5),
  staff_friendliness_rating integer CHECK (staff_friendliness_rating >= 1 AND staff_friendliness_rating <= 5),
  cleanliness_rating integer CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  value_rating integer CHECK (value_rating >= 1 AND value_rating >= 1 AND value_rating <= 5),
  would_recommend boolean,
  improvements_text text,
  positive_aspects text,
  completed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create follow-up messages table
CREATE TABLE public.follow_up_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES public.customer_reviews(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('thank_you', 'request_review', 'apology', 'custom')),
  subject text NOT NULL,
  message_body text NOT NULL,
  sent_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_reviews
CREATE POLICY "Admins can manage all reviews"
ON public.customer_reviews
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view reviews for their branches"
ON public.customer_reviews
FOR SELECT
TO authenticated
USING (
  branch_id IN (
    SELECT branch_id FROM public.staff_branches WHERE staff_id = auth.uid()
  )
);

-- RLS Policies for feedback_surveys
CREATE POLICY "Admins can view all surveys"
ON public.feedback_surveys
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view surveys for their branches"
ON public.feedback_surveys
FOR SELECT
TO authenticated
USING (
  branch_id IN (
    SELECT branch_id FROM public.staff_branches WHERE staff_id = auth.uid()
  )
);

-- RLS Policies for follow_up_messages
CREATE POLICY "Admins can manage all follow-up messages"
ON public.follow_up_messages
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_customer_reviews_branch ON public.customer_reviews(branch_id);
CREATE INDEX idx_customer_reviews_staff ON public.customer_reviews(staff_id);
CREATE INDEX idx_customer_reviews_rating ON public.customer_reviews(rating);
CREATE INDEX idx_customer_reviews_sentiment ON public.customer_reviews(sentiment);
CREATE INDEX idx_customer_reviews_status ON public.customer_reviews(status);
CREATE INDEX idx_customer_reviews_created ON public.customer_reviews(created_at DESC);
CREATE INDEX idx_feedback_surveys_branch ON public.feedback_surveys(branch_id);
CREATE INDEX idx_feedback_surveys_created ON public.feedback_surveys(created_at DESC);
CREATE INDEX idx_follow_up_messages_status ON public.follow_up_messages(status);

-- Create updated_at trigger
CREATE TRIGGER update_customer_reviews_updated_at
BEFORE UPDATE ON public.customer_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();