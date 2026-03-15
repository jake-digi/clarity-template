
import { useState, useMemo, useEffect } from 'react';
import {
    Search,
    CheckCircle2,
    Settings2,
    Users,
    MapPin,
    Play,
    Lock,
    Plus,
    Loader2,
    Flag
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InstanceWithDetails } from '@/types/database';
import { StagesService, StageTemplateWithTasks, GroupStageProgressWithDetails } from '@/services/stages.service';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { StageTemplateManager } from '@/components/dashboard/StageTemplateManager';
import { StageDetailsModal } from './StageDetailsModal';

interface StagesTableProps {
    instance?: InstanceWithDetails;
}

export const StagesTable = ({ instance }: StagesTableProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [templates, setTemplates] = useState<StageTemplateWithTasks[]>([]);
    const [progress, setProgress] = useState<GroupStageProgressWithDetails[]>([]);
    const [loading, setLoading] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);

    // Stage Details Modal State
    const [selectedStage, setSelectedStage] = useState<{
        groupId: string;
        groupName: string;
        template: StageTemplateWithTasks;
        progress?: GroupStageProgressWithDetails;
    } | null>(null);

    const subgroups = instance?.subgroups || [];

    const loadData = async () => {
        if (!instance) return;
        setLoading(true);
        try {
            const [fetchedTemplates, fetchedProgress] = await Promise.all([
                StagesService.getStageTemplates(instance.id),
                StagesService.getGroupProgressForInstance(instance.id)
            ]);
            setTemplates(fetchedTemplates);
            setProgress(fetchedProgress);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load stages data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [instance?.id]);

    const filteredGroups = useMemo(() => {
        if (!searchQuery) return subgroups;
        return subgroups.filter(group =>
            group.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, subgroups]);

    const getStageProgress = (groupId: string, templateId: string) => {
        return progress.find(p => p.subgroup_id === groupId && p.stage_template_id === templateId);
    };

    const handleStartStage = async (groupId: string, templateId: string) => {
        try {
            await StagesService.startStage(groupId, templateId);
            toast.success("Stage started");
            loadData(); // Refresh
        } catch (error) {
            console.error(error);
            toast.error("Failed to start stage");
        }
    };

    const isStageUnlockable = (groupId: string, orderNumber: number) => {
        if (orderNumber === 1) return true;
        // Check previous stage
        const prevTemplate = templates.find(t => t.order_number === orderNumber - 1);
        if (!prevTemplate) return true; // Should ideally exist

        const prevProgress = getStageProgress(groupId, prevTemplate.id);
        return prevProgress?.status === 'completed';
    };

    if (!instance) return <div className="p-4">No instance selected</div>;

    return (
        <div className="w-full h-full flex flex-col min-h-0 bg-background">
            {/* Toolbar */}
            <div className="flex-none flex items-center h-10 bg-background border-b border-border shadow-sm overflow-hidden z-10">
                <div className="flex items-center border-r border-border h-full px-4 bg-muted/20 min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                    <input
                        placeholder="Filter groups..."
                        className="bg-transparent border-none text-xs focus:ring-0 w-full placeholder:text-muted-foreground/50 font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="ml-auto flex items-center h-full">
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-4" />}

                    <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="h-full px-4 text-[11px] font-bold text-primary border-l border-border hover:bg-primary/5 rounded-none transition-colors">
                                <Plus className="w-3.5 h-3.5 mr-2" />
                                Manage Stages
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
                            <DialogHeader className="px-6 py-4 border-b">
                                <DialogTitle>Manage Stages & Tasks</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 min-h-0">
                                <StageTemplateManager instanceId={instance.id} tenantId={instance.tenant_id} onClose={() => { setIsManageOpen(false); loadData(); }} />
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button variant="ghost" className="h-full px-4 text-[11px] font-bold text-primary border-l border-border hover:bg-primary/5 rounded-none transition-colors">
                        Export Report
                    </Button>
                    <Button variant="ghost" onClick={loadData} className="h-full w-10 p-0 rounded-none border-l border-border hover:bg-muted/50 transition-colors">
                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="flex-1 overflow-auto no-scrollbar bg-background">
                <table className="w-full border-separate border-spacing-0 text-left table-fixed min-w-[1280px]">
                    <thead className="sticky top-0 z-20 bg-background shadow-sm">
                        <tr>
                            <th className="py-4 px-6 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground border-b border-r border-border w-[280px] min-w-[280px] sticky left-0 bg-background z-30">
                                Sub Group / Unit
                            </th>
                            {templates.map(stage => (
                                <th key={stage.id} className="py-4 px-4 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground border-b border-r border-border text-center w-[200px] min-w-[200px] bg-muted/5">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-primary/40 text-[9px]">Stage {stage.order_number}</span>
                                        <span>{stage.title}</span>
                                    </div>
                                </th>
                            ))}
                            {templates.length === 0 && (
                                <th className="py-4 px-4 text-[10px] font-medium text-muted-foreground border-b w-full">
                                    No stages configured. Click "Manage Stages" to add some.
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredGroups.map((group) => (
                            <tr key={group.id} className="group/row">
                                <td className="py-0 px-6 border-r border-border sticky left-0 bg-background group-hover/row:bg-muted/30 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                                            <Users className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-foreground truncate">{group.name}</div>
                                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                                                <MapPin className="w-2.5 h-2.5 text-muted-foreground/60" />
                                                {group.type || 'Unit'}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {templates.map(stage => {
                                    const progressData = getStageProgress(group.id, stage.id);

                                    if (!progressData) {
                                        const isAvailable = isStageUnlockable(group.id, stage.order_number);
                                        return (
                                            <td key={stage.id} className="p-0 border-r border-border bg-muted/5 group/empty transition-colors hover:bg-muted/10 w-[200px] min-w-[200px]">
                                                <div className="h-32 flex items-center justify-center p-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={!isAvailable}
                                                        onClick={() => handleStartStage(group.id, stage.id)}
                                                        className={cn(
                                                            "w-full h-full border border-dashed border-border flex flex-col items-center justify-center gap-2 transition-all group-hover/empty:opacity-100",
                                                            isAvailable
                                                                ? "text-muted-foreground/40 hover:text-primary hover:border-primary hover:bg-primary/5"
                                                                : "text-muted-foreground/20 cursor-not-allowed opacity-40 bg-muted/20 border-border/50"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm",
                                                            isAvailable ? "bg-muted group-hover:bg-primary/10" : "bg-muted/30"
                                                        )}>
                                                            {isAvailable ? <Play className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                                        </div>
                                                        <span className="text-[9px] font-black uppercase tracking-widest">{isAvailable ? 'Start Stage' : 'Locked'}</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        );
                                    }

                                    const total = stage.tasks.length;
                                    const completedCount = progressData.task_completions?.filter(t => t.completed).length || 0;
                                    const progressPercent = total > 0 ? (completedCount / total) * 100 : 0;
                                    const isComplete = progressData.status === 'completed';
                                    const hasIncident = progressData.incident_flag;

                                    return (
                                        <td key={stage.id} className="p-0 border-r border-border relative align-top w-[200px] min-w-[200px]">
                                            {/* Seamless Card Cell - Now Clickable */}
                                            <div
                                                className={cn(
                                                    "group/card h-32 w-full p-4 transition-all relative overflow-hidden cursor-pointer",
                                                    isComplete ? "bg-green-50/20" :
                                                        (hasIncident ? "bg-red-50/30" : "hover:bg-primary/[0.02]")
                                                )}
                                                onClick={() => setSelectedStage({
                                                    groupId: group.id,
                                                    groupName: group.name,
                                                    template: stage,
                                                    progress: progressData
                                                })}
                                            >
                                                {/* Left Status Bar */}
                                                <div className={cn(
                                                    "absolute left-0 top-0 bottom-0 w-1",
                                                    isComplete ? "bg-green-500" : (hasIncident ? "bg-red-500 animate-pulse" : (progressPercent > 0 ? "bg-primary" : "bg-muted"))
                                                )} />

                                                <div className="flex items-start justify-between mb-3">
                                                    <div className={cn(
                                                        "px-2 py-0.5 rounded-sm border text-[9px] font-bold uppercase tracking-tight",
                                                        isComplete ? "bg-green-500 text-white border-green-500" :
                                                            (hasIncident ? "bg-red-500 text-white border-red-500 animate-pulse" : "bg-primary/10 text-primary border-primary/20")
                                                    )}>
                                                        {isComplete ? 'Ready' : (hasIncident ? 'Incident' : 'Active')}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-muted-foreground/40">{completedCount}/{total}</span>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full transition-all duration-700 ease-in-out", isComplete ? "bg-green-500" : "bg-primary")}
                                                            style={{ width: `${progressPercent}%` }}
                                                        />
                                                    </div>
                                                    <p className={cn(
                                                        "text-[11px] leading-tight font-semibold line-clamp-2",
                                                        hasIncident ? "text-red-700" : "text-muted-foreground"
                                                    )}>
                                                        {isComplete ? 'Full compliance reached.' : (progressData.notes || 'Awaiting verification...')}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredGroups.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <Flag className="w-12 h-12 mb-4 text-muted-foreground" />
                        <h3 className="text-base font-bold text-foreground">No groups found</h3>
                        <p className="text-xs text-muted-foreground">Adjust your filter or search criteria.</p>
                    </div>
                )}
            </div>

            {/* Stage Details Modal */}
            {
                selectedStage && (
                    <StageDetailsModal
                        isOpen={!!selectedStage}
                        onClose={() => setSelectedStage(null)}
                        groupId={selectedStage.groupId}
                        groupName={selectedStage.groupName}
                        stageTemplate={selectedStage.template}
                        progressData={selectedStage.progress}
                        onRefresh={loadData}
                    />
                )
            }
        </div >
    );
};
