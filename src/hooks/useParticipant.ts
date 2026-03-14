import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ParticipantAssignment {
  id: string;
  instance_id: string;
  instance_name: string;
  instance_location?: string | null;
  instance_start_date?: string | null;
  instance_end_date?: string | null;
  instance_status?: string;
  sub_group_id: string | null;
  subgroup_name?: string | null;
  super_group_id: string | null;
  supergroup_name?: string | null;
  block_id: string | null;
  room_id: string | null;
  room_number: string | null;
  is_off_site: boolean | null;
  off_site_comment: string | null;
  arrival_date: string | null;
  departure_date: string | null;
}

export interface ParticipantActivityLog {
  id: string;
  log_type: string;
  title: string | null;
  notes: string | null;
  time_observed: string;
  time_submitted: string;
  flagged_as_incident: boolean | null;
  acknowledged: boolean | null;
  instance_id: string;
}

export function useParticipant(id: string) {
  return useQuery({
    queryKey: ["participant", id],
    enabled: !!id,
    queryFn: async () => {
      // Fetch core data in parallel
      const [participantRes, medicalRes, dietaryRes, assignmentsRes, activityRes, checkinRes] = await Promise.all([
        supabase.from("participants").select("*").eq("id", id).single(),
        supabase.from("participant_medical_info").select("*").eq("participant_id", id).maybeSingle(),
        supabase.from("participant_dietary_needs").select("*").eq("participant_id", id).maybeSingle(),
        supabase.from("participant_instance_assignments").select("*").eq("participant_id", id),
        supabase.from("activity_logs").select("*").order("time_observed", { ascending: false }).limit(100),
        supabase.from("checkin_sessions").select("*").order("started_at", { ascending: false }).limit(50),
      ]);

      if (participantRes.error) throw participantRes.error;
      const p = participantRes.data;

      const rawAssignments = assignmentsRes.data ?? [];

      // Collect IDs for resolution
      const instanceIds = new Set<string>([p.instance_id]);
      const subgroupIds = new Set<string>();
      const supergroupIds = new Set<string>();

      rawAssignments.forEach((a) => {
        instanceIds.add(a.instance_id);
        if (a.sub_group_id) subgroupIds.add(a.sub_group_id);
        if (a.super_group_id) supergroupIds.add(a.super_group_id);
      });
      if (p.sub_group_id) subgroupIds.add(p.sub_group_id);
      if (p.super_group_id) supergroupIds.add(p.super_group_id);

      const [instancesRes, subgroupsRes, supergroupsRes] = await Promise.all([
        supabase.from("instances").select("id, name, location, start_date, end_date, status").in("id", [...instanceIds]),
        subgroupIds.size > 0
          ? supabase.from("subgroups").select("id, name").in("id", [...subgroupIds])
          : Promise.resolve({ data: [], error: null }),
        supergroupIds.size > 0
          ? supabase.from("supergroups").select("id, name").in("id", [...supergroupIds])
          : Promise.resolve({ data: [], error: null }),
      ]);

      const instanceMap = Object.fromEntries((instancesRes.data ?? []).map((i) => [i.id, i]));
      const subgroupMap = Object.fromEntries((subgroupsRes.data ?? []).map((s) => [s.id, s.name]));
      const supergroupMap = Object.fromEntries((supergroupsRes.data ?? []).map((s) => [s.id, s.name]));

      // Build assignments
      const assignments: ParticipantAssignment[] = rawAssignments.length > 0
        ? rawAssignments.map((a) => {
            const inst = instanceMap[a.instance_id];
            return {
              id: a.id,
              instance_id: a.instance_id,
              instance_name: inst?.name ?? a.instance_id,
              instance_location: inst?.location,
              instance_start_date: inst?.start_date,
              instance_end_date: inst?.end_date,
              instance_status: inst?.status,
              sub_group_id: a.sub_group_id,
              subgroup_name: a.sub_group_id ? subgroupMap[a.sub_group_id] ?? null : null,
              super_group_id: a.super_group_id,
              supergroup_name: a.super_group_id ? supergroupMap[a.super_group_id] ?? null : null,
              block_id: a.block_id,
              room_id: a.room_id,
              room_number: a.room_number,
              is_off_site: a.is_off_site,
              off_site_comment: a.off_site_comment,
              arrival_date: a.arrival_date,
              departure_date: a.departure_date,
            };
          })
        : [{
            id: "legacy",
            instance_id: p.instance_id,
            instance_name: instanceMap[p.instance_id]?.name ?? p.instance_id,
            instance_location: instanceMap[p.instance_id]?.location,
            instance_start_date: instanceMap[p.instance_id]?.start_date,
            instance_end_date: instanceMap[p.instance_id]?.end_date,
            instance_status: instanceMap[p.instance_id]?.status,
            sub_group_id: p.sub_group_id,
            subgroup_name: p.sub_group_id ? subgroupMap[p.sub_group_id] ?? null : null,
            super_group_id: p.super_group_id,
            supergroup_name: p.super_group_id ? supergroupMap[p.super_group_id] ?? null : null,
            block_id: p.block_id,
            room_id: p.room_id,
            room_number: p.room_number,
            is_off_site: p.is_off_site,
            off_site_comment: p.off_site_comment,
            arrival_date: p.arrival_date,
            departure_date: p.departure_date,
          }];

      // Filter activity logs for this participant's instances
      const participantInstanceIds = assignments.map((a) => a.instance_id);
      const activityLogs: ParticipantActivityLog[] = (activityRes.data ?? [])
        .filter((log) => participantInstanceIds.includes(log.instance_id))
        .map((log) => ({
          id: log.id,
          log_type: log.log_type,
          title: log.title,
          notes: log.notes,
          time_observed: log.time_observed,
          time_submitted: log.time_submitted,
          flagged_as_incident: log.flagged_as_incident,
          acknowledged: log.acknowledged,
          instance_id: log.instance_id,
        }));

      // Legacy compat
      const primaryInstance = instanceMap[p.instance_id];

      return {
        ...p,
        instance: primaryInstance ? { id: primaryInstance.id, name: primaryInstance.name, location: primaryInstance.location, start_date: primaryInstance.start_date, end_date: primaryInstance.end_date } : null,
        subgroup: p.sub_group_id ? { id: p.sub_group_id, name: subgroupMap[p.sub_group_id] ?? null } : null,
        supergroup: p.super_group_id ? { id: p.super_group_id, name: supergroupMap[p.super_group_id] ?? null } : null,
        medical: medicalRes.data,
        dietary: dietaryRes.data,
        assignments,
        activityLogs,
      };
    },
  });
}
