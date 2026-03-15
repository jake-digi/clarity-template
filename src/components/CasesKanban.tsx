import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Clock, User, GripVertical } from "lucide-react";
import type { BehaviorCase } from "@/hooks/useCases";
import { useUpdateCaseStatus } from "@/hooks/useCases";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const columns = [
  { key: "pending", label: "Pending", color: "border-t-amber-400" },
  { key: "open", label: "Open", color: "border-t-blue-500" },
  { key: "in-progress", label: "In Progress", color: "border-t-violet-500" },
  { key: "resolved", label: "Resolved", color: "border-t-emerald-500" },
  { key: "closed", label: "Closed", color: "border-t-muted-foreground" },
];

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

interface Props {
  cases: BehaviorCase[];
}

const CasesKanban = ({ cases }: Props) => {
  const navigate = useNavigate();
  const updateStatus = useUpdateCaseStatus();
  const { data: user } = useUser();

  const grouped = columns.map((col) => ({
    ...col,
    items: cases.filter((c) => c.status === col.key),
  }));

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination, source } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const oldStatus = source.droppableId;
    const newStatus = destination.droppableId;

    updateStatus.mutate(
      {
        caseId: draggableId,
        oldStatus,
        newStatus,
        performedBy: user?.id ?? "",
        performedByName: user?.full_name ?? "Unknown",
      },
      {
        onSuccess: () => toast.success(`Case moved to ${columns.find((c) => c.key === newStatus)?.label}`),
        onError: () => toast.error("Failed to update case status"),
      }
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
        {grouped.map((col) => (
          <div key={col.key} className="flex-shrink-0 w-[280px] flex flex-col">
            <div className={`bg-card border border-border border-t-[3px] ${col.color} rounded-t-md px-3 py-2.5 flex items-center justify-between`}>
              <span className="text-sm font-semibold text-foreground">{col.label}</span>
              <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] justify-center">
                {col.items.length}
              </Badge>
            </div>

            <Droppable droppableId={col.key}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 border border-t-0 border-border rounded-b-md p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] transition-colors ${
                    snapshot.isDraggingOver ? "bg-accent/40" : "bg-muted/30"
                  }`}
                >
                  {col.items.length === 0 && !snapshot.isDraggingOver && (
                    <p className="text-xs text-muted-foreground text-center py-6">No cases</p>
                  )}
                  {col.items.map((c, index) => (
                    <Draggable key={c.id} draggableId={c.id} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <Card
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={`p-3 border-border transition-shadow ${
                            dragSnapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : "hover:shadow-md"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-1.5 min-w-0">
                                <span {...dragProvided.dragHandleProps} className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                                  <GripVertical className="w-3.5 h-3.5" />
                                </span>
                                <p
                                  className="text-sm font-medium text-foreground leading-tight line-clamp-2 cursor-pointer hover:underline"
                                  onClick={() => navigate(`/cases/${c.id}`)}
                                >
                                  {c.participant_name}
                                </p>
                              </div>
                              <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${severityColors[c.severity_level] ?? ""}`}>
                                {c.severity_level}
                              </span>
                            </div>

                            {c.overview && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{c.overview}</p>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <Badge variant="outline" className="text-[10px] h-5">{c.category}</Badge>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              </span>
                            </div>

                            {(c.assigned_to_name || c.requires_immediate_action) && (
                              <div className="flex items-center gap-2 pt-0.5">
                                {c.requires_immediate_action && (
                                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                                )}
                                {c.assigned_to_name && (
                                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <User className="w-3 h-3" /> {c.assigned_to_name}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default CasesKanban;
