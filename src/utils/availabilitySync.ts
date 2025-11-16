import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AvailabilityStatus = 'available' | 'busy' | 'on_break' | 'offline';
type PauseReason = 'manual' | 'auto_break' | 'auto_offline';

const AUTO_PAUSED_JOBS_KEY = 'auto_paused_jobs';

// Get list of auto-paused job IDs from localStorage
export const getAutoPausedJobs = (): string[] => {
  const stored = localStorage.getItem(AUTO_PAUSED_JOBS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Store auto-paused job IDs
const setAutoPausedJobs = (jobIds: string[]) => {
  localStorage.setItem(AUTO_PAUSED_JOBS_KEY, JSON.stringify(jobIds));
};

// Clear auto-paused jobs list
const clearAutoPausedJobs = () => {
  localStorage.removeItem(AUTO_PAUSED_JOBS_KEY);
};

// Get all active jobs for the current user
export const getActiveJobs = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('active_jobs')
    .select('*')
    .eq('staff_id', user.id)
    .in('status', ['active', 'paused']);

  if (error) {
    console.error('Error fetching active jobs:', error);
    return [];
  }

  return data || [];
};

// Count only truly active jobs (not paused)
export const countActiveJobs = async (): Promise<number> => {
  const jobs = await getActiveJobs();
  return jobs.filter(job => job.status === 'active').length;
};

// Pause all active jobs when going on break or offline
export const pauseAllActiveJobs = async (reason: 'auto_break' | 'auto_offline'): Promise<number> => {
  const jobs = await getActiveJobs();
  const activeJobs = jobs.filter(job => job.status === 'active');

  if (activeJobs.length === 0) return 0;

  const jobIds = activeJobs.map(job => job.id);
  
  // Pause each job with the appropriate reason
  const { error } = await supabase
    .from('active_jobs')
    .update({ 
      status: 'paused',
      paused_at: new Date().toISOString(),
      pause_reason: reason
    })
    .in('id', jobIds);

  if (error) {
    console.error('Error pausing jobs:', error);
    throw error;
  }

  // Store the auto-paused job IDs
  setAutoPausedJobs(jobIds);
  
  return activeJobs.length;
};

// Resume jobs that were auto-paused
export const resumeAutoPausedJobs = async (): Promise<number> => {
  const autoPausedIds = getAutoPausedJobs();
  
  if (autoPausedIds.length === 0) return 0;

  // Get current state of these jobs
  const { data: jobs, error: fetchError } = await supabase
    .from('active_jobs')
    .select('*')
    .in('id', autoPausedIds)
    .eq('status', 'paused');

  if (fetchError) {
    console.error('Error fetching paused jobs:', fetchError);
    return 0;
  }

  if (!jobs || jobs.length === 0) {
    clearAutoPausedJobs();
    return 0;
  }

  // Calculate new total_paused_seconds for each job
  const updates = jobs.map(job => {
    const pausedDuration = job.paused_at 
      ? Math.floor((Date.now() - new Date(job.paused_at).getTime()) / 1000)
      : 0;
    
    return {
      id: job.id,
      status: 'active',
      paused_at: null,
      total_paused_seconds: (job.total_paused_seconds || 0) + pausedDuration,
      pause_reason: 'manual' // Reset to manual
    };
  });

  // Resume each job
  for (const update of updates) {
    const { error } = await supabase
      .from('active_jobs')
      .update({
        status: update.status,
        paused_at: update.paused_at,
        total_paused_seconds: update.total_paused_seconds,
        pause_reason: update.pause_reason
      })
      .eq('id', update.id);

    if (error) {
      console.error('Error resuming job:', error);
    }
  }

  clearAutoPausedJobs();
  return jobs.length;
};

// Update user's availability status
export const updateAvailabilityStatus = async (status: AvailabilityStatus): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('profiles')
    .update({ availability_status: status })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating availability status:', error);
    throw error;
  }
};

// Handle status change with job synchronization
export const handleStatusChange = async (
  newStatus: AvailabilityStatus,
  currentStatus?: AvailabilityStatus
): Promise<{ success: boolean; jobsAffected: number; message?: string }> => {
  try {
    const activeJobCount = await countActiveJobs();

    // Going ON break or offline
    if ((newStatus === 'on_break' || newStatus === 'offline') && activeJobCount > 0) {
      const reason = newStatus === 'on_break' ? 'auto_break' : 'auto_offline';
      const pausedCount = await pauseAllActiveJobs(reason);
      await updateAvailabilityStatus(newStatus);
      
      return {
        success: true,
        jobsAffected: pausedCount,
        message: `${pausedCount} active job${pausedCount !== 1 ? 's' : ''} paused`
      };
    }

    // Coming back FROM break
    if (currentStatus === 'on_break' && newStatus === 'available') {
      const autoPausedIds = getAutoPausedJobs();
      
      if (autoPausedIds.length > 0) {
        const resumedCount = await resumeAutoPausedJobs();
        await updateAvailabilityStatus(newStatus);
        
        return {
          success: true,
          jobsAffected: resumedCount,
          message: `${resumedCount} job${resumedCount !== 1 ? 's' : ''} resumed`
        };
      }
    }

    // Simple status change (no jobs affected)
    await updateAvailabilityStatus(newStatus);
    return {
      success: true,
      jobsAffected: 0
    };

  } catch (error) {
    console.error('Error handling status change:', error);
    return {
      success: false,
      jobsAffected: 0,
      message: 'Failed to update status'
    };
  }
};

// Set status to busy when starting a job (called from JobFlow)
export const setStatusToBusyOnJobStart = async (): Promise<void> => {
  await updateAvailabilityStatus('busy');
};

// Set status to available when last job completes (called from JobFlow)
export const setStatusToAvailableOnLastJobComplete = async (): Promise<void> => {
  const activeCount = await countActiveJobs();
  if (activeCount === 0) {
    await updateAvailabilityStatus('available');
  }
};

// Get current availability status
export const getCurrentAvailabilityStatus = async (): Promise<AvailabilityStatus | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('availability_status')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return (data.availability_status || 'available') as AvailabilityStatus;
};
