import { useState } from 'react';
import { ClipboardList, CheckCircle2, Clock, AlertCircle, Calendar, User, Filter, BarChart3, ListTodo } from 'lucide-react';
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

const TasksSidebar = ({
    isCollapsed,
    onSelectCategory,
    onNewTask
}: {
    isCollapsed: boolean;
    onSelectCategory: (id: string) => void;
    onNewTask?: () => void;
}) => {
    const [activeCategory, setActiveCategory] = useState('all');

    const categories: SidebarItem[] = [
        { id: 'all', name: 'All Tasks', icon: ClipboardList },
        { id: 'my-tasks', name: 'Assigned to Me', icon: User, count: 5 },
        { id: 'upcoming', name: 'Upcoming', icon: Calendar, count: 12 },
        { id: 'overdue', name: 'Overdue', icon: AlertCircle, count: 2 },
        { id: 'completed', name: 'Completed', icon: CheckCircle2 },
    ];

    const priorities: SidebarItem[] = [
        { id: 'critical', name: 'Critical Priority' },
        { id: 'high', name: 'High Priority' },
        { id: 'medium', name: 'Medium Priority' },
        { id: 'low', name: 'Low Priority' },
    ];

    return (
        <SidebarContainer isCollapsed={isCollapsed}>
            <SidebarHeader
                title="Task Center"
                icon={ClipboardList}
                actions={
                    <SidebarActionButton
                        label="New"
                        variant="secondary"
                        onClick={onNewTask}
                        className="w-14 h-6 text-[9px] bg-secondary/30 border-none hover:bg-secondary/50"
                    />
                }
            />

            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-sidebar-border bg-sidebar/10">
                <button
                    className="p-1 hover:bg-sidebar-accent rounded-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    title="New Task"
                    onClick={onNewTask}
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 w-3.5 h-3.5" />
                    <input
                        type="text"
                        placeholder="Search tasks"
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
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setActiveCategory(cat.id);
                                onSelectCategory(cat.id);
                            }}
                            className={cn(
                                "w-full flex items-center justify-between h-11 hover:bg-sidebar-accent/50 text-sm transition-colors border-l-2 shrink-0 px-3",
                                activeCategory === cat.id ? "bg-primary/5 border-primary text-primary font-bold" : "border-transparent text-sidebar-foreground"
                            )}
                        >
                            <div className="flex items-center gap-2.5">
                                {cat.icon && <cat.icon className={cn("w-4 h-4", activeCategory === cat.id ? "text-primary" : "text-muted-foreground")} />}
                                <span className="font-semibold tracking-tight">{cat.name}</span>
                            </div>
                            {cat.count !== undefined && (
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-sm font-medium",
                                    cat.id === 'overdue' ? 'bg-red-500/10 text-red-500' : 'bg-muted/50 text-muted-foreground'
                                )}>
                                    {cat.count}
                                </span>
                            )}
                        </button>
                    ))}

                    {/* <div className="mt-4 px-3 mb-2">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Priority Levels</h3>
                    </div> */}

                    {/* {priorities.map((p) => (
                        <button
                            key={p.id}
                            className={cn(
                                "w-full flex items-center justify-between py-2 hover:bg-sidebar-accent/50 text-[13px] transition-colors border-l-2 shrink-0 px-3",
                                "border-transparent text-sidebar-foreground font-medium"
                            )}
                        >
                            <div className="flex items-center gap-2.5 text-muted-foreground hover:text-sidebar-primary transition-colors">
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    p.id === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                                        p.id === 'high' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' :
                                            p.id === 'medium' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' :
                                                'bg-slate-400'
                                )} />
                                <span className="truncate">{p.name}</span>
                            </div>
                        </button>
                    ))} */}
                </div>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border bg-sidebar/20 p-2">
                <SidebarActionButton label="Quick Reports" variant="ghost" icon={BarChart3} className="h-9 justify-start px-2 font-semibold text-[12px] border-none" />
            </SidebarFooter>
        </SidebarContainer>
    );
};

export default TasksSidebar;
