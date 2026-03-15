import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useInstances } from "@/hooks/useInstances";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Search, Plus, Download, MoreHorizontal, ArrowUpDown,
  Building2, MapPin, Calendar, Users, ChevronRight, ChevronLeft,
  Award, FolderTree
} from "lucide-react";

const statusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active": return "default" as const;
    case "upcoming": return "secondary" as const;
    case "completed": return "outline" as const;
    case "draft": return "secondary" as const;
    default: return "default" as const;
  }
};

type SortField = "name" | "status" | "start_date" | "participant_count";
type SortDir = "asc" | "desc";
const PAGE_SIZE_OPTIONS = [25, 50, 100];

const InstancesPage = () => {
  const navigate = useNavigate();
  const { data: instances = [], isLoading, error } = useInstances();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("start_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const statuses = useMemo(() => [...new Set(instances.map((i) => i.status))], [instances]);

  const filtered = useMemo(() => {
    return instances
      .filter((i) => {
        const q = search.toLowerCase();
        const matchSearch = !q || i.name.toLowerCase().includes(q) || i.location?.toLowerCase().includes(q);
        const matchStatus = statusFilter === "all" || i.status === statusFilter;
        const matchType = typeFilter === "all" ||
          (typeFilter === "dofe" && i.is_dofe) ||
          (typeFilter === "standard" && !i.is_dofe);
        return matchSearch && matchStatus && matchType;
      })
      .sort((a, b) => {
        let aVal = "", bVal = "";
        switch (sortField) {
          case "name": aVal = a.name; bVal = b.name; break;
          case "status": aVal = a.status; bVal = b.status; break;
          case "start_date": aVal = a.start_date ?? ""; bVal = b.start_date ?? ""; break;
          case "participant_count": return sortDir === "asc" ? a.participant_count - b.participant_count : b.participant_count - a.participant_count;
        }
        const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [instances, search, statusFilter, typeFilter, sortField, sortDir]);

  useMemo(() => setPage(0), [search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const activeCount = instances.filter((i) => i.status === "active").length;
  const dofeCount = instances.filter((i) => i.is_dofe).length;

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-primary" : "text-muted-foreground/50"}`} />
      </button>
    </TableHead>
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Page Banner */}
          <div className="border-b border-border bg-card px-6 py-5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Dashboard</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">Instances</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">Instances</h1>
                {!isLoading && (
                  <Badge variant="secondary" className="text-sm font-medium">{instances.length}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button className="gap-2" onClick={() => navigate("/instances/new")}>
                  <Plus className="w-4 h-4" />
                  New Instance
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Manage events, camps and DofE expeditions</p>
          </div>

          {/* Sticky toolbar */}
          <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3">
            {isLoading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 flex-1 max-w-sm" />
                <Skeleton className="h-10 w-[160px]" />
                <Skeleton className="h-10 w-[160px]" />
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[320px] max-w-xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by name or location..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="dofe">DofE</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Scrollable table area */}
          <div className="flex-1 overflow-auto">
            <div className="bg-card overflow-hidden">
              {isLoading ? (
                <div className="p-8 space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 text-center text-destructive">
                  <p>Failed to load instances.</p>
                  <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <SortableHeader field="name">Name</SortableHeader>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <SortableHeader field="start_date">Start Date</SortableHeader>
                      <SortableHeader field="status">Status</SortableHeader>
                      <SortableHeader field="participant_count">Participants</SortableHeader>
                      <TableHead>Groups</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No instances found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paged.map((inst) => (
                        <TableRow key={inst.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/instances/${inst.id}`)}>
                          <TableCell className="font-medium text-foreground">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                {inst.is_dofe ? <Award className="w-4 h-4 text-amber-500" /> : <Building2 className="w-4 h-4 text-primary" />}
                              </div>
                              {inst.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={inst.is_dofe ? "outline" : "secondary"} className={`text-xs ${inst.is_dofe ? "border-amber-500/30 text-amber-600" : ""}`}>
                              {inst.is_dofe ? "DofE" : "Standard"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{inst.location ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {inst.start_date ? new Date(inst.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </TableCell>
                          <TableCell><Badge variant={statusVariant(inst.status)} className="capitalize">{inst.status}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{inst.participant_count}</TableCell>
                          <TableCell className="text-muted-foreground">{inst.subgroup_count}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/instances/${inst.id}`)}>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
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

          {/* Fixed footer */}
          {!isLoading && !error && (
            <div className="shrink-0 bg-card border-t border-border px-6 py-2.5 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Showing {filtered.length === 0 ? 0 : page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length} results
                {filtered.length < instances.length && <span> (filtered from {instances.length} total)</span>}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-xs">Rows per page</span>
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-xs">
                    {filtered.length === 0 ? "0" : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, filtered.length)}`} of {filtered.length}
                  </span>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
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

export default InstancesPage;
