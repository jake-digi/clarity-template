import { useState, useMemo } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Search, CheckCircle2, XCircle, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormalWarnings } from "@/hooks/useFormalWarnings";
import { cn } from "@/lib/utils";

const warningLevelLabel: Record<number, { label: string; class: string }> = {
  1: { label: "1st Warning", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  2: { label: "2nd Warning", class: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  3: { label: "Final Warning", class: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
};

const FormalWarningsPage = () => {
  const { data: warnings, isLoading } = useFormalWarnings();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    return (warnings ?? []).filter((w) => {
      const matchesSearch =
        !search ||
        w.participant_name?.toLowerCase().includes(search.toLowerCase()) ||
        w.reason.toLowerCase().includes(search.toLowerCase()) ||
        w.issued_by_name?.toLowerCase().includes(search.toLowerCase());
      const matchesLevel = levelFilter === "all" || w.warning_level === Number(levelFilter);
      return matchesSearch && matchesLevel;
    });
  }, [warnings, search, levelFilter]);

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Title */}
          <div className="shrink-0 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Formal Warnings</h1>
              {!isLoading && (
                <Badge variant="secondary" className="text-sm font-medium">{warnings?.length ?? 0}</Badge>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="shrink-0 px-6 pb-3 flex items-center gap-3 sticky top-0 z-10 bg-background">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by participant, reason..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9 h-9" />
            </div>
            <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Warning level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="1">1st Warning</SelectItem>
                <SelectItem value="2">2nd Warning</SelectItem>
                <SelectItem value="3">Final Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Parent Notified</TableHead>
                  <TableHead>Acknowledged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !paged.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                      <Shield className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">No formal warnings found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((w) => {
                    const level = warningLevelLabel[w.warning_level] ?? warningLevelLabel[1];
                    return (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">{w.participant_name}</TableCell>
                        <TableCell className="max-w-[250px] truncate">{w.reason}</TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", level.class)}>
                            {level.label}
                          </span>
                        </TableCell>
                        <TableCell>{w.issued_by_name ?? "Unknown"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(w.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell>
                          {w.parent_notified ? (
                            <Badge variant="default" className="text-[10px] gap-1"><Bell className="w-2.5 h-2.5" />Yes</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] gap-1"><Bell className="w-2.5 h-2.5" />No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {w.acknowledged_by_participant ? (
                            <Badge variant="default" className="text-[10px] gap-1"><CheckCircle2 className="w-2.5 h-2.5" />Yes</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] gap-1"><XCircle className="w-2.5 h-2.5" />No</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          <div className="shrink-0 bg-card border-t border-border px-6 py-2.5 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {filtered.length > 0
                ? `Showing ${page * pageSize + 1}–${Math.min((page + 1) * pageSize, filtered.length)} of ${filtered.length}`
                : "No results"}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Rows</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
                  <SelectTrigger className="h-7 w-[60px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[60px] text-center">{page + 1} / {totalPages}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormalWarningsPage;
