import { Clock, User, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { GradientButton } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BookingCardProps {
  booking: {
    id: string;
    clientName: string;
    service: string;
    time: string;
    duration: string;
    status: "pending" | "accepted" | "declined";
    price: string;
  };
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

const BookingCard = ({ booking, onAccept, onDecline }: BookingCardProps) => {
  const handleAccept = () => {
    onAccept(booking.id);
    toast.success("Booking accepted!");
  };

  const handleDecline = () => {
    onDecline(booking.id);
    toast.error("Booking declined");
  };

  const isPending = booking.status === "pending";
  const isAccepted = booking.status === "accepted";

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-5 transition-all duration-300",
        isAccepted && "border-2 border-success/50"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">{booking.clientName}</h4>
            <p className="text-sm text-muted-foreground">{booking.service}</p>
          </div>
        </div>
        {isAccepted && (
          <div className="flex items-center gap-1 text-success text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Accepted
          </div>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-foreground">{booking.time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-secondary" />
          <span className="text-foreground">{booking.duration}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-success" />
          <span className="text-foreground font-semibold">{booking.price}</span>
        </div>
      </div>

      {/* Actions */}
      {isPending && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleDecline}
            variant="outline"
            className="h-11 border-destructive/30 text-destructive hover:bg-destructive/10 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Decline
          </Button>
          <GradientButton
            onClick={handleAccept}
            variant="success"
            className="h-11"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Accept
          </GradientButton>
        </div>
      )}

      {isAccepted && (
        <GradientButton variant="primary" className="w-full h-11">
          Start Job
        </GradientButton>
      )}
    </div>
  );
};

export default BookingCard;
