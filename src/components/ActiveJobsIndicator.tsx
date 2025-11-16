import { useEffect, useState } from "react";
import { Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/contexts/BranchContext";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { calculateElapsedTime, type ActiveJob } from "@/utils/timeSync";

export const ActiveJobsIndicator = () => {
  const { selectedBranch } = useBranch();
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [jobTimes, setJobTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    loadActiveJobs();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('all-active-jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_jobs',
          filter: 'status=in.(active,paused)',
        },
        () => {
          // Reload all active jobs when any change occurs
          loadActiveJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBranch]);

  // Update times every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimes: Record<string, number> = {};
      activeJobs.forEach((job) => {
        newTimes[job.id] = calculateElapsedTime(
          job.started_at,
          job.paused_at,
          job.total_paused_seconds
        );
      });
      setJobTimes(newTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeJobs]);

  const loadActiveJobs = async () => {
    try {
      let query = supabase
        .from('active_jobs')
        .select('*')
        .in('status', ['active', 'paused']);

      // Filter by branch if one is selected
      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch.id);
      }

      const { data, error } = await query.order('started_at', { ascending: false });

      if (error) throw error;
      setActiveJobs((data || []) as ActiveJob[]);
    } catch (error) {
      console.error('Error loading active jobs:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (activeJobs.length === 0) return null;

  return (
    <Card className="p-4 mb-4 border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Active Jobs ({activeJobs.length})</h3>
      </div>
      
      <div className="space-y-2">
        {activeJobs.map((job) => (
          <div
            key={job.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 animate-fade-in"
          >
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">{job.client_name}</p>
              <p className="text-xs text-muted-foreground">{job.service}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm font-mono text-foreground">
                <Clock className="w-4 h-4" />
                {formatTime(jobTimes[job.id] || 0)}
              </div>
              
              <Badge
                variant={job.status === 'paused' ? 'secondary' : 'default'}
                className={job.status === 'active' ? 'bg-success text-success-foreground' : ''}
              >
                {job.status === 'paused' ? 'Paused' : 'Active'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
