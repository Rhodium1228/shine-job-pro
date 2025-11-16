-- Create staff_services table for managing services each staff member provides
CREATE TABLE IF NOT EXISTS public.staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  custom_price NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_admin_approval BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, service_name)
);

-- Enable RLS
ALTER TABLE public.staff_services ENABLE ROW LEVEL SECURITY;

-- Admins can manage all staff services
CREATE POLICY "Admins can manage all staff services"
ON public.staff_services
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Staff can view their own services
CREATE POLICY "Staff can view their own services"
ON public.staff_services
FOR SELECT
TO authenticated
USING (staff_id = auth.uid());

-- Staff can insert their own services (pending approval if required)
CREATE POLICY "Staff can insert their own services"
ON public.staff_services
FOR INSERT
TO authenticated
WITH CHECK (staff_id = auth.uid());

-- Staff can update their own services (price only if not requires approval)
CREATE POLICY "Staff can update their own services"
ON public.staff_services
FOR UPDATE
TO authenticated
USING (staff_id = auth.uid())
WITH CHECK (staff_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_staff_services_updated_at
BEFORE UPDATE ON public.staff_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_staff_services_staff_id ON public.staff_services(staff_id);
CREATE INDEX idx_staff_services_is_active ON public.staff_services(is_active);
CREATE INDEX idx_staff_services_requires_approval ON public.staff_services(requires_admin_approval);