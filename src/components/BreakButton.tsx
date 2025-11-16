import { Coffee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreakButtonProps {
  isOnBreak?: boolean;
  className?: string;
}

const BreakButton = ({ isOnBreak = false, className }: BreakButtonProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/break-timer")}
      className={cn(
        "relative w-full rounded-2xl p-4 transition-all duration-300 hover:scale-105 active:scale-95",
        isOnBreak
          ? "gradient-accent border-2 border-accent/50 animate-pulse-glow"
          : "glass-card hover:shadow-lg",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            isOnBreak ? "bg-white/20" : "gradient-accent"
          )}
        >
          <Coffee className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className={cn(
            "font-semibold",
            isOnBreak ? "text-white" : "text-foreground"
          )}>
            {isOnBreak ? "Break in Progress" : "Take a Break"}
          </p>
          <p className={cn(
            "text-sm",
            isOnBreak ? "text-white/80" : "text-muted-foreground"
          )}>
            {isOnBreak ? "Tap to end break" : "Track your break time"}
          </p>
        </div>
        {isOnBreak && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
        )}
      </div>
    </button>
  );
};

export default BreakButton;
