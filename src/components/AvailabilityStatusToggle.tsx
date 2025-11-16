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

type AvailabilityStatus = 'available' | 'busy' | 'on_break' | 'offline';

const statusConfig = {
  available: { label: 'Available', icon: Check, color: 'text-success bg-success/20 hover:bg-success/30' },
  busy: { label: 'Busy', icon: Clock, color: 'text-warning bg-warning/20 hover:bg-warning/30' },
  on_break: { label: 'On Break', icon: Coffee, color: 'text-info bg-info/20 hover:bg-info/30' },
  offline: { label: 'Offline', icon: WifiOff, color: 'text-muted-foreground bg-muted hover:bg-muted/80' },
};

export const AvailabilityStatusToggle = () => {
  const [status, setStatus] = useState<AvailabilityStatus>('available');
  const [loading, setLoading] = useState(false);

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

  const updateStatus = async (newStatus: AvailabilityStatus) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ availability_status: newStatus })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } else {
      setStatus(newStatus);
      toast.success(`Status updated to ${statusConfig[newStatus].label}`);
    }
    setLoading(false);
  };

  const currentConfig = statusConfig[status];
  const CurrentIcon = currentConfig.icon;

  return (
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
              onClick={() => updateStatus(key as AvailabilityStatus)}
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
  );
};
