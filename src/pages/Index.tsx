import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import CheckpointSections from "@/components/CheckpointSections";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <CheckpointSections />
        </main>
      </div>
    </div>
  );
};

export default Index;
