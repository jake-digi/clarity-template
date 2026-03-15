
import { useState, useMemo } from 'react';
import {
    Search,
    Settings2,
    Home,
    Bed,
    ChevronRight,
    ChevronDown,
    Plus,
    Building2,
    Users,
    MoreHorizontal
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { mockBlocks, mockRooms, Block, Room } from '@/data/mockData-old';

export const AccommodationTable = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set(['blk-1']));

    const toggleBlock = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(expandedBlocks);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedBlocks(next);
    };

    const filteredBlocks = useMemo(() => {
        if (!searchQuery) return mockBlocks;
        return mockBlocks.filter(b =>
            b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const getRooms = (blockId: string) => {
        return mockRooms.filter(r => r.blockId === blockId);
    };

    return (
        <div className="w-full h-full flex flex-col min-h-0 bg-background">
            {/* Toolbar */}
            <div className="flex-none flex items-center h-10 bg-background border-b border-border shadow-sm overflow-hidden">
                <div className="flex items-center border-r border-border h-full px-4 bg-muted/20 min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                    <input
                        placeholder="Search blocks or rooms..."
                        className="bg-transparent border-none text-xs focus:ring-0 w-full placeholder:text-muted-foreground/50 font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="ml-auto flex items-center h-full">
                    <Button variant="ghost" className="h-full px-4 text-[11px] font-bold text-primary border-l border-border hover:bg-primary/5 rounded-none transition-colors">
                        Add Block
                    </Button>
                    <Button variant="ghost" className="h-full w-10 p-0 rounded-none border-l border-border hover:bg-muted/50 transition-colors">
                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            {/* Tree Table Header */}
            <div className="flex-none grid grid-cols-[1fr_120px_140px_100px_120px_60px] border-b border-border bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5">
                <div className="pl-6">Block / Room</div>
                <div>Type</div>
                <div className="text-center">Capacity / Occupancy</div>
                <div className="text-center">Availability</div>
                <div>Created At</div>
                <div className="text-right">Action</div>
            </div>

            {/* Tree Table Body */}
            <div className="flex-1 overflow-auto no-scrollbar pb-20">
                {filteredBlocks.map(blk => {
                    const rooms = getRooms(blk.id);
                    const isExpanded = expandedBlocks.has(blk.id);
                    const totalOccupants = rooms.reduce((acc, r) => acc + r.occupants.length, 0);
                    const totalCapacity = blk.capacity || 0;

                    return (
                        <div key={blk.id} className="flex flex-col">
                            {/* Block Row */}
                            <div
                                className="grid grid-cols-[1fr_120px_140px_100px_120px_60px] items-center border-b border-border/50 bg-muted/5 py-2.5 px-4 hover:bg-muted/10 transition-colors cursor-pointer group"
                                onClick={(e) => toggleBlock(blk.id, e)}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 flex items-center justify-center text-muted-foreground transition-transform duration-200">
                                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </div>
                                    <div className="w-7 h-7 bg-indigo-500/10 flex items-center justify-center shrink-0">
                                        <Building2 className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-foreground truncate">{blk.name}</p>
                                        <p className="text-[10px] text-muted-foreground/60 font-mono tracking-tighter uppercase">{blk.id}</p>
                                    </div>
                                </div>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{blk.type || "Building"}</div>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-xs font-mono font-bold text-foreground">{totalOccupants} / {totalCapacity}</span>
                                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full transition-all duration-500",
                                                totalOccupants >= totalCapacity ? "bg-red-500" : "bg-indigo-500"
                                            )}
                                            style={{ width: `${Math.min(100, (totalOccupants / (totalCapacity || 1)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-center">
                                    <div className={cn(
                                        "px-2 py-0.5 text-[9px] font-bold border",
                                        totalOccupants < totalCapacity ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"
                                    )}>
                                        {totalOccupants < totalCapacity ? "SPACES" : "FULL"}
                                    </div>
                                </div>
                                <div className="text-[10px] font-medium text-muted-foreground">{blk.createdAt ? new Date(blk.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : "-"}</div>
                                <div className="flex justify-end pr-1">
                                    <button className="p-1.5 hover:bg-indigo-500/10 text-indigo-600 transition-colors">
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Room Rows (Conditional) */}
                            {isExpanded && rooms.map(rm => (
                                <div
                                    key={rm.id}
                                    className="grid grid-cols-[1fr_120px_140px_100px_120px_60px] items-center border-b border-border/10 py-1.5 px-4 hover:bg-muted/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 pl-10 relative">
                                        <div className="absolute left-7 top-0 bottom-0 w-px bg-border/40" />
                                        <div className="absolute left-7 top-1/2 -translate-y-1/2 w-2 h-px bg-border/40" />
                                        <div className="w-5 h-5 bg-muted/50 flex items-center justify-center shrink-0">
                                            <Bed className="w-3 h-3 text-muted-foreground/60" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate">{rm.name}</p>
                                            <p className="text-[9px] text-muted-foreground/40 font-mono uppercase tracking-tighter">{rm.id}</p>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-semibold text-muted-foreground">{rm.type || "Room"}</div>
                                    <div className="flex items-center justify-center gap-2">
                                        <Users className="w-3 h-3 text-muted-foreground/40" />
                                        <span className="text-xs font-mono font-bold text-foreground">{rm.occupants.length} / {rm.capacity || 0}</span>
                                    </div>
                                    <div className="flex justify-center">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            rm.occupants.length < (rm.capacity || 0) ? "bg-green-500" : "bg-red-500"
                                        )} />
                                    </div>
                                    <div className="text-[10px] font-medium text-muted-foreground/60">{rm.createdAt ? new Date(rm.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : "-"}</div>
                                    <div className="flex justify-end pr-1">
                                        <button className="p-1.5 text-muted-foreground/40 hover:text-foreground transition-colors">
                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
