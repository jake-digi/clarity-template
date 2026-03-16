import { useState, useMemo, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Download, MoreHorizontal, ArrowUpDown,
  ChevronRight, ChevronLeft,
} from "lucide-react";

type Customer = {
  id: string;
  name: string;
  account_ref: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
};

type SortField = "name" | "account_ref" | "total_orders" | "total_spent" | "last_order_date";
type SortDir = "asc" | "desc";
const PAGE_SIZE_OPTIONS = [25, 50, 100];

const CustomersPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("customer_stats")
        .select("*")
        .order("name", { ascending: true });
      if (err) {
        setError(err.message);
      } else {
        setCustomers(data ?? []);
      }
      setIsLoading(false);
    };
    fetchCustomers();
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    return customers
      .filter((c) => {
        const q = search.toLowerCase();
        return !q || c.name.toLowerCase().includes(q) || c.account_ref?.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case "name": cmp = a.name.localeCompare(b.name); break;
          case "account_ref": cmp = (a.account_ref ?? "").localeCompare(b.account_ref ?? ""); break;
          case "total_orders": cmp = (a.total_orders ?? 0) - (b.total_orders ?? 0); break;
          case "total_spent": cmp = (a.total_spent ?? 0) - (b.total_spent ?? 0); break;
          case "last_order_date":
            cmp = (a.last_order_date ?? "").localeCompare(b.last_order_date ?? "");
            break;
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [customers, search, sortField, sortDir]);

  useMemo(() => setPage(0), [search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-primary" : "text-muted-foreground/50"}`} />
      </button>
    </TableHead>
  );

  const handleExport = () => {
    const rows = [
      ["Customer Name", "Account Ref", "Total Orders", "Total Spent", "Last Order", "Status"],
      ...filtered.map((c) => [
        c.name,
        c.account_ref ?? "",
        String(c.total_orders ?? 0),
        `£${(c.total_spent ?? 0).toFixed(2)}`,
        c.last_order_date ? new Date(c.last_order_date).toLocaleDateString("en-GB") : "—",
        (c.total_orders ?? 0) > 0 ? "Active" : "Inactive",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Page Banner */}
          <div className="border-b border-border bg-card px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">Customers</h1>
                  {!isLoading && (
                    <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{customers.length}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Customer directory</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2" onClick={handleExport}>
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 flex-1 max-w-sm" />
                <Skeleton className="h-10 w-[160px]" />
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[320px] max-w-xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or account ref..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Scrollable table */}
          <div className="flex-1 overflow-auto">
            <div className="bg-card overflow-hidden">
              {isLoading ? (
                <div className="p-8 space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 text-center text-destructive">
                  <p>Failed to load customers.</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <SortableHeader field="account_ref">Account Ref</SortableHeader>
                      <SortableHeader field="name">Customer Name</SortableHeader>
                      <SortableHeader field="total_orders">Total Orders</SortableHeader>
                      <SortableHeader field="total_spent">Total Spent</SortableHeader>
                      <SortableHeader field="last_order_date">Last Order</SortableHeader>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No customers found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paged.map((c) => (
                          <TableRow
                            key={c.id}
                            className="hover:bg-muted/50 cursor-pointer"
                            onClick={() => c.account_ref && navigate(`/customers/${encodeURIComponent(c.account_ref)}`)}
                          >
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {c.account_ref ?? "—"}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {c.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-center">
                              {c.total_orders ?? 0}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-foreground">
                              £{(c.total_spent ?? 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {c.last_order_date
                                ? new Date(c.last_order_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); c.account_ref && navigate(`/customers/${encodeURIComponent(c.account_ref)}`); }}>Open Profile</DropdownMenuItem>
                                  <DropdownMenuItem>View Orders</DropdownMenuItem>
                                  <DropdownMenuItem>View Pricing</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Fixed footer */}
          {!isLoading && !error && (
            <div className="shrink-0 bg-card border-t border-border px-6 py-2.5 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Showing {filtered.length === 0 ? 0 : page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length} results
                {filtered.length < customers.length && <span> (filtered from {customers.length} total)</span>}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-xs">Rows per page</span>
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-xs">
                    {filtered.length === 0 ? "0" : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, filtered.length)}`} of {filtered.length}
                  </span>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CustomersPage;
