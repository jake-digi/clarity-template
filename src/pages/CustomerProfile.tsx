import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowUpDown,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Search,
  ShoppingCart,
  Users,
  UserPlus,
  Mail,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import InviteUserDialog from "@/components/admin/InviteUserDialog";

type CustomerSummary = {
  id: string;
  name: string;
  account_ref: string;
  email?: string | null;
  telephone?: string | null;
  address?: string;
  credit_limit?: number | null;
  balance?: number | null;
};

type OrderStat = {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
};

type Order = {
  id: string;
  order_number: string | null;
  order_date: string | null;
  customer_order_number: string | null;
  status: string;
  items_gross: number;
  del_name: string | null;
};

type OrderSortField = "order_number" | "order_date" | "items_gross" | "status";
type SortDir = "asc" | "desc";

const STATUS_OPTIONS = ["injected", "processing", "failed", "pending"];
const ORDER_PAGE_SIZE = 25;

const statusStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case "injected":   return "bg-emerald-500/10 text-emerald-700";
    case "processing": return "bg-blue-500/10 text-blue-700";
    case "failed":     return "bg-red-500/10 text-red-700";
    case "pending":    return "bg-amber-500/10 text-amber-700";
    default:           return "bg-muted text-muted-foreground";
  }
};

const CustomerProfile = () => {
  const { accountRef } = useParams<{ accountRef: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");

  // Users tab state
  const [portalUsers, setPortalUsers] = useState<any[]>([]);
  const [portalUsersLoading, setPortalUsersLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Orders tab state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotalCount, setOrdersTotalCount] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersSearch, setOrdersSearch] = useState("");
  const [debouncedOrdersSearch, setDebouncedOrdersSearch] = useState("");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState("all");
  const [ordersSortField, setOrdersSortField] = useState<OrderSortField>("order_date");
  const [ordersSortDir, setOrdersSortDir] = useState<SortDir>("desc");
  const [ordersPage, setOrdersPage] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!accountRef) return;
      setLoading(true);
      setError(null);
      try {
        const { data: c, error: cErr } = await supabase
          .from("customers")
          .select("*")
          .eq("account_ref", accountRef)
          .maybeSingle();
        if (cErr) throw cErr;
        if (!c) {
          setError("Customer not found");
          setLoading(false);
          return;
        }

        const address = [
          c.address_1,
          c.address_2,
          c.address_3,
          c.postcode,
        ]
          .filter(Boolean)
          .join(", ");

        setCustomer({
          id: c.id,
          name: c.name,
          account_ref: c.account_ref,
          email: c.email,
          telephone: c.telephone,
          address: address || undefined,
          credit_limit: c.credit_limit,
          balance: c.balance,
        });

        const { data: orders } = await supabase
          .from("sales_orders")
          .select("items_gross, order_date")
          .eq("account_ref", c.account_ref);

        if (orders && orders.length) {
          let totalSpent = 0;
          let last: Date | null = null;
          for (const o of orders as any[]) {
            totalSpent += o.items_gross ?? 0;
            if (o.order_date) {
              const d = new Date(o.order_date);
              if (!last || d > last) last = d;
            }
          }
          setOrderStats({
            totalOrders: orders.length,
            totalSpent,
            lastOrderDate: last
              ? last.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null,
          });
        } else {
          setOrderStats({
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: null,
          });
        }
      } catch (e: any) {
        setError(e.message ?? "Failed to load customer");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [accountRef]);

  // Debounce orders search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedOrdersSearch(ordersSearch), 350);
    return () => clearTimeout(t);
  }, [ordersSearch]);

  // Fetch portal users when users tab is active
  useEffect(() => {
    if (tab !== "users" || !customer) return;
    const fetch = async () => {
      setPortalUsersLoading(true);
      const db = supabase as any;
      const { data } = await db
        .from("portal_users")
        .select("id, name, email, role, is_admin, is_active, created_at")
        .eq("customer_id", customer.id)
        .order("name", { ascending: true });
      setPortalUsers(data ?? []);
      setPortalUsersLoading(false);
    };
    fetch();
  }, [tab, customer, inviteOpen]); // re-fetch after invite dialog closes

  // Reset page when filters change
  useEffect(() => { setOrdersPage(0); }, [debouncedOrdersSearch, ordersStatusFilter]);

  const fetchOrders = useCallback(async () => {
    if (!customer) return;
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      let q = db
        .from("sales_orders")
        .select(
          "id, order_number, order_date, customer_order_number, status, items_gross, del_name",
          { count: "exact" }
        )
        .eq("account_ref", customer.account_ref);

      if (ordersStatusFilter !== "all") q = q.eq("status", ordersStatusFilter);
      if (debouncedOrdersSearch) {
        q = q.or(
          `order_number.ilike.%${debouncedOrdersSearch}%,customer_order_number.ilike.%${debouncedOrdersSearch}%`
        );
      }
      q = q
        .order(ordersSortField, { ascending: ordersSortDir === "asc" })
        .range(ordersPage * ORDER_PAGE_SIZE, (ordersPage + 1) * ORDER_PAGE_SIZE - 1);

      const { data, count, error: err } = await q;
      if (err) throw err;
      setOrders((data ?? []) as unknown as Order[]);
      setOrdersTotalCount(count ?? 0);
    } catch (e: any) {
      setOrdersError(e.message ?? "Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  }, [customer, ordersStatusFilter, debouncedOrdersSearch, ordersSortField, ordersSortDir, ordersPage]);

  useEffect(() => {
    if (tab === "orders") fetchOrders();
  }, [tab, fetchOrders]);

  if (loading) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 overflow-auto">
            <div className="border-b border-border bg-card px-6 py-5 space-y-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-96" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center space-y-3">
              <p className="text-destructive font-medium">
                {error ?? "Customer not found"}
              </p>
              <Button variant="outline" onClick={() => navigate("/customers")}>
                Back to customers
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <div className="bg-card border-b border-border">
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <button
                      onClick={() => navigate("/")}
                      className="hover:text-foreground"
                    >
                      Dashboard
                    </button>
                    <span>/</span>
                    <button
                      onClick={() => navigate("/customers")}
                      className="hover:text-foreground"
                    >
                      Customers
                    </button>
                    <span>/</span>
                    <span className="text-foreground font-medium">
                      {customer.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                        {customer.name}
                      </h1>
                      <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>Account</span>
                        <span className="text-border">|</span>
                        <span className="font-mono">{customer.account_ref}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate("/customers")}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <div className="border-t border-border bg-muted/50">
                <TabsList className="bg-transparent h-11 w-full justify-start p-0 rounded-none gap-0 overflow-x-auto">
                    <TabsTrigger
                      value="overview"
                      className="rounded-none h-full px-5 text-sm gap-1.5 border-b-2 border-transparent text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground hover:bg-background/50 transition-colors shrink-0"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="orders"
                      className="rounded-none h-full px-5 text-sm gap-1.5 border-b-2 border-transparent text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground hover:bg-background/50 transition-colors shrink-0"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Orders
                    </TabsTrigger>
                    <TabsTrigger
                      value="billing"
                      className="rounded-none h-full px-5 text-sm gap-1.5 border-b-2 border-transparent text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground hover:bg-background/50 transition-colors shrink-0"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Billing
                    </TabsTrigger>
                    <TabsTrigger
                      value="notes"
                      className="rounded-none h-full px-5 text-sm gap-1.5 border-b-2 border-transparent text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground hover:bg-background/50 transition-colors shrink-0"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Notes
                    </TabsTrigger>
                    <TabsTrigger
                      value="users"
                      className="rounded-none h-full px-5 text-sm gap-1.5 border-b-2 border-transparent text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground hover:bg-background/50 transition-colors shrink-0"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Users
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="px-6 py-6 space-y-6">
                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-foreground">
                          Customer summary
                        </h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Total orders
                            </p>
                            <p className="text-lg font-semibold">
                              {orderStats?.totalOrders ?? 0}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Total spent
                            </p>
                            <p className="text-lg font-semibold">
                              £{(orderStats?.totalSpent ?? 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Last order
                            </p>
                            <p className="text-sm">
                              {orderStats?.lastOrderDate ?? "Never"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Credit limit
                            </p>
                            <p className="text-sm">
                              £{(customer.credit_limit ?? 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-foreground">
                          Contact details
                        </h2>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{customer.email ?? "No email"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{customer.telephone ?? "No phone"}</span>
                          </div>
                          {customer.address && (
                            <div className="flex items-start gap-2 mt-2">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                              <span>{customer.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </TabsContent>

                  <TabsContent value="orders" className="space-y-4">
                    {/* Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="relative flex-1 min-w-[260px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by order # or PO number…"
                          value={ordersSearch}
                          onChange={(e) => setOrdersSearch(e.target.value)}
                          className="pl-9 h-9 text-sm"
                        />
                      </div>
                      <Select value={ordersStatusFilter} onValueChange={(v) => { setOrdersStatusFilter(v); setOrdersPage(0); }}>
                        <SelectTrigger className="w-[150px] h-9 text-sm">
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

                    {/* Table */}
                    <div className="border border-border rounded-lg overflow-hidden">
                      {ordersLoading ? (
                        <div className="p-6 space-y-2">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-9 w-full" />
                          ))}
                        </div>
                      ) : ordersError ? (
                        <div className="p-8 text-center text-destructive text-sm">
                          {ordersError}
                        </div>
                      ) : (
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              {(
                                [
                                  { field: "order_number", label: "Order #" },
                                  { field: "customer_order_number", label: "PO Number", sortable: false },
                                  { field: "order_date", label: "Date" },
                                  { field: "items_gross", label: "Total" },
                                  { field: "status", label: "Status" },
                                  { field: "del_name", label: "Recipient", sortable: false },
                                ] as { field: string; label: string; sortable?: boolean }[]
                              ).map(({ field, label, sortable = true }) =>
                                sortable ? (
                                  <TableHead key={field}>
                                    <button
                                      onClick={() => {
                                        if (ordersSortField === field) {
                                          setOrdersSortDir(ordersSortDir === "asc" ? "desc" : "asc");
                                        } else {
                                          setOrdersSortField(field as OrderSortField);
                                          setOrdersSortDir("asc");
                                        }
                                        setOrdersPage(0);
                                      }}
                                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                                    >
                                      {label}
                                      <ArrowUpDown
                                        className={`w-3 h-3 ${ordersSortField === field ? "text-primary" : "text-muted-foreground/40"}`}
                                      />
                                    </button>
                                  </TableHead>
                                ) : (
                                  <TableHead key={field}>{label}</TableHead>
                                )
                              )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                                  No orders found.
                                </TableCell>
                              </TableRow>
                            ) : (
                              orders.map((o) => (
                                <TableRow key={o.id} className="hover:bg-muted/40">
                                  <TableCell className="font-mono text-sm">{o.order_number ?? "—"}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{o.customer_order_number ?? "—"}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {o.order_date
                                      ? new Date(o.order_date).toLocaleDateString("en-GB", {
                                          day: "numeric", month: "short", year: "numeric",
                                        })
                                      : "—"}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm text-right">
                                    £{(o.items_gross ?? 0).toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusStyle(o.status)}`}>
                                      {o.status}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{o.del_name ?? "—"}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </div>

                    {/* Pagination */}
                    {!ordersError && !ordersLoading && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {ordersTotalCount === 0
                            ? "No orders"
                            : `Showing ${ordersPage * ORDER_PAGE_SIZE + 1}–${Math.min((ordersPage + 1) * ORDER_PAGE_SIZE, ordersTotalCount)} of ${ordersTotalCount.toLocaleString()}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>Page {Math.ceil(ordersTotalCount / ORDER_PAGE_SIZE) === 0 ? 0 : ordersPage + 1} of {Math.ceil(ordersTotalCount / ORDER_PAGE_SIZE)}</span>
                          <Button
                            variant="outline" size="icon" className="h-7 w-7"
                            disabled={ordersPage === 0}
                            onClick={() => setOrdersPage(ordersPage - 1)}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline" size="icon" className="h-7 w-7"
                            disabled={ordersPage >= Math.ceil(ordersTotalCount / ORDER_PAGE_SIZE) - 1}
                            onClick={() => setOrdersPage(ordersPage + 1)}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="billing">
                    <p className="text-sm text-muted-foreground">
                      Billing and credit details for this customer.
                    </p>
                  </TabsContent>

                  <TabsContent value="notes">
                    <p className="text-sm text-muted-foreground">
                      Notes and interactions coming soon.
                    </p>
                  </TabsContent>

                  <TabsContent value="users" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">Portal users</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          People who can log in to the ordering platform on behalf of this customer.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setInviteOpen(true)}
                      >
                        <UserPlus className="w-4 h-4" />
                        Invite User
                      </Button>
                    </div>

                    <div className="border border-border rounded-lg overflow-hidden">
                      {portalUsersLoading ? (
                        <div className="p-6 space-y-3">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                          ))}
                        </div>
                      ) : portalUsers.length === 0 ? (
                        <div className="p-10 text-center">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                            <Users className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">No users yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Invite someone from this customer to give them portal access.
                          </p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead className="w-[100px]">Role</TableHead>
                              <TableHead className="w-[80px]">Status</TableHead>
                              <TableHead className="w-[120px]">Added</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {portalUsers.map((u) => (
                              <TableRow key={u.id} className="hover:bg-muted/40">
                                <TableCell>
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                    <span className="text-sm font-medium">{u.name}</span>
                                    {u.is_admin && (
                                      <Badge className="text-[10px] px-1.5 py-0 h-4">Admin</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Mail className="w-3.5 h-3.5 shrink-0" />
                                    {u.email}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {u.role ?? "customer"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${u.is_active ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}`}>
                                    {u.is_active ? "Active" : "Disabled"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {new Date(u.created_at).toLocaleDateString("en-GB", {
                                    day: "numeric", month: "short", year: "2-digit",
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>

                    <InviteUserDialog
                      open={inviteOpen}
                      onOpenChange={setInviteOpen}
                      prefilledCustomer={customer ? { id: customer.id, name: customer.name, account_ref: customer.account_ref } : null}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerProfile;

