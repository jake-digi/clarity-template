import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Key, UserCheck, ScrollText } from "lucide-react";
import RolesTab from "@/components/rbac/RolesTab";
import PermissionsTab from "@/components/rbac/PermissionsTab";
import UserAssignmentsTab from "@/components/rbac/UserAssignmentsTab";
import AuditLogTab from "@/components/rbac/AuditLogTab";

const RolesPage = () => {
  const [tab, setTab] = useState("roles");

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage access control, role definitions, and permission assignments</p>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="roles" className="gap-1.5">
                <Shield className="w-4 h-4" /> Roles
              </TabsTrigger>
              <TabsTrigger value="permissions" className="gap-1.5">
                <Key className="w-4 h-4" /> Permissions
              </TabsTrigger>
              <TabsTrigger value="assignments" className="gap-1.5">
                <UserCheck className="w-4 h-4" /> User Assignments
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-1.5">
                <ScrollText className="w-4 h-4" /> Audit Log
              </TabsTrigger>
            </TabsList>

            <TabsContent value="roles"><RolesTab /></TabsContent>
            <TabsContent value="permissions"><PermissionsTab /></TabsContent>
            <TabsContent value="assignments"><UserAssignmentsTab /></TabsContent>
            <TabsContent value="audit"><AuditLogTab /></TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default RolesPage;
