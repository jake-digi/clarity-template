import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Activity, Code2, ChevronRight, Wrench } from "lucide-react";
import AdminRolesTab from "@/components/admin/AdminRolesTab";
import AdminActivityTab from "@/components/admin/AdminActivityTab";
import AdminDeveloperTab from "@/components/admin/AdminDeveloperTab";

const tabs = [
  { value: "roles", label: "Roles & Permissions", icon: Shield },
  { value: "activity", label: "Activity Log", icon: Activity },
  { value: "developer", label: "Developer", icon: Code2 },
];

const AdministrationPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get("tab") ?? "roles";

  const setTab = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
            {/* Page banner — matches Participants page */}
            <div className="border-b border-border bg-card px-6 py-5 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Dashboard</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">Administration</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">Administration</h1>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Manage users, roles, activity logs, and developer settings</p>
            </div>

            {/* Tab bar — sticky below banner */}
            <div className="sticky top-0 z-10 bg-card border-b border-border px-6 shrink-0">
              <TabsList className="h-auto p-0 bg-transparent rounded-none border-none gap-0">
                {tabs.map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="relative rounded-none border-none bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent gap-1.5 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-primary transition-colors hover:text-foreground"
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-auto">
              <TabsContent value="roles" className="mt-0 p-6">
                <AdminRolesTab />
              </TabsContent>
              <TabsContent value="activity" className="mt-0 p-6">
                <AdminActivityTab />
              </TabsContent>
              <TabsContent value="developer" className="mt-0">
                <AdminDeveloperTab />
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdministrationPage;
