import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Bell, MessageSquare, User, Users, UserCheck, UsersRound, BedDouble, Briefcase, FileWarning, BarChart3, GitCompareArrows, Building2, ShieldCheck, History, ClipboardCheck, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import jlgbLogo from "@/assets/jlgb-logo.png";

interface SearchItem {
  label: string;
  category: string;
  path: string;
  icon: React.ElementType;
}

const searchIndex: SearchItem[] = [
  { label: "Dashboard", category: "Navigation", path: "/", icon: Building2 },
  { label: "Users", category: "Tenant Overview", path: "/people", icon: Users },
  { label: "Participants", category: "Tenant Overview", path: "/participants", icon: UserCheck },
  { label: "Groups", category: "Tenant Overview", path: "/", icon: UsersRound },
  { label: "Accommodation", category: "Tenant Overview", path: "/", icon: BedDouble },
  { label: "Case Management", category: "Case Management", path: "/", icon: Briefcase },
  { label: "Strikes Report", category: "Reporting", path: "/", icon: FileWarning },
  { label: "Participant Reports", category: "Reporting", path: "/", icon: BarChart3 },
  { label: "Cross-Instance Reports", category: "Reporting", path: "/", icon: GitCompareArrows },
  { label: "Instances", category: "System", path: "/", icon: Building2 },
  { label: "Roles & Permissions", category: "System", path: "/", icon: ShieldCheck },
  { label: "Audit & History", category: "System", path: "/", icon: History },
  { label: "Attendance", category: "System", path: "/", icon: ClipboardCheck },
];

const DashboardHeader = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [participantResults, setParticipantResults] = useState<SearchItem[]>([]);
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

  // Search participants from Supabase with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() || query.trim().length < 2) {
      setParticipantResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("participants")
        .select("id, full_name")
        .ilike("full_name", `%${query.trim()}%`)
        .limit(8);

      if (data) {
        setParticipantResults(
          data.map((p) => ({
            label: p.full_name,
            category: "Participants",
            path: `/participants/${p.id}`,
            icon: User,
          }))
        );
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const results = useMemo(() => [...pageResults, ...participantResults], [pageResults, participantResults]);

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
    <header className="flex items-center justify-between px-6 py-3 bg-card border-b border-border">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <img src={jlgbLogo} alt="JLGB" className="h-9 w-auto" />
        </div>

        {/* Smart Search */}
        <div ref={containerRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, participants..."
              className="w-80 pl-9 pr-20 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            {query ? (
              <button
                onClick={() => { setQuery(""); setParticipantResults([]); inputRef.current?.focus(); }}
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
            <div className="absolute top-full left-0 mt-1.5 w-96 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
              {!query.trim() ? (
                <div className="py-3 px-4 space-y-3">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Try searching for</div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Participants", "Users", "Groups", "Accommodation", "Instances"].map((hint) => (
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
                    <div className="flex items-center gap-2"><User className="w-3.5 h-3.5" /><span>Participant name — e.g. "Aaron"</span></div>
                    <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /><span>Page or module name</span></div>
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
                            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="font-medium">{item.label}</span>
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

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="w-9 h-9 rounded-full bg-muted overflow-hidden">
          <User className="w-full h-full p-1.5 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
