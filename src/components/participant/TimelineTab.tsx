import type { ParticipantActivityLog } from "@/hooks/useParticipant";
import type { ParticipantAssignment } from "@/hooks/useParticipant";
import { SectionCard, EmptyState } from "./ProfileShared";
import { Badge } from "@/components/ui/badge";
import {
  Clock, Activity, Building2, AlertTriangle, CheckCircle2,
  UserCheck, LogIn, LogOut, FileText, Flag
} from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "activity" | "checkin" | "stage" | "status" | "assignment";
  title: string;
  description?: string | null;
  timestamp: string;
  icon: React.ElementType;
  instanceName?: string;
  severity?: "normal" | "warning" | "incident";
}

function buildTimeline(
  activityLogs: ParticipantActivityLog[],
  assignments: ParticipantAssignment[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Activity logs
  activityLogs.forEach((log) => {
    const assignment = assignments.find((a) => a.instance_id === log.instance_id);
    events.push({
      id: `log-${log.id}`,
      type: "activity",
      title: log.title || log.log_type,
      description: log.notes,
      timestamp: log.time_observed,
      icon: log.flagged_as_incident ? AlertTriangle : Activity,
      instanceName: assignment?.instance_name,
      severity: log.flagged_as_incident ? "incident" : "normal",
    });
  });

  // Assignment events (arrival/departure)
  assignments.forEach((a) => {
    if (a.arrival_date) {
      events.push({
        id: `arrival-${a.id}`,
        type: "assignment",
        title: `Arrived at ${a.instance_name}`,
        timestamp: a.arrival_date,
        icon: LogIn,
        instanceName: a.instance_name,
        severity: "normal",
      });
    }
    if (a.departure_date) {
      events.push({
        id: `departure-${a.id}`,
        type: "assignment",
        title: `Departed from ${a.instance_name}`,
        timestamp: a.departure_date,
        icon: LogOut,
        instanceName: a.instance_name,
        severity: "normal",
      });
    }
  });

  // Sort by timestamp descending
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return events;
}

const severityDot: Record<string, string> = {
  normal: "bg-primary/60",
  warning: "bg-amber-500",
  incident: "bg-destructive",
};

interface TimelineTabProps {
  activityLogs: ParticipantActivityLog[];
  assignments: ParticipantAssignment[];
}

export const TimelineTab = ({ activityLogs, assignments }: TimelineTabProps) => {
  const events = buildTimeline(activityLogs, assignments);

  if (events.length === 0) {
    return (
      <SectionCard title="Participant Timeline" icon={Clock}>
        <EmptyState icon={Clock} message="No timeline events yet. Activity logs, check-ins, stage completions, and status changes will appear here as they are recorded." />
      </SectionCard>
    );
  }

  // Group by date
  const grouped = new Map<string, TimelineEvent[]>();
  events.forEach((e) => {
    const dateKey = new Date(e.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const list = grouped.get(dateKey) ?? [];
    list.push(e);
    grouped.set(dateKey, list);
  });

  return (
    <SectionCard title="Participant Timeline" icon={Clock}>
      <div className="space-y-6">
        {[...grouped.entries()].map(([date, dayEvents]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-2">{date}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-0">
              {dayEvents.map((event) => {
                const EventIcon = event.icon;
                return (
                  <div key={event.id} className="flex items-start gap-3 py-2.5 group">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center pt-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${severityDot[event.severity ?? "normal"]} shrink-0`} />
                      <div className="w-px flex-1 bg-border min-h-[16px] group-last:hidden" />
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1 pb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <EventIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-foreground">{event.title}</span>
                        {event.severity === "incident" && <Badge variant="destructive" className="text-[10px]">Incident</Badge>}
                        {event.instanceName && (
                          <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                            {event.instanceName}
                          </Badge>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                        {new Date(event.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};
