/**
 * Time synchronization utilities for accurate time tracking across devices
 * Uses server timestamps to ensure consistency even when device goes to sleep
 */

import { supabase } from "@/integrations/supabase/client";

export interface ActiveJob {
  id: string;
  staff_id: string;
  booking_id: string;
  client_name: string;
  service: string;
  price: string;
  duration: string;
  started_at: string;
  paused_at: string | null;
  total_paused_seconds: number;
  status: 'active' | 'paused' | 'completed';
  completed_at: string | null;
}

export interface BreakSession {
  id: string;
  staff_id: string;
  break_duration_minutes: number;
  started_at: string;
  ends_at: string;
  status: 'active' | 'completed' | 'cancelled';
}

/**
 * Calculate elapsed time from server timestamp
 * Handles paused time accurately
 */
export const calculateElapsedTime = (
  startedAt: string,
  pausedAt: string | null,
  totalPausedSeconds: number
): number => {
  const startTime = new Date(startedAt).getTime();
  const now = Date.now();
  
  let elapsedMs: number;
  
  if (pausedAt) {
    // If currently paused, calculate up to pause time
    const pauseTime = new Date(pausedAt).getTime();
    elapsedMs = pauseTime - startTime;
  } else {
    // If active, calculate up to now
    elapsedMs = now - startTime;
  }
  
  // Subtract total paused time and convert to seconds
  const elapsedSeconds = Math.floor(elapsedMs / 1000) - totalPausedSeconds;
  return Math.max(0, elapsedSeconds);
};

/**
 * Calculate remaining time for a break
 */
export const calculateRemainingTime = (
  startedAt: string,
  endsAt: string
): number => {
  const now = Date.now();
  const endTime = new Date(endsAt).getTime();
  const remainingMs = endTime - now;
  return Math.max(0, Math.floor(remainingMs / 1000));
};

/**
 * Start a new job and store in database
 */
export const startJob = async (
  bookingId: string,
  clientName: string,
  service: string,
  price: string,
  duration: string
): Promise<ActiveJob | null> => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    const { data, error } = await supabase
      .from('active_jobs')
      .insert({
        staff_id: profile.id,
        booking_id: bookingId,
        client_name: clientName,
        service: service,
        price: price,
        duration: duration,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data as ActiveJob;
  } catch (error) {
    console.error('Error starting job:', error);
    return null;
  }
};

/**
 * Pause an active job
 */
export const pauseJob = async (jobId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('active_jobs')
      .update({
        paused_at: new Date().toISOString(),
        status: 'paused',
      })
      .eq('id', jobId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error pausing job:', error);
    return false;
  }
};

/**
 * Resume a paused job
 */
export const resumeJob = async (
  jobId: string,
  totalPausedSeconds: number
): Promise<boolean> => {
  try {
    const { data: job } = await supabase
      .from('active_jobs')
      .select('paused_at')
      .eq('id', jobId)
      .single();

    if (!job?.paused_at) return false;

    // Calculate how long it was paused
    const pausedAt = new Date(job.paused_at).getTime();
    const now = Date.now();
    const additionalPausedSeconds = Math.floor((now - pausedAt) / 1000);

    const { error } = await supabase
      .from('active_jobs')
      .update({
        paused_at: null,
        total_paused_seconds: totalPausedSeconds + additionalPausedSeconds,
        status: 'active',
      })
      .eq('id', jobId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error resuming job:', error);
    return false;
  }
};

/**
 * Complete a job
 */
export const completeJob = async (jobId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('active_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error completing job:', error);
    return false;
  }
};

/**
 * Get active job for current user
 */
export const getActiveJob = async (): Promise<ActiveJob | null> => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .single();

    if (!profile) return null;

    const { data, error } = await supabase
      .from('active_jobs')
      .select('*')
      .eq('staff_id', profile.id)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as ActiveJob | null;
  } catch (error) {
    console.error('Error getting active job:', error);
    return null;
  }
};

/**
 * Start a break session
 */
export const startBreak = async (durationMinutes: number): Promise<BreakSession | null> => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const { data, error} = await supabase
      .from('break_sessions')
      .insert({
        staff_id: profile.id,
        break_duration_minutes: durationMinutes,
        started_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data as BreakSession;
  } catch (error) {
    console.error('Error starting break:', error);
    return null;
  }
};

/**
 * End a break session
 */
export const endBreak = async (breakId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('break_sessions')
      .update({
        status: 'completed',
      })
      .eq('id', breakId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error ending break:', error);
    return false;
  }
};

/**
 * Get active break for current user
 */
export const getActiveBreak = async (): Promise<BreakSession | null> => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .single();

    if (!profile) return null;

    const { data, error } = await supabase
      .from('break_sessions')
      .select('*')
      .eq('staff_id', profile.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as BreakSession | null;
  } catch (error) {
    console.error('Error getting active break:', error);
    return null;
  }
};

/**
 * Get all breaks for today
 */
export const getTodayBreaks = async (): Promise<BreakSession[]> => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .single();

    if (!profile) return [];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('break_sessions')
      .select('*')
      .eq('staff_id', profile.id)
      .gte('started_at', todayStart.toISOString())
      .order('started_at', { ascending: false });

    if (error) throw error;
    return (data || []) as BreakSession[];
  } catch (error) {
    console.error('Error getting today breaks:', error);
    return [];
  }
};
