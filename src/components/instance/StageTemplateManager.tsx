import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Pencil, Trash2, GripVertical, Lock, CheckCircle2, Save, FolderOpen,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import TaskConfigurator from "./TaskConfigurator";
import type { StageTemplate, StageTask, StageTaskFieldType, StageTaskFieldConfig } from "@/types/stages";

interface Props {
  instanceId: string;
  tenantId: string;
}

const FIELD_TYPE_LABEL: Record<string, string> = {
  checkbox: "Checkbox", text: "Text", textarea: "Text Area",
  multiple_choice: "Multiple Choice", rating: "Rating", number: "Number",
};

const StageTemplateManager = ({ instanceId, tenantId }: Props) => {
  const qc = useQueryClient();
  const [stageDialog, setStageDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<StageTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [taskDialog, setTaskDialog] = useState<{ stageId: string; task?: StageTask } | null>(null);
  const [saveTemplateDialog, setSaveTemplateDialog] = useState(false);
  const [loadTemplateDialog, setLoadTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiresPrev, setRequiresPrev] = useState(true);

  const { data: stages = [] } = useQuery({
    queryKey: ["stage-templates", instanceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stage_templates")
        .select("*")
        .eq("instance_id", instanceId)
        .is("deleted_at", null)
        .order("order_number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["stage-tasks", instanceId],
    enabled: stages.length > 0,
    queryFn: async () => {
      const ids = stages.map((s) => s.id);
      const { data, error } = await supabase
        .from("stage_tasks")
        .select("*")
        .in("stage_template_id", ids)
        .order("order_number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: globalTemplates = [] } = useQuery({
    queryKey: ["global-stage-templates", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_stage_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const tasksByStage = new Map<string, typeof allTasks>();
  allTasks.forEach((t) => {
    if (!t.stage_template_id) return;
    const list = tasksByStage.get(t.stage_template_id) ?? [];
    list.push(t);
    tasksByStage.set(t.stage_template_id, list);
  });

  const createStage = useMutation({
    mutationFn: async (data: { title: string; description: string; requires_previous_stage: boolean }) => {
      const nextOrder = stages.length;
      const nextNum = stages.length + 1;
      const id = crypto.randomUUID();
      const { error } = await supabase.from("stage_templates").insert({
        id,
        instance_id: instanceId,
        tenant_id: tenantId,
        title: data.title,
        description: data.description || null,
        stage_number: nextNum,
        order_number: nextOrder,
        requires_previous_stage: data.requires_previous_stage,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stage-templates", instanceId] });
      toast({ title: "Stage created" });
      setStageDialog(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStage = useMutation({
    mutationFn: async (data: { id: string; title: string; description: string; requires_previous_stage: boolean }) => {
      const { error } = await supabase.from("stage_templates").update({
        title: data.title,
        description: data.description || null,
        requires_previous_stage: data.requires_previous_stage,
        updated_at: new Date().toISOString(),
      }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stage-templates", instanceId] });
      toast({ title: "Stage updated" });
      setStageDialog(false);
      setEditingStage(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stage_templates").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stage-templates", instanceId] });
      toast({ title: "Stage deleted" });
      setDeleteTarget(null);
    },
  });

  const createTask = useMutation({
    mutationFn: async (data: { stageId: string; description: string; field_type: StageTaskFieldType; field_config: StageTaskFieldConfig; required: boolean; placeholder: string }) => {
      const existing = tasksByStage.get(data.stageId) ?? [];
      const { error } = await supabase.from("stage_tasks").insert({
        stage_template_id: data.stageId,
        description: data.description,
        field_type: data.field_type,
        field_config: data.field_config as any,
        required: data.required,
        placeholder: data.placeholder || null,
        order_number: existing.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stage-tasks", instanceId] });
      toast({ title: "Task added" });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stage_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stage-tasks", instanceId] });
      toast({ title: "Task removed" });
    },
  });

  const saveAsGlobalTemplate = useMutation({
    mutationFn: async () => {
      const templateData = stages.map((s) => ({
        title: s.title,
        description: s.description,
        stage_number: s.stage_number,
        order_number: s.order_number,
        requires_previous_stage: s.requires_previous_stage,
        tasks: (tasksByStage.get(s.id) ?? []).map((t) => ({
          description: t.description,
          field_type: t.field_type,
          field_config: t.field_config,
          required: t.required,
          placeholder: t.placeholder,
          order_number: t.order_number,
        })),
      }));
      const { error } = await supabase.from("global_stage_templates").insert({
        name: templateName,
        description: templateDesc || null,
        tenant_id: tenantId,
        template_data: templateData as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["global-stage-templates"] });
      toast({ title: "Template saved" });
      setSaveTemplateDialog(false);
      setTemplateName("");
      setTemplateDesc("");
    },
  });

  const loadGlobalTemplate = useMutation({
    mutationFn: async (templateData: any[]) => {
      for (const s of templateData) {
        const stageId = crypto.randomUUID();
        const { error: sErr } = await supabase.from("stage_templates").insert({
          id: stageId,
          instance_id: instanceId,
          tenant_id: tenantId,
          title: s.title,
          description: s.description || null,
          stage_number: s.stage_number ?? (stages.length + templateData.indexOf(s) + 1),
          order_number: stages.length + templateData.indexOf(s),
          requires_previous_stage: s.requires_previous_stage ?? true,
        });
        if (sErr) throw sErr;
        if (s.tasks?.length) {
          const tasks = s.tasks.map((t: any) => ({
            stage_template_id: stageId,
            description: t.description,
            field_type: t.field_type ?? "checkbox",
            field_config: t.field_config ?? null,
            required: t.required ?? false,
            placeholder: t.placeholder ?? null,
            order_number: t.order_number ?? 0,
          }));
          const { error: tErr } = await supabase.from("stage_tasks").insert(tasks);
          if (tErr) throw tErr;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stage-templates", instanceId] });
      qc.invalidateQueries({ queryKey: ["stage-tasks", instanceId] });
      toast({ title: "Template loaded" });
      setLoadTemplateDialog(false);
    },
  });

  const openAddStage = () => {
    setEditingStage(null);
    setTitle("");
    setDescription("");
    setRequiresPrev(true);
    setStageDialog(true);
  };

  const openEditStage = (stage: any) => {
    setEditingStage(stage);
    setTitle(stage.title);
    setDescription(stage.description ?? "");
    setRequiresPrev(stage.requires_previous_stage ?? true);
    setStageDialog(true);
  };

  const handleSaveStage = () => {
    if (!title.trim()) return;
    if (editingStage) {
      updateStage.mutate({ id: editingStage.id, title, description, requires_previous_stage: requiresPrev });
    } else {
      createStage.mutate({ title, description, requires_previous_stage: requiresPrev });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{stages.length} stage{stages.length !== 1 ? "s" : ""} configured</p>
        <div className="flex gap-2">
          {globalTemplates.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => setLoadTemplateDialog(true)}>
              <FolderOpen className="w-3.5 h-3.5" />Load Template
            </Button>
          )}
          {stages.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => setSaveTemplateDialog(true)}>
              <Save className="w-3.5 h-3.5" />Save as Template
            </Button>
          )}
          <Button size="sm" className="gap-1.5 h-8" onClick={openAddStage}>
            <Plus className="w-3.5 h-3.5" />Add Stage
          </Button>
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No stages configured. Add a stage or load from a template.</p>
        </div>
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
                  <Badge variant="outline" className="text-[10px]">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</Badge>
                  {stage.requires_previous_stage && <span title="Requires previous stage"><Lock className="w-3.5 h-3.5 text-muted-foreground" /></span>}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTaskDialog({ stageId: stage.id })}>
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditStage(stage)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(stage.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                {tasks.length > 0 && (
                  <div className="divide-y divide-border">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 px-5 py-2.5 pl-16">
                        <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        <span className="text-sm text-foreground flex-1">{task.description}</span>
                        <Badge variant="secondary" className="text-[10px] font-normal">{FIELD_TYPE_LABEL[task.field_type] ?? task.field_type}</Badge>
                        {task.required && <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Required</Badge>}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteTask.mutate(task.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stage Dialog */}
      <Dialog open={stageDialog} onOpenChange={setStageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingStage ? "Edit Stage" : "Add Stage"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Stage title…" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description…" rows={2} /></div>
            <div className="flex items-center justify-between"><Label>Requires previous stage</Label><Switch checked={requiresPrev} onCheckedChange={setRequiresPrev} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveStage} disabled={!title.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stage</AlertDialogTitle>
            <AlertDialogDescription>This will soft-delete the stage and all associated progress data will be orphaned. Continue?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteStage.mutate(deleteTarget)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Task Configurator */}
      {taskDialog && (
        <TaskConfigurator
          open
          onOpenChange={() => setTaskDialog(null)}
          initial={taskDialog.task ? {
            description: taskDialog.task.description,
            field_type: taskDialog.task.field_type as StageTaskFieldType,
            field_config: (taskDialog.task.field_config as any) ?? {},
            required: taskDialog.task.required ?? false,
            placeholder: taskDialog.task.placeholder ?? "",
          } : undefined}
          onSave={(t) => createTask.mutate({ stageId: taskDialog.stageId, ...t })}
        />
      )}

      {/* Save as Template */}
      <Dialog open={saveTemplateDialog} onOpenChange={setSaveTemplateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Save as Global Template</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Template Name</Label><Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={templateDesc} onChange={(e) => setTemplateDesc(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveTemplateDialog(false)}>Cancel</Button>
            <Button onClick={() => saveAsGlobalTemplate.mutate()} disabled={!templateName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template */}
      <Dialog open={loadTemplateDialog} onOpenChange={setLoadTemplateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Load Global Template</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-64 overflow-auto">
            {globalTemplates.map((gt) => (
              <button
                key={gt.id}
                className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                onClick={() => loadGlobalTemplate.mutate(gt.template_data as any[])}
              >
                <p className="text-sm font-medium">{gt.name}</p>
                {gt.description && <p className="text-xs text-muted-foreground mt-0.5">{gt.description}</p>}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StageTemplateManager;
