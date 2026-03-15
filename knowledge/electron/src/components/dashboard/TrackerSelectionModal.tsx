
import { useState, useMemo, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, MapPin, Loader2, Save, Activity, Battery, Signal, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';

interface TrackerInfo {
    id: string;          // group_id from tracker_logs
    name: string;        // device_desc
    lastSeen: string;
    timestamp: string | null;
    isRecent: boolean;
    lat: number | null;
    lon: number | null;
    battery: number | null;
}

interface TrackerSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assignedTrackerIds: string[];
    onSave: (selectedIds: string[]) => Promise<void>;
    instanceId?: string;
}

export const TrackerSelectionModal = ({
    open,
    onOpenChange,
    assignedTrackerIds,
    onSave,
    instanceId,
}: TrackerSelectionModalProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(assignedTrackerIds));
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [allTrackers, setAllTrackers] = useState<TrackerInfo[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'active'>('all');

    // Load available trackers from tracker_logs when modal opens
    useEffect(() => {
        if (!open) return;
        setSelectedIds(new Set(assignedTrackerIds));
        fetchAvailableTrackers();
    }, [open]);

    const fetchAvailableTrackers = async () => {
        setIsLoading(true);
        try {
            // Get the most recent log entry per group_id
            const { data, error } = await supabase
                .from('tracker_logs')
                .select('group_id, device_desc, latitude, longitude, battery_level, timestamp')
                .order('timestamp', { ascending: false })
                .limit(1000);

            if (error) {
                console.error('Failed to load tracker list:', error);
                return;
            }

            if (!data) return;

            // Deduplicate: keep only the most recent entry per group_id
            const seen = new Set<string>();
            const latest: typeof data = [];
            for (const row of data) {
                if (!seen.has(row.group_id)) {
                    seen.add(row.group_id);
                    latest.push(row);
                }
            }

            const now = Date.now();
            const HOURS_24 = 24 * 60 * 60 * 1000;

            const trackers: TrackerInfo[] = latest.map(row => {
                const ts = row.timestamp ? new Date(row.timestamp) : null;
                const isRecent = ts ? (now - ts.getTime()) < HOURS_24 : false;
                return {
                    id: row.group_id,
                    name: row.device_desc || row.group_id,
                    lastSeen: ts ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'Never',
                    timestamp: row.timestamp,
                    isRecent,
                    lat: row.latitude,
                    lon: row.longitude,
                    battery: row.battery_level != null ? Math.round(row.battery_level) : null,
                };
            });

            // Sort: most recently seen first
            trackers.sort((a, b) => {
                if (!a.timestamp) return 1;
                if (!b.timestamp) return -1;
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });

            setAllTrackers(trackers);
        } catch (err) {
            console.error('Error loading trackers:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTrackers = useMemo(() => {
        let list = allTrackers;
        if (activeTab === 'active') {
            list = list.filter(t => t.isRecent);
        }
        if (!searchQuery) return list;
        const search = searchQuery.toLowerCase();
        return list.filter(t =>
            t.name.toLowerCase().includes(search) ||
            t.id.toLowerCase().includes(search)
        );
    }, [allTrackers, searchQuery, activeTab]);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(Array.from(selectedIds));
            onOpenChange(false);
        } catch (err) {
            console.error('Failed to save tracker assignments:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const activeCount = allTrackers.filter(t => t.isRecent).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden gap-0 bg-card border-border shadow-2xl z-[9999]">
                <DialogHeader className="p-6 pb-2 bg-muted/30 border-b border-border">
                    <DialogTitle className="text-xl font-bold flex items-center gap-3 tracking-tight">
                        <Activity className="w-6 h-6 text-primary" />
                        Initialise Trackers
                    </DialogTitle>
                    <p className="text-xs font-medium text-muted-foreground mt-1">
                        Select the hardware units to pull into this instance for live monitoring.
                    </p>
                </DialogHeader>

                <div className="flex items-center bg-muted/30 border-b border-border">
                    <div className="flex flex-1">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={cn(
                                "px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2",
                                activeTab === 'all'
                                    ? "text-primary border-primary bg-background"
                                    : "text-muted-foreground border-transparent hover:text-foreground"
                            )}
                        >
                            All Units ({allTrackers.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('active')}
                            className={cn(
                                "px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2",
                                activeTab === 'active'
                                    ? "text-primary border-primary bg-background"
                                    : "text-muted-foreground border-transparent hover:text-foreground"
                            )}
                        >
                            Active <span className="ml-1 opacity-50 capitalize font-medium">(24h)</span> ({activeCount})
                        </button>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8 mr-2 text-muted-foreground hover:text-primary", isLoading && "animate-spin")}
                        onClick={fetchAvailableTrackers}
                        title="Refresh tracker list"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                </div>

                <div className="px-6 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <input
                            placeholder="Search trackers by name or ID..."
                            className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="px-6 py-2 bg-primary/5 border-y border-primary/10 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Showing {filteredTrackers.length} Trackers
                        </span>
                        <div className="h-4 w-px bg-border" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                            {selectedIds.size} Selected
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] font-bold py-0"
                        onClick={() => setSelectedIds(new Set())}
                    >
                        Clear Selection
                    </Button>
                </div>

                <ScrollArea className="h-[400px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40 gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground font-medium">Loading trackers from database...</span>
                        </div>
                    ) : filteredTrackers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2">
                            <Activity className="w-8 h-8 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground font-medium">No trackers found</p>
                            <p className="text-xs text-muted-foreground/60">Trackers appear here once they send location data</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredTrackers.map((t) => (
                                <div
                                    key={t.id}
                                    className={`flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer group ${selectedIds.has(t.id) ? 'bg-primary/5' : ''}`}
                                    onClick={() => toggleSelection(t.id)}
                                >
                                    <div className="pt-1">
                                        <Checkbox
                                            checked={selectedIds.has(t.id)}
                                            onCheckedChange={() => toggleSelection(t.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{t.name}</p>
                                                {t.isRecent && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        Live
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {t.battery != null && (
                                                    <div className="flex items-center gap-1">
                                                        <Battery className={`w-3 h-3 ${t.battery < 20 ? 'text-red-500' : 'text-green-500'}`} />
                                                        <span className="text-[10px] font-mono font-bold">{t.battery}%</span>
                                                    </div>
                                                )}
                                                <Badge variant="outline" className="text-[9px] font-bold uppercase px-1.5 py-0 border-primary/20 text-primary bg-primary/5">
                                                    ID: {t.id.substring(0, 8)}...
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4">
                                            {t.lat != null && t.lon != null && (
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                                                    <span className="text-[11px] text-muted-foreground truncate font-medium font-mono">
                                                        {t.lat.toFixed(4)}, {t.lon.toFixed(4)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                <Signal className="w-3 h-3 text-muted-foreground opacity-50" />
                                                <span className="text-[11px] text-muted-foreground font-medium">Last seen: {t.lastSeen}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="p-6 bg-muted/20 border-t border-border">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="font-semibold px-6">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="min-w-[160px] font-semibold shadow-lg shadow-primary/20"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Pull Trackers ({selectedIds.size})
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
