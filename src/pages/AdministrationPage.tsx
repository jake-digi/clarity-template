import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, Activity, Code2 } from "lucide-react";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminRolesTab from "@/components/admin/AdminRolesTab";
import AdminActivityTab from "@/components/admin/AdminActivityTab";
import AdminDeveloperTab from "@/components/admin/AdminDeveloperTab";

const AdministrationPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "users";

  const setTab = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const tabs = [
    { value: "users", label: "Users", icon: Users },
    { value: "roles", label: "Roles & Permissions", icon: Shield },
    { value: "activity", label: "Activity Log", icon: Activity },
    { value: "developer", label: "Developer", icon: Code2 },
  ];

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Administration</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage users, roles, activity logs, and developer settings for your tenant
            </p>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-10">
              {tabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                  <t.icon className="w-4 h-4" />{t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="users" className="mt-6">
              <AdminUsersTab />
            </TabsContent>
            <TabsContent value="roles" className="mt-6">
              <AdminRolesTab />
            </TabsContent>
            <TabsContent value="activity" className="mt-6">
              <AdminActivityTab />
            </TabsContent>
            <TabsContent value="developer" className="mt-6">
              <AdminDeveloperTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdministrationPage;
