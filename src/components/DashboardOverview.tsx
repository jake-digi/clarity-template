import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Building2, ShoppingCart, PoundSterling, RefreshCw,
  ArrowRight, Clock, LayoutGrid, Tag, Users, ChevronRight,
} from "lucide-react";

type Order = {
  id: string;
  order_number: string | null;
  order_date: string;
  customer_order_number: string | null;
  status: string;
  items_gross: number;
  customer_name?: string;
  account_ref?: string;
};

type Stats = {
  customers: number;
  orders: number;
  revenue: number;
  lastSync: string | null;
};

const statusStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case "injected": return "bg-emerald-500/10 text-emerald-600";
    case "processing": return "bg-blue-500/10 text-blue-600";
    case "failed": return "bg-red-500/10 text-red-600";
    default: return "bg-amber-500/10 text-amber-600";
  }
};

const DashboardOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [customersRes, ordersRes, revenueRes, syncRes] = await Promise.all([
        supabase.from("customer_stats").select("id", { count: "exact", head: true }),
        supabase.from("sales_orders").select("id", { count: "exact", head: true }),
        supabase.from("sales_orders").select("items_gross"),
        supabase.from("sync_logs").select("started_at").order("started_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      const revenue = (revenueRes.data ?? []).reduce(
        (sum: number, o: { items_gross: number }) => sum + (o.items_gross ?? 0),
        0
      );

      setStats({
        customers: customersRes.count ?? 0,
        orders: ordersRes.count ?? 0,
        revenue,
        lastSync: syncRes.data?.started_at ?? null,
      });
      setLoadingStats(false);
    };

    const fetchOrders = async () => {
      const { data: ordersData } = await supabase
        .from("sales_orders")
        .select("id, order_number, order_date, customer_order_number, status, items_gross, customer_id")
        .order("order_date", { ascending: false })
        .limit(5);

      if (!ordersData?.length) { setOrders([]); setLoadingOrders(false); return; }

      const customerIds = [...new Set(ordersData.map((o: any) => o.customer_id).filter(Boolean))];
      const { data: customers } = await supabase
        .from("customers")
        .select("id, name, account_ref")
        .in("id", customerIds);

      const customerMap = Object.fromEntries((customers ?? []).map((c: any) => [c.id, c]));

      setOrders(ordersData.map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        order_date: o.order_date,
        customer_order_number: o.customer_order_number,
        status: o.status,
        items_gross: o.items_gross ?? 0,
        customer_name: customerMap[o.customer_id]?.name ?? "—",
        account_ref: customerMap[o.customer_id]?.account_ref ?? "—",
      })));
      setLoadingOrders(false);
    };

    fetchStats();
    fetchOrders();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const statCards = [
    {
      label: "Customers",
      value: stats?.customers,
      icon: Building2,
      path: "/customers",
    },
    {
      label: "Total Orders",
      value: stats?.orders,
      icon: ShoppingCart,
      path: "/orders",
    },
    {
      label: "Total Revenue",
      value: stats ? `£${stats.revenue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : undefined,
      icon: PoundSterling,
    },
    {
      label: "Last Sync",
      value: stats?.lastSync
        ? new Date(stats.lastSync).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
        : "—",
      icon: RefreshCw,
      path: "/sync",
    },
  ];

  const quickActions = [
    { icon: Building2, label: "Customers", description: "View and manage customer accounts.", path: "/customers" },
    { icon: ShoppingCart, label: "Orders", description: "Browse and process sales orders.", path: "/orders" },
    { icon: LayoutGrid, label: "Catalogue", description: "Manage your product catalogue.", path: "/catalogue" },
    { icon: Tag, label: "Pricing", description: "Configure customer price lists.", path: "/pricing" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">{greeting()}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening at Freemans today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, path }) => (
          <div
            key={label}
            onClick={() => path && navigate(path)}
            className={`bg-card border border-border rounded-lg p-4 flex items-start gap-3 ${path ? "cursor-pointer hover:bg-muted/40 transition-colors" : ""}`}
          >
            <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              {loadingStats
                ? <Skeleton className="h-6 w-16 mt-1" />
                : <p className="text-lg font-bold text-foreground leading-tight">{value ?? "—"}</p>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Recent Orders</h3>
          <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => navigate("/orders")}>
            View all <ArrowRight className="w-3 h-3" />
          </Button>
        </div>

        {loadingOrders ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Order #</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">PO Number</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Total</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/40 transition-colors cursor-pointer">
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                      {o.order_number ?? o.customer_order_number ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-foreground">{o.customer_name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{o.account_ref}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{o.customer_order_number ?? "—"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 opacity-60" />
                        {new Date(o.order_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-foreground text-right">
                      £{o.items_gross.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusStyle(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map(({ icon: Icon, label, description, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="bg-card border border-border rounded-lg p-4 text-left hover:bg-muted/40 hover:border-border/80 transition-colors group"
          >
            <Icon className="w-5 h-5 text-muted-foreground mb-2.5 group-hover:text-primary transition-colors" />
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardOverview;
