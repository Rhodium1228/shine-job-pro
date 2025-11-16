import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, addMonths, subMonths, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CalendarGrid from "@/components/CalendarGrid";
import BookingDetailSheet from "@/components/BookingDetailSheet";
import BottomNav from "@/components/BottomNav";

// Mock bookings data
const generateMockBookings = () => {
  const today = new Date();
  const bookings = [
    {
      id: "1",
      clientName: "Sarah Johnson",
      service: "Deep Tissue Massage",
      time: "10:00 AM",
      duration: "60 min",
      status: "pending" as const,
      price: "$120",
      date: today,
      phone: "+1 234 567 8900",
      email: "sarah.j@email.com",
      notes: "Prefers firm pressure, focus on back and shoulders"
    },
    {
      id: "2",
      clientName: "Michael Chen",
      service: "Swedish Massage",
      time: "11:30 AM",
      duration: "90 min",
      status: "accepted" as const,
      price: "$150",
      date: today,
      phone: "+1 234 567 8901",
      email: "mchen@email.com"
    },
    {
      id: "3",
      clientName: "Emma Davis",
      service: "Hot Stone Therapy",
      time: "2:00 PM",
      duration: "75 min",
      status: "completed" as const,
      price: "$180",
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
      phone: "+1 234 567 8902",
      email: "emma.d@email.com"
    },
    {
      id: "4",
      clientName: "James Wilson",
      service: "Sports Massage",
      time: "4:00 PM",
      duration: "60 min",
      status: "accepted" as const,
      price: "$130",
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
      phone: "+1 234 567 8903",
      email: "jwilson@email.com",
      notes: "Athlete - focus on legs and lower back"
    },
    {
      id: "5",
      clientName: "Lisa Anderson",
      service: "Aromatherapy Massage",
      time: "3:00 PM",
      duration: "60 min",
      status: "pending" as const,
      price: "$140",
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
      phone: "+1 234 567 8904",
      email: "lisa.a@email.com"
    },
  ];
  return bookings;
};

const CalendarView = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const bookings = generateMockBookings();

  // Swipe detection
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrevious();
    }
  };

  const handlePrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking);
    setSheetOpen(true);
  };

  const handleStartJob = (booking: any) => {
    const params = new URLSearchParams({
      id: booking.id,
      client: booking.clientName,
      service: booking.service,
      price: booking.price,
      duration: booking.duration,
    });
    navigate(`/job-flow?${params.toString()}`);
    setSheetOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-primary text-white p-6 pb-8 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Calendar</h1>
              <p className="text-sm text-white/80">
                {format(currentDate, viewMode === "month" ? "MMMM yyyy" : "'Week of' MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => setViewMode("month")}
            variant={viewMode === "month" ? "secondary" : "ghost"}
            className={cn(
              "flex-1 h-10",
              viewMode === "month" ? "bg-white text-primary" : "text-white hover:bg-white/20"
            )}
          >
            Month
          </Button>
          <Button
            onClick={() => setViewMode("week")}
            variant={viewMode === "week" ? "secondary" : "ghost"}
            className={cn(
              "flex-1 h-10",
              viewMode === "week" ? "bg-white text-primary" : "text-white hover:bg-white/20"
            )}
          >
            Week
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <Button
            onClick={handlePrevious}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-10 w-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            onClick={handleToday}
            variant="ghost"
            className="text-white hover:bg-white/20 font-semibold"
          >
            Today
          </Button>

          <Button
            onClick={handleNext}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-10 w-10"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid with Swipe */}
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="p-4 animate-fade-in"
      >
        <CalendarGrid
          currentDate={currentDate}
          bookings={bookings}
          onDayClick={(date) => console.log("Day clicked:", date)}
          onBookingClick={handleBookingClick}
          viewMode={viewMode}
        />
      </div>

      {/* Legend */}
      <div className="px-6 pb-6">
        <div className="glass-card rounded-2xl p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Status Legend</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning/90" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success/90" />
              <span className="text-xs text-muted-foreground">Accepted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary/90" />
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive/90" />
              <span className="text-xs text-muted-foreground">Cancelled</span>
            </div>
          </div>
        </div>
      </div>

      <BookingDetailSheet
        booking={selectedBooking}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStartJob={handleStartJob}
      />

      <BottomNav />
    </div>
  );
};

export default CalendarView;
