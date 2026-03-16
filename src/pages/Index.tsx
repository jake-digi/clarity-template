import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardOverview from "@/components/DashboardOverview";

const Index = () => {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0 bg-white">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <DashboardOverview />
        </main>
      </div>
    </div>
  );
};

export default Index;
