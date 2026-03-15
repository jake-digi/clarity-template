import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "./useTenantId";
import { toast } from "sonner";

export interface Supergroup {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  purpose: string | null;
  instance_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Subgroup {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  purpose: string | null;
  parent_supergroup_id: string;
  instance_id: string;
  tenant_id: string;
  hardware_id: string | null;
  tracker_name: string | null;
  is_vehicle: boolean | null;
  notifications: boolean | null;
  route_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── Queries ──

export function useSupergroups(instanceId: string) {
  return useQuery({
    queryKey: ["supergroups", instanceId],
    enabled: !!instanceId,
    queryFn: async (): Promise<Supergroup[]> => {
      const { data, error } = await supabase
        .from("supergroups")
        .select("*")
        .eq("instance_id", instanceId)
        .is("deleted_at", null)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubgroups(instanceId: string) {
  return useQuery({
    queryKey: ["subgroups", instanceId],
    enabled: !!instanceId,
    queryFn: async (): Promise<Subgroup[]> => {
      const { data, error } = await supabase
        .from("subgroups")
        .select("*")
        .eq("instance_id", instanceId)
        .is("deleted_at", null)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubgroupParticipants(instanceId: string) {
  return useQuery({
    queryKey: ["subgroup-participants", instanceId],
    enabled: !!instanceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participant_instance_assignments")
        .select("id, participant_id, sub_group_id, super_group_id")
        .eq("instance_id", instanceId);
      if (error) throw error;
      if (!data?.length) return { assignments: [], participantMap: new Map<string, { id: string; full_name: string; first_name: string; surname: string; photo_link: string | null }>() };

      const pIds = [...new Set(data.map((a) => a.participant_id))];
      const { data: participants } = await supabase
        .from("participants")
        .select("id, full_name, first_name, surname, photo_link")
        .in("id", pIds);

      const participantMap = new Map(
        (participants ?? []).map((p) => [p.id, p])
      );

      return { assignments: data, participantMap };
    },
  });
}

export function useInstanceStaff(instanceId: string) {
  return useQuery({
    queryKey: ["instance-staff", instanceId],
    enabled: !!instanceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_instance_assignments")
        .select("id, user_id, role")
        .eq("instance_id", instanceId)
        .is("removed_at", null);
      if (error) throw error;
      if (!data?.length) return [];

      const uIds = [...new Set(data.map((a) => a.user_id))];
      const { data: users } = await supabase
        .from("users")
        .select("id, first_name, last_name, surname, email")
        .in("id", uIds);

      const userMap = new Map((users ?? []).map((u) => [u.id, u]));
      return data.map((a) => ({ ...a, user: userMap.get(a.user_id) }));
    },
  });
}

// ── Supergroup Mutations ──

export function useCreateSupergroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; type?: string; purpose?: string; instance_id: string; tenant_id: string }) => {
      const id = `sg-${crypto.randomUUID().slice(0, 12)}`;
      const { error } = await supabase.from("supergroups").insert({ id, ...input });
      if (error) throw error;
      return id;
    },
    onSuccess: (_id, vars) => {
      qc.invalidateQueries({ queryKey: ["supergroups", vars.instance_id] });
      toast.success("Supergroup created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSupergroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, instance_id, ...updates }: { id: string; instance_id: string; name?: string; description?: string; type?: string; purpose?: string }) => {
      const { error } = await supabase.from("supergroups").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["supergroups", vars.instance_id] });
      toast.success("Supergroup updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSupergroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, instance_id }: { id: string; instance_id: string }) => {
      const { error } = await supabase.from("supergroups").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      // Also soft-delete all child subgroups
      await supabase.from("subgroups").update({ deleted_at: new Date().toISOString() }).eq("parent_supergroup_id", id);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["supergroups", vars.instance_id] });
      qc.invalidateQueries({ queryKey: ["subgroups", vars.instance_id] });
      toast.success("Supergroup deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Subgroup Mutations ──

export function useCreateSubgroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; type?: string; purpose?: string; parent_supergroup_id: string; instance_id: string; tenant_id: string }) => {
      const id = `sub-${crypto.randomUUID().slice(0, 12)}`;
      const { error } = await supabase.from("subgroups").insert({ id, ...input });
      if (error) throw error;
      return id;
    },
    onSuccess: (_id, vars) => {
      qc.invalidateQueries({ queryKey: ["subgroups", vars.instance_id] });
      toast.success("Subgroup created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSubgroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, instance_id, ...updates }: { id: string; instance_id: string; name?: string; description?: string; type?: string; purpose?: string; parent_supergroup_id?: string }) => {
      const { error } = await supabase.from("subgroups").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["subgroups", vars.instance_id] });
      toast.success("Subgroup updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSubgroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, instance_id }: { id: string; instance_id: string }) => {
      const { error } = await supabase.from("subgroups").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["subgroups", vars.instance_id] });
      toast.success("Subgroup deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Participant Assignment Mutations ──

export function useAssignParticipantToSubgroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ assignmentId, subGroupId, superGroupId, instanceId }: {
      assignmentId: string; subGroupId: string | null; superGroupId: string | null; instanceId: string;
    }) => {
      const { error } = await supabase
        .from("participant_instance_assignments")
        .update({ sub_group_id: subGroupId, super_group_id: superGroupId, updated_at: new Date().toISOString() })
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["subgroup-participants", vars.instanceId] });
      toast.success("Participant assigned");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
