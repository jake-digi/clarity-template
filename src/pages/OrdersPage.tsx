import { useState, useEffect, useCallback } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
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
  Search, Download, MoreHorizontal, ArrowUpDown, ChevronRight, ChevronLeft,
} from "lucide-react";

type Order = {
  id: string;
  order_number: string | null;
  order_date: string;
  customer_order_number: string | null;
  status: string;
  items_gross: number;
  del_name: string | null;
  customer_name: string;
  account_ref: string;
};

type SortField = "order_number" | "order_date" | "items_gross" | "status";
type SortDir = "asc" | "desc";
const PAGE_SIZE_OPTIONS = [25, 50, 100];

const STATUS_OPTIONS = ["injected", "processing", "failed", "pending"];

const statusStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case "injected": return "bg-emerald-500/10 text-emerald-700";
    case "processing": return "bg-blue-500/10 text-blue-700";
    case "failed": return "bg-red-500/10 text-red-700";
    case "pending": return "bg-amber-500/10 text-amber-700";
    default: return "bg-muted text-muted-foreground";
  }
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("order_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Debounce search so we don't fire a query on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 0 when filters change
  useEffect(() => { setPage(0); }, [debouncedSearch, statusFilter, pageSize]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Not authenticated");
      }

      const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        status: statusFilter,
        q: debouncedSearch,
        sortField,
        sortDir,
      });

      const res = await fetch(`${baseUrl}/functions/v1/list-orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to load orders");
      }

      setTotalCount(json.totalCount ?? 0);
      setOrders(json.orders ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sortField, sortDir, statusFilter, debouncedSearch]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(0);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleExport = async () => {
    // Export all matching rows (not just current page)
    let q = supabase
      .from("sales_orders")
      .select("id, order_number, order_date, customer_order_number, status, items_gross, del_name, customer_id");
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (debouncedSearch) q = q.or(`order_number.ilike.%${debouncedSearch}%,customer_order_number.ilike.%${debouncedSearch}%`);
    q = q.order(sortField, { ascending: sortDir === "asc" });

    const { data } = await q;
    const customerIds = [...new Set((data ?? []).map((o: any) => o.customer_id).filter(Boolean))];
    let customerMap: Record<string, any> = {};
    if (customerIds.length) {
      const { data: customers } = await supabase.from("customers").select("id, name, account_ref").in("id", customerIds);
      customerMap = Object.fromEntries((customers ?? []).map((c: any) => [c.id, c]));
    }

    const rows = [
      ["Order #", "Customer", "Account Ref", "PO Number", "Recipient", "Order Date", "Total", "Status"],
      ...(data ?? []).map((o: any) => [
        o.order_number ?? "",
        customerMap[o.customer_id]?.name ?? "",
        customerMap[o.customer_id]?.account_ref ?? "",
        o.customer_order_number ?? "",
        o.del_name ?? "",
        o.order_date ? new Date(o.order_date).toLocaleDateString("en-GB") : "",
        `£${(o.items_gross ?? 0).toFixed(2)}`,
        o.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-primary" : "text-muted-foreground/50"}`} />
      </button>
    </TableHead>
  );

  const start = totalCount === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalCount);

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
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">Orders</h1>
                  {!isLoading && (
                    <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      {totalCount.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Sales orders from the ordering platform</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[320px] max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order # or PO number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
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
                  <p>Failed to load orders.</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <SortableHeader field="order_number">Order #</SortableHeader>
                      <TableHead>Customer</TableHead>
                      <TableHead>Account Ref</TableHead>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Recipient</TableHead>
                      <SortableHeader field="order_date">Order Date</SortableHeader>
                      <SortableHeader field="items_gross">Total</SortableHeader>
                      <SortableHeader field="status">Status</SortableHeader>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No orders found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((o) => (
                        <TableRow key={o.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-sm text-foreground">{o.order_number ?? "—"}</TableCell>
                          <TableCell className="font-medium text-foreground">{o.customer_name}</TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">{o.account_ref}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{o.customer_order_number ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{o.del_name ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {o.order_date
                              ? new Date(o.order_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                              : "—"}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-foreground text-right">
                            £{(o.items_gross ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusStyle(o.status)}`}>
                              {o.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>View Customer</DropdownMenuItem>
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

          {/* Footer */}
          {!error && (
            <div className="shrink-0 bg-card border-t border-border px-6 py-2.5 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {isLoading ? "Loading…" : `Showing ${start}–${end} of ${totalCount.toLocaleString()} orders`}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rows per page</span>
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
                  </span>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0 || isLoading} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1 || isLoading} onClick={() => setPage(page + 1)}>
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

export default OrdersPage;
