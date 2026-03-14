import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useParticipant(id: string) {
  return useQuery({
    queryKey: ["participant", id],
    enabled: !!id,
    queryFn: async () => {
      const [
        participantRes,
        medicalRes,
        dietaryRes,
      ] = await Promise.all([
        supabase.from("participants").select("*").eq("id", id).single(),
        supabase.from("participant_medical_info").select("*").eq("participant_id", id).maybeSingle(),
        supabase.from("participant_dietary_needs").select("*").eq("participant_id", id).maybeSingle(),
      ]);

      if (participantRes.error) throw participantRes.error;
      const p = participantRes.data;

      // Resolve names
      const [instanceRes, subgroupRes, supergroupRes] = await Promise.all([
        supabase.from("instances").select("id, name, location, start_date, end_date").eq("id", p.instance_id).single(),
        p.sub_group_id
          ? supabase.from("subgroups").select("id, name").eq("id", p.sub_group_id).single()
          : Promise.resolve({ data: null, error: null }),
        p.super_group_id
          ? supabase.from("supergroups").select("id, name").eq("id", p.super_group_id).single()
          : Promise.resolve({ data: null, error: null }),
      ]);

      return {
        ...p,
        instance: instanceRes.data,
        subgroup: subgroupRes.data,
        supergroup: supergroupRes.data,
        medical: medicalRes.data,
        dietary: dietaryRes.data,
      };
    },
  });
}
