-- Create enum for handoff status
CREATE TYPE public.handoff_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

-- Create handoff_notifications table
CREATE TABLE public.handoff_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_staff_id UUID NOT NULL,
  to_staff_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.active_jobs(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  service TEXT NOT NULL,
  message TEXT,
  status handoff_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.handoff_notifications ENABLE ROW LEVEL SECURITY;

-- Staff can view handoffs where they are sender or receiver
CREATE POLICY "Staff can view their handoffs"
  ON public.handoff_notifications FOR SELECT
  USING (auth.uid() = from_staff_id OR auth.uid() = to_staff_id);

-- Staff can create handoffs for their own jobs
CREATE POLICY "Staff can create handoffs"
  ON public.handoff_notifications FOR INSERT
  WITH CHECK (auth.uid() = from_staff_id);

-- Staff can update handoffs where they are the receiver (accept/reject) or sender (cancel)
CREATE POLICY "Staff can update handoffs"
  ON public.handoff_notifications FOR UPDATE
  USING (
    (auth.uid() = to_staff_id AND status = 'pending') OR 
    (auth.uid() = from_staff_id AND status = 'pending')
  );

-- Create trigger for updated_at
CREATE TRIGGER update_handoff_notifications_updated_at
  BEFORE UPDATE ON public.handoff_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.handoff_notifications;