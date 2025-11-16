import { Clock, User, DollarSign, MapPin, Phone, Mail, X } from "lucide-react";
import { GradientButton } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Booking {
  id: string;
  clientName: string;
  service: string;
  time: string;
  duration: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  price: string;
  date: Date;
  phone?: string;
  email?: string;
  notes?: string;
}

interface BookingDetailSheetProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartJob?: (booking: Booking) => void;
}

const BookingDetailSheet = ({ booking, open, onOpenChange, onStartJob }: BookingDetailSheetProps) => {
  if (!booking) return null;

  const statusConfig = {
    pending: { label: "Pending", color: "text-warning", bg: "bg-warning/20" },
    accepted: { label: "Accepted", color: "text-success", bg: "bg-success/20" },
    completed: { label: "Completed", color: "text-primary", bg: "bg-primary/20" },
    cancelled: { label: "Cancelled", color: "text-destructive", bg: "bg-destructive/20" },
  };

  const config = statusConfig[booking.status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <div className="h-full flex flex-col">
          {/* Header */}
          <SheetHeader className="gradient-primary text-white p-6 pb-8 rounded-t-3xl">
            <div className="flex items-center justify-between mb-4">
              <SheetTitle className="text-white text-xl">Booking Details</SheetTitle>
              <Button
                onClick={() => onOpenChange(false)}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{booking.clientName}</h3>
                <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mt-2", config.bg, config.color)}>
                  <div className="w-2 h-2 rounded-full bg-current" />
                  {config.label}
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Service Info */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Service</p>
                <p className="text-lg font-semibold text-foreground">{booking.service}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-semibold text-foreground">{booking.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold text-foreground">{booking.duration}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold text-success">{booking.price}</p>
                </div>
              </div>
            </div>

            {/* Client Info */}
            {(booking.phone || booking.email) && (
              <div className="glass-card rounded-2xl p-5 space-y-3">
                <h4 className="font-semibold text-foreground mb-3">Client Contact</h4>
                
                {booking.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium text-foreground">{booking.phone}</p>
                    </div>
                  </div>
                )}

                {booking.email && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground">{booking.email}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {booking.notes && (
              <div className="glass-card rounded-2xl p-5">
                <h4 className="font-semibold text-foreground mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {booking.status === "accepted" && onStartJob && (
            <div className="p-6 border-t border-border bg-background">
              <GradientButton
                onClick={() => onStartJob(booking)}
                variant="primary"
                className="w-full h-14 text-lg"
              >
                Start Job
              </GradientButton>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookingDetailSheet;
