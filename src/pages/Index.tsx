import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import CurrencyWidget from "@/components/CurrencyWidget";
import ClockWidget from "@/components/ClockWidget";
import HeroCarousel from "@/components/HeroCarousel";
import CheckpointSections from "@/components/CheckpointSections";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_220px] gap-4">
            <CurrencyWidget />
            <HeroCarousel />
            <ClockWidget />
          </div>
          <CheckpointSections />
        </main>
      </div>
    </div>
  );
};

export default Index;
