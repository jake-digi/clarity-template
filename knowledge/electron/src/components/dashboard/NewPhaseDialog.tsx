
import React from 'react';
import {
    Layout,
    ListTodo,
    Calendar,
    FolderOpen,
    MessageSquare,
    Trello
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const phaseTemplates = [
    {
        id: 'dashboard',
        name: 'KPI Dashboard',
        description: 'High-level metrics, progress charts, and financial overview.',
        icon: Layout,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50'
    },
    {
        id: 'table',
        name: 'Task Inventory',
        description: 'Standard tabular view for tracking granular tasks and statuses.',
        icon: ListTodo,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50'
    },
    {
        id: 'gantt',
        name: 'Timeline Scheduler',
        description: 'Gantt-based visualization for dependency management.',
        icon: Calendar,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50'
    },
    {
        id: 'docs',
        name: 'Document Repository',
        description: 'File-first view for compliance drawings and technical manuals.',
        icon: FolderOpen,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-50'
    },
    {
        id: 'kanban',
        name: 'Workflow Board',
        description: 'Visual stages (Todo, Doing, Testing, Done) for shop floor items.',
        icon: Trello,
        color: 'text-rose-500',
        bgColor: 'bg-rose-50'
    },
    {
        id: 'log',
        name: 'Communication Log',
        description: 'Sequential record for meetings, briefings, and client updates.',
        icon: MessageSquare,
        color: 'text-slate-500',
        bgColor: 'bg-slate-50'
    }
];

interface NewPhaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddPhase: (phase: any) => void;
}

export const NewPhaseDialog = ({ open, onOpenChange, onAddPhase }: NewPhaseDialogProps) => {
    const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);
    const [name, setName] = React.useState('');

    const handleCreate = () => {
        if (!name || !selectedTemplate) return;
        const templateObj = phaseTemplates.find(t => t.id === selectedTemplate);
        onAddPhase({
            name,
            template: templateObj?.name || selectedTemplate,
            status: 'Upcoming',
            progress: 0,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            color: templateObj?.bgColor || 'bg-accent/30'
        });
        setName('');
        setSelectedTemplate(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] rounded-none border-border bg-card p-0 gap-0 shadow-2xl">
                <DialogHeader className="p-8 pb-6 border-b border-border bg-muted/20">
                    <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2 text-[#212121]">
                        <div className="w-2 h-6 bg-primary" />
                        Configure Project Phase
                    </DialogTitle>
                    <DialogDescription className="text-[11px] font-semibold text-[#8C8C8C] tracking-tight mt-1">
                        Select a functional template for your new phase
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 space-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-[#8C8C8C] tracking-tight">Phase Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Final Precision Testing"
                            className="rounded-none border-border h-11 text-sm focus-visible:ring-primary font-semibold text-[#212121]"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[11px] font-semibold text-[#8C8C8C] tracking-tight">Select Functional Blueprint</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {phaseTemplates.map((template) => {
                                const Icon = template.icon;
                                return (
                                    <button
                                        key={template.id}
                                        onClick={() => setSelectedTemplate(template.id)}
                                        className={cn(
                                            "flex items-start gap-4 p-4 text-left border transition-all relative overflow-hidden group",
                                            selectedTemplate === template.id
                                                ? "border-primary bg-primary/5 shadow-sm"
                                                : "border-border hover:border-primary/50 hover:bg-muted/30"
                                        )}
                                    >
                                        <div className={cn("p-2 shrink-0 rounded-none", template.bgColor)}>
                                            <Icon className={cn("w-5 h-5", template.color)} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-[#212121] tracking-tight">{template.name}</h4>
                                            <p className="text-[10px] text-[#5C5C5C] font-medium leading-relaxed line-clamp-2">
                                                {template.description}
                                            </p>
                                        </div>
                                        {selectedTemplate === template.id && (
                                            <div className="absolute top-0 right-0 w-8 h-8 bg-primary flex items-center justify-center translate-x-4 -translate-y-4 rotate-45">
                                                <div className="w-1 h-3 bg-white -rotate-45 translate-y-1" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-muted/20 border-t border-border flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-none text-[11px] font-bold uppercase tracking-wider h-10 px-6 text-[#5C5C5C]"
                    >
                        Abort
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!name || !selectedTemplate}
                        className="rounded-none text-[11px] font-bold uppercase tracking-wider h-10 px-8 shadow-lg transition-all"
                    >
                        Initialise Phase
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
