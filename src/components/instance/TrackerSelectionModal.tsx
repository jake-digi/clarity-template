import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Battery, Clock, Radio } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignedTrackers: string[];
  onSave: (trackerIds: string[]) => void;
}

const TrackerSelectionModal = ({ open, onOpenChange, assignedTrackers, onSave }: Props) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedTrackers));

  // Get all unique trackers (dedupe by group_id, latest record per tracker)
  const { data: trackers = [] } = useQuery({
    queryKey: ["all-trackers"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracker_logs")
        .select("group_id, device_desc, battery_level, timestamp, latitude, longitude")
        .not("latitude", "is", null)
        .order("timestamp", { ascending: false })
        .limit(5000);
      if (error) throw error;
      // Dedupe by group_id (keep latest)
      const seen = new Map<string, any>();
      (data ?? []).forEach((t) => {
        if (!seen.has(t.group_id)) seen.set(t.group_id, t);
      });
      return [...seen.values()];
    },
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    onSave([...selected]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Trackers ({selected.size} selected)</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-80">
          <div className="space-y-1">
            {trackers.map((t) => (
              <button
                key={t.group_id}
                onClick={() => toggle(t.group_id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/50 transition-colors text-left"
              >
                <Checkbox checked={selected.has(t.group_id)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.device_desc ?? t.group_id.slice(0, 12)}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {t.battery_level !== null && (
                      <span className="flex items-center gap-1"><Battery className="w-3 h-3" />{t.battery_level}%</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(t.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                {selected.has(t.group_id) && <Badge variant="default" className="text-[10px]">Assigned</Badge>}
              </button>
            ))}
            {trackers.length === 0 && (
              <div className="py-8 text-center">
                <Radio className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No trackers found in the system.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Assignment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrackerSelectionModal;
