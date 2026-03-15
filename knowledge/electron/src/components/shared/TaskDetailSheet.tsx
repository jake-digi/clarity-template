
import React, { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Calendar,
    User,
    Clock,
    Hash,
    Layers,
    AlertCircle,
    CheckCircle2,
    CalendarDays
} from "lucide-react";
import { CommentSection, Comment } from './CommentSection';
import { Task } from "@/data/mockData-old";
import { getPriorityColor, getStatusColor } from "@/lib/tableUtils";
import { cn } from "@/lib/utils";

interface TaskDetailSheetProps {
    task: Task | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const mockComments: Comment[] = [
    {
        id: 'c1',
        user: 'Jason Barker',
        content: 'Technical drawings for the end effector mount are complete. Moving to fabrication.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
        id: 'c2',
        user: 'Sarah Chen',
        content: 'Please verify the clearance for the robot arm movements against the base frame.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    }
];

export function TaskDetailSheet({ task, open, onOpenChange }: TaskDetailSheetProps) {
    const [comments, setComments] = useState<Comment[]>(mockComments);

    if (!task) return null;

    const handleAddComment = (content: string) => {
        const newComment: Comment = {
            id: `c${Date.now()}`,
            user: 'Admin User', // Hardcoded for demo
            content,
            timestamp: new Date(),
        };
        setComments([newComment, ...comments]);
    };

    const MetaItem = ({ icon: Icon, label, value, colorClass }: any) => (
        <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold tracking-tight">{label}</span>
            </div>
            <span className={cn("text-xs font-semibold", colorClass || "text-foreground")}>{value}</span>
        </div>
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[450px] sm:max-w-[550px] p-0 gap-0 flex flex-col rounded-none border-l border-border bg-card">
                <SheetHeader className="p-6 pb-1 bg-muted/20 border-b border-border shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="rounded-none font-mono text-[9px] border-primary/50 text-primary bg-primary/5">
                            {task.phase}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-semibold">TASK-2026-{task.id.padStart(3, '0')}</span>
                    </div>
                    <SheetTitle className="text-[20px] font-bold tracking-tight text-foreground leading-tight">
                        {task.taskName}
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Scrollable Content Area (Details) */}
                    <div className="flex-none overflow-y-auto max-h-[40%] border-b border-border bg-background">
                        <div className="px-6 py-1 space-y-0.5">
                            <MetaItem
                                icon={AlertCircle}
                                label="Priority"
                                value={task.priority}
                                colorClass={getPriorityColor(task.priority)}
                            />
                            <MetaItem
                                icon={CheckCircle2}
                                label="Status"
                                value={task.status}
                                colorClass={getStatusColor(task.status)}
                            />
                            <MetaItem
                                icon={User}
                                label="Assignee"
                                value={task.assignees?.length > 0 ? task.assignees.join(", ") : "Unassigned"}
                            />
                            <MetaItem
                                icon={CalendarDays}
                                label="Deadline"
                                value={task.deadline}
                            />
                            <MetaItem
                                icon={Clock}
                                label="Time Tracking"
                                value={`${task.loggedHours}h / ${task.estHours}h`}
                            />
                        </div>

                        <Separator className="bg-border" />

                        <div className="p-6 bg-muted/10">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[11px] font-semibold tracking-tight text-muted-foreground">Completion Progress</span>
                                <span className="text-xs font-bold text-primary">{(task.loggedHours / task.estHours * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 bg-accent rounded-none overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${(task.loggedHours / task.estHours * 100)}%` }}
                                />
                            </div>
                        </div>

                        <Separator className="bg-border" />

                        <div className="p-6 space-y-3">
                            <h3 className="text-[11px] font-semibold tracking-tight text-muted-foreground">Description</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                This task involves the critical design and oversight of the mechanical interface for the robotic sanding unit.
                                Requirements include vibration damping and high-precision alignment with the kuka arm mount.
                            </p>
                        </div>
                    </div>

                    {/* Comment Section (Fills remaining space, handles own scroll) */}
                    <div className="flex-1 min-h-0">
                        <CommentSection
                            comments={comments}
                            onAddComment={handleAddComment}
                        />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
