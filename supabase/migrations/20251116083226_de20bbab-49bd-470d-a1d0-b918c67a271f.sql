-- Add branch_id to active_jobs table to support branch-specific filtering
ALTER TABLE public.active_jobs
ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_active_jobs_branch_id ON public.active_jobs(branch_id);

-- Add comment for documentation
COMMENT ON COLUMN public.active_jobs.branch_id IS 'Reference to the branch where this job is being performed';