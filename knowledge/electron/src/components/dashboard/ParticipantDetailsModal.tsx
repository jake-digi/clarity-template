
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    User,
    ShieldAlert,
    Stethoscope,
    Utensils,
    History,
    FileText,
    Calendar,
    MapPin,
    AlertCircle,
    CheckCircle2,
    Activity,
    ExternalLink,
    Phone,
    Mail,
    Flag,
    X,
    Building2,
    Briefcase,
    BookOpen,
    Clock,
    Smile,
    HeartPulse,
    AlertTriangle,
    StickyNote
} from 'lucide-react';
import { mockCases, InstanceCase } from '@/data/mockData-old';
import { Participant } from '@/types/database';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { format } from 'date-fns';

interface ParticipantDetailsModalProps {
    participant: Participant | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    viewMode?: 'global' | 'instance'; // To differentiate contexts if needed
}

// Reusing severity/status logic from CasesTable for consistency
const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
        case 'critical':
        case 'urgent': return "text-red-700 bg-red-100 border-red-200";
        case 'high': return "text-orange-700 bg-orange-100 border-orange-200";
        case 'medium': return "text-blue-700 bg-blue-100 border-blue-200";
        case 'low': return "text-slate-700 bg-slate-100 border-slate-200";
        default: return "text-slate-700 bg-slate-100";
    }
};

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'resolved':
        case 'closed': return "text-green-700 bg-green-100 border-green-200";
        case 'inprogress':
        case 'open': return "text-blue-700 bg-blue-100 border-blue-200";
        case 'pending':
        case 'triage': return "text-amber-700 bg-amber-100 border-amber-200";
        default: return "text-slate-700 bg-slate-100";
    }
};

export const ParticipantDetailsModal = ({
    participant: initialParticipant,
    open,
    onOpenChange,
    viewMode = 'instance'
}: ParticipantDetailsModalProps) => {
    // If we have an ID, try to fetch full details using the hook to get medical info, etc.
    // We import the hook locally or pass it in? We can import it.
    // But this component seems to rely on the prop.
    // Let's assume the prop might be a partial or full participant.
    // Ideally we fetch here.

    // TEMPORARY: Just use the prop and assume it's what we have.
    // To do this properly we should use the hook, but let's first fix the type issues.
    // We will cast the prop to any for the extensive refactor or map it.
    // Better: Update the component to read snake_case.

    const p = initialParticipant as any; // Cast for easier migration of mixed types during refactor

    if (!p) return null;

    // Mock data for timetable
    const mockTimetable = [
        { time: '08:00', activity: 'Breakfast', location: 'Main Canteen', type: 'meal' },
        { time: '09:30', activity: 'Morning Assembly', location: 'Hall A', type: 'admin' },
        { time: '10:00', activity: 'Group Discussion', location: 'Room 101', type: 'activity' },
        { time: '12:30', activity: 'Lunch', location: 'Main Canteen', type: 'meal' },
        { time: '14:00', activity: 'Sports', location: 'Field B', type: 'activity' },
        { time: '16:00', activity: 'Free Time', location: 'Campus', type: 'free' },
    ];

    // Filter cases for this participant (using mock cases for now as Cases table doesn't exist)
    const participantCases = mockCases.filter(c => (p.activeCaseIds || []).includes(c.id) || c.participantName === p.full_name);

    // Define columns for internal cases table
    const caseColumns: ColumnDef<InstanceCase>[] = [
        {
            accessorKey: "id",
            header: "ID",
            cell: ({ row }) => <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase">{row.getValue("id")}</span>,
        },
        {
            accessorKey: "title",
            header: "Title",
            cell: ({ row }) => <span className="text-xs font-bold text-foreground">{row.getValue("title")}</span>,
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{row.getValue("type")}</span>,
        },
        {
            accessorKey: "severity",
            header: "Severity",
            cell: ({ row }) => {
                const c = row.original;
                const priority = c.type === 'behavior' ? c.severityLevel : c.urgencyLevel;
                return (
                    <div className={cn(
                        "inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold border rounded-sm",
                        getSeverityColor(priority)
                    )}>
                        {priority.toUpperCase()}
                    </div>
                );
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                return (
                    <div className={cn(
                        "inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold border rounded-sm",
                        getStatusColor(status)
                    )}>
                        {status.toUpperCase()}
                    </div>
                );
            }
        },
    ];

    const casesTable = useReactTable({
        data: participantCases,
        columns: caseColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden border-none shadow-2xl bg-background text-foreground block rounded-lg max-h-[90vh] flex flex-col">
                {/* Header Section */}
                <div className="flex flex-col border-b border-border bg-sidebar-accent/5 p-6 pb-4 shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary uppercase text-xl font-bold">
                                    {(p.first_name || '')[0]}{(p.surname || '')[0]}
                                </div>
                                <div className={cn(
                                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center",
                                    p.is_off_site ? "bg-amber-500" : "bg-green-500"
                                )} title={p.is_off_site ? "Off-Site" : "On-Site"}>
                                    {p.is_off_site ? (
                                        <Clock className="w-3 h-3 text-white" />
                                    ) : (
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                    )}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-foreground">{p.full_name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="font-mono text-[10px] h-5 bg-muted/50 text-muted-foreground border-border">
                                        ID: {p.id}
                                    </Badge>
                                    <Badge className="h-5 text-[10px] font-bold bg-primary/10 text-primary border-transparent hover:bg-primary/20">
                                        {p.rank}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <span className="text-xs font-semibold text-muted-foreground">{p.school_year || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 pr-6">
                            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs font-bold border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300">
                                <Flag className="w-3.5 h-3.5" />
                                Flag Incident
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="flex-1 bg-background overflow-hidden flex flex-col min-h-0">
                    <Tabs defaultValue="overview" className="h-full flex flex-col">
                        <div className="px-6 border-b border-border bg-sidebar-accent/5 shrink-0">
                            <TabsList className="h-10 p-0 bg-transparent justify-start gap-8">
                                <TabsTrigger value="overview" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-0 pb-0 bg-transparent font-bold text-xs uppercase tracking-wide text-muted-foreground shadow-none">Overview</TabsTrigger>
                                <TabsTrigger value="timetable" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-0 pb-0 bg-transparent font-bold text-xs uppercase tracking-wide text-muted-foreground shadow-none">Timetable</TabsTrigger>
                                <TabsTrigger value="welfare" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-0 pb-0 bg-transparent font-bold text-xs uppercase tracking-wide text-muted-foreground shadow-none">Welfare & Care</TabsTrigger>
                                <TabsTrigger value="history" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-0 pb-0 bg-transparent font-bold text-xs uppercase tracking-wide text-muted-foreground shadow-none">Activity Log</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-muted/5 p-6 custom-scrollbar">
                            <TabsContent value="overview" className="mt-0 space-y-6 h-full">
                                {/* Key Metrics Row */}
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="bg-background border border-border rounded-lg p-4 shadow-sm flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                            <Smile className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Happiness</p>
                                            <p className="text-xl font-bold text-green-700">-/10</p>
                                        </div>
                                    </div>
                                    <div className="bg-background border border-border rounded-lg p-4 shadow-sm flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <HeartPulse className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Welfare Score</p>
                                            <p className="text-xl font-bold text-blue-700">-/10</p>
                                        </div>
                                    </div>
                                    <div className="bg-background border border-border rounded-lg p-4 shadow-sm flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Warnings</p>
                                            <p className="text-xl font-bold text-orange-700">0</p>
                                        </div>
                                    </div>
                                    <div className="bg-background border border-border rounded-lg p-4 shadow-sm flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Active Cases</p>
                                            <p className="text-xl font-bold text-red-700">{participantCases.length}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Data Grid */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        {/* Instance Assignment */}
                                        <div className="bg-background border border-border rounded-lg shadow-sm">
                                            <div className="px-4 py-3 border-b border-border bg-muted/10 flex items-center justify-between">
                                                <h3 className="text-xs font-bold uppercase text-foreground flex items-center gap-2">
                                                    <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                                                    Assignment
                                                </h3>
                                                <Badge variant="outline" className="text-[9px] h-5 bg-background font-mono uppercase">Instance ID: {p.instance_id}</Badge>
                                            </div>
                                            <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-2">
                                                <div>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Group</span>
                                                    <p className="text-sm font-semibold">{p.unit_name || p.sub_group_name || 'Unassigned'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Supergroup</span>
                                                    <p className="text-sm font-semibold">{p.super_group_name || p.super_group_id || 'Unassigned'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Sub-Group</span>
                                                    <p className="text-sm font-semibold">{p.sub_group_name || p.sub_group_id || 'Unassigned'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Role</span>
                                                    <p className="text-sm font-semibold">{p.rank}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Housing & Accommodation */}
                                        <div className="bg-background border border-border rounded-lg shadow-sm">
                                            <div className="px-4 py-3 border-b border-border bg-muted/10">
                                                <h3 className="text-xs font-bold uppercase text-foreground flex items-center gap-2">
                                                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                                    Housing Allocation
                                                </h3>
                                            </div>
                                            <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-2">
                                                <div>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Block / House</span>
                                                    <p className="text-sm font-semibold">{p.block_name || p.block_id || 'Unassigned'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Room No.</span>
                                                    <p className="text-sm font-semibold">{p.room_name || p.room_id || 'Unassigned'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        {/* Schedule / Dates */}
                                        <div className="bg-background border border-border rounded-lg shadow-sm">
                                            <div className="px-4 py-3 border-b border-border bg-muted/10">
                                                <h3 className="text-xs font-bold uppercase text-foreground flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                    Schedule
                                                </h3>
                                            </div>
                                            <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-2">
                                                <div>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Arrival</span>
                                                    <p className="text-sm font-semibold">{p.arrival_date ? format(new Date(p.arrival_date), 'dd MMM yyyy') : '-'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Departure</span>
                                                    <p className="text-sm font-semibold">{p.departure_date ? format(new Date(p.departure_date), 'dd MMM yyyy') : '-'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notes Snapshot */}
                                        <div className="bg-background border border-border rounded-lg shadow-sm flex flex-col h-full max-h-[160px]">
                                            <div className="px-4 py-3 border-b border-border bg-muted/10 flex items-center justify-between">
                                                <h3 className="text-xs font-bold uppercase text-foreground flex items-center gap-2">
                                                    <StickyNote className="w-3.5 h-3.5 text-muted-foreground" />
                                                    Latest Note
                                                </h3>
                                                <Button variant="ghost" size="sm" className="h-5 text-[10px] hover:bg-transparent hover:text-primary p-0">View All</Button>
                                            </div>
                                            <div className="p-4 flex-1 overflow-hidden">
                                                <p className="text-xs text-muted-foreground leading-relaxed italic">
                                                    {p.off_site_comment || "No recent notes."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="timetable" className="mt-0 h-full">
                                <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-border bg-muted/5 flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-foreground">Today's Personalised Schedule</h3>
                                        <Badge variant="outline">Day 4 - Thursday</Badge>
                                    </div>
                                    <div className="divide-y divide-border">
                                        {mockTimetable.map((slot, index) => (
                                            <div key={index} className="flex items-center p-4 hover:bg-muted/5 transition-colors">
                                                <div className="w-24 shrink-0">
                                                    <span className="text-sm font-bold font-mono text-foreground">{slot.time}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-indigo-700">{slot.activity}</span>
                                                        {slot.type === 'meal' && <Badge variant="secondary" className="h-4 text-[9px] bg-amber-50 text-amber-700 border-amber-100">MEAL</Badge>}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <MapPin className="w-3 h-3" />
                                                        <span className="text-xs font-medium">{slot.location}</span>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-7 text-xs">Details</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="welfare" className="mt-0 space-y-6 h-full">
                                {/* Care Plan & Medical */}
                                <div className="bg-background border border-border rounded-lg shadow-sm">
                                    <div className="px-4 py-3 border-b border-border bg-muted/10 flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase text-foreground flex items-center gap-2">
                                            <HeartPulse className="w-3.5 h-3.5 text-muted-foreground" />
                                            Active Care & Medical
                                        </h3>
                                    </div>
                                    <div className="p-5">
                                        {/* Status Indicators */}
                                        <div className="flex flex-wrap gap-3 mb-6">
                                            {/* Allergies */}
                                            {p.medical_info?.allergies?.map((a: string) => (
                                                <Badge key={a} className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200 gap-1.5 pl-1.5 pr-2.5 py-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-bold uppercase">Allergy: {a}</span>
                                                </Badge>
                                            ))}
                                            {/* Conditions */}
                                            {p.medical_info?.conditions?.map((c: string) => (
                                                <Badge key={c} className="bg-orange-50 text-orange-700 hover:bg-orange-50 border-orange-200 gap-1.5 pl-1.5 pr-2.5 py-1">
                                                    <Activity className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-bold uppercase">{c}</span>
                                                </Badge>
                                            ))}
                                            {/* Dietary */}
                                            {p.dietary_needs?.restrictions?.map((r: string) => (
                                                <Badge key={r} className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200 gap-1.5 pl-1.5 pr-2.5 py-1">
                                                    <Utensils className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-bold uppercase">{r}</span>
                                                </Badge>
                                            ))}

                                            {(!p.medical_info?.allergies?.length && !p.medical_info?.conditions?.length) && (
                                                <span className="text-sm text-muted-foreground italic pl-1">No active medical alerts.</span>
                                            )}
                                        </div>

                                        <Separator className="my-6 block" />

                                        {/* Case Summary Table */}
                                        <div>
                                            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-4">Case Summary</h4>
                                            <div className="rounded-md border border-border">
                                                <DataTable
                                                    table={casesTable}
                                                    columns={caseColumns}
                                                    selectionLabel="case(s)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="history" className="mt-0 h-full">
                                <div className="bg-background border border-border rounded-lg shadow-sm p-6 overflow-hidden">
                                    <h3 className="text-sm font-bold text-foreground mb-4">Activity Timeline</h3>
                                    <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                                        {[
                                            { date: 'Today, 2:45 PM', event: 'Checked in at canteen', category: 'Presence', user: 'System' },
                                            { date: 'Today, 9:20 AM', event: 'Emergency careplan updated', category: 'Medical', urgent: true, user: 'Dr. Sarah J.' },
                                            { date: 'Yesterday, 6:00 PM', event: 'Welfare check-in completed: Satisfactory', category: 'Welfare', user: 'Ben Davies' },
                                            { date: 'Monday, July 20', event: 'Joined Summer Camp 2026', category: 'System', user: 'Admin' },
                                            { date: 'June 12, 2026', event: 'Registration application approved', category: 'System', user: 'System' },
                                        ].map((item, i) => (
                                            <div key={i} className="relative pl-12 group">
                                                <div className={cn(
                                                    "absolute left-0 top-0 w-10 h-10 rounded-full border border-background shadow-sm flex items-center justify-center z-10 bg-background group-hover:scale-110 transition-transform",
                                                )}>
                                                    <div className={cn("w-2.5 h-2.5 rounded-full", item.urgent ? "bg-red-500" : "bg-primary/50")} />
                                                </div>
                                                <div className="space-y-1.5 pt-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-muted-foreground font-mono">{item.date}</span>
                                                        <Badge variant="outline" className="text-[9px] uppercase font-bold h-4 px-1.5 border-border">{item.category}</Badge>
                                                    </div>
                                                    <p className="text-sm font-bold text-foreground leading-tight">{item.event}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium">Action by: {item.user}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};
