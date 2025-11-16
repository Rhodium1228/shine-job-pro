import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Building2, 
  BarChart3, 
  Gift, 
  MessageSquare, 
  UserPlus,
  Clock
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Staff Management", url: "/staff-management", icon: Users },
  { title: "Bookings", url: "/booking-management", icon: Calendar },
  { title: "Branches", url: "/branch-management", icon: Building2 },
  { title: "Availability", url: "/availability-report", icon: Clock },
  { title: "Reports & Analytics", url: "/reports-analytics", icon: BarChart3 },
  { title: "Loyalty Config", url: "/loyalty-config", icon: Gift },
  { title: "Customer Feedback", url: "/customer-feedback", icon: MessageSquare },
  { title: "Invite Staff", url: "/staff-invite", icon: UserPlus },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar
      className={collapsed ? "w-16" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "px-2" : ""}>
            {collapsed ? "Admin" : "Admin Portal"}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/admin'}
                      className="hover:bg-accent hover:text-accent-foreground"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
