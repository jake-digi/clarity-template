import { useState } from "react";
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
import { Search, Plus, Filter, Download, MoreHorizontal, ArrowUpDown, UserCheck, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Participant {
  id: string;
  name: string;
  email: string;
  age: number;
  group: string;
  instance: string;
  status: "Enrolled" | "Waitlisted" | "Completed" | "Withdrawn";
  enrollDate: string;
  emergencyContact: string;
}

const demoData: Participant[] = [
  { id: "PRT-001", name: "Ethan Goldstein", email: "e.goldstein@mail.com", age: 15, group: "Alpha Squad", instance: "Checkpoint North", status: "Enrolled", enrollDate: "2025-09-01", emergencyContact: "Ruth Goldstein" },
  { id: "PRT-002", name: "Maya Jacobs", email: "m.jacobs@mail.com", age: 14, group: "Bravo Team", instance: "Checkpoint North", status: "Enrolled", enrollDate: "2025-09-03", emergencyContact: "Avi Jacobs" },
  { id: "PRT-003", name: "Oliver Stern", email: "o.stern@mail.com", age: 16, group: "Alpha Squad", instance: "Checkpoint South", status: "Completed", enrollDate: "2024-09-10", emergencyContact: "Miriam Stern" },
  { id: "PRT-004", name: "Sophie Blum", email: "s.blum@mail.com", age: 13, group: "Charlie Unit", instance: "Checkpoint East", status: "Enrolled", enrollDate: "2025-10-15", emergencyContact: "Daniel Blum" },
  { id: "PRT-005", name: "Jake Abrams", email: "j.abrams@mail.com", age: 15, group: "Bravo Team", instance: "Checkpoint North", status: "Waitlisted", enrollDate: "2025-11-02", emergencyContact: "Lisa Abrams" },
  { id: "PRT-006", name: "Ava Rosenberg", email: "a.rosenberg@mail.com", age: 14, group: "Delta Force", instance: "Checkpoint West", status: "Enrolled", enrollDate: "2025-09-08", emergencyContact: "Sam Rosenberg" },
  { id: "PRT-007", name: "Noah Katz", email: "n.katz@mail.com", age: 16, group: "Alpha Squad", instance: "Checkpoint South", status: "Withdrawn", enrollDate: "2025-01-20", emergencyContact: "Rachel Katz" },
  { id: "PRT-008", name: "Lily Fischer", email: "l.fischer@mail.com", age: 13, group: "Charlie Unit", instance: "Checkpoint East", status: "Enrolled", enrollDate: "2025-09-12", emergencyContact: "Tom Fischer" },
  { id: "PRT-009", name: "Ben Shapiro", email: "b.shapiro@mail.com", age: 15, group: "Delta Force", instance: "Checkpoint West", status: "Enrolled", enrollDate: "2025-10-01", emergencyContact: "Anna Shapiro" },
  { id: "PRT-010", name: "Chloe Weiner", email: "c.weiner@mail.com", age: 14, group: "Bravo Team", instance: "Checkpoint North", status: "Completed", enrollDate: "2024-09-05", emergencyContact: "Mark Weiner" },
  { id: "PRT-011", name: "Theo Baum", email: "t.baum@mail.com", age: 16, group: "Alpha Squad", instance: "Checkpoint South", status: "Enrolled", enrollDate: "2025-09-20", emergencyContact: "Helen Baum" },
  { id: "PRT-012", name: "Isla Hartman", email: "i.hartman@mail.com", age: 13, group: "Charlie Unit", instance: "Checkpoint East", status: "Waitlisted", enrollDate: "2025-12-01", emergencyContact: "David Hartman" },
  { id: "PRT-013", name: "Max Levi", email: "m.levi@mail.com", age: 15, group: "Delta Force", instance: "Checkpoint West", status: "Enrolled", enrollDate: "2025-09-18", emergencyContact: "Sarah Levi" },
  { id: "PRT-014", name: "Ruby Feldman", email: "r.feldman@mail.com", age: 14, group: "Bravo Team", instance: "Checkpoint North", status: "Enrolled", enrollDate: "2025-10-10", emergencyContact: "Joel Feldman" },
];

const statusVariant = (status: Participant["status"]) => {
  switch (status) {
    case "Enrolled": return "default";
    case "Waitlisted": return "secondary";
    case "Completed": return "outline";
    case "Withdrawn": return "destructive";
  }
};

type SortField = "name" | "age" | "group" | "instance" | "status" | "enrollDate";
type SortDir = "asc" | "desc";

const Participants = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [instanceFilter, setInstanceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const groups = [...new Set(demoData.map((d) => d.group))];
  const instances = [...new Set(demoData.map((d) => d.instance))];

  const filtered = demoData
    .filter((d) => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
      const matchGroup = groupFilter === "all" || d.group === groupFilter;
      const matchInstance = instanceFilter === "all" || d.instance === instanceFilter;
      const matchStatus = statusFilter === "all" || d.status === statusFilter;
      return matchSearch && matchGroup && matchInstance && matchStatus;
    })
    .sort((a, b) => {
      const aVal = String(a[sortField]);
      const bVal = String(b[sortField]);
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
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
                <p className="text-sm text-muted-foreground">Participant records and details across instances</p>
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
              <Input placeholder="Search by name, email, or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={instanceFilter} onValueChange={setInstanceFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Instance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Instances</SelectItem>
                {instances.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Enrolled">Enrolled</SelectItem>
                <SelectItem value="Waitlisted">Waitlisted</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" title="Export">
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{filtered.length} of {demoData.length} participants</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))]" />
              {demoData.filter((d) => d.status === "Enrolled").length} enrolled
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--muted-foreground))]" />
              {demoData.filter((d) => d.status === "Waitlisted").length} waitlisted
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
                  <SortableHeader field="age">Age</SortableHeader>
                  <SortableHeader field="group">Group</SortableHeader>
                  <SortableHeader field="instance">Instance</SortableHeader>
                  <SortableHeader field="status">Status</SortableHeader>
                  <SortableHeader field="enrollDate">Enrolled</SortableHeader>
                  <TableHead>Emergency Contact</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No participants found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.id}</TableCell>
                      <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.email}</TableCell>
                      <TableCell>{p.age}</TableCell>
                      <TableCell>{p.group}</TableCell>
                      <TableCell className="text-muted-foreground">{p.instance}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(p.enrollDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.emergencyContact}</TableCell>
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
                            <DropdownMenuItem>View Case History</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Withdraw</DropdownMenuItem>
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

export default Participants;
