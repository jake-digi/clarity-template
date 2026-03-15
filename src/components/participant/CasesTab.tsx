import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./ProfileShared";
import { AlertTriangle, Clock, MapPin } from "lucide-react";

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  open: "default",
  "in-progress": "secondary",
  closed: "secondary",
  resolved: "default",
};

interface CasesTabProps {
  participantId: string;
}

export const CasesTab = ({ participantId }: CasesTabProps) => {
  const navigate = useNavigate();

  const { data: cases, isLoading } = useQuery({
    queryKey: ["participant-cases", participantId],
    enabled: !!participantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("behavior_cases")
        .select("*")
        .eq("participant_id", participantId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      if (!data?.length) return [];

      const instanceIds = [...new Set(data.map((c) => c.instance_id))];
      const { data: instances } = await supabase
        .from("instances")
        .select("id, name")
        .in("id", instanceIds);

      const iMap = Object.fromEntries((instances ?? []).map((i) => [i.id, i.name]));

      return data.map((c) => ({
        ...c,
        instance_name: iMap[c.instance_id] ?? c.instance_id,
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!cases?.length) {
    return <EmptyState icon={AlertTriangle} message="No cases have been raised for this participant." />;
  }

  const openCount = cases.filter((c) => ["pending", "open", "in-progress"].includes(c.status)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{cases.length} case{cases.length !== 1 ? "s" : ""} total</span>
        {openCount > 0 && (
          <Badge variant="destructive" className="text-[10px]">{openCount} open</Badge>
        )}
      </div>

      <div className="space-y-2">
        {cases.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/cases/${c.id}`)}
            className="w-full flex items-start gap-4 px-5 py-4 bg-card rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all text-left group"
          >
            <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              c.severity_level === "critical" || c.severity_level === "high"
                ? "bg-destructive/10"
                : "bg-muted"
            }`}>
              <AlertTriangle className={`w-4 h-4 ${
                c.severity_level === "critical" || c.severity_level === "high"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-foreground">{c.category}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${severityColors[c.severity_level] ?? ""}`}>
                  {c.severity_level}
                </span>
                <Badge variant={statusVariant[c.status] ?? "outline"} className="capitalize text-[10px]">
                  {c.status}
                </Badge>
              </div>

              {c.overview && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.overview}</p>
              )}

              <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {c.instance_name}
                </span>
                {c.assigned_to_name && (
                  <span>→ {c.assigned_to_name}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
