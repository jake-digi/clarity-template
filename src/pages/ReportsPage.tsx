import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Plus, Download, MoreHorizontal, Filter, Calendar, Share2, Star,
  Play, History, Timer, Zap, FileText, TrendingUp, Users, Building2, Shield,
  BedDouble, AlertTriangle, BarChart3, Tag,
} from "lucide-react";

interface Report {
  id: string;
  name: string;
  description: string;
  type: "templated" | "custom" | "real-time";
  lastRun?: string;
  frequency?: string;
  category: string;
  status: "active" | "scheduled" | "draft";
}

const reports: Report[] = [
  {
    id: "r1",
    name: "Participant Summary",
    description: "Participant counts broken down by instance, group, gender, and current status.",
    type: "templated",
    lastRun: "2 hours ago",
    frequency: "Weekly",
    category: "Participants",
    status: "active",
  },
  {
    id: "r2",
    name: "Attendance & Check-in Report",
    description: "Real-time check-in session data and attendance rates across all active instances.",
    type: "real-time",
    category: "Operations",
    status: "active",
  },
  {
    id: "r3",
    name: "Cases & Incidents Report",
    description: "Behavior cases analysed by severity, status, and category with trend data.",
    type: "templated",
    lastRun: "1 day ago",
    category: "Safeguarding",
    status: "scheduled",
  },
  {
    id: "r4",
    name: "Accommodation Occupancy",
    description: "Room and block utilization rates with vacancy forecasts per instance.",
    type: "real-time",
    category: "Accommodation",
    status: "active",
  },
  {
    id: "r5",
    name: "Formal Warnings Summary",
    description: "Overview of warnings issued across instances with acknowledgement tracking.",
    type: "custom",
    lastRun: "30 mins ago",
    category: "Safeguarding",
    status: "active",
  },
  {
    id: "r6",
    name: "Instance Comparison",
    description: "Cross-instance metrics comparison covering headcount, cases, and completion rates.",
    type: "custom",
    category: "Analytics",
    status: "draft",
  },
];

const typeStyles: Record<Report["type"], string> = {
  templated: "bg-primary/10 text-primary border-primary/20",
  custom: "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-300",
  "real-time": "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300",
};

const typeIcons: Record<Report["type"], React.ReactNode> = {
  templated: <FileText className="w-3 h-3 mr-1" />,
  custom: <Zap className="w-3 h-3 mr-1" />,
  "real-time": <Timer className="w-3 h-3 mr-1" />,
};

const categoryIcons: Record<string, React.ElementType> = {
  Participants: Users,
  Operations: BarChart3,
  Safeguarding: Shield,
  Accommodation: BedDouble,
  Analytics: TrendingUp,
};

const ReportTypeBadge = ({ type }: { type: Report["type"] }) => (
  <Badge variant="outline" className={`${typeStyles[type]} flex items-center font-medium capitalize`}>
    {typeIcons[type]}
    {type.replace("-", " ")}
  </Badge>
);

const ReportCard = ({ report, onRun }: { report: Report; onRun: (id: string) => void }) => {
  const CatIcon = categoryIcons[report.category] ?? Tag;
  return (
    <Card className="group overflow-hidden border-border/60 hover:border-primary/40 transition-all hover:shadow-lg">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between mb-2">
          <ReportTypeBadge type={report.type} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2" onClick={() => onRun(report.id)}><Play className="w-4 h-4" /> Run Now</DropdownMenuItem>
              <DropdownMenuItem className="gap-2"><Calendar className="w-4 h-4" /> Schedule</DropdownMenuItem>
              <DropdownMenuItem className="gap-2"><Share2 className="w-4 h-4" /> Share</DropdownMenuItem>
              <DropdownMenuItem className="gap-2"><Star className="w-4 h-4" /> Favourite</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors cursor-pointer">
          {report.name}
        </CardTitle>
        <CardDescription className="line-clamp-2 mt-2 h-10">
          {report.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Last run: {report.lastRun ?? "Never"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CatIcon className="w-3.5 h-3.5" />
              <span className="font-medium bg-muted px-1.5 py-0.5 rounded">{report.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button onClick={() => onRun(report.id)} className="flex-1 h-9 rounded-md gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-none text-xs font-semibold uppercase tracking-wider shadow-none">
              <Play className="w-3.5 h-3.5" /> Run Report
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-md">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ReportsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filtered = useMemo(() => {
    let list = reports;
    if (activeTab === "templated") list = list.filter((r) => r.type === "templated");
    else if (activeTab === "custom") list = list.filter((r) => r.type === "custom");
    else if (activeTab === "realtime") list = list.filter((r) => r.type === "real-time");
    else if (activeTab === "scheduled") list = list.filter((r) => r.status === "scheduled");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b bg-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
                <p className="text-muted-foreground mt-1">
                  Produce, run, and schedule analytics across your organisation.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-9 px-3 gap-2">
                  <History className="w-4 h-4" /> Run History
                </Button>
                <Button variant="outline" className="h-9 px-3 gap-2">
                  <Calendar className="w-4 h-4" /> Schedules
                </Button>
                <Button className="h-9 px-4 gap-2">
                  <Plus className="w-4 h-4" /> Create Custom Report
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports by name, description or category…"
                  className="pl-10 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="h-10 px-3 gap-2">
                <Filter className="w-4 h-4" /> Filters
              </Button>
              <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground mr-4">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>{reports.length} Report Templates</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 bg-muted/50 p-1 border h-11">
                <TabsTrigger value="all" className="px-6">All Reports</TabsTrigger>
                <TabsTrigger value="templated" className="px-6">Templates</TabsTrigger>
                <TabsTrigger value="custom" className="px-6">Custom</TabsTrigger>
                <TabsTrigger value="realtime" className="px-6">Real-time</TabsTrigger>
                <TabsTrigger value="scheduled" className="px-6">Scheduled</TabsTrigger>
              </TabsList>

              {["all", "templated", "custom", "realtime", "scheduled"].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((report) => (
                      <ReportCard key={report.id} report={report} />
                    ))}

                    {/* Create new card */}
                    <button className="h-full min-h-[220px] rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-primary group">
                      <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <Plus className="w-6 h-6" />
                      </div>
                      <div className="text-center px-6">
                        <p className="font-semibold text-sm">Create Custom Report</p>
                        <p className="text-xs mt-1">Builder mode with custom metrics and filters</p>
                      </div>
                    </button>
                  </div>

                  {filtered.length === 0 && (
                    <div className="py-20 text-center text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No reports match your criteria.</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportsPage;
