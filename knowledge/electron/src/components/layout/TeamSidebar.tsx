
import { useState } from 'react';
import { Users, UserPlus, Clock, Shield, Search, ChevronRight, Activity, Filter, BarChart3 } from 'lucide-react';
import {
    SidebarContainer,
    SidebarHeader,
    SidebarActionButton,
    SidebarContent,
    SidebarFooter
} from './SidebarLayout';
import { cn } from '@/lib/utils';
import { SearchIcon, PlusIcon } from '../shared/icons/PostmanIcons';

interface SidebarItem {
    id: string;
    name: string;
    count?: number;
    icon?: React.ComponentType<{ className?: string }>;
    accent?: string;
}

import { teamMembers } from "@/data/mockData-old";

const TeamSidebar = ({
    isCollapsed,
    onSelectRole,
    onInvite
}: {
    isCollapsed: boolean;
    onSelectRole: (id: string) => void;
    onInvite?: () => void;
}) => {
    const [activeTab, setActiveTab] = useState('all');

    const getGroupCount = (group: string) => teamMembers.filter(m => m.group === group).length;
    const getWorkloadCount = (workload: string) => teamMembers.filter(m => m.workload === workload).length;
    const getIssueCount = () => teamMembers.filter(m => m.issues > 0).length;

    const roleGroups: SidebarItem[] = [
        { id: 'all', name: 'Whole Team', icon: Users, count: teamMembers.length },
        { id: 'mgmt', name: 'Management', icon: Shield, count: getGroupCount('mgmt') },
        { id: 'eng', name: 'Engineering', icon: Activity, count: getGroupCount('eng') },
    ];

    const healthFilters: SidebarItem[] = [
        { id: 'high', name: 'High Workload', count: getWorkloadCount('high'), accent: 'bg-red-500' },
        { id: 'available', name: 'Available', count: teamMembers.filter(m => m.status !== 'busy').length, accent: 'bg-emerald-500' },
        { id: 'issues', name: 'Active Issues', count: getIssueCount(), accent: 'bg-amber-500' },
    ];

    return (
        <SidebarContainer isCollapsed={isCollapsed}>
            <SidebarHeader
                title="Resources"
                icon={Users}
                actions={
                    <SidebarActionButton
                        label="Invite"
                        variant="secondary"
                        onClick={onInvite}
                        className="w-16 h-6 text-[9px] bg-secondary/30 border-none hover:bg-secondary/50"
                    />
                }
            />

            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-sidebar-border bg-sidebar/10">
                <button
                    className="p-1 hover:bg-sidebar-accent rounded-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    title="Quick Add"
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 w-3.5 h-3.5" />
                    <input
                        type="text"
                        placeholder="Search members..."
                        className="w-full h-8 pl-8 pr-2 bg-transparent text-[12px] focus:outline-none placeholder:text-muted-foreground/40 transition-colors font-medium"
                    />
                </div>
            </div>

            <SidebarContent className="px-0 pb-0 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
                    {/* Groups */}
                    {roleGroups.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                onSelectRole(tab.id);
                            }}
                            className={cn(
                                "w-full flex items-center justify-between h-11 hover:bg-sidebar-accent/50 text-sm transition-colors border-l-2 shrink-0 px-3",
                                activeTab === tab.id ? "bg-primary/5 border-primary text-primary font-bold" : "border-transparent text-sidebar-foreground"
                            )}
                        >
                            <div className="flex items-center gap-2.5">
                                {tab.icon && <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-primary" : "text-muted-foreground")} />}
                                <span className="font-semibold tracking-tight">{tab.name}</span>
                            </div>
                            {tab.count !== undefined && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium bg-muted/50 text-muted-foreground">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}

                    <div className="h-px bg-sidebar-border mx-3 my-2 opacity-50" />

                    {/* Operational Health Section */}
                    <div className="px-3 py-3 space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-semibold text-muted-foreground tracking-tight px-1 mb-2">Resource Health</h3>
                            {healthFilters.map((filter) => (
                                <button
                                    key={filter.id}
                                    className="w-full h-8 flex items-center justify-between px-2 hover:bg-sidebar-accent/50 rounded-sm transition-colors group"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", filter.accent)} />
                                        <span className="text-xs font-semibold text-sidebar-foreground">{filter.name}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground/40">{filter.count}</span>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2 pt-2">
                            <h3 className="text-[10px] font-semibold text-muted-foreground tracking-tight px-1 mb-2">Utilization View</h3>
                            <button className="w-full h-8 flex items-center justify-between px-3 bg-muted/20 border border-sidebar-border rounded-sm hover:bg-muted/30 transition-colors group">
                                <span className="text-xs font-semibold text-sidebar-foreground">This Week</span>
                                <Clock className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </button>
                        </div>
                    </div>
                </div>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border bg-sidebar/20 p-2">
                <SidebarActionButton label="Capacity Planning" icon={BarChart3} variant="ghost" className="h-9 justify-start px-2 font-semibold text-[12px] border-none" />
            </SidebarFooter>
        </SidebarContainer>
    );
};

export default TeamSidebar;
