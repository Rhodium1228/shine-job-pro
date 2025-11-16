-- Add missing DELETE RLS policy for staff to delete their own services
CREATE POLICY "Staff can delete their own services"
ON public.staff_services
FOR DELETE
TO authenticated
USING (staff_id = auth.uid());