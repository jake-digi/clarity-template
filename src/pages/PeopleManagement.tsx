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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Plus, Download, MoreHorizontal, ArrowUpDown,
  UserCheck, UserX, Users, ChevronRight as ChevronRightIcon,
  ChevronLeft, ChevronRight, User, Shield, Building2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUsers, type UserRow } from "@/hooks/useUsers";

const statusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active": return "default" as const;
    case "inactive": return "secondary" as const;
    case "suspended": return "destructive" as const;
    default: return "default" as const;
  }
};

type SortField = "name" | "email" | "status" | "created_at";
type SortDir = "asc" | "desc";
const PAGE_SIZE_OPTIONS = [25, 50, 100];

const PeopleManagement = () => {
  const navigate = useNavigate();
  const { data: users = [], isLoading, error } = useUsers();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const allRoles = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.role_names.forEach((r) => set.add(r)));
    return [...set].sort();
  }, [users]);

  const statuses = useMemo(() => [...new Set(users.map((u) => u.status))], [users]);

  const filtered = useMemo(() => {
    return users
      .filter((u) => {
        const q = search.toLowerCase();
        const fullName = `${u.first_name} ${u.surname ?? u.last_name ?? ""}`.toLowerCase();
        const matchSearch = !q || fullName.includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
        const matchRole = roleFilter === "all" || u.role_names.includes(roleFilter);
        const matchStatus = statusFilter === "all" || u.status === statusFilter;
        return matchSearch && matchRole && matchStatus;
      })
      .sort((a, b) => {
        let aVal = "", bVal = "";
        switch (sortField) {
          case "name": aVal = `${a.first_name} ${a.surname ?? ""}`; bVal = `${b.first_name} ${b.surname ?? ""}`; break;
          case "email": aVal = a.email; bVal = b.email; break;
          case "status": aVal = a.status; bVal = b.status; break;
          case "created_at": aVal = a.created_at; bVal = b.created_at; break;
        }
        const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [users, search, roleFilter, statusFilter, sortField, sortDir]);

  useMemo(() => setPage(0), [search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const activeCount = users.filter((u) => u.status === "active").length;
  const inactiveCount = users.filter((u) => u.status === "inactive").length;

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-primary" : "text-muted-foreground/50"}`} />
      </button>
    </TableHead>
  );

  const getUserDisplayName = (u: UserRow) => `${u.first_name} ${u.surname ?? u.last_name ?? ""}`.trim();

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Page Banner */}
          <div className="border-b border-border bg-card px-6 py-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Dashboard</button>
              <ChevronRightIcon className="w-3 h-3" />
              <span className="text-foreground font-medium">Users</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">Users</h1>
                {!isLoading && (
                  <Badge variant="secondary" className="text-sm font-medium">{users.length}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add User
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Manage staff and personnel across all CheckPoint instances</p>
          </div>

          {/* Toolbar — sticky below header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3 space-y-2">
            {isLoading ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 flex-1 max-w-sm" />
                  <Skeleton className="h-10 w-[180px]" />
                  <Skeleton className="h-10 w-[160px]" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[320px] max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search by name, email or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {allRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
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
                </div>

              </>
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
                  <p>Failed to load users. Make sure you're logged in.</p>
                  <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[90px]">ID</TableHead>
                      <SortableHeader field="name">Name</SortableHeader>
                      <SortableHeader field="email">Email</SortableHeader>
                      <TableHead>Roles</TableHead>
                      <TableHead>Instances</TableHead>
                      <SortableHeader field="status">Status</SortableHeader>
                      <SortableHeader field="created_at">Joined</SortableHeader>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No users found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paged.map((u) => (
                        <TableRow key={u.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/people/${u.id}`)}>
                          <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[90px]">
                            <span title={u.id}>{u.id.slice(0, 8)}…</span>
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border overflow-hidden shrink-0">
                                {u.profile_photo_url ? (
                                  <img src={u.profile_photo_url} alt={getUserDisplayName(u)} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <span>{getUserDisplayName(u)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {u.role_names.length > 0 ? u.role_names.map((r) => (
                                <Badge key={r} variant="outline" className="text-xs font-normal">{r}</Badge>
                              )) : <span className="text-xs text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {u.instance_assignments.length > 0 ? u.instance_assignments.map((a) => (
                                <Badge key={a.instance_id} variant="secondary" className="text-xs font-normal">
                                  {a.instance_name}
                                </Badge>
                              )) : <span className="text-xs text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(u.status)} className="capitalize">{u.status}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </TableCell>
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
                                <DropdownMenuItem>Manage Roles</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
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
                {filtered.length < users.length && <span> (filtered from {users.length} total)</span>}
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

export default PeopleManagement;
