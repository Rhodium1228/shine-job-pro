-- Create status_history table to track availability status changes
CREATE TABLE public.status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;

-- Create policies for staff to manage their own status history
CREATE POLICY "Staff can view their own status history"
  ON public.status_history
  FOR SELECT
  USING (auth.uid() = staff_id);

CREATE POLICY "Staff can insert their own status history"
  ON public.status_history
  FOR INSERT
  WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "Staff can update their own status history"
  ON public.status_history
  FOR UPDATE
  USING (auth.uid() = staff_id);

-- Admins can view all status history
CREATE POLICY "Admins can view all status history"
  ON public.status_history
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_status_history_staff_date ON public.status_history(staff_id, started_at DESC);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_status_history_updated_at
  BEFORE UPDATE ON public.status_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.status_history IS 'Tracks availability status changes over time for analytics and reporting';