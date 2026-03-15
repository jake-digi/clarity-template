import { useState, useMemo } from 'react';
import {
    Layout,
    ChevronRight,
    MoreVertical,
    Activity,
    Calendar,
    Users,
    CheckCircle2,
    Circle,
    Info
} from 'lucide-react';
import { projects, activeProjectItems, completedProjectItems, PHASE_NAMES } from '@/data/mockData-old';
import { cn } from '@/lib/utils';

interface OverviewContentProps {
    onSelectProject?: (project: { id: string, name: string }) => void;
    onSelectPhase?: (projectId: string, phaseName: string) => void;
}

export const OverviewContent = ({ onSelectProject, onSelectPhase }: OverviewContentProps) => {
    const [activeSubTab, setActiveSubTab] = useState<'overview' | 'updates' | 'settings'>('overview');

    const allProjects = useMemo(() => {
        return [...activeProjectItems, ...completedProjectItems].map(item => projects[item.id]);
    }, []);

    const getProgressColor = (percent: number) => {
        if (percent === 100) return 'text-emerald-500';
        if (percent > 0) return 'text-blue-500';
        return 'text-muted-foreground/40';
    };

    const getPhaseBarColor = (percent: number) => {
        if (percent === 100) return 'bg-emerald-500';
        if (percent > 0) return 'bg-blue-500';
        return 'bg-accent';
    };

    return (
        <div className="flex-1 bg-panel overflow-auto flex flex-col">
            {/* Workspace header */}
            <div className="bg-card border-b border-border px-6 py-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
                            <Layout className="w-4 h-4 text-primary" />
                        </div>
                        <h1 className="text-lg font-medium text-foreground tracking-tight">Overview</h1>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Activity className="w-3 h-3" />
                            <span>Active: {activeProjectItems.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-border pl-4">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed: {completedProjectItems.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-card border-b border-border px-6 shrink-0">
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => setActiveSubTab('overview')}
                        className={cn(
                            "py-3 text-[11px] font-medium tracking-widest transition-all relative",
                            activeSubTab === 'overview'
                                ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveSubTab('updates')}
                        className={cn(
                            "py-3 text-[11px] font-medium tracking-widest transition-all relative",
                            activeSubTab === 'updates'
                                ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Updates
                    </button>
                    <button
                        onClick={() => setActiveSubTab('settings')}
                        className={cn(
                            "py-3 text-[11px] font-medium tracking-widest transition-all relative",
                            activeSubTab === 'settings'
                                ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Settings
                    </button>
                </div>
            </div>

            {/* Content area - Full Bleed Matrix View */}
            <div className="flex-1 overflow-hidden flex flex-col bg-card">
                {activeSubTab === 'overview' ? (
                    <div className="flex-1 flex flex-col overflow-hidden w-full">
                        {/* Matrix Header */}
                        <div className="flex bg-sidebar border-b border-border text-[10px] font-medium uppercase tracking-tight text-muted-foreground shrink-0 select-none">
                            <div className="w-[240px] p-3 border-r border-border shrink-0 flex items-center">Project Name</div>
                            <div className="w-[80px] p-3 border-r border-border text-center shrink-0 flex items-center justify-center">Overall</div>
                            <div className="flex-1 grid grid-cols-10">
                                {PHASE_NAMES.map((ph, i) => (
                                    <div
                                        key={i}
                                        className="p-3 border-r border-border last:border-r-0 flex items-center justify-center truncate text-[9px]"
                                        title={ph}
                                    >
                                        {ph.length > 5 ? ph.substring(0, 4) + '.' : ph}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Matrix Body - Fit to Height */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {allProjects.map((project) => (
                                <div key={project.id} className="flex-1 min-h-0 flex border-b border-border/50 hover:bg-accent/40 transition-colors group">
                                    {/* Project Info Cell */}
                                    <div
                                        onClick={() => onSelectProject?.({ id: project.id, name: project.name })}
                                        className="w-[240px] px-3 py-2 border-r border-border/50 shrink-0 flex flex-col justify-center min-w-0 cursor-pointer hover:bg-primary/5 transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-1.5 mb-0.5">
                                            <span className="text-[12px] font-medium text-foreground truncate group-hover:text-primary transition-colors">{project.name}</span>
                                            <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">{project.code}</span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground/60 truncate font-normal tracking-tight hover:text-primary transition-colors">
                                            {project.client}
                                        </div>
                                    </div>

                                    {/* Overall % Cell */}
                                    <div className="w-[80px] px-3 py-2 border-r border-border/50 shrink-0 flex items-center justify-center bg-accent/20">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[11px] font-medium text-foreground">{project.overallProgress}%</span>
                                            <div className="w-12 h-1 bg-border/50 overflow-hidden rounded-full">
                                                <div
                                                    className="h-full bg-primary transition-all duration-700"
                                                    style={{ width: `${project.overallProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Phase Breakdown Row */}
                                    <div className="flex-1 grid grid-cols-10 bg-border/10 gap-px">
                                        {project.phases.map((phase) => (
                                            <div
                                                key={phase.name}
                                                onClick={() => !phase.notApplicable && onSelectPhase?.(project.id, phase.name)}
                                                className={cn(
                                                    "relative group/phase h-full overflow-hidden transition-colors border-r border-border/10",
                                                    phase.notApplicable ? "bg-slate-200/60 cursor-not-allowed" : "bg-card/20 cursor-pointer"
                                                )}
                                                title={phase.notApplicable ? `${phase.name}: Not Required` : `${phase.name}: ${phase.progress}%`}
                                            >
                                                {/* Vertical Fill - Using project data color */}
                                                {!phase.notApplicable && phase.progress > 0 && (
                                                    <div
                                                        className={cn(
                                                            "absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-in-out opacity-90",
                                                            phase.color
                                                        )}
                                                        style={{ height: `${phase.progress}%` }}
                                                    />
                                                )}

                                                {/* Percentage Text Overlay */}
                                                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                                    <span className={cn(
                                                        "text-[10px] font-medium transition-colors duration-300",
                                                        phase.notApplicable ? "text-slate-500/80 font-bold italic" : (phase.progress > 0 ? "text-foreground font-bold" : "text-muted-foreground/20")
                                                    )}>
                                                        {phase.notApplicable ? "N/A" : (phase.progress > 0 ? `${phase.progress}%` : "")}
                                                    </span>
                                                </div>

                                                {phase.notApplicable && (
                                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 50%, currentColor 50%, currentColor 75%, transparent 75%, transparent)', backgroundSize: '4px 4px' }} />
                                                )}

                                                {!phase.notApplicable && <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/phase:opacity-100 transition-opacity z-20" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Footer */}
                        <div className="shrink-0 bg-sidebar border-t border-border px-4 py-3 flex items-center justify-between text-[11px] font-normal text-muted-foreground">
                            <div className="flex gap-8 items-center">
                                <span className="flex items-center gap-2">
                                    <span className="text-foreground font-medium">{activeProjectItems.length + completedProjectItems.length}</span> Total Projects
                                </span>
                                <span className="flex items-center gap-2">
                                    Average Completion: <span className="text-primary font-medium">{Math.round(allProjects.reduce((acc, p) => acc + p.overallProgress, 0) / allProjects.length)}%</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                                    <span>Complete</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-sm" />
                                    <span>Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground p-12">
                        <div className="flex flex-col items-center gap-3">
                            <Info className="w-8 h-8 opacity-20" />
                            <p className="text-sm font-normal text-muted-foreground">{activeSubTab} coming soon</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
