import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Payment {
  id: string;
  type: "booking" | "tip" | "commission";
  amount: number;
  client: string;
  service: string;
  date: Date;
  status: "completed" | "pending" | "processing";
}

interface PaymentHistoryCardProps {
  payment: Payment;
  onClick?: (payment: Payment) => void;
}

const PaymentHistoryCard = ({ payment, onClick }: PaymentHistoryCardProps) => {
  const typeConfig = {
    booking: { icon: DollarSign, color: "text-success", bg: "bg-success/20", label: "Service Payment" },
    tip: { icon: TrendingUp, color: "text-accent", bg: "bg-accent/20", label: "Tip" },
    commission: { icon: Clock, color: "text-primary", bg: "bg-primary/20", label: "Commission" },
  };

  const statusConfig = {
    completed: { label: "Completed", color: "text-success", icon: CheckCircle },
    pending: { label: "Pending", color: "text-warning", icon: Clock },
    processing: { label: "Processing", color: "text-secondary", icon: Clock },
  };

  const config = typeConfig[payment.type];
  const statusInfo = statusConfig[payment.status];

  return (
    <div
      onClick={() => onClick?.(payment)}
      className="glass-card rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", config.bg)}>
            <config.icon className={cn("w-6 h-6", config.color)} />
          </div>
          <div>
            <p className="font-semibold text-foreground">{payment.client}</p>
            <p className="text-sm text-muted-foreground">{payment.service}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-success">${payment.amount}</p>
          <p className="text-xs text-muted-foreground">{config.label}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          {format(payment.date, "MMM d, h:mm a")}
        </div>
        <div className={cn("flex items-center gap-1 text-xs font-medium", statusInfo.color)}>
          <statusInfo.icon className="w-3 h-3" />
          {statusInfo.label}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryCard;
