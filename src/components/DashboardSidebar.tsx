import { Home, Users, Building2, UserCog, FolderTree, ClipboardList, MapPin, CheckSquare, Activity, Settings, Shield, PanelLeftClose, PanelLeft, FileWarning, Tent } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useSidebarState } from "@/contexts/SidebarContext";

const coreItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Users, label: "Participants", path: "/participants" },
  { icon: Building2, label: "Instances", path: "/instances" },
  { icon: UserCog, label: "Users", path: "/people" },
  { icon: FolderTree, label: "Groups", path: "/groups" },
  { icon: Tent, label: "Sites", path: "/sites" },
];

const opsItems = [
  { icon: ClipboardList, label: "Stages", path: "/stages" },
  { icon: MapPin, label: "Tracking", path: "/tracking" },
  { icon: CheckSquare, label: "Check-ins", path: "/checkins" },
  { icon: Activity, label: "Activity Log", path: "/activity" },
  { icon: FileWarning, label: "Cases", path: "/cases" },
];

const adminItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: Shield, label: "Roles", path: "/roles" },
];

const DashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { expanded, toggle } = useSidebarState();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const NavButton = ({ icon: Icon, label, path }: { icon: React.ElementType; label: string; path: string }) => {
    const active = isActive(path);
    const button = (
      <button
        onClick={() => navigate(path)}
        className={`flex items-center gap-3 rounded-lg transition-colors ${
          expanded ? "w-full px-3 h-10" : "w-10 h-10 justify-center"
        } ${
          active
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {expanded && <span className="text-sm font-medium truncate">{label}</span>}
      </button>
    );

    if (expanded) return button;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    );
  };

  const SectionLabel = ({ children }: { children: string }) =>
    expanded ? (
      <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 pt-2 pb-1">{children}</p>
    ) : (
      <Separator className="w-6 my-1.5" />
    );

  return (
    <aside
      className={`bg-card border-r border-border flex flex-col items-center py-3 gap-1 shrink-0 transition-all duration-200 ${
        expanded ? "w-52 px-3 items-stretch" : "w-14"
      }`}
    >
      {/* Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggle}
            className={`flex items-center gap-3 rounded-lg h-10 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-1 ${
              expanded ? "w-full px-3" : "w-10 justify-center"
            }`}
          >
            {expanded ? <PanelLeftClose className="w-5 h-5 shrink-0" /> : <PanelLeft className="w-5 h-5" />}
            {expanded && <span className="text-sm font-medium">Collapse</span>}
          </button>
        </TooltipTrigger>
        {!expanded && <TooltipContent side="right" className="text-xs">Expand sidebar</TooltipContent>}
      </Tooltip>

      {expanded ? <SectionLabel>Core</SectionLabel> : <Separator className="w-6 my-1" />}
      {coreItems.map((item) => <NavButton key={item.path} {...item} />)}

      <SectionLabel>Operations</SectionLabel>
      {opsItems.map((item) => <NavButton key={item.path} {...item} />)}

      <div className="flex-1" />

      <SectionLabel>Admin</SectionLabel>
      {adminItems.map((item) => <NavButton key={item.path} {...item} />)}
    </aside>
  );
};

export default DashboardSidebar;
