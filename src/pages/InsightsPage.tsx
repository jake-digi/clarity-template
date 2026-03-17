import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Search,
  Eye,
  AlertCircle,
  BarChart3,
  TrendingUp,
} from "lucide-react";

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

function usePortalAnalytics(since: Date) {
  return useQuery({
    queryKey: ["portal_analytics", since.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portal_analytics")
        .select("id, event_type, product_code, metadata, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return (data ?? []) as AnalyticsRow[];
    },
  });
}

function useOrderedProductCodes() {
  return useQuery({
    queryKey: ["ordered_product_codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_order_items")
        .select("stock_code");
      if (error) throw error;
      const codes = new Set((data ?? []).map((r: { stock_code: string | null }) => r.stock_code).filter(Boolean));
      return Array.from(codes) as string[];
    },
  });
}

function InsightsPage() {
  const [days, setDays] = useState("30");
  const since = useMemo(() => getSinceDays(days), [days]);

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
      .slice(0, 20);
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

  const mostViewedNeverOrdered = useMemo(() => {
    const orderedSet = new Set(orderedCodes);
    return mostViewed.filter((p) => !orderedSet.has(p.product_code)).slice(0, 20);
  }, [mostViewed, orderedCodes]);

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
      .slice(0, 20);
  }, [rows]);

  const eventCounts = useMemo(() => {
    const byType: Record<string, number> = {};
    rows.forEach((r) => {
      byType[r.event_type] = (byType[r.event_type] ?? 0) + 1;
    });
    return Object.entries(byType)
      .sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const loading = analyticsLoading;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-border bg-card px-6 py-5 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                  Insights
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Analytics and intelligence from portal behaviour
                </p>
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
          </div>

          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : (
              <div className="grid gap-6 max-w-6xl">
                {/* Lost revenue: search no results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      Lost revenue (search with no results)
                    </CardTitle>
                    <CardDescription>
                      Queries that returned zero results — what users want but you may not stock
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {lostRevenue.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No search_no_results events in this period.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Search query</TableHead>
                            <TableHead className="text-right w-28">Frequency</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lostRevenue.map(({ query, frequency }) => (
                            <TableRow key={query}>
                              <TableCell className="font-mono text-sm">{query}</TableCell>
                              <TableCell className="text-right">{frequency}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Most viewed products */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Eye className="w-4 h-4 text-primary" />
                      Most viewed products
                    </CardTitle>
                    <CardDescription>
                      Product pages with the most views in the selected period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {mostViewed.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No view_product events in this period.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product code</TableHead>
                            <TableHead className="text-right w-28">Views</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mostViewed.map(({ product_code, views }) => (
                            <TableRow key={product_code}>
                              <TableCell className="font-mono text-sm">{product_code}</TableCell>
                              <TableCell className="text-right">{views}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Most viewed but never ordered */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Most viewed, never ordered
                    </CardTitle>
                    <CardDescription>
                      High interest products that have not been ordered yet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {orderedLoading ? (
                      <Skeleton className="h-24 w-full" />
                    ) : mostViewedNeverOrdered.length === 0 ? (
                      <p className="text-sm text-muted-foreground">None in this period, or all viewed products have been ordered.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product code</TableHead>
                            <TableHead className="text-right w-28">Views</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mostViewedNeverOrdered.map(({ product_code, views }) => (
                            <TableRow key={product_code}>
                              <TableCell className="font-mono text-sm">{product_code}</TableCell>
                              <TableCell className="text-right">{views}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Top search queries */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Search className="w-4 h-4 text-primary" />
                      Top search queries
                    </CardTitle>
                    <CardDescription>
                      Most used search and search_click queries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topSearchQueries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No search events in this period.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Query</TableHead>
                            <TableHead className="text-right w-28">Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topSearchQueries.map(({ query, count }) => (
                            <TableRow key={query}>
                              <TableCell className="font-mono text-sm">{query}</TableCell>
                              <TableCell className="text-right">{count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Event breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Events by type
                    </CardTitle>
                    <CardDescription>
                      Count of each event type in the selected period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {eventCounts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No events in this period.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event type</TableHead>
                            <TableHead className="text-right w-28">Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eventCounts.map(([eventType, count]) => (
                            <TableRow key={eventType}>
                              <TableCell className="font-mono text-sm">{eventType}</TableCell>
                              <TableCell className="text-right">{count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default InsightsPage;
