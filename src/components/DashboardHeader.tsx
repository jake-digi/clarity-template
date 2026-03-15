import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Bell, MessageSquare, User, Users, UserCheck, UsersRound, BedDouble, Briefcase, FileWarning, BarChart3, GitCompareArrows, Building2, ShieldCheck, History, ClipboardCheck, AlertTriangle, LogOut, Settings, Sun, Moon, Plus, UserPlus, FilePlus, MapPin, FolderPlus, Zap, Download, Upload, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import jlgbLogo from "@/assets/jlgb-logo.png";
import { useTheme } from "@/contexts/ThemeContext";

interface SearchItem {
  label: string;
  category: string;
  path: string;
  icon: React.ElementType;
  photoUrl?: string | null;
  initials?: string;
}

interface SearchAction extends SearchItem {
  action?: string;
}

const searchIndex: SearchAction[] = [
  // Navigation
  { label: "Dashboard", category: "Navigation", path: "/", icon: Building2 },
  { label: "Users", category: "Navigation", path: "/people", icon: Users },
  { label: "Participants", category: "Navigation", path: "/participants", icon: UserCheck },
  { label: "Groups", category: "Navigation", path: "/", icon: UsersRound },
  { label: "Accommodation", category: "Navigation", path: "/", icon: BedDouble },
  { label: "Case Management", category: "Navigation", path: "/cases", icon: Briefcase },
  { label: "Reports", category: "Navigation", path: "/reports", icon: BarChart3 },
  { label: "Instances", category: "Navigation", path: "/instances", icon: Building2 },
  { label: "Roles & Permissions", category: "Navigation", path: "/roles", icon: ShieldCheck },
  { label: "Sites", category: "Navigation", path: "/sites", icon: MapPin },
  { label: "Administration", category: "Navigation", path: "/admin", icon: Settings },
  { label: "Audit & History", category: "Navigation", path: "/", icon: History },
  { label: "Attendance", category: "Navigation", path: "/", icon: ClipboardCheck },

  // Quick Actions
  { label: "Invite User", category: "Actions", path: "/admin", icon: UserPlus, action: "invite-user" },
  { label: "Add New Instance", category: "Actions", path: "/instances/new", icon: Plus },
  { label: "Create New Report", category: "Actions", path: "/reports/builder", icon: FilePlus },
  { label: "Add New Case", category: "Actions", path: "/cases", icon: FolderPlus, action: "new-case" },
  { label: "Add New Site", category: "Actions", path: "/sites", icon: MapPin, action: "new-site" },
  { label: "Create New Role", category: "Actions", path: "/roles", icon: ShieldCheck, action: "new-role" },
  { label: "Export Participants", category: "Actions", path: "/participants", icon: Download, action: "export-participants" },
  { label: "Bulk Upload Participants", category: "Actions", path: "/participants", icon: Upload, action: "bulk-upload" },
  { label: "Send Announcement", category: "Actions", path: "/", icon: Send, action: "announcement" },
  { label: "Generate Cross-Instance Report", category: "Actions", path: "/reports/builder", icon: GitCompareArrows },
  { label: "View Strikes Report", category: "Actions", path: "/reports", icon: FileWarning },
];

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
const ProfileMenu = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-9 h-9 rounded-full bg-muted overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring">
          <User className="w-full h-full p-1.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="w-4 h-4 mr-2" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/admin")}>
          <Settings className="w-4 h-4 mr-2" />
          Administration
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ThemeToggle = () => {
  const { resolved, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg hover:bg-muted transition-colors"
      title={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
    >
      {resolved === "dark" ? (
        <Sun className="w-5 h-5 text-muted-foreground" />
      ) : (
        <Moon className="w-5 h-5 text-muted-foreground" />
      )}
    </button>
  );
};

const DashboardHeader = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [participantResults, setParticipantResults] = useState<SearchItem[]>([]);
  const [userResults, setUserResults] = useState<SearchItem[]>([]);
  const [caseResults, setCaseResults] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const pageResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchIndex.filter(
      (item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  // Search participants, users, and cases from Supabase with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() || query.trim().length < 2) {
      setParticipantResults([]);
      setUserResults([]);
      setCaseResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const [participantsRes, usersRes, casesRes] = await Promise.all([
        supabase
          .from("participants")
          .select("id, full_name, photo_link")
          .ilike("full_name", `%${query.trim()}%`)
          .limit(8),
        supabase
          .from("users")
          .select("id, first_name, surname, email, profile_photo_url")
          .or(`first_name.ilike.%${query.trim()}%,surname.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%`)
          .limit(6),
        supabase
          .from("behavior_cases")
          .select("id, category, severity_level, overview, participant_id")
          .or(`overview.ilike.%${query.trim()}%,category.ilike.%${query.trim()}%`)
          .limit(6),
      ]);

      if (participantsRes.data) {
        setParticipantResults(
          participantsRes.data.map((p) => ({
            label: p.full_name,
            category: "Participants",
            path: `/participants/${p.id}`,
            icon: UserCheck,
            photoUrl: p.photo_link,
            initials: getInitials(p.full_name),
          }))
        );
      }

      if (usersRes.data) {
        setUserResults(
          usersRes.data.map((u) => {
            const name = [u.first_name, u.surname].filter(Boolean).join(" ") || u.email;
            return {
              label: name,
              category: "Users",
              path: `/people/${u.id}`,
              icon: User,
              photoUrl: u.profile_photo_url,
              initials: getInitials(name),
            };
          })
        );
      }

      if (casesRes.data) {
        setCaseResults(
          casesRes.data.map((c) => ({
            label: `${c.category} — ${(c.overview ?? "").slice(0, 50)}${(c.overview ?? "").length > 50 ? "…" : ""}`,
            category: "Cases",
            path: `/cases/${c.id}`,
            icon: AlertTriangle,
          }))
        );
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const results = useMemo(
    () => [...pageResults, ...participantResults, ...userResults, ...caseResults],
    [pageResults, participantResults, userResults, caseResults]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cmd/Ctrl+K shortcut
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  const handleSelect = (item: SearchItem) => {
    navigate(item.path);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // Group results by category
  const grouped = results.reduce<Record<string, SearchItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  let flatIndex = -1;

  return (
    <header className="flex items-center px-6 py-3 bg-card border-b border-border">
      <div className="flex items-center gap-2 shrink-0">
        <img src={jlgbLogo} alt="JLGB" className="h-9 w-auto" />
      </div>

      {/* Centered Smart Search */}
      <div className="flex-1 flex justify-center px-8">
        <div ref={containerRef} className="relative w-full max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, actions, people, cases..."
              className="w-full pl-9 pr-20 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            {query ? (
              <button
                onClick={() => { setQuery(""); setParticipantResults([]); setUserResults([]); setCaseResults([]); inputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-medium text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5">
                ⌘K
              </kbd>
            )}
          </div>

          {open && (
            <div className="absolute top-full left-0 mt-1.5 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
              {!query.trim() ? (
                <div className="py-3 px-4 space-y-3">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Try searching for</div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Participants", "Cases", "Users", "Invite", "New Instance", "New Report"].map((hint) => (
                      <button
                        key={hint}
                        onClick={() => { setQuery(hint); }}
                        className="px-2.5 py-1 text-xs rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-1">Search by</div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><User className="w-3.5 h-3.5" /><span>Participant or user name — e.g. "Aaron"</span></div>
                    <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /><span>Page or module name</span></div>
                    <div className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" /><span>Actions — e.g. "Invite", "New Report"</span></div>
                  </div>
                  <div className="border-t border-border pt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span><kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[9px]">↑↓</kbd> Navigate</span>
                    <span><kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[9px]">↵</kbd> Select</span>
                    <span><kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[9px]">Esc</kbd> Close</span>
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="py-1.5 max-h-80 overflow-y-auto">
                  {Object.entries(grouped).map(([category, items]) => (
                    <div key={category}>
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {category}
                      </div>
                      {items.map((item) => {
                        flatIndex++;
                        const idx = flatIndex;
                        const Icon = item.icon;
                        const hasAvatar = item.category === "Participants" || item.category === "Users";
                        const isAction = item.category === "Actions";
                        return (
                          <button
                            key={`${item.path}-${item.label}`}
                            onClick={() => handleSelect(item)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                              idx === selectedIndex
                                ? "bg-accent text-accent-foreground"
                                : "text-foreground hover:bg-muted"
                            }`}
                          >
                            {hasAvatar ? (
                              <Avatar className="h-6 w-6 shrink-0">
                                <AvatarImage src={item.photoUrl ?? undefined} alt={item.label} />
                                <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                  {item.initials ?? <Icon className="w-3 h-3" />}
                                </AvatarFallback>
                              </Avatar>
                            ) : isAction ? (
                              <span className="flex items-center justify-center w-5 h-5 rounded bg-primary/10 shrink-0">
                                <Icon className="w-3.5 h-3.5 text-primary" />
                              </span>
                            ) : (
                              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="font-medium truncate">{item.label}</span>
                            {isAction && (
                              <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Action</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
        </button>
        <ProfileMenu />
      </div>
    </header>
  );
};

export default DashboardHeader;
