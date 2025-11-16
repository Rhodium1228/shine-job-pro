import { useState, useRef, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideToStartProps {
  onComplete: () => void;
  disabled?: boolean;
}

const SlideToStart = ({ onComplete, disabled = false }: SlideToStartProps) => {
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxPosition = useRef(0);

  useEffect(() => {
    if (containerRef.current) {
      maxPosition.current = containerRef.current.offsetWidth - 64; // 64px is button width
    }
  }, []);

  const handleStart = (clientX: number) => {
    if (disabled) return;
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || disabled) return;
    
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const newPosition = Math.max(0, Math.min(clientX - rect.left - 32, maxPosition.current));
    setPosition(newPosition);

    // Trigger completion at 90% of the way
    if (newPosition >= maxPosition.current * 0.9) {
      setIsDragging(false);
      setPosition(maxPosition.current);
      setTimeout(() => {
        onComplete();
      }, 200);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Snap back if not completed
    if (position < maxPosition.current * 0.9) {
      setPosition(0);
    }
  };

  const progressPercentage = (position / maxPosition.current) * 100;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-16 rounded-full bg-muted overflow-hidden",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Progress Background */}
      <div
        className="absolute inset-0 gradient-primary transition-all duration-200"
        style={{ width: `${progressPercentage}%` }}
      />

      {/* Instruction Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={cn(
            "font-semibold transition-all duration-300",
            position > maxPosition.current * 0.3 ? "text-white" : "text-muted-foreground"
          )}
        >
          {position > maxPosition.current * 0.8 ? "Release to Start" : "Slide to Start"}
        </span>
      </div>

      {/* Slider Button */}
      <button
        className={cn(
          "absolute top-2 left-2 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-transform z-10",
          isDragging ? "scale-110" : "scale-100",
          disabled && "cursor-not-allowed"
        )}
        style={{ transform: `translateX(${position}px)` }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        disabled={disabled}
      >
        <ChevronRight
          className={cn(
            "w-6 h-6 transition-colors",
            position > maxPosition.current * 0.3 ? "text-primary" : "text-muted-foreground"
          )}
        />
      </button>
    </div>
  );
};

export default SlideToStart;
