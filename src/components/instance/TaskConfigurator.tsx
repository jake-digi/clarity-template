import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import type { StageTaskFieldType, StageTaskFieldConfig } from "@/types/stages";

interface TaskDraft {
  description: string;
  field_type: StageTaskFieldType;
  field_config: StageTaskFieldConfig;
  required: boolean;
  placeholder: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<TaskDraft>;
  onSave: (task: TaskDraft) => void;
}

const FIELD_TYPES: { value: StageTaskFieldType; label: string }[] = [
  { value: "checkbox", label: "Checkbox" },
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "rating", label: "Rating" },
  { value: "number", label: "Number" },
];

const TaskConfigurator = ({ open, onOpenChange, initial, onSave }: Props) => {
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [fieldType, setFieldType] = useState<StageTaskFieldType>(initial?.field_type ?? "checkbox");
  const [required, setRequired] = useState(initial?.required ?? false);
  const [placeholder, setPlaceholder] = useState(initial?.placeholder ?? "");
  const [config, setConfig] = useState<StageTaskFieldConfig>(initial?.field_config ?? {});
  const [newOption, setNewOption] = useState("");

  const addOption = () => {
    if (!newOption.trim()) return;
    setConfig((c) => ({ ...c, options: [...(c.options ?? []), newOption.trim()] }));
    setNewOption("");
  };

  const removeOption = (idx: number) => {
    setConfig((c) => ({ ...c, options: (c.options ?? []).filter((_, i) => i !== idx) }));
  };

  const handleSave = () => {
    if (!desc.trim()) return;
    onSave({ description: desc.trim(), field_type: fieldType, field_config: config, required, placeholder });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Task" : "Add Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Task description…" />
          </div>
          <div className="space-y-1.5">
            <Label>Field Type</Label>
            <Select value={fieldType} onValueChange={(v) => { setFieldType(v as StageTaskFieldType); setConfig({}); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>Required</Label>
            <Switch checked={required} onCheckedChange={setRequired} />
          </div>
          {(fieldType === "text" || fieldType === "textarea" || fieldType === "number") && (
            <div className="space-y-1.5">
              <Label>Placeholder</Label>
              <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} />
            </div>
          )}
          {fieldType === "multiple_choice" && (
            <div className="space-y-2">
              <Label>Options</Label>
              {(config.options ?? []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm flex-1 bg-muted px-2.5 py-1.5 rounded">{opt}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeOption(i)}><X className="w-3 h-3" /></Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={newOption} onChange={(e) => setNewOption(e.target.value)} placeholder="New option…" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())} />
                <Button variant="outline" size="sm" onClick={addOption}><Plus className="w-3.5 h-3.5" /></Button>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Allow multiple selections</Label>
                <Switch checked={config.allowMultiple ?? false} onCheckedChange={(c) => setConfig((v) => ({ ...v, allowMultiple: c }))} />
              </div>
            </div>
          )}
          {fieldType === "rating" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Min</Label><Input type="number" value={config.min ?? 1} onChange={(e) => setConfig((v) => ({ ...v, min: Number(e.target.value) }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Max</Label><Input type="number" value={config.max ?? 5} onChange={(e) => setConfig((v) => ({ ...v, max: Number(e.target.value) }))} /></div>
            </div>
          )}
          {fieldType === "number" && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label className="text-xs">Min</Label><Input type="number" value={config.minValue ?? ""} onChange={(e) => setConfig((v) => ({ ...v, minValue: e.target.value === "" ? undefined : Number(e.target.value) }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Max</Label><Input type="number" value={config.maxValue ?? ""} onChange={(e) => setConfig((v) => ({ ...v, maxValue: e.target.value === "" ? undefined : Number(e.target.value) }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Step</Label><Input type="number" value={config.step ?? ""} onChange={(e) => setConfig((v) => ({ ...v, step: e.target.value === "" ? undefined : Number(e.target.value) }))} /></div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!desc.trim()}>Save Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskConfigurator;
