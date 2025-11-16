-- Enable realtime for active_jobs table
ALTER TABLE public.active_jobs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_jobs;

-- Enable realtime for break_sessions table
ALTER TABLE public.break_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.break_sessions;