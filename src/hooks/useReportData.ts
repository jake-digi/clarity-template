import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReportResult {
  columns: string[];
  rows: string[][];
  summary: { label: string; value: string | number }[];
}

async function runParticipantSummary(): Promise<ReportResult> {
  const { data, error } = await supabase
    .from("participants")
    .select("id, full_name, gender, status, instance_id, sub_group_id, super_group_id, created_at");
  if (error) throw error;
  const rows = data ?? [];

  // Resolve instance names
  const instanceIds = [...new Set(rows.map((r) => r.instance_id).filter(Boolean))];
  const iRes = instanceIds.length
    ? await supabase.from("instances").select("id, name").in("id", instanceIds)
    : { data: [] };
  const iMap = Object.fromEntries((iRes.data ?? []).map((i) => [i.id, i.name]));

  // Summary stats
  const genderCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const instanceCounts: Record<string, number> = {};
  rows.forEach((r) => {
    const g = r.gender || "Not specified";
    genderCounts[g] = (genderCounts[g] ?? 0) + 1;
    const s = r.status || "active";
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    const inst = iMap[r.instance_id] || r.instance_id || "Unassigned";
    instanceCounts[inst] = (instanceCounts[inst] ?? 0) + 1;
  });

  const summary = [
    { label: "Total Participants", value: rows.length },
    ...Object.entries(genderCounts).map(([k, v]) => ({ label: `Gender: ${k}`, value: v })),
    ...Object.entries(statusCounts).map(([k, v]) => ({ label: `Status: ${k}`, value: v })),
  ];

  return {
    columns: ["Name", "Gender", "Status", "Instance", "Created"],
    rows: rows.map((r) => [
      r.full_name,
      r.gender || "—",
      r.status || "active",
      iMap[r.instance_id] || "—",
      new Date(r.created_at).toLocaleDateString(),
    ]),
    summary,
  };
}

async function runAttendanceReport(): Promise<ReportResult> {
  const { data, error } = await supabase
    .from("checkin_sessions")
    .select("*")
    .order("started_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  const instanceIds = [...new Set(rows.map((r) => r.instance_id))];
  const iRes = instanceIds.length
    ? await supabase.from("instances").select("id, name").in("id", instanceIds)
    : { data: [] };
  const iMap = Object.fromEntries((iRes.data ?? []).map((i) => [i.id, i.name]));

  const completed = rows.filter((r) => r.completed_at);

  return {
    columns: ["Session Name", "Type", "Instance", "Started", "Completed", "Attendee Count"],
    rows: rows.map((r) => {
      const attendees = Array.isArray(r.attendees) ? r.attendees : [];
      return [
        r.session_name,
        r.session_type || "—",
        iMap[r.instance_id] || "—",
        new Date(r.started_at).toLocaleString(),
        r.completed_at ? new Date(r.completed_at).toLocaleString() : "In Progress",
        String(attendees.length),
      ];
    }),
    summary: [
      { label: "Total Sessions", value: rows.length },
      { label: "Completed", value: completed.length },
      { label: "In Progress", value: rows.length - completed.length },
    ],
  };
}

async function runCasesReport(): Promise<ReportResult> {
  const { data, error } = await supabase
    .from("behavior_cases")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  const participantIds = [...new Set(rows.map((r) => r.participant_id))];
  const instanceIds = [...new Set(rows.map((r) => r.instance_id))];
  const [pRes, iRes] = await Promise.all([
    participantIds.length
      ? supabase.from("participants").select("id, full_name").in("id", participantIds)
      : { data: [] },
    instanceIds.length
      ? supabase.from("instances").select("id, name").in("id", instanceIds)
      : { data: [] },
  ]);
  const pMap = Object.fromEntries((pRes.data ?? []).map((p) => [p.id, p.full_name]));
  const iMap = Object.fromEntries((iRes.data ?? []).map((i) => [i.id, i.name]));

  const severityCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  rows.forEach((r) => {
    severityCounts[r.severity_level] = (severityCounts[r.severity_level] ?? 0) + 1;
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
    categoryCounts[r.category] = (categoryCounts[r.category] ?? 0) + 1;
  });

  return {
    columns: ["Participant", "Instance", "Category", "Severity", "Status", "Date"],
    rows: rows.map((r) => [
      pMap[r.participant_id] ?? r.participant_id,
      iMap[r.instance_id] ?? r.instance_id,
      r.category,
      r.severity_level,
      r.status,
      new Date(r.created_at).toLocaleDateString(),
    ]),
    summary: [
      { label: "Total Cases", value: rows.length },
      ...Object.entries(severityCounts).map(([k, v]) => ({ label: `Severity: ${k}`, value: v })),
      ...Object.entries(statusCounts).map(([k, v]) => ({ label: `Status: ${k}`, value: v })),
    ],
  };
}

async function runAccommodationReport(): Promise<ReportResult> {
  const { data: rooms, error: rErr } = await supabase
    .from("rooms")
    .select("*")
    .is("deleted_at", null)
    .order("room_number");
  if (rErr) throw rErr;

  const { data: blocks } = await supabase.from("blocks").select("id, name").is("deleted_at", null);
  const blockMap = Object.fromEntries((blocks ?? []).map((b) => [b.id, b.name]));

  // Count occupants per room
  const { data: assignments } = await supabase
    .from("participant_instance_assignments")
    .select("room_id");
  const roomOccupancy: Record<string, number> = {};
  (assignments ?? []).forEach((a) => {
    if (a.room_id) roomOccupancy[a.room_id] = (roomOccupancy[a.room_id] ?? 0) + 1;
  });

  const allRooms = rooms ?? [];
  const totalCapacity = allRooms.reduce((s, r) => s + (r.capacity ?? 0), 0);
  const totalOccupied = allRooms.reduce((s, r) => s + (roomOccupancy[r.id] ?? 0), 0);

  return {
    columns: ["Room", "Block", "Type", "Capacity", "Occupants", "Utilisation"],
    rows: allRooms.map((r) => {
      const occ = roomOccupancy[r.id] ?? 0;
      const cap = r.capacity ?? 0;
      const util = cap > 0 ? `${Math.round((occ / cap) * 100)}%` : "—";
      return [r.room_number, blockMap[r.block_id] ?? "—", r.room_type, String(cap), String(occ), util];
    }),
    summary: [
      { label: "Total Rooms", value: allRooms.length },
      { label: "Total Capacity", value: totalCapacity },
      { label: "Total Occupants", value: totalOccupied },
      { label: "Overall Utilisation", value: totalCapacity > 0 ? `${Math.round((totalOccupied / totalCapacity) * 100)}%` : "—" },
    ],
  };
}

async function runWarningsReport(): Promise<ReportResult> {
  const { data, error } = await supabase
    .from("formal_warnings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  const participantIds = [...new Set(rows.map((r) => r.participant_id))];
  const instanceIds = [...new Set(rows.map((r) => r.instance_id))];
  const [pRes, iRes] = await Promise.all([
    participantIds.length
      ? supabase.from("participants").select("id, full_name").in("id", participantIds)
      : { data: [] },
    instanceIds.length
      ? supabase.from("instances").select("id, name").in("id", instanceIds)
      : { data: [] },
  ]);
  const pMap = Object.fromEntries((pRes.data ?? []).map((p) => [p.id, p.full_name]));
  const iMap = Object.fromEntries((iRes.data ?? []).map((i) => [i.id, i.name]));

  const levelCounts: Record<number, number> = {};
  const ackCount = rows.filter((r) => r.acknowledged_by_participant).length;
  rows.forEach((r) => {
    levelCounts[r.warning_level] = (levelCounts[r.warning_level] ?? 0) + 1;
  });

  return {
    columns: ["Participant", "Instance", "Level", "Reason", "Issued By", "Acknowledged", "Date"],
    rows: rows.map((r) => [
      pMap[r.participant_id] ?? r.participant_id,
      iMap[r.instance_id] ?? r.instance_id,
      String(r.warning_level),
      r.reason,
      r.issued_by_name ?? "—",
      r.acknowledged_by_participant ? "Yes" : "No",
      new Date(r.created_at).toLocaleDateString(),
    ]),
    summary: [
      { label: "Total Warnings", value: rows.length },
      { label: "Acknowledged", value: ackCount },
      { label: "Unacknowledged", value: rows.length - ackCount },
      ...Object.entries(levelCounts).map(([k, v]) => ({ label: `Level ${k}`, value: v })),
    ],
  };
}

async function runInstanceComparison(): Promise<ReportResult> {
  const { data: instances, error } = await supabase
    .from("instances")
    .select("*")
    .is("deleted_at", null)
    .order("start_date", { ascending: false });
  if (error) throw error;
  const rows = instances ?? [];
  const ids = rows.map((i) => i.id);

  const [pRes, cRes, wRes] = await Promise.all([
    ids.length
      ? supabase.from("participant_instance_assignments").select("instance_id").in("instance_id", ids)
      : { data: [] },
    ids.length
      ? supabase.from("behavior_cases").select("instance_id").in("instance_id", ids)
      : { data: [] },
    ids.length
      ? supabase.from("formal_warnings").select("instance_id").in("instance_id", ids)
      : { data: [] },
  ]);

  const count = (arr: { instance_id: string }[] | null, id: string) =>
    (arr ?? []).filter((r) => r.instance_id === id).length;

  return {
    columns: ["Instance", "Status", "Location", "Start Date", "End Date", "Participants", "Cases", "Warnings"],
    rows: rows.map((i) => [
      i.name,
      i.status,
      i.location ?? "—",
      i.start_date ? new Date(i.start_date).toLocaleDateString() : "—",
      i.end_date ? new Date(i.end_date).toLocaleDateString() : "—",
      String(count(pRes.data, i.id)),
      String(count(cRes.data, i.id)),
      String(count(wRes.data, i.id)),
    ]),
    summary: [
      { label: "Total Instances", value: rows.length },
      { label: "Active", value: rows.filter((i) => i.status === "active").length },
      { label: "Total Participants", value: (pRes.data ?? []).length },
      { label: "Total Cases", value: (cRes.data ?? []).length },
    ],
  };
}

const reportRunners: Record<string, () => Promise<ReportResult>> = {
  r1: runParticipantSummary,
  r2: runAttendanceReport,
  r3: runCasesReport,
  r4: runAccommodationReport,
  r5: runWarningsReport,
  r6: runInstanceComparison,
};

export function useReportData(reportId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["report-data", reportId],
    enabled: !!reportId && enabled,
    queryFn: async (): Promise<ReportResult> => {
      const runner = reportRunners[reportId!];
      if (!runner) throw new Error(`Unknown report: ${reportId}`);
      return runner();
    },
  });
}
