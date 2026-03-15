
import { cn } from "@/lib/utils";
import {
    Users,
    ShieldCheck,
    Boxes,
    Home,
    Activity,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    MessageSquare
} from 'lucide-react';

export const InstancesOverview = () => {
    const StatCard = ({ title, value, subValue, icon: Icon, color }: any) => (
        <div className="bg-card p-6 border border-border flex flex-col gap-2">
            <div className="flex justify-between items-start">
                <div className={cn("p-2 rounded-none bg-primary/10", color)}>
                    <Icon className="w-5 h-5 text-primary" />
                </div>
            </div>
            <div>
                <p className="text-[11px] font-bold text-muted-foreground tracking-wider">{title}</p>
                <h3 className="text-3xl font-bold text-foreground mt-1">{value}</h3>
                <p className="text-[10px] text-muted-foreground font-medium mt-1">{subValue}</p>
            </div>
        </div>
    );

    return (
        <div className="flex-1 bg-muted/20 overflow-auto p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Instances Global Overview</h1>
                    <p className="text-sm text-muted-foreground font-medium">Aggregated data across all active camps and programs</p>
                </div>

                {/* Primary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Participants"
                        value="1,458"
                        subValue="+12% from last season"
                        icon={Users}
                    />
                    <StatCard
                        title="Active Cases"
                        value="24"
                        subValue="6 require immediate attention"
                        icon={ShieldCheck}
                    />
                    <StatCard
                        title="Global Groups"
                        value="112"
                        subValue="Across 6 active instances"
                        icon={Boxes}
                    />
                    <StatCard
                        title="Occupancy"
                        value="92%"
                        subValue="42 beds remaining globally"
                        icon={Home}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Activity Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card border border-border p-6">
                            <h3 className="text-sm font-bold text-foreground mb-6 tracking-wider flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                Global activity feed
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { instance: 'Summer Camp 2026', user: 'Sarah Jenkins', action: 'added a new medical case', time: '5 mins ago', urgent: true },
                                    { instance: 'DofE JCOSS', user: 'Mike Ross', action: 'updated timetable for Day 2', time: '22 mins ago' },
                                    { instance: 'Winter Camp 2026', user: 'System', action: 'accommodation list finalized', time: '1 hour ago' },
                                    { instance: 'Leaders Weekend', user: 'Emma Wilson', action: 'posted a global announcement', time: '3 hours ago' },
                                    { instance: 'DofE Yavneh', user: 'David Bond', action: 'checked in 45 participants', time: '4 hours ago' },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 items-start group">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full mt-2 shrink-0",
                                            item.urgent ? "bg-red-500 animate-pulse" : "bg-primary/30"
                                        )} />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <p className="text-sm font-bold text-foreground">
                                                    {item.user} <span className="font-medium text-muted-foreground">{item.action}</span>
                                                </p>
                                                <span className="text-[10px] text-muted-foreground font-medium">{item.time}</span>
                                            </div>
                                            <p className="text-[11px] font-bold text-primary tracking-tight">{item.instance}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="space-y-6">
                        <div className="bg-card border border-border p-6">
                            <h3 className="text-sm font-bold text-foreground mb-6 tracking-wider flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                Urgent actions
                            </h3>
                            <div className="space-y-4">
                                <div className="p-3 bg-red-500/5 border-l-2 border-red-500">
                                    <p className="text-[11px] font-bold text-red-600 mb-1">Medical alert</p>
                                    <p className="text-xs font-medium">3 participants at Summer Camp require medication check-in</p>
                                </div>
                                <div className="p-3 bg-amber-500/5 border-l-2 border-amber-500">
                                    <p className="text-[11px] font-bold text-amber-600 mb-1">Maintenance</p>
                                    <p className="text-xs font-medium">Generator failure reported at Winter Camp site</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border p-6">
                            <h3 className="text-sm font-bold text-foreground mb-6 tracking-wider flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                Upcoming transitions
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Summer Camp Arrival', date: 'Tomorrow, 09:00' },
                                    { label: 'DofE JCOSS Departure', date: 'Fri, 14:30' },
                                    { label: 'Staff Briefing', date: 'Mon, 18:00' },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                        <span className="text-xs font-semibold">{item.label}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground">{item.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
