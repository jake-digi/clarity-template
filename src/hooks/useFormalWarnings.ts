import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FormalWarning {
  id: string;
  tenant_id: string;
  instance_id: string;
  participant_id: string;
  case_id: string | null;
  warning_level: number;
  reason: string;
  details: string | null;
  issued_by: string | null;
  issued_by_name: string | null;
  parent_notified: boolean;
  parent_notification_date: string | null;
  acknowledged_by_participant: boolean;
  acknowledged_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // joined
  participant_name?: string;
  instance_name?: string;
}

export function useFormalWarnings(instanceId?: string) {
  return useQuery({
    queryKey: ["formal-warnings", instanceId],
    queryFn: async () => {
      let q = supabase.from("formal_warnings").select("*").order("created_at", { ascending: false });
      if (instanceId) q = q.eq("instance_id", instanceId);
      const { data, error } = await q;
      if (error) throw error;

      const participantIds = [...new Set((data ?? []).map((w: any) => w.participant_id))];
      const pRes = participantIds.length
        ? await supabase.from("participants").select("id, full_name").in("id", participantIds)
        : { data: [] };
      const pMap = Object.fromEntries((pRes.data ?? []).map((p: any) => [p.id, p.full_name]));

      return (data ?? []).map((w: any) => ({
        ...w,
        participant_name: pMap[w.participant_id] ?? w.participant_id,
      })) as FormalWarning[];
    },
  });
}
