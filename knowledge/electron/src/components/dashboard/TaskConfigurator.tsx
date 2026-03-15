import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { StageTask, StageTaskFieldType } from '@/types/stages';

interface TaskConfiguratorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Partial<StageTask>) => void;
    existingTask?: StageTask;
}

export const TaskConfigurator = ({ isOpen, onClose, onSave, existingTask }: TaskConfiguratorProps) => {
    const [description, setDescription] = useState(existingTask?.description || '');
    const [fieldType, setFieldType] = useState<StageTaskFieldType>(existingTask?.field_type || 'checkbox');
    const [required, setRequired] = useState(existingTask?.required || false);
    const [placeholder, setPlaceholder] = useState(existingTask?.placeholder || '');

    // Multiple choice specific
    const [options, setOptions] = useState<string[]>(existingTask?.field_config?.options || ['Option 1', 'Option 2']);
    const [allowMultiple, setAllowMultiple] = useState(existingTask?.field_config?.allowMultiple || false);

    // Rating specific
    const [ratingMax, setRatingMax] = useState(existingTask?.field_config?.max || 5);
    const [ratingLabels, setRatingLabels] = useState<string[]>(existingTask?.field_config?.labels || ['Poor', 'Excellent']);

    // Number specific
    const [minValue, setMinValue] = useState<number | undefined>(existingTask?.field_config?.minValue);
    const [maxValue, setMaxValue] = useState<number | undefined>(existingTask?.field_config?.maxValue);
    const [step, setStep] = useState(existingTask?.field_config?.step || 1);

    const handleSave = () => {
        const task: Partial<StageTask> = {
            description,
            field_type: fieldType,
            required,
            placeholder,
            field_config: {},
        };

        // Add field-specific config
        if (fieldType === 'multiple_choice') {
            task.field_config = {
                options: options.filter(o => o.trim()),
                allowMultiple,
            };
        } else if (fieldType === 'rating') {
            task.field_config = {
                max: ratingMax,
                labels: ratingLabels.filter(l => l.trim()),
            };
        } else if (fieldType === 'number') {
            task.field_config = {
                minValue,
                maxValue,
                step,
            };
        }

        onSave(task);
        onClose();
    };

    const addOption = () => {
        setOptions([...options, `Option ${options.length + 1}`]);
    };

    const removeOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{existingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Task Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Task Description <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Rate the quality of equipment"
                            rows={2}
                        />
                    </div>

                    {/* Field Type */}
                    <div className="space-y-2">
                        <Label htmlFor="fieldType">Field Type</Label>
                        <Select value={fieldType} onValueChange={(v) => setFieldType(v as StageTaskFieldType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="checkbox">Checkbox (Yes/No)</SelectItem>
                                <SelectItem value="text">Short Text</SelectItem>
                                <SelectItem value="textarea">Long Text / Comments</SelectItem>
                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                <SelectItem value="rating">Star Rating</SelectItem>
                                <SelectItem value="number">Number Input</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Required */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="required"
                            checked={required}
                            onCheckedChange={(checked) => setRequired(!!checked)}
                        />
                        <Label htmlFor="required" className="font-normal cursor-pointer">
                            Mark as required field
                        </Label>
                    </div>

                    {/* Placeholder (for text fields) */}
                    {(fieldType === 'text' || fieldType === 'textarea' || fieldType === 'number') && (
                        <div className="space-y-2">
                            <Label htmlFor="placeholder">Placeholder Text (Optional)</Label>
                            <Input
                                id="placeholder"
                                value={placeholder}
                                onChange={(e) => setPlaceholder(e.target.value)}
                                placeholder="e.g., Enter your feedback here..."
                            />
                        </div>
                    )}

                    {/* Multiple Choice Configuration */}
                    {fieldType === 'multiple_choice' && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
                            <h4 className="font-semibold text-sm">Multiple Choice Options</h4>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="allowMultiple"
                                    checked={allowMultiple}
                                    onCheckedChange={(checked) => setAllowMultiple(!!checked)}
                                />
                                <Label htmlFor="allowMultiple" className="font-normal cursor-pointer text-sm">
                                    Allow selecting multiple options
                                </Label>
                            </div>

                            <div className="space-y-2">
                                {options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                                        <Input
                                            value={option}
                                            onChange={(e) => updateOption(index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                        />
                                        {options.length > 2 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeOption(index)}
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addOption}
                                    className="w-full"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Option
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Rating Configuration */}
                    {fieldType === 'rating' && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
                            <h4 className="font-semibold text-sm">Rating Scale Configuration</h4>

                            <div className="space-y-2">
                                <Label htmlFor="ratingMax">Maximum Rating</Label>
                                <Select value={String(ratingMax)} onValueChange={(v) => setRatingMax(Number(v))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="3">3 Stars</SelectItem>
                                        <SelectItem value="5">5 Stars</SelectItem>
                                        <SelectItem value="10">10 Stars</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="labelMin">Low Label (Optional)</Label>
                                    <Input
                                        id="labelMin"
                                        value={ratingLabels[0] || ''}
                                        onChange={(e) => setRatingLabels([e.target.value, ratingLabels[1] || ''])}
                                        placeholder="e.g., Poor"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="labelMax">High Label (Optional)</Label>
                                    <Input
                                        id="labelMax"
                                        value={ratingLabels[1] || ''}
                                        onChange={(e) => setRatingLabels([ratingLabels[0] || '', e.target.value])}
                                        placeholder="e.g., Excellent"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Number Configuration */}
                    {fieldType === 'number' && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
                            <h4 className="font-semibold text-sm">Number Input Configuration</h4>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="minValue">Min Value</Label>
                                    <Input
                                        id="minValue"
                                        type="number"
                                        value={minValue ?? ''}
                                        onChange={(e) => setMinValue(e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="No limit"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxValue">Max Value</Label>
                                    <Input
                                        id="maxValue"
                                        type="number"
                                        value={maxValue ?? ''}
                                        onChange={(e) => setMaxValue(e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="No limit"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="step">Step</Label>
                                    <Input
                                        id="step"
                                        type="number"
                                        value={step}
                                        onChange={(e) => setStep(Number(e.target.value) || 1)}
                                        placeholder="1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!description.trim()}>
                        {existingTask ? 'Update Task' : 'Add Task'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
