import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "success" | "destructive";
  children: React.ReactNode;
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ variant = "primary", className, children, ...props }, ref) => {
    const gradientClasses = {
      primary: "gradient-primary hover:shadow-glow",
      secondary: "gradient-secondary hover:shadow-glow",
      accent: "gradient-accent hover:shadow-glow",
      success: "gradient-success hover:shadow-glow",
      destructive: "bg-destructive hover:bg-destructive/90",
    };

    return (
      <Button
        ref={ref}
        className={cn(
          "text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95",
          gradientClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

GradientButton.displayName = "GradientButton";
