import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  PoundSterling,
  Users,
  ArrowRight,
} from "lucide-react";

const db = supabase as any;

type ProductSummary = {
  code: string;
  description: string | null;
  totalQty: number;
  totalRevenue: number;
  orderCount: number;
  customerCount: number;
  firstOrder: string | null;
  lastOrder: string | null;
};

type MonthlyPoint = { month: string; qty: number; revenue: number };

type TopCustomer = {
  customer_id: string | null;
  name: string | null;
  account_ref: string | null;
  qty: number;
  revenue: number;
};

const money = (n: number) =>
  `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ProductDetailPage = () => {
  const { productCode } = useParams<{ productCode: string }>();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<ProductSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productCode) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Pull all order lines for this product (last 24 months only for performance)
        const since = new Date();
        since.setMonth(since.getMonth() - 24);

        const { data: lines, error: lineErr } = await db
          .from("sales_order_items")
          .select(
            "order_id, stock_code, description, qty_order, gross_amount, net_amount, tax_amount, last_synced_at"
          )
          .eq("stock_code", productCode)
          .gte("last_synced_at", since.toISOString());

        if (lineErr) throw lineErr;
        if (!lines || lines.length === 0) {
          setSummary({
            code: productCode,
            description: null,
            totalQty: 0,
            totalRevenue: 0,
            orderCount: 0,
            customerCount: 0,
            firstOrder: null,
            lastOrder: null,
          });
          setMonthly([]);
          setTopCustomers([]);
          setLoading(false);
          return;
        }

        const orderIds = Array.from(new Set(lines.map((l: any) => l.order_id).filter(Boolean)));

        const { data: orders, error: orderErr } = await db
          .from("sales_orders")
          .select("id, order_date, customer_id, account_ref, name")
          .in("id", orderIds);

        if (orderErr) throw orderErr;

        const orderMap: Record<string, any> = {};
        for (const o of orders ?? []) orderMap[o.id] = o;

        // Summary
        let totalQty = 0;
        let totalRevenue = 0;
        const orderSet = new Set<string>();
        const customerSet = new Set<string>();
        let firstOrder: string | null = null;
        let lastOrder: string | null = null;

        for (const l of lines) {
          const qty = Number(l.qty_order ?? 0);
          const rev = Number(l.gross_amount ?? l.net_amount ?? 0);
          totalQty += qty;
          totalRevenue += rev;

          const o = l.order_id ? orderMap[l.order_id] : null;
          if (o) {
            orderSet.add(o.id);
            if (o.customer_id) customerSet.add(o.customer_id);
            if (o.order_date) {
              const d = new Date(o.order_date).toISOString();
              if (!firstOrder || d < firstOrder) firstOrder = d;
              if (!lastOrder || d > lastOrder) lastOrder = d;
            }
          }
        }

        setSummary({
          code: productCode,
          description: lines[0]?.description ?? null,
          totalQty,
          totalRevenue,
          orderCount: orderSet.size,
          customerCount: customerSet.size,
          firstOrder,
          lastOrder,
        });

        // Monthly buckets
        const monthBuckets: Record<string, { qty: number; revenue: number }> = {};
        for (const l of lines) {
          const o = l.order_id ? orderMap[l.order_id] : null;
          if (!o?.order_date) continue;
          const d = new Date(o.order_date);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (!monthBuckets[key]) monthBuckets[key] = { qty: 0, revenue: 0 };
          monthBuckets[key].qty += Number(l.qty_order ?? 0);
          monthBuckets[key].revenue += Number(l.gross_amount ?? l.net_amount ?? 0);
        }

        const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const monthlyPoints: MonthlyPoint[] = Object.entries(monthBuckets)
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(([key, val]) => {
            const [y, m] = key.split("-");
            return {
              month: `${MONTH_ABBR[parseInt(m, 10) - 1]} ${y.slice(2)}`,
              qty: Math.round(val.qty),
              revenue: Math.round(val.revenue),
            };
          });
        setMonthly(monthlyPoints);

        // Top customers
        const custBuckets: Record<string, TopCustomer> = {};
        for (const l of lines) {
          const o = l.order_id ? orderMap[l.order_id] : null;
          if (!o) continue;
          const id = o.customer_id ?? "unknown";
          if (!custBuckets[id]) {
            custBuckets[id] = {
              customer_id: o.customer_id ?? null,
              name: o.name ?? "Unknown",
              account_ref: o.account_ref ?? null,
              qty: 0,
              revenue: 0,
            };
          }
          custBuckets[id].qty += Number(l.qty_order ?? 0);
          custBuckets[id].revenue += Number(l.gross_amount ?? l.net_amount ?? 0);
        }

        setTopCustomers(
          Object.values(custBuckets)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
        );
      } catch (e: any) {
        setError(e.message ?? "Failed to load product stats");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productCode]);

  if (!productCode) {
    return null;
  }

  if (loading) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 overflow-auto p-6 space-y-4">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-72 w-full" />
          </main>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center space-y-3">
              <p className="text-destructive font-medium">
                {error ?? "Product data not found"}
              </p>
              <Button variant="outline" onClick={() => navigate("/catalogue")}>
                Back to Catalogue
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
          {/* Header */}
          <div className="bg-card border-b border-border px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <button
                  className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground gap-1 mb-1"
                  onClick={() => navigate("/catalogue")}
                >
                  <ArrowLeft className="w-3 h-3" />
                  Catalogue
                </button>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  {summary.code}
                </h1>
                {summary.description && (
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    {summary.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Stat strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground">Total Quantity Ordered</p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {summary.totalQty.toLocaleString("en-GB")}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {money(summary.totalRevenue)}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-2">
                <ShoppingCart className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {summary.orderCount.toLocaleString("en-GB")}
                  </p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-2">
                <Users className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Customers</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {summary.customerCount.toLocaleString("en-GB")}
                  </p>
                </div>
              </div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly chart */}
              <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5 flex flex-col min-h-[260px]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Demand & Revenue Over Time
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Quantity ordered and revenue by month
                    </p>
                  </div>
                </div>
                {monthly.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                    No recent order history for this product.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="rev"
                        orientation="left"
                        tickFormatter={(v) =>
                          `£${(v as number).toLocaleString("en-GB", {
                            maximumFractionDigits: 0,
                          })}`
                        }
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        width={54}
                      />
                      <YAxis
                        yAxisId="qty"
                        orientation="right"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        width={32}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-md text-xs space-y-1">
                              <p className="font-semibold text-foreground mb-1">
                                {label}
                              </p>
                              {payload.map((p: any) => (
                                <div
                                  key={p.dataKey}
                                  className="flex items-center gap-2"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: p.color }}
                                  />
                                  <span className="text-muted-foreground">
                                    {p.dataKey === "revenue" ? "Revenue" : "Quantity"}:
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {p.dataKey === "revenue"
                                      ? money(p.value ?? 0)
                                      : (p.value ?? 0).toLocaleString("en-GB")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                      />
                      <Area
                        yAxisId="rev"
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="hsl(var(--primary) / 0.16)"
                        dot={false}
                      />
                      <Line
                        yAxisId="qty"
                        type="monotone"
                        dataKey="qty"
                        name="Quantity"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Top customers */}
              <div className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Top Customers
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      For this product (last 24 months)
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs h-7"
                    onClick={() => navigate("/customers")}
                  >
                    View all <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
                {topCustomers.length === 0 ? (
                  <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
                    No customer breakdown available.
                  </div>
                ) : (
                  <>
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topCustomers}
                          layout="vertical"
                          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                        >
                          <XAxis
                            type="number"
                            tickFormatter={(v) =>
                              `£${(v as number).toLocaleString("en-GB", {
                                maximumFractionDigits: 0,
                              })}`
                            }
                            tick={{
                              fontSize: 10,
                              fill: "hsl(var(--muted-foreground))",
                            }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{
                              fontSize: 10,
                              fill: "hsl(var(--muted-foreground))",
                            }}
                            tickLine={false}
                            axisLine={false}
                            width={100}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload as TopCustomer;
                              return (
                                <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-md text-xs">
                                  <p className="font-semibold text-foreground mb-1 max-w-[200px] leading-snug">
                                    {d.name}
                                  </p>
                                  <p className="text-muted-foreground">
                                    Revenue:{" "}
                                    <span className="font-medium text-foreground">
                                      {money(d.revenue)}
                                    </span>
                                  </p>
                                  <p className="text-muted-foreground">
                                    Quantity:{" "}
                                    <span className="font-medium text-foreground">
                                      {d.qty.toLocaleString("en-GB")}
                                    </span>
                                  </p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="revenue" name="Revenue" radius={[0, 3, 3, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {topCustomers.map((c) => (
                        <button
                          key={`${c.customer_id ?? c.name}`}
                          type="button"
                          onClick={() =>
                            c.account_ref &&
                            navigate(`/customers/${encodeURIComponent(c.account_ref)}`)
                          }
                          className="w-full text-left text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded px-1 py-0.5 flex items-center justify-between"
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="font-mono text-xs text-foreground">
                            {money(c.revenue)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProductDetailPage;

