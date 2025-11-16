-- Create bookings table to replace mock data
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  service TEXT NOT NULL,
  booking_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  price TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view their own bookings"
  ON public.bookings
  FOR SELECT
  USING (auth.uid() = staff_id);

CREATE POLICY "Staff can insert their own bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "Staff can update their own bookings"
  ON public.bookings
  FOR UPDATE
  USING (auth.uid() = staff_id);

CREATE POLICY "Staff can delete their own bookings"
  ON public.bookings
  FOR DELETE
  USING (auth.uid() = staff_id);

-- Trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();