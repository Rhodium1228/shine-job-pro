import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              {/* Desktop Sidebar Toggle */}
              <SidebarTrigger className="hidden lg:flex" />

              {/* Mobile Menu Trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="py-4">
                    <div className="px-4 pb-2">
                      <h2 className="text-lg font-semibold">Admin Portal</h2>
                    </div>
                    <nav className="space-y-1 px-2">
                      {[
                        { title: "Dashboard", url: "/admin", icon: "📊" },
                        { title: "Staff Management", url: "/staff-management", icon: "👥" },
                        { title: "Bookings", url: "/booking-management", icon: "📅" },
                        { title: "Branches", url: "/branch-management", icon: "🏢" },
                        { title: "Availability", url: "/availability-report", icon: "🕐" },
                        { title: "Reports", url: "/reports-analytics", icon: "📈" },
                        { title: "Loyalty Config", url: "/loyalty-config", icon: "🎁" },
                        { title: "Feedback", url: "/customer-feedback", icon: "💬" },
                        { title: "Invite Staff", url: "/staff-invite", icon: "✉️" },
                      ].map((item) => (
                        <button
                          key={item.url}
                          onClick={() => {
                            navigate(item.url);
                            setMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span>{item.title}</span>
                        </button>
                      ))}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>

              {/* App Title */}
              <div className="flex-1">
                <h1 className="text-lg font-semibold">BMS Pro Admin</h1>
              </div>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
