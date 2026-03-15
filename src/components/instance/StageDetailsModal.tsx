import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, AlertTriangle, Play, Lock, Users } from "lucide-react";
import StageTaskField from "./StageTaskField";
import type { StageTask, GroupStageTaskCompletion } from "@/types/stages";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subgroupId: string;
  stageId: string;
  progressId?: string;
  subgroupName: string;
  stageName: string;
  instanceId: string;
}

const StageDetailsModal = ({ open, onOpenChange, subgroupId, stageId, progressId, subgroupName, stageName, instanceId }: Props) => {
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [incidentFlag, setIncidentFlag] = useState(false);
  const [taskResponses, setTaskResponses] = useState<Record<string, any>>({});
  const [participantStatuses, setParticipantStatuses] = useState<Record<string, boolean>>({});

  // Fetch tasks for this stage
  const { data: tasks = [] } = useQuery({
    queryKey: ["stage-tasks-detail", stageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stage_tasks")
        .select("*")
        .eq("stage_template_id", stageId)
        .order("order_number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch or create progress record
  const { data: progress, refetch: refetchProgress } = useQuery({
    queryKey: ["stage-progress-detail", subgroupId, stageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_stage_progress")
        .select("*, task_completions:group_stage_task_completions(*)")
        .eq("subgroup_id", subgroupId)
        .eq("stage_template_id", stageId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch participants in this subgroup
  const { data: participants = [] } = useQuery({
    queryKey: ["subgroup-participants", subgroupId, instanceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participant_instance_assignments")
        .select("participant_id, participants!inner(id, first_name, surname, rank)")
        .eq("sub_group_id", subgroupId)
        .eq("instance_id", instanceId);
      if (error) throw error;
      return (data ?? []).map((d: any) => d.participants);
    },
  });

  // Fetch participant statuses
  const { data: existingStatuses = [] } = useQuery({
    queryKey: ["participant-statuses", progress?.id],
    enabled: !!progress?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_stage_participant_status")
        .select("*")
        .eq("group_stage_progress_id", progress!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const isCompleted = progress?.status === "completed";
  const isLocked = !progress || progress.status === "locked";

  // Initialize state from progress data
  useEffect(() => {
    if (progress) {
      setNotes(progress.notes ?? "");
      setIncidentFlag(progress.incident_flag ?? false);
      const responses: Record<string, any> = {};
      (progress as any).task_completions?.forEach((tc: GroupStageTaskCompletion) => {
        if (tc.stage_task_id) {
          if (tc.response_value) responses[tc.stage_task_id] = tc.response_value;
          else if (tc.response_data) responses[tc.stage_task_id] = tc.response_data;
          else responses[tc.stage_task_id] = tc.completed;
        }
      });
      setTaskResponses(responses);
    }
  }, [progress]);

  useEffect(() => {
    const map: Record<string, boolean> = {};
    existingStatuses.forEach((s: any) => {
      if (s.participant_id) map[s.participant_id] = s.is_present ?? true;
    });
    // Default all participants to present
    participants.forEach((p: any) => {
      if (!(p.id in map)) map[p.id] = true;
    });
    setParticipantStatuses(map);
  }, [existingStatuses, participants]);

  const startStage = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("group_stage_progress").insert({
        subgroup_id: subgroupId,
        stage_template_id: stageId,
        status: "in_progress",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      refetchProgress();
      qc.invalidateQueries({ queryKey: ["group-stage-progress", instanceId] });
      toast({ title: "Stage started" });
    },
  });

  const saveProgress = useMutation({
    mutationFn: async () => {
      if (!progress) return;
      // Update progress record
      await supabase.from("group_stage_progress").update({
        notes: notes || null,
        incident_flag: incidentFlag,
        updated_at: new Date().toISOString(),
      }).eq("id", progress.id);

      // Upsert task completions
      for (const task of tasks) {
        const val = taskResponses[task.id];
        const isCheckbox = task.field_type === "checkbox";
        const completed = isCheckbox ? !!val : val !== undefined && val !== null && val !== "";
        
        const completionData = {
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          response_value: typeof val === "string" || typeof val === "number" ? String(val) : null,
          response_data: typeof val === "object" && val !== null ? val : null,
        };

        const { data: existing } = await supabase
          .from("group_stage_task_completions")
          .select("id")
          .eq("group_stage_progress_id", progress.id)
          .eq("stage_task_id", task.id)
          .maybeSingle();

        if (existing) {
          await supabase.from("group_stage_task_completions").update(completionData).eq("id", existing.id);
        } else {
          await supabase.from("group_stage_task_completions").insert({
            ...completionData,
            group_stage_progress_id: progress.id,
            stage_task_id: task.id,
          });
        }
      }

      // Upsert participant statuses
      for (const [pid, present] of Object.entries(participantStatuses)) {
        const { data: existing } = await supabase
          .from("group_stage_participant_status")
          .select("id")
          .eq("group_stage_progress_id", progress.id)
          .eq("participant_id", pid)
          .maybeSingle();

        if (existing) {
          await supabase.from("group_stage_participant_status").update({ is_present: present, updated_at: new Date().toISOString() }).eq("id", existing.id);
        } else {
          await supabase.from("group_stage_participant_status").insert({
            group_stage_progress_id: progress.id,
            participant_id: pid,
            is_present: present,
          });
        }
      }
    },
    onSuccess: () => {
      refetchProgress();
      qc.invalidateQueries({ queryKey: ["group-stage-progress", instanceId] });
      toast({ title: "Progress saved" });
    },
  });

  const completeStage = useMutation({
    mutationFn: async () => {
      if (!progress) return;
      await saveProgress.mutateAsync();
      await supabase.from("group_stage_progress").update({
        status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("id", progress.id);
    },
    onSuccess: () => {
      refetchProgress();
      qc.invalidateQueries({ queryKey: ["group-stage-progress", instanceId] });
      toast({ title: "Stage completed" });
      onOpenChange(false);
    },
  });

  const completedCount = useMemo(() => {
    return tasks.filter((t) => {
      const val = taskResponses[t.id];
      if (t.field_type === "checkbox") return !!val;
      return val !== undefined && val !== null && val !== "";
    }).length;
  }, [tasks, taskResponses]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {stageName}
            <Badge variant="secondary" className="text-xs font-normal">{subgroupName}</Badge>
            {isCompleted && <Badge className="bg-emerald-500/10 text-emerald-600 text-xs">Completed</Badge>}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-5 py-2">
            {isLocked && (
              <div className="flex flex-col items-center gap-3 py-6">
                <Lock className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">This stage hasn't been started yet.</p>
                <Button onClick={() => startStage.mutate()} className="gap-1.5">
                  <Play className="w-3.5 h-3.5" />Start Stage
                </Button>
              </div>
            )}

            {!isLocked && (
              <>
                {/* Tasks */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tasks ({completedCount}/{tasks.length})</Label>
                  </div>
                  {tasks.map((task) => (
                    <StageTaskField
                      key={task.id}
                      task={task as any}
                      value={taskResponses[task.id]}
                      onChange={(v) => setTaskResponses((prev) => ({ ...prev, [task.id]: v }))}
                      disabled={isCompleted}
                    />
                  ))}
                </div>

                <Separator />

                {/* Participant Attendance */}
                {participants.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />Attendance ({Object.values(participantStatuses).filter(Boolean).length}/{participants.length})
                    </Label>
                    <div className="space-y-1">
                      {participants.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-2.5 py-1">
                          <Checkbox
                            checked={participantStatuses[p.id] ?? true}
                            onCheckedChange={(c) => setParticipantStatuses((prev) => ({ ...prev, [p.id]: !!c }))}
                            disabled={isCompleted}
                          />
                          <span className="text-sm">{p.first_name} {p.surname}</span>
                          {p.rank && <Badge variant="outline" className="text-[10px]">{p.rank}</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Notes & Incident */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Stage notes…"
                      rows={2}
                      disabled={isCompleted}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-destructive">
                      <AlertTriangle className="w-3.5 h-3.5" />Flag as Incident
                    </Label>
                    <Switch checked={incidentFlag} onCheckedChange={setIncidentFlag} disabled={isCompleted} />
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {!isLocked && !isCompleted && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => saveProgress.mutate()} disabled={saveProgress.isPending}>
              Save Progress
            </Button>
            <Button onClick={() => completeStage.mutate()} disabled={completeStage.isPending} className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />Mark Complete
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StageDetailsModal;
