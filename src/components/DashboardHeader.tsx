import { useState, useRef, useEffect } from "react";
import { Search, Bell, MessageSquare, User, Users, UserCheck, UsersRound, BedDouble, Briefcase, FileWarning, BarChart3, GitCompareArrows, Building2, ShieldCheck, History, ClipboardCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim()
    ? searchIndex.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

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
              placeholder="Search pages, modules, people..."
              className="w-80 pl-9 pr-8 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {open && query.trim() && (
            <div className="absolute top-full left-0 mt-1.5 w-96 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
              {results.length === 0 ? (
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
                            key={item.label}
                            onClick={() => handleSelect(item)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                              idx === selectedIndex
                                ? "bg-accent text-accent-foreground"
                                : "text-foreground hover:bg-muted"
                            }`}
                          >
                            <Icon className="w-4 h-4 text-icon-primary shrink-0" />
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
