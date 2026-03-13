import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import CurrencyWidget from "@/components/CurrencyWidget";
import ClockWidget from "@/components/ClockWidget";
import HeroCarousel from "@/components/HeroCarousel";
import InfoSystems from "@/components/InfoSystems";
import DigitalServices from "@/components/DigitalServices";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex flex-col w-full">
        <DashboardHeader />
        <div className="flex flex-1">
          <DashboardSidebar />
          <main className="flex-1 p-6 space-y-6 overflow-auto">
            <div className="flex items-center mb-2">
              <SidebarTrigger />
            </div>
            {/* Hero section: currency | carousel | clock */}
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
