import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InstanceRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  settings: Record<string, any> | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  // Derived
  is_dofe: boolean;
  participant_count: number;
  subgroup_count: number;
}

export function useInstances() {
  return useQuery({
    queryKey: ["instances"],
    queryFn: async (): Promise<InstanceRow[]> => {
      const { data: instances, error } = await supabase
        .from("instances")
        .select("*")
        .is("deleted_at", null)
        .order("start_date", { ascending: false });

      if (error) throw error;
      if (!instances?.length) return [];

      const instanceIds = instances.map((i) => i.id);

      // Get counts in parallel
      const [participantsRes, subgroupsRes] = await Promise.all([
        supabase
          .from("participant_instance_assignments")
          .select("instance_id")
          .in("instance_id", instanceIds),
        supabase
          .from("subgroups")
          .select("instance_id")
          .in("instance_id", instanceIds)
          .is("deleted_at", null),
      ]);

      // Build count maps
      const pCounts = new Map<string, number>();
      (participantsRes.data ?? []).forEach((r) => {
        pCounts.set(r.instance_id, (pCounts.get(r.instance_id) ?? 0) + 1);
      });
      const sgCounts = new Map<string, number>();
      (subgroupsRes.data ?? []).forEach((r) => {
        sgCounts.set(r.instance_id, (sgCounts.get(r.instance_id) ?? 0) + 1);
      });

      return instances.map((i) => {
        const settings = i.settings as Record<string, any> | null;
        return {
          ...i,
          settings,
          is_dofe: settings?.type === "dofe" || settings?.is_dofe === true,
          participant_count: pCounts.get(i.id) ?? 0,
          subgroup_count: sgCounts.get(i.id) ?? 0,
        };
      });
    },
  });
}
