import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, DoorOpen, Users, Check } from "lucide-react";
import type { RoomOccupant } from "@/hooks/useAccommodation";

interface Props {
  roomId: string | null;
  rooms: Array<{ id: string; room_number: string; name: string | null; capacity: number | null; block_id: string }>;
  unassigned: RoomOccupant[];
  reassignMode?: boolean;
  currentOccupant?: RoomOccupant | null;
  occupantsByRoom?: Map<string, RoomOccupant[]>;
  onAssign: (assignmentId: string, roomId: string) => void;
  onClose: () => void;
}

const RoomAssignDialog = ({
  roomId,
  rooms,
  unassigned,
  reassignMode,
  currentOccupant,
  occupantsByRoom,
  onAssign,
  onClose,
}: Props) => {
  const [search, setSearch] = useState("");

  const open = !!roomId;

  // For assign mode: search through unassigned people
  // For reassign mode: show room list to pick destination
  const filteredPeople = useMemo(() => {
    if (reassignMode) return [];
    if (!search) return unassigned;
    const q = search.toLowerCase();
    return unassigned.filter((o) => o.personName.toLowerCase().includes(q));
  }, [unassigned, search, reassignMode]);

  const filteredRooms = useMemo(() => {
    if (!reassignMode) return [];
    const q = search.toLowerCase();
    return rooms.filter((r) => {
      if (currentOccupant?.roomId === r.id) return false;
      const name = `${r.room_number} ${r.name ?? ""}`.toLowerCase();
      return !q || name.includes(q);
    });
  }, [rooms, search, reassignMode, currentOccupant]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setSearch(""); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {reassignMode
              ? `Move ${currentOccupant?.personName ?? "Person"}`
              : `Assign to Room ${rooms.find((r) => r.id === roomId)?.room_number ?? ""}`
            }
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={reassignMode ? "Search rooms..." : "Search people..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <ScrollArea className="max-h-80">
          {!reassignMode ? (
            <div className="space-y-1">
              {filteredPeople.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {search ? "No matches" : "No unassigned people"}
                </p>
              ) : (
                filteredPeople.map((occ) => (
                  <button
                    key={occ.assignmentId}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/60 transition-colors text-left"
                    onClick={() => {
                      onAssign(occ.assignmentId, roomId!);
                      onClose();
                      setSearch("");
                    }}
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                      {occ.initials}
                    </div>
                    <span className="text-sm font-medium text-foreground flex-1 truncate">{occ.personName}</span>
                    <Badge variant="secondary" className="text-[9px] capitalize">{occ.personType}</Badge>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredRooms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No rooms available</p>
              ) : (
                filteredRooms.map((room) => {
                  const occ = occupantsByRoom?.get(room.id)?.length ?? 0;
                  const cap = room.capacity ?? 0;
                  const isFull = cap > 0 && occ >= cap;
                  return (
                    <button
                      key={room.id}
                      disabled={isFull}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/60 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => {
                        if (currentOccupant) {
                          onAssign(currentOccupant.assignmentId, room.id);
                        }
                        setSearch("");
                      }}
                    >
                      <DoorOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">{room.room_number}</span>
                        {room.name && <span className="text-xs text-muted-foreground ml-1.5">({room.name})</span>}
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Users className="w-3 h-3" />
                        {occ}{cap > 0 ? `/${cap}` : ""}
                      </span>
                      {isFull && <Badge variant="secondary" className="text-[8px] px-1 py-0">Full</Badge>}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default RoomAssignDialog;
