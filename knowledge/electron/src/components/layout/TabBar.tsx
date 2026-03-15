import { useRef, useState } from 'react';
import { X, Layout, BarChart3, Settings, ClipboardList, ShoppingCart, ShieldCheck, HeartPulse, AlertTriangle, Users, Pin, PinOff, Bug, Layers, PlusSquare, ChevronUp, ChevronDown } from 'lucide-react';
import { OverviewIcon } from '../shared/icons/PostmanIcons';
import { type TabData } from '@/pages/Index';
import { TabContextMenu } from './TabContextMenu';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";

interface TabBarProps {
  activeTabId: string;
  openTabs: TabData[];
  onTabChange: (id: string) => void;
  onTabClose: (id: string, e?: React.MouseEvent) => void;
  onReorder: (newTabs: TabData[]) => void;
  onTogglePin: (id: string) => void;
  onCloseOthers: (id: string) => void;
  onCloseRight: (id: string) => void;
  onCloseLeft: (id: string) => void;
  paneId?: 'left' | 'right';
  onMoveTab?: (tabId: string, sourcePane: 'left' | 'right', targetPane: 'left' | 'right') => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const TabBar = ({
  activeTabId,
  openTabs,
  onTabChange,
  onTabClose,
  onReorder,
  onTogglePin,
  onCloseOthers,
  onCloseRight,
  onCloseLeft,
  paneId = 'left',
  onMoveTab,
  isCollapsed = false,
  onToggleCollapse
}: TabBarProps) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (id === 'overview') {
      e.preventDefault();
      return;
    }
    setDraggedTabId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/tab-data', JSON.stringify({ tabId: id, sourcePane: paneId }));
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Internal reordering (same pane)
    if (draggedTabId && draggedTabId !== id && id !== 'overview') {
      const draggedIdx = openTabs.findIndex(t => t.id === draggedTabId);
      const overIdx = openTabs.findIndex(t => t.id === id);

      // Prevent dragging between pinned and unpinned groups
      if (draggedIdx !== -1 && overIdx !== -1 && openTabs[draggedIdx].pinned === openTabs[overIdx].pinned) {
        const newTabs = [...openTabs];
        const [removed] = newTabs.splice(draggedIdx, 1);
        newTabs.splice(overIdx, 0, removed);
        onReorder(newTabs);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
  };

  const handleDropContainer = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/tab-data');
    if (!data) return;

    try {
      const { tabId, sourcePane } = JSON.parse(data);
      // Handle cross-pane drop
      if (sourcePane && sourcePane !== paneId && onMoveTab) {
        onMoveTab(tabId, sourcePane as 'left' | 'right', paneId);
      }
    } catch (err) {
      console.error("Failed to parse drag data", err);
    }
    setDraggedTabId(null);
  };

  return (
    <div
      className={cn(
        "bg-tab-inactive border-b border-border flex items-center shrink-0 overflow-x-auto no-scrollbar relative transition-all duration-300 ease-in-out",
        isCollapsed ? "h-2 hover:h-4 opacity-50 hover:opacity-100 overflow-hidden" : "h-10"
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDropContainer}
    >
      {!isCollapsed && openTabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        const isOverview = tab.id === 'overview';

        return (
          <TabContextMenu
            key={tab.id}
            tabId={tab.id}
            isPinned={tab.pinned}
            isOverview={isOverview}
            canCloseOthers={openTabs.length > 1}
            onClose={(id) => onTabClose(id)}
            onTogglePin={onTogglePin}
            onCloseOthers={onCloseOthers}
            onCloseRight={onCloseRight}
            onCloseLeft={onCloseLeft}
          >
            <button
              draggable={!isOverview}
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={(e) => handleDragOver(e, tab.id)}
              onDragEnd={handleDragEnd}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "h-full text-[13px] font-normal flex items-center justify-center relative transition-colors border-r border-border/50 group shrink-0 select-none",
                isActive
                  ? 'bg-tab-active border-t-2 border-t-primary text-foreground font-semibold shadow-[0_-2px_4px_rgba(0,0,0,0.02)]'
                  : 'text-muted-foreground/80 hover:bg-accent border-l-2 border-l-transparent',

                draggedTabId === tab.id ? 'opacity-50' : '',
                isOverview ? 'w-12 px-0' : 'px-4 gap-2 min-w-[100px] max-w-[200px]',
                tab.pinned && !isOverview ? 'bg-muted/30' : ''
              )}
            >
              {tab.pinned && !isOverview && (
                <Pin className="w-2.5 h-2.5 text-primary rotate-45 shrink-0" />
              )}

              {isOverview ? (
                <OverviewIcon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              ) : (
                <>
                  <div className="flex items-center gap-2 overflow-hidden pointer-events-none">
                    {tab.type === 'project' && <Layout className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />}
                    {tab.type === 'reports' && <BarChart3 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />}
                    {tab.type === 'tasks' && <ClipboardList className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />}
                    {tab.type === 'orders' && <ShoppingCart className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />}
                    {tab.type === 'quality' && <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />}
                    {tab.type === 'hs' && <HeartPulse className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />}
                    {tab.type === 'risks' && <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />}
                    {tab.type === 'team' && <Users className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />}
                    {tab.type === 'system' && <Settings className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />}
                    {tab.type === 'phase' && <Layers className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />}
                    {tab.type === 'task' && <ClipboardList className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />}
                    {tab.type === 'new-project' && <PlusSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />}
                    {tab.type === 'new-request' && <span className={cn("font-bold text-[10px] shrink-0", isActive ? "text-primary" : "text-emerald-600 opacity-70")}>GET</span>}

                    <span className="truncate leading-snug">{tab.name}</span>
                  </div>

                  {!tab.pinned && (
                    <div className={cn(
                      "flex items-center transition-all duration-200 overflow-hidden",
                      isActive
                        ? 'w-4 ml-1.5 opacity-100'
                        : 'w-0 ml-0 opacity-0 group-hover:w-4 group-hover:ml-1.5 group-hover:opacity-100'
                    )}>
                      <X
                        className={`w-4 h-4 text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 p-0.5 rounded transition-colors shrink-0`}
                        onClick={(e) => onTabClose(tab.id, e)}
                      />
                    </div>
                  )}
                </>
              )}

              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-tab-active"></span>
              )}
            </button>
          </TabContextMenu>
        );
      })}

      <div className="flex-1" />

      {/* Collapse Toggle */}
      {onToggleCollapse && !isCollapsed && (
        <div className="flex items-center px-1 h-full z-10 bg-tab-inactive">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-sm text-muted-foreground hover:text-foreground"
            onClick={onToggleCollapse}
            title="Collapse Tab Bar"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Expand Trigger Overlay (when collapsed) */}
      {isCollapsed && onToggleCollapse && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-primary/10 hover:bg-primary/20 transition-colors"
          onClick={onToggleCollapse}
          title="Expand Tab Bar"
        >
          <ChevronDown className="w-3 h-3 text-primary opacity-50" />
        </div>
      )}


    </div>
  );
};

export default TabBar;
