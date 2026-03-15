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
import { useUsers, type UserRow } from "@/hooks/useUsers";
import InviteUserDialog from "./InviteUserDialog";

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

const AdminUsersTab = () => {
  const navigate = useNavigate();
  const { data: users = [], isLoading } = useUsers();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);
  const pageSize = 25;

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let list = [...users];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        `${u.first_name} ${u.last_name ?? u.surname ?? ""}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((u) => u.status === statusFilter);
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = `${a.first_name} ${a.last_name ?? ""}`.localeCompare(`${b.first_name} ${b.last_name ?? ""}`);
      else if (sortField === "email") cmp = a.email.localeCompare(b.email);
      else if (sortField === "status") cmp = (a.status ?? "").localeCompare(b.status ?? "");
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [users, search, statusFilter, sortField, sortDir]);

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const SortHeader = ({ field, children }: { field: SortField; children: string }) => (
    <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort(field)}>
      {children}<ArrowUpDown className="w-3 h-3" />
    </button>
  );

  if (isLoading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground ml-auto">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[280px]"><SortHeader field="name">Name</SortHeader></TableHead>
              <TableHead><SortHeader field="email">Email</SortHeader></TableHead>
              <TableHead className="w-[100px]"><SortHeader field="status">Status</SortHeader></TableHead>
              <TableHead className="w-[140px]">Roles</TableHead>
              <TableHead className="w-[120px]"><SortHeader field="created_at">Joined</SortHeader></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((u) => (
              <TableRow
                key={u.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => navigate(`/people/${u.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-sm">{u.first_name} {u.last_name ?? u.surname ?? ""}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell><Badge variant={statusVariant(u.status)} className="capitalize text-xs">{u.status}</Badge></TableCell>
                <TableCell>
                  {u.role_names?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {u.role_names.slice(0, 2).map((r) => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}
                      {u.role_names.length > 2 && <Badge variant="secondary" className="text-[10px]">+{u.role_names.length - 2}</Badge>}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersTab;
