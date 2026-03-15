import { useState } from 'react';
import {
    BarChart3,
    FileText,
    Folder,
    FolderOpen,
    Clock,
    Timer,
    Settings2,
    Filter,
    ChevronRight,
    Search
} from 'lucide-react';
import {
    PlusIcon,
    SearchIcon,
    ChevronDownIcon
} from '../shared/icons/PostmanIcons';
import {
    SidebarContainer,
    SidebarHeader,
    SidebarActionButton,
    SidebarContent,
    SidebarFooter
} from './SidebarLayout';
import { cn } from '@/lib/utils';

interface CollectionItem {
    id: string;
    name: string;
    type: 'folder' | 'item';
    children?: CollectionItem[];
    expanded?: boolean;
}

const CollectionTreeItem = ({
    item,
    level = 0,
    onToggle,
    onSelect,
    activeId
}: {
    item: CollectionItem;
    level?: number;
    onToggle: (id: string) => void;
    onSelect: (item: { id: string, name: string }) => void;
    activeId?: string;
}) => {
    const paddingLeft = 12 + level * 14;
    const isExpanded = item.expanded;
    const isActive = activeId === item.id;

    if (item.type === 'folder') {
        return (
            <div>
                <button
                    onClick={() => onToggle(item.id)}
                    className={cn(
                        "w-full flex items-center gap-2.5 hover:bg-sidebar-accent/50 text-sm transition-colors border-l-2",
                        level === 0 ? "h-11" : "h-8",
                        "border-transparent text-sidebar-foreground"
                    )}
                    style={{ paddingLeft }}
                >
                    <div className="w-4 h-4 flex items-center justify-center -ml-1">
                        {isExpanded ? (
                            <ChevronDownIcon className="w-2.5 h-2.5 opacity-60" />
                        ) : (
                            <ChevronRight className="w-2.5 h-2.5 opacity-60" />
                        )}
                    </div>
                    <div className="flex-shrink-0">
                        {isExpanded ? <FolderOpen className="w-4 h-4 text-primary" /> : <Folder className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <span className={cn(
                        "truncate",
                        level > 0 ? "text-[11px] font-medium text-muted-foreground" : "text-[13px] font-semibold"
                    )}>{item.name}</span>
                </button>
                {isExpanded && item.children && (
                    <div className="relative">
                        {item.children.map((child) => (
                            <CollectionTreeItem
                                key={child.id}
                                item={child}
                                level={level + 1}
                                onToggle={onToggle}
                                onSelect={onSelect}
                                activeId={activeId}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={() => onSelect({ id: item.id, name: item.name })}
            className={cn(
                "w-full flex items-center gap-2.5 hover:bg-sidebar-accent/50 text-sm transition-colors border-l-2 px-3",
                level === 0 ? "h-11" : "h-8",
                isActive ? "bg-primary/5 border-primary text-primary font-bold" : "border-transparent text-sidebar-foreground"
            )}
            style={{ paddingLeft: paddingLeft + 16 }}
        >
            <FileText className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
            <span className={cn(
                "truncate",
                level > 0 ? "text-[12px] font-normal" : "text-[13px] font-medium"
            )}>{item.name}</span>
        </button>
    );
};

const ReportsSidebar = ({
    isCollapsed,
    onSelectReport,
    onCreateReport
}: {
    isCollapsed: boolean;
    onSelectReport: (report: { id: string, name: string }) => void;
    onCreateReport?: () => void;
}) => {
    const [activeId, setActiveId] = useState<string | undefined>();
    const [sections, setSections] = useState<CollectionItem[]>([
        {
            id: 'favorites',
            name: 'Favorites',
            type: 'folder',
            expanded: true,
            children: [
                { id: 'f1', name: 'Daily Pulse', type: 'item' },
                { id: 'f2', name: 'Critical Risks', type: 'item' },
            ],
        },
        {
            id: 'templated',
            name: 'Templates',
            type: 'folder',
            expanded: true,
            children: [
                { id: 't1', name: 'Performance Audit', type: 'item' },
                { id: 't2', name: 'Resource Matrix', type: 'item' },
                { id: 't3', name: 'Timeline Forecast', type: 'item' },
            ],
        },
    ]);

    const toggleFolder = (id: string) => {
        const toggleInTree = (items: CollectionItem[]): CollectionItem[] => {
            return items.map((item) => {
                if (item.id === id) {
                    return { ...item, expanded: !item.expanded };
                }
                if (item.children) {
                    return { ...item, children: toggleInTree(item.children) };
                }
                return item;
            });
        };
        setSections(toggleInTree(sections));
    };

    const handleSelect = (item: { id: string, name: string }) => {
        setActiveId(item.id);
        onSelectReport(item);
    };

    return (
        <SidebarContainer isCollapsed={isCollapsed}>
            <SidebarHeader
                title="Reports"
                icon={BarChart3}
                actions={
                    <SidebarActionButton
                        label="New"
                        variant="secondary"
                        onClick={onCreateReport}
                        className="w-14 h-6 text-[9px] bg-secondary/30 border-none hover:bg-secondary/50"
                    />
                }
            />

            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-sidebar-border bg-sidebar/10">
                <button
                    className="p-1 hover:bg-sidebar-accent rounded-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    title="New Report"
                    onClick={onCreateReport}
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 w-3.5 h-3.5" />
                    <input
                        type="text"
                        placeholder="Search reports"
                        className="w-full h-8 pl-8 pr-2 bg-transparent text-[12px] focus:outline-none placeholder:text-muted-foreground/40 transition-colors font-medium"
                    />
                </div>
                <button
                    className="p-1 hover:bg-sidebar-accent rounded-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 group"
                    title="Filters"
                >
                    <Filter className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>

            <SidebarContent className="px-0 pb-0 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
                    <div className="mb-2">
                        <button className={cn(
                            "w-full flex items-center justify-between h-11 hover:bg-sidebar-accent/50 text-sm transition-colors border-l-2 shrink-0 px-3",
                            "border-transparent text-sidebar-foreground"
                        )}>
                            <div className="flex items-center gap-2.5">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="font-semibold tracking-tight">Recent Reports</span>
                            </div>
                        </button>
                        <button className={cn(
                            "w-full flex items-center justify-between h-11 hover:bg-sidebar-accent/50 text-sm transition-colors border-l-2 shrink-0 px-3",
                            "border-transparent text-sidebar-foreground"
                        )}>
                            <div className="flex items-center gap-2.5">
                                <Timer className="w-4 h-4 text-muted-foreground" />
                                <span className="font-semibold tracking-tight">Real-time Data</span>
                            </div>
                        </button>
                    </div>

                    {sections.map((section) => (
                        <CollectionTreeItem
                            key={section.id}
                            item={section}
                            onToggle={toggleFolder}
                            onSelect={handleSelect}
                            activeId={activeId}
                        />
                    ))}
                </div>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border bg-sidebar/20 p-2">
                <SidebarActionButton label="Report Settings" variant="ghost" icon={Settings2} className="h-9 justify-start px-2 font-semibold text-[12px] border-none" />
            </SidebarFooter>
        </SidebarContainer>
    );
};

export default ReportsSidebar;

