import React from 'react';
import { cn } from '@/lib/utils';
import { SearchIcon } from '../shared/icons/PostmanIcons';

interface SidebarLayoutProps {
    children: React.ReactNode;
    isCollapsed: boolean;
    className?: string;
}

export const SidebarContainer = ({ children, isCollapsed, className }: SidebarLayoutProps) => (
    <div className={cn(
        "bg-sidebar flex flex-col min-w-0 flex-1 h-full",
        isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-full opacity-100",
        className
    )}>
        <div className="flex flex-col h-full">
            {children}
        </div>
    </div>
);

interface SidebarHeaderProps {
    title: string;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: React.ReactNode;
    actions?: React.ReactNode;
}

export const SidebarHeader = ({ title, subtitle, icon: Icon, children, actions }: SidebarHeaderProps) => (
    <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-sidebar-foreground" />
                <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-sidebar-primary leading-tight">{title}</span>
                    {subtitle && <span className="text-[10px] font-semibold text-muted-foreground tracking-tight">{subtitle}</span>}
                </div>
            </div>
            {actions && <div className="flex items-center gap-1.5">{actions}</div>}
        </div>
        {children && <div className="mt-3 space-y-2">{children}</div>}
    </div>
);

export const SidebarSearch = ({ placeholder, value, onChange }: {
    placeholder: string;
    value?: string;
    onChange?: (val: string) => void;
}) => (
    <div className="p-2">
        <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                className="w-full h-9 pl-8 pr-3 bg-background border border-border rounded text-sm focus:outline-none placeholder:text-muted-foreground transition-colors focus:bg-accent/30 focus:ring-1 focus:ring-primary/20"
            />
        </div>
    </div>
);

interface SidebarActionButtonProps {
    label: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    icon?: React.ComponentType<{ className?: string }>;
    className?: string;
}

export const SidebarActionButton = ({ label, onClick, variant = 'primary', icon: Icon, className }: SidebarActionButtonProps) => {
    const variants = {
        primary: "bg-primary text-primary-foreground border-border hover:brightness-110",
        secondary: "bg-secondary text-secondary-foreground border-border hover:bg-accent",
        ghost: "bg-transparent text-muted-foreground border-transparent hover:bg-sidebar-accent hover:text-sidebar-primary"
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full h-8 text-[11px] font-semibold border flex items-center justify-center gap-2 transition-colors active:scale-[0.98]",
                variants[variant],
                className
            )}
        >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
        </button>
    );
};

export const SidebarContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("flex-1 overflow-auto px-2 pb-2", className)}>
        {children}
    </div>
);

export const SidebarFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("p-2 border-t border-sidebar-border", className)}>
        {children}
    </div>
);
