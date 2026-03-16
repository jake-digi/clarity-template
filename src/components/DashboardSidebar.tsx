import { Home, Users, Building2, PanelLeftClose, PanelLeft, FileWarning, Tent, Wrench, FileBarChart, Bus, Package, CalendarDays, Heart, CheckSquare, Megaphone, FileText, X, ShoppingCart, LayoutGrid, RefreshCw, Tag } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useSidebarState } from "@/contexts/SidebarContext";

const coreItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Building2, label: "Customers", path: "/customers" },
  { icon: ShoppingCart, label: "Orders", path: "/orders" },
];

const catalogueItems = [
  { icon: LayoutGrid, label: "Catalogue", path: "/catalogue" },
  { icon: Tag, label: "Pricing", path: "/pricing" },
];

const caseItems = [
  { icon: FileBarChart, label: "Reports", path: "/reports" },
  { icon: RefreshCw, label: "Sync", path: "/sync" },
];

const adminItems = [
  { icon: Wrench, label: "Administration", path: "/admin" },
];

const DashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { expanded, toggle, isMobile, mobileOpen, setMobileOpen } = useSidebarState();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const NavButton = ({ icon: Icon, label, path }: { icon: React.ElementType; label: string; path: string }) => {
    const active = isActive(path);
    const showLabel = isMobile || expanded;
    const button = (
      <button
        onClick={() => handleNav(path)}
        className={`flex items-center gap-3 rounded-lg transition-colors ${
          showLabel ? "w-full px-3 h-10" : "w-10 h-10 justify-center"
        } ${
          active
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {showLabel && <span className="text-sm font-medium truncate">{label}</span>}
      </button>
    );

    if (showLabel) return button;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    );
  };

  const SectionLabel = ({ children }: { children: string }) =>
    isMobile || expanded ? (
      <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 pt-2 pb-1">{children}</p>
    ) : (
      <Separator className="w-6 my-1.5" />
    );

  const sidebarContent = (
    <>
      {/* Toggle (desktop only) */}
      {!isMobile && (
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
      )}

      {/* Mobile close */}
      {isMobile && (
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-sm font-semibold text-foreground">Menu</span>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      )}

      {(isMobile || expanded) ? <SectionLabel>Core</SectionLabel> : <Separator className="w-6 my-1" />}
      {coreItems.map((item) => <NavButton key={item.path} {...item} />)}

      <SectionLabel>Products</SectionLabel>
      {catalogueItems.map((item) => <NavButton key={item.path} {...item} />)}

      <SectionLabel>Reports & Sync</SectionLabel>
      {caseItems.map((item) => <NavButton key={item.path} {...item} />)}

      <div className="flex-1" />

      <SectionLabel>Admin</SectionLabel>
      {adminItems.map((item) => <NavButton key={item.path} {...item} />)}
    </>
  );

  // Mobile: slide-out drawer
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
        )}
        {/* Drawer */}
        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col py-3 px-3 gap-1 transition-transform duration-200 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  // Desktop: static sidebar
  return (
    <aside
      className={`bg-card border-r border-border flex flex-col items-center py-3 gap-1 shrink-0 transition-all duration-200 ${
        expanded ? "w-52 px-3 items-stretch" : "w-14"
      }`}
    >
      {sidebarContent}
    </aside>
  );
};

export default DashboardSidebar;
