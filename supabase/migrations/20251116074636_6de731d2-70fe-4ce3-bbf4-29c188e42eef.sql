-- Add availability_status to profiles
ALTER TABLE public.profiles 
ADD COLUMN availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'on_break', 'offline'));

-- Create favorite_staff table for quick access
CREATE TABLE public.favorite_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL,
  favorite_staff_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(staff_id, favorite_staff_id)
);

-- Enable RLS
ALTER TABLE public.favorite_staff ENABLE ROW LEVEL SECURITY;

-- Staff can view their own favorites
CREATE POLICY "Staff can view their own favorites"
  ON public.favorite_staff FOR SELECT
  USING (auth.uid() = staff_id);

-- Staff can add favorites
CREATE POLICY "Staff can add favorites"
  ON public.favorite_staff FOR INSERT
  WITH CHECK (auth.uid() = staff_id);

-- Staff can remove favorites
CREATE POLICY "Staff can delete their own favorites"
  ON public.favorite_staff FOR DELETE
  USING (auth.uid() = staff_id);

-- Enable realtime for favorite_staff
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorite_staff;