import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import FormalWarningsSheet from "@/components/FormalWarningsSheet";
import CasesKanban from "@/components/CasesKanban";
import NewCaseDialog from "@/components/NewCaseDialog";
import { useCases } from "@/hooks/useCases";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Search, Plus, Filter, Shield, LayoutList, Columns3 } from "lucide-react";

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  open: "default",
  "in-progress": "secondary",
  closed: "secondary",
  resolved: "default",
};

const CasesPage = () => {
  const navigate = useNavigate();
  const { data: cases, isLoading } = useCases();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [newCaseOpen, setNewCaseOpen] = useState(false);

  const welfareCategoriesList = ["Safeguarding", "Homesickness", "Other"];

  const filtered = (cases ?? []).filter((c) => {
    const matchesSearch =
      !search ||
      c.participant_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.overview?.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());
    const isWelfare = welfareCategoriesList.includes(c.category);
    const matchesCategory =
      categoryFilter === "all" ||
      (categoryFilter === "welfare" && isWelfare) ||
      (categoryFilter === "behaviour" && !isWelfare);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || c.severity_level === severityFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesSeverity;
  });

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Page Banner */}
          <div className="border-b border-border bg-card px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">Case Management</h1>
                  {!isLoading && (
                    <Badge variant="secondary" className="text-sm font-medium">{(cases ?? []).length}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Track and manage behaviour cases across instances</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2" onClick={() => setWarningsOpen(true)}>
                  <Shield className="w-4 h-4" />
                  Formal Warnings
                </Button>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Case
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search cases..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="behaviour">Behaviour</SelectItem>
                  <SelectItem value="welfare">Welfare</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[140px]">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setView("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                    view === "table" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <LayoutList className="w-4 h-4" /> Table
                </button>
                <button
                  onClick={() => setView("kanban")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                    view === "kanban" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Columns3 className="w-4 h-4" /> Kanban
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : view === "kanban" ? (
              <div className="p-6">
                <CasesKanban cases={filtered} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <AlertTriangle className="w-10 h-10 mb-3 opacity-40" />
                <p className="font-medium">No cases found</p>
                <p className="text-sm mt-1">Adjust your filters or create a new case</p>
              </div>
            ) : (
              <div className="bg-card overflow-hidden">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Instance</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/cases/${c.id}`)}
                      >
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-foreground">{c.participant_name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[250px]">{c.overview}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{c.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[c.severity_level] ?? ""}`}>
                            {c.severity_level}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[c.status] ?? "outline"} className="capitalize text-xs">{c.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.instance_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.assigned_to_name ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Fixed footer */}
          {!isLoading && view === "table" && filtered.length > 0 && (
            <div className="shrink-0 bg-card border-t border-border px-6 py-2.5 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Showing {filtered.length} of {(cases ?? []).length} cases
              </div>
            </div>
          )}
        </main>
      </div>
      <FormalWarningsSheet open={warningsOpen} onOpenChange={setWarningsOpen} />
    </div>
  );
};

export default CasesPage;
