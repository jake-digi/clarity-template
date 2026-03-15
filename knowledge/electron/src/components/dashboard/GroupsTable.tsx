
import { useState, useMemo, useRef } from 'react';
import {
    Search,
    Users,
    Settings2,
    Boxes,
    Bell,
    BellOff,
    ChevronRight,
    ChevronDown,
    Plus,
    Layout,
    MoreHorizontal,
    Link,
    Unlink,
    Pencil,
    Check,
    X,
    Trash2,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InstanceWithDetails } from '@/types/database';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
    ContextMenuLabel,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent,
} from "@/components/ui/context-menu";
import { InstancesService } from '@/services/instances.service';
import { toast } from 'sonner';
import { ParticipantAssignmentModal } from './ParticipantAssignmentModal';
import { GroupCreator } from './GroupCreator';
import { supabase } from '@/lib/supabase';

interface GroupsTableProps {
    instance?: InstanceWithDetails;
    onUpdateSettings?: (settings: any) => void;
    onRefresh?: () => void;
}

export const GroupsTable = ({ instance, onUpdateSettings, onRefresh }: GroupsTableProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Rename state: { id, type, currentName }
    const [renaming, setRenaming] = useState<{ id: string; type: 'supergroup' | 'subgroup'; currentName: string } | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const renameInputRef = useRef<HTMLInputElement>(null);

    // Participant Assignment Modal State
    const [assignmentModal, setAssignmentModal] = useState<{
        isOpen: boolean;
        subgroupId: string;
        subgroupName: string;
        supergroupId: string;
    } | null>(null);

    // Use instance data if available
    const supergroups = instance?.supergroups || [];
    const subgroups = instance?.subgroups || [];

    const assignedTrackerIds = (instance?.settings?.assigned_trackers || []) as string[];
    const trackerAssociations = instance?.settings?.tracker_associations || {};

    const getAssignedTracker = (type: 'supergroup' | 'subgroup', id: string) => {
        const entry = Object.entries(trackerAssociations).find(([_, val]: [string, any]) => val.type === type && val.id === id);
        if (!entry) return null;
        const [deviceId] = entry;
        // Show the device_desc stored in tracker_associations, or fall back to the deviceId
        const assoc = (trackerAssociations as any)[deviceId];
        return { deviceId, deviceName: assoc?.device_desc || deviceId };
    };

    const handleRename = (id: string, type: 'supergroup' | 'subgroup', currentName: string) => {
        setRenaming({ id, type, currentName });
        setRenameValue(currentName);
        setTimeout(() => renameInputRef.current?.focus(), 50);
    };

    const commitRename = async () => {
        if (!renaming || !renameValue.trim() || renameValue.trim() === renaming.currentName) {
            setRenaming(null);
            return;
        }
        const table = renaming.type === 'supergroup' ? 'supergroups' : 'subgroups';
        const { error } = await supabase
            .from(table)
            .update({ name: renameValue.trim(), updated_at: new Date().toISOString() })
            .eq('id', renaming.id);

        if (error) {
            toast.error(`Failed to rename: ${error.message}`);
        } else {
            toast.success(`Renamed to "${renameValue.trim()}"`);
            onRefresh?.();
        }
        setRenaming(null);
    };

    const cancelRename = () => setRenaming(null);

    const handleDeleteGroup = async (id: string, type: 'supergroup' | 'subgroup', name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

        const table = type === 'supergroup' ? 'supergroups' : 'subgroups';
        const { error } = await supabase.from(table).delete().eq('id', id);

        if (error) {
            toast.error(`Failed to delete: ${error.message}`);
        } else {
            toast.success(`Deleted "${name}"`);
            onRefresh?.();
        }
    };

    const handleAssignTracker = async (deviceId: string, type: 'supergroup' | 'subgroup', id: string, name: string) => {
        if (!instance || !onUpdateSettings) return;

        const currentSettings = instance.settings || {};
        const currentAssociations = currentSettings.tracker_associations || {};

        // Remove existing assignment for this group if any?
        // Actually the structure is keyed by deviceId, so a device can only be assigned to ONE group.
        // But a group can have multiple trackers? NO, my structure { deviceId: { type, id } } implies Many-to-One (Many trackers to One Group? No, One Tracker to One Group).
        // Wait, if I want to query "Which tracker is assigned to Group X?", I have to iterate.
        // A group CAN have multiple trackers with this structure.

        const newAssociations = { ...currentAssociations };
        // Assign new
        newAssociations[deviceId] = { type, id, name };

        const newSettings = {
            ...currentSettings,
            tracker_associations: newAssociations
        };

        try {
            await InstancesService.update(instance.id, { settings: newSettings });
            onUpdateSettings(newSettings);
            toast.success(`Assigned tracker to ${name}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update assignment");
        }
    };

    const handleUnassignTracker = async (deviceId: string) => {
        if (!instance || !onUpdateSettings) return;
        const currentSettings = instance.settings || {};
        const currentAssociations = currentSettings.tracker_associations || {};
        const newAssociations = { ...currentAssociations };
        delete newAssociations[deviceId];

        const newSettings = {
            ...currentSettings,
            tracker_associations: newAssociations
        };

        try {
            await InstancesService.update(instance.id, { settings: newSettings });
            onUpdateSettings(newSettings);
            toast.success(`Unassigned tracker`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update assignment");
        }
    };

    const toggleGroup = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(expandedGroups);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedGroups(next);
    };

    const filteredSupergroups = useMemo(() => {
        if (!searchQuery) return supergroups;
        return supergroups.filter((sg: any) =>
            sg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sg.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, supergroups]);

    const getSubgroups = (supergroupId: string) => {
        // Handle both mock (parentSupergroupId) and DB (parent_supergroup_id) structure if they differ?
        // DB uses parent_supergroup_id
        return subgroups.filter((sub: any) => (sub.parent_supergroup_id || sub.parentSupergroupId) === supergroupId);
    };

    return (
        <div className="w-full h-full flex flex-col min-h-0 bg-background">
            {/* Toolbar */}
            <div className="flex-none flex items-center h-10 bg-background border-b border-border shadow-sm overflow-hidden">
                <div className="flex items-center border-r border-border h-full px-4 bg-muted/20 min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                    <input
                        placeholder="Search villages or units..."
                        className="bg-transparent border-none text-xs focus:ring-0 w-full placeholder:text-muted-foreground/50 font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="ml-auto flex items-center h-full">
                    <GroupCreator
                        instanceId={instance?.id || ''}
                        tenantId={instance?.tenant_id || ''}
                        supergroups={supergroups}
                        initialMode="supergroup"
                        trigger={
                            <Button variant="ghost" className="h-full px-4 text-[11px] font-bold text-primary border-l border-border hover:bg-primary/5 rounded-none transition-colors">
                                <Plus className="w-3.5 h-3.5 mr-2" />
                                New Supergroup
                            </Button>
                        }
                        onSuccess={() => {
                            toast.success("Supergroup created");
                            onRefresh?.();
                        }}
                    />
                    <GroupCreator
                        instanceId={instance?.id || ''}
                        tenantId={instance?.tenant_id || ''}
                        supergroups={supergroups}
                        initialMode="subgroup"
                        trigger={
                            <Button variant="ghost" className="h-full px-4 text-[11px] font-bold text-primary border-l border-border hover:bg-primary/5 rounded-none transition-colors">
                                <Plus className="w-3.5 h-3.5 mr-2" />
                                New Group
                            </Button>
                        }
                        onSuccess={() => {
                            toast.success("Group created");
                            onRefresh?.();
                        }}
                    />
                    <Button variant="ghost" className="h-full w-10 p-0 rounded-none border-l border-border hover:bg-muted/50 transition-colors">
                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            {/* Tree Table Header */}
            <div className="flex-none grid grid-cols-[1fr_120px_100px_100px_120px_60px] border-b border-border bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5">
                <div className="pl-6">Supergroup</div>
                <div>Type</div>
                <div className="text-center">Members</div>
                <div className="text-center">Alerts</div>
                <div>Created At</div>
                <div className="text-right">Action</div>
            </div>

            {/* Tree Table Body */}
            <div className="flex-1 overflow-auto no-scrollbar pb-20">
                {filteredSupergroups.map(sg => {
                    const subgroups = getSubgroups(sg.id);
                    const isExpanded = expandedGroups.has(sg.id);

                    return (
                        <div key={sg.id} className="flex flex-col">
                            {/* Supergroup Row */}
                            <ContextMenu>
                                <ContextMenuTrigger>
                                    <div
                                        className="grid grid-cols-[1fr_120px_100px_100px_120px_60px] items-center border-b border-border/50 bg-muted/5 py-2.5 px-4 hover:bg-muted/10 transition-colors cursor-pointer group"
                                        onClick={(e) => toggleGroup(sg.id, e)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 flex items-center justify-center text-muted-foreground transition-transform duration-200">
                                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            </div>
                                            <div className="w-7 h-7 bg-primary/10 flex items-center justify-center shrink-0">
                                                <Layout className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                {/* Rename inline */}
                                                {renaming?.id === sg.id ? (
                                                    <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
                                                        <input
                                                            ref={renameInputRef}
                                                            value={renameValue}
                                                            onChange={e => setRenameValue(e.target.value)}
                                                            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') cancelRename(); }}
                                                            className="text-sm font-bold bg-background border border-primary outline-none px-1 py-0 h-6 w-36 rounded"
                                                        />
                                                        <button onClick={commitRename} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-3.5 h-3.5" /></button>
                                                        <button onClick={cancelRename} className="p-1 text-muted-foreground hover:bg-muted rounded"><X className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-bold text-foreground truncate">{sg.name}</p>
                                                )}
                                                <p className="text-[10px] text-muted-foreground/60 font-mono tracking-tighter uppercase">{sg.id}</p>
                                            </div>
                                            {/* Display assigned tracker if any */}
                                            {(() => {
                                                const assigned = getAssignedTracker('supergroup', sg.id);
                                                if (assigned) {
                                                    return (
                                                        <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ml-2">
                                                            <Link className="w-3 h-3" />
                                                            {assigned.deviceName}
                                                        </div>
                                                    )
                                                }
                                                return null;
                                            })()}
                                        </div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{sg.type || "Village"}</div>
                                        <div className="text-center">
                                            <span className="text-xs font-mono font-bold text-muted-foreground opacity-50">-</span>
                                        </div>
                                        <div className="flex justify-center">
                                            {sg.notifications ? <Bell className="w-3.5 h-3.5 text-green-500" /> : <BellOff className="w-3.5 h-3.5 text-muted-foreground/30" />}
                                        </div>
                                        <div className="text-[10px] font-medium text-muted-foreground">{(sg as any).created_at || (sg as any).createdAt ? new Date((sg as any).created_at || (sg as any).createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : "-"}</div>
                                        <div className="flex justify-end pr-1">
                                            <button className="p-1.5 hover:bg-primary/10 text-primary transition-colors">
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                    <ContextMenuLabel>Village Actions</ContextMenuLabel>
                                    <ContextMenuItem onSelect={() => handleRename(sg.id, 'supergroup', sg.name)}>
                                        <Pencil className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                        Rename
                                    </ContextMenuItem>
                                    <ContextMenuSeparator />
                                    <ContextMenuItem onSelect={() => handleDeleteGroup(sg.id, 'supergroup', sg.name)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                                        Delete Village
                                    </ContextMenuItem>
                                    <ContextMenuSeparator />
                                    <ContextMenuSub>
                                        <ContextMenuSubTrigger>Assign Tracker</ContextMenuSubTrigger>
                                        <ContextMenuSubContent className="w-48 max-h-[300px] overflow-y-auto">
                                            {assignedTrackerIds.map(tid => {
                                                const assocName = (trackerAssociations as any)[tid]?.device_desc || tid;
                                                const isAssigned = (trackerAssociations as any)[tid]?.type === 'supergroup' && (trackerAssociations as any)[tid]?.id === sg.id;

                                                return (
                                                    <ContextMenuItem
                                                        key={tid}
                                                        onSelect={() => handleAssignTracker(tid, 'supergroup', sg.id, sg.name)}
                                                        className="text-xs"
                                                    >
                                                        {assocName}
                                                        {isAssigned && <Link className="w-3 h-3 ml-auto text-primary" />}
                                                    </ContextMenuItem>
                                                );
                                            })}
                                        </ContextMenuSubContent>
                                    </ContextMenuSub>
                                    {(() => {
                                        const assigned = getAssignedTracker('supergroup', sg.id);
                                        if (assigned) {
                                            return (
                                                <ContextMenuItem onSelect={() => handleUnassignTracker(assigned.deviceId)} className="text-red-600">
                                                    <Unlink className="w-3 h-3 mr-2" />
                                                    Unassign {assigned.deviceName}
                                                </ContextMenuItem>
                                            );
                                        }
                                        return null;
                                    })()}
                                </ContextMenuContent>
                            </ContextMenu>

                            {/* Subgroup Rows (Conditional) */}
                            {isExpanded && subgroups.map((sub: any) => (
                                <ContextMenu key={sub.id}>
                                    <ContextMenuTrigger>
                                        <div
                                            className="grid grid-cols-[1fr_120px_100px_100px_120px_60px] items-center border-b border-border/10 py-1.5 px-4 hover:bg-muted/5 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3 pl-10 relative">
                                                <div className="absolute left-7 top-0 bottom-0 w-px bg-border/40" />
                                                <div className="absolute left-7 top-1/2 -translate-y-1/2 w-2 h-px bg-border/40" />
                                                <div className="w-5 h-5 bg-muted/50 flex items-center justify-center shrink-0">
                                                    <Boxes className="w-3 h-3 text-muted-foreground/60" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-foreground truncate">{sub.name}</p>
                                                    <p className="text-[9px] text-muted-foreground/40 font-mono uppercase tracking-tighter">{sub.id}</p>
                                                </div>
                                                {/* Display assigned tracker if any */}
                                                {(() => {
                                                    const assigned = getAssignedTracker('subgroup', sub.id);
                                                    if (assigned) {
                                                        return (
                                                            <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ml-2">
                                                                <Link className="w-3 h-3" />
                                                                {assigned.deviceName}
                                                            </div>
                                                        )
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                            <div className="text-[10px] font-semibold text-muted-foreground">{sub.type || "Unit"}</div>
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Users className="w-3 h-3 text-muted-foreground/40" />
                                                <span className="text-xs font-mono font-bold text-foreground">{(sub as any).memberCount || 0}</span>
                                            </div>
                                            <div className="flex justify-center">
                                                {sub.notifications ? <Bell className="w-3 h-3 text-green-500/70" /> : <BellOff className="w-3 h-3 text-muted-foreground/20" />}
                                            </div>
                                            <div className="text-[10px] font-medium text-muted-foreground/60">{(sub as any).created_at || (sub as any).createdAt ? new Date((sub as any).created_at || (sub as any).createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : "-"}</div>
                                            <div className="flex justify-end">
                                                <button className="p-1.5 text-muted-foreground/40 hover:text-foreground transition-colors">
                                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        <ContextMenuLabel>Unit Actions</ContextMenuLabel>
                                        <ContextMenuItem onSelect={() => handleRename(sub.id, 'subgroup', sub.name)}>
                                            <Pencil className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                            Rename
                                        </ContextMenuItem>
                                        <ContextMenuSeparator />
                                        <ContextMenuItem onSelect={() => handleDeleteGroup(sub.id, 'subgroup', sub.name)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                                            Delete Unit
                                        </ContextMenuItem>
                                        <ContextMenuSeparator />
                                        <ContextMenuItem
                                            onSelect={() => setAssignmentModal({
                                                isOpen: true,
                                                subgroupId: sub.id,
                                                subgroupName: sub.name,
                                                supergroupId: sg.id
                                            })}
                                        >
                                            <Users className="w-4 h-4 mr-2" />
                                            Manage Participants
                                        </ContextMenuItem>
                                        <ContextMenuSub>
                                            <ContextMenuSubTrigger>Assign Tracker</ContextMenuSubTrigger>
                                            <ContextMenuSubContent className="w-48 max-h-[300px] overflow-y-auto">
                                                {assignedTrackerIds.map(tid => {
                                                    const assocName = (trackerAssociations as any)[tid]?.device_desc || tid;
                                                    const isAssigned = (trackerAssociations as any)[tid]?.type === 'subgroup' && (trackerAssociations as any)[tid]?.id === sub.id;

                                                    return (
                                                        <ContextMenuItem
                                                            key={tid}
                                                            onSelect={() => handleAssignTracker(tid, 'subgroup', sub.id, sub.name)}
                                                            className="text-xs"
                                                        >
                                                            {assocName}
                                                            {isAssigned && <Link className="w-3 h-3 ml-auto text-primary" />}
                                                        </ContextMenuItem>
                                                    );
                                                })}
                                            </ContextMenuSubContent>
                                        </ContextMenuSub>
                                        {(() => {
                                            const assigned = getAssignedTracker('subgroup', sub.id);
                                            if (assigned) {
                                                return (
                                                    <ContextMenuItem onSelect={() => handleUnassignTracker(assigned.deviceId)} className="text-red-600">
                                                        <Unlink className="w-3 h-3 mr-2" />
                                                        Unassign {assigned.deviceName}
                                                    </ContextMenuItem>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </ContextMenuContent>
                                </ContextMenu>
                            ))}
                        </div>
                    );
                })}

                {filteredSupergroups.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <Boxes className="w-12 h-12 mb-4 text-muted-foreground" />
                        <h3 className="text-base font-bold text-foreground">No groups found</h3>
                        <p className="text-sm text-muted-foreground mt-1">Try adjusting your search query.</p>
                    </div>
                )}
            </div>

            {/* Participant Assignment Modal */}
            {assignmentModal && (
                <ParticipantAssignmentModal
                    isOpen={assignmentModal.isOpen}
                    onClose={() => setAssignmentModal(null)}
                    subgroupId={assignmentModal.subgroupId}
                    subgroupName={assignmentModal.subgroupName}
                    supergroupId={assignmentModal.supergroupId}
                    instanceId={instance?.id || ''}
                    onSuccess={() => onRefresh?.()}
                />
            )}
        </div>
    );
};
