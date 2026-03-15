import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { GlobalTemplatesService, GlobalStageTemplate } from '@/services/global-templates.service';
import { toast } from 'sonner';
import { FileText, Loader2, Download, Trash2, Calendar, CheckCircle2, Circle, MessageSquare, ListChecks, Star, Hash } from 'lucide-react';
import { cn } from "@/lib/utils";

interface UseTemplateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    instanceId: string;
    tenantId: string;
    onSuccess?: () => void;
}

export const UseTemplateDialog = ({
    isOpen,
    onClose,
    instanceId,
    tenantId,
    onSuccess
}: UseTemplateDialogProps) => {
    const [templates, setTemplates] = useState<GlobalStageTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen, tenantId]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await GlobalTemplatesService.getAll(tenantId);
            setTemplates(data);
        } catch (error) {
            console.error('Failed to load templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyTemplate = async (templateId: string) => {
        setApplying(templateId);
        try {
            await GlobalTemplatesService.applyTemplate(templateId, instanceId, tenantId);
            toast.success('Template applied successfully');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Failed to apply template:', error);
            toast.error('Failed to apply template');
        } finally {
            setApplying(null);
        }
    };

    const handleDeleteTemplate = async (templateId: string, templateName: string) => {
        if (!confirm(`Are you sure you want to delete the template "${templateName}"?`)) return;

        try {
            await GlobalTemplatesService.delete(templateId);
            toast.success('Template deleted');
            loadTemplates();
        } catch (error) {
            console.error('Failed to delete template:', error);
            toast.error('Failed to delete template');
        }
    };

    const getFieldIcon = (fieldType: string) => {
        switch (fieldType) {
            case 'checkbox': return <CheckCircle2 className="w-3 h-3" />;
            case 'text': return <MessageSquare className="w-3 h-3" />;
            case 'textarea': return <MessageSquare className="w-3 h-3" />;
            case 'multiple_choice': return <ListChecks className="w-3 h-3" />;
            case 'rating': return <Star className="w-3 h-3" />;
            case 'number': return <Hash className="w-3 h-3" />;
            default: return <Circle className="w-3 h-3" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Use Template</DialogTitle>
                    <DialogDescription>
                        Select a saved template to quickly set up stages for this instance.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 -mx-6 px-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                            <h3 className="font-semibold text-foreground mb-1">No templates found</h3>
                            <p className="text-sm text-muted-foreground">
                                Create your first template from the "Manage Stages & Tasks" dialog
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 py-4">
                            {templates.map((template) => {
                                const stageCount = template.template_data.stages.length;
                                const taskCount = template.template_data.stages.reduce(
                                    (sum, stage) => sum + stage.tasks.length,
                                    0
                                );
                                const isSelected = selectedTemplate === template.id;

                                return (
                                    <div
                                        key={template.id}
                                        className={cn(
                                            "border rounded-lg p-4 transition-all cursor-pointer",
                                            isSelected
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50 hover:bg-muted/30"
                                        )}
                                        onClick={() => setSelectedTemplate(template.id)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-foreground">
                                                        {template.name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>{stageCount} stage{stageCount !== 1 ? 's' : ''}</span>
                                                        <span>•</span>
                                                        <span>{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
                                                    </div>
                                                </div>

                                                {template.description && (
                                                    <p className="text-sm text-muted-foreground mb-3">
                                                        {template.description}
                                                    </p>
                                                )}

                                                {/* Preview of stages */}
                                                {isSelected && (
                                                    <div className="mt-3 space-y-2 border-t pt-3">
                                                        {template.template_data.stages.map((stage, idx) => (
                                                            <div key={idx} className="text-xs">
                                                                <div className="font-semibold text-foreground flex items-center gap-2">
                                                                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                                                        {stage.order_number}
                                                                    </span>
                                                                    {stage.title}
                                                                </div>
                                                                <div className="ml-7 mt-1 space-y-1">
                                                                    {stage.tasks.slice(0, 3).map((task, taskIdx) => (
                                                                        <div key={taskIdx} className="flex items-center gap-1.5 text-muted-foreground">
                                                                            {getFieldIcon(task.field_type)}
                                                                            <span className="truncate">{task.description}</span>
                                                                            {task.required && (
                                                                                <span className="text-destructive font-bold">*</span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    {stage.tasks.length > 3 && (
                                                                        <div className="text-muted-foreground/60 ml-5">
                                                                            +{stage.tasks.length - 3} more task{stage.tasks.length - 3 !== 1 ? 's' : ''}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Metadata */}
                                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(template.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteTemplate(template.id, template.name);
                                                    }}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => selectedTemplate && handleApplyTemplate(selectedTemplate)}
                        disabled={!selectedTemplate || !!applying}
                    >
                        {applying ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Applying...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Apply Template
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
