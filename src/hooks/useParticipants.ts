import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  // Joined data
  instance_name?: string;
  subgroup_name?: string;
  supergroup_name?: string;
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

      // Fetch related instances and subgroups for name resolution
      const instanceIds = [...new Set(participants.map((p) => p.instance_id))];
      const subgroupIds = [...new Set(participants.map((p) => p.sub_group_id).filter(Boolean))] as string[];
      const supergroupIds = [...new Set(participants.map((p) => p.super_group_id).filter(Boolean))] as string[];

      const [instancesRes, subgroupsRes, supergroupsRes] = await Promise.all([
        supabase.from("instances").select("id, name").in("id", instanceIds),
        subgroupIds.length
          ? supabase.from("subgroups").select("id, name").in("id", subgroupIds)
          : Promise.resolve({ data: [], error: null }),
        supergroupIds.length
          ? supabase.from("supergroups").select("id, name").in("id", supergroupIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const instanceMap = Object.fromEntries((instancesRes.data ?? []).map((i) => [i.id, i.name]));
      const subgroupMap = Object.fromEntries((subgroupsRes.data ?? []).map((s) => [s.id, s.name]));
      const supergroupMap = Object.fromEntries((supergroupsRes.data ?? []).map((s) => [s.id, s.name]));

      return participants.map((p) => ({
        ...p,
        instance_name: instanceMap[p.instance_id] ?? p.instance_id,
        subgroup_name: p.sub_group_id ? subgroupMap[p.sub_group_id] ?? p.sub_group_id : undefined,
        supergroup_name: p.super_group_id ? supergroupMap[p.super_group_id] ?? p.super_group_id : undefined,
      }));
    },
  });
}
