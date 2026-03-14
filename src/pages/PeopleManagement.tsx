import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Filter, Download, MoreHorizontal, ArrowUpDown, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  instance: string;
  status: "Active" | "On Leave" | "Inactive";
  joinDate: string;
  phone: string;
}

const demoData: StaffMember[] = [
  { id: "STF-001", name: "Sarah Cohen", email: "s.cohen@jlgb.org", role: "Programme Lead", instance: "Checkpoint North", status: "Active", joinDate: "2023-09-15", phone: "+44 7700 100201" },
  { id: "STF-002", name: "Daniel Levy", email: "d.levy@jlgb.org", role: "Group Leader", instance: "Checkpoint North", status: "Active", joinDate: "2023-11-02", phone: "+44 7700 100202" },
  { id: "STF-003", name: "Rebecca Marks", email: "r.marks@jlgb.org", role: "Safeguarding Officer", instance: "Checkpoint South", status: "Active", joinDate: "2022-06-10", phone: "+44 7700 100203" },
  { id: "STF-004", name: "Joshua Klein", email: "j.klein@jlgb.org", role: "Activities Coordinator", instance: "Checkpoint East", status: "On Leave", joinDate: "2024-01-20", phone: "+44 7700 100204" },
  { id: "STF-005", name: "Hannah Goldberg", email: "h.goldberg@jlgb.org", role: "Admin Assistant", instance: "Checkpoint North", status: "Active", joinDate: "2024-03-05", phone: "+44 7700 100205" },
  { id: "STF-006", name: "Michael Rosen", email: "m.rosen@jlgb.org", role: "Transport Manager", instance: "Checkpoint West", status: "Active", joinDate: "2023-04-18", phone: "+44 7700 100206" },
  { id: "STF-007", name: "Emma Friedman", email: "e.friedman@jlgb.org", role: "Group Leader", instance: "Checkpoint South", status: "Inactive", joinDate: "2022-08-30", phone: "+44 7700 100207" },
  { id: "STF-008", name: "Adam Silver", email: "a.silver@jlgb.org", role: "Programme Lead", instance: "Checkpoint East", status: "Active", joinDate: "2023-07-12", phone: "+44 7700 100208" },
  { id: "STF-009", name: "Rachel Green", email: "r.green@jlgb.org", role: "Medical Officer", instance: "Checkpoint North", status: "Active", joinDate: "2024-02-14", phone: "+44 7700 100209" },
  { id: "STF-010", name: "David Harris", email: "d.harris@jlgb.org", role: "Security Lead", instance: "Checkpoint West", status: "On Leave", joinDate: "2022-11-25", phone: "+44 7700 100210" },
  { id: "STF-011", name: "Leah Bernstein", email: "l.bernstein@jlgb.org", role: "Activities Coordinator", instance: "Checkpoint North", status: "Active", joinDate: "2023-05-08", phone: "+44 7700 100211" },
  { id: "STF-012", name: "Nathan Weiss", email: "n.weiss@jlgb.org", role: "Group Leader", instance: "Checkpoint South", status: "Active", joinDate: "2024-01-03", phone: "+44 7700 100212" },
];

const statusVariant = (status: StaffMember["status"]) => {
  switch (status) {
    case "Active": return "default";
    case "On Leave": return "secondary";
    case "Inactive": return "destructive";
  }
};

type SortField = "name" | "role" | "instance" | "status" | "joinDate";
type SortDir = "asc" | "desc";

const PeopleManagement = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [instanceFilter, setInstanceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const roles = [...new Set(demoData.map((d) => d.role))];
  const instances = [...new Set(demoData.map((d) => d.instance))];

  const filtered = demoData
    .filter((d) => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || d.role === roleFilter;
      const matchInstance = instanceFilter === "all" || d.instance === instanceFilter;
      const matchStatus = statusFilter === "all" || d.status === statusFilter;
      return matchSearch && matchRole && matchInstance && matchStatus;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-primary" : "text-muted-foreground/50"}`} />
      </button>
    </TableHead>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Users className="w-5 h-5 text-icon-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">People Management</h1>
                <p className="text-sm text-muted-foreground">Manage staff and personnel across instances</p>
              </div>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Staff Member
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={instanceFilter} onValueChange={setInstanceFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Instance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Instances</SelectItem>
                {instances.map((i) => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" title="Export">
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{filtered.length} of {demoData.length} staff members</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))]" />
              {demoData.filter((d) => d.status === "Active").length} active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--muted-foreground))]" />
              {demoData.filter((d) => d.status === "On Leave").length} on leave
            </span>
          </div>

          {/* Data Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px]">ID</TableHead>
                  <SortableHeader field="name">Name</SortableHeader>
                  <TableHead>Email</TableHead>
                  <SortableHeader field="role">Role</SortableHeader>
                  <SortableHeader field="instance">Instance</SortableHeader>
                  <SortableHeader field="status">Status</SortableHeader>
                  <SortableHeader field="joinDate">Joined</SortableHeader>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No staff members found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell className="font-mono text-xs text-muted-foreground">{member.id}</TableCell>
                      <TableCell className="font-medium text-foreground">{member.name}</TableCell>
                      <TableCell className="text-muted-foreground">{member.email}</TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell className="text-muted-foreground">{member.instance}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(member.status)}>{member.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(member.joinDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
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
                            <DropdownMenuItem>Reassign Instance</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PeopleManagement;
