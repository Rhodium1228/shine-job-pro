-- Create branches table
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  color_theme TEXT DEFAULT '#6366f1',
  opening_hours JSONB DEFAULT '{"monday": {"enabled": true, "start": "09:00", "end": "17:00"}, "tuesday": {"enabled": true, "start": "09:00", "end": "17:00"}, "wednesday": {"enabled": true, "start": "09:00", "end": "17:00"}, "thursday": {"enabled": true, "start": "09:00", "end": "17:00"}, "friday": {"enabled": true, "start": "09:00", "end": "17:00"}, "saturday": {"enabled": false, "start": "09:00", "end": "17:00"}, "sunday": {"enabled": false, "start": "09:00", "end": "17:00"}}'::jsonb,
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  gps_radius_meters INTEGER DEFAULT 100,
  acsu_points_per_dollar DECIMAL(10, 2) DEFAULT 1.00,
  acsu_bonus_multiplier DECIMAL(10, 2) DEFAULT 1.00,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create staff_branches junction table (many-to-many relationship)
CREATE TABLE public.staff_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(staff_id, branch_id)
);

-- Add branch_id to bookings table
ALTER TABLE public.bookings
ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Add default_branch_id to profiles table
ALTER TABLE public.profiles
ADD COLUMN default_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_bookings_branch_id ON public.bookings(branch_id);
CREATE INDEX idx_staff_branches_staff_id ON public.staff_branches(staff_id);
CREATE INDEX idx_staff_branches_branch_id ON public.staff_branches(branch_id);
CREATE INDEX idx_profiles_default_branch_id ON public.profiles(default_branch_id);

-- Enable RLS on branches table
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Enable RLS on staff_branches table
ALTER TABLE public.staff_branches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for branches table
CREATE POLICY "Admins can manage all branches"
ON public.branches
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view branches they belong to"
ON public.branches
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT branch_id 
    FROM public.staff_branches 
    WHERE staff_id = auth.uid()
  )
);

-- RLS Policies for staff_branches table
CREATE POLICY "Admins can manage all staff-branch assignments"
ON public.staff_branches
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view their own branch assignments"
ON public.staff_branches
FOR SELECT
TO authenticated
USING (staff_id = auth.uid());

-- Add trigger for updated_at on branches
CREATE TRIGGER update_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.branches IS 'Stores branch/location information for multi-branch businesses';
COMMENT ON TABLE public.staff_branches IS 'Junction table linking staff members to branches they work at';
COMMENT ON COLUMN public.branches.acsu_points_per_dollar IS 'Branch-specific ACSU points earning rate';
COMMENT ON COLUMN public.branches.acsu_bonus_multiplier IS 'Branch-specific bonus multiplier for promotions';
COMMENT ON COLUMN public.staff_branches.is_default IS 'Indicates if this is the staff member default branch';