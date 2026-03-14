import { useState, useMemo } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Download, MoreHorizontal, ArrowUpDown, UserCheck, Settings2, ChevronLeft, ChevronRight, Users, Clock, UserX, ChevronRight as ChevronRightIcon, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useParticipants, type ParticipantRow } from "@/hooks/useParticipants";
import { Skeleton } from "@/components/ui/skeleton";

const statusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "active": return "default" as const;
    case "inactive": return "secondary" as const;
    case "completed": return "outline" as const;
    case "withdrawn": return "destructive" as const;
    default: return "default" as const;
  }
};

type ColumnKey = "id" | "full_name" | "gender" | "date_of_birth" | "subgroup_name" | "supergroup_name" | "instance_name" | "updated_at" | "unit_name" | "rank" | "school_institute";

interface ColumnDef {
  key: ColumnKey;
  label: string;
  sortable: boolean;
  defaultVisible: boolean;
  render: (p: ParticipantRow) => React.ReactNode;
  className?: string;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: "id", label: "ID", sortable: false, defaultVisible: true, className: "font-mono text-xs text-muted-foreground truncate max-w-[90px]", render: (p) => <span title={p.id}>{p.id.slice(0, 8)}…</span> },
  { key: "full_name", label: "Name", sortable: true, defaultVisible: true, className: "font-medium text-foreground", render: (p) => (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border overflow-hidden shrink-0">
        {p.photo_link ? (
          <img src={p.photo_link} alt={p.full_name} className="w-full h-full object-cover" />
        ) : (
          <User className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <span>{p.full_name}</span>
    </div>
  ) },
  { key: "gender", label: "Gender", sortable: false, defaultVisible: true, className: "text-muted-foreground", render: (p) => p.gender ?? "—" },
  { key: "date_of_birth", label: "Date of Birth", sortable: true, defaultVisible: false, className: "text-muted-foreground", render: (p) => p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—" },
  { key: "subgroup_name", label: "Subgroup", sortable: true, defaultVisible: true, render: (p) => p.subgroup_name ?? "—" },
  { key: "supergroup_name", label: "Supergroup", sortable: true, defaultVisible: false, render: (p) => p.supergroup_name ?? "—" },
  { key: "instance_name", label: "Instance", sortable: true, defaultVisible: true, className: "text-muted-foreground", render: (p) => (
    <div className="flex flex-wrap gap-1">
      {p.assignments.length <= 1 ? (
        <span>{p.assignments[0]?.instance_name ?? p.instance_name}</span>
      ) : (
        p.assignments.map((a) => (
          <Badge key={a.instance_id} variant="secondary" className="text-xs font-normal">
            {a.instance_name}
          </Badge>
        ))
      )}
    </div>
  ) },
  { key: "updated_at", label: "Last Updated", sortable: true, defaultVisible: true, className: "text-muted-foreground", render: (p) => new Date(p.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
  { key: "unit_name", label: "Unit", sortable: false, defaultVisible: true, className: "text-muted-foreground", render: (p) => p.unit_name ?? "—" },
  { key: "rank", label: "Rank", sortable: false, defaultVisible: false, className: "text-muted-foreground", render: (p) => p.rank ?? "—" },
  { key: "school_institute", label: "School", sortable: false, defaultVisible: false, className: "text-muted-foreground", render: (p) => p.school_institute ?? "—" },
];

type SortField = ColumnKey;
type SortDir = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const Participants = () => {
  const navigate = useNavigate();
  const { data: participants = [], isLoading, error } = useParticipants();

  const [search, setSearch] = useState("");
  const [instanceFilter, setInstanceFilter] = useState("all");
  const [subgroupFilter, setSubgroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("full_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    () => new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key))
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const columns = useMemo(() => ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)), [visibleColumns]);

  const instances = useMemo(() => [...new Set(participants.map((p) => p.instance_name).filter(Boolean))] as string[], [participants]);
  const subgroups = useMemo(() => [...new Set(participants.map((p) => p.subgroup_name).filter(Boolean))] as string[], [participants]);
  const statuses = useMemo(() => [...new Set(participants.map((p) => p.status))], [participants]);

  const filtered = useMemo(() => {
    return participants
      .filter((p) => {
        const q = search.toLowerCase();
        const matchSearch = !q || p.full_name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.unit_name?.toLowerCase().includes(q));
        const matchInstance = instanceFilter === "all" || p.instance_name === instanceFilter;
        const matchSubgroup = subgroupFilter === "all" || p.subgroup_name === subgroupFilter;
        const matchStatus = statusFilter === "all" || p.status === statusFilter;
        return matchSearch && matchInstance && matchSubgroup && matchStatus;
      })
      .sort((a, b) => {
        const aVal = String((a as any)[sortField] ?? "");
        const bVal = String((b as any)[sortField] ?? "");
        const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [participants, search, instanceFilter, subgroupFilter, statusFilter, sortField, sortDir]);

  // Reset page when filters change
  useMemo(() => setPage(0), [search, instanceFilter, subgroupFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const activeCount = participants.filter((p) => p.status === "active").length;

  const inactiveCount = participants.filter((p) => p.status === "inactive").length;

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
        <main className="flex-1 overflow-auto">
          {/* Page Banner */}
          <div className="border-b border-border bg-card px-6 py-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Dashboard</button>
              <ChevronRightIcon className="w-3 h-3" />
              <span className="text-foreground font-medium">Participants</span>
            </div>

            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">Participants</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Manage participant records across all CheckPoint instances</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Participant
                </Button>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-border bg-background px-4 py-3 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-7 w-12" />
                  </div>
                ))
              ) : (
                <>
                  <div className="rounded-lg border border-border bg-background px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Total</span>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{participants.length}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <UserCheck className="w-4 h-4 text-[hsl(var(--success))]" />
                      <span className="text-xs font-medium uppercase tracking-wide">Active</span>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{activeCount}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <UserX className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Inactive</span>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{inactiveCount}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Instances</span>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{instances.length}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="px-6 py-4 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 flex-1 max-w-sm" />
                  <Skeleton className="h-10 w-[200px]" />
                  <Skeleton className="h-10 w-[180px]" />
                  <Skeleton className="h-10 w-[160px]" />
                  <Skeleton className="h-10 w-10" />
                </div>
                <Skeleton className="h-4 w-48" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[320px] max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search by name, ID or unit..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Select value={instanceFilter} onValueChange={setInstanceFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Instance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Instances</SelectItem>
                      {instances.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={subgroupFilter} onValueChange={setSubgroupFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Subgroup" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subgroups</SelectItem>
                      {subgroups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" title="Toggle columns">
                        <Settings2 className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {ALL_COLUMNS.map((col) => (
                        <DropdownMenuCheckboxItem
                          key={col.key}
                          checked={visibleColumns.has(col.key)}
                          onCheckedChange={() => toggleColumn(col.key)}
                        >
                          {col.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-xs text-muted-foreground">
                  Showing {filtered.length === 0 ? 0 : page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length} results
                  {filtered.length < participants.length && <span> (filtered from {participants.length} total)</span>}
                </div>
              </>
            )}

          {/* Data Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {isLoading ? (
              <div className="p-8 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-destructive">
                <p>Failed to load participants. Make sure you're logged in.</p>
                <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) =>
                        col.sortable ? (
                          <SortableHeader key={col.key} field={col.key}>{col.label}</SortableHeader>
                        ) : (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        )
                      )}
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                          No participants found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paged.map((p) => (
                        <TableRow key={p.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/participants/${p.id}`)}>
                          {columns.map((col) => (
                            <TableCell key={col.key} className={col.className}>
                              {col.render(p)}
                            </TableCell>
                          ))}
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                <DropdownMenuItem>Change Group</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Withdraw</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Rows per page</span>
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
                    <span>
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
              </>
            )}
           </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Participants;
