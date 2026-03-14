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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Filter, Download, MoreHorizontal, ArrowUpDown, UserCheck, ArrowLeft, Loader2 } from "lucide-react";
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

type SortField = "full_name" | "status" | "instance_name" | "subgroup_name" | "created_at";
type SortDir = "asc" | "desc";

const Participants = () => {
  const navigate = useNavigate();
  const { data: participants = [], isLoading, error } = useParticipants();

  const [search, setSearch] = useState("");
  const [instanceFilter, setInstanceFilter] = useState("all");
  const [subgroupFilter, setSubgroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("full_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

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

  const activeCount = participants.filter((p) => p.status === "active").length;

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
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-icon-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Participants</h1>
                <p className="text-sm text-muted-foreground">Participant records across all instances</p>
              </div>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Participant
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
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
            <Button variant="outline" size="icon" title="Export">
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{filtered.length} of {participants.length} participants</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))]" />
              {activeCount} active
            </span>
          </div>

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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">ID</TableHead>
                    <SortableHeader field="full_name">Name</SortableHeader>
                    <TableHead>Gender</TableHead>
                    <SortableHeader field="subgroup_name">Subgroup</SortableHeader>
                    <SortableHeader field="instance_name">Instance</SortableHeader>
                    <SortableHeader field="status">Status</SortableHeader>
                    <SortableHeader field="created_at">Created</SortableHeader>
                    <TableHead>Unit</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No participants found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/50 cursor-pointer">
                        <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[90px]" title={p.id}>
                          {p.id.slice(0, 8)}…
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{p.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{p.gender ?? "—"}</TableCell>
                        <TableCell>{p.subgroup_name ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{p.instance_name}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(p.status)} className="capitalize">{p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.unit_name ?? "—"}</TableCell>
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Participants;
