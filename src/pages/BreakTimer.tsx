import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coffee, Clock, Play, Square } from "lucide-react";
import { GradientButton } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Break {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
}

const BreakTimer = () => {
  const navigate = useNavigate();
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [currentBreakTime, setCurrentBreakTime] = useState(0);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const [breaks, setBreaks] = useState<Break[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isOnBreak) {
      interval = setInterval(() => {
        setCurrentBreakTime((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isOnBreak]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTimeShort = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
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

  const handleStartBreak = async () => {
    setIsOnBreak(true);
    setCurrentBreakTime(0);
    await updateAvailabilityStatus('on_break');
    toast.success("Break started - enjoy your rest! ☕");
  };

  const handleEndBreak = async () => {
    const newBreak: Break = {
      id: Date.now().toString(),
      startTime: new Date(Date.now() - currentBreakTime * 1000),
      endTime: new Date(),
      duration: currentBreakTime,
    };

    setBreaks((prev) => [...prev, newBreak]);
    setTotalBreakTime((prev) => prev + currentBreakTime);
    setIsOnBreak(false);
    setCurrentBreakTime(0);
    await updateAvailabilityStatus('available');
    toast.success("Break ended - welcome back!");
  };

  const handleBack = async () => {
    if (isOnBreak) {
      if (confirm("You're currently on a break. End break and return to dashboard?")) {
        await handleEndBreak();
        navigate("/dashboard");
      }
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-secondary text-white p-6 pb-8 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Break Tracking</h1>
          <div className="w-10" />
        </div>

        {/* Daily Summary Card */}
        <div className="glass-card rounded-2xl p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Coffee className="w-5 h-5" />
              <span className="font-semibold">Today's Breaks</span>
            </div>
            <span className="text-sm text-white/70">
              {breaks.length} {breaks.length === 1 ? "break" : "breaks"}
            </span>
          </div>
          <div className="text-3xl font-bold">
            {formatTimeShort(totalBreakTime + (isOnBreak ? currentBreakTime : 0))}
          </div>
          <p className="text-sm text-white/70 mt-1">Total break time</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Current Break Timer */}
        <div
          className={cn(
            "rounded-3xl p-8 text-center transition-all duration-500 animate-scale-in",
            isOnBreak
              ? "gradient-accent border-2 border-accent"
              : "glass-card"
          )}
        >
          <div className="mb-6">
            <div
              className={cn(
                "w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-500",
                isOnBreak
                  ? "bg-white/20 animate-pulse-glow"
                  : "bg-muted"
              )}
            >
              <Coffee
                className={cn(
                  "w-12 h-12 transition-colors",
                  isOnBreak ? "text-white" : "text-muted-foreground"
                )}
              />
            </div>

            <p className={cn(
              "text-sm mb-3",
              isOnBreak ? "text-white/80" : "text-muted-foreground"
            )}>
              {isOnBreak ? "Break in Progress" : "Not on Break"}
            </p>

            <div
              className={cn(
                "text-6xl font-bold tracking-tight transition-colors",
                isOnBreak ? "text-white" : "text-foreground"
              )}
            >
              {formatTime(currentBreakTime)}
            </div>
          </div>

          {isOnBreak && (
            <div className="flex items-center justify-center gap-2 text-white/90 text-sm mb-4">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>Active Break</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: "100ms" }}>
          {!isOnBreak ? (
            <GradientButton
              onClick={handleStartBreak}
              variant="accent"
              className="w-full h-14 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Break
            </GradientButton>
          ) : (
            <GradientButton
              onClick={handleEndBreak}
              variant="primary"
              className="w-full h-14 text-lg"
            >
              <Square className="w-5 h-5 mr-2" />
              End Break
            </GradientButton>
          )}

          <Button
            onClick={handleBack}
            variant="outline"
            className="w-full h-12"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Break History */}
        {breaks.length > 0 && (
          <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h3 className="text-lg font-bold text-foreground mb-4">Break History</h3>
            <div className="space-y-3">
              {breaks.slice().reverse().map((breakItem, index) => (
                <div
                  key={breakItem.id}
                  className="glass-card rounded-xl p-4 flex items-center justify-between animate-slide-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Coffee className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {breakItem.startTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" - "}
                        {breakItem.endTime?.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Break #{breaks.length - index}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatTimeShort(breakItem.duration)}
                    </p>
                    <p className="text-xs text-muted-foreground">Duration</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {!isOnBreak && breaks.length === 0 && (
          <div className="glass-card rounded-2xl p-5 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full gradient-secondary flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Break Tips</h4>
                <p className="text-sm text-muted-foreground">
                  Regular breaks help maintain quality service. Take short breaks between clients to stay refreshed and energized.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreakTimer;
