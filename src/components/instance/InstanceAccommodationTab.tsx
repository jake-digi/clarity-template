import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useAccommodation, type RoomOccupant } from "@/hooks/useAccommodation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionCard, EmptyState } from "@/components/participant/ProfileShared";
import {
  Building, DoorOpen, Users, Map, Pencil, Search, UserPlus,
  GripVertical, ArrowRightLeft, X,
} from "lucide-react";
import { toast } from "sonner";
import RoomCard from "@/components/instance/RoomCard";
import PersonChip from "@/components/instance/PersonChip";
import RoomAssignDialog from "@/components/instance/RoomAssignDialog";
import ParticipantDrawer from "@/components/ParticipantDrawer";

interface Props {
  instanceId: string;
}

const InstanceAccommodationTab = ({ instanceId }: Props) => {
  const navigate = useNavigate();
  const { blocks, rooms, occupants, siteId, isLoading, assignToRoom } = useAccommodation(instanceId);

  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [assignDialogRoom, setAssignDialogRoom] = useState<string | null>(null);
  const [reassignOccupant, setReassignOccupant] = useState<RoomOccupant | null>(null);
  const [drawerParticipantId, setDrawerParticipantId] = useState<string | null>(null);

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const sensors = useSensors(pointerSensor);

  // Occupants grouped by room
  const occupantsByRoom = useMemo(() => {
    const map = new window.Map() as globalThis.Map<string, RoomOccupant[]>;
    occupants.forEach((o) => {
      const key = o.roomId ?? "__unassigned";
      const arr = map.get(key) ?? [];
      arr.push(o);
      map.set(key, arr);
    });
    return map;
  }, [occupants]);

  const unassigned = useMemo(() => {
    const list = occupantsByRoom.get("__unassigned") ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((o) => o.personName.toLowerCase().includes(q));
  }, [occupantsByRoom, search]);

  const activePerson = activeId ? occupants.find((o) => o.assignmentId === activeId) : null;

  // DnD handlers
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const assignmentId = active.id as string;
    const targetRoomId = over.id as string;

    if (targetRoomId === "__unassigned") {
      assignToRoom.mutate({ assignmentId, roomId: null, blockId: null });
      toast.success("Removed from room");
      return;
    }

    const room = rooms.find((r) => r.id === targetRoomId);
    if (!room) return;

    const currentOcc = occupantsByRoom.get(targetRoomId)?.length ?? 0;
    if (room.capacity && currentOcc >= room.capacity) {
      toast.error("Room is full", { description: `${room.room_number} is at capacity (${room.capacity})` });
      return;
    }

    assignToRoom.mutate({ assignmentId, roomId: targetRoomId, blockId: room.block_id });
    toast.success(`Moved to Room ${room.room_number}`);
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!blocks.length) {
    return (
      <SectionCard title="Accommodation" icon={Building}>
        <EmptyState
          icon={Building}
          message="No accommodation blocks configured. Link a site with blocks or add accommodation directly."
        />
        {siteId && (
          <Button variant="outline" className="mt-3 gap-2" onClick={() => navigate(`/sites/${siteId}`)}>
            <Pencil className="w-3.5 h-3.5" />Edit Site
          </Button>
        )}
      </SectionCard>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-6">
        {/* Main room grid */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-muted-foreground">
              {blocks.length} block{blocks.length !== 1 ? "s" : ""} · {rooms.length} room{rooms.length !== 1 ? "s" : ""} · {occupants.length} assigned
            </p>
            <div className="flex items-center gap-2">
              {siteId && (
                <>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => navigate(`/sites/${siteId}`)}>
                    <Map className="w-3.5 h-3.5" />View Map
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => navigate(`/sites/${siteId}`)}>
                    <Pencil className="w-3.5 h-3.5" />Edit Site
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Blocks + Rooms */}
          {blocks.map((block) => {
            const blockRooms = rooms.filter((r) => r.block_id === block.id);
            return (
              <SectionCard key={block.id} title={block.name} icon={Building}>
                {block.description && (
                  <p className="text-xs text-muted-foreground mb-3">{block.description}</p>
                )}
                {blockRooms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No rooms in this block</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {blockRooms.map((room) => {
                      const roomOcc = occupantsByRoom.get(room.id) ?? [];
                      return (
                        <RoomCard
                          key={room.id}
                          room={room}
                          occupants={roomOcc}
                          onAssign={() => setAssignDialogRoom(room.id)}
                          onReassign={(occ) => setReassignOccupant(occ)}
                          onRemove={(occ) => {
                            assignToRoom.mutate({ assignmentId: occ.assignmentId, roomId: null, blockId: null });
                            toast.success(`${occ.personName} removed from room`);
                          }}
                          onViewProfile={(occ) => {
                            if (occ.personType === "participant") setDrawerParticipantId(occ.personId);
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            );
          })}
        </div>

        {/* Unassigned sidebar */}
        <div className="w-64 shrink-0">
          <div className="sticky top-0 bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-foreground">Unassigned</h3>
                <Badge variant="secondary" className="text-[10px] ml-auto">{unassigned.length}</Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-7 text-xs"
                />
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="p-2 space-y-1" id="__unassigned">
                {unassigned.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    {search ? "No matches" : "Everyone is assigned!"}
                  </p>
                ) : (
                  unassigned.map((occ) => (
                    <PersonChip
                      key={occ.assignmentId}
                      occupant={occ}
                      isDraggable
                      onViewProfile={() => {
                        if (occ.personType === "participant") setDrawerParticipantId(occ.personId);
                      }}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activePerson ? (
          <div className="bg-card border border-primary shadow-lg rounded-md px-3 py-2 flex items-center gap-2 text-sm opacity-90">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
              {activePerson.initials}
            </div>
            <span className="font-medium text-foreground">{activePerson.personName}</span>
          </div>
        ) : null}
      </DragOverlay>

      {/* Assign dialog (click-to-assign) */}
      <RoomAssignDialog
        roomId={assignDialogRoom}
        rooms={rooms}
        unassigned={occupantsByRoom.get("__unassigned") ?? []}
        onAssign={(assignmentId, roomId) => {
          const room = rooms.find((r) => r.id === roomId);
          assignToRoom.mutate({ assignmentId, roomId, blockId: room?.block_id ?? null });
          toast.success("Assigned to room");
        }}
        onClose={() => setAssignDialogRoom(null)}
      />

      {/* Reassign dialog */}
      <RoomAssignDialog
        roomId={reassignOccupant ? "__reassign" : null}
        rooms={rooms}
        unassigned={reassignOccupant ? [reassignOccupant] : []}
        reassignMode
        currentOccupant={reassignOccupant}
        occupantsByRoom={occupantsByRoom}
        onAssign={(assignmentId, roomId) => {
          const room = rooms.find((r) => r.id === roomId);
          assignToRoom.mutate({ assignmentId, roomId, blockId: room?.block_id ?? null });
          toast.success(`Moved to Room ${room?.room_number}`);
          setReassignOccupant(null);
        }}
        onClose={() => setReassignOccupant(null)}
      />

      <ParticipantDrawer
        participantId={drawerParticipantId}
        open={!!drawerParticipantId}
        onOpenChange={(open) => { if (!open) setDrawerParticipantId(null); }}
      />
    </DndContext>
  );
};

export default InstanceAccommodationTab;
