-- Update RLS policies to allow staff to see all active jobs
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Staff can view their own jobs" ON public.active_jobs;

-- Create new policy that allows staff to view all active and paused jobs
CREATE POLICY "Staff can view all active/paused jobs"
  ON public.active_jobs FOR SELECT
  USING (status IN ('active', 'paused') OR auth.uid() = staff_id);

-- Staff can still only modify their own jobs
-- The update, insert, and delete policies remain as they were