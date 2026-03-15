import { useState, useEffect, useMemo } from 'react';
import {
    Save, CheckCircle2, Layout, Boxes, Users, Settings, Plus, FileText,
    Calendar, Trash2, ListTodo, Box, Factory, Zap, Shield, Target,
    Cpu, Truck, HardHat, Construction, Database, Globe, Briefcase,
    Ship, Plane, Hammer, Wrench, Microscope, FlaskConical,
    Activity, BarChart3, PieChart, TrendingUp, Presentation,
    Cloud, Server, Terminal, Lock, Key, Eye, Search, Layers,
    Award, UserPlus, UserCheck, X, UserCircle
} from 'lucide-react';
import { ChevronDownIcon } from '../shared/icons/PostmanIcons';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { UsersService } from '@/services/users.service';
import { ParticipantsService } from '@/services/participants.service';
import { InstancesService } from '@/services/instances.service';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import type { User as DBUser, Participant } from '@/types/database';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/DataTable";
import {
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { useQueryClient } from '@tanstack/react-query';

interface InstanceDetails {
    name: string;
    code: string;
    type: 'Standard' | 'DofE';
    status: 'Draft' | 'Active' | 'Completed';
    startDate: string;
    endDate: string;
    location: string;
    capacity: string;
    description: string;
    icon: string;
    level?: 'Bronze' | 'Silver' | 'Gold';
    expeditionType?: 'Walking' | 'Canoeing' | 'Cycling';
}

const INSTANCE_ICONS = [
    { name: 'Standard', icon: Box },
    { name: 'DofE', icon: Award },
    { name: 'Camp', icon: Construction },
    { name: 'Training', icon: Presentation },
    { name: 'Event', icon: Calendar },
    { name: 'Global', icon: Globe },
];

interface NewInstanceFormProps {
    closeRequestTabId?: string | null;
    onCancelClose?: () => void;
    onForceClose?: (id: string) => void;
    onDirtyChange?: (dirty: boolean) => void;
}

export const NewInstanceForm = ({
    closeRequestTabId,
    onCancelClose,
    onForceClose,
    onDirtyChange
}: NewInstanceFormProps) => {
    const [details, setDetails] = useState<InstanceDetails>({
        name: '',
        code: `INS-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
        type: 'Standard',
        status: 'Draft',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        location: '',
        capacity: '',
        description: '',
        icon: 'Standard',
        level: 'Bronze',
        expeditionType: 'Walking'
    });

    const [activeTab, setActiveTab] = useState<'details' | 'staffing' | 'participants'>('details');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    // Creation Status
    const [creationStatus, setCreationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Get Auth Context for tenant_id
    const { user: authUser } = useAuth();
    const queryClient = useQueryClient();

    // Data Selection State
    const [allUsers, setAllUsers] = useState<DBUser[]>([]);
    const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
    const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
    const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set());
    const [staffSearch, setStaffSearch] = useState('');
    const [participantSearch, setParticipantSearch] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Filter State
    const [staffFilters, setStaffFilters] = useState({
        status: new Set<string>(),
        role: new Set<string>()
    });
    const [participantFilters, setParticipantFilters] = useState({
        status: new Set<string>(),
        year: new Set<string>()
    });

    const effectiveTenantId = authUser?.tenant_id;


    // Load Users and Participants
    useEffect(() => {
        const loadData = async () => {
            setIsLoadingData(true);
            try {
                const [users, participants] = await Promise.all([
                    UsersService.getAll(),
                    ParticipantsService.getAll({}) // Fetch globally
                ]);
                setAllUsers(users);
                setAllParticipants(participants);
            } catch (err) {
                console.error("Failed to load staffing/participant data:", err);
            } finally {
                setIsLoadingData(false);
            }
        };
        loadData();
    }, []);

    const filteredStaff = useMemo(() => {
        let result = allUsers;

        // Search filter
        if (staffSearch) {
            const search = staffSearch.toLowerCase();
            result = result.filter(u =>
                u.first_name.toLowerCase().includes(search) ||
                u.surname?.toLowerCase().includes(search) ||
                u.email.toLowerCase().includes(search)
            );
        }

        // Status filter
        if (staffFilters.status.size > 0) {
            result = result.filter(u => staffFilters.status.has(u.status || 'Active'));
        }

        return result;
    }, [allUsers, staffSearch, staffFilters]);

    const filteredParticipants = useMemo(() => {
        let result = allParticipants;

        // Search filter
        if (participantSearch) {
            const search = participantSearch.toLowerCase();
            result = result.filter(p =>
                p.full_name.toLowerCase().includes(search) ||
                p.id.toLowerCase().includes(search)
            );
        }

        // Status filter
        if (participantFilters.status.size > 0) {
            result = result.filter(p => participantFilters.status.has(p.status || 'Active'));
        }

        // Year filter
        if (participantFilters.year.size > 0) {
            result = result.filter(p => participantFilters.year.has(p.school_year || 'N/A'));
        }

        return result;
    }, [allParticipants, participantSearch, participantFilters]);

    // Initial state to compare for changes
    const isDirty = details.name !== '' ||
        details.description !== '' ||
        details.location !== '' ||
        selectedStaffIds.size > 0 ||
        selectedParticipantIds.size > 0;

    useEffect(() => {
        onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    // Handle external close request
    useEffect(() => {
        if (closeRequestTabId === 'new-instance') {
            setShowCloseConfirm(true);
        }
    }, [closeRequestTabId]);

    const handleInputChange = (field: keyof InstanceDetails, value: string) => {
        setDetails(prev => ({ ...prev, [field]: value }));
    };

    const toggleStaff = (id: string) => {
        const next = new Set(selectedStaffIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedStaffIds(next);
    };

    const toggleParticipant = (id: string) => {
        const next = new Set(selectedParticipantIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedParticipantIds(next);
    };

    const handleCreate = async () => {
        console.log('DEBUG: handleCreate triggered');
        console.log('DEBUG: details.name:', details.name);
        console.log('DEBUG: effectiveTenantId:', effectiveTenantId);

        if (!details.name || !effectiveTenantId) {
            let msg = "Please enter an instance name.";
            if (!effectiveTenantId) msg = "Error: No active organization (tenant) found for your profile.";
            if (!details.name && !effectiveTenantId) msg = "Instance name and active organization are required.";

            setErrorMessage(msg);
            setCreationStatus('error');
            return;
        }

        setCreationStatus('loading');
        setErrorMessage(null);

        try {
            // 1. Create the instance
            const newInstance = await InstancesService.create({
                id: details.code, // Manually provide ID as per schema
                tenant_id: effectiveTenantId,
                name: details.name,
                description: details.description || null,
                status: details.status.toLowerCase(),
                start_date: details.startDate || null,
                end_date: details.endDate || null,
                location: details.location || null,
                owner_id: authUser?.id || null,
                settings: {
                    type: details.type.toLowerCase(),
                    level: details.level,
                    expeditionType: details.expeditionType,
                    code: details.code,
                    capacity: details.capacity
                }
            });

            // 2. Assign staff if any selected
            if (selectedStaffIds.size > 0) {
                await UsersService.assignMultipleToInstance(
                    Array.from(selectedStaffIds),
                    newInstance.id
                );
            }

            // 3. Assign participants if any selected
            if (selectedParticipantIds.size > 0) {
                await ParticipantsService.assignMultipleToInstance(
                    Array.from(selectedParticipantIds),
                    newInstance.id
                );
            }

            // Invalidate queries to refresh sidebar
            queryClient.invalidateQueries({ queryKey: ['instances'] });

            setCreationStatus('success');

            // Optional: Close tab and switch to the new instance after a delay
            setTimeout(() => {
                onForceClose?.('new-instance');
            }, 2000);

        } catch (err: any) {
            console.error("Failed to create instance:", err);
            setErrorMessage(err.message || "An unexpected error occurred while creating the instance.");
            setCreationStatus('error');
        }
    };

    return (
        <div className="flex-1 bg-background flex flex-col overflow-hidden text-foreground">
            {/* Header */}
            <div className="bg-card border-b border-border px-4 h-[52px] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-primary/10 flex items-center justify-center text-primary rounded-sm border border-primary/30 shadow-sm">
                        {(() => {
                            const IconObj = INSTANCE_ICONS.find(i => i.name === details.icon)?.icon || Box;
                            return <IconObj className="w-5 h-5" />;
                        })()}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-[18px] font-bold tracking-tight">
                                {details.name || "Untitled Instance"}
                            </h1>
                            <Badge className="rounded-sm bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/30 text-[10px] font-bold px-1.5 py-0 h-4 uppercase translate-y-[1px]">
                                {details.status}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (isDirty) setShowCloseConfirm(true);
                            else onForceClose?.('new-instance');
                        }}
                        className="h-8 px-3 text-[13px] font-medium text-muted-foreground hover:bg-muted rounded-sm transition-all flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Discard
                    </button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <button
                        onClick={handleCreate}
                        disabled={!details.name || creationStatus === 'loading'}
                        className="h-8 px-4 bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 rounded-sm transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {creationStatus === 'loading' ? (
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {creationStatus === 'loading' ? 'Creating...' : 'Create Instance'}
                    </button>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="bg-card border-b border-border flex items-center justify-between px-4 h-10 shrink-0">
                <div className="flex h-full">
                    {[
                        { id: 'details', label: 'Details', icon: FileText },
                        { id: 'staffing', label: 'Staffing', icon: UserCircle, count: selectedStaffIds.size },
                        { id: 'participants', label: 'Participants', icon: Users, count: selectedParticipantIds.size },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "px-4 h-full text-[12px] font-medium transition-all flex items-center gap-2 relative",
                                activeTab === tab.id
                                    ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="ml-1 bg-primary text-primary-foreground text-[9px] px-1 rounded-full min-w-[14px]">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4 text-[12px] font-medium text-muted-foreground pr-2 font-mono">
                    <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Ref: {details.code}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-background p-6">
                <div className="w-full max-w-full mx-auto">
                    {activeTab === 'details' && (
                        <div className="flex flex-col space-y-12 animate-in fade-in duration-300">
                            {/* Instance Type Selection */}
                            <div className="grid grid-cols-2 gap-6">
                                <div
                                    className={cn(
                                        "p-6 border rounded-lg cursor-pointer transition-all flex items-center gap-4 group",
                                        details.type === 'Standard' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:bg-muted/50"
                                    )}
                                    onClick={() => handleInputChange('type', 'Standard')}
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-100/50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Box className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">Standard Instance</h3>
                                        <p className="text-xs text-muted-foreground mt-1 text-balance">General purpose camp, event, or trip configuration.</p>
                                    </div>
                                    {details.type === 'Standard' && <CheckCircle2 className="ml-auto w-5 h-5 text-primary" />}
                                </div>
                                <div
                                    className={cn(
                                        "p-6 border rounded-lg cursor-pointer transition-all flex items-center gap-4 group",
                                        details.type === 'DofE' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:bg-muted/50"
                                    )}
                                    onClick={() => handleInputChange('type', 'DofE')}
                                >
                                    <div className="w-12 h-12 rounded-full bg-amber-100/50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Award className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">DofE Expedition</h3>
                                        <p className="text-xs text-muted-foreground mt-1 text-balance">Specialized configuration for Duke of Edinburgh awards.</p>
                                    </div>
                                    {details.type === 'DofE' && <CheckCircle2 className="ml-auto w-5 h-5 text-primary" />}
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-8">
                                <div className="col-span-8 space-y-8">
                                    <div className="space-y-6">
                                        <h3 className="text-[20px] font-bold text-foreground tracking-tight border-b border-border pb-4">Primary Configuration</h3>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2 col-span-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Instance Name</label>
                                                    <span className="text-[9px] text-primary font-bold uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded-sm">Required</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Summer Camp 2026 - Week 1"
                                                    value={details.name}
                                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                                    className="w-full h-10 bg-card border border-border rounded-md px-3 text-[14px] font-medium text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/40"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Location</label>
                                                <div className="relative">
                                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Gilwell Park"
                                                        value={details.location}
                                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                                        className="w-full h-10 bg-card border border-border rounded-md pl-10 pr-3 text-[14px] font-medium text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Capacity</label>
                                                <div className="relative">
                                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                                    <input
                                                        type="number"
                                                        placeholder="200"
                                                        value={details.capacity}
                                                        onChange={(e) => handleInputChange('capacity', e.target.value)}
                                                        className="w-full h-10 bg-card border border-border rounded-md pl-10 pr-3 text-[14px] font-medium text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {details.type === 'DofE' && (
                                            <div className="grid grid-cols-2 gap-6 p-6 bg-amber-500/5 border border-amber-500/20 rounded-lg animate-in slide-in-from-top-4 duration-300">
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">Award Level</label>
                                                    <div className="relative">
                                                        <select
                                                            value={details.level}
                                                            onChange={(e) => handleInputChange('level', e.target.value as any)}
                                                            className="w-full h-10 bg-card border border-amber-500/30 rounded-md px-3 text-[14px] font-medium text-foreground focus:border-amber-500 outline-none appearance-none"
                                                        >
                                                            <option>Bronze</option>
                                                            <option>Silver</option>
                                                            <option>Gold</option>
                                                        </select>
                                                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-500 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">Expedition Type</label>
                                                    <div className="relative">
                                                        <select
                                                            value={details.expeditionType}
                                                            onChange={(e) => handleInputChange('expeditionType', e.target.value as any)}
                                                            className="w-full h-10 bg-card border border-amber-500/30 rounded-md px-3 text-[14px] font-medium text-foreground focus:border-amber-500 outline-none appearance-none"
                                                        >
                                                            <option>Walking</option>
                                                            <option>Canoeing</option>
                                                            <option>Cycling</option>
                                                        </select>
                                                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-500 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground uppercase">Description / Purpose</label>
                                            <textarea
                                                rows={6}
                                                placeholder="What is the main goal of this instance? What should attendees know?"
                                                value={details.description}
                                                onChange={(e) => handleInputChange('description', e.target.value)}
                                                className="w-full bg-card border border-border rounded-md p-4 text-[14px] font-medium text-foreground leading-relaxed focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder:text-muted-foreground/40"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-4 space-y-6">
                                    <div className="bg-muted/30 border border-border rounded-lg overflow-hidden shadow-sm">
                                        <div className="bg-muted/50 px-4 py-3 border-b border-border">
                                            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider">Date Timeline</h4>
                                        </div>
                                        <div className="p-5 space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Start Date</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                                    <input
                                                        type="date"
                                                        value={details.startDate}
                                                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                                                        className="w-full h-10 bg-card border border-border rounded-md pl-10 pr-3 text-[14px] font-medium text-foreground focus:border-primary outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">End Date</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                                    <input
                                                        type="date"
                                                        value={details.endDate}
                                                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                                                        className="w-full h-10 bg-card border border-border rounded-md pl-10 pr-3 text-[14px] font-medium text-foreground focus:border-primary outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'staffing' && (
                        <StaffingDirectoryTab
                            data={filteredStaff}
                            selectedIds={selectedStaffIds}
                            setSelectedIds={setSelectedStaffIds}
                            onToggle={toggleStaff}
                            onSearch={setStaffSearch}
                            searchValue={staffSearch}
                            isLoading={isLoadingData}
                            filters={staffFilters}
                            setFilters={setStaffFilters}
                        />
                    )}

                    {activeTab === 'participants' && (
                        <ParticipantsDirectoryTab
                            data={filteredParticipants}
                            selectedIds={selectedParticipantIds}
                            setSelectedIds={setSelectedParticipantIds}
                            onToggle={toggleParticipant}
                            onSearch={setParticipantSearch}
                            searchValue={participantSearch}
                            isLoading={isLoadingData}
                            filters={participantFilters}
                            setFilters={setParticipantFilters}
                        />
                    )}
                </div>
            </div>

            {/* Close Confirmation Modal */}
            {showCloseConfirm && (
                <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center backdrop-blur-[4px] animate-in fade-in duration-200">
                    <div className="bg-card rounded-xl shadow-2xl w-[480px] p-0 overflow-hidden border border-border animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h2 className="text-[22px] font-extrabold text-foreground tracking-tight mb-2">Discard Changes?</h2>
                            <p className="text-[15px] text-muted-foreground leading-relaxed">
                                You have unsaved configuration for "<span className="font-bold text-foreground">{details.name || "Untitled Instance"}</span>". Closing will permanently lose these settings.
                            </p>
                        </div>
                        <div className="bg-muted/50 p-6 flex gap-3">
                            <button
                                onClick={() => { setShowCloseConfirm(false); onCancelClose?.(); }}
                                className="flex-1 h-11 text-[14px] font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors border border-border shadow-sm"
                            >
                                Keep Editing
                            </button>
                            <button
                                onClick={() => { setShowCloseConfirm(false); onForceClose?.('new-instance'); }}
                                className="flex-1 h-11 bg-red-600 text-white text-[14px] font-bold rounded-lg hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all"
                            >
                                Discard & Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Status Modal Overlay */}
            {creationStatus !== 'idle' && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[110] flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-card border border-border rounded-xl shadow-2xl w-[400px] overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 flex flex-col items-center text-center">
                            {creationStatus === 'loading' && (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
                                        <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                        <Box className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Creating Instance</h3>
                                    <p className="text-sm text-muted-foreground">Setting up your new workspace and assigning members...</p>
                                </>
                            )}

                            {creationStatus === 'success' && (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Instance Created!</h3>
                                    <p className="text-sm text-muted-foreground">Your new instance has been successfully initialized. Redirecting you now...</p>
                                </>
                            )}

                            {creationStatus === 'error' && (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                                        <X className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Creation Failed</h3>
                                    <p className="text-sm text-red-500/80 mb-6">{errorMessage || "An unexpected error occurred."}</p>
                                    <button
                                        onClick={() => setCreationStatus('idle')}
                                        className="h-10 px-6 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-lg transition-colors border border-border"
                                    >
                                        Go Back & Fix
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Simple AlertTriangle for the modal
const AlertTriangle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
    </svg>
);

// --- Sub-components to avoid React Hook violations ---

interface StaffingDirectoryTabProps {
    data: DBUser[];
    selectedIds: Set<string>;
    setSelectedIds: (ids: Set<string>) => void;
    onToggle: (id: string) => void;
    onSearch: (val: string) => void;
    searchValue: string;
    isLoading: boolean;
    filters: { status: Set<string>, role: Set<string> };
    setFilters: React.Dispatch<React.SetStateAction<{ status: Set<string>, role: Set<string> }>>;
}

const StaffingDirectoryTab = ({
    data,
    selectedIds,
    setSelectedIds,
    onToggle,
    onSearch,
    searchValue,
    isLoading,
    filters,
    setFilters
}: StaffingDirectoryTabProps) => {
    const columns = useMemo(() => [
        {
            id: "select",
            size: 40,
            header: ({ table }: any) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                />
            ),
            cell: ({ row }: any) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                    />
                </div>
            ),
        },
        {
            accessorKey: "full_name",
            header: "Staff Member",
            size: 250,
            cell: ({ row }: any) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-border shadow-sm">
                        <AvatarImage src={row.original.profile_photo_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                            {row.original.first_name[0]}{row.original.surname?.[0] || row.original.last_name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">{row.original.first_name} {row.original.surname || row.original.last_name}</div>
                        <div className="text-[10px] text-muted-foreground truncate opacity-60">{row.original.email}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            size: 110,
            cell: ({ row }: any) => (
                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0 h-4 bg-muted/30">
                    {row.original.status || 'Active'}
                </Badge>
            )
        },
        {
            accessorKey: "email",
            header: "Contact",
            cell: ({ row }: any) => <span className="text-xs text-muted-foreground">{row.original.email}</span>
        }
    ], []);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row.id,
        state: {
            rowSelection: Object.fromEntries(Array.from(selectedIds).map(id => [id, true])),
        },
        onRowSelectionChange: (updater) => {
            const currentSelection = Object.fromEntries(Array.from(selectedIds).map(id => [id, true]));
            const nextSelection = typeof updater === 'function' ? updater(currentSelection) : updater;
            const newSet = new Set<string>();
            Object.keys(nextSelection).forEach(id => {
                if (nextSelection[id]) {
                    newSet.add(id);
                }
            });
            setSelectedIds(newSet);
        },
    });

    return (
        <div className="flex h-[calc(100vh-180px)] -mt-6 -mx-6 animate-in slide-in-from-right-4 duration-300 overflow-hidden">
            <div className="w-64 border-r border-border bg-muted/10 flex flex-col shrink-0">
                <div className="p-4 border-b border-border">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <input
                            placeholder="Quick find..."
                            value={searchValue}
                            onChange={(e) => onSearch(e.target.value)}
                            className="w-full bg-background border border-border rounded-md pl-10 pr-3 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 ml-1">Status</h4>
                            <div className="space-y-3">
                                {['Active', 'Inactive', 'On Leave'].map(status => (
                                    <label key={status} className="flex items-center gap-3 cursor-pointer group">
                                        <Checkbox
                                            className="w-4 h-4 rounded-sm"
                                            checked={filters.status.has(status)}
                                            onCheckedChange={(checked) => {
                                                const next = new Set(filters.status);
                                                if (checked) next.add(status);
                                                else next.delete(status);
                                                setFilters(prev => ({ ...prev, status: next }));
                                            }}
                                        />
                                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{status}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 ml-1">System Role</h4>
                            <div className="space-y-3">
                                {['Admin', 'Manager', 'Staff', 'Volunteer'].map(role => (
                                    <label key={role} className="flex items-center gap-3 cursor-pointer group">
                                        <Checkbox
                                            className="w-4 h-4 rounded-sm"
                                            checked={filters.role.has(role)}
                                            onCheckedChange={(checked) => {
                                                const next = new Set(filters.role);
                                                if (checked) next.add(role);
                                                else next.delete(role);
                                                setFilters(prev => ({ ...prev, role: next }));
                                            }}
                                        />
                                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{role}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                <div className="p-4 border-t border-border bg-muted/5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
                        {selectedIds.size} Selected
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-background">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Staffing Directory...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0">
                        <DataTable
                            table={table}
                            columns={columns}
                            selectionLabel="staff"
                            onRowClick={(user) => onToggle(user.id)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

interface ParticipantsDirectoryTabProps {
    data: Participant[];
    selectedIds: Set<string>;
    setSelectedIds: (ids: Set<string>) => void;
    onToggle: (id: string) => void;
    onSearch: (val: string) => void;
    searchValue: string;
    isLoading: boolean;
    filters: { status: Set<string>, year: Set<string> };
    setFilters: React.Dispatch<React.SetStateAction<{ status: Set<string>, year: Set<string> }>>;
}

const ParticipantsDirectoryTab = ({
    data,
    selectedIds,
    setSelectedIds,
    onToggle,
    onSearch,
    searchValue,
    isLoading,
    filters,
    setFilters
}: ParticipantsDirectoryTabProps) => {
    const columns = useMemo(() => [
        {
            id: "select",
            size: 40,
            header: ({ table }: any) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                />
            ),
            cell: ({ row }: any) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                    />
                </div>
            ),
        },
        {
            accessorKey: "full_name",
            header: "Participant",
            size: 250,
            cell: ({ row }: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 flex items-center justify-center shrink-0 rounded-full border border-primary/20">
                        <UserCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">{row.original.full_name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono opacity-60">ID: {row.original.id.slice(0, 8).toUpperCase()}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "unit_name",
            header: "Unit",
            size: 150,
            cell: ({ row }: any) => <span className="text-xs font-semibold">{row.original.unit_name || 'N/A'}</span>
        },
        {
            accessorKey: "school_year",
            header: "Year",
            size: 100,
            cell: ({ row }: any) => <span className="text-xs text-muted-foreground font-medium">{row.original.school_year || 'N/A'}</span>
        },
        {
            accessorKey: "status",
            header: "Status",
            size: 110,
            cell: ({ row }: any) => (
                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0 h-4 bg-muted/30">
                    {row.original.status || 'Active'}
                </Badge>
            )
        }
    ], []);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row.id,
        state: {
            rowSelection: Object.fromEntries(Array.from(selectedIds).map(id => [id, true])),
        },
        onRowSelectionChange: (updater) => {
            const currentSelection = Object.fromEntries(Array.from(selectedIds).map(id => [id, true]));
            const nextSelection = typeof updater === 'function' ? updater(currentSelection) : updater;
            const newSet = new Set<string>();
            Object.keys(nextSelection).forEach(id => {
                if (nextSelection[id]) {
                    newSet.add(id);
                }
            });
            setSelectedIds(newSet);
        },
    });

    return (
        <div className="flex h-[calc(100vh-180px)] -mt-6 -mx-6 animate-in slide-in-from-right-4 duration-300 overflow-hidden">
            <div className="w-64 border-r border-border bg-muted/10 flex flex-col shrink-0">
                <div className="p-4 border-b border-border">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <input
                            placeholder="Quick find..."
                            value={searchValue}
                            onChange={(e) => onSearch(e.target.value)}
                            className="w-full bg-background border border-border rounded-md pl-10 pr-3 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 ml-1">Status</h4>
                            <div className="space-y-3">
                                {['On-site', 'Off-site', 'Unassigned'].map(status => (
                                    <label key={status} className="flex items-center gap-3 cursor-pointer group">
                                        <Checkbox
                                            className="w-4 h-4 rounded-sm"
                                            checked={filters.status.has(status)}
                                            onCheckedChange={(checked) => {
                                                const next = new Set(filters.status);
                                                if (checked) next.add(status);
                                                else next.delete(status);
                                                setFilters(prev => ({ ...prev, status: next }));
                                            }}
                                        />
                                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{status}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 ml-1">Age Group</h4>
                            <div className="space-y-3">
                                {['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'].map(year => (
                                    <label key={year} className="flex items-center gap-3 cursor-pointer group">
                                        <Checkbox
                                            className="w-4 h-4 rounded-sm"
                                            checked={filters.year.has(year)}
                                            onCheckedChange={(checked) => {
                                                const next = new Set(filters.year);
                                                if (checked) next.add(year);
                                                else next.delete(year);
                                                setFilters(prev => ({ ...prev, year: next }));
                                            }}
                                        />
                                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{year}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                <div className="p-4 border-t border-border bg-muted/5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
                        {selectedIds.size} Selected
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-background">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Global Directory...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0">
                        <DataTable
                            table={table}
                            columns={columns}
                            selectionLabel="participant"
                            onRowClick={(part) => onToggle(part.id)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
