import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Bell, MessageSquare, User, Users, Building2, ShieldCheck, LogOut, Settings, Sun, Moon, UserPlus, FilePlus, BarChart3, Package, ShoppingCart, Tag, RefreshCw, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import freemansLogo from "@/assets/freemans-logo.webp";
import { useTheme } from "@/contexts/ThemeContext";
import { useSidebarState } from "@/contexts/SidebarContext";

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
  { label: "Dashboard", category: "Navigation", path: "/", icon: Building2 },
  { label: "Customers", category: "Navigation", path: "/customers", icon: Building2 },
  { label: "Orders", category: "Navigation", path: "/orders", icon: ShoppingCart },
  { label: "Catalogue", category: "Navigation", path: "/catalogue", icon: Package },
  { label: "Pricing", category: "Navigation", path: "/pricing", icon: Tag },
  { label: "Reports", category: "Navigation", path: "/reports", icon: BarChart3 },
  { label: "Sync", category: "Navigation", path: "/sync", icon: RefreshCw },
  { label: "Administration", category: "Navigation", path: "/admin", icon: Settings },
  { label: "Invite User", category: "Actions", path: "/admin", icon: UserPlus, action: "invite-user" },
  { label: "Create New Report", category: "Actions", path: "/reports/builder", icon: FilePlus },
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
          <User className="w-4 h-4 mr-2" />My Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/admin")}>
          <Settings className="w-4 h-4 mr-2" />Administration
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4 mr-2" />Sign out
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
      {resolved === "dark" ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
    </button>
  );
};

const DashboardHeader = () => {
  const navigate = useNavigate();
  const { isMobile, setMobileOpen } = useSidebarState();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customerResults, setCustomerResults] = useState<SearchItem[]>([]);
  const [productResults, setProductResults] = useState<SearchItem[]>([]);
  const [orderResults, setOrderResults] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const db = supabase as any;

  const pageResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchIndex.filter(
      (item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setCustomerResults([]);
      setProductResults([]);
      setOrderResults([]);
      return;
    }
    const q = query.trim();
    const qLike = `%${q}%`;
    debounceRef.current = setTimeout(async () => {
      const [customersRes, productsRes, ordersRes] = await Promise.all([
        db.from("customers").select("id, name, account_ref").or(`name.ilike.${qLike},account_ref.ilike.${qLike}`).limit(6),
        db.from("products").select("id, stock_code, description").or(`stock_code.ilike.${qLike},description.ilike.${qLike}`).limit(6),
        db.from("sales_orders").select("id, order_number, customer_order_number").or(`order_number.ilike.${qLike},customer_order_number.ilike.${qLike}`).limit(6),
      ]);
      if (customersRes.data) setCustomerResults(customersRes.data.map((c: any) => ({ label: `${c.name} (${c.account_ref})`, category: "Customers", path: `/customers/${encodeURIComponent(c.account_ref)}`, icon: Building2, initials: getInitials(c.name ?? "") })));
      if (productsRes.data) setProductResults(productsRes.data.map((p: any) => ({ label: p.description ? `${p.stock_code} — ${p.description}` : p.stock_code, category: "Products", path: `/products/${encodeURIComponent(p.stock_code)}`, icon: Package })));
      if (ordersRes.data) setOrderResults(ordersRes.data.map((o: any) => ({ label: o.order_number ? `Order ${o.order_number}` : `Order ${o.id}`, category: "Orders", path: `/orders/${o.id}`, icon: ShoppingCart })));
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const results = useMemo(() => [...pageResults, ...customerResults, ...productResults, ...orderResults], [pageResults, customerResults, productResults, orderResults]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); if (isMobile) { setMobileSearchOpen(true); } else { inputRef.current?.focus(); setOpen(true); } }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [isMobile]);

  const handleSelect = (item: SearchItem) => {
    navigate(item.path);
    setQuery(""); setOpen(false); setMobileSearchOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && results[selectedIndex]) handleSelect(results[selectedIndex]);
    else if (e.key === "Escape") { setOpen(false); setMobileSearchOpen(false); inputRef.current?.blur(); }
  };

  const grouped = results.reduce<Record<string, SearchItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  let flatIndex = -1;

  const searchDropdown = (
    <>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {!query.trim() ? (
            <div className="py-3 px-4 space-y-3">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Try searching for</div>
              <div className="flex flex-wrap gap-1.5">
                {["Customers", "Products", "Orders", "Pricing", "Catalogue"].map((hint) => (
                  <button key={hint} onClick={() => setQuery(hint)} className="px-2.5 py-1 text-xs rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">{hint}</button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">No results for "{query}"</div>
          ) : (
            <div className="py-1.5 max-h-80 overflow-y-auto">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{category}</div>
                  {items.map((item) => {
                    flatIndex++;
                    const idx = flatIndex;
                    const Icon = item.icon;
                    const hasAvatar = item.category === "Customers";
                    const isAction = item.category === "Actions";
                    return (
                      <button key={`${item.path}-${item.label}`} onClick={() => handleSelect(item)} className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${idx === selectedIndex ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted"}`}>
                        {hasAvatar ? (
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={item.photoUrl ?? undefined} alt={item.label} />
                            <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">{item.initials ?? <Icon className="w-3 h-3" />}</AvatarFallback>
                          </Avatar>
                        ) : isAction ? (
                          <span className="flex items-center justify-center w-5 h-5 rounded bg-primary/10 shrink-0"><Icon className="w-3.5 h-3.5 text-primary" /></span>
                        ) : (
                          <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-medium truncate">{item.label}</span>
                        {isAction && <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Action</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      <header className="flex items-center px-3 md:px-6 py-2 md:py-3 bg-card border-b border-border gap-2">
        {/* Mobile hamburger */}
        {isMobile && (
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0">
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <img src={freemansLogo} alt="Freemans Industrial Supplies" className="h-7 md:h-9 w-auto" />
        </div>

        {/* Desktop search */}
        {!isMobile && (
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
                  placeholder="Search customers, products, orders, pages..."
                  className="w-full pl-9 pr-20 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                {query ? (
                  <button onClick={() => { setQuery(""); setCustomerResults([]); setProductResults([]); setOrderResults([]); inputRef.current?.focus(); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
                ) : (
                  <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-medium text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5">⌘K</kbd>
                )}
              </div>
              {searchDropdown}
            </div>
          </div>
        )}

        {/* Spacer on mobile */}
        {isMobile && <div className="flex-1" />}

        {/* Mobile search icon */}
        {isMobile && (
          <button onClick={() => setMobileSearchOpen(true)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
        )}

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="hidden md:block p-2 rounded-lg hover:bg-muted transition-colors">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </button>
          <ProfileMenu />
        </div>
      </header>

      {/* Mobile search overlay */}
      {isMobile && mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
          <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="flex-1 bg-transparent text-foreground text-base placeholder:text-muted-foreground focus:outline-none"
            />
            <button onClick={() => { setMobileSearchOpen(false); setQuery(""); setOpen(false); }} className="p-1.5 rounded-lg hover:bg-muted text-sm text-muted-foreground">Cancel</button>
          </div>
          <div className="flex-1 overflow-auto" ref={containerRef}>
            {!query.trim() ? (
              <div className="p-4 space-y-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Try searching for</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Customers", "Products", "Orders", "Pricing", "Catalogue"].map((hint) => (
                    <button key={hint} onClick={() => { setQuery(hint); setOpen(true); }} className="px-3 py-1.5 text-sm rounded-md bg-muted text-muted-foreground">{hint}</button>
                  ))}
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">No results for "{query}"</div>
            ) : (
              <div className="py-1">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{category}</div>
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button key={`${item.path}-${item.label}`} onClick={() => handleSelect(item)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-foreground hover:bg-muted active:bg-accent">
                          <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardHeader;
