import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import type { RoomOccupant } from "@/hooks/useAccommodation";

interface Props {
  occupant: RoomOccupant;
  isDraggable?: boolean;
  onViewProfile?: () => void;
}

const PersonChip = ({ occupant, isDraggable, onViewProfile }: Props) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: occupant.assignmentId,
    disabled: !isDraggable,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-all cursor-default select-none ${
        isDragging
          ? "opacity-40"
          : "hover:bg-muted/60"
      }`}
    >
      {isDraggable && (
        <span {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground">
          <GripVertical className="w-3 h-3" />
        </span>
      )}
      <div
        className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0 cursor-pointer"
        onClick={onViewProfile}
      >
        {occupant.initials}
      </div>
      <span
        className="font-medium text-foreground truncate flex-1 cursor-pointer"
        onClick={onViewProfile}
      >
        {occupant.personName}
      </span>
    </div>
  );
};

export default PersonChip;
