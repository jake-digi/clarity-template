
import type { TabType } from '@/pages/Index';
import { HomeContent } from './HomeContent';
import { OverviewContent } from './OverviewContent';
import { RequestBuilder } from './RequestBuilder';
import { ProjectDashboard } from './ProjectDashboard';
import { ReportsContent } from './ReportsContent';
import { AdminContent } from './AdminContent';
import { TasksTable } from '../tables/TasksTable';
import { OrdersTable } from '../tables/OrdersTable';
import { QualityTable } from '../tables/QualityTable';
import { HSTable } from '../tables/HSTable';
import { RisksTable } from '../tables/RisksTable';
import { TeamGrid } from './TeamGrid';
import { NewProjectForm } from './NewProjectForm';
import { InstanceDashboard } from './InstanceDashboard';
import { NewInstanceForm } from './NewInstanceForm';
import { InstancesOverview } from './InstancesOverview';
import { GlobalParticipantsTable } from './GlobalParticipantsTable';
import { Box } from 'lucide-react';

interface MainContentProps {
  activeTab: TabType;
  selectedProject?: any; // Change to any to pass the full TabData
  closeRequestTabId?: string | null;
  onCancelClose?: () => void;
  onForceClose?: (id: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSelectProject?: (project: { id: string, name: string }) => void;
  onSelectPhase?: (projectId: string, phaseName: string) => void;
}

import { getAllTasks, projects } from '@/data/mockData-old';

const MainContent = ({
  activeTab,
  selectedProject,
  closeRequestTabId,
  onCancelClose,
  onForceClose,
  onDirtyChange,
  onSelectProject,
  onSelectPhase
}: MainContentProps) => {
  if (activeTab === 'home') {
    return <HomeContent />;
  }

  if (activeTab === 'phase' && selectedProject) {
    return (
      <ProjectDashboard
        project={{
          id: selectedProject.projectId,
          name: projects[selectedProject.projectId]?.name || 'Project',
          activeSubTab: 'Phases',
          selectedPhaseId: selectedProject.phaseName,
          isStandalone: true
        }}
      />
    );
  }

  if (activeTab === 'task' && selectedProject) {
    const taskList = selectedProject.projectId
      ? projects[selectedProject.projectId]?.tasks || []
      : getAllTasks();
    return <TasksTable tasks={taskList} selectedTaskId={selectedProject.taskId} />;
  }

  if (activeTab === 'new-request') {
    return <RequestBuilder />;
  }

  if (activeTab === 'new-project') {
    return (
      <NewProjectForm
        closeRequestTabId={closeRequestTabId}
        onCancelClose={onCancelClose}
        onForceClose={onForceClose}
        onDirtyChange={onDirtyChange}
      />
    );
  }

  if (activeTab === 'new-instance') {
    return (
      <NewInstanceForm
        closeRequestTabId={closeRequestTabId}
        onCancelClose={onCancelClose}
        onForceClose={onForceClose}
        onDirtyChange={onDirtyChange}
      />
    );
  }

  if (activeTab === 'reports') {
    return <ReportsContent />;
  }

  if (activeTab === 'system') {
    return <AdminContent />;
  }

  if (activeTab === 'instances') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/10">
        <div className="w-20 h-20 mb-6 text-muted-foreground/30">
          <Box className="w-full h-full stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2 text-foreground">Welcome to Instances</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Please select an instance from the left sidebar to view its dashboard, phases, and tasks.
        </p>
      </div>
    );
  }

  if (activeTab === 'instance' && selectedProject) {
    return <InstanceDashboard instance={selectedProject} />;
  }

  if (activeTab === 'project' && selectedProject) {
    return <ProjectDashboard project={selectedProject} />;
  }

  if (activeTab === 'tasks') {
    return <TasksTable tasks={getAllTasks()} />;
  }

  if (activeTab === 'orders') {
    return <OrdersTable />;
  }

  if (activeTab === 'quality') {
    return <QualityTable />;
  }

  if (activeTab === 'hs') {
    return <HSTable />;
  }

  if (activeTab === 'risks') {
    return <RisksTable />;
  }

  if (activeTab === 'team') {
    return <TeamGrid />;
  }

  if (activeTab === 'directory') {
    return <GlobalParticipantsTable />;
  }

  return <OverviewContent onSelectProject={onSelectProject} onSelectPhase={onSelectPhase} />;
};

export default MainContent;
