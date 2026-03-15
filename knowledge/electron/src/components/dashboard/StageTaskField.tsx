import { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Star } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { StageTask, StageTaskResponse } from '@/types/stages';

interface StageTaskFieldProps {
    task: StageTask;
    value?: StageTaskResponse;
    onChange: (value: Partial<StageTaskResponse>) => void;
    disabled?: boolean;
}

export const StageTaskField = ({ task, value, onChange, disabled = false }: StageTaskFieldProps) => {
    const [localValue, setLocalValue] = useState<string>('');
    const [selectedOptions, setSelectedOptions] = useState<string[]>(value?.response_data?.selected || []);
    const [rating, setRating] = useState<number>(value?.response_data?.score || 0);

    const handleCheckboxChange = (checked: boolean) => {
        onChange({
            completed: checked,
            completed_at: checked ? new Date().toISOString() : undefined,
        });
    };

    const handleTextChange = (text: string) => {
        setLocalValue(text);
        onChange({
            completed: !!text.trim(),
            response_value: text,
            completed_at: text.trim() ? new Date().toISOString() : undefined,
        });
    };

    const handleMultipleChoiceChange = (option: string, isMultiple: boolean) => {
        let newSelected: string[];

        if (isMultiple) {
            // Toggle selection
            newSelected = selectedOptions.includes(option)
                ? selectedOptions.filter(o => o !== option)
                : [...selectedOptions, option];
        } else {
            // Single selection
            newSelected = [option];
        }

        setSelectedOptions(newSelected);
        onChange({
            completed: newSelected.length > 0,
            response_data: { selected: newSelected },
            completed_at: newSelected.length > 0 ? new Date().toISOString() : undefined,
        });
    };

    const handleRatingChange = (score: number) => {
        setRating(score);
        onChange({
            completed: score > 0,
            response_data: { score },
            completed_at: score > 0 ? new Date().toISOString() : undefined,
        });
    };

    const handleNumberChange = (num: string) => {
        onChange({
            completed: !!num,
            response_value: num,
            completed_at: num ? new Date().toISOString() : undefined,
        });
    };

    // Render based on field type
    switch (task.field_type) {
        case 'checkbox':
            return (
                <div className="flex items-center gap-2">
                    <Checkbox
                        id={task.id}
                        checked={value?.completed || false}
                        onCheckedChange={handleCheckboxChange}
                        disabled={disabled}
                    />
                    <Label htmlFor={task.id} className="text-sm font-normal cursor-pointer">
                        {task.description}
                    </Label>
                </div>
            );

        case 'text':
            return (
                <div className="space-y-2">
                    <Label htmlFor={task.id} className="text-sm font-medium">
                        {task.description}
                        {task.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                        id={task.id}
                        value={value?.response_value || localValue}
                        onChange={(e) => handleTextChange(e.target.value)}
                        placeholder={task.placeholder || 'Enter your response...'}
                        disabled={disabled}
                        required={task.required}
                    />
                </div>
            );

        case 'textarea':
            return (
                <div className="space-y-2">
                    <Label htmlFor={task.id} className="text-sm font-medium">
                        {task.description}
                        {task.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Textarea
                        id={task.id}
                        value={value?.response_value || localValue}
                        onChange={(e) => handleTextChange(e.target.value)}
                        placeholder={task.placeholder || 'Enter your comments...'}
                        disabled={disabled}
                        required={task.required}
                        rows={4}
                    />
                </div>
            );

        case 'multiple_choice':
            const options = task.field_config?.options || [];
            const allowMultiple = task.field_config?.allowMultiple || false;

            if (allowMultiple) {
                return (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            {task.description}
                            {task.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <div className="space-y-2">
                            {options.map((option) => (
                                <div key={option} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`${task.id}-${option}`}
                                        checked={selectedOptions.includes(option)}
                                        onCheckedChange={() => handleMultipleChoiceChange(option, true)}
                                        disabled={disabled}
                                    />
                                    <Label htmlFor={`${task.id}-${option}`} className="text-sm font-normal cursor-pointer">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            } else {
                return (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            {task.description}
                            {task.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <RadioGroup
                            value={selectedOptions[0] || ''}
                            onValueChange={(option) => handleMultipleChoiceChange(option, false)}
                            disabled={disabled}
                        >
                            {options.map((option) => (
                                <div key={option} className="flex items-center gap-2">
                                    <RadioGroupItem value={option} id={`${task.id}-${option}`} />
                                    <Label htmlFor={`${task.id}-${option}`} className="text-sm font-normal cursor-pointer">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                );
            }

        case 'rating':
            const max = task.field_config?.max || 5;
            const labels = task.field_config?.labels || [];

            return (
                <div className="space-y-2">
                    <Label className="text-sm font-medium">
                        {task.description}
                        {task.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: max }, (_, i) => i + 1).map((score) => (
                            <button
                                key={score}
                                type="button"
                                onClick={() => handleRatingChange(score)}
                                disabled={disabled}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star
                                    className={cn(
                                        "w-6 h-6 transition-colors",
                                        score <= rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-transparent text-muted-foreground"
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                    {labels.length >= 2 && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{labels[0]}</span>
                            <span>{labels[1]}</span>
                        </div>
                    )}
                </div>
            );

        case 'number':
            const minValue = task.field_config?.minValue;
            const maxValue = task.field_config?.maxValue;
            const step = task.field_config?.step || 1;

            return (
                <div className="space-y-2">
                    <Label htmlFor={task.id} className="text-sm font-medium">
                        {task.description}
                        {task.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                        id={task.id}
                        type="number"
                        value={value?.response_value || ''}
                        onChange={(e) => handleNumberChange(e.target.value)}
                        placeholder={task.placeholder}
                        disabled={disabled}
                        required={task.required}
                        min={minValue}
                        max={maxValue}
                        step={step}
                    />
                </div>
            );

        default:
            return null;
    }
};
