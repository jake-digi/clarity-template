import { useState } from "react";
import type { ParticipantAssignment, ParticipantActivityLog } from "@/hooks/useParticipant";
import { SectionCard, InfoRow, EmptyState } from "./ProfileShared";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2, MapPin, Calendar, Users, Bed, Heart,
  AlertTriangle, ShieldAlert, Clock, FileText, UserCheck, Activity
} from "lucide-react";

interface InstancesTabProps {
  assignments: ParticipantAssignment[];
  activityLogs: ParticipantActivityLog[];
}

export const InstancesTab = ({ assignments, activityLogs }: InstancesTabProps) => {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>(
    assignments[0]?.id ?? ""
  );
  const [subTab, setSubTab] = useState("overview");

  const selected = assignments.find((a) => a.id === selectedInstanceId) ?? assignments[0];
  if (!selected) {
    return <EmptyState icon={Building2} message="No instance assignments found." />;
  }

  const instanceLogs = activityLogs.filter((l) => l.instance_id === selected.instance_id);

  return (
    <div className="space-y-0">
      {/* Instance selector — pill bar */}
      {assignments.length > 1 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground mr-1">Instance:</span>
          {assignments.map((a) => (
            <button
              key={a.id}
              onClick={() => { setSelectedInstanceId(a.id); setSubTab("overview"); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                selectedInstanceId === a.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              <Building2 className="w-3 h-3" />
              {a.instance_name}
              {a.instance_status && (
                <span className={`w-1.5 h-1.5 rounded-full ${a.instance_status === "active" ? "bg-emerald-400" : "bg-muted-foreground/40"}`} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Sub-tabs for the selected instance */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-muted/50 h-9 p-0.5 rounded-lg w-auto">
          {[
            { value: "overview", label: "Overview", icon: Building2 },
            { value: "accommodation", label: "Accommodation", icon: Bed },
            { value: "activity", label: "Activity", icon: Activity },
            { value: "welfare", label: "Welfare", icon: Heart },
            { value: "behaviour", label: "Behaviour", icon: ShieldAlert },
            { value: "notes", label: "Notes", icon: FileText },
            { value: "timetable", label: "Timetable", icon: Clock },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="text-xs gap-1 px-3 h-8 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <t.icon className="w-3 h-3" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-5">
          {/* Overview */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SectionCard title="Instance Details" icon={Building2}>
                <InfoRow label="Instance" value={selected.instance_name} icon={Building2} />
                <InfoRow label="Location" value={selected.instance_location} icon={MapPin} />
                <InfoRow label="Dates" value={
                  selected.instance_start_date && selected.instance_end_date
                    ? `${new Date(selected.instance_start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(selected.instance_end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                    : null
                } icon={Calendar} />
                <InfoRow label="Status" value={
                  selected.instance_status
                    ? <Badge variant={selected.instance_status === "active" ? "default" : "secondary"} className="capitalize text-xs">{selected.instance_status}</Badge>
                    : null
                } />
              </SectionCard>

              <SectionCard title="Groups" icon={Users}>
                <InfoRow label="Supergroup" value={selected.supergroup_name} icon={Users} />
                <InfoRow label="Subgroup" value={selected.subgroup_name} icon={Users} />
              </SectionCard>
            </div>
          </TabsContent>

          {/* Accommodation */}
          <TabsContent value="accommodation" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SectionCard title="Room & Stay" icon={Bed}>
                <InfoRow label="Room" value={selected.room_number} icon={Bed} />
                <InfoRow label="Arrival" value={selected.arrival_date ? new Date(selected.arrival_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null} icon={Calendar} />
                <InfoRow label="Departure" value={selected.departure_date ? new Date(selected.departure_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null} icon={Calendar} />
                {selected.is_off_site && (
                  <InfoRow label="Off-site reason" value={selected.off_site_comment} icon={AlertTriangle} />
                )}
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
                  {instanceLogs.slice(0, 20).map((log) => (
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
              <EmptyState icon={Heart} message="Instance-specific medical and welfare cases will appear here." />
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
              <EmptyState icon={FileText} message="Notes and observations for this participant within this instance will appear here." />
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
  );
};
