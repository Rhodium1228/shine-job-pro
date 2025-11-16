import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, Clock, Coffee, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { handleStatusChange, getAutoPausedJobs, countActiveJobs } from "@/utils/availabilitySync";

type AvailabilityStatus = 'available' | 'busy' | 'on_break' | 'offline';

const statusConfig = {
  available: { label: 'Available', icon: Check, color: 'text-success bg-success/20 hover:bg-success/30' },
  busy: { label: 'Busy', icon: Clock, color: 'text-warning bg-warning/20 hover:bg-warning/30' },
  on_break: { label: 'On Break', icon: Coffee, color: 'text-secondary bg-secondary/20 hover:bg-secondary/30' },
  offline: { label: 'Offline', icon: WifiOff, color: 'text-muted-foreground bg-muted hover:bg-muted/80' },
};

export const AvailabilityStatusToggle = () => {
  const [status, setStatus] = useState<AvailabilityStatus>('available');
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AvailabilityStatus | null>(null);
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [autoPausedCount, setAutoPausedCount] = useState(0);

  useEffect(() => {
    loadCurrentStatus();
  }, []);

  const loadCurrentStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('availability_status')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setStatus((data.availability_status || 'available') as AvailabilityStatus);
    }
  };

  const handleStatusClick = async (newStatus: AvailabilityStatus) => {
    if (newStatus === status) return;

    // Check if we need confirmation
    const activeCount = await countActiveJobs();
    const autoPausedIds = getAutoPausedJobs();

    // Going on break/offline with active jobs - need confirmation
    if ((newStatus === 'on_break' || newStatus === 'offline') && activeCount > 0) {
      setActiveJobsCount(activeCount);
      setPendingStatus(newStatus);
      setConfirmDialogOpen(true);
      return;
    }

    // Coming back from break with auto-paused jobs - need confirmation
    if (status === 'on_break' && newStatus === 'available' && autoPausedIds.length > 0) {
      setAutoPausedCount(autoPausedIds.length);
      setPendingStatus(newStatus);
      setConfirmDialogOpen(true);
      return;
    }

    // No confirmation needed
    await executeStatusChange(newStatus);
  };

  const executeStatusChange = async (newStatus: AvailabilityStatus) => {
    setLoading(true);
    
    const result = await handleStatusChange(newStatus, status);
    
    if (result.success) {
      setStatus(newStatus);
      
      if (result.jobsAffected > 0) {
        toast.success(`Status updated to ${statusConfig[newStatus].label} - ${result.message}`);
      } else {
        toast.success(`Status updated to ${statusConfig[newStatus].label}`);
      }
    } else {
      toast.error(result.message || 'Failed to update status');
    }
    
    setLoading(false);
    setConfirmDialogOpen(false);
    setPendingStatus(null);
  };

  const handleConfirm = async () => {
    if (pendingStatus) {
      await executeStatusChange(pendingStatus);
    }
  };

  const currentConfig = statusConfig[status];
  const CurrentIcon = currentConfig.icon;

  const getDialogContent = () => {
    if (!pendingStatus) return { title: '', description: '' };

    if ((pendingStatus === 'on_break' || pendingStatus === 'offline') && activeJobsCount > 0) {
      return {
        title: `Pause ${activeJobsCount} active job${activeJobsCount !== 1 ? 's' : ''}?`,
        description: `This will pause your ${activeJobsCount} active job${activeJobsCount !== 1 ? 's' : ''} while you're ${pendingStatus === 'on_break' ? 'on break' : 'offline'}. You can resume ${activeJobsCount !== 1 ? 'them' : 'it'} later.`
      };
    }

    if (status === 'on_break' && pendingStatus === 'available' && autoPausedCount > 0) {
      return {
        title: `Resume ${autoPausedCount} paused job${autoPausedCount !== 1 ? 's' : ''}?`,
        description: `Welcome back! You have ${autoPausedCount} job${autoPausedCount !== 1 ? 's' : ''} that ${autoPausedCount !== 1 ? 'were' : 'was'} paused during your break. Resume ${autoPausedCount !== 1 ? 'them' : 'it'} now?`
      };
    }

    return { title: '', description: '' };
  };

  const dialogContent = getDialogContent();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn("gap-2", currentConfig.color)}
            disabled={loading}
          >
            <CurrentIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{currentConfig.label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Set Your Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(statusConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <DropdownMenuItem
                key={key}
                onClick={() => handleStatusClick(key as AvailabilityStatus)}
                className="gap-2 cursor-pointer"
              >
                <Icon className="w-4 h-4" />
                <span>{config.label}</span>
                {status === key && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
