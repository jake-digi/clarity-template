import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ScheduleActivity {
  id: string;
  tenant_id: string;
  instance_id: string;
  title: string;
  description: string | null;
  activity_type: string;
  location: string | null;
  start_time: string;
  end_time: string;
  day_date: string;
  color: string;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  group_names?: string[];
  group_ids?: string[];
}

export function useScheduleActivities(instanceId?: string, dayDate?: string) {
  return useQuery({
    queryKey: ["schedule-activities", instanceId, dayDate],
    enabled: !!instanceId,
    queryFn: async () => {
      let q = supabase
        .from("schedule_activities")
        .select("*")
        .eq("instance_id", instanceId!)
        .is("deleted_at", null)
        .order("start_time", { ascending: true });
      if (dayDate) q = q.eq("day_date", dayDate);
      const { data, error } = await q;
      if (error) throw error;

      const actIds = (data ?? []).map((a: any) => a.id);
      const { data: groups } = actIds.length
        ? await supabase.from("schedule_activity_groups").select("activity_id, group_id").in("activity_id", actIds)
        : { data: [] };

      const groupIds = [...new Set((groups ?? []).map((g: any) => g.group_id))];
      const { data: subgroups } = groupIds.length
        ? await supabase.from("subgroups").select("id, name").in("id", groupIds)
        : { data: [] };
      const gMap = Object.fromEntries((subgroups ?? []).map((g: any) => [g.id, g.name]));

      const actGroupMap: Record<string, { ids: string[]; names: string[] }> = {};
      (groups ?? []).forEach((g: any) => {
        if (!actGroupMap[g.activity_id]) actGroupMap[g.activity_id] = { ids: [], names: [] };
        actGroupMap[g.activity_id].ids.push(g.group_id);
        actGroupMap[g.activity_id].names.push(gMap[g.group_id] ?? g.group_id);
      });

      return (data ?? []).map((a: any) => ({
        ...a,
        group_ids: actGroupMap[a.id]?.ids ?? [],
        group_names: actGroupMap[a.id]?.names ?? [],
      })) as ScheduleActivity[];
    },
  });
}

export function useAddActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ activity, groupIds }: { activity: any; groupIds: string[] }) => {
      const { data, error } = await supabase.from("schedule_activities").insert(activity).select("id").single();
      if (error) throw error;
      if (groupIds.length > 0) {
        const rows = groupIds.map((gId) => ({ activity_id: data.id, group_id: gId, group_type: "subgroup" }));
        await supabase.from("schedule_activity_groups").insert(rows as any);
      }
      return activity.instance_id;
    },
    onSuccess: (instanceId) => { qc.invalidateQueries({ queryKey: ["schedule-activities", instanceId] }); },
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ activityId, instanceId }: { activityId: string; instanceId: string }) => {
      await supabase.from("schedule_activities").update({ deleted_at: new Date().toISOString() } as any).eq("id", activityId);
      return instanceId;
    },
    onSuccess: (instanceId) => { qc.invalidateQueries({ queryKey: ["schedule-activities", instanceId] }); },
  });
}

export function usePublishDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ instanceId, dayDate, publish }: { instanceId: string; dayDate: string; publish: boolean }) => {
      await supabase
        .from("schedule_activities")
        .update({ is_published: publish, updated_at: new Date().toISOString() } as any)
        .eq("instance_id", instanceId)
        .eq("day_date", dayDate);
      return instanceId;
    },
    onSuccess: (instanceId) => { qc.invalidateQueries({ queryKey: ["schedule-activities", instanceId] }); },
  });
}
