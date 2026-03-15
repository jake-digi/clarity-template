import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DoorOpen, Users, UserPlus, MoreHorizontal, ArrowRightLeft, X, Eye } from "lucide-react";
import type { RoomOccupant } from "@/hooks/useAccommodation";
import PersonChip from "@/components/instance/PersonChip";

interface Props {
  room: { id: string; room_number: string; name: string | null; capacity: number | null; block_id: string };
  occupants: RoomOccupant[];
  onAssign: () => void;
  onReassign: (occ: RoomOccupant) => void;
  onRemove: (occ: RoomOccupant) => void;
  onViewProfile: (occ: RoomOccupant) => void;
}

const RoomCard = ({ room, occupants, onAssign, onReassign, onRemove, onViewProfile }: Props) => {
  const { setNodeRef, isOver } = useDroppable({ id: room.id });
  const cap = room.capacity ?? 0;
  const isFull = cap > 0 && occupants.length >= cap;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border bg-card transition-all min-h-[100px] flex flex-col ${
        isOver
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : isFull
          ? "border-destructive/30"
          : "border-border"
      }`}
    >
      {/* Room header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5 min-w-0">
          <DoorOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">{room.room_number}</span>
          {room.name && <span className="text-[10px] text-muted-foreground truncate">({room.name})</span>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Users className="w-3 h-3" />
            {occupants.length}{cap > 0 ? `/${cap}` : ""}
          </span>
          {isFull && <Badge variant="secondary" className="text-[8px] px-1 py-0">Full</Badge>}
        </div>
      </div>

      {/* Occupants */}
      <div className="flex-1 p-2 space-y-1">
        {occupants.map((occ) => (
          <div key={occ.assignmentId} className="group flex items-center gap-1">
            <div className="flex-1 min-w-0">
              <PersonChip occupant={occ} isDraggable onViewProfile={() => onViewProfile(occ)} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onViewProfile(occ)} className="gap-2 text-xs">
                  <Eye className="w-3 h-3" />View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onReassign(occ)} className="gap-2 text-xs">
                  <ArrowRightLeft className="w-3 h-3" />Move Room
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRemove(occ)} className="gap-2 text-xs text-destructive">
                  <X className="w-3 h-3" />Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {!isFull && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-[10px] text-muted-foreground hover:text-foreground gap-1 mt-1"
            onClick={onAssign}
          >
            <UserPlus className="w-3 h-3" />
            Assign
          </Button>
        )}
      </div>
    </div>
  );
};

export default RoomCard;
