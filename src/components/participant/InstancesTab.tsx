import { useState } from "react";
import type { ParticipantAssignment, ParticipantActivityLog } from "@/hooks/useParticipant";
import { SectionCard, InfoRow, EmptyState } from "./ProfileShared";
import { Badge } from "@/components/ui/badge";
import {
  Building2, MapPin, Calendar, Users, Bed, ChevronDown, ChevronUp,
  Heart, AlertTriangle, ShieldAlert, Clock, FileText, UserCheck, Activity
} from "lucide-react";

interface InstanceDrillDownProps {
  assignment: ParticipantAssignment;
  activityLogs: ParticipantActivityLog[];
  isExpanded: boolean;
  onToggle: () => void;
}

const InstanceDrillDown = ({ assignment: a, activityLogs, isExpanded, onToggle }: InstanceDrillDownProps) => {
  const instanceLogs = activityLogs.filter((l) => l.instance_id === a.instance_id);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Instance header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">{a.instance_name}</span>
              {a.instance_status && (
                <Badge variant={a.instance_status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">
                  {a.instance_status}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              {a.instance_location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.instance_location}</span>}
              {a.subgroup_name && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{a.subgroup_name}</span>}
              {a.supergroup_name && <span className="text-muted-foreground/60">({a.supergroup_name})</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {a.is_off_site && <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">Off-site</Badge>}
          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded instance details */}
      {isExpanded && (
        <div className="border-t border-border">
          <div className="p-5 space-y-6">
            {/* Overview row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Groups */}
              <SectionCard title="Groups" icon={Users}>
                <InfoRow label="Supergroup" value={a.supergroup_name} icon={Users} />
                <InfoRow label="Subgroup" value={a.subgroup_name} icon={Users} />
              </SectionCard>

              {/* Accommodation */}
              <SectionCard title="Accommodation" icon={Bed}>
                <InfoRow label="Room" value={a.room_number} icon={Bed} />
                <InfoRow label="Arrival" value={a.arrival_date ? new Date(a.arrival_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null} icon={Calendar} />
                <InfoRow label="Departure" value={a.departure_date ? new Date(a.departure_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null} icon={Calendar} />
                {a.is_off_site && (
                  <InfoRow label="Off-site reason" value={a.off_site_comment} icon={AlertTriangle} />
                )}
              </SectionCard>

              {/* Instance Info */}
              <SectionCard title="Instance Details" icon={Building2}>
                <InfoRow label="Location" value={a.instance_location} icon={MapPin} />
                <InfoRow label="Dates" value={
                  a.instance_start_date && a.instance_end_date
                    ? `${new Date(a.instance_start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(a.instance_end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                    : null
                } icon={Calendar} />
              </SectionCard>
            </div>

            {/* Second row — scaffolded sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SectionCard title="Roommates" icon={UserCheck}>
                <EmptyState icon={UserCheck} message="Roommate information will appear here once accommodation is configured." />
              </SectionCard>

              <SectionCard title="Timetable" icon={Clock}>
                <EmptyState icon={Clock} message="Stage schedule and timetable for this instance will appear here." />
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SectionCard title="Medical & Welfare" icon={Heart}>
                <EmptyState icon={Heart} message="Instance-specific medical and welfare cases will appear here." />
              </SectionCard>

              <SectionCard title="Behaviour & Incidents" icon={ShieldAlert}>
                <EmptyState icon={ShieldAlert} message="Behaviour records and incident reports for this instance will appear here." />
              </SectionCard>
            </div>

            {/* Instance Activity */}
            <SectionCard title="Recent Activity" icon={Activity}>
              {instanceLogs.length > 0 ? (
                <div className="space-y-0 divide-y divide-border">
                  {instanceLogs.slice(0, 10).map((log) => (
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

            {/* Notes */}
            <SectionCard title="Notes" icon={FileText}>
              <EmptyState icon={FileText} message="Notes and observations for this participant within this instance will appear here." />
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
};

interface InstancesTabProps {
  assignments: ParticipantAssignment[];
  activityLogs: ParticipantActivityLog[];
}

export const InstancesTab = ({ assignments, activityLogs }: InstancesTabProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    assignments.length === 1 ? assignments[0].id : null
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">
          {assignments.length} instance{assignments.length !== 1 ? "s" : ""} assigned
        </p>
      </div>
      {assignments.map((a) => (
        <InstanceDrillDown
          key={a.id}
          assignment={a}
          activityLogs={activityLogs}
          isExpanded={expandedId === a.id}
          onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
        />
      ))}
    </div>
  );
};
