import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import TopNavBar from '@/components/layout/TopNavBar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import InstancesSidebar from '@/components/layout/InstancesSidebar';
import { DirectorySidebar } from '@/components/layout/DirectorySidebar';
import ReportsSidebar from '@/components/layout/ReportsSidebar';
import TasksSidebar from '@/components/layout/TasksSidebar';
import OrdersSidebar from '@/components/layout/OrdersSidebar';
import QualitySidebar from '@/components/layout/QualitySidebar';
import HSSidebar from '@/components/layout/HSSidebar';
import RisksSidebar from '@/components/layout/RisksSidebar';
import TeamSidebar from '@/components/layout/TeamSidebar';
import AdminSidebar from '@/components/layout/AdminSidebar';
import SidebarRail from '@/components/layout/SidebarRail';
import TabBar from '@/components/layout/TabBar';
import MainContent from '@/components/dashboard/MainContent';
import BottomBar from '@/components/layout/BottomBar';
import RightSidebar from '@/components/layout/RightSidebar';
import { BugReporter } from '@/components/shared/BugReporter';
import { GlobalContextMenu } from '@/components/layout/GlobalContextMenu';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { type ImperativePanelHandle } from "react-resizable-panels";
import { projects, activeProjectItems, completedProjectItems } from '@/data/mockData-old';
import ContextSidebar from '@/components/layout/ContextSidebar';
import {
  LayoutDashboard,
  CheckSquare,
  Book,
  ClipboardCheck,
  Users,
  HardHat,
  Wrench,
  AlertTriangle,
  Award,
  Map,
  MapPin,
  Folder,
  Boxes,
  UserSquare2,
  Smartphone,
  PackageSearch,
  ShieldAlert,
  Zap,
  Activity,
  Stethoscope,
  Calendar,
  Settings2,
  History,
  FileText,
  Home,
  Siren
} from 'lucide-react';

export type TabType = 'home' | 'overview' | 'new-request' | 'project' | 'instance' | 'active-instance' | 'new-instance' | 'reports' | 'system' | 'tasks' | 'orders' | 'quality' | 'hs' | 'risks' | 'team' | 'phase' | 'task' | 'new-project' | 'projects' | 'directory' | 'cases' | 'map' | 'dofe' | 'operations' | 'instances';

export interface TabData {
  id: string;
  name: string;
  type: TabType;
  pinned?: boolean;
  projectId?: string;
  phaseName?: string;
  taskId?: string;
}

const Index = () => {
  const [activeTabId, setActiveTabId] = useState<string>('instances');
  const [openTabs, setOpenTabs] = useState<TabData[]>([
    { id: 'instances', name: 'Select Instance', type: 'instances', pinned: true }
  ]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);
  const [isTabBarCollapsed, setIsTabBarCollapsed] = useState(false);
  const [closeRequestTabId, setCloseRequestTabId] = useState<string | null>(null);
  const [isNewProjectDirty, setIsNewProjectDirty] = useState(false);

  // Split View State
  const [isSplitView, setIsSplitView] = useState(false);
  const [activeTabIdRight, setActiveTabIdRight] = useState<string>('instances');
  const [openTabsRight, setOpenTabsRight] = useState<TabData[]>([
    { id: 'instances', name: 'Select Instance', type: 'instances', pinned: true }
  ]);
  const [lastActivePane, setLastActivePane] = useState<'left' | 'right'>('left');

  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const activeTab = activeTabId === 'home'
    ? { id: 'home', name: 'Home', type: 'home' as TabType }
    : (openTabs.find(t => t.id === activeTabId) || openTabs[0]);

  const activeTabRight = activeTabIdRight === 'home'
    ? { id: 'home', name: 'Home', type: 'home' as TabType }
    : (openTabsRight.find(t => t.id === activeTabIdRight) || openTabsRight[0]);

  const userPreferredSidebarCollapsed = useRef<boolean>(false);
  const prevTabType = useRef<string>(activeTab.type);

  const isFirstRender = useRef(true);

  useEffect(() => {
    const panel = sidebarPanelRef.current;
    if (!panel) return;

    // Handle initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (activeTab.type === 'home') {
        panel.collapse();
      }
      return;
    }

    // Transitioning TO home
    if (activeTab.type === 'home' && prevTabType.current !== 'home') {
      userPreferredSidebarCollapsed.current = isSidebarCollapsed;
      if (!isSidebarCollapsed) {
        panel.collapse();
      }
    }
    // Transitioning FROM home
    else if (activeTab.type !== 'home' && prevTabType.current === 'home') {
      if (!userPreferredSidebarCollapsed.current && isSidebarCollapsed) {
        panel.expand();
      } else if (userPreferredSidebarCollapsed.current && !isSidebarCollapsed) {
        panel.collapse();
      }
    }

    prevTabType.current = activeTab.type;
  }, [activeTab.type, isSidebarCollapsed]);

  const toggleSidebar = () => {
    const panel = sidebarPanelRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const toggleRail = () => {
    setIsRailCollapsed(!isRailCollapsed);
  };

  const handleToggleSplit = () => setIsSplitView(v => !v);

  const handleMoveTab = (tabId: string, sourcePane: 'left' | 'right', targetPane: 'left' | 'right') => {
    if (sourcePane === targetPane) return;
    const sourceList = sourcePane === 'left' ? openTabs : openTabsRight;
    const targetList = targetPane === 'left' ? openTabs : openTabsRight;
    const setSource = sourcePane === 'left' ? setOpenTabs : setOpenTabsRight;
    const setTarget = targetPane === 'left' ? setOpenTabs : setOpenTabsRight;
    const setActiveSource = sourcePane === 'left' ? setActiveTabId : setActiveTabIdRight;
    const setActiveTarget = targetPane === 'left' ? setActiveTabId : setActiveTabIdRight;
    const activeSourceId = sourcePane === 'left' ? activeTabId : activeTabIdRight;

    const tab = sourceList.find(t => t.id === tabId);
    if (!tab) return;

    // Remove from source
    const newSourceList = sourceList.filter(t => t.id !== tabId);
    setSource(newSourceList);
    if (activeSourceId === tabId) {
      // Switch active tab in source to something else
      const next = newSourceList[newSourceList.length - 1] || newSourceList[0];
      if (next) setActiveSource(next.id);
    }

    // Add to target
    if (!targetList.some(t => t.id === tabId)) {
      setTarget([...targetList, tab]);
      setActiveTarget(tabId);
    }
    setLastActivePane(targetPane);
  };

  const handleSelectProject = (project: { id: string, name: string, type?: TabType }) => {
    // Special case for Home: It doesn't open as a tab
    if (project.id === 'home') {
      if (lastActivePane === 'left') setActiveTabId('home');
      else setActiveTabIdRight('home');
      return;
    }

    const currentOpenTabs = lastActivePane === 'left' ? openTabs : openTabsRight;
    const setTabs = lastActivePane === 'left' ? setOpenTabs : setOpenTabsRight;
    const setActive = lastActivePane === 'left' ? setActiveTabId : setActiveTabIdRight;

    // Check if tab already exists
    const existingTab = currentOpenTabs.find(t => t.id === project.id);
    if (existingTab) {
      setActive(project.id);
    } else {
      const typeMap: Record<string, TabType> = {
        'home': 'home',
        'overview': 'overview',
        'reports': 'reports',
        'system': 'system',
        'tasks': 'tasks',
        'orders': 'orders',
        'quality': 'quality',
        'hs': 'hs',
        'risks': 'risks',
        'team': 'team',
        'projects': 'projects',
        'directory': 'directory',
        'cases': 'cases',
        'map': 'map',
        'dofe': 'dofe',
        'operations': 'operations',
        'instances': 'instances'
      };

      const newTab: TabData = {
        id: project.id,
        name: project.name,
        type: project.type || typeMap[project.id] || 'project'
      };

      const newTabsList = [...currentOpenTabs, newTab];
      const overview = newTabsList.find(t => t.id === 'overview');
      const rest = newTabsList.filter(t => t.id !== 'overview');
      const pinned = rest.filter(t => t.pinned);
      const unpinned = rest.filter(t => !t.pinned);

      const sortedTabs = [];
      if (overview) sortedTabs.push(overview);
      sortedTabs.push(...pinned, ...unpinned);

      setTabs(sortedTabs);
      setActive(project.id);
    }
  };

  const handleCloseTab = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (id === 'overview') return;

    // Check if the tab being closed is the new project tab and it has unsaved changes
    if (id === 'new-project' && isNewProjectDirty) {
      setCloseRequestTabId(id);
      return;
    }

    forceCloseTab(id);
  };

  const forceCloseTab = (id: string) => {
    const index = openTabs.findIndex(t => t.id === id);
    const newTabs = openTabs.filter(t => t.id !== id);
    setOpenTabs(newTabs);

    setCloseRequestTabId(null);

    if (activeTabId === id) {
      const nextTab = newTabs[index] || newTabs[index - 1] || newTabs[0];
      setActiveTabId(nextTab.id);
    }
  };

  const handleReorderTabs = (newTabs: TabData[]) => {
    // Keep overview at the start, followed by pinned, then rest
    const overview = newTabs.find(t => t.id === 'overview');
    const rest = newTabs.filter(t => t.id !== 'overview');

    const pinned = rest.filter(t => t.pinned);
    const unpinned = rest.filter(t => !t.pinned);

    const result = [];
    if (overview) result.push(overview);
    result.push(...pinned, ...unpinned);
    setOpenTabs(result);
  };

  const handleTogglePin = (id: string) => {
    if (id === 'overview') return;

    const newTabs = openTabs.map(t =>
      t.id === id ? { ...t, pinned: !t.pinned } : t
    );

    const overview = newTabs.find(t => t.id === 'overview');
    const rest = newTabs.filter(t => t.id !== 'overview');

    const pinned = rest.filter(t => t.pinned);
    const unpinned = rest.filter(t => !t.pinned);

    const result = [];
    if (overview) result.push(overview);
    result.push(...pinned, ...unpinned);
    setOpenTabs(result);
  };

  const handleCloseOthers = (id: string) => {
    const newTabs = openTabs.filter(t => t.id === id || t.id === 'overview' || t.pinned);
    setOpenTabs(newTabs);
    setActiveTabId(id);
  };

  const handleCloseRight = (id: string) => {
    const index = openTabs.findIndex(t => t.id === id);
    const newTabs = openTabs.filter((t, i) => i <= index || t.id === 'overview' || t.pinned);
    setOpenTabs(newTabs);
    if (!newTabs.find(t => t.id === activeTabId)) {
      setActiveTabId(id);
    }
  };

  const handleCloseLeft = (id: string) => {
    const index = openTabs.findIndex(t => t.id === id);
    const newTabs = openTabs.filter((t, i) => i >= index || t.id === 'overview' || t.pinned);
    setOpenTabs(newTabs);
    if (!newTabs.find(t => t.id === activeTabId)) {
      setActiveTabId(id);
    }
  };

  const handleSelectPhase = (projectId: string, phaseName: string) => {
    const tabId = `phase-${projectId}-${phaseName}`;
    const existingTab = openTabs.find(t => t.id === tabId);

    if (existingTab) {
      setActiveTabId(tabId);
    } else {
      const newTab: TabData = {
        id: tabId,
        name: phaseName,
        type: 'phase',
        projectId,
        phaseName
      };
      setOpenTabs([...openTabs, newTab]);
      setActiveTabId(tabId);
    }
  };

  const handleSelectTask = (projectId: string, taskId: string) => {
    const tabId = `task-${taskId}`;
    const existingTab = openTabs.find(t => t.id === tabId);

    if (existingTab) {
      setActiveTabId(tabId);
    } else {
      // Find task name for tab label
      const project = projects[projectId];
      const task = project?.tasks.find(t => t.id === taskId);
      const taskName = task ? task.taskName.split('-')[0].trim() : taskId;

      const newTab: TabData = {
        id: tabId,
        name: taskName,
        type: 'task',
        projectId,
        taskId
      };
      setOpenTabs([...openTabs, newTab]);
      setActiveTabId(tabId);
    }
  };

  const handleNewProject = () => {
    const existingTab = openTabs.find(t => t.id === 'new-project');
    if (existingTab) {
      setActiveTabId('new-project');
    } else {
      const newTab: TabData = {
        id: 'new-project',
        name: 'New Project',
        type: 'new-project'
      };
      setOpenTabs([...openTabs, newTab]);
      setActiveTabId('new-project');
    }
  };

  const handleNewInstance = () => {
    const existingTab = openTabs.find(t => t.id === 'new-instance');
    if (existingTab) {
      setActiveTabId('new-instance');
    } else {
      const newTab: TabData = {
        id: 'new-instance',
        name: 'New Instance',
        type: 'new-instance'
      };
      setOpenTabs([...openTabs, newTab]);
      setActiveTabId('new-instance');
    }
  };

  // Right Pane Handlers
  const handleCloseTabRight = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (id === 'overview') return;
    const index = openTabsRight.findIndex(t => t.id === id);
    const newTabs = openTabsRight.filter(t => t.id !== id);
    setOpenTabsRight(newTabs);
    if (activeTabIdRight === id) {
      const next = newTabs[index] || newTabs[index - 1] || newTabs[0];
      setActiveTabIdRight(next.id);
    }
  };

  const handleReorderTabsRight = (newTabs: TabData[]) => {
    // Keep overview at start
    const overview = newTabs.find(t => t.id === 'overview');
    const rest = newTabs.filter(t => t.id !== 'overview');
    const pinned = rest.filter(t => t.pinned);
    const unpinned = rest.filter(t => !t.pinned);
    const result = [];
    if (overview) result.push(overview);
    result.push(...pinned, ...unpinned);
    setOpenTabsRight(result);
  };

  const handleTogglePinRight = (id: string) => {
    if (id === 'overview') return; // Should be impossible if id check exists
    setOpenTabsRight(prev => {
      const newTabs = prev.map(t => t.id === id ? { ...t, pinned: !t.pinned } : t);
      // Re-sort
      const overview = newTabs.find(t => t.id === 'overview');
      const rest = newTabs.filter(t => t.id !== 'overview');
      const pinned = rest.filter(t => t.pinned);
      const unpinned = rest.filter(t => !t.pinned);
      const result = [];
      if (overview) result.push(overview);
      result.push(...pinned, ...unpinned);
      return result;
    });
  };

  const handleCloseOthersRight = (id: string) => {
    setOpenTabsRight(prev => prev.filter(t => t.id === id || t.id === 'overview' || t.pinned));
    setActiveTabIdRight(id);
  };

  const handleCloseRightRight = (id: string) => {
    const index = openTabsRight.findIndex(t => t.id === id);
    const newTabs = openTabsRight.filter((t, i) => i <= index || t.id === 'overview' || t.pinned);
    setOpenTabsRight(newTabs);
    if (!newTabs.find(t => t.id === activeTabIdRight)) setActiveTabIdRight(id);
  };

  const handleCloseLeftRight = (id: string) => {
    const index = openTabsRight.findIndex(t => t.id === id);
    const newTabs = openTabsRight.filter((t, i) => i >= index || t.id === 'overview' || t.pinned);
    setOpenTabsRight(newTabs);
    if (!newTabs.find(t => t.id === activeTabIdRight)) setActiveTabIdRight(id);
  };



  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden font-sans">
      <GlobalContextMenu>
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top navigation */}
          <TopNavBar
            onNavigateHome={() => handleSelectProject({ id: 'home', name: 'Home' })}
            onNavigateOverview={() => handleSelectProject({ id: 'overview', name: 'Global Overview' })}
          />

          <div className="flex-1 flex overflow-hidden">
            {/* Navigation Rail (Fixed) */}
            <SidebarRail
              activeType={activeTab.type}
              isCollapsed={isRailCollapsed}
              onSelectType={(type) => {
                const nameMap: Record<string, string> = {
                  'home': 'Home',
                  'reports': 'Reports',
                  'system': 'System',
                  'projects': 'Dashboard',
                  'directory': 'Directory',
                  'cases': 'Cases',
                  'map': 'Map',
                  'dofe': 'DofE',
                  'operations': 'Operations',
                  'instances': 'Instances'
                };
                handleSelectProject({ id: type, name: nameMap[type] || type });
              }}
            />

            <ResizablePanelGroup direction="horizontal">
              {/* Workspace Panel (Resizable) */}
              <ResizablePanel
                ref={sidebarPanelRef}
                defaultSize={activeTab.type === 'home' ? 0 : 25}
                minSize={15}
                maxSize={40}
                collapsible={true}
                onCollapse={() => setIsSidebarCollapsed(true)}
                onExpand={() => setIsSidebarCollapsed(false)}
                className={cn(
                  activeTab.type === 'home' ? 'opacity-0 pointer-events-none' : 'opacity-100'
                )}
              >
                {activeTab.type === 'projects' || activeTab.type === 'overview' ? (
                  <LeftSidebar
                    isCollapsed={isSidebarCollapsed}
                    onSelectProject={handleSelectProject}
                    onNewProject={handleNewProject}
                    currentProjectId={activeTabId}
                  />
                ) : activeTab.type === 'instances' || activeTab.type === 'instance' || activeTab.type === 'new-instance' ? (
                  <InstancesSidebar
                    isCollapsed={isSidebarCollapsed}
                    onSelectInstance={(instance) => handleSelectProject({
                      ...instance,
                      type: instance.id === 'instances' ? 'instances' : 'instance'
                    })}
                    onNewInstance={handleNewInstance}
                    currentInstanceId={activeTabId}
                  />
                ) : activeTab.type === 'directory' ? (
                  <DirectorySidebar
                    isCollapsed={isSidebarCollapsed}
                  />
                ) : activeTab.type === 'cases' ? (
                  <ContextSidebar
                    title="Cases"
                    icon={ClipboardCheck}
                    isCollapsed={isSidebarCollapsed}
                    items={[
                      { id: 'quality', label: 'Quality', icon: ClipboardCheck, action: () => handleSelectProject({ id: 'quality', name: 'Quality' }) },
                      { id: 'attendance', label: 'Attendance', icon: Users, action: () => { } },
                      { id: 'hs', label: 'H&S', icon: HardHat, action: () => handleSelectProject({ id: 'hs', name: 'H&S' }) },
                      { id: 'maintenance', label: 'Maintenance', icon: Wrench, action: () => { } },
                      { id: 'risks', label: 'Risks', icon: AlertTriangle, action: () => handleSelectProject({ id: 'risks', name: 'Risks' }) },
                    ]}
                  />
                ) : activeTab.type === 'operations' ? (
                  <ContextSidebar
                    title="Operations"
                    icon={Wrench} // Placeholder
                    isCollapsed={isSidebarCollapsed}
                    items={[]}
                  />
                ) : activeTab.type === 'map' ? (
                  <ContextSidebar
                    title="Map"
                    icon={Map}
                    isCollapsed={isSidebarCollapsed}
                    items={[
                      { id: 'map-team', label: 'Team', icon: Users, action: () => handleSelectProject({ id: 'team', name: 'Team' }) },
                      { id: 'map-instances', label: 'Instances', icon: MapPin, action: () => { } },
                    ]}
                  />
                ) : activeTab.type === 'dofe' ? (
                  <ContextSidebar
                    title="DofE"
                    icon={Award}
                    isCollapsed={isSidebarCollapsed}
                    items={[]}
                  />
                ) : activeTab.type === 'reports' ? (
                  <ReportsSidebar
                    isCollapsed={isSidebarCollapsed}
                    onSelectReport={handleSelectProject}
                  />
                ) : activeTab.type === 'system' ? (
                  <AdminSidebar
                    isCollapsed={isSidebarCollapsed}
                    onSelectAdminAction={handleSelectProject}
                  />
                ) : activeTab.type === 'tasks' ? (
                  <TasksSidebar
                    isCollapsed={isSidebarCollapsed}
                    onSelectCategory={(id) => console.log('Selected task cat:', id)}
                  />
                ) : activeTab.type === 'orders' ? (
                  <OrdersSidebar
                    isCollapsed={isSidebarCollapsed}
                    onSelectCategory={(id) => console.log('Selected order cat:', id)}
                  />
                ) : activeTab.type === 'quality' ? (
                  <QualitySidebar
                    isCollapsed={isSidebarCollapsed}
                    onSelectCategory={(id) => console.log('Selected quality cat:', id)}
                  />
                ) : activeTab.type === 'hs' ? (
                  <HSSidebar
                    isCollapsed={isSidebarCollapsed}
                    onSelectCategory={(id) => console.log('Selected hs cat:', id)}
                  />
                ) : activeTab.type === 'risks' ? (
                  <RisksSidebar
                    isCollapsed={isSidebarCollapsed}
                    onSelectCategory={(id) => console.log('Selected risk cat:', id)}
                  />
                ) : activeTab.type === 'team' ? (
                  <TeamSidebar
                    isCollapsed={isSidebarCollapsed}
                    onSelectRole={(id) => console.log('Selected role:', id)}
                  />
                ) : (
                  <LeftSidebar
                    isCollapsed={isSidebarCollapsed}
                    onSelectProject={handleSelectProject}
                    onNewProject={handleNewProject}
                    currentProjectId={activeTabId}
                  />
                )}
              </ResizablePanel>

              <ResizableHandle className={`w-px bg-sidebar-border transition-opacity duration-300 ${isSidebarCollapsed || activeTab.type === 'home' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} />

              {/* Main Content Area */}
              <ResizablePanel defaultSize={isSidebarCollapsed || activeTab.type === 'home' ? 100 : 80}>
                {isSplitView ? (
                  <ResizablePanelGroup direction="horizontal" className="h-full">
                    {/* Left Pane (Split) */}
                    <ResizablePanel defaultSize={50} minSize={20}>
                      <div className="h-full flex flex-col overflow-hidden border-r border-border" onFocus={() => setLastActivePane('left')}>
                        <TabBar
                          activeTabId={activeTabId}
                          openTabs={openTabs}
                          onTabChange={setActiveTabId}
                          onTabClose={handleCloseTab}
                          onReorder={handleReorderTabs}
                          onTogglePin={handleTogglePin}
                          onCloseOthers={handleCloseOthers}
                          onCloseRight={handleCloseRight}
                          onCloseLeft={handleCloseLeft}


                          paneId="left"
                          onMoveTab={handleMoveTab}
                          isCollapsed={isTabBarCollapsed}
                          onToggleCollapse={() => setIsTabBarCollapsed(!isTabBarCollapsed)}
                        />
                        <MainContent
                          activeTab={activeTab.type}
                          selectedProject={['project', 'phase', 'task', 'instance'].includes(activeTab.type) ? activeTab : undefined}
                          closeRequestTabId={closeRequestTabId}
                          onCancelClose={() => setCloseRequestTabId(null)}
                          onForceClose={forceCloseTab}
                          onDirtyChange={(dirty) => {
                            if (activeTab.id === 'new-project') setIsNewProjectDirty(dirty);
                          }}
                          onSelectProject={handleSelectProject}
                          onSelectPhase={handleSelectPhase}
                        />
                      </div>
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Right Pane (Split) */}
                    <ResizablePanel defaultSize={50} minSize={20}>
                      <div className="h-full flex flex-col overflow-hidden" onFocus={() => setLastActivePane('right')}>
                        <TabBar
                          activeTabId={activeTabIdRight}
                          openTabs={openTabsRight}
                          onTabChange={setActiveTabIdRight}
                          onTabClose={handleCloseTabRight}
                          onReorder={handleReorderTabsRight}
                          onTogglePin={handleTogglePinRight}
                          onCloseOthers={handleCloseOthersRight}
                          onCloseRight={handleCloseRightRight}
                          onCloseLeft={handleCloseLeftRight}


                          paneId="right"
                          onMoveTab={handleMoveTab}
                          isCollapsed={isTabBarCollapsed}
                          onToggleCollapse={() => setIsTabBarCollapsed(!isTabBarCollapsed)}
                        />
                        <MainContent
                          activeTab={activeTabRight.type}
                          selectedProject={['project', 'phase', 'task', 'instance'].includes(activeTabRight.type) ? activeTabRight : undefined}
                          onSelectProject={handleSelectProject}
                          onSelectPhase={handleSelectPhase}
                        />
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                ) : (
                  // Standard Single View
                  <div className="h-full flex flex-col overflow-hidden" onFocus={() => setLastActivePane('left')}>
                    <TabBar
                      activeTabId={activeTabId}
                      openTabs={openTabs}
                      onTabChange={setActiveTabId}
                      onTabClose={handleCloseTab}
                      onReorder={handleReorderTabs}
                      onTogglePin={handleTogglePin}
                      onCloseOthers={handleCloseOthers}
                      onCloseRight={handleCloseRight}
                      onCloseLeft={handleCloseLeft}


                      paneId="left"
                      onMoveTab={handleMoveTab}
                      isCollapsed={isTabBarCollapsed}
                      onToggleCollapse={() => setIsTabBarCollapsed(!isTabBarCollapsed)}
                    />
                    <MainContent
                      activeTab={activeTab.type}
                      selectedProject={['project', 'phase', 'task', 'instance'].includes(activeTab.type) ? activeTab : undefined}
                      closeRequestTabId={closeRequestTabId}
                      onCancelClose={() => setCloseRequestTabId(null)}
                      onForceClose={forceCloseTab}
                      onDirtyChange={(dirty) => {
                        if (activeTab.id === 'new-project') setIsNewProjectDirty(dirty);
                      }}
                      onSelectProject={handleSelectProject}
                      onSelectPhase={handleSelectPhase}
                    />
                  </div>
                )}
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          {/* Bottom bar */}
          <BottomBar
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            isRailCollapsed={isRailCollapsed}
            onToggleRail={toggleRail}
            sidebarToggleDisabled={activeTab.type === 'home'}
          />
        </div>
      </GlobalContextMenu>
      <BugReporter />
    </div>
  );
};

export default Index;
