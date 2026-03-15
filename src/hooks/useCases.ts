import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BehaviorCase {
  id: string;
  tenant_id: string;
  instance_id: string;
  participant_id: string;
  category: string;
  severity_level: string;
  status: string;
  overview: string | null;
  location: string | null;
  privacy_level: string;
  raised_by: string | null;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  involves_staff_member: boolean;
  is_sensitive_safeguarding: boolean;
  requires_immediate_action: boolean;
  parent_notification_sent: boolean;
  parent_notification_date: string | null;
  involved_staff: string[];
  witnesses: string[];
  metadata: Record<string, unknown>;
  timestamp: string;
  event_time: string | null;
  created_at: string;
  updated_at: string;
  // joined
  participant_name?: string;
  instance_name?: string;
}

export interface CaseAction {
  id: string;
  case_id: string;
  instance_id: string;
  participant_id: string | null;
  action_type: string;
  case_type: string;
  description: string | null;
  old_status: string | null;
  new_status: string | null;
  outcome: string | null;
  performed_by: string | null;
  performed_by_name: string | null;
  metadata: Record<string, unknown>;
  timestamp: string;
  created_at: string;
}

export interface CaseComment {
  id: string;
  case_id: string;
  author_id: string;
  author_name: string;
  content: string;
  timestamp: string;
  created_at: string;
}

export function useCases(instanceId?: string) {
  return useQuery({
    queryKey: ["behavior-cases", instanceId],
    queryFn: async () => {
      let q = supabase.from("behavior_cases").select("*").order("created_at", { ascending: false });
      if (instanceId) q = q.eq("instance_id", instanceId);
      const { data, error } = await q;
      if (error) throw error;

      // Resolve participant + instance names
      const participantIds = [...new Set((data ?? []).map((c: any) => c.participant_id))];
      const instanceIds = [...new Set((data ?? []).map((c: any) => c.instance_id))];

      const [pRes, iRes] = await Promise.all([
        participantIds.length
          ? supabase.from("participants").select("id, full_name").in("id", participantIds)
          : { data: [] },
        instanceIds.length
          ? supabase.from("instances").select("id, name").in("id", instanceIds)
          : { data: [] },
      ]);

      const pMap = Object.fromEntries((pRes.data ?? []).map((p: any) => [p.id, p.full_name]));
      const iMap = Object.fromEntries((iRes.data ?? []).map((i: any) => [i.id, i.name]));

      return (data ?? []).map((c: any) => ({
        ...c,
        participant_name: pMap[c.participant_id] ?? c.participant_id,
        instance_name: iMap[c.instance_id] ?? c.instance_id,
      })) as BehaviorCase[];
    },
  });
}

export function useCase(caseId: string) {
  return useQuery({
    queryKey: ["behavior-case", caseId],
    enabled: !!caseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("behavior_cases")
        .select("*")
        .eq("id", caseId)
        .single();
      if (error) throw error;

      const [pRes, iRes] = await Promise.all([
        supabase.from("participants").select("id, full_name").eq("id", data.participant_id).single(),
        supabase.from("instances").select("id, name").eq("id", data.instance_id).single(),
      ]);

      return {
        ...data,
        participant_name: pRes.data?.full_name ?? data.participant_id,
        instance_name: iRes.data?.name ?? data.instance_id,
      } as BehaviorCase;
    },
  });
}

export function useCaseActions(caseId: string) {
  return useQuery({
    queryKey: ["case-actions", caseId],
    enabled: !!caseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_actions")
        .select("*")
        .eq("case_id", caseId)
        .order("timestamp", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CaseAction[];
    },
  });
}

export function useCaseComments(caseId: string) {
  return useQuery({
    queryKey: ["case-comments", caseId],
    enabled: !!caseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_comments")
        .select("*")
        .eq("case_id", caseId)
        .order("timestamp", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CaseComment[];
    },
  });
}

export function useAddCaseComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (comment: { case_id: string; author_id: string; author_name: string; content: string }) => {
      const { error } = await supabase.from("case_comments").insert(comment);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["case-comments", vars.case_id] });
    },
  });
}

export function useUpdateCaseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      caseId, newStatus, oldStatus, performedBy, performedByName,
    }: {
      caseId: string; newStatus: string; oldStatus: string;
      performedBy: string; performedByName: string;
    }) => {
      const caseRes = await supabase.from("behavior_cases").select("instance_id, participant_id").eq("id", caseId).single();
      if (caseRes.error) throw caseRes.error;

      const [updateRes, actionRes] = await Promise.all([
        supabase.from("behavior_cases").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", caseId),
        supabase.from("case_actions").insert({
          case_id: caseId,
          instance_id: caseRes.data.instance_id,
          participant_id: caseRes.data.participant_id,
          action_type: "statusChange",
          description: `Status changed from ${oldStatus} to ${newStatus}`,
          old_status: oldStatus,
          new_status: newStatus,
          performed_by: performedBy,
          performed_by_name: performedByName,
        }),
      ]);
      if (updateRes.error) throw updateRes.error;
      if (actionRes.error) throw actionRes.error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["behavior-case", vars.caseId] });
      qc.invalidateQueries({ queryKey: ["behavior-cases"] });
      qc.invalidateQueries({ queryKey: ["case-actions", vars.caseId] });
    },
  });
}
