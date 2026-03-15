
import { useState } from 'react';
import { AlertTriangle, Shield, CheckCircle2, History, Filter, Plus, Search, ChevronRight } from 'lucide-react';
import {
    PlusIcon,
    SearchIcon,
} from '../shared/icons/PostmanIcons';
import {
    SidebarContainer,
    SidebarHeader,
    SidebarActionButton,
    SidebarContent,
    SidebarFooter
} from './SidebarLayout';
import { cn } from '@/lib/utils';

interface SidebarItem {
    id: string;
    name: string;
    count?: number;
    icon?: React.ComponentType<{ className?: string }>;
}

const RisksSidebar = ({
    isCollapsed,
    onSelectCategory,
    onNewRisk
}: {
    isCollapsed: boolean;
    onSelectCategory: (id: string) => void;
    onNewRisk?: () => void;
}) => {
    const [activeTab, setActiveTab] = useState('all');

    const mainTabs: SidebarItem[] = [
        { id: 'all', name: 'All Risks', icon: AlertTriangle },
        { id: 'open', name: 'Open', icon: Shield, count: 5 },
        { id: 'closed', name: 'Closed', icon: CheckCircle2, count: 2 },
    ];

    return (
        <SidebarContainer isCollapsed={isCollapsed}>
            <SidebarHeader
                title="Risk Register"
                icon={AlertTriangle}
                actions={
                    <SidebarActionButton
                        label="Log"
                        variant="secondary"
                        onClick={onNewRisk}
                        className="w-16 h-6 text-[9px] bg-secondary/30 border-none hover:bg-secondary/50"
                    />
                }
            />

            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-sidebar-border bg-sidebar/10">
                <button
                    className="p-1 hover:bg-sidebar-accent rounded-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    title="Log Risk"
                    onClick={onNewRisk}
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 w-3.5 h-3.5" />
                    <input
                        type="text"
                        placeholder="Search risk ID..."
                        className="w-full h-8 pl-8 pr-2 bg-transparent text-[12px] focus:outline-none placeholder:text-muted-foreground/40 transition-colors font-medium"
                    />
                </div>
            </div>

            <SidebarContent className="px-0 pb-0 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
                    {/* Navigation */}
                    {mainTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                onSelectCategory(tab.id);
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
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-sm font-medium",
                                    tab.id === 'open' ? 'bg-orange-500/10 text-orange-500' : 'bg-muted/50 text-muted-foreground'
                                )}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}

                    <div className="h-px bg-sidebar-border mx-3 my-2 opacity-50" />

                    {/* Quick Filters Section */}
                    <div className="px-3 py-3 space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-semibold text-muted-foreground tracking-tight px-1 mb-1">
                                Project
                            </h3>
                            <button className="w-full h-8 flex items-center justify-between px-3 bg-muted/20 border border-sidebar-border rounded-sm hover:bg-muted/30 transition-colors group">
                                <span className="text-xs font-semibold text-sidebar-foreground">All Projects</span>
                                <Filter className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-[10px] font-semibold text-muted-foreground tracking-tight px-1 mb-1">Risk Category</h3>
                            <button className="w-full h-8 flex items-center justify-between px-3 bg-muted/20 border border-sidebar-border rounded-sm hover:bg-muted/30 transition-colors group">
                                <span className="text-xs font-semibold text-sidebar-foreground">All Categories</span>
                                <Filter className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-[10px] font-semibold text-muted-foreground tracking-tight px-1 mb-1">Risk Score</h3>
                            <button className="w-full h-8 flex items-center justify-between px-3 bg-muted/20 border border-sidebar-border rounded-sm hover:bg-muted/30 transition-colors group">
                                <span className="text-xs font-semibold text-sidebar-foreground text-left truncate pr-2">All Scores (0-25)</span>
                                <Filter className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
                            </button>
                        </div>

                        <button className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors mt-6 border border-dashed border-sidebar-border/50 rounded-sm hover:border-primary/30">
                            <History className="w-3 h-3" />
                            Clear Filters
                        </button>
                    </div>
                </div>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border bg-sidebar/20 p-2">
                <SidebarActionButton label="Revision History" variant="ghost" className="h-9 justify-start px-2 font-semibold text-[12px] border-none" />
            </SidebarFooter>
        </SidebarContainer>
    );
};

export default RisksSidebar;
