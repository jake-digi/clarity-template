import RolesTab from "@/components/rbac/RolesTab";
import PermissionsTab from "@/components/rbac/PermissionsTab";
import UserAssignmentsTab from "@/components/rbac/UserAssignmentsTab";
import AuditLogTab from "@/components/rbac/AuditLogTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Shield, Key, UserCheck, ScrollText } from "lucide-react";

const AdminRolesTab = () => {
  const [sub, setSub] = useState("roles");

  return (
    <Tabs value={sub} onValueChange={setSub}>
      <TabsList className="h-9">
        <TabsTrigger value="roles" className="gap-1 text-xs"><Shield className="w-3.5 h-3.5" />Roles</TabsTrigger>
        <TabsTrigger value="permissions" className="gap-1 text-xs"><Key className="w-3.5 h-3.5" />Permissions</TabsTrigger>
        <TabsTrigger value="assignments" className="gap-1 text-xs"><UserCheck className="w-3.5 h-3.5" />User Assignments</TabsTrigger>
        <TabsTrigger value="audit" className="gap-1 text-xs"><ScrollText className="w-3.5 h-3.5" />Audit Log</TabsTrigger>
      </TabsList>
      <TabsContent value="roles" className="mt-4"><RolesTab /></TabsContent>
      <TabsContent value="permissions" className="mt-4"><PermissionsTab /></TabsContent>
      <TabsContent value="assignments" className="mt-4"><UserAssignmentsTab /></TabsContent>
      <TabsContent value="audit" className="mt-4"><AuditLogTab /></TabsContent>
    </Tabs>
  );
};

export default AdminRolesTab;
