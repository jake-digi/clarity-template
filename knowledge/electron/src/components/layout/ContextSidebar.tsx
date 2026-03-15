import {
    SidebarContainer,
    SidebarHeader,
    SidebarContent
} from './SidebarLayout';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SidebarItem {
    id: string;
    label: string;
    icon: LucideIcon;
    action?: () => void;
    isActive?: boolean;
}

interface ContextSidebarProps {
    title: string;
    icon: any; // Using any for flexibility with PostmanIcons or Lucide
    items: SidebarItem[];
    isCollapsed: boolean;
    onItemClick?: (id: string) => void;
}

const NavButton = ({ item, onClick }: { item: SidebarItem, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors border-l-2 hover:bg-sidebar-accent/50",
            item.isActive
                ? "bg-primary/5 text-primary border-primary font-bold"
                : "text-sidebar-foreground border-transparent"
        )}
    >
        <item.icon
            className={cn(
                "w-4 h-4 shrink-0",
                item.isActive ? "text-primary" : "text-muted-foreground"
            )}
        />
        <span className="truncate font-medium">{item.label}</span>
    </button>
);

const ContextSidebar = ({
    title,
    icon: HeaderIcon,
    items,
    isCollapsed,
    onItemClick
}: ContextSidebarProps) => {
    return (
        <SidebarContainer isCollapsed={isCollapsed}>
            <SidebarHeader
                title={title}
                icon={HeaderIcon}
            />
            <SidebarContent className="px-0 py-2">
                <div className="flex flex-col gap-0.5">
                    {items.map((item) => (
                        <NavButton
                            key={item.id}
                            item={item}
                            onClick={() => {
                                if (item.action) item.action();
                                if (onItemClick) onItemClick(item.id);
                            }}
                        />
                    ))}
                </div>
            </SidebarContent>
        </SidebarContainer>
    );
};

export default ContextSidebar;
