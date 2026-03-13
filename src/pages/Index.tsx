import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import CurrencyWidget from "@/components/CurrencyWidget";
import ClockWidget from "@/components/ClockWidget";
import HeroCarousel from "@/components/HeroCarousel";
import InfoSystems from "@/components/InfoSystems";
import DigitalServices from "@/components/DigitalServices";

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6 space-y-6 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_220px] gap-4">
              <CurrencyWidget />
              <HeroCarousel />
              <ClockWidget />
            </div>
            <InfoSystems />
            <DigitalServices />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
