import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SectionCard, InfoRow, EmptyState } from "@/components/participant/ProfileShared";
import {
  ChevronRight, Building2, MapPin, Calendar, Users, Award,
  ClipboardList, ArrowLeft, Pencil, Settings, FolderTree,
  CheckCircle2, Lock, Play, Plus, GripVertical, Navigation, Briefcase
} from "lucide-react";
import InstanceTrackingTab from "@/components/instance/InstanceTrackingTab";
import InstanceCasesTab from "@/components/instance/InstanceCasesTab";

const InstanceDetailPage = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: instance, isLoading } = useQuery({
    queryKey: ["instance", instanceId],
    enabled: !!instanceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instances")
        .select("*")
        .eq("id", instanceId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["stage-templates", instanceId],
    enabled: !!instanceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stage_templates")
        .select("*")
        .eq("instance_id", instanceId!)
        .is("deleted_at", null)
        .order("order_number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: stageTasks = [] } = useQuery({
    queryKey: ["stage-tasks", instanceId],
    enabled: !!instanceId && stages.length > 0,
    queryFn: async () => {
      const stageIds = stages.map((s) => s.id);
      const { data, error } = await supabase
        .from("stage_tasks")
        .select("*")
        .in("stage_template_id", stageIds)
        .order("order_number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: subgroups = [] } = useQuery({
    queryKey: ["instance-subgroups", instanceId],
    enabled: !!instanceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subgroups")
        .select("id, name, parent_supergroup_id")
        .eq("instance_id", instanceId!)
        .is("deleted_at", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: supergroups = [] } = useQuery({
    queryKey: ["instance-supergroups", instanceId],
    enabled: !!instanceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supergroups")
        .select("id, name")
        .eq("instance_id", instanceId!)
        .is("deleted_at", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 overflow-auto">
            <div className="border-b border-border bg-card px-6 py-5 space-y-3">
              <Skeleton className="h-4 w-64" /><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-80" />
            </div>
            <div className="p-6 space-y-4"><Skeleton className="h-10 w-96" /><Skeleton className="h-64 w-full" /></div>
          </main>
        </div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive font-medium">Instance not found</p>
              <Button variant="outline" className="mt-3" onClick={() => navigate("/instances")}>Back to Instances</Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const settings = instance.settings as Record<string, any> | null;
  const isDofe = settings?.type === "dofe" || settings?.is_dofe === true;
  const tasksByStage = new Map<string, typeof stageTasks>();
  stageTasks.forEach((t) => {
    if (!t.stage_template_id) return;
    const list = tasksByStage.get(t.stage_template_id) ?? [];
    list.push(t);
    tasksByStage.set(t.stage_template_id, list);
  });

  const fieldTypeLabel: Record<string, string> = {
    checkbox: "Checkbox",
    text: "Text",
    textarea: "Text Area",
    multiple_choice: "Multiple Choice",
    rating: "Rating",
    number: "Number",
  };

  const tabs = [
    { value: "overview", label: "Overview", icon: Building2 },
    { value: "stages", label: "Stages", icon: ClipboardList },
    { value: "cases", label: "Cases", icon: Briefcase },
    { value: "groups", label: "Groups", icon: FolderTree },
    { value: "tracking", label: "Tracking", icon: Navigation },
    { value: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <div className="bg-card border-b border-border">
            <div className="px-6 py-5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Dashboard</button>
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => navigate("/instances")} className="hover:text-foreground transition-colors">Instances</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">{instance.name}</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {isDofe ? <Award className="w-5 h-5 text-amber-500" /> : <Building2 className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-xl font-semibold text-foreground tracking-tight">{instance.name}</h1>
                      <Badge variant={instance.status === "active" ? "default" : "secondary"} className="capitalize">{instance.status}</Badge>
                      {isDofe && <Badge variant="outline" className="border-amber-500/30 text-amber-600 text-xs">DofE</Badge>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {instance.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{instance.location}</span>}
                      {instance.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(instance.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          {instance.end_date && ` – ${new Date(instance.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => navigate("/instances")}><ArrowLeft className="w-4 h-4" />Back</Button>
                  <Button className="gap-2"><Pencil className="w-4 h-4" />Edit</Button>
                </div>
              </div>
            </div>

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
                      <InfoRow label="Name" value={instance.name} icon={Building2} />
                      <InfoRow label="Location" value={instance.location} icon={MapPin} />
                      <InfoRow label="Status" value={<Badge variant={instance.status === "active" ? "default" : "secondary"} className="capitalize">{instance.status}</Badge>} />
                      <InfoRow label="Description" value={instance.description} />
                    </SectionCard>
                    <SectionCard title="Summary" icon={Users}>
                      <InfoRow label="Supergroups" value={supergroups.length} icon={FolderTree} />
                      <InfoRow label="Subgroups" value={subgroups.length} icon={Users} />
                      <InfoRow label="Stages" value={stages.length} icon={ClipboardList} />
                    </SectionCard>
                  </div>
                </TabsContent>

                {/* Stages */}
                <TabsContent value="stages" className="mt-0">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-muted-foreground">{stages.length} stage{stages.length !== 1 ? "s" : ""} configured</p>
                    <Button size="sm" className="gap-1.5 h-8"><Plus className="w-3.5 h-3.5" />Add Stage</Button>
                  </div>
                  {stages.length === 0 ? (
                    <SectionCard title="Stages" icon={ClipboardList}>
                      <EmptyState icon={ClipboardList} message="No stages configured for this instance. Add a stage to define checkpoints and procedures." />
                    </SectionCard>
                  ) : (
                    <div className="space-y-3">
                      {stages.map((stage, idx) => {
                        const tasks = tasksByStage.get(stage.id) ?? [];
                        return (
                          <div key={stage.id} className="bg-card rounded-lg border border-border overflow-hidden">
                            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
                              <GripVertical className="w-4 h-4 text-muted-foreground/40" />
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {stage.stage_number ?? idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-foreground">{stage.title}</h3>
                                {stage.description && <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</Badge>
                                {stage.requires_previous_stage && <span title="Requires previous stage"><Lock className="w-3.5 h-3.5 text-muted-foreground" /></span>}
                                <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="w-3 h-3" /></Button>
                              </div>
                            </div>
                            {tasks.length > 0 && (
                              <div className="divide-y divide-border">
                                {tasks.map((task) => (
                                  <div key={task.id} className="flex items-center gap-3 px-5 py-2.5 pl-16">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                                    <span className="text-sm text-foreground flex-1">{task.description}</span>
                                    <Badge variant="secondary" className="text-[10px] font-normal">{fieldTypeLabel[task.field_type] ?? task.field_type}</Badge>
                                    {task.required && <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Required</Badge>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Groups */}
                <TabsContent value="groups" className="mt-0">
                  {supergroups.length === 0 ? (
                    <SectionCard title="Groups" icon={FolderTree}>
                      <EmptyState icon={FolderTree} message="No groups configured for this instance." />
                    </SectionCard>
                  ) : (
                    <div className="space-y-4">
                      {supergroups.map((sg) => {
                        const children = subgroups.filter((sub) => sub.parent_supergroup_id === sg.id);
                        return (
                          <SectionCard key={sg.id} title={sg.name} icon={FolderTree}>
                            {children.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No subgroups</p>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {children.map((sub) => (
                                  <div key={sub.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 text-sm">
                                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-foreground">{sub.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </SectionCard>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Cases */}
                <TabsContent value="cases" className="mt-0">
                  <InstanceCasesTab instanceId={instanceId!} />
                </TabsContent>

                {/* Tracking */}
                <TabsContent value="tracking" className="mt-0">
                  <InstanceTrackingTab instanceId={instanceId!} subgroups={subgroups} />
                </TabsContent>

                {/* Settings */}
                <TabsContent value="settings" className="mt-0">
                  <SectionCard title="Instance Settings" icon={Settings}>
                    <pre className="text-xs text-muted-foreground bg-muted/50 rounded-md p-4 overflow-auto max-h-96">
                      {JSON.stringify(settings ?? {}, null, 2)}
                    </pre>
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

export default InstanceDetailPage;
