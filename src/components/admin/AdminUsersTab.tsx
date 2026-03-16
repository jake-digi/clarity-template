import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, ArrowUpDown, ChevronLeft, ChevronRight, User, UserPlus,
} from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import InviteUserDialog from "./InviteUserDialog";
import UserActionsMenu from "./UserActionsMenu";

type SortField = "name" | "email" | "role" | "created_at";
type SortDir = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const AdminUsersTab = () => {
  const navigate = useNavigate();
  const { data: users = [], isLoading, error } = useUsers();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [inviteOpen, setInviteOpen] = useState(false);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(0);
  };

  const filtered = useMemo(() => {
    let list = [...users];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.customer_name ?? "").toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") {
      if (roleFilter === "admin") list = list.filter((u) => u.is_admin);
      else if (roleFilter === "disabled") list = list.filter((u) => !u.is_active);
      else list = list.filter((u) => !u.is_admin && (u.role ?? "customer") === roleFilter);
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "email") cmp = a.email.localeCompare(b.email);
      else if (sortField === "role") cmp = (a.role ?? "").localeCompare(b.role ?? "");
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [users, search, roleFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const SortHeader = ({ field, children }: { field: SortField; children: string }) => (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => toggleSort(field)}
    >
      {children}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-primary" : "text-muted-foreground/50"}`} />
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3">
        {isLoading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 flex-1 max-w-sm" />
            <Skeleton className="h-9 w-[140px]" />
            <Skeleton className="h-9 w-24" />
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[280px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or customer…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9 h-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground ml-auto">
              {filtered.length} user{filtered.length !== 1 ? "s" : ""}
            </p>
            <Button size="sm" className="h-9 gap-1.5" onClick={() => setInviteOpen(true)}>
              <UserPlus className="w-4 h-4" />
              Invite User
            </Button>
          </div>
        )}
      </div>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="bg-card">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive text-sm">
              Failed to load users: {(error as any)?.message}
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-[240px]"><SortHeader field="name">Name</SortHeader></TableHead>
                  <TableHead><SortHeader field="email">Email</SortHeader></TableHead>
                  <TableHead className="w-[200px]">Customer</TableHead>
                  <TableHead className="w-[100px]"><SortHeader field="role">Role</SortHeader></TableHead>
                  <TableHead className="w-[80px]">Admin</TableHead>
                  <TableHead className="w-[120px]"><SortHeader field="created_at">Joined</SortHeader></TableHead>
                  <TableHead className="w-[52px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((u) => (
                    <TableRow
                      key={u.id}
                      className={`cursor-pointer hover:bg-muted/50 ${!u.is_active ? "opacity-50" : ""}`}
                      onClick={() => navigate(`/people/${u.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-sm truncate">{u.name}</span>
                            {!u.is_active && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground shrink-0">
                                Disabled
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.customer_name ? (
                          <span className="font-mono text-xs text-foreground">{u.customer_name}</span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {u.role ?? "customer"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.is_admin ? (
                          <Badge className="text-xs">Admin</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "2-digit",
                        })}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <UserActionsMenu user={u} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Footer */}
      {!isLoading && !error && (
        <div className="shrink-0 bg-card border-t border-border px-6 py-2.5 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Showing {filtered.length === 0 ? 0 : page * pageSize + 1}–
            {Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length} results
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-xs">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}
              >
                <SelectTrigger className="h-8 w-[70px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
              </span>
              <Button
                variant="outline" size="icon" className="h-8 w-8"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline" size="icon" className="h-8 w-8"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersTab;
