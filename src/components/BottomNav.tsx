import { Home, Calendar, DollarSign, User, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { salonId } = useParams<{ salonId: string }>();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.endsWith("/dashboard")) return "home";
    if (path.endsWith("/calendar")) return "schedule";
    if (path.endsWith("/acsu-wallet")) return "wallet";
    if (path.endsWith("/earnings")) return "earnings";
    if (path.endsWith("/profile")) return "profile";
    return "home";
  };

  const [active, setActive] = useState(getActiveTab());

  const handleNavClick = (id: string, path: string) => {
    setActive(id);
    // Build tenant-scoped path
    const tenantPath = salonId ? `/app/${salonId}/${path}` : `/branch-selector`;
    navigate(tenantPath);
  };

  const navItems = [
    { id: "home", icon: Home, label: "Home", path: "dashboard" },
    { id: "schedule", icon: Calendar, label: "Schedule", path: "calendar" },
    { id: "wallet", icon: Wallet, label: "Wallet", path: "acsu-wallet" },
    { id: "earnings", icon: DollarSign, label: "Earnings", path: "earnings" },
    { id: "profile", icon: User, label: "Profile", path: "profile" },
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
                onClick={() => handleNavClick(item.id, item.path)}
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
