import { Home, Calendar, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const BottomNav = () => {
  const [active, setActive] = useState("home");

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "schedule", icon: Calendar, label: "Schedule" },
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-300",
                  isActive && "gradient-primary"
                )}
              >
                <item.icon
                  className={cn(
                    "w-6 h-6 transition-colors",
                    isActive ? "text-white" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isActive ? "text-white" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
