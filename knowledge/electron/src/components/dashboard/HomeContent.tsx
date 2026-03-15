import { useMemo } from 'react';
import {
    Home,
    ArrowRight,
    Clock,
    Zap,
    CheckCircle2,
    ArrowUpRight,
    Bell,
    ChevronRight,
    FileText,
    BookOpen,
    Layout,
    Shield,
    Newspaper,
    Settings,
    Calendar,
    ExternalLink,
    Activity,
    CreditCard,
    Users,
} from 'lucide-react';
import { projects, getAllTasks, announcements } from '@/data/mockData-old';
import { cn } from '@/lib/utils';

export const HomeContent = () => {
    // Current user for this demo
    const userName = 'Madina Barker';

    const allTasks = useMemo(() => getAllTasks(), []);
    const myTasks = useMemo(() => allTasks.filter(t => t.assignees?.includes(userName)), [allTasks]);
    const activeTasks = useMemo(() => myTasks.filter(t => t.status !== 'COMPLETED'), [myTasks]);

    const recentGlobalActivity = useMemo(() => {
        return Object.values(projects)
            .flatMap(p => p.recentActivity.map(a => ({ ...a, projectName: p.name, projectId: p.id })))
            .sort((a, b) => b.time.localeCompare(a.time))
            .slice(0, 5);
    }, []);

    return (
        <div className="flex-1 bg-background bg-dot-pattern overflow-auto flex flex-col font-sans relative">
            {/* Soft "Happiness" Gradient - Coming from bottom right */}
            <div className="fixed bottom-0 right-0 w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-[120px] -z-10 translate-x-1/3 translate-y-1/3 pointer-events-none" />

            {/* Content Body */}
            <div className="flex-1 px-10 py-10 max-w-7xl relative z-10">
                {/* Title Section */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4 text-foreground">
                        <h1 className="text-[28px] font-bold">Good Morning, {userName.split(' ')[0]}</h1>
                        <span className="text-2xl animate-bounce-subtle"></span>
                    </div>
                    <p className="text-[14px] text-muted-foreground leading-relaxed max-w-2xl bg-card/60">
                        Welcome to your company operating system. Monitor manufacturing operations,
                        manage your assigned tasks, and stay updated with site-wide announcements.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content Area (Left 2/3) */}
                    <div className="lg:col-span-2 space-y-16">

                        {/* Daily Operations Section */}
                        <section>
                            <h2 className="text-[16px] font-bold text-foreground mb-6 flex items-center gap-2">
                                Daily Operations
                            </h2>
                            <div className="h-px bg-border w-full mb-8" />

                            {/* Task Pulse - Expanded Table */}
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-foreground">Your Pending Tasks</h3>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="py-2 px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60">ID</th>
                                                <th className="py-2 px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60">Task Name</th>
                                                <th className="py-2 px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60">Phase</th>
                                                <th className="py-2 px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60">Deadline</th>
                                                <th className="py-2 px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60">Priority</th>
                                                <th className="py-2 px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {activeTasks.slice(0, 6).map(task => (
                                                <tr key={task.id} className="group hover:bg-muted/50 cursor-pointer transition-colors">
                                                    <td className="py-3 px-3">
                                                        <span className="text-[11px] font-mono text-muted-foreground/60">{task.id}</span>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">{task.taskName}</span>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span className="text-[11px] font-medium text-muted-foreground">{task.phase}</span>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                            <Clock className="w-3 h-3 text-muted-foreground/60" />
                                                            {task.deadline}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase",
                                                            task.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-500' :
                                                                task.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-500' :
                                                                    'bg-muted text-muted-foreground'
                                                        )}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-right">
                                                        <div className="flex items-center justify-end">
                                                            <span className="text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                                Detail <ArrowUpRight className="w-3 h-3" />
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-[11px] text-muted-foreground/60">Showing the first 6 pending tasks assigned to you.</p>
                                    <button className="text-[12px] font-bold text-primary hover:underline flex items-center gap-1 transition-colors">
                                        Open full task manager <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Resources Section */}
                        <section>
                            <h2 className="text-[16px] font-bold text-foreground mb-6">Staff Resources</h2>
                            <div className="h-px bg-border w-full mb-8" />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <a href="#" className="p-5 border border-border rounded-sm hover:border-muted-foreground/40 hover:bg-muted/50 transition-all group">
                                    <BookOpen className="w-5 h-5 text-muted-foreground/60 mb-3 group-hover:text-primary" />
                                    <h4 className="text-[13px] font-bold text-foreground mb-1">Technical SOPs</h4>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">400+ workshop manuals and technical guides.</p>
                                </a>
                                <a href="#" className="p-5 border border-border rounded-sm hover:border-muted-foreground/40 hover:bg-muted/50 transition-all group">
                                    <FileText className="w-5 h-5 text-muted-foreground/60 mb-3 group-hover:text-primary" />
                                    <h4 className="text-[13px] font-bold text-foreground mb-1">Safety RAMS</h4>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">Access latest Risk Assessments and Method Statements.</p>
                                </a>
                                <a href="#" className="p-5 border border-border rounded-sm hover:border-muted-foreground/40 hover:bg-muted/50 transition-all group">
                                    <Zap className="w-5 h-5 text-muted-foreground/60 mb-3 group-hover:text-primary" />
                                    <h4 className="text-[13px] font-bold text-foreground mb-1">Work Requests</h4>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">Submit maintenance orders or facility requests.</p>
                                </a>
                            </div>
                        </section>

                        {/* Upcoming Events */}
                        <section>
                            <h2 className="text-[16px] font-bold text-foreground mb-6 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" /> Upcoming Events
                            </h2>
                            <div className="h-px bg-border w-full mb-8" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { date: 'Feb 02', title: 'Site-wide Safety Stand-down', time: '09:00 - 10:00', type: 'Required' },
                                    { date: 'Feb 05', title: 'New Equipment Induction', time: '14:00 - 16:00', type: 'Training' },
                                    { date: 'Feb 12', title: 'Monthly Project Review', time: '13:00 - 15:00', type: 'Meeting' },
                                    { date: 'Feb 14', title: 'Staff Social - Pizza Friday', time: '12:30 - 13:30', type: 'Social' },
                                ].map((event, i) => (
                                    <div key={i} className="flex gap-4 p-4 border border-border/50 rounded-sm hover:bg-muted/50 transition-colors cursor-pointer group">
                                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-card border border-border rounded-sm shrink-0">
                                            <span className="text-[10px] font-bold text-primary uppercase">{event.date.split(' ')[0]}</span>
                                            <span className="text-[14px] font-bold text-foreground">{event.date.split(' ')[1]}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h4 className="text-[13px] font-bold text-foreground truncate group-hover:text-primary transition-colors">{event.title}</h4>
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{event.type}</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">{event.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Area (Right 1/3) */}
                    <div className="space-y-12">
                        {/* Announcements Section */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-[16px] font-bold text-foreground flex items-center gap-2">
                                    Announcements
                                </h2>
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[9px] font-bold rounded-sm uppercase tracking-wide">3 New</span>
                            </div>
                            <div className="h-px bg-border w-full mb-6" />

                            <div className="space-y-6">
                                {announcements.map((ann) => (
                                    <div key={ann.id} className="group cursor-pointer">
                                        <div className="flex items-center gap-2 mb-2">
                                            {ann.status === 'error' ? <Shield className="w-3 h-3 text-red-500" /> :
                                                ann.status === 'warning' ? <Settings className="w-3 h-3 text-orange-500" /> :
                                                    <Newspaper className="w-3 h-3 text-emerald-500" />}
                                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{ann.status}</span>
                                            <span className="text-[10px] text-muted-foreground/60">•</span>
                                            <span className="text-[10px] text-muted-foreground/60">{new Date(ann.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                        </div>
                                        <h3 className="text-[13px] font-bold text-foreground mb-1 group-hover:text-primary transition-colors leading-snug">
                                            {ann.title}
                                        </h3>
                                        <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
                                            {ann.body}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <button className="mt-8 w-full py-2 border border-border rounded-sm text-[12px] font-bold text-muted-foreground hover:bg-muted/50 transition-colors">
                                View all bulletins
                            </button>
                        </section>

                        {/* System Health / Status */}
                        <section className="p-6 bg-muted/30 border border-border rounded-sm">
                            <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
                                <Activity className="w-3 h-3 text-emerald-500" /> System Health
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Cloud Infrastructure', status: 'Operational' },
                                    { label: 'Internal Network', status: 'Operational' },
                                    { label: 'Workstation Node A', status: 'Degraded' },
                                ].map((sys, i) => (
                                    <div key={i} className="flex items-center justify-between text-[11px]">
                                        <span className="text-muted-foreground">{sys.label}</span>
                                        <span className={cn(
                                            "font-bold uppercase tracking-tight",
                                            sys.status === 'Operational' ? 'text-emerald-500' : 'text-orange-500'
                                        )}>{sys.status}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Quick Links */}
                        <section>
                            <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-foreground mb-4">Internal Tools</h3>
                            <div className="space-y-2">
                                {[
                                    { label: 'HR Portal', icon: ExternalLink },
                                    { label: 'IT Support Ticket', icon: ExternalLink },
                                    { label: 'Facility Booking', icon: ExternalLink },
                                    { label: 'Inventory Manager', icon: ArrowUpRight },
                                ].map((link, i) => (
                                    <a key={i} href="#" className="flex items-center justify-between p-2 rounded-sm hover:bg-muted/50 transition-colors group">
                                        <span className="text-[12px] text-muted-foreground group-hover:text-foreground">{link.label}</span>
                                        <link.icon className="w-3 h-3 text-muted-foreground/60 group-hover:text-primary" />
                                    </a>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Postman-style Bottom Section (Optional but fits theme) */}
                <div className="mt-20 p-8 border border-dashed border-border rounded-sm flex flex-col items-center justify-center text-center">
                    <Layout className="w-10 h-10 text-muted/20 mb-3" />
                    <p className="text-[12px] text-muted-foreground/60 font-medium max-w-xs">
                        Looking for something else? Try the global search or contact your system administrator.
                    </p>
                </div>

            </div>
        </div>
    );
};
