import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardOverview from "@/components/DashboardOverview";
import CheckpointSections from "@/components/CheckpointSections";

const Index = () => {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <DashboardOverview />
          <CheckpointSections />
        </main>
      </div>
    </div>
  );
};

export default Index;
