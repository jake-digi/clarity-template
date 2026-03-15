
import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import {
    Clock,
    User,
    AlertTriangle,
    Info,
    CheckCircle2,
    MapPin,
    MessageSquare,
    Filter,
    ArrowUpRight
} from 'lucide-react';
import { mockActivityLogs, ActivityLogEntry } from '@/data/mockData-old';

export const ActivityLog = ({ compact = false }: { compact?: boolean }) => {
    const [logs, setLogs] = useState<ActivityLogEntry[]>(mockActivityLogs);
    const [filter, setFilter] = useState<'all' | 'incident'>('all');

    const handleAcknowledge = (id: string) => {
        setLogs(prev => prev.map(log =>
            log.id === id ? {
                ...log,
                isAcknowledged: true,
                acknowledgedBy: 'Current User',
                acknowledgedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            } : log
        ));
    };

    const filteredLogs = filter === 'incident' ? logs.filter(l => l.type === 'incident' && !l.isAcknowledged) : logs;

    const LogCard = ({ log }: { log: ActivityLogEntry }) => {
        const isIncident = log.type === 'incident';
        const isSystem = log.type === 'system';
        const isAcknowledged = log.isAcknowledged;

        return (
            <div className={cn(
                "border relative transition-all duration-200",
                isIncident && !isAcknowledged ? "border-amber-500 bg-amber-500/5 shadow-md" : "border-border bg-card",
                isSystem && !isIncident ? "bg-muted/30 border-dashed" : "",
                isAcknowledged ? "border-green-500/50 bg-green-500/5" : ""
            )}>
                {isIncident && !isAcknowledged && (
                    <div className="bg-amber-600 text-white text-[10px] font-bold px-3 py-1 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        Requires acknowledgement
                    </div>
                )}

                <div className="p-4 space-y-3">
                    {/* Header: Group & Tracker */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{log.groupName}</span>
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 font-bold text-muted-foreground tracking-tight">{log.trackerId}</span>
                            {isSystem && <span className="text-[9px] font-bold text-muted-foreground/60 border border-muted-foreground/20 px-1">System event</span>}
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {log.observedTime}
                            </div>
                            <div className="text-[9px] text-muted-foreground/60 font-medium">
                                Submitted {log.submittedTime}
                            </div>
                        </div>
                    </div>

                    {/* Content: Notes */}
                    <div className="text-sm text-foreground/90 font-medium leading-relaxed">
                        {log.notes}
                    </div>

                    {/* Footer: Metadata & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground/80">{log.locationSource}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Info className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground/80">{log.infoSource}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground/80">{log.submittedBy}</span>
                            </div>
                        </div>

                        {isIncident && (
                            <div>
                                {isAcknowledged ? (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-100/50 px-2 py-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Acknowledged by {log.acknowledgedBy} at {log.acknowledgedTime}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleAcknowledge(log.id)}
                                        className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-3 py-1 tracking-tight transition-colors shadow-sm"
                                    >
                                        Acknowledge
                                    </button>
                                )}
                            </div>
                        )}

                        {!isIncident && (
                            <button className="text-[10px] font-bold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                View context <ArrowUpRight className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (compact) {
        return (
            <div className="flex flex-col h-full bg-transparent overflow-y-auto no-scrollbar">
                <div className="space-y-4 pr-1">
                    {filteredLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="relative group">
                            <div className={cn(
                                "p-3 border transition-all truncate",
                                log.type === 'incident' && !log.isAcknowledged ? "border-amber-500 bg-amber-500/5" : "border-border bg-card"
                            )}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black uppercase text-foreground truncate">{log.groupName}</span>
                                    <span className="text-[9px] text-muted-foreground font-bold">{log.observedTime}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                                    {log.notes}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-muted/20">
            {/* Toolbar */}
            <div className="bg-card border-b border-border p-4 flex justify-between items-center z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-sm font-bold tracking-wider text-foreground flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Activity log
                    </h2>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-1 bg-muted p-1">
                        <button
                            onClick={() => setFilter('all')}
                            className={cn(
                                "text-[10px] font-bold px-3 py-1 transition-all",
                                filter === 'all' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            All logs
                        </button>
                        <button
                            onClick={() => setFilter('incident')}
                            className={cn(
                                "text-[10px] font-bold px-3 py-1 transition-all flex items-center gap-1.5",
                                filter === 'incident' ? "bg-amber-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Incidents
                            {logs.filter(l => l.type === 'incident' && !l.isAcknowledged).length > 0 && (
                                <span className={cn(
                                    "px-1.5 rounded-full text-[9px]",
                                    filter === 'incident' ? "bg-white text-amber-600" : "bg-amber-600 text-white"
                                )}>
                                    {logs.filter(l => l.type === 'incident' && !l.isAcknowledged).length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                        <Filter className="w-3 h-3" />
                        Sort: Newest First
                    </div>
                </div>
            </div>

            {/* Timeline Feed */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6 relative">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-[23px] top-0 bottom-0 w-px bg-border/60 z-0" />

                    {filteredLogs.map((log) => (
                        <div key={log.id} className="relative z-10 group">
                            {/* Marker on line */}
                            <div className={cn(
                                "absolute left-4 top-6 w-4 h-4 rounded-full border-2 border-background z-20",
                                log.type === 'incident' ? "bg-amber-500" : log.type === 'system' ? "bg-muted-foreground/30" : "bg-primary"
                            )} />

                            <div className="pl-12">
                                <LogCard log={log} />
                            </div>
                        </div>
                    ))}

                    {filteredLogs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="p-4 bg-muted/40 rounded-full">
                                <CheckCircle2 className="w-8 h-8 text-muted-foreground/20" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground tracking-tight">No actions required</h3>
                                <p className="text-xs text-muted-foreground font-medium mt-1">All incident logs have been acknowledged.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
