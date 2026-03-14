import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MapPin, Battery, Clock, Satellite } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
  group_name?: string;
}

interface Props {
  instanceId: string;
  subgroups: { id: string; name: string; parent_supergroup_id: string }[];
}

const InstanceTrackingTab = ({ instanceId, subgroups }: Props) => {
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  const subgroupIds = useMemo(() => subgroups.map((s) => s.id), [subgroups]);
  const subgroupMap = useMemo(
    () => Object.fromEntries(subgroups.map((s) => [s.id, s.name])),
    [subgroups]
  );

  const { data: trackerLogs = [], isLoading } = useQuery({
    queryKey: ["tracker-logs-instance", instanceId, subgroupIds],
    enabled: subgroupIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracker_logs")
        .select("*")
        .in("subgroup_id", subgroupIds)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("timestamp", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as TrackerPoint[];
    },
  });

  // Group logs by subgroup_id, get latest position per group
  const groupedLogs = useMemo(() => {
    const map = new Map<string, TrackerPoint[]>();
    trackerLogs.forEach((t) => {
      const key = t.subgroup_id ?? t.group_id;
      const list = map.get(key) ?? [];
      list.push({ ...t, group_name: t.subgroup_id ? subgroupMap[t.subgroup_id] : t.group_id });
      map.set(key, list);
    });
    return map;
  }, [trackerLogs, subgroupMap]);

  const latestPositions = useMemo(() => {
    const positions: TrackerPoint[] = [];
    groupedLogs.forEach((logs) => {
      if (logs.length > 0) positions.push(logs[0]);
    });
    return positions;
  }, [groupedLogs]);

  const groupOptions = useMemo(
    () =>
      [...groupedLogs.entries()].map(([id, logs]) => ({
        id,
        name: logs[0]?.group_name ?? id.slice(0, 8),
      })),
    [groupedLogs]
  );

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

  if (subgroupIds.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No groups configured for this instance. Add groups to enable tracking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {latestPositions.length} active tracker{latestPositions.length !== 1 ? "s" : ""}
        </p>
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder="Select group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trackers</SelectItem>
            {groupOptions.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden" style={{ height: 500 }}>
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
              <p className="text-sm text-muted-foreground">No tracker data available for this instance.</p>
            </div>
          </div>
        ) : (
          <MapContainer center={center} zoom={13} className="h-full w-full z-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {latestPositions.map((pos) => {
              const key = pos.subgroup_id ?? pos.group_id;
              const isSelected = selectedGroup === key;
              if (selectedGroup !== "all" && !isSelected) return null;

              return (
                <Marker key={pos.id} position={[pos.latitude, pos.longitude]}>
                  <Popup>
                    <div className="min-w-[180px] space-y-1.5 text-xs">
                      <p className="font-semibold text-sm">{pos.group_name ?? pos.group_id.slice(0, 8)}</p>
                      {pos.device_desc && <p className="text-muted-foreground">{pos.device_desc}</p>}
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
  );
};

export default InstanceTrackingTab;
