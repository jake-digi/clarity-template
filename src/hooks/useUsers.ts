import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserRow {
  id: string;
  auth_id: string;
  first_name: string;
  last_name: string | null;
  surname: string | null;
  email: string;
  status: string;
  archive_status: string;
  profile_photo_url: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  // Resolved
  instance_assignments: { instance_id: string; instance_name: string; role: string | null }[];
  role_names: string[];
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<UserRow[]> => {
      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .is("deleted_at", null)
        .order("first_name", { ascending: true });

      if (error) throw error;
      if (!users?.length) return [];

      const userIds = users.map((u) => u.id);

      // Fetch instance assignments and role assignments in parallel
      const [instanceAssignRes, roleAssignRes] = await Promise.all([
        supabase
          .from("user_instance_assignments")
          .select("user_id, instance_id, instance_name, role")
          .in("user_id", userIds)
          .is("removed_at", null),
        supabase
          .from("user_role_assignments")
          .select("user_id, role_id")
          .in("user_id", userIds)
          .is("removed_at", null),
      ]);

      // Fetch role names
      const roleIds = [...new Set((roleAssignRes.data ?? []).map((r) => r.role_id))];
      const rolesRes = roleIds.length
        ? await supabase.from("roles").select("id, name").in("id", roleIds)
        : { data: [] };

      const roleMap = Object.fromEntries((rolesRes.data ?? []).map((r) => [r.id, r.name]));

      // Build maps
      const instanceMap = new Map<string, { instance_id: string; instance_name: string; role: string | null }[]>();
      (instanceAssignRes.data ?? []).forEach((a) => {
        const list = instanceMap.get(a.user_id) ?? [];
        list.push({
          instance_id: a.instance_id,
          instance_name: a.instance_name ?? a.instance_id,
          role: a.role,
        });
        instanceMap.set(a.user_id, list);
      });

      const roleAssignMap = new Map<string, string[]>();
      (roleAssignRes.data ?? []).forEach((a) => {
        const list = roleAssignMap.get(a.user_id) ?? [];
        const name = roleMap[a.role_id] ?? a.role_id;
        if (!list.includes(name)) list.push(name);
        roleAssignMap.set(a.user_id, list);
      });

      return users.map((u) => ({
        ...u,
        instance_assignments: instanceMap.get(u.id) ?? [],
        role_names: roleAssignMap.get(u.id) ?? [],
      }));
    },
  });
}
