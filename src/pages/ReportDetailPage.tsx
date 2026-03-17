import { useParams, useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useReportData } from "@/hooks/useReportData";
import { exportCSV, exportPDF } from "@/lib/reportExport";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Download, FileText, RefreshCw, FileBarChart,
} from "lucide-react";

const reportMeta: Record<string, { name: string; description: string }> = {
  r1: { name: "Orders Summary", description: "Sales orders with status, customer and gross/net totals." },
  r2: { name: "Customer Revenue Report", description: "Customers with total orders, total spent and last order date." },
  r3: { name: "Order Line Items", description: "Line-level order items with product, quantity and amounts." },
};

const ReportDetailPage = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const meta = reportMeta[reportId ?? ""];
  const { data, isLoading, error, refetch, isFetching } = useReportData(reportId, true);

  const handleCSV = () => {
    if (!data) return;
    exportCSV(data.columns, data.rows, `${meta?.name ?? "report"}-${Date.now()}`);
  };

  const handlePDF = () => {
    if (!data) return;
    const summaryLines = data.summary.map((s) => `${s.label}: ${s.value}`);
    exportPDF(
      meta?.name ?? "Report",
      data.columns,
      data.rows,
      summaryLines,
      `${meta?.name ?? "report"}-${Date.now()}`
    );
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="p-6 border-b bg-card">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/reports")} className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {meta?.name ?? "Report"}
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">{meta?.description}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-9 gap-2"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button variant="outline" className="h-9 gap-2" onClick={handleCSV} disabled={!data}>
                  <Download className="w-4 h-4" /> CSV
                </Button>
                <Button variant="outline" className="h-9 gap-2" onClick={handlePDF} disabled={!data}>
                  <FileText className="w-4 h-4" /> PDF
                </Button>
              </div>
            </div>

            {/* Summary cards */}
            {data && (
              <div className="flex flex-wrap gap-3">
                {data.summary.map((s) => (
                  <Card key={s.label} className="border-border/60">
                    <CardContent className="px-4 py-3 flex items-center gap-3">
                      <FileBarChart className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="text-lg font-semibold text-foreground">{s.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {isLoading && (
              <div className="p-6 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}

            {error && (
              <div className="p-6 text-center text-destructive">
                <p className="font-medium">Failed to load report</p>
                <p className="text-sm mt-1">{(error as Error).message}</p>
                <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            )}

            {data && (
              <div className="p-0">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="pl-6 w-12 text-muted-foreground">#</TableHead>
                      {data.columns.map((col) => (
                        <TableHead key={col} className="text-muted-foreground font-medium">{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={data.columns.length + 1} className="text-center py-16 text-muted-foreground">
                          No data found for this report.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.rows.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="pl-6 text-muted-foreground text-xs">{i + 1}</TableCell>
                          {row.map((cell, j) => (
                            <TableCell key={j}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <div className="border-t px-6 py-3 bg-card text-sm text-muted-foreground sticky bottom-0">
                  {data.rows.length} row{data.rows.length !== 1 ? "s" : ""} · Generated {new Date().toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportDetailPage;
