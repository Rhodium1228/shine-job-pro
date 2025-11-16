-- Create audit log table for tracking PII access
CREATE TABLE IF NOT EXISTS public.bookings_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accessed_by UUID NOT NULL,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT
);

-- Enable RLS on audit log
ALTER TABLE public.bookings_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view audit logs"
ON public.bookings_audit_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create function to log PII access
CREATE OR REPLACE FUNCTION public.log_booking_pii_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if accessing customer PII fields
  IF (TG_OP = 'SELECT' OR TG_OP = 'UPDATE') THEN
    INSERT INTO public.bookings_audit_log (
      accessed_by,
      booking_id,
      operation,
      client_email,
      client_phone
    ) VALUES (
      auth.uid(),
      NEW.id,
      TG_OP,
      NEW.client_email,
      NEW.client_phone
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: PostgreSQL doesn't support SELECT triggers on tables
-- Instead, we'll log on UPDATE operations which is when staff actually modifies data
CREATE TRIGGER audit_booking_pii_update
AFTER UPDATE ON public.bookings
FOR EACH ROW
WHEN (OLD.client_email IS DISTINCT FROM NEW.client_email OR OLD.client_phone IS DISTINCT FROM NEW.client_phone)
EXECUTE FUNCTION public.log_booking_pii_access();