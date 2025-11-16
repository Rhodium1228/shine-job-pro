import { useState } from "react";
import { Calendar, Clock, DollarSign, User, TrendingUp } from "lucide-react";
import BookingCard from "@/components/BookingCard";
import BottomNav from "@/components/BottomNav";
import BreakButton from "@/components/BreakButton";
import { ActiveJobsIndicator } from "@/components/ActiveJobsIndicator";

// Mock data
const mockBookings = [
  {
    id: "1",
    clientName: "Sarah Johnson",
    service: "Deep Tissue Massage",
    time: "10:00 AM",
    duration: "60 min",
    status: "pending" as const,
    price: "$120",
  },
  {
    id: "2",
    clientName: "Michael Chen",
    service: "Swedish Massage",
    time: "11:30 AM",
    duration: "90 min",
    status: "pending" as const,
    price: "$150",
  },
  {
    id: "3",
    clientName: "Emma Davis",
    service: "Hot Stone Therapy",
    time: "2:00 PM",
    duration: "75 min",
    status: "accepted" as const,
    price: "$180",
  },
  {
    id: "4",
    clientName: "James Wilson",
    service: "Sports Massage",
    time: "4:00 PM",
    duration: "60 min",
    status: "pending" as const,
    price: "$130",
  },
];

const Dashboard = () => {
  const [bookings, setBookings] = useState(mockBookings);

  const handleAccept = (id: string) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === id ? { ...booking, status: "accepted" as const } : booking
      )
    );
  };

  const handleDecline = (id: string) => {
    setBookings((prev) => prev.filter((booking) => booking.id !== id));
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
          <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </button>
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
