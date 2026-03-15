import {
  Search,
  Trash2,
  History,
  Bell,
  Database,
  HelpCircle,
  Settings2,
  CheckCircle2,
  RefreshCw,
  Bug,
  Sidebar as SidebarIcon,
  LayoutList,
  Fingerprint,
  Copy,
  ExternalLink,
  MessageSquare,
  Activity,
  Globe,
  Wifi,
  Server as ServerIcon,
  Moon,
  Sun,
  PersonStanding,
  Type,
  Zap,
  Eye,
  Minimize
} from 'lucide-react';
import { systemHealth } from "@/data/mockData-old";
import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { useAccessibility } from "@/components/accessibility-provider";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BottomBarItem = ({
  icon: Icon,
  label,
  onClick
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}) => (
  <button onClick={onClick} className="h-full px-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:bg-accent border-r border-border/50">
    <Icon className="w-3.5 h-3.5" />
    <span>{label}</span>
  </button>
);

const BottomBar = ({
  isSidebarCollapsed,
  onToggleSidebar,
  isRailCollapsed,
  onToggleRail,
  sidebarToggleDisabled
}: {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isRailCollapsed?: boolean;
  onToggleRail?: () => void;
  sidebarToggleDisabled?: boolean;
}) => {
  const { theme, setTheme } = useTheme();
  const {
    highContrast, setHighContrast,
    reducedMotion, setReducedMotion,
    fontSize, setFontSize,
    dyslexicFont, setDyslexicFont,
    saturation, setSaturation,
    resetToDefaults
  } = useAccessibility();

  const triggerBugReport = () => {
    const target = document.getElementById('bug-report-trigger-target');
    if (target) target.click();
  };

  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sessionId = useMemo(() => {
    return `${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  }, []);

  const handleRefreshConnection = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("System connectivity re-verified", {
        description: "All services operational on CNCR-01"
      });
    }, 1500);
  };

  const handleCopySession = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sessionId);
    toast.success("Session ID copied to clipboard", {
      description: "You can now paste this for support troubleshooting."
    });
  };

  const iconMap: any = {
    Wifi: Wifi,
    Globe: Globe,
    Activity: Activity
  };

  return (
    <div className="h-7 bg-card border-t border-border flex items-center justify-between px-2 relative">
      {/* Left section */}
      <div className="flex items-center h-full">
        <button
          className={`h-full px-2 flex items-center hover:bg-accent border-r border-border/50 transition-colors ${isRailCollapsed ? 'text-primary' : 'text-muted-foreground'}`}
          onClick={onToggleRail}
          title={isRailCollapsed ? "Expand Navigation Rail" : "Collapse Navigation Rail"}
        >
          <div className="flex items-center justify-center">
            <LayoutList className="w-3 h-3" />
            <div className={`overflow-hidden transition-opacity duration-300 ${isRailCollapsed ? 'w-0' : 'w-2 ml-1 text-[8px]'}`}>
              {isRailCollapsed ? "" : "«"}
            </div>
          </div>
        </button>
        <button
          disabled={sidebarToggleDisabled}
          className={cn(
            "h-full px-2 flex items-center border-r border-border/50",
            sidebarToggleDisabled ? "opacity-20 cursor-not-allowed" : "hover:bg-accent text-muted-foreground",
            !sidebarToggleDisabled && isSidebarCollapsed && "text-primary"
          )}
          onClick={onToggleSidebar}
          title={sidebarToggleDisabled ? "Sidebar disabled" : (isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar")}
        >
          <SidebarIcon className="w-3.5 h-3.5" />
        </button>
        <BottomBarItem icon={Search} label="Search" />
        {/* <BottomBarItem icon={History} label="Audit" /> */}
        <BottomBarItem icon={Bell} label="Alerts" />
      </div>

      {/* Right section */}
      <div className="flex items-center h-full">
        {/* <button
          onClick={() => setShowConnectionDialog(true)}
          className="flex items-center gap-1.5 px-3 text-[10px] text-green-600 font-medium border-l border-border/50 h-full hover:bg-green-50/50 transition-colors group cursor-pointer"
        >
          <CheckCircle2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
          <span>Connected - {sessionId}</span>
        </button> */}

        {/* System Connectivity Dialog */}
        <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
          <DialogContent className="sm:max-w-[400px] rounded-sm border-border p-0 overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.15)] bg-card">
            <div className="bg-card border-b border-border/50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 flex items-center justify-center rounded-sm border border-green-500/20">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-foreground leading-none">System Connectivity</h3>
                  <p className="text-muted-foreground text-[12px] mt-1.5 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Operational & Synced
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2">
                {systemHealth.metrics.map((m) => {
                  const IconComp = iconMap[m.icon] || Activity;
                  return (
                    <div key={m.label} className="bg-accent/50 border border-border/50 p-3 rounded-sm flex flex-col items-center gap-1.5">
                      <IconComp className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[14px] font-bold text-foreground">{m.value}</span>
                      <span className="text-[9px] font-semibold text-muted-foreground tracking-tight">{m.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Service Health List */}
              <div className="space-y-3">
                <label className="text-[11px] font-semibold text-muted-foreground tracking-tight">Service Health Matrix</label>
                <div className="border border-border/50 rounded-sm divide-y divide-border/30">
                  {systemHealth.services.map((s) => (
                    <div key={s.name} className="flex items-center justify-between px-3 py-2.5 bg-card group hover:bg-accent transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-foreground">{s.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{s.node}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-green-600">{s.status}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 p-3 rounded-sm flex items-start gap-3">
                <div className="p-1 bg-card rounded-sm border border-primary/10 mt-0.5">
                  <ServerIcon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="space-y-1">
                  <span className="text-[12px] font-bold text-foreground">Active Gateway: CNCR-01</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Your session is currently routed through the Birmingham primary node with encrypted sync enabled.</p>
                </div>
              </div>
            </div>

            <div className="bg-accent/30 border-t border-border px-6 py-4 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground tracking-tight">Last Sync: 2 minutes ago</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConnectionDialog(false)}
                  className="bg-card border border-border px-4 py-1.5 text-[12px] font-bold text-muted-foreground hover:bg-accent transition-colors rounded-sm"
                >
                  Close
                </button>
                <button
                  onClick={handleRefreshConnection}
                  disabled={isRefreshing}
                  className="bg-white dark:bg-card border border-border px-4 py-1.5 text-[12px] font-bold text-primary hover:border-primary hover:bg-primary/10 transition-colors rounded-sm flex items-center gap-2"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                  {isRefreshing ? "Refreshing..." : "Re-verify"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Support Dialog - Postman Styled */}
        <Dialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
          <DialogContent className="sm:max-w-[420px] rounded-sm border-border p-0 overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.15)] bg-card">
            <div className="bg-card border-b border-border/50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-sm border border-primary/20">
                  <Fingerprint className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-foreground leading-none">Diagnostic Center</h3>
                  <p className="text-muted-foreground text-[12px] mt-1.5 font-medium">Troubleshooting & Session Support</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-7">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-muted-foreground tracking-tight">Active Troubleshooting ID</label>
                </div>
                <div className="flex items-center justify-between bg-accent/50 border border-border/50 px-4 py-3 rounded-sm group relative">
                  <span className="font-mono text-[20px] font-bold text-foreground tracking-wider">
                    {sessionId}
                  </span>
                  <button
                    onClick={handleCopySession}
                    className="p-2 hover:bg-card rounded-sm transition-colors border border-transparent hover:border-border group/copy"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground/60 group-hover/copy:text-primary transition-colors" />
                  </button>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Provide this identification code when speaking with technical operations to identify your current system context.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <label className="text-[11px] font-semibold text-muted-foreground tracking-tight">Available Support Channels</label>
                <div className="grid grid-cols-1 gap-2">
                  <button className="flex items-center justify-between px-3 py-2.5 bg-card border border-border hover:border-primary/40 hover:bg-accent transition-colors text-[13px] font-semibold text-foreground group rounded-sm">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      Live Chat Support
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground" />
                  </button>
                  <button className="flex items-center justify-between px-3 py-2.5 bg-card border border-border hover:border-primary/40 hover:bg-accent transition-colors text-[13px] font-semibold text-foreground group rounded-sm">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      Technical Documentation
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-accent/30 border-t border-border px-6 py-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-semibold text-muted-foreground tracking-tight leading-none mb-1">Instance Node</span>
                <span className="text-[11px] font-bold text-foreground">CNCR-01</span>
              </div>
              <button
                onClick={() => setShowSupportDialog(false)}
                className="bg-card border border-border px-6 py-1.5 text-[12px] font-bold text-foreground hover:bg-accent transition-colors rounded-sm"
              >
                Close
              </button>
            </div>
          </DialogContent>
        </Dialog>
        {/* <BottomBarItem icon={RefreshCw} label="Sync" />
        <BottomBarItem icon={Database} label="Backups" /> */}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-full px-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:bg-accent border-r border-border/50">
              <PersonStanding className="w-3.5 h-3.5" />
              <span>Accessibility</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-4 z-[100]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold leading-none">Accessibility</h4>
              <button
                onClick={resetToDefaults}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Reset
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" /> High Contrast
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Increase color contrast</p>
                </div>
                <Switch
                  checked={highContrast}
                  onCheckedChange={setHighContrast}
                  className="h-4 w-7"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> Reduced Motion
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Minimize animations</p>
                </div>
                <Switch
                  checked={reducedMotion}
                  onCheckedChange={setReducedMotion}
                  className="h-4 w-7"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs flex items-center gap-2">
                    <Type className="w-3.5 h-3.5" /> Dyslexic Font
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Use Lexend font</p>
                </div>
                <Switch
                  checked={dyslexicFont}
                  onCheckedChange={setDyslexicFont}
                  className="h-4 w-7"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-2">
                    <Minimize className="w-3.5 h-3.5" /> Text Size
                  </Label>
                  <span className="text-[10px] text-muted-foreground">{fontSize}%</span>
                </div>
                <Slider
                  value={[fontSize]}
                  onValueChange={(val) => setFontSize(val[0])}
                  min={80}
                  max={200}
                  step={5}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5" /> Color Saturation
                  </Label>
                  <span className="text-[10px] text-muted-foreground">{saturation}%</span>
                </div>
                <Slider
                  value={[saturation]}
                  onValueChange={(val) => setSaturation(val[0])}
                  min={0}
                  max={200}
                  step={10}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-full px-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:bg-accent border-r border-border/50">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-none border-border z-[100]">
            <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground tracking-tight px-3 py-2">Support & Resources</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground rounded-none px-3 text-xs">
              Documentation
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground rounded-none px-3 text-xs">
              Video Tutorials
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={triggerBugReport}
              className="py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground rounded-none px-3 text-xs flex items-center gap-2 text-primary font-bold"
            >
              <Bug className="w-3.5 h-3.5" />
              Report a Bug
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* <button className="h-full px-2 flex items-center text-muted-foreground hover:bg-accent" title="Settings">
          <Settings2 className="w-3.5 h-3.5" />
        </button> */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-full px-2 flex items-center text-muted-foreground hover:bg-accent border-l border-border/50 transition-colors"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </button>
      </div>


      {/* Sync Status Button overlay (previous AI button area) */}
      {/* <button className="absolute right-4 bottom-10 w-9 h-9 bg-primary text-white border-0 rounded-none flex items-center justify-center hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all z-50">
        <RefreshCw className="w-4 h-4" />
      </button> */}
    </div>
  );
};

export default BottomBar;
