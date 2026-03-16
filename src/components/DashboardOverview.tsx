import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, ShoppingCart, ArrowRight, TrendingUp, TrendingDown,
  LayoutGrid, Tag, PoundSterling, Receipt, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Cell,
} from "recharts";

const db = supabase as any;

type Stats = {
  customers: number;
  orders: number;
  ordersThisMonth: number;
  ordersPrevMonth: number;
  revenueThisMonth: number;
  revenuePrevMonth: number;
  avgOrderValue: number;
  avgOrderValuePrev: number;
};

type MonthPoint = { month: string; orders: number; revenue: number };
type ProductPoint = { code: string | null; product: string; fullName: string; orders: number; qty: number };
type CustomerPoint = { name: string; account_ref: string; id: string; revenue: number; orders: number };

const fmt = (n: number) =>
  n >= 1_000_000
    ? `£${(n / 1_000_000).toFixed(1)}m`
    : n >= 1000
    ? `£${(n / 1000).toFixed(1)}k`
    : `£${n.toLocaleString("en-GB", { minimumFractionDigits: 0 })}`;

const pct = (now: number, prev: number) => {
  if (!prev) return null;
  return Math.round(((now - prev) / prev) * 100);
};

// ─── Tooltip components defined outside render to avoid re-mount ─────────────

const OrdersTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-md text-xs space-y-1">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">
            {p.dataKey === "revenue" ? `£${(p.value ?? 0).toLocaleString("en-GB")}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const RadarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-md text-xs">
      <p className="font-semibold text-foreground mb-1 max-w-[180px] leading-snug">{d?.fullName}</p>
      <p className="text-muted-foreground">Orders: <span className="font-medium text-foreground">{d?.orders}</span></p>
    </div>
  );
};

const CustomerBarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-md text-xs">
      <p className="font-semibold text-foreground mb-1 max-w-[200px] leading-snug">{d?.name}</p>
      <p className="text-muted-foreground">Revenue: <span className="font-medium text-foreground">£{d?.revenue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
      <p className="text-muted-foreground">Orders: <span className="font-medium text-foreground">{d?.orders}</span></p>
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

const DashboardOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthPoint[]>([]);
  const [productData, setProductData] = useState<ProductPoint[]>([]);
  const [customerData, setCustomerData] = useState<CustomerPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const [
        customersRes,
        ordersCountRes,
        thisMonthRes,
        prevMonthRes,
        monthlyRes,
        productsRes,
        customersRevRes,
      ] = await Promise.all([
        db.from("customers").select("id", { count: "exact", head: true }),
        db.from("sales_orders").select("id", { count: "exact", head: true }),
        db.from("sales_orders").select("items_gross").gte("order_date", startThisMonth),
        db.from("sales_orders").select("items_gross").gte("order_date", startPrevMonth).lt("order_date", startThisMonth),
        // Server-side aggregation — avoids the 1000-row client limit
        db.rpc("get_monthly_order_stats", { months_back: 12 }),
        db.from("sales_order_items").select("description, stock_code, quantity, order_id").not("description", "is", null),
        db.from("sales_orders").select("customer_id, items_gross, customers(id, name, account_ref)").not("customer_id", "is", null),
      ]);

      const revThis = (thisMonthRes.data ?? []).reduce((s: number, o: any) => s + (o.items_gross ?? 0), 0);
      const revPrev = (prevMonthRes.data ?? []).reduce((s: number, o: any) => s + (o.items_gross ?? 0), 0);
      const ordThis = thisMonthRes.data?.length ?? 0;
      const ordPrev = prevMonthRes.data?.length ?? 0;

      setStats({
        customers: customersRes.count ?? 0,
        orders: ordersCountRes.count ?? 0,
        ordersThisMonth: ordThis,
        ordersPrevMonth: ordPrev,
        revenueThisMonth: revThis,
        revenuePrevMonth: revPrev,
        avgOrderValue: ordThis > 0 ? revThis / ordThis : 0,
        avgOrderValuePrev: ordPrev > 0 ? revPrev / ordPrev : 0,
      });

      // Monthly data comes pre-aggregated from the RPC
      setMonthlyData(
        (monthlyRes.data ?? []).map((row: any) => ({
          month: row.month,
          orders: Number(row.orders),
          revenue: Math.round(Number(row.revenue)),
        }))
      );

      // Product aggregation
      const prodMap: Record<string, { code: string | null; fullName: string; orderSet: Set<string>; qty: number }> = {};
      for (const item of productsRes.data ?? []) {
        const key = item.stock_code ?? item.description;
        if (!prodMap[key]) prodMap[key] = { code: item.stock_code ?? null, fullName: item.description, orderSet: new Set(), qty: 0 };
        prodMap[key].orderSet.add(item.order_id);
        prodMap[key].qty += item.quantity ?? 0;
      }
      setProductData(
        Object.entries(prodMap)
          .map(([, v]) => ({
            code: v.code,
            product: v.fullName.length > 20 ? v.fullName.slice(0, 18) + "…" : v.fullName,
            fullName: v.fullName,
            orders: v.orderSet.size,
            qty: Math.round(v.qty),
          }))
          .sort((a, b) => b.orders - a.orders)
          .slice(0, 8)
      );

      // Top customers by revenue
      const custMap: Record<string, CustomerPoint> = {};
      for (const o of customersRevRes.data ?? []) {
        const c = o.customers;
        if (!c) continue;
        if (!custMap[c.id]) custMap[c.id] = { name: c.name, account_ref: c.account_ref, id: c.id, revenue: 0, orders: 0 };
        custMap[c.id].revenue += o.items_gross ?? 0;
        custMap[c.id].orders += 1;
      }
      setCustomerData(
        Object.values(custMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 6)
      );

      setLoading(false);
    };
    load();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const ordersChange = stats ? pct(stats.ordersThisMonth, stats.ordersPrevMonth) : null;
  const revenueChange = stats ? pct(stats.revenueThisMonth, stats.revenuePrevMonth) : null;
  const avgChange = stats ? pct(stats.avgOrderValue, stats.avgOrderValuePrev) : null;

  const quickActions = [
    { icon: Building2, label: "Customers", description: "View and manage customer accounts.", path: "/customers" },
    { icon: ShoppingCart, label: "Orders", description: "Browse and process sales orders.", path: "/orders" },
    { icon: LayoutGrid, label: "Catalogue", description: "Manage your product catalogue.", path: "/catalogue" },
    { icon: Tag, label: "Pricing", description: "Configure customer price lists.", path: "/pricing" },
  ];

  const MoMBadge = ({ change }: { change: number | null }) =>
    change == null ? null : (
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
        {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(change)}% MoM
      </span>
    );

  // Bar chart short labels
  const custBarData = customerData.map((c) => ({
    ...c,
    shortName: c.name.length > 16 ? c.name.slice(0, 14) + "…" : c.name,
  }));

  const BAR_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--primary) / 0.75)",
    "hsl(var(--primary) / 0.55)",
    "hsl(var(--primary) / 0.42)",
    "hsl(var(--primary) / 0.32)",
    "hsl(var(--primary) / 0.24)",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">{greeting()}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening at Freemans today.</p>
      </div>

      {/* ── Row 1: stat cards (left) + top products radar (right, full height) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2/3: stat cards on top, orders chart below */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">

          {/* 2 stat cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Customers */}
            <div
              onClick={() => navigate("/customers")}
              className="bg-card border border-border rounded-lg p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Customers</p>
                {loading ? <Skeleton className="h-6 w-16 mt-1" /> : <p className="text-lg font-bold text-foreground leading-tight">{stats?.customers.toLocaleString() ?? "—"}</p>}
              </div>
            </div>

            {/* Total Orders */}
            <div
              onClick={() => navigate("/orders")}
              className="bg-card border border-border rounded-lg p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <ShoppingCart className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total Orders</p>
                {loading ? <Skeleton className="h-6 w-16 mt-1" /> : <p className="text-lg font-bold text-foreground leading-tight">{stats?.orders.toLocaleString() ?? "—"}</p>}
                {!loading && (
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground">{stats?.ordersThisMonth} this month</span>
                    <MoMBadge change={ordersChange} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Orders & Revenue chart */}
          <div className="bg-card border border-border rounded-lg p-5 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Orders & Revenue</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Last 12 months</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => navigate("/orders")}>
                View orders <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            {loading ? (
              <Skeleton className="flex-1 w-full min-h-[200px]" />
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <ComposedChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="rev" orientation="left" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={54} />
                  <YAxis yAxisId="cnt" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={36} />
                  <Tooltip content={<OrdersTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4 }} />
                  <Line yAxisId="cnt" type="monotone" dataKey="orders" name="Orders" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right 1/3: Top Products radar — full height of both above sections */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Top Products</h3>
            <p className="text-xs text-muted-foreground mt-0.5">By number of orders placed</p>
          </div>
          {loading ? (
            <Skeleton className="flex-1 w-full min-h-[200px]" />
          ) : productData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={productData} margin={{ top: 4, right: 20, bottom: 4, left: 20 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="product" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis angle={90} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickCount={4} />
                <Radar name="Orders" dataKey="orders" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.18} strokeWidth={2} />
                <Tooltip content={<RadarTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          )}

          {/* Ranked list */}
          {!loading && productData.length > 0 && (
            <div className="mt-auto pt-4 border-t border-border space-y-2">
              {productData.slice(0, 6).map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => p.code && navigate(`/products/${encodeURIComponent(p.code)}`)}
                  className="flex items-center gap-2 w-full text-left hover:bg-muted/60 rounded px-1 py-0.5 transition-colors"
                >
                  <span className="text-[10px] font-bold text-muted-foreground/50 w-3 shrink-0 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] text-muted-foreground truncate">{p.fullName}</span>
                      <span className="text-[11px] font-semibold text-foreground shrink-0">{p.orders.toLocaleString()}</span>
                    </div>
                    <div className="mt-0.5 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{ width: `${Math.round((p.orders / productData[0].orders) * 100)}%` }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Revenue this month + Avg order value + Top Customers chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Revenue this month */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <PoundSterling className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Revenue This Month</p>
            {loading ? <Skeleton className="h-6 w-24 mt-1" /> : (
              <p className="text-lg font-bold text-foreground leading-tight">{stats ? fmt(stats.revenueThisMonth) : "—"}</p>
            )}
            {!loading && (
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground">{stats ? fmt(stats.revenuePrevMonth) : "—"} last month</span>
                <MoMBadge change={revenueChange} />
              </div>
            )}
          </div>
        </div>

        {/* Avg order value */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Avg Order Value</p>
            {loading ? <Skeleton className="h-6 w-20 mt-1" /> : (
              <p className="text-lg font-bold text-foreground leading-tight">
                {stats ? `£${stats.avgOrderValue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
              </p>
            )}
            {!loading && (
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground">
                  {stats ? `£${stats.avgOrderValuePrev.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"} last month
                </span>
                <MoMBadge change={avgChange} />
              </div>
            )}
          </div>
        </div>

        {/* Top customers by revenue — bar chart */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Top Customers
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">By revenue (all time)</p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => navigate("/customers")}>
              View all <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          {loading ? (
            <Skeleton className="h-[160px] w-full" />
          ) : custBarData.length === 0 ? (
            <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">No customer data</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={custBarData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="shortName" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={90} />
                <Tooltip content={<CustomerBarTooltip />} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 3, 3, 0]}>
                  {custBarData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i] ?? BAR_COLORS[BAR_COLORS.length - 1]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Quick actions ── */}
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
