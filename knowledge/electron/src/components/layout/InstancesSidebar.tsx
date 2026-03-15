
import { useState } from 'react';
import {
    Folder,
    FileText,
    BarChart3,
    Box,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Archive,
    Boxes,
    Award,
    CheckCircle,
    Archive as ArchiveIcon,
    Play,
    Trash2
} from 'lucide-react';
import {
    PlusIcon,
    SearchIcon
} from '../shared/icons/PostmanIcons';
import {
    SidebarContainer,
    SidebarHeader,
    SidebarActionButton,
    SidebarContent
} from './SidebarLayout';
import { type InstanceItem } from '@/data/mockData-old';
import { cn } from '@/lib/utils';
import { useInstances, useUpdateInstance, useDeleteInstance } from '@/hooks/useInstances';
import { useAuth } from '@/components/auth-provider';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from 'sonner';

interface NavButtonProps {
    id: string;
    name: string;
    subtitle?: string;
    icon: any;
    isActive?: boolean;
    onClick: () => void;
    showChevron?: boolean;
    isExpanded?: boolean;
    hasDot?: boolean;
    count?: number;
    level?: number;
    className?: string;
}

const NavButton = ({
    id,
    name,
    subtitle,
    icon: Icon,
    isActive,
    onClick,
    showChevron,
    isExpanded,
    hasDot,
    count,
    level = 0,
    className
}: NavButtonProps) => (
    <button
        id={id}
        onClick={onClick}
        className={cn(
            "w-full flex items-center justify-between min-h-[44px] py-1.5 hover:bg-sidebar-accent/50 text-sm transition-colors border-l-2 shrink-0 px-3",
            isActive ? "bg-primary/5 font-bold border-primary" : "border-transparent text-sidebar-foreground",
            className
        )}
        style={{
            paddingLeft: level > 0 ? `${12 + level * 14}px` : undefined
        }}
    >
        <div className="flex items-center gap-2.5 overflow-hidden">
            {showChevron ? (
                <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0 -ml-1">
                    {isExpanded ? <ChevronDown className="w-3 h-3 opacity-60" /> : <ChevronRight className="w-3 h-3 opacity-60" />}
                </div>
            ) : (
                level > 0 && (
                    <div
                        className="w-1.5 h-1.5 rounded-full shrink-0 opacity-20 bg-current"
                    />
                )
            )}

            <Icon
                className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")}
            />
            <div className="flex flex-col items-start overflow-hidden">
                <span className="truncate font-semibold tracking-tight text-left leading-tight">{name}</span>
                {subtitle && (
                    <span className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">{subtitle}</span>
                )}
            </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
            {count !== undefined && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium bg-muted/50 text-muted-foreground">
                    {count}
                </span>
            )}
        </div>
    </button>
);

const InstancesSidebar = ({
    isCollapsed,
    onSelectInstance,
    onNewInstance,
    currentInstanceId
}: {
    isCollapsed: boolean;
    onSelectInstance: (instance: { id: string, name: string }) => void;
    onNewInstance?: () => void;
    currentInstanceId?: string;
}) => {
    const [isActiveExpanded, setIsActiveExpanded] = useState(true);
    const [isDraftsExpanded, setIsDraftsExpanded] = useState(false);
    const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
    const [isArchivedExpanded, setIsArchivedExpanded] = useState(false);

    const { user } = useAuth();
    const { data: instancesData } = useInstances(user?.tenant_id);
    const updateInstance = useUpdateInstance();
    const deleteInstance = useDeleteInstance();

    const transformInstance = (inst: any, status: string): InstanceItem & { status: string } => {
        const startDate = inst.start_date ? new Date(inst.start_date) : null;
        const endDate = inst.end_date ? new Date(inst.end_date) : null;

        let dateStr = '';
        if (startDate && endDate) {
            dateStr = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else if (startDate) {
            dateStr = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

        return {
            id: inst.id,
            name: inst.name,
            date: dateStr,
            isDofe: inst.settings?.type === 'dofe' || inst.settings?.isDofe,
            status: status
        };
    };

    const activeInstanceItems = (instancesData?.active || []).concat(instancesData?.upcoming || []).map(inst => transformInstance(inst, 'active'));
    const draftInstanceItems = (instancesData?.draft || []).map(inst => transformInstance(inst, 'draft'));
    const completedInstanceItems = (instancesData?.completed || []).map(inst => transformInstance(inst, 'completed'));
    const archivedInstanceItems = (instancesData?.archived || []).map(inst => transformInstance(inst, 'archived'));

    const handleUpdateStatus = async (id: string, status: string, name: string) => {
        try {
            await updateInstance.mutateAsync({
                id,
                updates: { status: status as any }
            });
            toast.success(`Instance "${name}" marked as ${status}`);
        } catch (error) {
            console.error('Failed to update instance:', error);
            toast.error(`Failed to mark instance as ${status}`);
        }
    };

    const handleDeleteInstance = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete instance "${name}"? This action cannot be undone.`)) return;
        try {
            await deleteInstance.mutateAsync(id);
            toast.success(`Instance "${name}" deleted`);
        } catch (error) {
            console.error('Failed to delete instance:', error);
            toast.error(`Failed to delete instance "${name}"`);
        }
    };

    const InstanceWithContextMenu = ({ instance, level = 1 }: { instance: InstanceItem & { status: string }, level?: number }) => (
        <ContextMenu>
            <ContextMenuTrigger>
                <NavButton
                    id={instance.id}
                    name={instance.name}
                    subtitle={instance.date}
                    icon={instance.isDofe ? Award : (instance.status === 'draft' ? FileText : (instance.status === 'completed' ? CheckCircle2 : (instance.status === 'archived' ? Archive : Box)))}
                    isActive={currentInstanceId === instance.id}
                    level={level}
                    onClick={() => onSelectInstance({ id: instance.id, name: instance.name })}
                />
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56">
                <ContextMenuItem onClick={() => onSelectInstance({ id: instance.id, name: instance.name })}>
                    <Play className="mr-2 h-4 w-4" />
                    <span>Open Dashboard</span>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                    onClick={() => handleUpdateStatus(instance.id, 'active', instance.name)}
                    disabled={instance.status === 'active'}
                >
                    <Play className="mr-2 h-4 w-4" />
                    <span>Mark as Active</span>
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={() => handleUpdateStatus(instance.id, 'completed', instance.name)}
                    disabled={instance.status === 'completed'}
                >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span>Mark as Completed</span>
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={() => handleUpdateStatus(instance.id, 'archived', instance.name)}
                    disabled={instance.status === 'archived'}
                >
                    <ArchiveIcon className="mr-2 h-4 w-4" />
                    <span>Mark as Archived</span>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDeleteInstance(instance.id, instance.name)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Instance</span>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );

    return (
        <SidebarContainer isCollapsed={isCollapsed}>
            <SidebarHeader
                title="Instances"
                icon={Boxes}
                actions={
                    <SidebarActionButton
                        label="New"
                        variant="secondary"
                        onClick={onNewInstance}
                        className="w-14 h-6 text-[9px] bg-secondary/30 border-none hover:bg-secondary/50"
                    />
                }
            />

            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-sidebar-border bg-sidebar/10">
                <button
                    className="p-1 hover:bg-sidebar-accent rounded-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    title="New Instance"
                    onClick={onNewInstance}
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 w-3.5 h-3.5" />
                    <input
                        type="text"
                        placeholder="Search instances..."
                        className="w-full h-8 pl-8 pr-2 bg-transparent text-[12px] focus:outline-none placeholder:text-muted-foreground/40 transition-colors font-medium"
                    />
                </div>
            </div>

            <SidebarContent className="px-0 pb-0 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
                    <NavButton
                        id="active"
                        name="Active Instances"
                        icon={Folder}
                        showChevron
                        isExpanded={isActiveExpanded}
                        count={activeInstanceItems.length}
                        onClick={() => setIsActiveExpanded(!isActiveExpanded)}
                    />
                    <div className="space-y-0">
                        {isActiveExpanded && activeInstanceItems.map((instance) => (
                            <InstanceWithContextMenu key={instance.id} instance={instance} />
                        ))}
                    </div>
                </div>

                <div className="border-t border-sidebar-border bg-sidebar/5 shrink-0">
                    <NavButton
                        id="drafts"
                        name="Draft Instances"
                        icon={Folder}
                        showChevron
                        isExpanded={isDraftsExpanded}
                        count={draftInstanceItems.length}
                        onClick={() => setIsDraftsExpanded(!isDraftsExpanded)}
                    />
                    {isDraftsExpanded && draftInstanceItems.map(instance => (
                        <InstanceWithContextMenu key={instance.id} instance={instance} />
                    ))}

                    <NavButton
                        id="completed"
                        name="Completed Instances"
                        icon={CheckCircle2}
                        showChevron
                        isExpanded={isCompletedExpanded}
                        count={completedInstanceItems.length}
                        onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                    />
                    {isCompletedExpanded && completedInstanceItems.map(instance => (
                        <InstanceWithContextMenu key={instance.id} instance={instance} />
                    ))}

                    <NavButton
                        id="archived"
                        name="Archived Instances"
                        icon={Archive}
                        showChevron
                        isExpanded={isArchivedExpanded}
                        count={archivedInstanceItems.length}
                        onClick={() => setIsArchivedExpanded(!isArchivedExpanded)}
                    />
                    {isArchivedExpanded && archivedInstanceItems.map(instance => (
                        <InstanceWithContextMenu key={instance.id} instance={instance} />
                    ))}
                </div>
            </SidebarContent>
        </SidebarContainer>
    );
};

export default InstancesSidebar;
