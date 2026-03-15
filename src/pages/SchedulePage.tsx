import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Search, Clock, MapPin, Users, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";

const typeColors: Record<string, string> = {
  session: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  meal: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  free_time: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  assembly: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  sport: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  travel: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  welfare: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
};

const SchedulePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: activities, isLoading } = useQuery({
    queryKey: ["all-schedule-activities", dateFilter],
    queryFn: async () => {
      let q = supabase.from("schedule_activities").select("*").is("deleted_at", null).order("start_time");
      if (dateFilter) q = q.eq("day_date", dateFilter);
      const { data, error } = await q;
      if (error) throw error;

      const instanceIds = [...new Set((data ?? []).map((a: any) => a.instance_id))];
      const iRes = instanceIds.length ? await supabase.from("instances").select("id, name").in("id", instanceIds) : { data: [] };
      const iMap = Object.fromEntries((iRes.data ?? []).map((i: any) => [i.id, i.name]));

      return (data ?? []).map((a: any) => ({ ...a, instance_name: iMap[a.instance_id] ?? a.instance_id }));
    },
  });

  const filtered = (activities ?? []).filter((a: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.instance_name?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q);
  });

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <div className="bg-card border-b border-border px-6 py-5">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Daily Schedule</h1>
            <p className="text-sm text-muted-foreground mt-1">View and manage programme activities across all instances</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search activities..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-[160px]" />
            </div>

            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CalendarDays className="w-10 h-10 mb-3 opacity-40" />
                <p className="font-medium">No activities found</p>
                <p className="text-sm mt-1">Schedule activities from within an instance</p>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instance</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((a: any) => (
                      <TableRow key={a.id} className="cursor-pointer" onClick={() => navigate(`/instances/${a.instance_id}`)}>
                        <TableCell className="text-sm font-medium text-foreground">{a.instance_name}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-foreground">{a.title}</p>
                          {a.description && <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${typeColors[a.activity_type] ?? ""}`}>
                            {a.activity_type.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(parseISO(a.start_time), "HH:mm")} – {format(parseISO(a.end_time), "HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.location ?? "—"}</TableCell>
                        <TableCell>
                          {a.is_published
                            ? <Badge variant="default" className="text-xs gap-1"><Eye className="w-2.5 h-2.5" />Published</Badge>
                            : <Badge variant="outline" className="text-xs">Draft</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SchedulePage;
