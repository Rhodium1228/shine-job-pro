-- Add foreign key constraint from bookings to profiles
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_staff_id_fkey
FOREIGN KEY (staff_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;