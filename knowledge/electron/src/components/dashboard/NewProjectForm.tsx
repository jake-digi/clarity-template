import { useState, useEffect } from 'react';
import { archivedProjectItems, activeProjectItems, completedProjectItems, draftProjectItems, projects } from '@/data/mockData-old';
import {
    Save, CheckCircle2, Layout, Boxes, Users, Settings, Plus, FileText,
    Calendar, Trash2, ListTodo, Box, Factory, Zap, Shield, Target,
    Cpu, Truck, HardHat, Construction, Database, Globe, Briefcase,
    Ship, Plane, Hammer, Wrench, Microscope, FlaskConical,
    Activity, BarChart3, PieChart, TrendingUp, Presentation,
    Cloud, Server, Terminal, Lock, Key, Eye, Search, Layers
} from 'lucide-react';
import { ChevronDownIcon } from '../shared/icons/PostmanIcons';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

interface ProjectDetails {
    name: string;
    code: string;
    client: string;
    lead: string;
    am: string;
    tech: string;
    description: string;
    status: 'Draft' | 'Active' | 'Completed';
    // Advanced Fields
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    startDate: string;
    targetDate: string;
    estimatedBudget: string;
    currency: string;
    contingency: string;
    department: string;
    siteLocation: string;
    tags: string[];
    riskLevel: 'Low' | 'Medium' | 'High';
    requirements: { id: string; text: string; category: string }[];
    icon: string;
}

const PROJECT_ICONS = [
    { name: 'Box', icon: Box },
    { name: 'Factory', icon: Factory },
    { name: 'Workflow', icon: Layout },
    { name: 'Inventory', icon: Boxes },
    { name: 'Engineering', icon: Settings },
    { name: 'Technical', icon: Cpu },
    { name: 'Logistics', icon: Truck },
    { name: 'Safety', icon: HardHat },
    { name: 'Construction', icon: Construction },
    { name: 'Infrastructure', icon: Server },
    { name: 'Global', icon: Globe },
    { name: 'Strategic', icon: Target },
    { name: 'Compliance', icon: Shield },
    { name: 'Energy', icon: Zap },
    { name: 'Resource', icon: Users },
    { name: 'Registry', icon: Database },
    { name: 'Operation', icon: Briefcase },
    { name: 'Transport', icon: Ship },
    { name: 'Quality', icon: Microscope },
    { name: 'Innovation', icon: FlaskConical },
    { name: 'Activity', icon: Activity },
    { name: 'Analytics', icon: BarChart3 },
    { name: 'Forecast', icon: TrendingUp },
    { name: 'Cloud', icon: Cloud },
    { name: 'Terminal', icon: Terminal },
    { name: 'Security', icon: Lock },
    { name: 'Review', icon: Eye },
    { name: 'Structure', icon: Layers },
    { name: 'Tooling', icon: Wrench },
    { name: 'Fabrication', icon: Hammer }
];

interface NewProjectFormProps {
    closeRequestTabId?: string | null;
    onCancelClose?: () => void;
    onForceClose?: (id: string) => void;
    onDirtyChange?: (dirty: boolean) => void;
}

export const NewProjectForm = ({
    closeRequestTabId,
    onCancelClose,
    onForceClose,
    onDirtyChange
}: NewProjectFormProps) => {
    const [details, setDetails] = useState<ProjectDetails>({
        name: '',
        code: `CNC-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
        client: '',
        lead: '',
        am: '',
        tech: '',
        description: '',
        status: 'Draft',
        priority: 'Medium',
        startDate: new Date().toISOString().split('T')[0],
        targetDate: '',
        estimatedBudget: '',
        currency: 'GBP',
        contingency: '10',
        department: 'Engineering',
        siteLocation: 'Birmingham Facility',
        tags: [],
        riskLevel: 'Low',
        requirements: [
            { id: '1', text: 'ISO 9001 Compliance Required', category: 'Compliance' },
            { id: '2', text: 'Safety Interlocks per EN 60204-1', category: 'Engineering' }
        ],
        icon: 'Box'
    });

    const [activeTab, setActiveTab] = useState<'details' | 'phases' | 'strategic' | 'compliance' | 'team'>('details');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [showDiscardVerify, setShowDiscardVerify] = useState(false);

    // Initial state to compare for changes
    const isDirty = details.name !== '' ||
        details.client !== '' ||
        details.description !== '' ||
        details.lead !== '' ||
        details.am !== '' ||
        details.tech !== '' ||
        details.targetDate !== '' ||
        details.estimatedBudget !== '';

    useEffect(() => {
        onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    // Handle external close request from Index / TabBar
    useEffect(() => {
        if (closeRequestTabId === 'new-project') {
            setShowCloseConfirm(true);
        }
    }, [closeRequestTabId]);

    // Auto-save simulations (Realtime draft)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (details.name || details.client) {
                setIsSaving(true);
                setTimeout(() => {
                    setIsSaving(false);
                    setLastSaved(new Date());
                }, 800);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [details]);

    const handleInputChange = (field: keyof ProjectDetails, value: string) => {
        setDetails(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="flex-1 bg-background flex flex-col overflow-hidden text-foreground">
            {/* Postman-style Header - High Density Light */}
            <div className="bg-card border-b border-border px-4 h-[52px] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <div className="h-9 w-9 bg-primary/10 flex items-center justify-center text-primary rounded-sm border border-primary/30 hover:bg-primary/20 hover:border-primary transition-all cursor-pointer shadow-sm">
                            {(() => {
                                const IconObj = PROJECT_ICONS.find(i => i.name === details.icon)?.icon || Box;
                                return <IconObj className="w-5 h-5" />;
                            })()}
                        </div>
                        <div className="absolute top-11 left-0 bg-card border border-border shadow-xl p-2 hidden group-hover:grid grid-cols-6 gap-0.5 z-50 min-w-[300px] rounded-sm">
                            <div className="col-span-6 pb-2 mb-1 border-b border-border flex items-center justify-between px-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Project Icon</span>
                            </div>
                            {PROJECT_ICONS.map(i => (
                                <button
                                    key={i.name}
                                    onClick={() => handleInputChange('icon', i.name)}
                                    title={i.name}
                                    className={cn(
                                        "p-2 hover:bg-muted transition-colors flex items-center justify-center rounded-sm",
                                        details.icon === i.name ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    <i.icon className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-[18px] font-bold tracking-tight">
                                {details.name || "Untitled Project"}
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
                            else onForceClose?.('new-project');
                        }}
                        className="h-8 px-3 text-[13px] font-medium text-muted-foreground hover:bg-muted rounded-sm transition-all flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Discard
                    </button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <button className="h-8 px-4 bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 rounded-sm transition-all flex items-center gap-2 shadow-sm">
                        <Save className="w-4 h-4" />
                        Commit Project
                    </button>
                </div>
            </div>

            {/* Postman-style Confirmation Dialogs */}
            {showCloseConfirm && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-card rounded-sm shadow-2xl w-[520px] p-0 overflow-hidden border border-border animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5">
                            <h2 className="text-[20px] font-bold text-foreground leading-tight mb-2">Unsaved changes</h2>
                            <p className="text-[14px] text-muted-foreground leading-relaxed">
                                You have unsaved changes in "<span className="font-semibold text-foreground">{details.name || "Untitled Project"}</span>". Do you want to save them as a draft before closing?
                            </p>
                        </div>
                        <div className="bg-muted/30 border-t border-border px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setShowCloseConfirm(false);
                                        setShowDiscardVerify(true);
                                    }}
                                    className="h-9 px-4 text-[13px] font-semibold text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                                >
                                    Discard Changes
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setShowCloseConfirm(false);
                                        onCancelClose?.();
                                    }}
                                    className="h-9 px-4 text-[13px] font-semibold text-muted-foreground hover:bg-muted rounded-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        // Handle save as draft logic
                                        setShowCloseConfirm(false);
                                        onForceClose?.('new-project');
                                    }}
                                    className="h-9 px-6 bg-primary text-primary-foreground text-[13px] font-bold rounded-sm hover:bg-primary/90 shadow-sm transition-all"
                                >
                                    Save as Draft
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDiscardVerify && (
                <div className="fixed inset-0 bg-black/60 z-[101] flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-card rounded-sm shadow-2xl w-[400px] p-0 overflow-hidden border border-border animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5">
                            <h2 className="text-[18px] font-bold text-foreground leading-tight mb-2">Are you sure?</h2>
                            <p className="text-[14px] text-muted-foreground leading-relaxed">
                                This will permanently delete all the changes you've made to this project configuration.
                            </p>
                        </div>
                        <div className="bg-muted/30 border-t border-border px-6 py-4 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setShowDiscardVerify(false)}
                                className="h-9 px-4 text-[13px] font-semibold text-muted-foreground hover:bg-muted rounded-sm transition-colors"
                            >
                                Take me back
                            </button>
                            <button
                                onClick={() => {
                                    setShowDiscardVerify(false);
                                    onForceClose?.('new-project');
                                }}
                                className="h-9 px-6 bg-red-600 text-white text-[13px] font-bold rounded-sm hover:bg-red-700 shadow-sm transition-all"
                            >
                                Discard permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-header / Tab Bar */}
            <div className="bg-card border-b border-border flex items-center justify-between px-4 h-10 shrink-0">
                <div className="flex h-full">
                    {[
                        { id: 'details', label: 'Overview', icon: FileText },
                        { id: 'phases', label: 'Phases', icon: Layout },
                        { id: 'strategic', label: 'Strategic', icon: ListTodo },
                        { id: 'compliance', label: 'Compliance', icon: CheckCircle2 },
                        { id: 'team', label: 'Team', icon: Users },
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
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4 text-[12px] font-medium text-muted-foreground pr-2">
                    <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Reference: {details.code}
                    </span>
                    {isSaving ? (
                        <span className="text-primary flex items-center gap-1.5 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Saving...
                        </span>
                    ) : lastSaved && (
                        <span className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Saved
                        </span>
                    )}
                </div>
            </div>

            {/* Postman Main Body - Full Width */}
            <div className="flex-1 overflow-auto bg-background p-6">
                <div className="w-full max-w-full mx-auto space-y-12">
                    {activeTab === 'details' && (
                        <div className="flex flex-col space-y-12">
                            {/* Primary Section */}
                            <div className="grid grid-cols-12 gap-12">
                                <div className="col-span-8 space-y-8">
                                    <div className="space-y-3">
                                        <h3 className="text-[20px] font-bold text-foreground leading-none">Project Configuration</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[12px] font-medium text-muted-foreground">
                                                    Project Name
                                                </label>
                                                <span className="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded-sm">Required</span>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Enter project nomenclature..."
                                                value={details.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                className="w-full bg-card border border-border rounded-sm px-3 py-1.5 text-[13px] font-medium text-foreground focus:border-primary focus:shadow-[0_0_0_1px_rgba(255,108,55,0.4)] outline-none transition-all placeholder:text-muted-foreground/60 hover:border-muted-foreground/40"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[12px] font-medium text-muted-foreground text-foreground">
                                                Technical Abstract / Project Scope
                                            </label>
                                            <textarea
                                                rows={14}
                                                placeholder="Enter full technical scope, constraints and project boundaries..."
                                                value={details.description}
                                                onChange={(e) => handleInputChange('description', e.target.value)}
                                                className="w-full bg-card border border-border rounded-sm px-3 py-2 text-[13px] font-medium text-foreground leading-relaxed focus:border-primary focus:shadow-[0_0_0_1px_rgba(255,108,55,0.4)] outline-none transition-all resize-none placeholder:text-muted-foreground/60 hover:border-muted-foreground/40"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-4 bg-muted/30 border border-border rounded-sm p-6 space-y-8">
                                    <div className="space-y-6">
                                        <h4 className="text-[12px] font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">Technical Metadata</h4>

                                        <div className="space-y-5">
                                            <div className="space-y-2">
                                                <label className="text-[12px] font-medium text-muted-foreground">Operational Priority</label>
                                                <div className="relative">
                                                    <select
                                                        value={details.priority}
                                                        onChange={(e) => handleInputChange('priority', e.target.value as any)}
                                                        className="w-full bg-card border border-border rounded-sm px-3 py-1.5 text-[13px] font-medium text-foreground focus:border-primary outline-none appearance-none cursor-pointer hover:border-muted-foreground/40"
                                                    >
                                                        <option>Low</option>
                                                        <option>Medium</option>
                                                        <option>High</option>
                                                        <option>Critical</option>
                                                    </select>
                                                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C8C8C] pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[12px] font-medium text-muted-foreground">Client Registry</label>
                                                <input
                                                    type="text"
                                                    placeholder="Search clients..."
                                                    value={details.client}
                                                    onChange={(e) => handleInputChange('client', e.target.value)}
                                                    className="w-full bg-card border border-border rounded-sm px-3 py-1.5 text-[13px] font-medium text-foreground focus:border-primary outline-none transition-all hover:border-muted-foreground/40"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[12px] font-medium text-muted-foreground">Business Department</label>
                                                <div className="relative">
                                                    <select
                                                        value={details.department}
                                                        onChange={(e) => handleInputChange('department', e.target.value)}
                                                        className="w-full bg-card border border-border rounded-sm px-3 py-1.5 text-[13px] font-medium text-foreground focus:border-primary outline-none appearance-none hover:border-muted-foreground/40"
                                                    >
                                                        <option>Engineering</option>
                                                        <option>Manufacturing</option>
                                                        <option>R&D</option>
                                                        <option>Quality Assurance</option>
                                                    </select>
                                                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C8C8C] pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-border">
                                        <h4 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">Internal Controls</h4>
                                        <div className="bg-blue-500/10 rounded-sm p-3 text-[11px] font-semibold text-blue-500 flex items-center gap-2 border border-blue-500/20">
                                            <Shield className="w-4 h-4" />
                                            Restricted access per security policy
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Temporal/Financial Constraints */}
                            <div className="bg-muted/30 border border-border rounded-sm grid grid-cols-4 divide-x divide-border">
                                {[
                                    { label: 'Start Date', field: 'startDate', type: 'date', value: details.startDate },
                                    { label: 'Target Deadline', field: 'targetDate', type: 'date', value: details.targetDate },
                                    { label: 'Budget Allocation', field: 'estimatedBudget', type: 'text', icon: '£', value: details.estimatedBudget },
                                    { label: 'Contingency Margin', field: 'contingency', type: 'number', suffix: '%', value: details.contingency },
                                ].map((item) => (
                                    <div key={item.field} className="p-6 space-y-3">
                                        <label className="text-[12px] font-medium text-muted-foreground">
                                            {item.label}
                                        </label>
                                        <div className="relative">
                                            {item.icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-[13px]">{item.icon}</span>}
                                            <input
                                                type={item.type}
                                                value={item.value}
                                                onChange={(e) => handleInputChange(item.field as any, e.target.value)}
                                                className={cn(
                                                    "w-full bg-card border border-border rounded-sm py-1.5 text-[13px] font-medium text-foreground focus:border-primary focus:shadow-[0_0_0_1px_rgba(255,108,55,0.4)] outline-none transition-all hover:border-muted-foreground/40",
                                                    item.icon ? "pl-8 pr-4" : "px-3"
                                                )}
                                            />
                                            {item.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-[12px]">{item.suffix}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Team Matrix */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center justify-between border-b border-border pb-3">
                                    <h3 className="text-[18px] font-bold text-foreground flex items-center gap-3">
                                        Resource Allocation Matrix
                                    </h3>
                                    <button className="text-[12px] font-semibold text-primary hover:underline uppercase tracking-wider">
                                        Open Directory
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    {[
                                        { label: 'Project Lead', field: 'lead' as const, placeholder: 'Search name...' },
                                        { label: 'Account Manager', field: 'am' as const, placeholder: 'Search name...' },
                                        { label: 'Technical Designer', field: 'tech' as const, placeholder: 'Search name...' },
                                    ].map((role) => (
                                        <div key={role.field} className="bg-white border border-border p-5 rounded-md hover:border-[#FF6C37]/30 transition-all group">
                                            <label className="text-[11px] font-bold text-muted-foreground uppercase mb-3 block tracking-wider">
                                                {role.label}
                                            </label>
                                            <div className="relative flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full border border-border bg-muted/50 flex items-center justify-center text-[12px] font-bold text-muted-foreground">
                                                    <Users className="w-5 h-5 opacity-40" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder={role.placeholder}
                                                    value={details[role.field]}
                                                    onChange={(e) => handleInputChange(role.field, e.target.value)}
                                                    className="flex-1 bg-transparent border-none text-[15px] font-semibold focus:ring-0 outline-none p-0 placeholder:text-muted-foreground/30"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}


                    {activeTab === 'phases' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[18px] font-bold text-foreground">Project Lifecycle</h3>
                                <button className="text-[11px] font-medium text-primary flex items-center gap-1 hover:underline">
                                    <Plus className="w-4 h-4" /> Add New Phase
                                </button>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { name: 'Concept & Requirement', duration: '2 weeks', template: 'dashboard', color: 'text-blue-500', bgColor: 'bg-blue-50' },
                                    { name: 'Detailed Engineering', duration: '4 weeks', template: 'gantt', color: 'text-amber-500', bgColor: 'bg-amber-50' },
                                    { name: 'Component Procurement', duration: '6 weeks', template: 'table', color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
                                ].map((phase, i) => (
                                    <div key={i} className="group flex items-center gap-4 p-4 bg-background border border-border border-l-4 border-l-primary/30 hover:border-l-primary transition-all">
                                        <div className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center shrink-0">
                                            {phase.template === 'dashboard' && <Layout className={cn("w-5 h-5", phase.color)} />}
                                            {phase.template === 'gantt' && <Calendar className={cn("w-5 h-5", phase.color)} />}
                                            {phase.template === 'table' && <ListTodo className={cn("w-5 h-5", phase.color)} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-foreground">{phase.name}</p>
                                                <Badge variant="outline" className="text-[9px] uppercase h-4 px-1 font-bold opacity-70">Step {i + 1}</Badge>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                                                    <Calendar className="w-3 h-3" /> Target: {phase.duration}
                                                </span>
                                                <div className="h-1 w-1 rounded-full bg-border" />
                                                <span className="text-[10px] uppercase font-bold text-primary/70">
                                                    Blueprint: {phase.template}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <button className="text-[11px] font-semibold text-primary hover:underline">Configure</button>
                                            <button className="opacity-0 group-hover:opacity-100 text-[11px] font-semibold text-red-500/70 hover:text-red-500 transition-all">Remove</button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    className="w-full py-4 border border-dashed border-border bg-muted/5 hover:bg-muted/10 hover:border-primary/50 transition-all text-[12px] font-medium text-muted-foreground flex flex-col items-center justify-center gap-2 group"
                                >
                                    <div className="w-8 h-8 rounded-full border border-dashed border-border flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    Append Project Phase
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'strategic' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <section>
                                <h3 className="text-[18px] font-bold text-foreground mb-6">
                                    Strategic Requirements
                                </h3>
                                <div className="space-y-3">
                                    {details.requirements.map(req => (
                                        <div key={req.id} className="flex gap-4 p-4 bg-background border border-border group hover:border-primary/50 transition-all">
                                            <div className="shrink-0 w-8 h-8 rounded bg-muted/50 flex items-center justify-center text-[10px] font-bold">
                                                {req.category[0]}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={req.text}
                                                    className="w-full bg-transparent border-none text-sm font-medium focus:ring-0 p-0"
                                                />
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="secondary" className="text-[8px] uppercase">{req.category}</Badge>
                                                </div>
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button className="w-full py-3 border border-dashed border-border text-[10px] font-bold uppercase text-muted-foreground hover:bg-muted/30 transition-all">
                                        + Add Success Criterion
                                    </button>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[18px] font-bold text-foreground mb-6">
                                    Site & Utilities
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-medium text-foreground pb-0.5">
                                            Installation Site
                                        </label>
                                        <input
                                            type="text"
                                            value={details.siteLocation}
                                            onChange={(e) => handleInputChange('siteLocation', e.target.value)}
                                            className="w-full bg-background border border-border px-4 py-2.5 text-sm focus:border-primary outline-none appearance-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-medium text-foreground pb-0.5">
                                            Power/Utility Requirements
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 400V 3-Phase, 6 bar air"
                                            className="w-full bg-background border border-border px-4 py-2.5 text-sm focus:border-primary outline-none appearance-none"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'compliance' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <section>
                                <h3 className="text-[18px] font-bold text-foreground mb-6">
                                    Risk Profile
                                </h3>
                                <div className="grid grid-cols-3 gap-6">
                                    {[
                                        { label: 'Technical Complexity', level: 'Medium' },
                                        { label: 'Supply Chain Risk', level: 'High' },
                                        { label: 'Regulatory Burden', level: 'Low' },
                                    ].map((risk) => (
                                        <div key={risk.label} className="bg-background border border-border p-6 space-y-4">
                                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{risk.label}</p>
                                            <div className="flex items-end justify-between">
                                                <span className={cn(
                                                    "text-lg font-bold",
                                                    risk.level === 'High' ? 'text-red-500' :
                                                        risk.level === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                                                )}>
                                                    {risk.level}
                                                </span>
                                                <button className="text-[9px] font-bold uppercase text-primary hover:underline">Mitigate</button>
                                            </div>
                                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                                <div className={cn(
                                                    "h-full rounded-full transition-all",
                                                    risk.level === 'High' ? 'bg-red-500 w-[80%]' :
                                                        risk.level === 'Medium' ? 'bg-amber-500 w-[50%]' : 'bg-emerald-500 w-[20%]'
                                                )} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[18px] font-bold text-foreground mb-6">
                                    Compliance & Standards
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {['CE Marking', 'UKCA Certification', 'Machine Directive 2006/42/EC', 'EMC Directive'].map(cert => (
                                        <div key={cert} className="flex items-center justify-between p-4 bg-background border border-border">
                                            <span className="text-sm font-medium">{cert}</span>
                                            <input type="checkbox" className="w-4 h-4 rounded-none border-border" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-[18px] font-bold text-foreground">
                                        Team Assignment
                                    </h3>
                                    <button className="text-[11px] font-medium text-primary hover:underline">+ Add Role</button>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { role: 'Mechanical Engineer', status: 'Pending', color: 'text-amber-500' },
                                        { role: 'Electrical Lead', status: 'Unassigned', color: 'text-red-500' },
                                        { role: 'Software Developer', status: 'Proposed', color: 'text-blue-500' },
                                    ].map((role) => (
                                        <div key={role.role} className="flex items-center justify-between p-4 bg-background border border-border group hover:border-primary/50 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{role.role}</p>
                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Standard CNC Protocol</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className={cn("text-[10px] font-bold uppercase tracking-widest", role.color)}>
                                                    • {role.status}
                                                </span>
                                                <button className="h-8 px-4 border border-border text-[9px] font-bold uppercase hover:bg-muted transition-all">
                                                    Assign Member
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>

            {/* Postman-style Status Bar */}
            {/* <div className="bg-card border-t border-border px-4 py-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                        <Boxes className="w-4 h-4" />
                        Collection: CNC Manufacturing
                    </div>
                </div>
                <div className="flex items-center gap-3 text-[12px] font-medium">
                    <span className="text-muted-foreground">Strategic sync active</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
            </div> */}
        </div>
    );
};
