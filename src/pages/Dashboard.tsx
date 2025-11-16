import { useState, useEffect } from "react";
import { Calendar, Clock, DollarSign, User, TrendingUp, Settings, Building2, ChevronDown, MapPin, Check, Coffee, WifiOff } from "lucide-react";
import BookingCard from "@/components/BookingCard";
import BottomNav from "@/components/BottomNav";
import BreakButton from "@/components/BreakButton";
import { ActiveJobsIndicator } from "@/components/ActiveJobsIndicator";
import { HandoffNotifications } from "@/components/HandoffNotifications";
import { AvailabilityStatusToggle } from "@/components/AvailabilityStatusToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBranch } from "@/contexts/BranchContext";
import { useUserBranches } from "@/hooks/useUserBranches";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getCurrentAvailabilityStatus } from "@/utils/availabilitySync";
interface Booking {
  id: string;
  clientName: string;
  service: string;
  time: string;
  duration: string;
  status: "pending" | "accepted";
  price: string;
}
const Dashboard = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    selectedBranch,
    setSelectedBranch
  } = useBranch();
  const {
    branches
  } = useUserBranches();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'on_break' | 'offline'>('available');
  // Load current availability status
  useEffect(() => {
    const loadStatus = async () => {
      const status = await getCurrentAvailabilityStatus();
      if (status) {
        setAvailabilityStatus(status);
      }
    };
    loadStatus();
    
    // Subscribe to real-time profile changes
    const channel = supabase
      .channel('profile-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          if (payload.new && 'availability_status' in payload.new) {
            setAvailabilityStatus(payload.new.availability_status as any);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Redirect to branch selector if user has multiple branches but none selected
    if (branches.length > 1 && !selectedBranch) {
      navigate("/branch-selector");
    }
  }, [branches, selectedBranch, navigate]);

  // Fetch today's bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const {
          data,
          error
        } = await supabase.from("bookings").select("*").eq("staff_id", user.id).gte("booking_time", today.toISOString()).lt("booking_time", tomorrow.toISOString()).order("booking_time", {
          ascending: true
        });
        if (error) throw error;
        const formattedBookings: Booking[] = (data || []).map(booking => ({
          id: booking.id,
          clientName: booking.client_name,
          service: booking.service,
          time: format(new Date(booking.booking_time), "h:mm a"),
          duration: booking.duration,
          status: booking.status as "pending" | "accepted",
          price: booking.price
        }));
        setBookings(formattedBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast({
          title: "Error",
          description: "Failed to load bookings",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [toast]);
  const handleAccept = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from("bookings").update({
        status: "accepted"
      }).eq("id", id);
      if (error) throw error;
      setBookings(prev => prev.map(booking => booking.id === id ? {
        ...booking,
        status: "accepted" as const
      } : booking));
      toast({
        title: "Success",
        description: "Booking accepted"
      });
    } catch (error) {
      console.error("Error accepting booking:", error);
      toast({
        title: "Error",
        description: "Failed to accept booking",
        variant: "destructive"
      });
    }
  };
  const handleDecline = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
      setBookings(prev => prev.filter(booking => booking.id !== id));
      toast({
        title: "Success",
        description: "Booking declined"
      });
    } catch (error) {
      console.error("Error declining booking:", error);
      toast({
        title: "Error",
        description: "Failed to decline booking",
        variant: "destructive"
      });
    }
  };
  const handleBranchChange = (branch: any) => {
    setSelectedBranch(branch);
    toast({
      title: "Branch Changed",
      description: `Switched to ${branch.name}`
    });
    window.location.reload();
  };
  const stats = [{
    label: "Today's Jobs",
    value: "4",
    icon: Calendar,
    gradient: "gradient-primary"
  }, {
    label: "Hours Worked",
    value: "5.5h",
    icon: Clock,
    gradient: "gradient-secondary"
  }, {
    label: "Earnings",
    value: "$580",
    icon: DollarSign,
    gradient: "gradient-success"
  }];
  return <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-primary text-white p-6 pb-8 rounded-b-[2rem] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm mb-1">Welcome back</p>
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
            <AvailabilityStatusToggle />
          </div>

          {/* Status Banner */}
          {availabilityStatus !== 'available' && (
            <div className={cn(
              "mb-4 p-4 rounded-xl border-2 backdrop-blur-sm animate-fade-in",
              availabilityStatus === 'on_break' && "bg-warning/20 border-warning/40",
              availabilityStatus === 'busy' && "bg-info/20 border-info/40",
              availabilityStatus === 'offline' && "bg-muted/20 border-muted/40"
            )}>
              <div className="flex items-center gap-3">
                {availabilityStatus === 'on_break' && <Coffee className="w-5 h-5" />}
                {availabilityStatus === 'busy' && <Clock className="w-5 h-5" />}
                {availabilityStatus === 'offline' && <WifiOff className="w-5 h-5" />}
                <div>
                  <p className="font-semibold text-white">
                    {availabilityStatus === 'on_break' && "You're on break"}
                    {availabilityStatus === 'busy' && "Currently working"}
                    {availabilityStatus === 'offline' && "You're offline"}
                  </p>
                  <p className="text-sm text-white/80">
                    {availabilityStatus === 'on_break' && "Active jobs are paused"}
                    {availabilityStatus === 'busy' && "Focused on active jobs"}
                    {availabilityStatus === 'offline' && "Not accepting new work"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Branch Indicator Card */}
          {selectedBranch && <Card className="glass-card border-white/20 p-4 mb-6 animate-slide-up bg-indigo-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{
              backgroundColor: selectedBranch.color_theme || "#6366f1"
            }}>
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold truncate">
                      {selectedBranch.name}
                    </p>
                    {selectedBranch.is_active && <Badge variant="secondary" className="bg-success/20 text-success border-success/30 text-xs">
                        Active
                      </Badge>}
                  </div>
                  {selectedBranch.address && <div className="flex items-center gap-1 text-white/70 text-xs">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{selectedBranch.address}</span>
                    </div>}
                </div>
              </div>
              {branches.length > 1 && <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 ml-2 flex-shrink-0">
                      Switch
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[280px]">
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Switch Branch</p>
                    </div>
                    <DropdownMenuSeparator />
                    {branches.map(branch => <DropdownMenuItem key={branch.id} onClick={() => handleBranchChange(branch)} className="cursor-pointer py-3">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                    backgroundColor: branch.color_theme || "#6366f1"
                  }}>
                            <Building2 className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{branch.name}</div>
                            {branch.address && <div className="text-xs text-muted-foreground truncate">
                                {branch.address}
                              </div>}
                          </div>
                          {selectedBranch?.id === branch.id && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                      </DropdownMenuItem>)}
                  </DropdownMenuContent>
                </DropdownMenu>}
            </div>
          </Card>}

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat, index) => <div key={stat.label} className="glass-card rounded-2xl p-3 text-center animate-slide-up" style={{
            animationDelay: `${index * 100}ms`
          }}>
                <div className={`w-10 h-10 rounded-xl ${stat.gradient} mx-auto mb-2 flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-white/70 mt-1">{stat.label}</p>
              </div>)}
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="p-6">
        {/* Break Button */}
        <div className="mb-6 animate-slide-up">
          <BreakButton isOnBreak={false} />
        </div>

        {/* Active Jobs Indicator */}
        <ActiveJobsIndicator />

        {/* Handoff Notifications */}
        <HandoffNotifications />

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-foreground">Today's Schedule</h3>
          <span className="text-sm text-muted-foreground">Monday, Jan 15</span>
        </div>

        <div className="space-y-4">
          {bookings.map((booking, index) => <div key={booking.id} className="animate-slide-up" style={{
          animationDelay: `${index * 100}ms`
        }}>
              <BookingCard booking={booking} onAccept={handleAccept} onDecline={handleDecline} />
            </div>)}
        </div>

        {bookings.length === 0 && <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No bookings for today</p>
          </div>}
      </div>

      <BottomNav />
    </div>;
};
export default Dashboard;