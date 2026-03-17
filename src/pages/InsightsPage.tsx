import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { usePortalAnalyticsRealtime } from "@/hooks/usePortalAnalyticsRealtime";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Eye,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { formatDistanceToNow } from "date-fns";

const DATE_RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const;

const BAR_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.75)",
  "hsl(var(--primary) / 0.55)",
  "hsl(var(--primary) / 0.42)",
  "hsl(var(--primary) / 0.32)",
  "hsl(var(--primary) / 0.24)",
];

function getSinceDays(days: string): Date {
  const d = new Date();
  d.setDate(d.getDate() - parseInt(days, 10));
  return d;
}

type AnalyticsRow = {
  id: string;
  event_type: string;
  product_code: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const db = supabase as any;

function usePortalAnalytics(since: Date) {
  return useQuery({
    queryKey: ["portal_analytics", since.toISOString()],
    queryFn: async () => {
      const { data, error } = await db
        .from("portal_analytics")
        .select("id, event_type, product_code, metadata, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return (data ?? []) as AnalyticsRow[];
    },
    refetchInterval: 15_000, // fallback refresh every 15s if Realtime doesn’t fire
  });
}

function useProductsByCodes(codes: string[]) {
  return useQuery({
    queryKey: ["products_by_codes", codes.slice(0, 50).sort().join(",")],
    queryFn: async () => {
      if (codes.length === 0) return [] as { stock_code: string; description: string | null }[];
      const { data, error } = await db
        .from("products")
        .select("stock_code, description")
        .in("stock_code", codes.slice(0, 100));
      if (error) throw error;
      return (data ?? []) as { stock_code: string; description: string | null }[];
    },
    enabled: codes.length > 0,
  });
}

function useOrderedProductCodes() {
  return useQuery({
    queryKey: ["ordered_product_codes"],
    queryFn: async () => {
      const { data, error } = await db
        .from("sales_order_items")
        .select("stock_code");
      if (error) throw error;
      const codes = new Set((data ?? []).map((r: { stock_code: string | null }) => r.stock_code).filter(Boolean));
      return Array.from(codes) as string[];
    },
  });
}

function InsightsPage() {
  const navigate = useNavigate();
  const [days, setDays] = useState("30");
  const since = useMemo(() => getSinceDays(days), [days]);

  usePortalAnalyticsRealtime();
  const { data: rows = [], isLoading: analyticsLoading } = usePortalAnalytics(since);
  const { data: orderedCodes = [], isLoading: orderedLoading } = useOrderedProductCodes();

  const lostRevenue = useMemo(() => {
    const byQuery: Record<string, number> = {};
    rows
      .filter((r) => r.event_type === "search_no_results")
      .forEach((r) => {
        const q = (r.metadata?.query as string) ?? "(empty)";
        byQuery[q] = (byQuery[q] ?? 0) + 1;
      });
    return Object.entries(byQuery)
      .map(([query, frequency]) => ({ query, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 15);
  }, [rows]);

  const mostViewed = useMemo(() => {
    const byCode: Record<string, number> = {};
    rows
      .filter((r) => r.event_type === "view_product" && r.product_code)
      .forEach((r) => {
        const c = r.product_code!;
        byCode[c] = (byCode[c] ?? 0) + 1;
      });
    return Object.entries(byCode)
      .map(([product_code, views]) => ({ product_code, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);
  }, [rows]);

  const mostViewedCodes = useMemo(() => mostViewed.map((p) => p.product_code), [mostViewed]);
  const { data: productDescriptions = [] } = useProductsByCodes(mostViewedCodes);
  const descriptionByCode = useMemo(() => {
    const m: Record<string, string> = {};
    productDescriptions.forEach((p) => {
      m[p.stock_code] = p.description ?? "";
    });
    return m;
  }, [productDescriptions]);

  const mostViewedWithDesc = useMemo(
    () =>
      mostViewed.map((p) => ({
        ...p,
        description: descriptionByCode[p.product_code] ?? "—",
      })),
    [mostViewed, descriptionByCode]
  );

  const mostViewedNeverOrdered = useMemo(() => {
    const orderedSet = new Set(orderedCodes);
    return mostViewedWithDesc.filter((p) => !orderedSet.has(p.product_code)).slice(0, 15);
  }, [mostViewedWithDesc, orderedCodes]);

  const topSearchQueries = useMemo(() => {
    const byQuery: Record<string, number> = {};
    rows
      .filter((r) => r.event_type === "search" || r.event_type === "search_click")
      .forEach((r) => {
        const q = (r.metadata?.query as string) ?? "(empty)";
        byQuery[q] = (byQuery[q] ?? 0) + 1;
      });
    return Object.entries(byQuery)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [rows]);

  const eventCounts = useMemo(() => {
    const byType: Record<string, number> = {};
    rows.forEach((r) => {
      byType[r.event_type] = (byType[r.event_type] ?? 0) + 1;
    });
    return Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [rows]);

  const eventsByDay = useMemo(() => {
    const byDay: Record<string, number> = {};
    rows.forEach((r) => {
      const day = r.created_at.slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
    });
    return Object.entries(byDay)
      .map(([day, count]) => ({ day, count, short: day.slice(5) }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [rows]);

  const whoViewedWhat = useMemo(() => {
    return rows
      .filter((r) => r.event_type === "view_product" && r.product_code)
      .slice(0, 50)
      .map((r) => ({
        product_code: r.product_code!,
        user_name: (r.metadata?.user_name as string) ?? "—",
        user_email: (r.metadata?.user_email as string) ?? "—",
        created_at: r.created_at,
        description: descriptionByCode[r.product_code] ?? "—",
      }));
  }, [rows, descriptionByCode]);

  const uniqueViewers = useMemo(() => {
    const emails = new Set<string>();
    rows
      .filter((r) => r.event_type === "view_product")
      .forEach((r) => {
        const e = r.metadata?.user_email as string;
        if (e) emails.add(e);
      });
    return emails.size;
  }, [rows]);

  const viewProductCount = useMemo(
    () => rows.filter((r) => r.event_type === "view_product").length,
    [rows]
  );
  const searchNoResultsCount = useMemo(
    () => rows.filter((r) => r.event_type === "search_no_results").length,
    [rows]
  );

  const loading = analyticsLoading;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0 bg-white">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-[72px] rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-lg" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Insights</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Portal behaviour, search intelligence, and who&apos;s viewing what.</p>
                </div>
                <Select value={days} onValueChange={setDays}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_RANGES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stat cards — same pattern as dashboard */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Total events</p>
                    <p className="text-lg font-bold text-foreground leading-tight">{rows.length.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Product views</p>
                    <p className="text-lg font-bold text-foreground leading-tight">{viewProductCount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Failed searches</p>
                    <p className="text-lg font-bold text-foreground leading-tight">{searchNoResultsCount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Unique viewers</p>
                    <p className="text-lg font-bold text-foreground leading-tight">{uniqueViewers.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Charts row: Lost revenue + Most viewed + Activity over time */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-primary" />
                      Lost revenue
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Searches with no results</p>
                  </div>
                  {lostRevenue.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No failed searches in this period.</p>
                  ) : (
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lostRevenue.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                          <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                          <YAxis type="category" dataKey="query" width={100} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload as { query: string; frequency: number };
                              return (
                                <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-md text-xs">
                                  <p className="font-medium text-foreground break-all max-w-[200px]">{d.query}</p>
                                  <p className="text-muted-foreground mt-0.5">{d.frequency} searches</p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="frequency" name="Searches" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      Most viewed products
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Top product pages by views</p>
                  </div>
                  {mostViewedWithDesc.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No product views in this period.</p>
                  ) : (
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mostViewedWithDesc.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                          <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                          <YAxis type="category" dataKey="product_code" width={80} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload as { product_code: string; views: number; description: string };
                              return (
                                <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-md text-xs max-w-[240px]">
                                  <p className="font-mono font-medium text-foreground">{d.product_code}</p>
                                  {d.description && d.description !== "—" && (
                                    <p className="text-muted-foreground mt-1 line-clamp-2">{d.description}</p>
                                  )}
                                  <p className="text-muted-foreground mt-1">{d.views} views</p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="views" name="Views" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Activity over time
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Events per day</p>
                  </div>
                  {eventsByDay.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No events in this period.</p>
                  ) : (
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={eventsByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="insightsActivityGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="short" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={28} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload as { day: string; count: number };
                              return (
                                <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-md text-xs">
                                  <p className="font-medium text-foreground">{d.day}</p>
                                  <p className="text-muted-foreground">{d.count} events</p>
                                </div>
                              );
                            }}
                          />
                          <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#insightsActivityGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Who's viewing what + Event types */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Who&apos;s viewing what
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Recent product views with user and product</p>
                  </div>
                  {whoViewedWhat.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No product views in this period.</p>
                  ) : (
                    <div className="max-h-[320px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[140px]">User</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right w-28">When</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {whoViewedWhat.slice(0, 30).map((row, i) => (
                            <TableRow
                              key={`${row.product_code}-${row.created_at}-${i}`}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => navigate(`/products/${encodeURIComponent(row.product_code)}`)}
                            >
                              <TableCell className="py-2">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm font-medium text-foreground truncate max-w-[120px]" title={row.user_name}>
                                    {row.user_name !== "—" ? row.user_name : "Anonymous"}
                                  </span>
                                  {row.user_email !== "—" && (
                                    <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={row.user_email}>
                                      {row.user_email}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-mono text-sm text-foreground">{row.product_code}</span>
                                  {row.description !== "—" && (
                                    <span className="text-xs text-muted-foreground line-clamp-1 max-w-[220px]">{row.description}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-2 text-muted-foreground text-xs">
                                {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Events by type
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Breakdown of event types</p>
                  </div>
                  {eventCounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No events.</p>
                  ) : (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload as { name: string; value: number };
                              const total = eventCounts.reduce((s, x) => s + x.value, 0);
                              const pct = total ? Math.round((d.value / total) * 100) : 0;
                              return (
                                <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-md text-xs">
                                  <p className="font-medium text-foreground">{d.name}</p>
                                  <p className="text-muted-foreground">{d.value} ({pct}%)</p>
                                </div>
                              );
                            }}
                          />
                          <Pie
                            data={eventCounts}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {eventCounts.map((_, i) => (
                              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Top search queries + Most viewed never ordered */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Search className="w-4 h-4 text-primary" />
                      Top search queries
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Most used search terms</p>
                  </div>
                  {topSearchQueries.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No search events.</p>
                  ) : (
                    <div className="h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topSearchQueries.slice(0, 10)} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="query" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={56} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={32} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload as { query: string; count: number };
                              return (
                                <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-md text-xs">
                                  <p className="font-medium text-foreground break-all max-w-[200px]">{d.query}</p>
                                  <p className="text-muted-foreground">{d.count} searches</p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="count" name="Searches" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Most viewed, never ordered
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">High interest products not yet ordered</p>
                  </div>
                  {orderedLoading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : mostViewedNeverOrdered.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">None in this period.</p>
                  ) : (
                    <div className="max-h-[260px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right w-20">Views</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mostViewedNeverOrdered.map((p) => (
                            <TableRow
                              key={p.product_code}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => navigate(`/products/${encodeURIComponent(p.product_code)}`)}
                            >
                              <TableCell>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-mono text-sm text-foreground">{p.product_code}</span>
                                  {p.description !== "—" && (
                                    <span className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">{p.description}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary" className="font-mono">{p.views}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Most viewed products (full list)</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Product code, description, and view count</p>
                  </div>
                  {mostViewedWithDesc.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No product views.</p>
                  ) : (
                    <div className="max-h-[320px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right w-24">Views</TableHead>
                            <TableHead className="w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mostViewedWithDesc.map((p) => (
                            <TableRow
                              key={p.product_code}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => navigate(`/products/${encodeURIComponent(p.product_code)}`)}
                            >
                              <TableCell>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-mono text-sm font-medium text-foreground">{p.product_code}</span>
                                  {p.description !== "—" && (
                                    <span className="text-xs text-muted-foreground line-clamp-2 max-w-[300px]">{p.description}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline" className="font-mono">{p.views}</Badge>
                              </TableCell>
                              <TableCell>
                                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Failed searches (full list)</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Queries that returned no results</p>
                  </div>
                  {lostRevenue.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No failed searches.</p>
                  ) : (
                    <div className="max-h-[320px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Query</TableHead>
                            <TableHead className="text-right w-24">Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lostRevenue.map(({ query, frequency }) => (
                            <TableRow key={query}>
                              <TableCell className="font-mono text-sm break-all">{query}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary">{frequency}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default InsightsPage;
