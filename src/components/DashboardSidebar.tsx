import { Home, BarChart3, Users, Newspaper, Settings, Waypoints } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { icon: Home, label: "Home" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Waypoints, label: "Processes" },
  { icon: Newspaper, label: "News" },
  { icon: Users, label: "Contacts" },
  { icon: Settings, label: "Settings" },
];

const DashboardSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item, i) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={i === 0}
                    className={
                      i === 0
                        ? "bg-accent text-icon-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {!collapsed && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default DashboardSidebar;
