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
  Navigation, Briefcase, UserCheck, Building, Bus, Package,
  CalendarDays, Heart,
} from "lucide-react";
import InstanceTrackingTab from "@/components/instance/InstanceTrackingTab";
import InstanceCasesTab from "@/components/instance/InstanceCasesTab";
import InstanceParticipantsTab from "@/components/instance/InstanceParticipantsTab";
import InstanceStaffTab from "@/components/instance/InstanceStaffTab";
import InstanceAccommodationTab from "@/components/instance/InstanceAccommodationTab";
import InstanceGroupsTab from "@/components/instance/InstanceGroupsTab";
import InstanceTransportTab from "@/components/instance/InstanceTransportTab";
import InstanceEquipmentTab from "@/components/instance/InstanceEquipmentTab";
import StageTemplateManager from "@/components/instance/StageTemplateManager";
import StagesProgressMatrix from "@/components/instance/StagesProgressMatrix";
import StageDetailsModal from "@/components/instance/StageDetailsModal";

const InstanceDetailPage = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stageModal, setStageModal] = useState<{ subgroupId: string; stageId: string; progressId?: string } | null>(null);
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

  const tabs = [
    { value: "overview", label: "Overview", icon: Building2 },
    { value: "participants", label: "Participants", icon: Users },
    { value: "staff", label: "Staff", icon: UserCheck },
    { value: "groups", label: "Groups", icon: FolderTree },
    { value: "accommodation", label: "Accommodation", icon: Building },
    { value: "stages", label: "Stages", icon: ClipboardList },
    { value: "cases", label: "Cases", icon: Briefcase },
    { value: "transport", label: "Transport", icon: Bus },
    { value: "equipment", label: "Equipment", icon: Package },
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

                {/* Participants */}
                <TabsContent value="participants" className="mt-0">
                  <InstanceParticipantsTab instanceId={instanceId!} />
                </TabsContent>

                {/* Staff */}
                <TabsContent value="staff" className="mt-0">
                  <InstanceStaffTab instanceId={instanceId!} />
                </TabsContent>

                {/* Stages */}
                <TabsContent value="stages" className="mt-0 space-y-6">
                  <Tabs defaultValue="manage">
                    <TabsList className="h-8">
                      <TabsTrigger value="manage" className="text-xs h-7">Manage Stages</TabsTrigger>
                      <TabsTrigger value="progress" className="text-xs h-7">Progress Matrix</TabsTrigger>
                    </TabsList>
                    <TabsContent value="manage" className="mt-4">
                      <StageTemplateManager instanceId={instanceId!} tenantId={instance.tenant_id} />
                    </TabsContent>
                    <TabsContent value="progress" className="mt-4">
                      <StagesProgressMatrix
                        instanceId={instanceId!}
                        stages={stages}
                        subgroups={subgroups}
                        onCellClick={(subgroupId, stageId, progressId) =>
                          setStageModal({ subgroupId, stageId, progressId })
                        }
                      />
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                {/* Groups */}
                <TabsContent value="groups" className="mt-0">
                  <InstanceGroupsTab instanceId={instanceId!} />
                </TabsContent>

                {/* Accommodation */}
                <TabsContent value="accommodation" className="mt-0">
                  <InstanceAccommodationTab instanceId={instanceId!} />
                </TabsContent>

                {/* Cases */}
                <TabsContent value="cases" className="mt-0">
                  <InstanceCasesTab instanceId={instanceId!} />
                </TabsContent>

                {/* Transport */}
                <TabsContent value="transport" className="mt-0">
                  <InstanceTransportTab instanceId={instanceId!} />
                </TabsContent>

                {/* Equipment */}
                <TabsContent value="equipment" className="mt-0">
                  <InstanceEquipmentTab instanceId={instanceId!} />
                </TabsContent>

                {/* Tracking */}
                <TabsContent value="tracking" className="mt-0">
                  <InstanceTrackingTab instanceId={instanceId!} subgroups={subgroups} settings={settings} />
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

      {/* Stage Details Modal */}
      {stageModal && (
        <StageDetailsModal
          open
          onOpenChange={() => setStageModal(null)}
          subgroupId={stageModal.subgroupId}
          stageId={stageModal.stageId}
          progressId={stageModal.progressId}
          subgroupName={subgroups.find((s) => s.id === stageModal.subgroupId)?.name ?? ""}
          stageName={stages.find((s: any) => s.id === stageModal.stageId)?.title ?? ""}
          instanceId={instanceId!}
        />
      )}
    </div>
  );
};

export default InstanceDetailPage;
