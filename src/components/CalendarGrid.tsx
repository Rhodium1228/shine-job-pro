import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  clientName: string;
  service: string;
  time: string;
  duration: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  price: string;
  date: Date;
}

interface CalendarGridProps {
  currentDate: Date;
  bookings: Booking[];
  onDayClick: (date: Date) => void;
  onBookingClick: (booking: Booking) => void;
  viewMode: "month" | "week";
}

const CalendarGrid = ({ currentDate, bookings, onDayClick, onBookingClick, viewMode }: CalendarGridProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);

  const days = viewMode === "month"
    ? eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    : eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getBookingsForDay = (date: Date) => {
    return bookings.filter(booking => isSameDay(booking.date, date));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning/90";
      case "accepted":
        return "bg-success/90";
      case "completed":
        return "bg-primary/90";
      case "cancelled":
        return "bg-destructive/90";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="bg-background rounded-2xl p-4">
      {/* Weekday Headers */}
      <div className={cn(
        "grid gap-2 mb-3",
        viewMode === "month" ? "grid-cols-7" : "grid-cols-7"
      )}>
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className={cn(
        "grid gap-2",
        viewMode === "month" ? "grid-cols-7" : "grid-cols-7"
      )}>
        {days.map((day, index) => {
          const dayBookings = getBookingsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <div
              key={index}
              onClick={() => onDayClick(day)}
              className={cn(
                "min-h-20 rounded-xl p-2 transition-all duration-200 cursor-pointer",
                viewMode === "month" && !isCurrentMonth && "opacity-40",
                isDayToday ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50",
                dayBookings.length > 0 && "bg-card"
              )}
            >
              <div className={cn(
                "text-xs font-semibold mb-1",
                isDayToday ? "text-primary" : "text-foreground"
              )}>
                {format(day, "d")}
              </div>

              {/* Booking indicators */}
              <div className="space-y-1">
                {dayBookings.slice(0, viewMode === "month" ? 2 : 4).map((booking) => (
                  <div
                    key={booking.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookingClick(booking);
                    }}
                    className={cn(
                      "text-white rounded px-1.5 py-0.5 text-[10px] font-medium truncate transition-transform hover:scale-105",
                      getStatusColor(booking.status)
                    )}
                  >
                    {booking.time}
                  </div>
                ))}
                {dayBookings.length > (viewMode === "month" ? 2 : 4) && (
                  <div className="text-[10px] text-muted-foreground text-center">
                    +{dayBookings.length - (viewMode === "month" ? 2 : 4)} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
