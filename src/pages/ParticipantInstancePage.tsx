import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useParticipant } from "@/hooks/useParticipant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SectionCard, InfoRow, EmptyState, statusVariant } from "@/components/participant/ProfileShared";
import {
  ChevronRight, Building2, MapPin, Calendar, Users, Bed,
  Heart, AlertTriangle, ShieldAlert, Clock, FileText, Activity,
  ArrowLeft, UserCheck, Pencil
} from "lucide-react";

const ParticipantInstancePage = () => {
  const { id, instanceId } = useParams<{ id: string; instanceId: string }>();
  const navigate = useNavigate();
  const { data: p, isLoading, error } = useParticipant(id ?? "");
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 overflow-auto">
            <div className="border-b border-border bg-card px-6 py-5 space-y-3">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-96" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !p) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive font-medium">Participant or instance not found</p>
              <Button variant="outline" className="mt-3" onClick={() => navigate(`/participants/${id}`)}>Back to Profile</Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const assignment = p.assignments?.find((a) => a.id === instanceId);
  if (!assignment) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive font-medium">Instance assignment not found</p>
              <Button variant="outline" className="mt-3" onClick={() => navigate(`/participants/${id}`)}>Back to Profile</Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const instanceLogs = (p.activityLogs ?? []).filter((l) => l.instance_id === assignment.instance_id);

  const tabs = [
    { value: "overview", label: "Overview", icon: Building2 },
    { value: "accommodation", label: "Accommodation", icon: Bed },
    { value: "activity", label: "Activity", icon: Activity },
    { value: "welfare", label: "Welfare", icon: Heart },
    { value: "behaviour", label: "Behaviour", icon: ShieldAlert },
    { value: "notes", label: "Notes", icon: FileText },
    { value: "timetable", label: "Timetable", icon: Clock },
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <div className="bg-card border-b border-border">
            <div className="px-6 py-5">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Dashboard</button>
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => navigate("/participants")} className="hover:text-foreground transition-colors">Participants</button>
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => navigate(`/participants/${id}`)} className="hover:text-foreground transition-colors">{p.full_name}</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">{assignment.instance_name}</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-xl font-semibold text-foreground tracking-tight">{assignment.instance_name}</h1>
                      {assignment.instance_status && (
                        <Badge variant={assignment.instance_status === "active" ? "default" : "secondary"} className="capitalize">{assignment.instance_status}</Badge>
                      )}
                      {assignment.is_off_site && <Badge variant="outline" className="text-destructive border-destructive/30">Off-site</Badge>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{p.full_name}</span>
                      {assignment.instance_location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{assignment.instance_location}</span>}
                      {assignment.subgroup_name && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{assignment.subgroup_name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => navigate(`/participants/${id}`)}>
                    <ArrowLeft className="w-4 h-4" />
                    Back to Profile
                  </Button>
                  <Button className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-t border-border bg-muted/50">
                <TabsList className="bg-transparent h-11 w-full justify-start p-0 rounded-none gap-0">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-none h-full px-5 text-sm gap-1.5 border-b-2 border-transparent text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground hover:bg-background/50 transition-colors shrink-0"
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="px-6 py-6">
                {/* Overview */}
                <TabsContent value="overview" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SectionCard title="Instance Details" icon={Building2}>
                      <InfoRow label="Instance" value={assignment.instance_name} icon={Building2} />
                      <InfoRow label="Location" value={assignment.instance_location} icon={MapPin} />
                      <InfoRow label="Dates" value={
                        assignment.instance_start_date && assignment.instance_end_date
                          ? `${new Date(assignment.instance_start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(assignment.instance_end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                          : null
                      } icon={Calendar} />
                      <InfoRow label="Status" value={
                        assignment.instance_status
                          ? <Badge variant={assignment.instance_status === "active" ? "default" : "secondary"} className="capitalize text-xs">{assignment.instance_status}</Badge>
                          : null
                      } />
                    </SectionCard>

                    <SectionCard title="Groups" icon={Users}>
                      <InfoRow label="Supergroup" value={assignment.supergroup_name} icon={Users} />
                      <InfoRow label="Subgroup" value={assignment.subgroup_name} icon={Users} />
                    </SectionCard>
                  </div>
                </TabsContent>

                {/* Accommodation */}
                <TabsContent value="accommodation" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SectionCard title="Room & Stay" icon={Bed}>
                      <InfoRow label="Room" value={assignment.room_number} icon={Bed} />
                      <InfoRow label="Arrival" value={assignment.arrival_date ? new Date(assignment.arrival_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null} icon={Calendar} />
                      <InfoRow label="Departure" value={assignment.departure_date ? new Date(assignment.departure_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null} icon={Calendar} />
                      {assignment.is_off_site && <InfoRow label="Off-site reason" value={assignment.off_site_comment} icon={AlertTriangle} />}
                    </SectionCard>

                    <SectionCard title="Roommates" icon={UserCheck}>
                      <EmptyState icon={UserCheck} message="Roommate information will appear here once accommodation is configured." />
                    </SectionCard>
                  </div>
                </TabsContent>

                {/* Activity */}
                <TabsContent value="activity" className="mt-0">
                  <SectionCard title="Recent Activity" icon={Activity}>
                    {instanceLogs.length > 0 ? (
                      <div className="space-y-0 divide-y divide-border">
                        {instanceLogs.slice(0, 30).map((log) => (
                          <div key={log.id} className="flex items-start gap-3 py-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.flagged_as_incident ? "bg-destructive" : "bg-primary/60"}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{log.title || log.log_type}</span>
                                {log.flagged_as_incident && <Badge variant="destructive" className="text-[10px]">Incident</Badge>}
                              </div>
                              {log.notes && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.notes}</p>}
                              <p className="text-[11px] text-muted-foreground/60 mt-1">
                                {new Date(log.time_observed).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={Activity} message="No activity logs recorded for this instance yet." />
                    )}
                  </SectionCard>
                </TabsContent>

                {/* Welfare */}
                <TabsContent value="welfare" className="mt-0">
                  <SectionCard title="Medical & Welfare" icon={Heart}>
                    <EmptyState icon={Heart} message="Instance-specific welfare cases will appear here." />
                  </SectionCard>
                </TabsContent>

                {/* Behaviour */}
                <TabsContent value="behaviour" className="mt-0">
                  <SectionCard title="Behaviour & Incidents" icon={ShieldAlert}>
                    <EmptyState icon={ShieldAlert} message="Behaviour records and incident reports for this instance will appear here." />
                  </SectionCard>
                </TabsContent>

                {/* Notes */}
                <TabsContent value="notes" className="mt-0">
                  <SectionCard title="Notes" icon={FileText}>
                    <EmptyState icon={FileText} message="Notes for this participant within this instance will appear here." />
                  </SectionCard>
                </TabsContent>

                {/* Timetable */}
                <TabsContent value="timetable" className="mt-0">
                  <SectionCard title="Timetable" icon={Clock}>
                    <EmptyState icon={Clock} message="Stage schedule and timetable for this instance will appear here." />
                  </SectionCard>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ParticipantInstancePage;
