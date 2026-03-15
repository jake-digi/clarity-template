import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ── Roles ──
export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .is("deleted_at", null)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

// ── Permissions ──
export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .is("deleted_at", null)
        .order("category")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

// ── Role-Permission Mappings ──
export function useRolePermissions(roleId: string | null) {
  return useQuery({
    queryKey: ["role-permissions", roleId],
    enabled: !!roleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permission_mappings")
        .select("permission_id")
        .eq("role_id", roleId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.permission_id);
    },
  });
}

// ── User Role Assignments ──
export function useUserRoleAssignments() {
  return useQuery({
    queryKey: ["user-role-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_role_assignments")
        .select("*")
        .is("removed_at", null);
      if (error) throw error;

      if (!data?.length) return [];

      const userIds = [...new Set(data.map((a) => a.user_id))];
      const roleIds = [...new Set(data.map((a) => a.role_id))];

      const [usersRes, rolesRes] = await Promise.all([
        supabase.from("users").select("id, first_name, last_name, email").in("id", userIds),
        supabase.from("roles").select("id, name").in("id", roleIds),
      ]);

      const userMap = Object.fromEntries((usersRes.data ?? []).map((u) => [u.id, u]));
      const roleMap = Object.fromEntries((rolesRes.data ?? []).map((r) => [r.id, r.name]));

      return data.map((a) => ({
        ...a,
        user_name: userMap[a.user_id]
          ? `${userMap[a.user_id].first_name} ${userMap[a.user_id].last_name ?? ""}`.trim()
          : a.user_id,
        user_email: userMap[a.user_id]?.email ?? "",
        role_name: roleMap[a.role_id] ?? a.role_id,
      }));
    },
  });
}

// ── Audit Logs ──
export function useRbacAuditLogs() {
  return useQuery({
    queryKey: ["rbac-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rbac_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
}

// ── Mutations ──
async function getTenantId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  const { data: u } = await supabase
    .from("users")
    .select("id, tenant_id, first_name, last_name")
    .eq("auth_id", data.user.id)
    .single();
  return u;
}

async function logAudit(
  tenantId: string,
  action: string,
  entityType: string,
  entityId: string,
  entityName: string | null,
  performedBy: string,
  performedByName: string,
  details: Record<string, string> = {},
  targetUserId?: string,
  targetUserName?: string
) {
  await supabase.from("rbac_audit_logs").insert({
    tenant_id: tenantId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    performed_by: performedBy,
    performed_by_name: performedByName,
    details: details as unknown as import("@/integrations/supabase/types").Json,
    target_user_id: targetUserId ?? null,
    target_user_name: targetUserName ?? null,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const me = await getTenantId();
      if (!me) throw new Error("User not found");
      const id = `role-${crypto.randomUUID().slice(0, 8)}`;
      const { error } = await supabase.from("roles").insert({
        id,
        name,
        description: description || null,
        tenant_id: me.tenant_id,
        is_system_role: false,
      });
      if (error) throw error;
      await logAudit(me.tenant_id, "created", "role", id, name, me.id, `${me.first_name} ${me.last_name ?? ""}`.trim());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["rbac-audit-logs"] });
      toast({ title: "Role created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ roleId, roleName }: { roleId: string; roleName: string }) => {
      const me = await getTenantId();
      if (!me) throw new Error("User not found");
      const { error } = await supabase.from("roles").update({ deleted_at: new Date().toISOString() }).eq("id", roleId);
      if (error) throw error;
      await logAudit(me.tenant_id, "deleted", "role", roleId, roleName, me.id, `${me.first_name} ${me.last_name ?? ""}`.trim());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["rbac-audit-logs"] });
      toast({ title: "Role deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useCreatePermission() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ name, description, category }: { name: string; description: string; category: string }) => {
      const me = await getTenantId();
      if (!me) throw new Error("User not found");
      const id = `perm-${crypto.randomUUID().slice(0, 8)}`;
      const { error } = await supabase.from("permissions").insert({
        id,
        name,
        description: description || null,
        category: category || null,
        tenant_id: me.tenant_id,
      });
      if (error) throw error;
      await logAudit(me.tenant_id, "created", "permission", id, name, me.id, `${me.first_name} ${me.last_name ?? ""}`.trim());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["permissions"] });
      qc.invalidateQueries({ queryKey: ["rbac-audit-logs"] });
      toast({ title: "Permission created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useToggleRolePermission() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ roleId, roleName, permissionId, permissionName, grant }: {
      roleId: string; roleName: string; permissionId: string; permissionName: string; grant: boolean;
    }) => {
      const me = await getTenantId();
      if (!me) throw new Error("User not found");
      if (grant) {
        const { error } = await supabase.from("role_permission_mappings").insert({ role_id: roleId, permission_id: permissionId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("role_permission_mappings").delete().eq("role_id", roleId).eq("permission_id", permissionId);
        if (error) throw error;
      }
      await logAudit(
        me.tenant_id,
        grant ? "granted_permission" : "revoked_permission",
        "role_permission",
        `${roleId}:${permissionId}`,
        `${roleName} → ${permissionName}`,
        me.id,
        `${me.first_name} ${me.last_name ?? ""}`.trim(),
        { role_id: roleId, permission_id: permissionId }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["role-permissions"] });
      qc.invalidateQueries({ queryKey: ["rbac-audit-logs"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useAssignRoleToUser() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ userId, userName, roleId, roleName }: {
      userId: string; userName: string; roleId: string; roleName: string;
    }) => {
      const me = await getTenantId();
      if (!me) throw new Error("User not found");
      const { error } = await supabase.from("user_role_assignments").insert({ user_id: userId, role_id: roleId });
      if (error) throw error;
      await logAudit(
        me.tenant_id, "assigned_role", "user_role", `${userId}:${roleId}`, roleName,
        me.id, `${me.first_name} ${me.last_name ?? ""}`.trim(), {}, userId, userName
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-role-assignments"] });
      qc.invalidateQueries({ queryKey: ["rbac-audit-logs"] });
      toast({ title: "Role assigned" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useRevokeRoleFromUser() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ assignmentId, userName, roleName }: {
      assignmentId: string; userName: string; roleName: string;
    }) => {
      const me = await getTenantId();
      if (!me) throw new Error("User not found");
      const { error } = await supabase.from("user_role_assignments").update({ removed_at: new Date().toISOString() }).eq("id", assignmentId);
      if (error) throw error;
      await logAudit(
        me.tenant_id, "revoked_role", "user_role", assignmentId, roleName,
        me.id, `${me.first_name} ${me.last_name ?? ""}`.trim(), {}, undefined, userName
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-role-assignments"] });
      qc.invalidateQueries({ queryKey: ["rbac-audit-logs"] });
      toast({ title: "Role revoked" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
