import { useNavigate } from "react-router-dom";
import type { ParticipantAssignment } from "@/hooks/useParticipant";
import { EmptyState } from "./ProfileShared";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Users, ChevronRight } from "lucide-react";

interface InstancesTabProps {
  participantId: string;
  assignments: ParticipantAssignment[];
}

export const InstancesTab = ({ participantId, assignments }: InstancesTabProps) => {
  const navigate = useNavigate();

  if (assignments.length === 0) {
    return <EmptyState icon={Building2} message="No instance assignments found." />;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-1">
        {assignments.length} instance{assignments.length !== 1 ? "s" : ""} assigned — click to view details
      </p>
      {assignments.map((a) => (
        <button
          key={a.id}
          onClick={() => navigate(`/participants/${participantId}/instances/${a.id}`)}
          className="w-full flex items-center justify-between px-5 py-4 bg-card rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all text-left group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">{a.instance_name}</span>
                {a.instance_status && (
                  <Badge variant={a.instance_status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">
                    {a.instance_status}
                  </Badge>
                )}
                {a.is_off_site && <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">Off-site</Badge>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                {a.instance_location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.instance_location}</span>}
                {a.subgroup_name && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{a.subgroup_name}</span>}
                {a.supergroup_name && <span className="text-muted-foreground/60">({a.supergroup_name})</span>}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        </button>
      ))}
    </div>
  );
};
