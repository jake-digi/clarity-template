import { SearchIcon, BellIcon, SettingsIcon, ChevronDownIcon } from '../shared/icons/PostmanIcons';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Coffee, Settings, Archive, FilePlus2, Users, ShieldCheck, HardHat, Box, Truck, BarChart3, Database, HeartPulse, Globe, Home } from "lucide-react";
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandFooter,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Sparkles, Terminal, Brain, Search, LayoutDashboard, GanttChart as GanttIcon, ListTodo, History, Info, X } from "lucide-react";
import { AISearchResult, AISearchThinking } from "./AISearchResult";

import { useAuth } from "@/components/auth-provider";

interface TopNavBarProps {
  onNavigateHome?: () => void;
  onNavigateOverview?: () => void;
}

const TopNavBar = ({ onNavigateHome, onNavigateOverview }: TopNavBarProps) => {
  const { user, logout } = useAuth();
  // Always use the Windows-style layout as requested
  const isWindows = true;
  const [activeTab, setActiveTab] = useState("all");
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showAIResults, setShowAIResults] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleMinimize = () => {
    window.ipcRenderer?.send('window-minimize');
  };

  const handleMaximize = () => {
    window.ipcRenderer?.send('window-maximize');
  };

  const handleClose = () => {
    window.ipcRenderer?.send('window-close');
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (!value) {
      setIsThinking(false);
      setShowAIResults(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If we're already showing results or thinking, don't trigger again
    if (isThinking || showAIResults) return;

    if (e.key === 'Enter') {
      const query = searchValue.toLowerCase().trim();
      const aiQueries = [
        "what tasks are overdue",
        "what tasks are overdue and who's responsible for them",
        "overdue tasks",
        "who is responsible for overdue tasks"
      ];

      // Also trigger if the query is reasonably long and seems like a question
      const looksLikeAIQuery = aiQueries.some(q => query.includes(q)) ||
        (query.length > 10 && (query.includes("?") || query.startsWith("what") || query.startsWith("who")));

      if (looksLikeAIQuery) {
        e.preventDefault();
        e.stopPropagation();
        setIsThinking(true);
        setShowAIResults(false);

        setTimeout(() => {
          setIsThinking(false);
          setShowAIResults(true);
        }, 1200);
      }
    }
  };

  return (
    <>
      <div className="h-14 bg-topbar border-b border-border flex items-center px-3 justify-between" style={{ WebkitAppRegion: 'drag' } as any}>
        {/* Left section */}
        <div className="flex items-center gap-1">
          {/* Window controls placeholder - Mac only */}
          {!isWindows && <div className="w-[70px]" />}

          {/* Navigation arrows */}
          {/* <button disabled className="p-1.5 opacity-30 cursor-not-allowed rounded text-muted-foreground" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button disabled className="p-1.5 opacity-30 cursor-not-allowed rounded text-muted-foreground" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button> */}


          {/* Checkpoint. Branding */}
          <div className="flex items-center gap-0.5 pl-1 mr-2 select-none" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <span className="text-md font-bold tracking-tight text-foreground">
              Checkpoint<span className="text-primary">.</span>
            </span>
          </div>

          {/* Home Button */}
          <button
            onClick={onNavigateHome}
            className="px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent rounded flex items-center outline-none"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            Home
          </button>

          {/* Nav items */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent rounded flex items-center gap-1.5 outline-none" style={{ WebkitAppRegion: 'no-drag' } as any}>
                Workspaces
                <ChevronDownIcon className="w-3 h-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[280px] rounded-none border-border z-[100] max-h-[85vh] overflow-y-auto">
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground tracking-tight px-3 py-2">Operations & Execution</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onNavigateOverview}
                className="flex items-center gap-2 py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground rounded-none px-3 font-semibold text-primary"
              >
                <Archive className="w-4 h-4" />
                <span>Project Management</span>
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="flex items-center gap-2 py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground rounded-none px-3 opacity-50">
                <Users className="w-4 h-4" />
                <span>CRM & Client Success</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="flex items-center gap-2 py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground rounded-none px-3 opacity-50">
                <Box className="w-4 h-4" />
                <span>ERP & Manufacturing</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="flex items-center gap-2 py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground rounded-none px-3 opacity-50">
                <Truck className="w-4 h-4" />
                <span>Supply Chain & Logistics</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground tracking-tight px-3 py-2">Governance & Risk</DropdownMenuLabel>
              <DropdownMenuItem disabled className="flex items-center gap-2 py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground rounded-none px-3 opacity-50">
                <ShieldCheck className="w-4 h-4" />
                <span>Quality Assurance (QA/QC)</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="flex items-center gap-2 py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground rounded-none px-3 opacity-50">
                <HardHat className="w-4 h-4" />
                <span>Health, Safety & Environment</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground tracking-tight px-3 py-2">Enterprise Resources</DropdownMenuLabel>
              <DropdownMenuItem disabled className="flex items-center gap-2 py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground rounded-none px-3 opacity-50">
                <FilePlus2 className="w-4 h-4" />
                <span>Financial Control & Payroll</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="flex items-center gap-2 py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground rounded-none px-3 opacity-50">
                <HeartPulse className="w-4 h-4" />
                <span>Human Capital (HR)</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="flex items-center gap-2 py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground rounded-none px-3 opacity-50">
                <Database className="w-4 h-4" />
                <span>Asset & Fleet Management</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground tracking-tight px-3 py-2">Intelligence & Admin</DropdownMenuLabel>
              <DropdownMenuItem disabled className="flex items-center gap-2 py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground rounded-none px-3 opacity-50">
                <BarChart3 className="w-4 h-4" />
                <span>Business Intelligence (BI)</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="flex items-center gap-2 py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground rounded-none px-3 opacity-50">
                <Globe className="w-4 h-4" />
                <span>Marketing & External Site</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="flex items-center gap-2 py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground rounded-none px-3 opacity-50">
                <Settings className="w-4 h-4" />
                <span>IT & System Configuration</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <div
              className="w-full h-9 pl-9 pr-16 bg-secondary/50 border border-border rounded-none text-sm flex items-center text-muted-foreground cursor-text hover:bg-accent/50 transition-colors"
              onClick={() => setOpen(true)}
              style={{ WebkitAppRegion: 'no-drag' } as any}
            >
              Search Checkpoint          </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground text-[10px] font-bold opacity-60">
              <span className="bg-background px-1.5 py-0.5 rounded border border-border">CTRL</span>
              <span className="bg-background px-1.5 py-0.5 rounded border border-border">K</span>
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-accent rounded text-muted-foreground" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <SettingsIcon className="w-5 h-5" />
          </button>

          <div style={{ WebkitAppRegion: 'no-drag' } as any}>
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1.5 hover:bg-accent rounded text-muted-foreground">
                  <BellIcon className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[360px] p-0" align="end" sideOffset={5}>
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h2 className="text-base font-semibold">Notifications</h2>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1">
                    <Settings className="w-3.5 h-3.5" />
                    Notification settings
                  </Button>
                </div>

                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="w-full justify-start h-10 rounded-none border-b bg-transparent p-0 px-4 space-x-6">
                    <TabsTrigger
                      value="direct"
                      className="rounded-none border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent h-full"
                    >
                      Direct (0)
                    </TabsTrigger>
                    <TabsTrigger
                      value="watching"
                      className="rounded-none border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent h-full"
                    >
                      Watching (0)
                    </TabsTrigger>
                    <TabsTrigger
                      value="all"
                      className="rounded-none border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent h-full"
                    >
                      All (0)
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-0">
                    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                      <div className="w-16 h-16 mb-4 text-muted-foreground/40">
                        <Coffee className="w-full h-full stroke-1" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">You're all caught up</h3>
                      <p className="text-sm text-muted-foreground">Time to grab a coffee, or stretch a little.</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="direct" className="mt-0">
                    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                      <div className="w-16 h-16 mb-4 text-muted-foreground/40">
                        <Coffee className="w-full h-full stroke-1" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">You're all caught up</h3>
                      <p className="text-sm text-muted-foreground">Time to grab a coffee, or stretch a little.</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="watching" className="mt-0">
                    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                      <div className="w-16 h-16 mb-4 text-muted-foreground/40">
                        <Coffee className="w-full h-full stroke-1" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">You're all caught up</h3>
                      <p className="text-sm text-muted-foreground">Time to grab a coffee, or stretch a little.</p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="p-2 border-t flex justify-between items-center bg-muted/30">
                  <div className="flex items-center gap-2">
                    <a href="#" className="text-xs text-muted-foreground hover:underline border-b border-muted-foreground/50">Get notified on Slack or Teams</a>
                    <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-medium">Coming Soon</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div style={{ WebkitAppRegion: 'no-drag' } as any}>
            <Popover>
              <PopoverTrigger asChild>
                <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-600 to-green-600 flex items-center justify-center cursor-pointer">
                    <span className="text-white text-xs font-medium">JB</span>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="end" sideOffset={5}>
                <div className="flex flex-col items-center p-6 pb-2">
                  <div className="w-16 h-16 rounded-full bg-sidebar-primary flex items-center justify-center mb-3 relative overflow-hidden ring-4 ring-primary/20">
                    <div className="absolute inset-0 flex items-center justify-center text-sidebar-primary-foreground font-bold text-2xl">
                      {/* Example logo/avatar placeholder */}
                      {user?.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-primary">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg leading-tight">{user?.name || "Jake Blumenow"}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{user?.email || "jakeblumenow99@gmail.com"}</p>
                  </div>

                  <Button variant="outline" className="w-full mt-4 h-9 font-normal">
                    View Profile
                  </Button>
                </div>

                <div className="px-2 py-1 space-y-0.5">
                  <Button variant="ghost" className="w-full justify-start h-9 px-4 font-normal text-foreground/80 hover:text-foreground">
                    Settings
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-9 px-4 font-normal text-foreground/80 hover:text-foreground hover:bg-red-50 hover:text-red-500"
                    onClick={() => {
                      console.log('🔘 Sign Out button clicked');
                      logout();
                    }}
                  >
                    Sign Out
                  </Button>
                </div>

                <div className="border-t mt-1 p-2">
                  <p className="px-4 py-2 text-sm font-medium text-muted-foreground">Switch Accounts</p>
                  <Button variant="ghost" className="w-full justify-start h-10 px-4 font-normal text-foreground/80 hover:text-foreground hover:bg-accent gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </div>
                    Add Account
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Windows Controls */}
          {isWindows && (
            <div className="flex items-center ml-2 border-l border-border pl-2 h-6" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <button onClick={handleMinimize} className="p-2 hover:bg-accent hover:text-foreground text-muted-foreground rounded-sm transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12"><path fill="currentColor" d="M1 6h10" stroke="currentColor" strokeWidth="1" /></svg>
              </button>
              <button onClick={handleMaximize} className="p-2 hover:bg-accent hover:text-foreground text-muted-foreground rounded-sm transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12"><rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
              </button>
              <button onClick={handleClose} className="p-2 hover:bg-red-500 hover:text-white text-muted-foreground rounded-sm transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12"><path fill="none" stroke="currentColor" strokeWidth="1.2" d="M2 2l8 8M10 2l-8 8" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={(val) => {
        setOpen(val);
        if (!val) {
          setShowAIResults(false);
          setIsThinking(false);
          setSearchValue("");
        }
      }}>
        <div className="relative border-b border-border/40">
          <CommandInput
            value={searchValue}
            onValueChange={handleSearchChange}
            onKeyDownCapture={handleKeyDown}
            placeholder="Ask Checkpoint. AI anything..."
            className="border-none pr-12"
          />
        </div>

        {isThinking ? (
          <AISearchThinking />
        ) : showAIResults ? (
          <AISearchResult query={searchValue} onClose={() => setOpen(false)} />
        ) : (
          <CommandList>
            <CommandEmpty>Looking through company records...</CommandEmpty>

            <CommandGroup heading="Checkpoint. Intelligence">
              <CommandItem onSelect={() => handleSearchChange("Analyze CNC Milling Station health")} className="group">
                <Sparkles className="mr-3 h-5 w-5 text-primary animate-pulse" />
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Analyze CNC Milling Station health</span>
                  <span className="text-xs text-muted-foreground">AI will cross-reference tasks, budget, and timeline</span>
                </div>
                <CommandShortcut>AI AGENT</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => handleSearchChange("Draft stakeholder update for Base Sanding")} className="group">
                <Brain className="mr-3 h-5 w-5 text-indigo-500" />
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Draft stakeholder update for Base Sanding</span>
                  <span className="text-xs text-muted-foreground">Generates a summary of recent wins and risks</span>
                </div>
                <CommandShortcut>GENERATE</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => handleSearchChange("Find all blocked tasks across company")} className="group">
                <Search className="mr-3 h-5 w-5 text-emerald-500" />
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Find all blocked tasks across company</span>
                  <span className="text-xs text-muted-foreground">Search through all active projects for bottlenecks</span>
                </div>
                <CommandShortcut>SEARCH</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator className="my-2" />

            <CommandGroup heading="Run Commands">
              <CommandItem>
                <Terminal className="mr-3 h-5 w-5 text-muted-foreground" />
                <span>Toggle System Information Overlay</span>
                <CommandShortcut>⌘SHIFT+I</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <FilePlus2 className="mr-3 h-5 w-5 text-muted-foreground" />
                <span>Create New Project Category...</span>
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <History className="mr-3 h-5 w-5 text-muted-foreground" />
                <span>View Recent API Audit Logs</span>
                <CommandShortcut>⌘L</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator className="my-2" />

            <CommandGroup heading="Project Navigation">
              <CommandItem>
                <LayoutDashboard className="mr-3 h-5 w-5 text-blue-500" />
                <span>Go to Project Overview</span>
                <CommandShortcut>G O</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <ListTodo className="mr-3 h-5 w-5 text-orange-500" />
                <span>Open Global Task Inventory</span>
                <CommandShortcut>G T</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <GanttIcon className="mr-3 h-5 w-5 text-purple-500" />
                <span>View Enterprise Timeline (Gantt)</span>
                <CommandShortcut>G G</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator className="my-2" />

            <CommandGroup heading="Recently Viewed">
              <CommandItem>
                <div className="mr-3 w-5 flex justify-center text-muted-foreground/50">
                  <Info className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">SDM Phase 2</div>
                  <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                    Design & Engineering / Procurement
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground/50 font-mono">3m ago</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        )}
        <CommandFooter />
      </CommandDialog>
    </>
  );
};

export default TopNavBar;
