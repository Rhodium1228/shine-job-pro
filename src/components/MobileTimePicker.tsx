import { useState } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MobileTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const MobileTimePicker = ({
  value,
  onChange,
  disabled = false,
  className,
}: MobileTimePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse the time value
  const [hours, minutes] = value.split(":").map(Number);
  const [tempHours, setTempHours] = useState(hours);
  const [tempMinutes, setTempMinutes] = useState(minutes);

  // Preset times
  const presets = [
    { label: "9:00 AM", hours: 9, minutes: 0 },
    { label: "12:00 PM", hours: 12, minutes: 0 },
    { label: "1:00 PM", hours: 13, minutes: 0 },
    { label: "5:00 PM", hours: 17, minutes: 0 },
    { label: "6:00 PM", hours: 18, minutes: 0 },
  ];

  const handlePresetClick = (h: number, m: number) => {
    setTempHours(h);
    setTempMinutes(m);
  };

  const incrementHours = () => {
    setTempHours((prev) => (prev + 1) % 24);
  };

  const decrementHours = () => {
    setTempHours((prev) => (prev - 1 + 24) % 24);
  };

  const incrementMinutes = () => {
    setTempMinutes((prev) => (prev + 15) % 60);
  };

  const decrementMinutes = () => {
    setTempMinutes((prev) => (prev - 15 + 60) % 60);
  };

  const handleDone = () => {
    const formattedTime = `${String(tempHours).padStart(2, "0")}:${String(
      tempMinutes
    ).padStart(2, "0")}`;
    onChange(formattedTime);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempHours(hours);
    setTempMinutes(minutes);
    setIsOpen(false);
  };

  const formatDisplayTime = (h: number, m: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal min-h-[44px]",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {formatDisplayTime(hours, minutes)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
        <div className="bg-background border rounded-lg shadow-lg p-4 max-w-[340px]">
          <div className="text-center mb-4">
            <p className="text-sm font-medium text-muted-foreground">
              Select Time
            </p>
          </div>

          {/* Preset Times */}
          <div className="mb-4 pb-4 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick Select</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(preset.hours, preset.minutes)}
                  className={cn(
                    "min-h-[36px] touch-manipulation text-xs",
                    tempHours === preset.hours && tempMinutes === preset.minutes &&
                      "bg-primary text-primary-foreground"
                  )}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Hours Column */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={incrementHours}
                className="h-10 w-10 touch-manipulation"
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
              <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-lg my-2">
                <span className="text-3xl font-bold text-primary">
                  {String(tempHours).padStart(2, "0")}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={decrementHours}
                className="h-10 w-10 touch-manipulation"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
              <span className="text-xs text-muted-foreground mt-2">Hours</span>
            </div>

            <span className="text-3xl font-bold text-muted-foreground mb-8">:</span>

            {/* Minutes Column */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={incrementMinutes}
                className="h-10 w-10 touch-manipulation"
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
              <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-lg my-2">
                <span className="text-3xl font-bold text-primary">
                  {String(tempMinutes).padStart(2, "0")}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={decrementMinutes}
                className="h-10 w-10 touch-manipulation"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
              <span className="text-xs text-muted-foreground mt-2">Minutes</span>
            </div>
          </div>

          <div className="text-center mb-4">
            <p className="text-lg font-semibold text-foreground">
              {formatDisplayTime(tempHours, tempMinutes)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 min-h-[44px] touch-manipulation"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDone}
              className="flex-1 min-h-[44px] touch-manipulation"
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
