
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StagesService, StageTemplateWithTasks } from '@/services/stages.service';
import { toast } from 'sonner';
import { Trash2, Plus, GripVertical, Save, X, Edit2, CheckCircle2, Circle, MessageSquare, ListChecks, Star, Hash, Download, FileUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskConfigurator } from './TaskConfigurator';
import { SaveTemplateDialog } from './SaveTemplateDialog';
import { UseTemplateDialog } from './UseTemplateDialog';
import type { StageTask } from '@/types/stages';

interface StageTemplateManagerProps {
    instanceId: string;
    tenantId: string;
    onClose: () => void;
}

export const StageTemplateManager = ({ instanceId, tenantId, onClose }: StageTemplateManagerProps) => {
    const [templates, setTemplates] = useState<StageTemplateWithTasks[]>([]);
    const [loading, setLoading] = useState(false);

    // New Template State
    const [isAddingTemplate, setIsAddingTemplate] = useState(false);
    const [newTemplateTitle, setNewTemplateTitle] = useState('');

    // New Task State
    const [taskConfiguratorState, setTaskConfiguratorState] = useState<{
        isOpen: boolean;
        templateId: string | null;
        existingTask?: StageTask;
    }>({ isOpen: false, templateId: null });

    // Template Dialogs State
    const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
    const [isUseTemplateOpen, setIsUseTemplateOpen] = useState(false);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await StagesService.getStageTemplates(instanceId);
            setTemplates(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, [instanceId]);

    const handleCreateTemplate = async () => {
        if (!newTemplateTitle.trim()) return;
        try {
            const order = templates.length + 1;
            await StagesService.createStageTemplate({
                instance_id: instanceId,
                tenant_id: tenantId,
                title: newTemplateTitle,
                order_number: order,
                stage_number: order // DB seems to require this column
            } as any);
            toast.success("Stage created");
            setNewTemplateTitle('');
            setIsAddingTemplate(false);
            loadTemplates();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create stage");
        }
    };

    const handleDeleteTemplate = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete stage "${title}"? This will delete all associated tasks and progress.`)) return;
        try {
            await StagesService.deleteStageTemplate(id);
            toast.success("Stage deleted");
            loadTemplates();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete stage");
        }
    };

    const handleSaveTask = async (taskData: Partial<StageTask>) => {
        if (!taskConfiguratorState.templateId) return;

        try {
            const template = templates.find(t => t.id === taskConfiguratorState.templateId);
            const order = (template?.tasks?.length || 0) + 1;

            await StagesService.createStageTask({
                ...taskData,
                stage_template_id: taskConfiguratorState.templateId,
                order_number: order
            } as any);

            toast.success("Task added");
            setTaskConfiguratorState({ isOpen: false, templateId: null });
            loadTemplates();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add task");
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            await StagesService.deleteStageTask(taskId);
            toast.success("Task deleted");
            loadTemplates();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete task");
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header with Template Actions */}
            <div className="px-6 py-4 border-b bg-muted/5 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Manage Stages & Tasks</h2>
                    <p className="text-sm text-muted-foreground">Configure stages for this instance</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsUseTemplateOpen(true)}
                        className="gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Use Template
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSaveTemplateOpen(true)}
                        disabled={templates.length === 0}
                        className="gap-2"
                    >
                        <FileUp className="w-4 h-4" />
                        Save as Template
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="space-y-6 max-w-3xl mx-auto">
                    {templates.map((template, index) => (
                        <div key={template.id} className="border rounded-lg shadow-sm bg-card overflow-hidden">
                            <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <span className="font-semibold">{template.title}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteTemplate(template.id, template.title)}
                                    className="text-muted-foreground hover:text-red-500"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="p-4 space-y-2">
                                {(template.tasks || []).map((task, tIndex) => {
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
                                        <div key={task.id} className="flex items-center gap-2 group">
                                            <div className="w-6 flex justify-center text-muted-foreground/40">
                                                <GripVertical className="w-3 h-3" />
                                            </div>
                                            <div className="flex items-center gap-2 flex-1">
                                                <div className="text-muted-foreground/60">
                                                    {getFieldIcon((task as any).field_type || 'checkbox')}
                                                </div>
                                                <div className="flex-1 text-sm border-b border-dashed border-transparent group-hover:border-border pb-1">
                                                    {task.description}
                                                </div>
                                                {(task as any).required && (
                                                    <span className="text-xs text-destructive font-semibold">*</span>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                                                onClick={() => handleDeleteTask(task.id)}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    );
                                })}

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-muted-foreground mt-2 ml-8 font-normal"
                                    onClick={() => setTaskConfiguratorState({ isOpen: true, templateId: template.id })}
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Add Task
                                </Button>
                            </div>
                        </div>
                    ))}

                    {isAddingTemplate ? (
                        <div className="border rounded-lg p-4 bg-muted/20 border-dashed border-primary/30">
                            <h4 className="text-sm font-semibold mb-3">New Stage</h4>
                            <div className="flex gap-3">
                                <Input
                                    value={newTemplateTitle}
                                    onChange={(e) => setNewTemplateTitle(e.target.value)}
                                    placeholder="Stage Title (e.g. 'Safety Briefing')"
                                    className="bg-background"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateTemplate();
                                        if (e.key === 'Escape') setIsAddingTemplate(false);
                                    }}
                                />
                                <Button onClick={handleCreateTemplate}>Create Stage</Button>
                                <Button variant="outline" onClick={() => setIsAddingTemplate(false)}>Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            className="w-full border-dashed py-8 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5"
                            onClick={() => {
                                setIsAddingTemplate(true);
                                setNewTemplateTitle('');
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Stage
                        </Button>
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t bg-muted/10 flex justify-end">
                <Button onClick={onClose}>Done</Button>
            </div>

            {/* Task Configurator Modal */}
            <TaskConfigurator
                isOpen={taskConfiguratorState.isOpen}
                onClose={() => setTaskConfiguratorState({ isOpen: false, templateId: null })}
                onSave={handleSaveTask}
                existingTask={taskConfiguratorState.existingTask}
            />

            {/* Save Template Dialog */}
            <SaveTemplateDialog
                isOpen={isSaveTemplateOpen}
                onClose={() => setIsSaveTemplateOpen(false)}
                stagesData={templates}
                tenantId={tenantId}
                onSuccess={() => {
                    toast.success('Template saved! You can now use it in other instances.');
                }}
            />

            {/* Use Template Dialog */}
            <UseTemplateDialog
                isOpen={isUseTemplateOpen}
                onClose={() => setIsUseTemplateOpen(false)}
                instanceId={instanceId}
                tenantId={tenantId}
                onSuccess={loadTemplates}
            />
        </div>
    );
};
