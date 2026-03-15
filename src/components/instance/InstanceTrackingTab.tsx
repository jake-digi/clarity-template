import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MapPin, Battery, Clock, Satellite, Plus, Eye, EyeOff, Radio } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "@/hooks/use-toast";
import TrackerSelectionModal from "./TrackerSelectionModal";

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface TrackerPoint {
  id: string;
  group_id: string;
  subgroup_id: string | null;
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  battery_level: number | null;
  battery_volts: number | null;
  satellite_count: number | null;
  device_desc: string | null;
  timestamp: string;
}

interface Props {
  instanceId: string;
  subgroups: { id: string; name: string; parent_supergroup_id: string }[];
  settings?: Record<string, any> | null;
}

const InstanceTrackingTab = ({ instanceId, subgroups, settings }: Props) => {
  const qc = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [trackerModal, setTrackerModal] = useState(false);
  const [visibleTrackers, setVisibleTrackers] = useState<Set<string>>(new Set());

  const assignedTrackers: string[] = useMemo(
    () => (settings?.assigned_trackers as string[]) ?? [],
    [settings]
  );

  const subgroupIds = useMemo(() => subgroups.map((s) => s.id), [subgroups]);
  const subgroupMap = useMemo(
    () => Object.fromEntries(subgroups.map((s) => [s.id, s.name])),
    [subgroups]
  );

  // Fetch tracker data - use assigned trackers OR subgroup-based query
  const { data: trackerLogs = [], isLoading } = useQuery({
    queryKey: ["tracker-logs-instance", instanceId, assignedTrackers, subgroupIds],
    enabled: assignedTrackers.length > 0 || subgroupIds.length > 0,
    refetchInterval: 30000, // Auto-refresh every 30s
    queryFn: async () => {
      let query = supabase
        .from("tracker_logs")
        .select("*")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("timestamp", { ascending: false })
        .limit(2000);

      if (assignedTrackers.length > 0) {
        query = query.in("group_id", assignedTrackers);
      } else {
        query = query.in("subgroup_id", subgroupIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as TrackerPoint[];
    },
  });

  // Group logs by group_id
  const groupedLogs = useMemo(() => {
    const map = new Map<string, TrackerPoint[]>();
    trackerLogs.forEach((t) => {
      const key = t.group_id;
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    });
    return map;
  }, [trackerLogs]);

  const latestPositions = useMemo(() => {
    const positions: TrackerPoint[] = [];
    groupedLogs.forEach((logs) => {
      if (logs.length > 0) positions.push(logs[0]);
    });
    return positions;
  }, [groupedLogs]);

  // Initialize visible trackers
  useEffect(() => {
    setVisibleTrackers(new Set(latestPositions.map((p) => p.group_id)));
  }, [latestPositions.length]);

  const selectedTrail = useMemo(() => {
    if (selectedGroup === "all") return [];
    const logs = groupedLogs.get(selectedGroup) ?? [];
    return logs
      .filter((l) => l.latitude && l.longitude)
      .map((l) => [l.latitude, l.longitude] as [number, number]);
  }, [selectedGroup, groupedLogs]);

  const center = useMemo((): [number, number] => {
    if (latestPositions.length > 0) {
      return [latestPositions[0].latitude, latestPositions[0].longitude];
    }
    return [51.5074, -0.1278];
  }, [latestPositions]);

  const batteryColor = (level: number | null) => {
    if (level === null) return "text-muted-foreground";
    if (level > 70) return "text-emerald-500";
    if (level > 30) return "text-amber-500";
    return "text-destructive";
  };

  const toggleVisibility = (groupId: string) => {
    setVisibleTrackers((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const saveAssignedTrackers = useMutation({
    mutationFn: async (trackerIds: string[]) => {
      const newSettings = { ...(settings ?? {}), assigned_trackers: trackerIds };
      const { error } = await supabase
        .from("instances")
        .update({ settings: newSettings as any })
        .eq("id", instanceId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instance", instanceId] });
      qc.invalidateQueries({ queryKey: ["tracker-logs-instance", instanceId] });
      toast({ title: "Trackers assigned" });
    },
  });

  const noData = assignedTrackers.length === 0 && subgroupIds.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {latestPositions.length} active tracker{latestPositions.length !== 1 ? "s" : ""}
          {assignedTrackers.length > 0 && ` · ${assignedTrackers.length} assigned`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => setTrackerModal(true)}>
            <Plus className="w-3.5 h-3.5" />Assign Trackers
          </Button>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-[200px] h-8">
              <SelectValue placeholder="Select tracker" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trackers</SelectItem>
              {latestPositions.map((p) => (
                <SelectItem key={p.group_id} value={p.group_id}>
                  {p.device_desc ?? p.group_id.slice(0, 12)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {noData ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Radio className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No trackers assigned. Click "Assign Trackers" to add GPS trackers to this instance.</p>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Sidebar */}
          <div className="w-56 shrink-0 rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-3 py-2 border-b border-border bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground">Trackers</p>
            </div>
            <ScrollArea className="h-[452px]">
              <div className="divide-y divide-border">
                {latestPositions.map((pos) => {
                  const isVisible = visibleTrackers.has(pos.group_id);
                  const isSelected = selectedGroup === pos.group_id;
                  return (
                    <button
                      key={pos.group_id}
                      onClick={() => setSelectedGroup(isSelected ? "all" : pos.group_id)}
                      className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors ${isSelected ? "bg-muted/70" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate flex-1">{pos.device_desc ?? pos.group_id.slice(0, 10)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleVisibility(pos.group_id); }}
                          className="p-0.5"
                        >
                          {isVisible ? <Eye className="w-3 h-3 text-muted-foreground" /> : <EyeOff className="w-3 h-3 text-muted-foreground/40" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        {pos.battery_level !== null && (
                          <span className={`flex items-center gap-0.5 ${batteryColor(pos.battery_level)}`}>
                            <Battery className="w-2.5 h-2.5" />{pos.battery_level}%
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(pos.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {pos.subgroup_id && subgroupMap[pos.subgroup_id] && (
                        <Badge variant="outline" className="text-[9px] mt-1">{subgroupMap[pos.subgroup_id]}</Badge>
                      )}
                    </button>
                  );
                })}
                {latestPositions.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">No tracker data</div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Map */}
          <div className="flex-1 rounded-lg border border-border overflow-hidden" style={{ height: 500 }}>
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-muted/50">
                <div className="text-center space-y-2">
                  <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading tracker data…</p>
                </div>
              </div>
            ) : latestPositions.length === 0 ? (
              <div className="h-full flex items-center justify-center bg-muted/50">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No tracker data available.</p>
                </div>
              </div>
            ) : (
              <MapContainer center={center} zoom={13} className="h-full w-full z-0">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {latestPositions.map((pos) => {
                  if (!visibleTrackers.has(pos.group_id)) return null;
                  if (selectedGroup !== "all" && selectedGroup !== pos.group_id) return null;

                  return (
                    <Marker key={pos.id} position={[pos.latitude, pos.longitude]}>
                      <Popup>
                        <div className="min-w-[180px] space-y-1.5 text-xs">
                          <p className="font-semibold text-sm">{pos.device_desc ?? pos.group_id.slice(0, 8)}</p>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            {pos.battery_level !== null && (
                              <span className={`flex items-center gap-1 ${batteryColor(pos.battery_level)}`}>
                                <Battery className="w-3 h-3" />{pos.battery_level}%
                              </span>
                            )}
                            {pos.satellite_count !== null && (
                              <span className="flex items-center gap-1"><Satellite className="w-3 h-3" />{pos.satellite_count} sats</span>
                            )}
                          </div>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{pos.latitude.toFixed(5)}, {pos.longitude.toFixed(5)}
                          </p>
                          <p className="text-muted-foreground/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(pos.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
                {selectedTrail.length > 1 && (
                  <Polyline positions={selectedTrail} pathOptions={{ color: "hsl(220, 90%, 56%)", weight: 3, opacity: 0.8 }} />
                )}
              </MapContainer>
            )}
          </div>
        </div>
      )}

      <TrackerSelectionModal
        open={trackerModal}
        onOpenChange={setTrackerModal}
        assignedTrackers={assignedTrackers}
        onSave={(ids) => saveAssignedTrackers.mutate(ids)}
      />
    </div>
  );
};

export default InstanceTrackingTab;
