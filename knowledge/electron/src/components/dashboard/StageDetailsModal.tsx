import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StageTaskField } from './StageTaskField';
import { StagesService, GroupStageProgressWithDetails, StageTemplateWithTasks } from '@/services/stages.service';
import { toast } from 'sonner';
import { CheckCircle2, Flag, Loader2, X, Save, Users, UserCheck, UserMinus, MessageSquare } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { StageTask, StageTaskResponse } from '@/types/stages';
import { ParticipantsService } from '@/services/participants.service';
import type { Participant } from '@/types/database';

interface StageDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
    groupName: string;
    stageTemplate: StageTemplateWithTasks;
    progressData?: GroupStageProgressWithDetails;
    onRefresh: () => void;
}

export const StageDetailsModal = ({
    isOpen,
    onClose,
    groupId,
    groupName,
    stageTemplate,
    progressData,
    onRefresh
}: StageDetailsModalProps) => {
    const [taskResponses, setTaskResponses] = useState<Record<string, Partial<StageTaskResponse>>>({});
    const [notes, setNotes] = useState(progressData?.notes || '');
    const [incidentFlag, setIncidentFlag] = useState(progressData?.incident_flag || false);
    const [saving, setSaving] = useState(false);

    // Participant Tracker
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [participantStatuses, setParticipantStatuses] = useState<Record<string, { is_present: boolean; comment: string }>>({});
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    useEffect(() => {
        if (progressData?.task_completions) {
            const responsesMap: Record<string, Partial<StageTaskResponse>> = {};
            progressData.task_completions.forEach(completion => {
                responsesMap[completion.stage_task_id] = completion;
            });
            setTaskResponses(responsesMap);
        }
        setNotes(progressData?.notes || '');
        setIncidentFlag(progressData?.incident_flag || false);

        if (isOpen && groupId && progressData) {
            fetchParticipantsAndStatuses();
        }
    }, [progressData, isOpen, groupId]);

    const fetchParticipantsAndStatuses = async () => {
        if (!groupId || !progressData) return;
        setLoadingParticipants(true);
        try {
            // 1. Fetch Subgroup Members
            const subgroupParticipants = await ParticipantsService.getAll({ sub_group_id: groupId });
            setParticipants(subgroupParticipants);

            // 2. Fetch Existing Statuses for this progress
            const statuses = await StagesService.getParticipantStatuses(progressData.id);
            const statusMap: Record<string, { is_present: boolean; comment: string }> = {};

            // Initialize with "Present" for everyone if no status yet
            subgroupParticipants.forEach(p => {
                const existing = statuses.find(s => s.participant_id === p.id);
                statusMap[p.id] = {
                    is_present: existing ? existing.is_present : true,
                    comment: existing?.comment || ''
                };
            });
            setParticipantStatuses(statusMap);
        } catch (error) {
            console.error('Failed to fetch participants details:', error);
        } finally {
            setLoadingParticipants(false);
        }
    };

    const handleTaskChange = (taskId: string, value: Partial<StageTaskResponse>) => {
        setTaskResponses(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                ...value,
                stage_task_id: taskId,
            }
        }));
    };

    const handleParticipantStatusChange = (participantId: string, updates: { is_present?: boolean; comment?: string }) => {
        setParticipantStatuses(prev => ({
            ...prev,
            [participantId]: {
                ...prev[participantId],
                ...updates
            }
        }));
    };

    const handleSave = async () => {
        if (!progressData) {
            toast.error('Progress data not found');
            return;
        }

        setSaving(true);
        try {
            // Save each task completion
            for (const [taskId, response] of Object.entries(taskResponses)) {
                await StagesService.updateTaskCompletion(
                    progressData.id,
                    taskId,
                    response
                );
            }

            // Save Participant Statuses
            for (const [participantId, status] of Object.entries(participantStatuses)) {
                await StagesService.updateParticipantStatus(
                    progressData.id,
                    participantId,
                    status
                );
            }

            // Update progress notes and incident flag
            await StagesService.updateStageProgress(progressData.id, {
                notes,
                incident_flag: incidentFlag,
            });

            toast.success('Progress saved');
            onRefresh();
        } catch (error) {
            console.error('Failed to save progress:', error);
            toast.error('Failed to save progress');
        } finally {
            setSaving(false);
        }
    };

    const handleComplete = async () => {
        if (!progressData) return;

        // Check if all required tasks are completed
        const requiredTasks = stageTemplate.tasks.filter(t => (t as any).required);
        const allRequiredCompleted = requiredTasks.every(task => {
            const response = taskResponses[task.id];
            return response?.completed;
        });

        if (!allRequiredCompleted) {
            toast.error('Please complete all required tasks before marking stage as complete');
            return;
        }

        setSaving(true);
        try {
            // 1. Save all tasks and participant statuses first
            for (const [taskId, response] of Object.entries(taskResponses)) {
                await StagesService.updateTaskCompletion(
                    progressData.id,
                    taskId,
                    response
                );
            }

            for (const [participantId, status] of Object.entries(participantStatuses)) {
                await StagesService.updateParticipantStatus(
                    progressData.id,
                    participantId,
                    status
                );
            }

            // 2. Mark as complete
            await StagesService.completeStage(progressData.id, {
                notes,
                incident_flag: incidentFlag,
            });

            toast.success('Stage marked as complete');
            onRefresh();
            onClose();
        } catch (error) {
            console.error('Failed to complete stage:', error);
            toast.error('Failed to complete stage');
        } finally {
            setSaving(false);
        }
    };

    const completedCount = Object.values(taskResponses).filter(r => r.completed).length;
    const totalTasks = stageTemplate.tasks.length;
    const progressPercent = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
    const isCompleted = progressData?.status === 'completed';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span>{stageTemplate.title}</span>
                                {isCompleted && (
                                    <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded font-bold">
                                        COMPLETED
                                    </span>
                                )}
                            </div>
                            <div className="text-sm font-normal text-muted-foreground mt-1">
                                {groupName}
                            </div>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {/* Progress Bar */}
                <div className="space-y-2 pb-2 border-b">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span className="font-semibold">{completedCount}/{totalTasks} tasks</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-500",
                                isCompleted ? "bg-green-500" : "bg-primary"
                            )}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-6 py-4">
                        {/* Description */}
                        {stageTemplate.description && (
                            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                {stageTemplate.description}
                            </div>
                        )}

                        {/* Tasks */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm">Tasks</h3>
                            {stageTemplate.tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className={cn(
                                        "p-4 border rounded-lg transition-all",
                                        taskResponses[task.id]?.completed
                                            ? "bg-green-50/50 border-green-200"
                                            : "bg-card border-border"
                                    )}
                                >
                                    <StageTaskField
                                        task={task as StageTask}
                                        value={taskResponses[task.id] as StageTaskResponse}
                                        onChange={(value) => handleTaskChange(task.id, value)}
                                        disabled={isCompleted}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Participant Attendance */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Participant Check
                            </h3>
                            {loadingParticipants ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : participants.length === 0 ? (
                                <div className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-lg text-center">
                                    No participants assigned to this subgroup.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {participants.map((p) => {
                                        const status = participantStatuses[p.id];
                                        // Default to present if status not yet loaded/found
                                        const isPresent = status ? status.is_present : true;
                                        const comment = status?.comment || '';

                                        return (
                                            <div
                                                key={p.id}
                                                className={cn(
                                                    "p-3 border rounded-lg transition-all",
                                                    isPresent
                                                        ? "bg-muted/10 border-border"
                                                        : "bg-red-50/50 border-red-100"
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-foreground">
                                                                {p.first_name} {p.surname}
                                                            </span>
                                                            {p.rank && (
                                                                <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                                                                    {p.rank}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <MessageSquare className="w-3 h-3 text-muted-foreground" />
                                                            <input
                                                                type="text"
                                                                placeholder="Add participant comment..."
                                                                className="flex-1 bg-transparent border-none text-xs focus:ring-0 p-0 placeholder:text-muted-foreground/40 font-medium"
                                                                value={comment}
                                                                onChange={(e) => handleParticipantStatusChange(p.id, { comment: e.target.value })}
                                                                disabled={isCompleted}
                                                            />
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant={isPresent ? "outline" : "destructive"}
                                                        size="sm"
                                                        className={cn(
                                                            "h-8 gap-2 shrink-0 font-bold text-[10px] uppercase tracking-wider",
                                                            isPresent && "text-green-600 border-green-200 hover:bg-green-50"
                                                        )}
                                                        onClick={() => handleParticipantStatusChange(p.id, { is_present: !isPresent })}
                                                        disabled={isCompleted}
                                                    >
                                                        {isPresent ? (
                                                            <>
                                                                <UserCheck className="w-3.5 h-3.5" />
                                                                PRESENT
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserMinus className="w-3.5 h-3.5" />
                                                                ABSENT
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes / Comments</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any additional notes or observations..."
                                rows={4}
                                disabled={isCompleted}
                            />
                        </div>

                        {/* Incident Flag */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant={incidentFlag ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => setIncidentFlag(!incidentFlag)}
                                disabled={isCompleted}
                                className="gap-2"
                            >
                                <Flag className="w-4 h-4" />
                                {incidentFlag ? 'Incident Flagged' : 'Flag Incident'}
                            </Button>
                            {incidentFlag && (
                                <span className="text-xs text-destructive animate-pulse font-semibold">
                                    This stage has been flagged for review
                                </span>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        <X className="w-4 h-4 mr-2" />
                        Close
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleSave}
                            disabled={saving || isCompleted}
                        >
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Progress
                        </Button>
                        <Button
                            onClick={handleComplete}
                            disabled={saving || isCompleted}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Mark Complete
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
