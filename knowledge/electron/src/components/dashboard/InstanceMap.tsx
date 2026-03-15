
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Eye, EyeOff, CheckCircle2, MapPin, Activity, Settings2, Shield, Battery, Signal, Users, Layout, MapPinOff, RefreshCw } from 'lucide-react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
    ContextMenuLabel,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TrackerSelectionModal } from './TrackerSelectionModal';
import { InstancesService } from '@/services/instances.service';
import { toast } from 'sonner';
import { InstanceWithDetails } from '@/types/database';
import { supabase } from '@/lib/supabase';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Represents a single tracker device loaded from tracker_logs
interface TrackerDevice {
    group_id: string;         // The subgroup ID used as tracker identifier
    device_desc: string | null;
    trail: TrackerPoint[];    // Ordered history of positions (oldest first)
    lastSeen: string | null;
    battery_level: number | null;
    battery_volts: number | null;
}

interface TrackerPoint {
    lat: number;
    lon: number;
    timestamp: string;
    altitude: number | null;
    accuracy: number | null;
}

// Represents a user's mobile phone device loaded from user_locations
interface UserLocationDevice {
    id: string;
    name: string | null;
    lat: number;
    lon: number;
    timestamp: string | null;
    is_vehicle: boolean | null;
}

const TRACKER_COLORS = [
    "#ef4444", "#3b82f6", "#10b981", "#f59e0b",
    "#a855f7", "#ec4899", "#06b6d4", "#84cc16",
];

const POLL_INTERVAL_MS = 30_000; // 30 seconds

const RecenterButton = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
};

interface InstanceMapProps {
    instance: InstanceWithDetails;
    onUpdateSettings: (newSettings: any) => void;
}

export const InstanceMap = ({ instance, onUpdateSettings }: InstanceMapProps) => {
    const [devices, setDevices] = useState<TrackerDevice[]>([]);
    const [userLocations, setUserLocations] = useState<UserLocationDevice[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [visibleDevices, setVisibleDevices] = useState<Set<string>>(new Set());
    const [visibleUsers, setVisibleUsers] = useState<Set<string>>(new Set());
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Tracker IDs assigned to this instance (stored in instance.settings)
    const assignedTrackerIds = useMemo(() => {
        const trackers = (instance.settings?.assigned_trackers || []) as string[];
        return trackers.filter(id => typeof id === 'string' && id.trim() !== '');
    }, [instance.settings]);

    // Fetch latest tracker positions from tracker_logs and user_locations
    const fetchTrackerData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Fetch hardware tracker_logs
            if (assignedTrackerIds.length > 0) {
                const { data: logs, error } = await supabase
                    .from('tracker_logs')
                    .select('group_id, latitude, longitude, altitude, accuracy, battery_level, battery_volts, device_desc, timestamp, created_at')
                    .in('group_id', assignedTrackerIds)
                    .order('timestamp', { ascending: true })
                    .limit(500);

                if (error) {
                    console.error('Failed to fetch tracker logs:', error);
                    return;
                }

                if (!logs || logs.length === 0) {
                    setDevices(assignedTrackerIds.map(id => ({
                        group_id: id,
                        device_desc: id,
                        trail: [],
                        lastSeen: null,
                        battery_level: null,
                        battery_volts: null,
                    })));
                    return;
                }

                // Group logs by group_id
                const grouped = logs.reduce((acc, log) => {
                    if (!acc[log.group_id]) acc[log.group_id] = [];
                    acc[log.group_id].push(log);
                    return acc;
                }, {} as Record<string, typeof logs>);

                // Build TrackerDevice list preserving assigned order
                const built: TrackerDevice[] = assignedTrackerIds.map(id => {
                    const entries = grouped[id] || [];
                    const last = entries[entries.length - 1];
                    return {
                        group_id: id,
                        device_desc: last?.device_desc || id,
                        trail: entries
                            .filter(e => e.latitude != null && e.longitude != null)
                            .map(e => ({
                                lat: e.latitude!,
                                lon: e.longitude!,
                                timestamp: e.timestamp,
                                altitude: e.altitude,
                                accuracy: e.accuracy,
                            })),
                        lastSeen: last?.timestamp || null,
                        battery_level: last?.battery_level || null,
                        battery_volts: last?.battery_volts || null,
                    };
                });

                setDevices(built);
                setVisibleDevices(prev => {
                    const next = new Set(prev);
                    built.forEach(d => { if (!next.has(d.group_id)) next.add(d.group_id); });
                    return next;
                });
            }

            // 2. Fetch mobile user_locations
            const { data: usersData, error: usersError } = await supabase
                .from('user_locations')
                .select('id, name, latitude, longitude, timestamp, is_vehicle')
                .eq('instance_id', instance.id)
                .order('timestamp', { ascending: false });

            if (!usersError && usersData) {
                const validUsers = usersData
                    .filter(u => u.latitude != null && u.longitude != null)
                    .map(u => ({
                        id: u.id,
                        name: u.name || 'Unknown User',
                        lat: u.latitude!,
                        lon: u.longitude!,
                        timestamp: u.timestamp,
                        is_vehicle: u.is_vehicle
                    }));

                // Deduplicate by user_id to keep latest (already ordered desc)
                const seen = new Set();
                const latestUsers: UserLocationDevice[] = [];
                for (const u of validUsers) {
                    if (!seen.has(u.id)) {
                        seen.add(u.id);
                        latestUsers.push(u);
                    }
                }

                setUserLocations(latestUsers);
                setVisibleUsers(prev => {
                    const next = new Set(prev);
                    // By default, showing all user locations unless toggled off
                    latestUsers.forEach(u => { if (!next.has(u.id)) next.add(u.id); });
                    return next;
                });
            }

            setLastRefreshed(new Date());
        } catch (err) {
            console.error('Error fetching tracker data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [assignedTrackerIds]);

    // Initial load + polling
    useEffect(() => {
        fetchTrackerData();
        const interval = setInterval(fetchTrackerData, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchTrackerData]);

    const handleSaveTrackers = async (selectedIds: string[]) => {
        try {
            const newSettings = {
                ...(instance.settings || {}),
                assigned_trackers: selectedIds
            };
            await InstancesService.update(instance.id, { settings: newSettings });
            onUpdateSettings(newSettings);
            toast.success(`Successfully assigned ${selectedIds.length} trackers`);
        } catch (err) {
            console.error('Failed to update trackers:', err);
            toast.error('Failed to update tracker assignments');
            throw err;
        }
    };

    const toggleVisibility = (deviceId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newVisible = new Set(visibleDevices);
        if (newVisible.has(deviceId)) newVisible.delete(deviceId);
        else newVisible.add(deviceId);
        setVisibleDevices(newVisible);
    };

    const toggleAll = () => {
        const totalItems = devices.length + userLocations.length;
        const totalVisible = visibleDevices.size + visibleUsers.size;

        if (totalVisible === totalItems) {
            setVisibleDevices(new Set());
            setVisibleUsers(new Set());
        } else {
            setVisibleDevices(new Set(devices.map(d => d.group_id)));
            setVisibleUsers(new Set(userLocations.map(u => u.id)));
        }
    };

    const handleAssignTracker = async (deviceId: string, type: 'supergroup' | 'subgroup' | null, groupId?: string, groupName?: string) => {
        const currentSettings = instance.settings || {};
        const currentAssociations = currentSettings.tracker_associations || {};
        let newAssociations = { ...currentAssociations };
        if (type === null) {
            delete newAssociations[deviceId];
        } else {
            newAssociations[deviceId] = { type, id: groupId, name: groupName };
        }
        const newSettings = { ...currentSettings, tracker_associations: newAssociations };
        try {
            await InstancesService.update(instance.id, { settings: newSettings });
            onUpdateSettings(newSettings);
            toast.success(type ? `Assigned tracker to ${groupName}` : 'Unassigned tracker');
        } catch (error) {
            console.error(error);
            toast.error("Failed to update assignment");
        }
    };

    const getLastPosition = (device: TrackerDevice): [number, number] | null => {
        if (device.trail.length === 0) return null;
        const last = device.trail[device.trail.length - 1];
        return [last.lat, last.lon];
    };

    const getPath = (device: TrackerDevice): [number, number][] =>
        device.trail.map(p => [p.lat, p.lon]);

    const formatLastSeen = (ts: string | null): string => {
        if (!ts) return 'Never';
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const defaultCenter = useMemo((): [number, number] => {
        for (const d of devices) {
            const pos = getLastPosition(d);
            if (pos) return pos;
        }
        for (const u of userLocations) {
            if (u.lat && u.lon) return [u.lat, u.lon];
        }
        return [51.505, -0.09];
    }, [devices, userLocations]);

    return (
        <div className="flex-1 flex h-full relative overflow-hidden bg-background border border-border">
            {/* Tracker Sidebar */}
            <div className="w-80 border-r border-border bg-card flex flex-col h-full z-[20] shadow-xl">
                <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-sm tracking-tight">Trackers</h3>
                        <p className="text-[10px] text-muted-foreground font-medium">Monitoring {devices.length + userLocations.length} units</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-6 w-6 rounded-none text-muted-foreground hover:text-primary", isLoading && "animate-spin")}
                            onClick={fetchTrackerData}
                            title="Refresh tracker positions"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-none text-muted-foreground hover:text-primary"
                            onClick={() => setIsSelectionModalOpen(true)}
                        >
                            <Settings2 className="w-3.5 h-3.5" />
                        </Button>
                        <button
                            onClick={toggleAll}
                            className="text-[10px] font-bold text-primary hover:underline ml-1"
                        >
                            {visibleDevices.size === devices.length ? 'Hide all' : 'Show all'}
                        </button>
                    </div>
                </div>

                {lastRefreshed && (
                    <div className="px-4 py-1.5 bg-muted/20 border-b border-border">
                        <p className="text-[9px] text-muted-foreground font-medium">
                            Last updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Auto-refreshes every 30s
                        </p>
                    </div>
                )}

                <div className="flex-1 overflow-auto p-2 space-y-1">
                    {/* Hardware Units */}
                    {devices.length > 0 && <div className="text-[10px] lowercase font-bold text-muted-foreground ml-2 mt-2 mb-1">Hardware Units</div>}
                    {devices.map((device, idx) => {
                        const lastPos = getLastPosition(device);
                        const deviceColor = TRACKER_COLORS[idx % TRACKER_COLORS.length];
                        const isVisible = visibleDevices.has(device.group_id);
                        const isSelected = selectedDevice === device.group_id;
                        const associatedGroup = instance.settings?.tracker_associations?.[device.group_id];
                        const batteryPct = device.battery_level != null
                            ? Math.round(device.battery_level)
                            : null;

                        return (
                            <ContextMenu key={device.group_id}>
                                <ContextMenuTrigger>
                                    <div
                                        onClick={() => setSelectedDevice(device.group_id)}
                                        className={cn(
                                            "w-full text-left p-3 flex items-center gap-3 transition-colors cursor-pointer border-l-2",
                                            isSelected ? 'bg-primary/5' : 'hover:bg-accent/50',
                                            isSelected ? 'border-l-primary' : 'border-l-transparent'
                                        )}
                                        style={{ borderLeftColor: isSelected ? deviceColor : 'transparent' }}
                                    >
                                        <button
                                            onClick={(e) => toggleVisibility(device.group_id, e)}
                                            className={cn("p-1.5 transition-colors", isVisible ? "text-primary" : "text-muted-foreground/40")}
                                        >
                                            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {associatedGroup ? (
                                                        <>
                                                            <span className={cn("text-sm font-bold truncate transition-opacity", !isVisible && "opacity-40")}>
                                                                {associatedGroup.name}
                                                            </span>
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                                {device.device_desc}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className={cn("text-sm font-bold truncate transition-opacity", !isVisible && "opacity-40")}>
                                                                {device.device_desc || device.group_id}
                                                            </span>
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted text-muted-foreground shrink-0">
                                                                Unassigned
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {batteryPct != null && isVisible && (
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <Battery className={cn("w-2.5 h-2.5", batteryPct < 20 ? "text-red-500" : "text-green-500")} />
                                                            <span className="text-[9px] font-mono font-bold text-muted-foreground/80">{batteryPct}%</span>
                                                        </div>
                                                    )}
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0"
                                                        style={{ backgroundColor: deviceColor, opacity: isVisible ? 1 : 0.2 }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <MapPin className="w-2.5 h-2.5 opacity-50 shrink-0" />
                                                    <span className="truncate">
                                                        {lastPos ? `${lastPos[0].toFixed(5)}, ${lastPos[1].toFixed(5)}` : 'No position'}
                                                    </span>
                                                </div>
                                                <span className="shrink-0 ml-2 whitespace-nowrap">
                                                    {formatLastSeen(device.lastSeen)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="w-48">
                                    <ContextMenuLabel>Tracker Actions</ContextMenuLabel>
                                    <ContextMenuSeparator />
                                    <ContextMenuSub>
                                        <ContextMenuSubTrigger>
                                            <Users className="w-4 h-4 mr-2" />
                                            Assign to Group
                                        </ContextMenuSubTrigger>
                                        <ContextMenuSubContent className="w-56">
                                            <ContextMenuLabel className="text-xs text-muted-foreground">Supergroups</ContextMenuLabel>
                                            {instance.supergroups?.map(sg => (
                                                <ContextMenuItem
                                                    key={sg.id}
                                                    onClick={() => handleAssignTracker(device.group_id, 'supergroup', sg.id, sg.name)}
                                                    className="gap-2"
                                                >
                                                    <Layout className="w-3.5 h-3.5 opacity-70" />
                                                    {sg.name}
                                                    {instance.settings?.tracker_associations?.[device.group_id]?.id === sg.id && (
                                                        <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-primary" />
                                                    )}
                                                </ContextMenuItem>
                                            ))}
                                            <ContextMenuSeparator />
                                            <ContextMenuLabel className="text-xs text-muted-foreground">Subgroups</ContextMenuLabel>
                                            {instance.subgroups?.map(sub => (
                                                <ContextMenuItem
                                                    key={sub.id}
                                                    onClick={() => handleAssignTracker(device.group_id, 'subgroup', sub.id, sub.name)}
                                                    className="gap-2"
                                                >
                                                    <Users className="w-3.5 h-3.5 opacity-70" />
                                                    {sub.name}
                                                    {instance.settings?.tracker_associations?.[device.group_id]?.id === sub.id && (
                                                        <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-primary" />
                                                    )}
                                                </ContextMenuItem>
                                            ))}
                                        </ContextMenuSubContent>
                                    </ContextMenuSub>
                                    <ContextMenuItem
                                        onClick={() => handleAssignTracker(device.group_id, null)}
                                        disabled={!instance.settings?.tracker_associations?.[device.group_id]}
                                        className="text-red-500 focus:text-red-500 focus:bg-red-50"
                                    >
                                        <MapPinOff className="w-4 h-4 mr-2" />
                                        Unassign Group
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                        );
                    })}

                    {/* Mobile Phones */}
                    {userLocations.length > 0 && <div className="text-[10px] lowercase font-bold text-muted-foreground ml-2 mt-4 mb-1">Mobile Phones</div>}
                    {userLocations.map((loc, idx) => {
                        const deviceColor = "#64748b"; // slate
                        const isVisible = visibleUsers.has(loc.id);
                        const isSelected = selectedDevice === loc.id;

                        return (
                            <div
                                key={loc.id}
                                onClick={() => setSelectedDevice(loc.id)}
                                className={cn(
                                    "w-full text-left p-3 flex items-center gap-3 transition-colors cursor-pointer border-l-2",
                                    isSelected ? 'bg-primary/5' : 'hover:bg-accent/50',
                                    isSelected ? 'border-l-primary' : 'border-l-transparent'
                                )}
                                style={{ borderLeftColor: isSelected ? deviceColor : 'transparent' }}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const next = new Set(visibleUsers);
                                        if (next.has(loc.id)) next.delete(loc.id);
                                        else next.add(loc.id);
                                        setVisibleUsers(next);
                                    }}
                                    className={cn("p-1.5 transition-colors", isVisible ? "text-primary" : "text-muted-foreground/40")}
                                >
                                    {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={cn("text-sm font-bold truncate transition-opacity", !isVisible && "opacity-40")}>
                                                {loc.name}
                                            </span>
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 shrink-0">
                                                {loc.is_vehicle ? 'Vehicle' : 'Phone'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0"
                                                style={{ backgroundColor: deviceColor, opacity: isVisible ? 1 : 0.2 }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium">
                                        <div className="flex items-center gap-1.5 truncate">
                                            <MapPin className="w-2.5 h-2.5 opacity-50 shrink-0" />
                                            <span className="truncate">
                                                {loc.lat.toFixed(5)}, {loc.lon.toFixed(5)}
                                            </span>
                                        </div>
                                        <span className="shrink-0 ml-2 whitespace-nowrap">
                                            {formatLastSeen(loc.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 relative">
                <MapContainer
                    center={defaultCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {devices.map((device, idx) => {
                        const isVisible = visibleDevices.has(device.group_id);
                        if (!isVisible) return null;

                        const path = getPath(device);
                        const lastPos = getLastPosition(device);
                        const isSelected = selectedDevice === device.group_id;
                        const deviceColor = TRACKER_COLORS[idx % TRACKER_COLORS.length];
                        const associatedGroup = instance.settings?.tracker_associations?.[device.group_id];
                        const last = device.trail[device.trail.length - 1];

                        return (
                            <React.Fragment key={device.group_id}>
                                {path.length > 1 && (
                                    <Polyline
                                        positions={path}
                                        color={deviceColor}
                                        weight={isSelected ? 8 : 4}
                                        opacity={isSelected ? 1 : 0.7}
                                        lineJoin="round"
                                        lineCap="round"
                                        dashArray={isSelected ? undefined : "2, 8"}
                                    />
                                )}
                                {lastPos && (
                                    <Marker
                                        position={lastPos}
                                        icon={L.divIcon({
                                            className: 'custom-div-marker',
                                            html: `
                        <div style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                          <div style="background-color: ${deviceColor}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3); ${isSelected ? 'transform: scale(1.5);' : ''} shrink-0;"></div>
                          <div style="
                            background-color: white; 
                            padding: 1px 6px; 
                            border-radius: 4px; 
                            border: 1.5px solid ${deviceColor}; 
                            font-size: 10px; 
                            font-weight: 800; 
                            color: #0f172a;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            opacity: ${isVisible ? (isSelected ? 1 : 0.9) : 0};
                          ">
                            ${associatedGroup?.name || device.device_desc || device.group_id}
                          </div>
                        </div>
                      `,
                                            iconSize: [150, 20],
                                            iconAnchor: [8, 10]
                                        })}
                                    >
                                        <Popup className="custom-popup">
                                            <div className="p-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: deviceColor }} />
                                                    <h4 className="font-bold text-sm">{associatedGroup?.name || device.device_desc || device.group_id}</h4>
                                                    {associatedGroup && (
                                                        <span className="text-[9px] font-mono bg-muted px-1.5 py-0.5 rounded">
                                                            {device.device_desc}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="space-y-1 text-xs">
                                                    <p><span className="text-muted-foreground font-semibold">Status:</span> Tracking</p>
                                                    <p><span className="text-muted-foreground font-semibold">Last Update:</span> {formatLastSeen(device.lastSeen)}</p>
                                                    {last?.altitude != null && <p><span className="text-muted-foreground font-semibold">Altitude:</span> {last.altitude}m</p>}
                                                    {device.battery_level != null && <p><span className="text-muted-foreground font-semibold">Battery:</span> {Math.round(device.battery_level)}%</p>}
                                                    <p className="mt-1 pb-1 pt-1 border-t border-border font-mono">
                                                        <span className="text-muted-foreground font-bold">COORDS:</span> {lastPos[0].toFixed(5)}, {lastPos[1].toFixed(5)}
                                                    </p>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}
                            </React.Fragment>
                        );
                    })}

                    {/* Render Phone Markers */}
                    {userLocations.map((loc) => {
                        const isVisible = visibleUsers.has(loc.id);
                        if (!isVisible) return null;

                        const isSelected = selectedDevice === loc.id;
                        const deviceColor = "#64748b"; // slate

                        return (
                            <Marker
                                key={`phone-${loc.id}`}
                                position={[loc.lat, loc.lon]}
                                icon={L.divIcon({
                                    className: 'custom-div-marker',
                                    html: `
                                        <div style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                                          <div style="background-color: ${deviceColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3); ${isSelected ? 'transform: scale(1.5);' : ''} shrink-0;"></div>
                                          <div style="
                                            background-color: white; 
                                            padding: 1px 6px; 
                                            border-radius: 4px; 
                                            border: 1.5px solid ${deviceColor}; 
                                            font-size: 10px; 
                                            font-weight: 800; 
                                            color: #0f172a;
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                            opacity: ${isVisible ? (isSelected ? 1 : 0.9) : 0};
                                          ">
                                            ${loc.name}
                                          </div>
                                        </div>
                                      `,
                                    iconSize: [150, 20],
                                    iconAnchor: [8, 10]
                                })}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: deviceColor }} />
                                            <h4 className="font-bold text-sm">{loc.name}</h4>
                                            <span className="text-[9px] font-mono bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                                                {loc.is_vehicle ? 'VEHICLE' : 'PHONE'}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            <p><span className="text-muted-foreground font-semibold">Status:</span> Live Map</p>
                                            <p><span className="text-muted-foreground font-semibold">Last Update:</span> {formatLastSeen(loc.timestamp)}</p>
                                            <p className="mt-1 pb-1 pt-1 border-t border-border font-mono">
                                                <span className="text-muted-foreground font-bold">COORDS:</span> {loc.lat.toFixed(5)}, {loc.lon.toFixed(5)}
                                            </p>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {selectedDevice && (() => {
                        const dev = devices.find(d => d.group_id === selectedDevice);
                        const devPos = dev ? getLastPosition(dev) : null;
                        if (devPos) return <RecenterButton center={devPos} />;

                        const uLoc = userLocations.find(u => u.id === selectedDevice);
                        if (uLoc && uLoc.lat && uLoc.lon) return <RecenterButton center={[uLoc.lat, uLoc.lon]} />;

                        return null;
                    })()}
                </MapContainer>

                {/* Empty State Overlay */}
                {assignedTrackerIds.length === 0 && userLocations.length === 0 && (
                    <div className="absolute inset-0 z-[40] bg-background/60 backdrop-blur-md flex items-center justify-center p-8">
                        <div className="max-w-md w-full bg-card border border-border shadow-2xl p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-primary/5">
                                <Activity className="w-10 h-10 text-primary animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Initialise Trackers</h2>
                            <p className="text-sm text-muted-foreground font-medium mb-8">
                                This instance has no trackers assigned. To begin live monitoring, select the hardware units from the trackers database.
                            </p>
                            <div className="space-y-3">
                                <Button
                                    onClick={() => setIsSelectionModalOpen(true)}
                                    className="w-full h-12 font-semibold shadow-lg shadow-primary/20"
                                >
                                    Select Hardware Units
                                </Button>
                                <p className="text-[10px] font-medium text-muted-foreground/60 tracking-wider">
                                    Requires Administrative Hardware Access
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <TrackerSelectionModal
                open={isSelectionModalOpen}
                onOpenChange={setIsSelectionModalOpen}
                assignedTrackerIds={assignedTrackerIds}
                onSave={handleSaveTrackers}
                instanceId={instance.id}
            />

            <style>{`
        .leaflet-container { background: #f8fafc; font-family: inherit; z-index: 1 !important; }
        .leaflet-pane { z-index: 1 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 5 !important; }
        .custom-popup .leaflet-popup-content-wrapper { border-radius: 0; padding: 0; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
        .custom-popup .leaflet-popup-content { margin: 0; min-width: 150px; }
        .custom-popup .leaflet-popup-tip-container { display: none; }
        .leaflet-bar { border: 1px solid hsl(var(--border)) !important; box-shadow: none !important; border-radius: 0 !important; }
        .leaflet-bar a { background-color: hsl(var(--card)) !important; color: hsl(var(--foreground)) !important; border-bottom: 1px solid hsl(var(--border)) !important; border-radius: 0 !important; }
      `}</style>
        </div>
    );
};
