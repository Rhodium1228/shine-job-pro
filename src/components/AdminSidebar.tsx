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
import { useLocation, useParams } from "react-router-dom";
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

const adminItemsBase = [
  { title: "Dashboard", path: "admin", icon: LayoutDashboard },
  { title: "Staff Management", path: "staff-management", icon: Users },
  { title: "Bookings", path: "booking-management", icon: Calendar },
  { title: "Branches", path: "branch-management", icon: Building2 },
  { title: "Availability", path: "availability-report", icon: Clock },
  { title: "Reports & Analytics", path: "reports-analytics", icon: BarChart3 },
  { title: "Loyalty Config", path: "loyalty-config", icon: Gift },
  { title: "Customer Feedback", path: "customer-feedback", icon: MessageSquare },
  { title: "Invite Staff", path: "staff-invite", icon: UserPlus },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { salonId } = useParams<{ salonId: string }>();
  
  const collapsed = state === "collapsed";

  // Build tenant-scoped URLs
  const adminItems = adminItemsBase.map(item => ({
    ...item,
    url: `/app/${salonId}/${item.path}`
  }));

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
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
