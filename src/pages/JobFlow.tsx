import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Clock, User, DollarSign, CheckCircle, Pause, Play, ArrowRight } from "lucide-react";
import SlideToStart from "@/components/SlideToStart";
import { GradientButton } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { playStartSound, playPauseSound, playResumeSound, playCompleteSound } from "@/utils/soundEffects";
import { supabase } from "@/integrations/supabase/client";
import { HandoffDialog } from "@/components/HandoffDialog";
import {
  startJob,
  pauseJob,
  resumeJob,
  completeJob,
  getActiveJob,
  calculateElapsedTime,
  type ActiveJob,
} from "@/utils/timeSync";

const JobFlow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get booking data from URL params
  const bookingData = {
    id: searchParams.get("id") || "1",
    clientName: searchParams.get("client") || "Client",
    service: searchParams.get("service") || "Service",
    price: searchParams.get("price") || "$120",
    duration: searchParams.get("duration") || "60 min",
  };

  const [activeJobData, setActiveJobData] = useState<ActiveJob | null>(null);
  const [jobStatus, setJobStatus] = useState<"ready" | "active" | "paused" | "completed">("ready");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [handoffDialogOpen, setHandoffDialogOpen] = useState(false);

  // Check for existing active job on mount
  useEffect(() => {
    const checkActiveJob = async () => {
      const existingJob = await getActiveJob();
      if (existingJob) {
        setActiveJobData(existingJob);
        setJobStatus(existingJob.status === 'paused' ? 'paused' : 'active');
      }
      setLoading(false);
    };
    checkActiveJob();
  }, []);

  // Subscribe to realtime changes on active_jobs
  useEffect(() => {
    const channel = supabase
      .channel('active-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_jobs',
        },
        (payload) => {
          console.log('Realtime job update:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newJob = payload.new as ActiveJob;
            setActiveJobData(newJob);
            setJobStatus(newJob.status === 'paused' ? 'paused' : 'active');
            toast.info(`Job started: ${newJob.client_name}`);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedJob = payload.new as ActiveJob;
            setActiveJobData(updatedJob);
            setJobStatus(updatedJob.status === 'completed' ? 'completed' : 
                        updatedJob.status === 'paused' ? 'paused' : 'active');
            
            if (updatedJob.status === 'paused') {
              toast.info(`Job paused: ${updatedJob.client_name}`);
            } else if (updatedJob.status === 'completed') {
              toast.success(`Job completed: ${updatedJob.client_name}`);
            }
          } else if (payload.eventType === 'DELETE') {
            setActiveJobData(null);
            setJobStatus('ready');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update elapsed time every second using server timestamp
  useEffect(() => {
    if (!activeJobData || jobStatus === 'completed') return;

    const updateTime = () => {
      const elapsed = calculateElapsedTime(
        activeJobData.started_at,
        activeJobData.paused_at,
        activeJobData.total_paused_seconds
      );
      setElapsedTime(elapsed);
    };

    updateTime(); // Initial update
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [activeJobData, jobStatus]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const updateAvailabilityStatus = async (status: 'available' | 'busy' | 'on_break' | 'offline') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ availability_status: status })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating availability status:', error);
    }
  };

  const handleStart = async () => {
    playStartSound();
    setLoading(true);
    
    const job = await startJob(
      bookingData.id,
      bookingData.clientName,
      bookingData.service,
      bookingData.price,
      bookingData.duration
    );
    
    if (job) {
      setActiveJobData(job);
      setJobStatus("active");
      await updateAvailabilityStatus('busy');
      toast.success("Job started! 🚀");
    } else {
      toast.error("Failed to start job");
    }
    
    setLoading(false);
  };

  const handlePauseResume = async () => {
    if (!activeJobData) return;
    
    setLoading(true);
    
    if (jobStatus === 'paused') {
      // Resume
      const success = await resumeJob(activeJobData.id, activeJobData.total_paused_seconds);
      if (success) {
        playResumeSound();
        setJobStatus('active');
        // Update local state to reflect resume
        setActiveJobData({
          ...activeJobData,
          paused_at: null,
          status: 'active',
        });
        toast("Timer resumed ▶️");
      } else {
        toast.error("Failed to resume job");
      }
    } else {
      // Pause
      const success = await pauseJob(activeJobData.id);
      if (success) {
        playPauseSound();
        setJobStatus('paused');
        // Update local state to reflect pause
        setActiveJobData({
          ...activeJobData,
          paused_at: new Date().toISOString(),
          status: 'paused',
        });
        toast("Timer paused ⏸️");
      } else {
        toast.error("Failed to pause job");
      }
    }
    
    setLoading(false);
  };

  const handleComplete = async () => {
    if (!activeJobData) return;
    
    setLoading(true);
    const success = await completeJob(activeJobData.id);
    
    if (success) {
      playCompleteSound();
      setJobStatus("completed");
      await updateAvailabilityStatus('available');
      toast.success("Job completed! Great work! 🎉");
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } else {
      toast.error("Failed to complete job");
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (confirm("Are you sure you want to cancel this job?")) {
      await updateAvailabilityStatus('available');
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary text-white p-6 pb-8 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleCancel}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">
            {jobStatus === "ready" && "Ready to Start"}
            {jobStatus === "active" && "Job in Progress"}
            {jobStatus === "paused" && "Job Paused"}
            {jobStatus === "completed" && "Completed!"}
          </h1>
          <div className="w-10" />
        </div>

        {/* Client Info Card */}
        <div className="glass-card rounded-2xl p-5 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{bookingData.clientName}</h3>
              <p className="text-sm text-white/80">{bookingData.service}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>{bookingData.duration}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold">{bookingData.price}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Timer Display */}
        {(jobStatus === "active" || jobStatus === "paused" || jobStatus === "completed") && (
          <div className={cn(
            "glass-card rounded-3xl p-8 text-center animate-scale-in",
            jobStatus === "completed" && "gradient-success border-2 border-success"
          )}>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                {jobStatus === "completed" ? "Total Time" : "Elapsed Time"}
              </p>
              <div className={cn(
                "text-6xl font-bold tracking-tight",
                jobStatus === "completed" ? "text-white" : "gradient-primary bg-clip-text text-transparent"
              )}>
                {formatTime(elapsedTime)}
              </div>
            </div>

            {jobStatus === "completed" && (
              <div className="flex items-center justify-center gap-2 text-white">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-semibold">Job Completed!</span>
              </div>
            )}

            {jobStatus === "active" && (
              <div className={cn(
                "mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
                "bg-success/20 text-success"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  "bg-success animate-pulse"
                )} />
                In Progress
              </div>
            )}

            {jobStatus === "paused" && (
              <div className={cn(
                "mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
                "bg-warning/20 text-warning"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  "bg-warning"
                )} />
                Paused
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
          {jobStatus === "ready" && (
            <>
              <p className="text-center text-muted-foreground mb-4">
                Slide to confirm you're starting this job
              </p>
              <SlideToStart onComplete={handleStart} disabled={loading} />
            </>
          )}

          {(jobStatus === "active" || jobStatus === "paused") && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handlePauseResume}
                  variant="outline"
                  className="h-14 text-base"
                  disabled={loading}
                >
                  {jobStatus === 'paused' ? (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setHandoffDialogOpen(true)}
                  variant="outline"
                  className="h-14 text-base"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Transfer
                </Button>
              </div>
              
              <Button
                onClick={handleCancel}
                variant="outline"
                className="w-full h-12 text-base border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                Cancel Job
              </Button>

              <GradientButton
                onClick={handleComplete}
                variant="success"
                className="w-full h-14 text-lg"
                disabled={loading || jobStatus === 'paused'}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Complete Job
              </GradientButton>
            </>
          )}

          {jobStatus === "completed" && (
            <div className="text-center space-y-4">
              <div className="text-5xl animate-bounce">🎉</div>
              <p className="text-muted-foreground">
                Returning to dashboard...
              </p>
            </div>
          )}
        </div>

        {/* Service Notes */}
        {jobStatus === "active" && (
          <div className="glass-card rounded-2xl p-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h4 className="font-semibold text-foreground mb-2">Service Notes</h4>
            <p className="text-sm text-muted-foreground">
              Remember to confirm client preferences and ensure comfort throughout the service.
            </p>
          </div>
        )}
      </div>

      {/* Handoff Dialog */}
      {activeJobData && (
        <HandoffDialog
          open={handoffDialogOpen}
          onOpenChange={setHandoffDialogOpen}
          jobId={activeJobData.id}
          clientName={activeJobData.client_name}
          service={activeJobData.service}
        />
      )}
    </div>
  );
};

export default JobFlow;
