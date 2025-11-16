-- Create break_requests table for approval workflow
CREATE TABLE IF NOT EXISTS public.break_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  break_duration_minutes INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.break_requests ENABLE ROW LEVEL SECURITY;

-- Staff can view their own requests
CREATE POLICY "Staff can view their own break requests"
ON public.break_requests
FOR SELECT
USING (auth.uid() = staff_id);

-- Staff can create their own requests
CREATE POLICY "Staff can create break requests"
ON public.break_requests
FOR INSERT
WITH CHECK (auth.uid() = staff_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all break requests"
ON public.break_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update break requests"
ON public.break_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_break_requests_updated_at
BEFORE UPDATE ON public.break_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add is_suspended column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_break_requests_staff_id ON public.break_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_break_requests_status ON public.break_requests(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended);