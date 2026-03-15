import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserDetail {
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
  roles: { id: string; name: string; description: string | null; is_system_role: boolean }[];
  instance_assignments: { id: string; instance_id: string; instance_name: string; role: string | null }[];
  group_assignments: { id: string; group_id: string; group_type: string; added_at: string }[];
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["user", userId],
    enabled: !!userId,
    queryFn: async (): Promise<UserDetail> => {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      // Fetch role assignments, instance assignments, and group assignments in parallel
      const [roleAssignRes, instanceAssignRes, groupAssignRes] = await Promise.all([
        supabase
          .from("user_role_assignments")
          .select("role_id")
          .eq("user_id", userId)
          .is("removed_at", null),
        supabase
          .from("user_instance_assignments")
          .select("id, instance_id, instance_name, role")
          .eq("user_id", userId)
          .is("removed_at", null),
        supabase
          .from("user_group_assignments")
          .select("id, group_id, group_type, added_at")
          .eq("user_id", userId)
          .is("removed_at", null),
      ]);

      // Fetch role details
      const roleIds = (roleAssignRes.data ?? []).map((r) => r.role_id);
      const rolesRes = roleIds.length
        ? await supabase.from("roles").select("id, name, description, is_system_role").in("id", roleIds)
        : { data: [] };

      return {
        ...user,
        roles: rolesRes.data ?? [],
        instance_assignments: (instanceAssignRes.data ?? []).map((a) => ({
          ...a,
          instance_name: a.instance_name ?? a.instance_id,
        })),
        group_assignments: groupAssignRes.data ?? [],
      };
    },
  });
}
