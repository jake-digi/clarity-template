
import { useState, useMemo, useEffect } from 'react';
import { getProjectById } from '@/data/mockData-old';
import { cn } from "@/lib/utils";

import { StarIcon } from '../shared/icons/PostmanIcons';
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    BarChart3, Layout, ListTodo, Calendar, ShoppingCart as OrdersIcon,
    ShieldCheck, AlertTriangle, MessageSquare, FileText, Timer,
    Plus, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, ArrowLeft,
    Play, Users, ChevronDown, Settings, Truck, ClipboardCheck, HardHat, Landmark, Bell
} from 'lucide-react';
import { TasksTable } from '../tables/TasksTable';
import { GanttChart } from '../shared/GanttChart';
import { OrdersTable } from '../tables/OrdersTable';
import { QualityTable } from '../tables/QualityTable';
import { RisksTable } from '../tables/RisksTable';
import { HSTable } from '../tables/HSTable';
import { PhasesTable } from '../tables/PhasesTable';
import { NewPhaseDialog } from './NewPhaseDialog';
import { Phase } from '@/data/mockData-old';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface ProjectDashboardProps {
    project: {
        id: string;
        name: string;
        activeSubTab?: string;
        selectedPhaseId?: string;
        selectedTaskId?: string;
        isStandalone?: boolean;
    };
}

export const ProjectDashboard = ({ project }: ProjectDashboardProps) => {
    const projectData = useMemo(() => getProjectById(project.id), [project.id]);
    const [activeSubTab, setActiveSubTab] = useState('Dashboard');
    const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
    const [activeSetting, setActiveSetting] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNewPhaseOpen, setIsNewPhaseOpen] = useState(false);
    const [phases, setPhases] = useState(projectData.phases);

    // Sync state with props from Index page
    useEffect(() => {
        if (project.activeSubTab) {
            setActiveSubTab(project.activeSubTab);
        }

        if (project.selectedPhaseId) {
            const phase = projectData.phases.find(p => p.name === project.selectedPhaseId);
            if (phase) setSelectedPhase(phase);
        } else if (project.activeSubTab === 'Phases') {
            // Keep current phase
        } else {
            setSelectedPhase(null);
        }
    }, [project.activeSubTab, project.selectedPhaseId, projectData]);

    // Update project data when project changes
    useEffect(() => {
        setPhases(projectData.phases);
        if (!project.activeSubTab) {
            setActiveSubTab('Dashboard');
            setSelectedPhase(null);
        }
    }, [projectData, project.activeSubTab]);

    const handleAddPhase = (newPhase: any) => {
        setPhases([...phases, { ...newPhase, lead: 'JB' }]);
    };

    const handleOpenSetting = (setting: string) => {
        setActiveSetting(setting);
        setIsSettingsOpen(true);
    };

    const tabs = [
        { name: 'Dashboard', icon: Layout },
        { name: 'Phases', icon: Play },
        { name: 'Tasks', icon: ListTodo },
        { name: 'Gantt Chart', icon: Calendar },
        { name: 'Orders', icon: OrdersIcon },
        { name: 'Quality', icon: ShieldCheck },
        { name: 'Health & Safety', icon: HardHat },
        { name: 'Risk', icon: AlertTriangle },
        { name: 'Project Log', icon: MessageSquare },
        { name: 'Document Register', icon: FileText },
        { name: 'Time Tracking', icon: Timer },
    ];

    const getProgressColor = (percent: number, inverted = false) => {
        if (inverted) {
            if (percent < 50) return 'bg-green-500';
            if (percent < 80) return 'bg-orange-500';
            return 'bg-red-500';
        }
        if (percent < 25) return 'bg-red-500';
        if (percent < 50) return 'bg-orange-500';
        if (percent < 85) return 'bg-blue-500';
        return 'bg-green-500';
    };

    const StatCard = ({ title, value, subValue, change, trend, icon: Icon, progress, inverted, onClick }: any) => (
        <div
            className={cn("bg-card p-4 rounded-none border border-border transition-colors", onClick && "cursor-pointer hover:border-primary/50")}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="p-1.5 bg-primary/10">
                    <Icon className="w-4 h-4 text-primary" />
                </div>
                {change && (
                    <div className={`flex items-center gap-1 text-[10px] font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {trend === 'up' ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                        {change}
                    </div>
                )}
            </div>
            <div className="space-y-1">
                <h3 className="text-[11px] text-muted-foreground font-semibold tracking-tight">{title}</h3>
                <p className="text-xl font-bold text-foreground leading-none">{value}</p>
                <p className="text-[10px] text-muted-foreground font-medium leading-none mt-1">{subValue}</p>
                {progress !== undefined && (
                    <div className="h-1 bg-accent mt-3 overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${getProgressColor(progress, inverted)}`} style={{ width: `${progress}%` }} />
                    </div>
                )}
            </div>
        </div>
    );

    const InfoRow = ({ label, value, subValue, color }: any) => (
        <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
            <span className="text-[11px] font-semibold text-muted-foreground tracking-tight">{label}</span>
            <div className="text-right">
                <span className={`text-[13px] font-semibold ${color || 'text-foreground'}`}>{value}</span>
                {subValue && <p className="text-[10px] text-muted-foreground font-medium">{subValue}</p>}
            </div>
        </div>
    );

    return (
        <div className="flex-1 bg-panel overflow-hidden flex flex-col">
            {/* Project Header with Breadcrumbs */}
            <div className="bg-card border-b border-border px-4 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    {selectedPhase ? (
                        <div className="flex flex-col gap-1">
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink
                                            className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                                            onClick={() => {
                                                setSelectedPhase(null);
                                                setActiveSubTab('Phases');
                                            }}
                                        >
                                            Phases
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="text-[11px] font-semibold text-foreground">
                                            {selectedPhase.name}
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                            <div className="flex items-center gap-3">
                                <h1 className="text-[20px] font-bold text-foreground tracking-tight">{selectedPhase.name}</h1>
                                <span className={`px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider ${selectedPhase.progress === 100 ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                    {selectedPhase.progress === 100 ? 'Completed' : 'In Progress'}
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium">
                                {project.name} <span className="text-border mx-1">|</span> Project Code: <span className="font-mono">{projectData.code}</span>
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
                                <span className="text-white font-bold text-xl">{projectData.name.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-[20px] font-bold text-foreground tracking-tight truncate">{projectData.name}</h1>
                                    <StarIcon className="w-4 h-4 text-amber-400 fill-amber-400" />
                                </div>
                                <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5 font-medium">
                                    Engineering Portfolio <span className="text-border">|</span> Project Code: <span className="font-mono">{projectData.code}</span>
                                </p>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[projectData.lead, projectData.tech].map((name, i) => (
                            <div key={i} className="w-8 h-8 rounded-none border-2 border-card bg-muted overflow-hidden relative group" title={name}>
                                <img src={`https://images.unsplash.com/photo-${i === 0 ? '1507003211169-0a1dd7228f2d' : '1500648767791-00dcc994a43e'}?w=100&h=100&fit=crop`} alt={name} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="h-8 px-4 bg-primary text-white text-[11px] font-bold rounded-none uppercase tracking-wider shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-1.5 outline-none">
                                <Plus className="w-3.5 h-3.5" />
                                Add Record
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-none border-border">
                            <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2">Create New</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="rounded-none py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground">
                                <ListTodo className="w-4 h-4 mr-2" />
                                <span className="text-[13px] font-medium">New Task</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsNewPhaseOpen(true)} className="rounded-none py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground">
                                <Play className="w-4 h-4 mr-2" />
                                <span className="text-[13px] font-medium">New Phase</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-none py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground">
                                <OrdersIcon className="w-4 h-4 mr-2" />
                                <span className="text-[13px] font-medium">New Order</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="rounded-none py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground text-destructive focus:text-destructive">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                <span className="text-[13px] font-medium">Raise Risk</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {!selectedPhase && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:bg-accent rounded-none transition-colors border border-border outline-none">
                                    <Settings className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-none border-border z-[100]">
                                <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground tracking-tight py-2 px-3">Project Settings</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem onClick={() => handleOpenSetting('General Settings')} className="rounded-none py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground">
                                    <Layout className="w-4 h-4 mr-2" />
                                    <span className="text-[13px] font-medium">General Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenSetting('Phase Structure')} className="rounded-none py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground">
                                    <Play className="w-4 h-4 mr-2" />
                                    <span className="text-[13px] font-medium">Phase Structure</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenSetting('Team Permissions')} className="rounded-none py-2 cursor-pointer focus:bg-primary focus:text-primary-foreground">
                                    <Users className="w-4 h-4 mr-2" />
                                    <span className="text-[13px] font-medium">Team Permissions</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* Sub Tabs Navigation */}
            <div className="bg-card border-b border-border px-4 shrink-0 overflow-x-auto">
                <div className="flex items-center gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => {
                                setActiveSubTab(tab.name);
                                if (tab.name !== 'Phases') setSelectedPhase(null);
                            }}
                            className={cn(
                                "py-3 px-3 text-sm whitespace-nowrap transition-all relative flex items-center gap-2 group",
                                activeSubTab === tab.name ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", activeSubTab === tab.name ? "text-primary" : "text-muted-foreground opacity-70 group-hover:opacity-100")} />
                            {tab.name}
                            {activeSubTab === tab.name && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 bg-muted/20 overflow-hidden flex flex-col",
            )}>
                <div className={cn(
                    "flex-1 w-full mx-auto flex flex-col min-h-0",
                    (activeSubTab === 'Tasks' || activeSubTab === 'Phases' || activeSubTab === 'Gantt Chart' || activeSubTab === 'Orders' || activeSubTab === 'Quality' || activeSubTab === 'Risk' || activeSubTab === 'Health & Safety')
                        ? "p-0 max-w-none"
                        : "p-6 max-w-[1600px] overflow-auto"
                )}>
                    {activeSubTab === 'Dashboard' && (
                        <div className="space-y-4">
                            {/* Phase Breakdown */}
                            <div className="bg-card border border-border p-5 rounded-none relative overflow-hidden">
                                <div className="flex justify-between items-start mb-5">
                                    <h3 className="font-bold text-[13px] text-foreground tracking-tight">Phase Breakdown <span className="text-primary">({projectData.overallProgress}%)</span></h3>
                                </div>
                                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                                    {phases.map((p, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                setSelectedPhase(p);
                                                setActiveSubTab('Phases');
                                            }}
                                            className="flex-1 min-w-[100px] h-24 bg-accent/30 border border-border relative group/phase overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                                        >
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 z-0 group-hover/phase:bg-accent/50 transition-colors">
                                                <span className="text-[9px] font-bold text-muted-foreground tracking-tight leading-tight mb-1">{p.name}</span>
                                                <span className="text-xs font-bold text-foreground">{p.progress}%</span>
                                            </div>
                                            {p.progress > 0 && (
                                                <div
                                                    className={cn("absolute bottom-0 left-0 right-0 transition-all duration-700 z-10", p.color)}
                                                    style={{ height: `${p.progress}%` }}
                                                >
                                                    <div className="absolute bottom-0 left-0 right-0 h-24 flex flex-col items-center justify-center p-2">
                                                        <span className="text-[9px] font-bold text-white leading-tight mb-1">{p.name}</span>
                                                        <span className="text-xs font-bold text-white">{p.progress}%</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Stat Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard title="Overall Progress" value={`${projectData.overallProgress}%`} subValue="Main Build Phase" icon={CheckCircle2} progress={projectData.overallProgress} onClick={() => setActiveSubTab('Phases')} />
                                <StatCard title="Tasks" value={projectData.stats.tasks.value} subValue={projectData.stats.tasks.subValue} icon={ListTodo} progress={projectData.stats.tasks.progress} onClick={() => setActiveSubTab('Tasks')} />
                                <StatCard title="Budget" value={projectData.stats.budget.value} subValue={projectData.stats.budget.subValue} icon={OrdersIcon} progress={projectData.stats.budget.progress} inverted onClick={() => setActiveSubTab('Orders')} />
                                <StatCard title="Time Tracking" value={projectData.stats.time.value} subValue={projectData.stats.time.subValue} icon={Clock} progress={projectData.stats.time.progress} onClick={() => setActiveSubTab('Time Tracking')} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-card rounded-none border border-border p-5">
                                    <h3 className="font-bold text-[13px] text-foreground mb-5 tracking-tight">Financial Summary</h3>
                                    <InfoRow label="Total Budget" value={projectData.financials.totalBudget} />
                                    <InfoRow label="Spent to Date" value={projectData.financials.spentToDate} color={projectData.financials.spentToDateColor} />
                                    <InfoRow label="Remaining" value={projectData.financials.remaining} color={projectData.financials.remainingColor} />
                                    <div className="pt-5">
                                        <div className="flex justify-between text-[11px] font-semibold mb-1.5">
                                            <span className="text-muted-foreground tracking-tight">Budget Utilization</span>
                                            <span className="text-foreground">{projectData.financials.budgetUtilization}%</span>
                                        </div>
                                        <div className="h-1.5 bg-accent overflow-hidden">
                                            <div className={cn("h-full transition-all duration-500", getProgressColor(projectData.financials.budgetUtilization, true))} style={{ width: `${projectData.financials.budgetUtilization}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-card rounded-none border border-border p-5">
                                    <h3 className="font-bold text-[13px] text-foreground mb-5 tracking-tight">Time Analysis</h3>
                                    <InfoRow label="Estimated Hours" value={projectData.timeTracking.estimatedHours} />
                                    <InfoRow label="Hours Logged" value={projectData.timeTracking.hoursLogged} subValue={projectData.timeTracking.hoursLoggedSub} color={projectData.timeTracking.hoursLoggedColor} />
                                    <InfoRow label="Remaining" value={projectData.timeTracking.remaining} color={projectData.timeTracking.remainingColor} />
                                    <div className="pt-5">
                                        <div className="flex justify-between text-[11px] font-semibold mb-1.5">
                                            <span className="text-muted-foreground tracking-tight">Burn Rate</span>
                                            <span className="text-foreground">{projectData.timeTracking.burnRate}%</span>
                                        </div>
                                        <div className="h-1.5 bg-accent overflow-hidden">
                                            <div className={cn("h-full transition-all duration-500", getProgressColor(projectData.timeTracking.burnRate))} style={{ width: `${projectData.timeTracking.burnRate}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 bg-card rounded-none border border-border p-5">
                                    <h3 className="font-bold text-[13px] text-foreground mb-5 tracking-tight">Recent Activity Feed</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-5">
                                        {projectData.recentActivity.map((activity, i) => (
                                            <div key={i} className="flex gap-3 items-start group">
                                                <div className="w-8 h-8 rounded-none bg-accent/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                                    <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-0.5">
                                                        <p className="text-xs font-bold text-foreground truncate">{activity.user} {activity.action}</p>
                                                        <span className="text-[10px] text-muted-foreground font-medium ml-2">{activity.time}</span>
                                                    </div>
                                                    {activity.detail && <p className="text-[11px] text-muted-foreground truncate italic font-medium">"{activity.detail}"</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'Phases' && (
                        <div className="flex-1 flex flex-col min-h-0 bg-background">
                            {!selectedPhase ? (
                                <PhasesTable
                                    phases={phases}
                                    onPhaseSelect={setSelectedPhase}
                                    onNewPhase={() => setIsNewPhaseOpen(true)}
                                />
                            ) : (
                                <div className="flex-1 overflow-auto p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-card border border-border p-5 rounded-none">
                                            <p className="text-[11px] font-semibold text-muted-foreground tracking-tight mb-3">Phase Progress</p>
                                            <span className="text-[28px] font-semibold text-primary leading-none tracking-tight">{selectedPhase.progress}%</span>
                                            <div className="h-1 bg-accent mt-5 overflow-hidden">
                                                <div className={cn("h-full", getProgressColor(selectedPhase.progress))} style={{ width: `${selectedPhase.progress}%` }} />
                                            </div>
                                        </div>

                                        {(() => {
                                            const phaseTasks = projectData.tasks.filter(t => t.phase === selectedPhase.name);
                                            const completed = phaseTasks.filter(t => t.completed).length;
                                            const estHours = phaseTasks.reduce((acc, t) => acc + t.estHours, 0);
                                            const loggedHours = phaseTasks.reduce((acc, t) => acc + t.loggedHours, 0);

                                            return (
                                                <>
                                                    <div className="bg-card border border-border p-5 rounded-none">
                                                        <p className="text-[11px] font-semibold text-muted-foreground tracking-tight mb-4">Tasks</p>
                                                        <span className="text-[28px] font-semibold text-foreground leading-none">{completed}/{phaseTasks.length}</span>
                                                    </div>
                                                    <div className="bg-card border border-border p-5 rounded-none">
                                                        <p className="text-[11px] font-semibold text-muted-foreground tracking-tight mb-4">Estimated Hours</p>
                                                        <span className="text-[28px] font-semibold text-foreground leading-none">{estHours}h</span>
                                                    </div>
                                                    <div className="bg-card border border-border p-5 rounded-none">
                                                        <p className="text-[11px] font-semibold text-muted-foreground tracking-tight mb-4">Logged Hours</p>
                                                        <span className="text-[28px] font-semibold text-foreground leading-none">{loggedHours}h</span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[13px] font-bold text-foreground tracking-tight">Phase Tasks</h3>
                                        <div className="border border-border">
                                            <TasksTable tasks={projectData.tasks.filter(t => t.phase === selectedPhase.name)} />
                                        </div>
                                    </div>

                                    <div className="space-y-4 pb-12">
                                        <h3 className="text-[13px] font-bold text-foreground tracking-tight">Quality & Risk Issues</h3>
                                        <div className="bg-card border border-border p-16 flex flex-col items-center justify-center text-center">
                                            <ShieldCheck className="w-12 h-12 text-[#ADADAD]/30 mb-4" />
                                            <p className="text-sm text-[#5C5C5C] font-medium italic">No quality issues recorded for this phase</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeSubTab === 'Tasks' && <TasksTable tasks={projectData.tasks} selectedTaskId={project.selectedTaskId} />}
                    {activeSubTab === 'Gantt Chart' && <div className="h-full w-full bg-background"><GanttChart /></div>}
                    {activeSubTab === 'Orders' && <div className="h-full w-full"><OrdersTable /></div>}
                    {activeSubTab === 'Quality' && <div className="h-full w-full"><QualityTable /></div>}
                    {activeSubTab === 'Health & Safety' && <div className="h-full w-full"><HSTable /></div>}
                    {activeSubTab === 'Risk' && <div className="h-full w-full"><RisksTable /></div>}
                </div>
            </div>

            <NewPhaseDialog open={isNewPhaseOpen} onOpenChange={setIsNewPhaseOpen} onAddPhase={handleAddPhase} />

            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <SheetContent className="w-[450px] sm:max-w-[550px] p-0 flex flex-col border-l border-border bg-card gap-0 shadow-2xl">
                    <SheetHeader className="p-6 pb-4 bg-muted/20 border-b border-border shrink-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Settings className="w-4 h-4 text-primary" />
                            <span className="text-[10px] text-muted-foreground font-semibold tracking-tight">Project Configuration</span>
                        </div>
                        <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                            {activeSetting}
                        </SheetTitle>
                    </SheetHeader>
                    {/* Settings content... */}
                </SheetContent>
            </Sheet>
        </div>
    );
};
