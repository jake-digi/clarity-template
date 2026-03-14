import { Home, Users, Building2, UserCog, FolderTree, ClipboardList, MapPin, CheckSquare, Activity, Settings, Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const coreItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Users, label: "Participants", path: "/participants" },
  { icon: Building2, label: "Instances", path: "/instances" },
  { icon: UserCog, label: "Users", path: "/people" },
  { icon: FolderTree, label: "Groups", path: "/groups" },
];

const opsItems = [
  { icon: ClipboardList, label: "Stages", path: "/stages" },
  { icon: MapPin, label: "Tracking", path: "/tracking" },
  { icon: CheckSquare, label: "Check-ins", path: "/checkins" },
  { icon: Activity, label: "Activity Log", path: "/activity" },
];

const adminItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: Shield, label: "Roles", path: "/roles" },
];

const DashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const NavButton = ({ icon: Icon, label, path }: { icon: React.ElementType; label: string; path: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => navigate(path)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isActive(path)
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Icon className="w-5 h-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <aside className="w-14 bg-card border-r border-border flex flex-col items-center py-4 gap-1.5 shrink-0">
      {coreItems.map((item) => (
        <NavButton key={item.path} {...item} />
      ))}
      <Separator className="w-6 my-1.5" />
      {opsItems.map((item) => (
        <NavButton key={item.path} {...item} />
      ))}
      <div className="flex-1" />
      <Separator className="w-6 my-1.5" />
      {adminItems.map((item) => (
        <NavButton key={item.path} {...item} />
      ))}
    </aside>
  );
};

export default DashboardSidebar;
