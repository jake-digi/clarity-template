import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InstanceAssignment {
  instance_id: string;
  instance_name: string;
  sub_group_id: string | null;
  subgroup_name?: string;
  super_group_id: string | null;
  supergroup_name?: string;
}

export interface ParticipantRow {
  id: string;
  first_name: string;
  surname: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  status: string;
  instance_id: string;
  sub_group_id: string | null;
  super_group_id: string | null;
  created_at: string;
  updated_at: string;
  school_institute: string | null;
  unit_name: string | null;
  rank: string | null;
  photo_link: string | null;
  is_off_site: boolean | null;
  light_load: boolean | null;
  // Legacy single-instance fields (from participants table)
  instance_name?: string;
  subgroup_name?: string;
  supergroup_name?: string;
  // Multi-instance assignments
  assignments: InstanceAssignment[];
}

export function useParticipants() {
  return useQuery({
    queryKey: ["participants"],
    queryFn: async (): Promise<ParticipantRow[]> => {
      // Fetch participants
      const { data: participants, error } = await supabase
        .from("participants")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) throw error;
      if (!participants?.length) return [];

      // Fetch all instance assignments
      const participantIds = participants.map((p) => p.id);
      const { data: assignments, error: assignError } = await supabase
        .from("participant_instance_assignments")
        .select("participant_id, instance_id, sub_group_id, super_group_id")
        .in("participant_id", participantIds);

      if (assignError) throw assignError;

      // Collect all unique IDs for name resolution
      const allInstanceIds = new Set<string>();
      const allSubgroupIds = new Set<string>();
      const allSupergroupIds = new Set<string>();

      // From participants table (legacy)
      participants.forEach((p) => {
        allInstanceIds.add(p.instance_id);
        if (p.sub_group_id) allSubgroupIds.add(p.sub_group_id);
        if (p.super_group_id) allSupergroupIds.add(p.super_group_id);
      });

      // From assignments
      (assignments ?? []).forEach((a) => {
        allInstanceIds.add(a.instance_id);
        if (a.sub_group_id) allSubgroupIds.add(a.sub_group_id);
        if (a.super_group_id) allSupergroupIds.add(a.super_group_id);
      });

      const instanceIdArr = [...allInstanceIds];
      const subgroupIdArr = [...allSubgroupIds];
      const supergroupIdArr = [...allSupergroupIds];

      const [instancesRes, subgroupsRes, supergroupsRes] = await Promise.all([
        supabase.from("instances").select("id, name").in("id", instanceIdArr),
        subgroupIdArr.length
          ? supabase.from("subgroups").select("id, name").in("id", subgroupIdArr)
          : Promise.resolve({ data: [], error: null }),
        supergroupIdArr.length
          ? supabase.from("supergroups").select("id, name").in("id", supergroupIdArr)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const instanceMap = Object.fromEntries((instancesRes.data ?? []).map((i) => [i.id, i.name]));
      const subgroupMap = Object.fromEntries((subgroupsRes.data ?? []).map((s) => [s.id, s.name]));
      const supergroupMap = Object.fromEntries((supergroupsRes.data ?? []).map((s) => [s.id, s.name]));

      // Build assignments map: participant_id → InstanceAssignment[]
      const assignmentMap = new Map<string, InstanceAssignment[]>();
      (assignments ?? []).forEach((a) => {
        const list = assignmentMap.get(a.participant_id) ?? [];
        list.push({
          instance_id: a.instance_id,
          instance_name: instanceMap[a.instance_id] ?? a.instance_id,
          sub_group_id: a.sub_group_id,
          subgroup_name: a.sub_group_id ? subgroupMap[a.sub_group_id] ?? a.sub_group_id : undefined,
          super_group_id: a.super_group_id,
          supergroup_name: a.super_group_id ? supergroupMap[a.super_group_id] ?? a.super_group_id : undefined,
        });
        assignmentMap.set(a.participant_id, list);
      });

      return participants.map((p) => {
        const pAssignments = assignmentMap.get(p.id) ?? [];

        // If no assignments found, fall back to the legacy instance_id on participants table
        const effectiveAssignments: InstanceAssignment[] = pAssignments.length > 0
          ? pAssignments
          : [{
              instance_id: p.instance_id,
              instance_name: instanceMap[p.instance_id] ?? p.instance_id,
              sub_group_id: p.sub_group_id,
              subgroup_name: p.sub_group_id ? subgroupMap[p.sub_group_id] ?? p.sub_group_id : undefined,
              super_group_id: p.super_group_id,
              supergroup_name: p.super_group_id ? supergroupMap[p.super_group_id] ?? p.super_group_id : undefined,
            }];

        return {
          ...p,
          instance_name: instanceMap[p.instance_id] ?? p.instance_id,
          subgroup_name: p.sub_group_id ? subgroupMap[p.sub_group_id] ?? p.sub_group_id : undefined,
          supergroup_name: p.super_group_id ? supergroupMap[p.super_group_id] ?? p.super_group_id : undefined,
          assignments: effectiveAssignments,
        };
      });
    },
  });
}
