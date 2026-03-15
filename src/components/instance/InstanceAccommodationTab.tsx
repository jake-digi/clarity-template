import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard, EmptyState } from "@/components/participant/ProfileShared";
import { Building, Bed, Users, DoorOpen } from "lucide-react";

interface Props {
  instanceId: string;
}

const InstanceAccommodationTab = ({ instanceId }: Props) => {
  // First get instance to find its site_id
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

  const { data: blocks, isLoading: blocksLoading } = useQuery({
    queryKey: ["instance-blocks", instanceId, siteId],
    queryFn: async () => {
      let query = supabase
        .from("blocks")
        .select("*")
        .is("deleted_at", null)
        .order("name");

      if (siteId) {
        // Get blocks for this instance OR its linked site
        query = query.or(`instance_id.eq.${instanceId},site_id.eq.${siteId}`);
      } else {
        query = query.eq("instance_id", instanceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["instance-rooms", instanceId, siteId],
    queryFn: async () => {
      let query = supabase
        .from("rooms")
        .select("*")
        .is("deleted_at", null)
        .order("room_number");

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

  // Count participants per room
  const { data: roomOccupancy } = useQuery({
    queryKey: ["instance-room-occupancy", instanceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participant_instance_assignments")
        .select("room_id")
        .eq("instance_id", instanceId)
        .not("room_id", "is", null);
      if (error) throw error;
      const counts = new Map<string, number>();
      (data ?? []).forEach((r) => {
        if (r.room_id) counts.set(r.room_id, (counts.get(r.room_id) ?? 0) + 1);
      });
      return counts;
    },
  });

  const isLoading = blocksLoading || roomsLoading;

  if (isLoading) {
    return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!blocks?.length) {
    return (
      <SectionCard title="Accommodation" icon={Building}>
        <EmptyState icon={Building} message="No accommodation blocks configured for this instance." />
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {blocks.length} block{blocks.length !== 1 ? "s" : ""} · {(rooms ?? []).length} room{(rooms ?? []).length !== 1 ? "s" : ""}
      </p>

      {blocks.map((block) => {
        const blockRooms = (rooms ?? []).filter((r) => r.block_id === block.id);
        return (
          <SectionCard key={block.id} title={block.name} icon={Building}>
            {block.description && <p className="text-xs text-muted-foreground mb-3">{block.description}</p>}
            {blockRooms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rooms in this block</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {blockRooms.map((room) => {
                  const occ = roomOccupancy?.get(room.id) ?? 0;
                  const cap = room.capacity ?? 0;
                  const isFull = cap > 0 && occ >= cap;
                  return (
                    <div
                      key={room.id}
                      className="flex flex-col gap-1 px-3 py-2.5 rounded-md border border-border bg-muted/30"
                    >
                      <div className="flex items-center gap-1.5">
                        <DoorOpen className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{room.room_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Users className="w-3 h-3" />
                          {occ}{cap > 0 ? `/${cap}` : ""}
                        </span>
                        {isFull && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Full</Badge>}
                      </div>
                      {room.name && <span className="text-[10px] text-muted-foreground truncate">{room.name}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        );
      })}
    </div>
  );
};

export default InstanceAccommodationTab;
