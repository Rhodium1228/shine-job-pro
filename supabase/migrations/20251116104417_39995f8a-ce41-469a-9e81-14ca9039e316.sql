-- Create staff invitations table
CREATE TABLE public.staff_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  assigned_role text NOT NULL DEFAULT 'staff' CHECK (assigned_role IN ('admin', 'moderator', 'staff')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  invitation_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create staff onboarding table
CREATE TABLE public.staff_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  invitation_id uuid REFERENCES public.staff_invitations(id) ON DELETE SET NULL,
  onboarding_status text NOT NULL DEFAULT 'incomplete' CHECK (onboarding_status IN ('incomplete', 'pending_approval', 'approved', 'rejected')),
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamp with time zone,
  rejection_reason text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  availability_preferences jsonb DEFAULT '{}'::jsonb,
  certifications jsonb DEFAULT '[]'::jsonb,
  documents jsonb DEFAULT '[]'::jsonb,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_invitations
CREATE POLICY "Admins can manage all invitations"
ON public.staff_invitations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own invitation"
ON public.staff_invitations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email = staff_invitations.email
  )
);

-- RLS Policies for staff_onboarding
CREATE POLICY "Admins can manage all onboarding"
ON public.staff_onboarding
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view and update their own onboarding"
ON public.staff_onboarding
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_staff_invitations_email ON public.staff_invitations(email);
CREATE INDEX idx_staff_invitations_token ON public.staff_invitations(invitation_token);
CREATE INDEX idx_staff_invitations_status ON public.staff_invitations(status);
CREATE INDEX idx_staff_invitations_expires ON public.staff_invitations(expires_at);
CREATE INDEX idx_staff_onboarding_user ON public.staff_onboarding(user_id);
CREATE INDEX idx_staff_onboarding_status ON public.staff_onboarding(onboarding_status);

-- Create updated_at trigger
CREATE TRIGGER update_staff_onboarding_updated_at
BEFORE UPDATE ON public.staff_onboarding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();