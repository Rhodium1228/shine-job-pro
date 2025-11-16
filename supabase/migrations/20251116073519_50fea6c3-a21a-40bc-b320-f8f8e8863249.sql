-- Create table to track active jobs and their start times
CREATE TABLE IF NOT EXISTS public.active_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  service TEXT NOT NULL,
  price TEXT NOT NULL,
  duration TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  total_paused_seconds INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.active_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view their own jobs"
  ON public.active_jobs FOR SELECT
  USING (auth.uid() = staff_id);

CREATE POLICY "Staff can insert their own jobs"
  ON public.active_jobs FOR INSERT
  WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "Staff can update their own jobs"
  ON public.active_jobs FOR UPDATE
  USING (auth.uid() = staff_id);

CREATE POLICY "Staff can delete their own jobs"
  ON public.active_jobs FOR DELETE
  USING (auth.uid() = staff_id);

-- Create table for break sessions
CREATE TABLE IF NOT EXISTS public.break_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  break_duration_minutes INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.break_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for break_sessions
CREATE POLICY "Staff can view their own breaks"
  ON public.break_sessions FOR SELECT
  USING (auth.uid() = staff_id);

CREATE POLICY "Staff can insert their own breaks"
  ON public.break_sessions FOR INSERT
  WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "Staff can update their own breaks"
  ON public.break_sessions FOR UPDATE
  USING (auth.uid() = staff_id);

CREATE POLICY "Staff can delete their own breaks"
  ON public.break_sessions FOR DELETE
  USING (auth.uid() = staff_id);

-- Create trigger for updated_at on active_jobs
CREATE TRIGGER update_active_jobs_updated_at
  BEFORE UPDATE ON public.active_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on break_sessions
CREATE TRIGGER update_break_sessions_updated_at
  BEFORE UPDATE ON public.break_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();