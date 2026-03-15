
import { useState } from 'react';
import {
  Folder,
  FileText,
  BarChart3,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Search,
  Archive,
  LayoutDashboard
} from 'lucide-react';
import {
  PlusIcon,
  SearchIcon,
  TeamIcon
} from '../shared/icons/PostmanIcons';
import {
  SidebarContainer,
  SidebarHeader,
  SidebarActionButton,
  SidebarContent
} from './SidebarLayout';
import { activeProjectItems, completedProjectItems, archivedProjectItems, draftProjectItems } from '@/data/mockData-old';
import { cn } from '@/lib/utils';

interface NavButtonProps {
  id: string;
  name: string;
  icon: any;
  isActive?: boolean;
  onClick: () => void;
  showChevron?: boolean;
  isExpanded?: boolean;
  hasDot?: boolean;
  count?: number;
  level?: number;
  className?: string;
  accentColor?: string;
}

const NavButton = ({
  id,
  name,
  icon: Icon,
  isActive,
  onClick,
  showChevron,
  isExpanded,
  hasDot,
  count,
  level = 0,
  className,
  accentColor
}: NavButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center justify-between h-11 hover:bg-sidebar-accent/50 text-sm transition-colors border-l-2 shrink-0 px-3",
      isActive ? "bg-primary/5 font-bold" : "border-transparent text-sidebar-foreground",
      isActive && !accentColor ? "border-primary text-primary" : "",
      className
    )}
    style={{
      paddingLeft: level > 0 ? `${12 + level * 14}px` : undefined,
      borderLeftColor: isActive && accentColor ? accentColor : (isActive ? undefined : 'transparent')
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
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              backgroundColor: accentColor || 'currentColor',
              opacity: isActive ? 1 : 0.6,
              boxShadow: accentColor ? `0 0 8px ${accentColor}40` : undefined
            }}
          />
        )
      )}

      <Icon
        className={cn("w-4 h-4 shrink-0", isActive && !accentColor ? "text-primary" : "text-muted-foreground")}
        style={{ color: isActive && accentColor ? accentColor : undefined }}
      />
      <span className="truncate font-semibold tracking-tight text-left">{name}</span>
    </div>

    <div className="flex items-center gap-2 shrink-0 ml-2">
      {count !== undefined && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium bg-muted/50 text-muted-foreground">
          {count}
        </span>
      )}
      {hasDot && (
        <div
          className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"
          style={{ backgroundColor: accentColor || 'var(--primary)' }}
        />
      )}
    </div>
  </button>
);



const LeftSidebar = ({
  isCollapsed,
  onSelectProject,
  onNewProject,
  currentProjectId = 'p1'
}: {
  isCollapsed: boolean;
  onSelectProject: (project: { id: string, name: string }) => void;
  onSelectPhase?: (projectId: string, phaseName: string) => void;
  onSelectTask?: (projectId: string, taskId: string) => void;
  onNewProject?: () => void;
  currentProjectId?: string;
}) => {
  const [isActiveExpanded, setIsActiveExpanded] = useState(true);
  const [isDraftsExpanded, setIsDraftsExpanded] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const [isArchivedExpanded, setIsArchivedExpanded] = useState(false);

  return (
    <SidebarContainer isCollapsed={isCollapsed}>
      <SidebarHeader
        title="Dashboard"
        icon={LayoutDashboard}
        actions={
          <SidebarActionButton
            label="New"
            variant="secondary"
            onClick={onNewProject}
            className="w-14 h-6 text-[9px] bg-secondary/30 border-none hover:bg-secondary/50"
          />
        }
      />

      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-sidebar-border bg-sidebar/10">
        <button
          className="p-1 hover:bg-sidebar-accent rounded-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          title="New Project"
          onClick={onNewProject}
        >
          <PlusIcon className="w-4 h-4" />
        </button>
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search collections"
            className="w-full h-8 pl-8 pr-2 bg-transparent text-[12px] focus:outline-none placeholder:text-muted-foreground/40 transition-colors font-medium"
          />
        </div>
      </div>

      <SidebarContent className="px-0 pb-0 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {/* Overview Button */}
          <NavButton
            id="overview"
            name="Overview"
            icon={BarChart3}
            isActive={currentProjectId === 'overview'}
            onClick={() => onSelectProject({ id: 'overview', name: 'Global Overview' })}
          />

          {/* Active Projects Section */}
          <NavButton
            id="active"
            name="Active Projects"
            icon={Folder}
            showChevron
            isExpanded={isActiveExpanded}
            count={activeProjectItems.length}
            onClick={() => setIsActiveExpanded(!isActiveExpanded)}
          />
          <div className="space-y-0">
            {isActiveExpanded && activeProjectItems.map((project) => (
              <NavButton
                key={project.id}
                id={project.id}
                name={project.name}
                icon={Box}
                isActive={currentProjectId === project.id}
                level={1}
                accentColor={project.color}
                onClick={() => onSelectProject({ id: project.id, name: project.name })}
                hasDot={currentProjectId === project.id}
              />
            ))}
          </div>
        </div>

        {/* Bottom section with categories */}
        <div className="border-t border-sidebar-border bg-sidebar/5 shrink-0">
          <NavButton
            id="drafts"
            name="Draft Projects"
            icon={Folder}
            showChevron
            isExpanded={isDraftsExpanded}
            count={draftProjectItems.length}
            onClick={() => setIsDraftsExpanded(!isDraftsExpanded)}
          />
          {isDraftsExpanded && draftProjectItems.map(p => (
            <NavButton
              key={p.id}
              id={p.id}
              name={p.name}
              icon={FileText}
              isActive={currentProjectId === p.id}
              level={1}
              accentColor={(p as any).color}
              onClick={() => onSelectProject({ id: p.id, name: p.name })}
            />
          ))}

          <NavButton
            id="completed"
            name="Completed Projects"
            icon={CheckCircle2}
            showChevron
            isExpanded={isCompletedExpanded}
            count={completedProjectItems.length}
            onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
          />
          {isCompletedExpanded && completedProjectItems.map(p => (
            <NavButton
              key={p.id}
              id={p.id}
              name={p.name}
              icon={CheckCircle2}
              isActive={currentProjectId === p.id}
              level={1}
              accentColor={(p as any).color}
              onClick={() => onSelectProject({ id: p.id, name: p.name })}
            />
          ))}

          <NavButton
            id="archived"
            name="Archived Projects"
            icon={Archive}
            showChevron
            isExpanded={isArchivedExpanded}
            count={archivedProjectItems.length}
            onClick={() => setIsArchivedExpanded(!isArchivedExpanded)}
          />
          {isArchivedExpanded && archivedProjectItems.map(p => (
            <NavButton
              key={p.id}
              id={p.id}
              name={p.name}
              icon={Archive}
              isActive={currentProjectId === p.id}
              level={1}
              accentColor={(p as any).color}
              onClick={() => onSelectProject({ id: p.id, name: p.name })}
            />
          ))}
        </div>
      </SidebarContent>
    </SidebarContainer>
  );
};

export default LeftSidebar;
