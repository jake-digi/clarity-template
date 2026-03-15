
import { useState } from 'react';
import { HeartPulse, ShieldCheck, AlertCircle, Clock, Search, Filter, Plus, FileText, ListChecks } from 'lucide-react';
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

const HSSidebar = ({
    isCollapsed,
    onSelectCategory,
    onNewIncident
}: {
    isCollapsed: boolean;
    onSelectCategory: (id: string) => void;
    onNewIncident?: () => void;
}) => {
    const [activeCategory, setActiveCategory] = useState('all');

    const categories: SidebarItem[] = [
        { id: 'all', name: 'All Incidents', icon: HeartPulse },
        { id: 'open', name: 'Open Issues', icon: AlertCircle, count: 2 },
        { id: 'in_progress', name: 'Investigating', icon: Search, count: 1 },
        { id: 'resolved', name: 'Resolved', icon: ListChecks },
    ];

    const resources: SidebarItem[] = [
        { id: 'rams', name: 'RAMS Register', icon: FileText },
        { id: 'inductions', name: 'Site Inductions' },
        { id: 'permits', name: 'Hot Work Permits' },
    ];

    return (
        <SidebarContainer isCollapsed={isCollapsed}>
            <SidebarHeader
                title="Health & Safety"
                icon={HeartPulse}
                actions={
                    <SidebarActionButton
                        label="Report"
                        variant="secondary"
                        onClick={onNewIncident}
                        className="w-16 h-6 text-[9px] bg-secondary/30 border-none hover:bg-secondary/50"
                    />
                }
            />

            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-sidebar-border bg-sidebar/10">
                <button
                    className="p-1 hover:bg-sidebar-accent rounded-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    title="Report Incident"
                    onClick={onNewIncident}
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 w-3.5 h-3.5" />
                    <input
                        type="text"
                        placeholder="Search logs"
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
                                    cat.id === 'open' ? 'bg-red-500/10 text-red-500' : 'bg-muted/50 text-muted-foreground'
                                )}>
                                    {cat.count}
                                </span>
                            )}
                        </button>
                    ))}

                    <div className="mt-4 px-3 mb-2">
                        <h3 className="text-[10px] font-semibold text-muted-foreground tracking-tight">Compliance</h3>
                    </div>

                    {resources.map((t) => (
                        <button
                            key={t.id}
                            className={cn(
                                "w-full flex items-center justify-between py-2 hover:bg-sidebar-accent/50 text-[13px] transition-colors border-l-2 shrink-0 px-3",
                                "border-transparent text-sidebar-foreground font-medium"
                            )}
                        >
                            <div className="flex items-center gap-2.5 text-muted-foreground hover:text-sidebar-primary transition-colors">
                                {t.icon ? <t.icon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                <span className="truncate">{t.name}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border bg-sidebar/20 p-2">
                <SidebarActionButton label="H&S Policy" variant="ghost" icon={Plus} className="h-9 justify-start px-2 font-semibold text-[12px] border-none" />
            </SidebarFooter>
        </SidebarContainer>
    );
};

export default HSSidebar;
