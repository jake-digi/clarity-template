import { useState } from 'react';
import { ShoppingCart, Truck, Clock, AlertCircle, CheckCircle2, CreditCard, Building2, Filter } from 'lucide-react';
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
import { orders } from "@/data/mockData-old";

interface SidebarItem {
    id: string;
    name: string;
    count?: number;
    icon?: React.ComponentType<{ className?: string }>;
}

interface NavButtonProps {
    id: string;
    name: string;
    icon?: React.ComponentType<{ className?: string }>;
    isActive?: boolean;
    onClick?: () => void;
    count?: number;
    accentColor?: string;
    className?: string;
}

const NavButton = ({
    name,
    icon: Icon,
    isActive,
    onClick,
    count,
    accentColor,
    className
}: NavButtonProps) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center justify-between h-11 hover:bg-sidebar-accent/50 text-sm transition-colors border-l-2 shrink-0 px-3",
            isActive ? "bg-primary/5 border-primary text-primary font-bold" : "border-transparent text-sidebar-foreground",
            className
        )}
    >
        <div className="flex items-center gap-2.5 overflow-hidden">
            {Icon && <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />}
            <span className="truncate font-semibold tracking-tight text-left">{name}</span>
        </div>
        {count !== undefined && (
            <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-sm font-medium",
                accentColor ? accentColor : 'bg-muted/50 text-muted-foreground'
            )}>
                {count}
            </span>
        )}
    </button>
);

const OrdersSidebar = ({
    isCollapsed,
    onSelectCategory,
    onNewOrder
}: {
    isCollapsed: boolean;
    onSelectCategory: (id: string) => void;
    onNewOrder?: () => void;
}) => {
    const [activeCategory, setActiveCategory] = useState('all');

    const getCount = (status: string) => orders.filter(o => o.status === status).length;

    const categories: SidebarItem[] = [
        { id: 'all', name: 'All Orders', icon: ShoppingCart, count: orders.length },
        { id: 'PENDING', name: 'Pending Approval', icon: Clock, count: getCount('PENDING') },
        { id: 'ORDERED', name: 'In Transit', icon: Truck, count: getCount('ORDERED') },
        { id: 'DELAYED', name: 'Delayed', icon: AlertCircle, count: getCount('DELAYED') },
        { id: 'RECEIVED', name: 'Received', icon: CheckCircle2, count: getCount('RECEIVED') },
    ];

    const types: SidebarItem[] = [
        { id: 'mechanical', name: 'Mechanical Components' },
        { id: 'electrical', name: 'Electrical Controls' },
        { id: 'robotics', name: 'Robotics & Automation' },
        { id: 'consumables', name: 'Site Consumables' },
    ];

    return (
        <SidebarContainer isCollapsed={isCollapsed}>
            <SidebarHeader
                title="Procurements"
                icon={ShoppingCart}
                actions={
                    <SidebarActionButton
                        label="New"
                        variant="secondary"
                        onClick={onNewOrder}
                        className="w-14 h-6 text-[9px] bg-secondary/30 border-none hover:bg-secondary/50"
                    />
                }
            />

            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-sidebar-border bg-sidebar/10">
                <button
                    className="p-1 hover:bg-sidebar-accent rounded-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    title="New Order"
                    onClick={onNewOrder}
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 w-3.5 h-3.5" />
                    <input
                        type="text"
                        placeholder="Search orders"
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
                        <NavButton
                            key={cat.id}
                            id={cat.id}
                            name={cat.name}
                            icon={cat.icon}
                            count={cat.count}
                            isActive={activeCategory === cat.id}
                            onClick={() => {
                                setActiveCategory(cat.id);
                                onSelectCategory(cat.id);
                            }}
                            accentColor={cat.id === 'DELAYED' ? 'bg-red-500/10 text-red-500' : undefined}
                        />
                    ))}

                    <div className="mt-4 px-3 mb-2">
                        <h3 className="text-[10px] font-semibold text-muted-foreground tracking-tight">Cost Centers</h3>
                    </div>

                    {types.map((t) => (
                        <NavButton
                            key={t.id}
                            id={t.id}
                            name={t.name}
                            icon={Building2}
                        // Using standard styling for cost centers as well
                        />
                    ))}
                </div>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border bg-sidebar/20 p-2">
                <SidebarActionButton label="Payment Settings" variant="ghost" icon={CreditCard} className="h-9 justify-start px-2 font-semibold text-[12px] border-none" />
            </SidebarFooter>
        </SidebarContainer>
    );
};

export default OrdersSidebar;

