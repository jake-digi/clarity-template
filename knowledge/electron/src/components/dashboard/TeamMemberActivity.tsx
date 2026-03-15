
import { TeamMember } from "@/data/mockData-old";
import { cn } from "@/lib/utils";
import {
    Clock,
    CheckCircle2,
    MessageSquare,
    AlertCircle,
    Calendar,
    TrendingUp,
    MapPin,
    Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Activity {
    id: string;
    type: 'task' | 'hours' | 'comment' | 'issue';
    title: string;
    project: string;
    time: string;
    detail?: string;
    icon: any;
    color: string;
}

const mockActivities: Activity[] = [
    {
        id: '1',
        type: 'task',
        title: 'Completed "Design custom end effector"',
        project: 'Base Sanding',
        time: '2 hours ago',
        icon: CheckCircle2,
        color: 'text-emerald-500'
    },
    {
        id: '2',
        type: 'hours',
        title: 'Logged 4.5 hours to "Mechanical Build"',
        project: 'SDM Project',
        time: '5 hours ago',
        detail: 'Finalized assembly drawings and BOM.',
        icon: Clock,
        color: 'text-primary'
    },
    {
        id: '3',
        type: 'comment',
        title: 'Commented on "Order KUKA robot"',
        project: 'Base Sanding',
        time: 'Yesterday',
        detail: 'Supplier confirmed delivery for next Thursday.',
        icon: MessageSquare,
        color: 'text-blue-500'
    },
    {
        id: '4',
        type: 'issue',
        title: 'Resolved 2 issues in "CES Composites"',
        project: 'CES Composites',
        time: '2 days ago',
        icon: AlertCircle,
        color: 'text-amber-500'
    }
];

export function TeamMemberActivity({ member }: { member: TeamMember }) {
    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            <SheetHeader className="p-6 border-b border-border/50 bg-muted/20 text-left">
                <div className="flex items-center gap-4">
                    <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0", member.color)}>
                        {member.initials}
                    </div>
                    <div>
                        <SheetTitle className="text-xl font-bold text-foreground tracking-tight mb-1">{member.name}</SheetTitle>
                        <SheetDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                            {member.role}
                        </SheetDescription>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="flex flex-col gap-1 p-3 bg-background rounded-sm border border-border/50">
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Status</span>
                        <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full",
                                member.status === 'active' ? "bg-emerald-500 animate-pulse" :
                                    member.status === 'busy' ? "bg-amber-500" : "bg-muted-foreground/30"
                            )} />
                            <span className="text-xs font-bold capitalize">{member.status}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-background rounded-sm border border-border/50">
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Workload</span>
                        <span className={cn("text-xs font-bold capitalize",
                            member.workload === 'high' ? "text-red-600" :
                                member.workload === 'medium' ? "text-amber-600" : "text-emerald-600"
                        )}>{member.workload}</span>
                    </div>
                </div>
            </SheetHeader>

            <ScrollArea className="flex-1">
                {/* Performance Stats */}
                <div className="p-6 border-b border-border/50">
                    <h3 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-4">Monthly Performance</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary/10 transition-colors">
                                    <Clock className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-foreground">Logged Hours</div>
                                    <div className="text-[10px] text-muted-foreground font-medium">Goal: 160h</div>
                                </div>
                            </div>
                            <div className="text-sm font-bold text-foreground tabular-nums">{member.loggedHours}h</div>
                        </div>

                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10 group-hover:bg-emerald-500/10 transition-colors">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-foreground">Tasks Completed</div>
                                    <div className="text-[10px] text-muted-foreground font-medium">Goal: 12</div>
                                </div>
                            </div>
                            <div className="text-sm font-bold text-foreground tabular-nums">{member.activeTasks}</div>
                        </div>
                    </div>
                </div>

                {/* Activity Timeline */}
                <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                    <h3 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-6">Recent Activity</h3>

                    <div className="relative space-y-8 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border/50">
                        {mockActivities.map((activity) => (
                            <div key={activity.id} className="relative pl-10 group">
                                {/* Icon Dot */}
                                <div className={cn(
                                    "absolute left-0 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center z-10 transition-colors group-hover:border-primary/50",
                                    activity.color
                                )}>
                                    <activity.icon className="w-3.5 h-3.5" />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                                            {activity.title}
                                        </div>
                                        <span className="text-[10px] font-medium text-muted-foreground/40 whitespace-nowrap ml-4">{activity.time}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Briefcase className="w-2.5 h-2.5 text-muted-foreground/40" />
                                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{activity.project}</span>
                                    </div>
                                    {activity.detail && (
                                        <div className="mt-2 p-2.5 bg-muted/30 rounded-sm border border-border/40 text-[11px] text-muted-foreground leading-relaxed italic">
                                            "{activity.detail}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ScrollArea>

            {/* Actions */}
            <div className="p-6 border-t border-border/50 bg-muted/10">
                <Button className="w-full h-10 font-bold uppercase tracking-widest text-[11px] shadow-sm">
                    Generate Full Report
                    <TrendingUp className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
