import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Eye,
  AlertCircle,
  BarChart3,
  Users,
  Activity,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { formatDistanceToNow } from "date-fns";

const db = supabase as any;

const DATE_RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const;

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

function usePortalUserIds(customerId: string | null) {
  return useQuery({
    queryKey: ["portal_users_by_customer", customerId],
    queryFn: async () => {
      const { data, error } = await db
        .from("portal_users")
        .select("id")
        .eq("customer_id", customerId!);
      if (error) throw error;
      return (data ?? []).map((r: { id: string }) => r.id) as string[];
    },
    enabled: !!customerId,
  });
}

function useCustomerPortalAnalytics(customerId: string | null, since: Date) {
  const { data: userIds = [], isLoading: idsLoading } = usePortalUserIds(customerId);

  const query = useQuery({
    queryKey: ["portal_analytics_by_customer", customerId, since.toISOString(), userIds.length],
    queryFn: async () => {
      if (userIds.length === 0) return [] as AnalyticsRow[];
      const { data, error } = await db
        .from("portal_analytics")
        .select("id, event_type, product_code, metadata, created_at")
        .in("portal_user_id", userIds)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as AnalyticsRow[];
    },
    enabled: userIds.length > 0,
  });

  return { ...query, isLoading: idsLoading || query.isLoading };
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

type Props = {
  customerId: string;
  customerName?: string;
};

export default function CustomerPortalInsights({ customerId, customerName }: Props) {
  const navigate = useNavigate();
  const [days, setDays] = useState("30");
  const since = useMemo(() => getSinceDays(days), [days]);

  const { data: rows = [], isLoading } = useCustomerPortalAnalytics(customerId, since);
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
      .slice(0, 15);
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
      .slice(0, 10);
  }, [rows]);

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
      .slice(0, 10);
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
      .slice(0, 25)
      .map((r) => ({
        product_code: r.product_code!,
        user_name: (r.metadata?.user_name as string) ?? "—",
        user_email: (r.metadata?.user_email as string) ?? "—",
        created_at: r.created_at,
        description: descriptionByCode[r.product_code] ?? "—",
      }));
  }, [rows, descriptionByCode]);

  const lastActive = useMemo(() => {
    if (rows.length === 0) return null;
    const latest = rows.reduce((best, r) => (r.created_at > best ? r.created_at : best), rows[0].created_at);
    return latest;
  }, [rows]);

  const viewProductCount = useMemo(() => rows.filter((r) => r.event_type === "view_product").length, [rows]);
  const searchNoResultsCount = useMemo(() => rows.filter((r) => r.event_type === "search_no_results").length, [rows]);
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Portal activity</h3>
          <Skeleton className="h-9 w-[180px]" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[72px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-sm font-semibold text-foreground">
          Portal activity
          {customerName ? (
            <span className="text-muted-foreground font-normal ml-1">— users at this customer</span>
          ) : null}
        </h3>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[160px] h-9">
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

      {rows.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">No portal activity in this period for this customer.</p>
          <p className="text-xs text-muted-foreground mt-1">Activity appears when users signed in under this account use the portal.</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
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
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Last active</p>
                <p className="text-lg font-bold text-foreground leading-tight">
                  {lastActive ? formatDistanceToNow(new Date(lastActive), { addSuffix: true }) : "—"}
                </p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Unique users</p>
                <p className="text-lg font-bold text-foreground leading-tight">{uniqueViewers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="mb-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  Most viewed products
                </h4>
              </div>
              {mostViewedWithDesc.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No product views.</p>
              ) : (
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mostViewedWithDesc.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="product_code" width={70} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload as { product_code: string; views: number; description: string };
                          return (
                            <div className="bg-card border border-border rounded-lg px-2.5 py-2 shadow-md text-xs max-w-[220px]">
                              <p className="font-mono font-medium text-foreground">{d.product_code}</p>
                              {d.description !== "—" && <p className="text-muted-foreground mt-0.5 line-clamp-2">{d.description}</p>}
                              <p className="text-muted-foreground mt-0.5">{d.views} views</p>
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
              <div className="mb-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-primary" />
                  Top search queries
                </h4>
              </div>
              {topSearchQueries.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No search events.</p>
              ) : (
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSearchQueries.slice(0, 6)} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="query" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" height={44} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={24} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload as { query: string; count: number };
                          return (
                            <div className="bg-card border border-border rounded-lg px-2.5 py-2 shadow-md text-xs">
                              <p className="font-medium text-foreground break-all max-w-[180px]">{d.query}</p>
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
              <div className="mb-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  Activity over time
                </h4>
              </div>
              {eventsByDay.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No events.</p>
              ) : (
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={eventsByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="customerActivityGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="short" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={24} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload as { day: string; count: number };
                          return (
                            <div className="bg-card border border-border rounded-lg px-2.5 py-2 shadow-md text-xs">
                              <p className="font-medium text-foreground">{d.day}</p>
                              <p className="text-muted-foreground">{d.count} events</p>
                            </div>
                          );
                        }}
                      />
                      <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#customerActivityGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Failed searches + Who's viewing what */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="mb-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-primary" />
                  Failed searches ({searchNoResultsCount})
                </h4>
              </div>
              {lostRevenue.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3">No failed searches in this period.</p>
              ) : (
                <div className="max-h-[200px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Query</TableHead>
                        <TableHead className="text-right text-xs w-16">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lostRevenue.map(({ query, frequency }) => (
                        <TableRow key={query}>
                          <TableCell className="font-mono text-xs py-1.5 break-all">{query}</TableCell>
                          <TableCell className="text-right py-1.5">
                            <Badge variant="secondary" className="text-xs">{frequency}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="mb-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Who&apos;s viewing what
                </h4>
              </div>
              {whoViewedWhat.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3">No product views.</p>
              ) : (
                <div className="max-h-[200px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs w-28">User</TableHead>
                        <TableHead className="text-xs">Product</TableHead>
                        <TableHead className="text-right text-xs w-20">When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {whoViewedWhat.slice(0, 15).map((row, i) => (
                        <TableRow
                          key={`${row.product_code}-${row.created_at}-${i}`}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/products/${encodeURIComponent(row.product_code)}`)}
                        >
                          <TableCell className="py-1.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-medium text-foreground truncate max-w-[100px]" title={row.user_name}>
                                {row.user_name !== "—" ? row.user_name : "—"}
                              </span>
                              {row.user_email !== "—" && (
                                <span className="text-[10px] text-muted-foreground truncate max-w-[100px]" title={row.user_email}>
                                  {row.user_email}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-1.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-xs text-foreground">{row.product_code}</span>
                              {row.description !== "—" && (
                                <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[160px]">{row.description}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-1.5 text-muted-foreground text-[10px]">
                            {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          {/* Most viewed products table */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="mb-2">
              <h4 className="text-xs font-semibold text-foreground">Most viewed products (full list)</h4>
            </div>
            {mostViewedWithDesc.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">No product views.</p>
            ) : (
              <div className="max-h-[220px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-right text-xs w-20">Views</TableHead>
                      <TableHead className="w-8" />
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
                            <span className="font-mono text-xs font-medium text-foreground">{p.product_code}</span>
                            {p.description !== "—" && (
                              <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[280px]">{p.description}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="font-mono text-xs">{p.views}</Badge>
                        </TableCell>
                        <TableCell>
                          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
