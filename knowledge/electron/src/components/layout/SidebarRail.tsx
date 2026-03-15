import { LayoutList, Folder, ShieldCheck, Map, Award, Users, BarChart3, Settings, Cog, Boxes } from 'lucide-react';
import { FilesIcon } from '../shared/icons/PostmanIcons';

const SidebarNavItem = ({
    icon: Icon,
    label,
    active = false,
    badge,
    collapsed = false,
    onClick
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    active?: boolean;
    badge?: string;
    collapsed?: boolean;
    onClick?: () => void;
}) => (
    <button
        onClick={onClick}
        className={`w-full flex flex-col items-center py-3 px-1 text-xs gap-1.5 transition-colors border-l-2 ${active
            ? 'bg-primary/5 text-primary border-primary font-bold'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 border-transparent hover:border-sidebar-border'
            }`}
        title={collapsed ? label : undefined}
    >
        <Icon className={`w-5 h-5 mb-0.5 transition-colors duration-300 ${collapsed ? 'scale-110' : ''}`} />
        <div className={`overflow-hidden transition-opacity duration-300 flex flex-col items-center ${collapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
            <span className="leading-tight text-[10px] opacity-80 font-medium whitespace-nowrap">{label}</span>
            {badge && (
                <span className="text-[10px] px-1 bg-blue-100 text-blue-600 rounded font-medium mt-1">
                    {badge}
                </span>
            )}
        </div>
    </button>
);

interface SidebarRailProps {
    activeType?: string;
    onSelectType?: (type: 'projects' | 'directory' | 'cases' | 'map' | 'operations' | 'dofe' | 'reports' | 'system' | 'instances') => void;
    isCollapsed?: boolean;
}

const SidebarRail = ({ activeType, onSelectType, isCollapsed }: SidebarRailProps) => {
    return (
        <div className={`bg-sidebar border-r border-sidebar-border flex flex-col h-full overflow-y-auto overflow-x-hidden ${isCollapsed ? 'w-[56px]' : 'w-[88px]'}`}>


            <SidebarNavItem
                icon={Boxes}
                label="Instances"
                active={activeType === 'instances' || activeType === 'instance'}
                onClick={() => onSelectType?.('instances')}
                collapsed={isCollapsed}
            />
            <SidebarNavItem
                icon={Folder}
                label="Directory"
                active={activeType === 'directory'}
                onClick={() => onSelectType?.('directory')}
                collapsed={isCollapsed}
            />
            <SidebarNavItem
                icon={ShieldCheck}
                label="Cases"
                active={activeType === 'cases'}
                onClick={() => onSelectType?.('cases')}
                collapsed={isCollapsed}
            />
            <SidebarNavItem
                icon={Cog}
                label="Operations"
                active={activeType === 'operations'}
                onClick={() => onSelectType?.('operations')}
                collapsed={isCollapsed}
            />
            <SidebarNavItem
                icon={Map}
                label="Map"
                active={activeType === 'map'}
                onClick={() => onSelectType?.('map')}
                collapsed={isCollapsed}
            />
            <SidebarNavItem
                icon={Award}
                label="DofE"
                active={activeType === 'dofe'}
                onClick={() => onSelectType?.('dofe')}
                collapsed={isCollapsed}
            />

            <div className="flex-1" />

            <SidebarNavItem
                icon={BarChart3}
                label="Reports"
                active={activeType === 'reports'}
                onClick={() => onSelectType?.('reports')}
                collapsed={isCollapsed}
            />
            <SidebarNavItem
                icon={Settings}
                label="System"
                active={activeType === 'system'}
                onClick={() => onSelectType?.('system')}
                collapsed={isCollapsed}
            />
        </div>
    );
};

export default SidebarRail;
