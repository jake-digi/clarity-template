import { useState, useMemo } from "react";
import { useScheduleActivities, useAddActivity, useDeleteActivity, usePublishDay } from "@/hooks/useSchedule";
import { useTenantId } from "@/hooks/useTenantId";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  CalendarDays, Plus, Trash2, Clock, MapPin, Users, Eye, EyeOff, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays, subDays, parseISO } from "date-fns";

const activityTypes = [
  { value: "session", label: "Session", color: "#0284c7" },
  { value: "meal", label: "Meal", color: "#16a34a" },
  { value: "free_time", label: "Free Time", color: "#8b5cf6" },
  { value: "assembly", label: "Assembly", color: "#ea580c" },
  { value: "sport", label: "Sport", color: "#0891b2" },
  { value: "travel", label: "Travel", color: "#64748b" },
  { value: "welfare", label: "Welfare", color: "#e11d48" },
  { value: "other", label: "Other", color: "#737373" },
];

const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 to 23:00

interface Props { instanceId: string }

export default function InstanceScheduleTab({ instanceId }: Props) {
  const { data: tenantId } = useTenantId();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: activities, isLoading } = useScheduleActivities(instanceId, selectedDate);
  const addActivity = useAddActivity();
  const deleteActivity = useDeleteActivity();
  const publishDay = usePublishDay();
  const [addDialog, setAddDialog] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", activity_type: "session", location: "",
    start_time: "09:00", end_time: "10:00", selectedGroups: [] as string[],
  });

  const { data: subgroups } = useQuery({
    queryKey: ["instance-subgroups", instanceId],
    queryFn: async () => {
      const { data, error } = await supabase.from("subgroups").select("id, name").eq("instance_id", instanceId).is("deleted_at", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const isPublished = (activities ?? []).length > 0 && (activities ?? []).every((a) => a.is_published);
  const hasActivities = (activities ?? []).length > 0;

  const handleAdd = () => {
    if (!form.title.trim() || !tenantId) return;
    const typeColor = activityTypes.find((t) => t.value === form.activity_type)?.color ?? "#0284c7";
    addActivity.mutate(
      {
        activity: {
          tenant_id: tenantId,
          instance_id: instanceId,
          title: form.title,
          description: form.description || null,
          activity_type: form.activity_type,
          location: form.location || null,
          start_time: `${selectedDate}T${form.start_time}:00`,
          end_time: `${selectedDate}T${form.end_time}:00`,
          day_date: selectedDate,
          color: typeColor,
          created_by: user?.id,
        },
        groupIds: form.selectedGroups,
      },
      {
        onSuccess: () => {
          setAddDialog(false);
          setForm({ title: "", description: "", activity_type: "session", location: "", start_time: "09:00", end_time: "10:00", selectedGroups: [] });
          toast.success("Activity added");
        },
        onError: () => toast.error("Failed to add activity"),
      }
    );
  };

  const handlePublish = () => {
    publishDay.mutate(
      { instanceId, dayDate: selectedDate, publish: !isPublished },
      {
        onSuccess: () => toast.success(isPublished ? "Day unpublished" : "Day published to staff"),
        onError: () => toast.error("Failed to update"),
      }
    );
  };

  const toggleGroup = (gId: string) => {
    setForm((f) => ({
      ...f,
      selectedGroups: f.selectedGroups.includes(gId)
        ? f.selectedGroups.filter((id) => id !== gId)
        : [...f.selectedGroups, gId],
    }));
  };

  // Build timeline blocks
  const timelineActivities = useMemo(() => {
    return (activities ?? []).map((a) => {
      const start = parseISO(a.start_time);
      const end = parseISO(a.end_time);
      const startHour = start.getHours() + start.getMinutes() / 60;
      const endHour = end.getHours() + end.getMinutes() / 60;
      const top = ((startHour - 6) / 18) * 100;
      const height = ((endHour - startHour) / 18) * 100;
      return { ...a, top: Math.max(0, top), height: Math.max(2, height) };
    });
  }, [activities]);

  return (
    <div className="space-y-4">
      {/* Day selector header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg">
            <CalendarDays className="w-4 h-4 text-primary" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 p-0 h-auto text-sm font-medium bg-transparent w-[130px]"
            />
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {format(parseISO(selectedDate), "EEEE, d MMMM yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasActivities && (
            <Button variant={isPublished ? "secondary" : "outline"} size="sm" className="gap-1.5 h-8" onClick={handlePublish}>
              {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {isPublished ? "Unpublish" : "Publish Day"}
            </Button>
          )}
          <Button size="sm" className="gap-1.5 h-8" onClick={() => setAddDialog(true)}>
            <Plus className="w-3.5 h-3.5" />Add Activity
          </Button>
        </div>
      </div>

      {isPublished && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          <Eye className="w-4 h-4" /> This day's schedule is published and visible to staff
        </div>
      )}

      {/* Timeline view */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (activities ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CalendarDays className="w-10 h-10 mb-3 opacity-40" />
          <p className="font-medium">No activities scheduled</p>
          <p className="text-sm mt-1">Add activities for {format(parseISO(selectedDate), "d MMMM yyyy")}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="relative" style={{ height: `${18 * 60}px` }}>
            {/* Hour lines */}
            {hours.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-border flex"
                style={{ top: `${((h - 6) / 18) * 100}%` }}
              >
                <span className="text-[10px] text-muted-foreground w-14 pl-2 -mt-2 bg-card">{`${String(h).padStart(2, "0")}:00`}</span>
              </div>
            ))}

            {/* Activity blocks */}
            {timelineActivities.map((a) => (
              <div
                key={a.id}
                className="absolute left-16 right-4 rounded-md border px-3 py-1.5 cursor-default group transition-shadow hover:shadow-md overflow-hidden"
                style={{
                  top: `${a.top}%`,
                  height: `${a.height}%`,
                  minHeight: "28px",
                  backgroundColor: `${a.color}15`,
                  borderColor: `${a.color}40`,
                  borderLeftWidth: "3px",
                  borderLeftColor: a.color,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{format(parseISO(a.start_time), "HH:mm")} – {format(parseISO(a.end_time), "HH:mm")}</span>
                      {a.location && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{a.location}</span>}
                      {a.group_names && a.group_names.length > 0 && (
                        <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{a.group_names.join(", ")}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteActivity.mutate({ activityId: a.id, instanceId }, { onSuccess: () => toast.success("Deleted") })}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Activity Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add Activity</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Morning briefing" /></div>
              <div><Label className="text-xs">Type</Label>
                <Select value={form.activity_type} onValueChange={(v) => setForm({ ...form, activity_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Start Time *</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
              <div><Label className="text-xs">End Time *</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Main hall" /></div>
            <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            {(subgroups ?? []).length > 0 && (
              <div>
                <Label className="text-xs mb-1.5 block">Assign to Groups</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {(subgroups ?? []).map((g) => (
                    <label key={g.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                      <Checkbox checked={form.selectedGroups.includes(g.id)} onCheckedChange={() => toggleGroup(g.id)} />
                      {g.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.title.trim()}>Add Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
