import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Lock, Play, Clock } from "lucide-react";

interface Props {
  instanceId: string;
  stages: any[];
  subgroups: { id: string; name: string; parent_supergroup_id: string }[];
  onCellClick: (subgroupId: string, stageId: string, progressId?: string) => void;
}

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  locked: { icon: Lock, color: "text-muted-foreground/50", label: "Locked" },
  unlocked: { icon: Play, color: "text-blue-500", label: "Ready" },
  in_progress: { icon: Clock, color: "text-amber-500", label: "In Progress" },
  completed: { icon: CheckCircle2, color: "text-emerald-500", label: "Complete" },
};

const StagesProgressMatrix = ({ instanceId, stages, subgroups, onCellClick }: Props) => {
  const stageIds = useMemo(() => stages.map((s) => s.id), [stages]);

  const { data: progress = [], isLoading } = useQuery({
    queryKey: ["group-stage-progress", instanceId],
    enabled: stageIds.length > 0 && subgroups.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_stage_progress")
        .select("*, task_completions:group_stage_task_completions(*)")
        .in("stage_template_id", stageIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: taskCounts = new Map<string, number>() } = useQuery({
    queryKey: ["stage-task-counts", instanceId],
    enabled: stageIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stage_tasks")
        .select("stage_template_id")
        .in("stage_template_id", stageIds);
      if (error) throw error;
      const map = new Map<string, number>();
      (data ?? []).forEach((t) => {
        if (t.stage_template_id) map.set(t.stage_template_id, (map.get(t.stage_template_id) ?? 0) + 1);
      });
      return map;
    },
  });

  // Build lookup: subgroupId-stageId -> progress record
  const progressMap = useMemo(() => {
    const map = new Map<string, any>();
    progress.forEach((p: any) => {
      if (p.subgroup_id && p.stage_template_id) {
        map.set(`${p.subgroup_id}-${p.stage_template_id}`, p);
      }
    });
    return map;
  }, [progress]);

  if (stages.length === 0 || subgroups.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {stages.length === 0 ? "No stages configured." : "No groups configured."} Set up both to see the progress matrix.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div className="rounded-lg border border-border overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground sticky left-0 bg-muted/50 z-10 min-w-[140px]">Group</th>
            {stages.map((s) => (
              <th key={s.id} className="text-center px-3 py-2.5 font-medium text-muted-foreground min-w-[120px]">
                <div className="text-xs">{s.title}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subgroups.map((sg) => (
            <tr key={sg.id} className="border-b border-border last:border-0 hover:bg-muted/30">
              <td className="px-4 py-2.5 font-medium text-foreground sticky left-0 bg-card z-10">{sg.name}</td>
              {stages.map((stage) => {
                const key = `${sg.id}-${stage.id}`;
                const p = progressMap.get(key);
                const status = p?.status ?? "locked";
                const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.locked;
                const Icon = cfg.icon;
                const totalTasks = taskCounts.get(stage.id) ?? 0;
                const completedTasks = p?.task_completions?.filter((tc: any) => tc.completed)?.length ?? 0;
                const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                return (
                  <td key={stage.id} className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => onCellClick(sg.id, stage.id, p?.id)}
                      className="w-full flex flex-col items-center gap-1 p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                      <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
                      {status === "in_progress" && totalTasks > 0 && (
                        <Progress value={pct} className="h-1 w-16" />
                      )}
                      {status === "completed" && p?.incident_flag && (
                        <Badge variant="destructive" className="text-[9px] px-1 py-0">Incident</Badge>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StagesProgressMatrix;
