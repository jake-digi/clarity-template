import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RoomOccupant {
  assignmentId: string;
  personId: string;
  personName: string;
  personType: "participant" | "staff";
  initials: string;
  roomId: string | null;
  blockId: string | null;
  avatarUrl?: string | null;
}

export function useAccommodation(instanceId: string) {
  const qc = useQueryClient();

  // Get instance + site_id
  const { data: instance } = useQuery({
    queryKey: ["instance-for-accommodation", instanceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instances")
        .select("site_id")
        .eq("id", instanceId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const siteId = instance?.site_id;

  // Blocks
  const { data: blocks = [], isLoading: blocksLoading } = useQuery({
    queryKey: ["instance-blocks", instanceId, siteId],
    queryFn: async () => {
      let query = supabase.from("blocks").select("*").is("deleted_at", null).order("name");
      if (siteId) {
        query = query.or(`instance_id.eq.${instanceId},site_id.eq.${siteId}`);
      } else {
        query = query.eq("instance_id", instanceId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  // Rooms
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ["instance-rooms", instanceId, siteId],
    queryFn: async () => {
      let query = supabase.from("rooms").select("*").is("deleted_at", null).order("room_number");
      if (siteId) {
        query = query.or(`instance_id.eq.${instanceId},site_id.eq.${siteId}`);
      } else {
        query = query.eq("instance_id", instanceId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  // All people assigned to this instance (participants + staff)
  const { data: occupants = [], isLoading: occupantsLoading } = useQuery({
    queryKey: ["instance-accommodation-occupants", instanceId],
    queryFn: async () => {
      // Fetch participant assignments
      const { data: pAssignments } = await supabase
        .from("participant_instance_assignments")
        .select("id, participant_id, room_id, block_id")
        .eq("instance_id", instanceId);

      const pIds = (pAssignments ?? []).map((a) => a.participant_id);
      const { data: participants } = pIds.length
        ? await supabase.from("participants").select("id, full_name, first_name, surname, photo_link").in("id", pIds)
        : { data: [] };

      const pMap = Object.fromEntries((participants ?? []).map((p) => [p.id, p]));

      const result: RoomOccupant[] = (pAssignments ?? []).map((a) => {
        const p = pMap[a.participant_id];
        return {
          assignmentId: a.id,
          personId: a.participant_id,
          personName: p?.full_name ?? "Unknown",
          personType: "participant" as const,
          initials: `${p?.first_name?.[0] ?? ""}${p?.surname?.[0] ?? ""}`,
          roomId: a.room_id,
          blockId: a.block_id,
          avatarUrl: p?.photo_link,
        };
      });

      return result;
    },
  });

  // Assign person to room
  const assignToRoom = useMutation({
    mutationFn: async ({ assignmentId, roomId, blockId }: { assignmentId: string; roomId: string | null; blockId: string | null }) => {
      const room = rooms.find((r) => r.id === roomId);
      const { error } = await supabase
        .from("participant_instance_assignments")
        .update({
          room_id: roomId,
          block_id: blockId ?? room?.block_id ?? null,
          room_number: room?.room_number ?? null,
        })
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instance-accommodation-occupants", instanceId] });
      qc.invalidateQueries({ queryKey: ["instance-room-occupancy", instanceId] });
    },
    onError: (err: Error) => {
      toast.error("Failed to update room assignment", { description: err.message });
    },
  });

  const isLoading = blocksLoading || roomsLoading || occupantsLoading;

  return { blocks, rooms, occupants, siteId, isLoading, assignToRoom };
}
