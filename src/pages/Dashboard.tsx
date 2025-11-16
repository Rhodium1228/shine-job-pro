import { useState, useEffect } from "react";
import { Calendar, Clock, DollarSign, User, TrendingUp } from "lucide-react";
import BookingCard from "@/components/BookingCard";
import BottomNav from "@/components/BottomNav";
import BreakButton from "@/components/BreakButton";
import { ActiveJobsIndicator } from "@/components/ActiveJobsIndicator";
import { HandoffNotifications } from "@/components/HandoffNotifications";
import { AvailabilityStatusToggle } from "@/components/AvailabilityStatusToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch today's bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("staff_id", user.id)
          .gte("booking_time", today.toISOString())
          .lt("booking_time", tomorrow.toISOString())
          .order("booking_time", { ascending: true });

        if (error) throw error;

        const formattedBookings: Booking[] = (data || []).map((booking) => ({
          id: booking.id,
          clientName: booking.client_name,
          service: booking.service,
          time: format(new Date(booking.booking_time), "h:mm a"),
          duration: booking.duration,
          status: booking.status as "pending" | "accepted",
          price: booking.price,
        }));

        setBookings(formattedBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast({
          title: "Error",
          description: "Failed to load bookings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [toast]);

  const handleAccept = async (id: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "accepted" })
        .eq("id", id);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === id ? { ...booking, status: "accepted" as const } : booking
        )
      );

      toast({
        title: "Success",
        description: "Booking accepted",
      });
    } catch (error) {
      console.error("Error accepting booking:", error);
      toast({
        title: "Error",
        description: "Failed to accept booking",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (id: string) => {
    try {
      const { error } = await supabase.from("bookings").delete().eq("id", id);

      if (error) throw error;

      setBookings((prev) => prev.filter((booking) => booking.id !== id));

      toast({
        title: "Success",
        description: "Booking declined",
      });
    } catch (error) {
      console.error("Error declining booking:", error);
      toast({
        title: "Error",
        description: "Failed to decline booking",
        variant: "destructive",
      });
    }
  };

  const stats = [
    { label: "Today's Jobs", value: "4", icon: Calendar, gradient: "gradient-primary" },
    { label: "Hours Worked", value: "5.5h", icon: Clock, gradient: "gradient-secondary" },
    { label: "Earnings", value: "$580", icon: DollarSign, gradient: "gradient-success" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-primary text-white p-6 pb-8 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Welcome back!</h2>
              <p className="text-white/80 text-sm">Jessica Martinez</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AvailabilityStatusToggle />
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="glass-card rounded-2xl p-3 text-center animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-10 h-10 rounded-xl ${stat.gradient} mx-auto mb-2 flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-white/70 mt-1">{stat.label}</p>
            </div>
          ))}
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
          {bookings.map((booking, index) => (
            <div
              key={booking.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <BookingCard
                booking={booking}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            </div>
          ))}
        </div>

        {bookings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No bookings for today</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
