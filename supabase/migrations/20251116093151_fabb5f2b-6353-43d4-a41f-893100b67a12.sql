-- Add pause_reason column to track why a job was paused
ALTER TABLE active_jobs 
ADD COLUMN pause_reason TEXT DEFAULT 'manual';

-- Add comment for documentation
COMMENT ON COLUMN active_jobs.pause_reason IS 'Tracks reason for pause: manual, auto_break, auto_offline';

-- Enable realtime for profiles table to sync availability status
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;