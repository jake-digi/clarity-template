import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import type { StageTask } from "@/types/stages";

interface Props {
  task: StageTask;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

const StageTaskField = ({ task, value, onChange, disabled }: Props) => {
  const config = task.field_config ?? {};

  switch (task.field_type) {
    case "checkbox":
      return (
        <div className="flex items-center gap-2.5">
          <Checkbox
            checked={!!value}
            onCheckedChange={(c) => onChange(!!c)}
            disabled={disabled}
          />
          <span className="text-sm text-foreground">{task.description}</span>
          {task.required && <span className="text-destructive text-xs">*</span>}
        </div>
      );

    case "text":
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">{task.description}{task.required && <span className="text-destructive ml-0.5">*</span>}</Label>
          <Input
            placeholder={task.placeholder ?? ""}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      );

    case "textarea":
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">{task.description}{task.required && <span className="text-destructive ml-0.5">*</span>}</Label>
          <Textarea
            placeholder={task.placeholder ?? ""}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={3}
          />
        </div>
      );

    case "multiple_choice": {
      const options = config.options ?? [];
      if (config.allowMultiple) {
        const selected: string[] = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-1.5">
            <Label className="text-sm">{task.description}{task.required && <span className="text-destructive ml-0.5">*</span>}</Label>
            <div className="space-y-1.5">
              {options.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox
                    checked={selected.includes(opt)}
                    onCheckedChange={(c) => {
                      onChange(c ? [...selected, opt] : selected.filter((s) => s !== opt));
                    }}
                    disabled={disabled}
                  />
                  <span className="text-sm">{opt}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">{task.description}{task.required && <span className="text-destructive ml-0.5">*</span>}</Label>
          <RadioGroup value={value ?? ""} onValueChange={onChange} disabled={disabled}>
            {options.map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} />
                <Label className="text-sm font-normal">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );
    }

    case "rating": {
      const min = config.min ?? 1;
      const max = config.max ?? 5;
      const labels = config.labels ?? [];
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">{task.description}{task.required && <span className="text-destructive ml-0.5">*</span>}</Label>
          <div className="flex items-center gap-3">
            {labels[0] && <span className="text-xs text-muted-foreground">{labels[0]}</span>}
            <Slider
              min={min}
              max={max}
              step={1}
              value={[value ?? min]}
              onValueChange={([v]) => onChange(v)}
              disabled={disabled}
              className="flex-1"
            />
            {labels[1] && <span className="text-xs text-muted-foreground">{labels[1]}</span>}
            <span className="text-sm font-medium w-6 text-center">{value ?? min}</span>
          </div>
        </div>
      );
    }

    case "number":
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">{task.description}{task.required && <span className="text-destructive ml-0.5">*</span>}</Label>
          <Input
            type="number"
            placeholder={task.placeholder ?? ""}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            min={config.minValue}
            max={config.maxValue}
            step={config.step}
            disabled={disabled}
          />
        </div>
      );

    default:
      return <p className="text-sm text-muted-foreground">Unsupported field type: {task.field_type}</p>;
  }
};

export default StageTaskField;
