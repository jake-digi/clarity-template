
import { useState, useMemo } from 'react';
import {
    Search,
    Calendar,
    Clock,
    MapPin,
    Users,
    ChevronLeft,
    ChevronRight,
    Plus,
    Settings2,
    Coffee,
    BookOpen,
    Users2,
    Moon,
    Flame,
    MoreVertical
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TimetableSession, mockTimetableSessions, SessionType } from '@/data/mockData-old';

const getSessionIcon = (type: SessionType) => {
    switch (type) {
        case 'meal': return Coffee;
        case 'academic': return BookOpen;
        case 'assembly': return Users2;
        case 'bedtime': return Moon;
        case 'activity': return Flame;
        default: return Calendar;
    }
};

const getSessionColor = (type: SessionType) => {
    switch (type) {
        case 'meal': return "text-amber-600 bg-amber-50 border-amber-200";
        case 'academic': return "text-blue-600 bg-blue-50 border-blue-200";
        case 'assembly': return "text-indigo-600 bg-indigo-50 border-indigo-200";
        case 'bedtime': return "text-slate-600 bg-slate-50 border-slate-200";
        case 'activity': return "text-orange-600 bg-orange-50 border-orange-200";
        default: return "text-slate-600 bg-slate-50 border-slate-200";
    }
};

export const Timetable = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const [activeDay, setActiveDay] = useState('Monday');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSessions = useMemo(() => {
        return mockTimetableSessions.filter(session => {
            const matchesDay = session.daysOfWeek.includes(activeDay.toLowerCase());
            const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                session.location.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesDay && matchesSearch;
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [activeDay, searchQuery]);

    return (
        <div className="w-full h-full flex flex-col min-h-0 bg-background">
            {/* Toolbar */}
            <div className="flex-none flex items-center h-10 bg-background border-b border-border shadow-sm overflow-hidden">
                <div className="flex items-center border-r border-border h-full px-4 bg-muted/20 min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                    <input
                        placeholder="Search timetable..."
                        className="bg-transparent border-none text-xs focus:ring-0 w-full placeholder:text-muted-foreground/50 font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center h-full px-2 border-r border-border bg-muted/5">
                    {days.map(day => (
                        <button
                            key={day}
                            onClick={() => setActiveDay(day)}
                            className={cn(
                                "px-3 h-7 text-[10px] font-bold rounded-sm transition-all uppercase tracking-wider mx-0.5",
                                activeDay === day
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {day.substring(0, 3)}
                        </button>
                    ))}
                </div>

                <div className="ml-auto flex items-center h-full">
                    <Button variant="ghost" className="h-full px-4 text-[11px] font-bold text-primary border-l border-border hover:bg-primary/5 rounded-none transition-colors">
                        Add Session
                    </Button>
                    <Button variant="ghost" className="h-full w-10 p-0 rounded-none border-l border-border hover:bg-muted/50 transition-colors">
                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            {/* Timetable Body */}
            <div className="flex-1 overflow-auto no-scrollbar bg-muted/10 p-4">
                <div className="max-w-[1240px] mx-auto space-y-3">
                    {filteredSessions.map((session) => {
                        const Icon = getSessionIcon(session.type);
                        return (
                            <div
                                key={session.id}
                                className="group flex items-stretch gap-4 bg-background border border-border/50 hover:border-primary/30 transition-all shadow-sm"
                            >
                                {/* Time Column */}
                                <div className="w-24 flex-none flex flex-col items-center justify-center border-r border-border/50 bg-muted/5 py-4">
                                    <span className="text-sm font-bold text-foreground">{session.startTime}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">{session.endTime}</span>
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 flex flex-col justify-center py-4 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={cn("p-1 border rounded-sm", getSessionColor(session.type))}>
                                            <Icon className="w-3.5 h-3.5" />
                                        </div>
                                        <h3 className="text-sm font-bold text-foreground truncate">{session.title}</h3>
                                        <span className={cn(
                                            "px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-tighter opacity-70",
                                            getSessionColor(session.type)
                                        )}>
                                            {session.type}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <MapPin className="w-3 h-3 shrink-0" />
                                            <span className="truncate">{session.location}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Users className="w-3 h-3 shrink-0" />
                                            <span>{session.attendees} Attending</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Staff/Attendees Column */}
                                <div className="w-48 flex-none hidden md:flex flex-col justify-center border-l border-border/10 px-4">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Assigned Staff</p>
                                    <div className="flex -space-x-1.5">
                                        {session.staff.map((s, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-primary/10 border border-background flex items-center justify-center ring-1 ring-border/20">
                                                <span className="text-[8px] font-bold text-primary">{s.charAt(0)}</span>
                                            </div>
                                        ))}
                                        {session.staff.length === 0 && <span className="text-[10px] text-muted-foreground italic">None assigned</span>}
                                    </div>
                                </div>

                                {/* Action Column */}
                                <div className="w-12 flex-none flex items-center justify-center">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    {filteredSessions.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                            <Calendar className="w-12 h-12 mb-4 text-muted-foreground" />
                            <h3 className="text-base font-bold text-foreground">No sessions scheduled</h3>
                            <p className="text-sm text-muted-foreground mt-1">Check another day or adjust your search.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
