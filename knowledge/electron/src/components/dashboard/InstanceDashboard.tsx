
import { useState, useMemo, useEffect } from 'react';
import { cn } from "@/lib/utils";
import {
    Layout,
    Users,
    ShieldCheck,
    Boxes,
    Home,
    Bell,
    Wrench,
    Calendar,
    UserSquare2,
    Star,
    Plus,
    Settings,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    Clock,
    BarChart3,
    Map,
    History,
    Flag,
    MoreHorizontal,
    AlertTriangle,
    AlertCircle,
    Battery,
    Signal,
    Activity
} from 'lucide-react';
import trackData from '../../data/track.json';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StarIcon } from '../shared/icons/PostmanIcons';
import {
    mockStageStages,
    mockStageCompletions,
    mockSubgroups,
    mockAnnouncements,
    mockCases,
    getInstanceById
} from '@/data/mockData-old';
import { InstanceMap } from './InstanceMap';
import { ActivityLog } from './ActivityLog';
import { ParticipantsTable } from './ParticipantsTable';
import { CasesTable } from './CasesTable';
import { GroupsTable } from './GroupsTable';
import { AccommodationTable } from './AccommodationTable';
import { UsersTable } from './UsersTable';
import { Timetable } from './Timetable';
import { AnnouncementsTable } from './AnnouncementsTable';
import { StagesTable } from './StagesTable';
import { InstancesService } from '@/services/instances.service';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { InstanceWithDetails } from '@/types/database';
import { Edit2, Check, X as CloseIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface InstanceDashboardProps {
    instance: {
        id: string;
        name: string;
        activeSubTab?: string;
    };
}

export const InstanceDashboard = ({ instance }: InstanceDashboardProps) => {
    const [activeSubTab, setActiveSubTab] = useState('Dashboard');
    const [fullInstance, setFullInstance] = useState<InstanceWithDetails | null>(null);
    const [isLoadingInstance, setIsLoadingInstance] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [stageTemplates, setStageTemplates] = useState<any[]>([]);
    const [stageProgress, setStageProgress] = useState<Record<string, number>>({});
    const queryClient = useQueryClient();

    // Use shared mock lookup for supplemental data (tracks, etc)
    const instanceData = useMemo(() => getInstanceById(instance.id), [instance.id]);
    const isDofe = fullInstance?.settings?.type === 'dofe' || fullInstance?.settings?.isDofe || instanceData?.isDofe;

    // Fetch real data from Supabase
    const fetchInstance = async () => {
        setIsLoadingInstance(true);
        try {
            const data = await InstancesService.getById(instance.id);
            setFullInstance(data);
            setEditedName(data?.name || instance.name);

            // Fetch stage templates separately
            const { data: stages } = await supabase
                .from('stage_templates')
                .select('*')
                .eq('instance_id', instance.id)
                .order('stage_number');

            if (stages) {
                setStageTemplates(stages);

                const templateIds = stages.map(s => s.id);

                // Fetch stage progress for each stage
                const { data: progressData } = await supabase
                    .from('group_stage_progress')
                    .select('stage_template_id, status')
                    .in('stage_template_id', templateIds);

                if (progressData) {
                    // Count completed stages per template
                    const completionCounts: Record<string, number> = {};
                    progressData.forEach((progress: any) => {
                        if (progress.status === 'completed' || progress.status === 'ready') {
                            completionCounts[progress.stage_template_id] = (completionCounts[progress.stage_template_id] || 0) + 1;
                        }
                    });
                    setStageProgress(completionCounts);
                }
            }
        } catch (err) {
            console.error('Failed to fetch instance details:', err);
            toast.error('Could not load instance details');
        } finally {
            setIsLoadingInstance(false);
        }
    };

    useEffect(() => {
        fetchInstance();
    }, [instance.id]);

    useEffect(() => {
        if (instance.activeSubTab) {
            setActiveSubTab(instance.activeSubTab);
        }
    }, [instance.activeSubTab]);

    const handleRename = async () => {
        if (!editedName.trim() || editedName === fullInstance?.name) {
            setIsEditingName(false);
            setEditedName(fullInstance?.name || instance.name);
            return;
        }

        try {
            await InstancesService.update(instance.id, { name: editedName.trim() });
            toast.success('Instance renamed successfully');
            setFullInstance(prev => prev ? { ...prev, name: editedName.trim() } : null);
            setIsEditingName(false);

            // Invalidate sidebar and other relevant queries
            queryClient.invalidateQueries({ queryKey: ['instances'] });
        } catch (err) {
            console.error('Failed to rename instance:', err);
            toast.error('Failed to rename instance');
            setEditedName(fullInstance?.name || instance.name);
        }
    };

    const handleGoLive = async () => {
        try {
            await InstancesService.update(instance.id, { status: 'active' });
            toast.success('Instance is now LIVE!');

            // Refresh local state
            setFullInstance(prev => prev ? { ...prev, status: 'active' } : null);

            // Invalidate sidebar query
            queryClient.invalidateQueries({ queryKey: ['instances'] });
        } catch (err) {
            console.error('Failed to go live:', err);
            toast.error('Failed to change status');
        }
    };

    const handleUpdateSettings = (newSettings: any) => {
        setFullInstance(prev => prev ? { ...prev, settings: newSettings } : null);
    };

    const tabs = useMemo(() => {
        const baseTabs = [
            { name: 'Dashboard', icon: Layout },
            ...(isDofe ? [{ name: 'Stages', icon: Flag }] : []),
            { name: 'Participants', icon: Users },
            { name: 'Cases', icon: ShieldCheck },
            { name: 'Groups', icon: Boxes },
            { name: 'Accommodation', icon: Home },
            { name: 'Announcements', icon: Bell },
            { name: 'Maintenance', icon: Wrench },
            { name: 'Timetable', icon: Calendar },
            { name: 'Users', icon: UserSquare2 },
        ];

        if (isDofe) {
            // Insert Map after Dashboard (index 0)
            // Insert Activity Log after Map
            const newTabs = [...baseTabs];
            newTabs.splice(1, 0,
                { name: 'Map', icon: Map },
                { name: 'Activity Log', icon: History }
            );
            return newTabs;
        }

        return baseTabs;
    }, [isDofe]);

    const StatCard = ({ title, value, subValue, change, trend, icon: Icon, progress, onClick }: any) => (
        <div
            className={cn("bg-card p-4 rounded-none border border-border transition-colors", onClick && "cursor-pointer hover:border-primary/50")}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="p-1.5 bg-primary/10">
                    <Icon className="w-4 h-4 text-primary" />
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground tracking-wider">{title}</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{value}</h3>
                <p className="text-[10px] text-muted-foreground font-medium mt-1">{subValue}</p>
            </div>
        </div>
    );

    return (
        <div className="flex-1 bg-panel overflow-hidden flex flex-col">
            {/* Instance Header */}
            <div className="bg-card border-b border-border px-4 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-xl">{instance.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 group">
                            {isEditingName ? (
                                <div className="flex items-center gap-2 flex-1 max-w-md">
                                    <input
                                        autoFocus
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleRename();
                                            if (e.key === 'Escape') {
                                                setIsEditingName(false);
                                                setEditedName(fullInstance?.name || instance.name);
                                            }
                                        }}
                                        className="bg-muted px-2 py-0.5 text-[20px] font-bold text-foreground tracking-tight outline-none focus:ring-1 focus:ring-primary/30 w-full"
                                    />
                                    <button onClick={handleRename} className="p-1 hover:bg-green-500/10 text-green-500 rounded transition-colors">
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditingName(false);
                                            setEditedName(fullInstance?.name || instance.name);
                                        }}
                                        className="p-1 hover:bg-red-500/10 text-red-500 rounded transition-colors"
                                    >
                                        <CloseIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h1
                                        className="text-[20px] font-bold text-foreground tracking-tight truncate cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                                        onClick={() => setIsEditingName(true)}
                                    >
                                        {fullInstance?.name || instance.name}
                                        <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                                    </h1>
                                    <StarIcon className="w-4 h-4 text-amber-400 fill-amber-400" />
                                </>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5 font-medium uppercase tracking-wider">
                            Instance Management <span className="text-border">|</span>
                            ID: <span className="font-mono">{instance.id}</span>
                            <span className="text-border">|</span>
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-sm font-black text-[9px]",
                                fullInstance?.status === 'active' ? "bg-green-500/10 text-green-600" :
                                    fullInstance?.status === 'draft' ? "bg-amber-500/10 text-amber-600" :
                                        "bg-muted text-muted-foreground"
                            )}>
                                {fullInstance?.status || 'Loading...'}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {fullInstance?.status === 'draft' && (
                        <button
                            onClick={handleGoLive}
                            className="h-8 px-4 bg-green-600 text-white text-[11px] font-bold rounded-none tracking-wider shadow-sm hover:bg-green-700 transition-colors flex items-center gap-1.5 outline-none border border-green-700/50"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ACTIVATE INSTANCE
                        </button>
                    )}
                    <button className="h-8 px-4 bg-primary text-white text-[11px] font-bold rounded-none tracking-wider shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-1.5 outline-none">
                        <Plus className="w-3.5 h-3.5" />
                        Action
                    </button>
                    <button className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:bg-accent rounded-none transition-colors border border-border outline-none">
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Sub Tabs Navigation */}
            <div className="bg-card border-b border-border px-4 shrink-0 overflow-x-auto">
                <div className="flex items-center gap-1">
                    {tabs.slice(0, 7).map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveSubTab(tab.name)}
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

                    {tabs.length > 7 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        "py-3 px-3 text-sm whitespace-nowrap transition-all relative flex items-center gap-2 group",
                                        tabs.slice(7).some(t => t.name === activeSubTab) ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                    More
                                    {tabs.slice(7).some(t => t.name === activeSubTab) && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {tabs.slice(7).map((tab) => (
                                    <DropdownMenuItem
                                        key={tab.name}
                                        onClick={() => setActiveSubTab(tab.name)}
                                        className={cn(
                                            "flex items-center gap-2 cursor-pointer py-2",
                                            activeSubTab === tab.name ? "text-primary font-bold bg-primary/5" : "text-foreground font-medium"
                                        )}
                                    >
                                        <tab.icon className={cn("w-4 h-4", activeSubTab === tab.name ? "text-primary" : "text-muted-foreground")} />
                                        <span className="text-xs">{tab.name}</span>
                                        {activeSubTab === tab.name && <div className="ml-auto w-1 h-1 rounded-full bg-primary" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 bg-muted/20 flex flex-col",
                (activeSubTab === 'Map' || activeSubTab === 'Activity Log' || activeSubTab === 'Participants' || activeSubTab === 'Cases' || activeSubTab === 'Groups' || activeSubTab === 'Accommodation' || activeSubTab === 'Users' || activeSubTab === 'Timetable' || activeSubTab === 'Announcements' || activeSubTab === 'Stages') ? "p-0 overflow-hidden" : "p-6 overflow-y-auto"
            )}>
                <div className={cn(
                    "flex-1 w-full mx-auto flex flex-col min-h-0",
                    (activeSubTab === 'Map' || activeSubTab === 'Activity Log' || activeSubTab === 'Participants' || activeSubTab === 'Cases' || activeSubTab === 'Groups' || activeSubTab === 'Accommodation' || activeSubTab === 'Users' || activeSubTab === 'Timetable' || activeSubTab === 'Announcements' || activeSubTab === 'Stages') ? "p-0 max-w-none" : "max-w-[1600px] space-y-6"
                )}>
                    {activeSubTab === 'Dashboard' ? (
                        <div className="space-y-6">
                            {/* Operational Stats - Real Data */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    title="Participants"
                                    value={fullInstance?.subgroups?.reduce((sum, sg: any) => sum + (sg.memberCount || 0), 0) || 0}
                                    subValue={`${fullInstance?.supergroups?.length || 0} groups total`}
                                    icon={Users}
                                />
                                <StatCard
                                    title="Trackers Assigned"
                                    value={`${Object.keys(fullInstance?.settings?.tracker_associations || {}).length || 0}/${(fullInstance?.settings?.assigned_trackers as string[] || []).length || 0}`}
                                    subValue="Units configured"
                                    icon={Map}
                                />
                                <StatCard
                                    title="Stages Active"
                                    value={stageTemplates.length}
                                    subValue="Checkpoints configured"
                                    icon={CheckCircle2}
                                />
                                <StatCard
                                    title="Status"
                                    value={fullInstance?.status === 'active' ? 'LIVE' : 'SETUP'}
                                    subValue={fullInstance?.status === 'active' ? 'Operations active' : 'In preparation'}
                                    icon={Activity}
                                    className={fullInstance?.status === 'active' ? "border-green-500 bg-green-50/5" : "border-blue-500 bg-blue-50/5"}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Side: Map & Progress */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Stage Progress - Real Data */}
                                    <div className="bg-card border border-border overflow-hidden">
                                        <div className="p-4 border-b border-border bg-muted/5 flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-foreground">Stage Progress</h3>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                {fullInstance?.subgroups?.length || 0} Subgroups
                                            </span>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            {stageTemplates && stageTemplates.length > 0 ? (
                                                stageTemplates.map((stage, index) => {
                                                    // Calculate progress based on actual stage_progress records
                                                    const totalGroups = fullInstance?.subgroups?.length || 0;
                                                    const completedCount = stageProgress[stage.id] || 0;
                                                    const progress = totalGroups > 0 ? (completedCount / totalGroups) * 100 : 0;

                                                    return (
                                                        <div key={stage.id} className="space-y-1.5">
                                                            <div className="flex justify-between items-center text-[11px] font-bold">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-primary tracking-tighter">S{stage.stage_number || index + 1}</span>
                                                                    <span className="text-foreground uppercase tracking-tight">{stage.title}</span>
                                                                </div>
                                                                <span className="text-muted-foreground">{completedCount}/{totalGroups} Units</span>
                                                            </div>
                                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn(
                                                                        "h-full transition-all duration-1000",
                                                                        progress === 100 ? "bg-green-500" : "bg-primary"
                                                                    )}
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="p-8 text-center opacity-30">
                                                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                                    <p className="text-[10px] font-bold uppercase">No stages configured</p>
                                                    <p className="text-[9px] text-muted-foreground mt-1">Go to Stages tab to set up checkpoints</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Alerts & Feed */}
                                <div className="space-y-6">
                                    {/* Critical Alerts - Empty State */}
                                    <div className="bg-card border border-border shadow-sm">
                                        <div className="p-4 border-b border-border bg-muted/5 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                            <h3 className="text-sm font-semibold text-foreground">Operational Alerts</h3>
                                        </div>
                                        <div className="p-8 text-center opacity-30">
                                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                                            <p className="text-[10px] font-bold uppercase">All Clear</p>
                                            <p className="text-[9px] text-muted-foreground mt-1">No incidents reported</p>
                                        </div>
                                    </div>

                                    {/* Tracker Status - Real Data */}
                                    <div className="bg-card border border-border">
                                        <div className="p-4 border-b border-border bg-muted/5 flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">Tracker Status</h3>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            {(() => {
                                                const assignedTrackerIds = (fullInstance?.settings?.assigned_trackers || []) as string[];
                                                const assignedDevices = trackData.DeviceList.filter((d: any) =>
                                                    assignedTrackerIds.includes(d.Device)
                                                );

                                                if (assignedDevices.length === 0) {
                                                    return (
                                                        <div className="p-8 text-center opacity-30">
                                                            <Map className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                                            <p className="text-[10px] font-bold uppercase">No Trackers Assigned</p>
                                                            <p className="text-[9px] text-muted-foreground mt-1">Go to Map tab to configure trackers</p>
                                                        </div>
                                                    );
                                                }

                                                return assignedDevices.slice(0, 6).map((device: any, i: number) => {
                                                    const battery = 100 - (i * 7);
                                                    const isLow = battery < 20;
                                                    const association = fullInstance?.settings?.tracker_associations?.[device.Device];

                                                    return (
                                                        <div key={device.Device} className="flex items-center justify-between p-2 hover:bg-muted/30 transition-colors">
                                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-green-500" />
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-[11px] font-bold text-foreground truncate">
                                                                        {association?.name || device.Device_desc}
                                                                    </span>
                                                                    {association && (
                                                                        <span className="text-[9px] text-muted-foreground truncate">
                                                                            {device.Device_desc}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                <div className="flex items-center gap-1">
                                                                    <Signal className="w-3 h-3 text-green-600" />
                                                                    <span className="text-[9px] font-bold text-muted-foreground italic">Good</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Battery className={cn("w-3 h-3", isLow ? "text-red-500" : "text-green-600")} />
                                                                    <span className={cn("text-[9px] font-bold", isLow ? "text-red-600" : "text-foreground")}>{battery}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>

                                    {/* Recent Activity - Empty State */}
                                    <div className="bg-card border border-border overflow-hidden">
                                        <div className="p-4 border-b border-border bg-muted/5 flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-foreground">Activity Log</h3>
                                        </div>
                                        <div className="p-8 text-center opacity-30 h-[200px] flex flex-col items-center justify-center">
                                            <History className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                            <p className="text-[10px] font-bold uppercase">No Activity</p>
                                            <p className="text-[9px] text-muted-foreground mt-1">Events will appear here</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeSubTab === 'Stages' ? (
                        <StagesTable instance={fullInstance || undefined} />
                    ) : activeSubTab === 'Participants' ? (
                        <ParticipantsTable instanceId={instance.id} />
                    ) : activeSubTab === 'Cases' ? (
                        <CasesTable />
                    ) : activeSubTab === 'Groups' ? (
                        <GroupsTable instance={fullInstance || undefined} onUpdateSettings={handleUpdateSettings} onRefresh={fetchInstance} />
                    ) : activeSubTab === 'Accommodation' ? (
                        <AccommodationTable />
                    ) : activeSubTab === 'Users' ? (
                        <UsersTable instanceId={instance.id} />
                    ) : activeSubTab === 'Timetable' ? (
                        <Timetable />
                    ) : activeSubTab === 'Announcements' ? (
                        <AnnouncementsTable />
                    ) : activeSubTab === 'Map' ? (
                        fullInstance && <InstanceMap instance={fullInstance} onUpdateSettings={handleUpdateSettings} />
                    ) : activeSubTab === 'Activity Log' ? (
                        <ActivityLog />
                    ) : (
                        <div className="bg-card border border-border p-16 flex flex-col items-center justify-center text-center">
                            <div className="p-4 bg-muted/30 rounded-full mb-4">
                                {tabs.find(t => t.name === activeSubTab)?.icon && (
                                    <div className="w-12 h-12 text-muted-foreground/30">
                                        {(() => {
                                            const Icon = tabs.find(t => t.name === activeSubTab)?.icon;
                                            return Icon ? <Icon className="w-full h-full" /> : null;
                                        })()}
                                    </div>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">{activeSubTab}</h3>
                            <p className="text-sm text-muted-foreground max-w-xs font-medium">
                                The {activeSubTab.toLowerCase()} module is being prepared for this instance.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};
