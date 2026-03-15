
import { useState, useMemo } from 'react';
import {
    ColumnDef,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel,
    ColumnFiltersState,
    VisibilityState,
} from "@tanstack/react-table";
import {
    Search,
    Bell,
    ArrowUpDown,
    Settings2,
    MoreHorizontal,
    Pin,
    Star,
    AlertCircle,
    Info,
    AlertTriangle,
    Heart,
    Eye
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/DataTable";
import { Announcement, mockAnnouncements } from '@/data/mockData-old';
import { format } from 'date-fns';

const getStatusColor = (status: string) => {
    switch (status) {
        case 'error': return "text-red-600 bg-red-50 border-red-200";
        case 'warning': return "text-amber-600 bg-amber-50 border-amber-200";
        case 'info': return "text-blue-600 bg-blue-50 border-blue-200";
        default: return "text-slate-600 bg-slate-50";
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'error': return AlertCircle;
        case 'warning': return AlertTriangle;
        case 'info': return Info;
        default: return Bell;
    }
};

export const AnnouncementsTable = () => {
    const [data] = useState<Announcement[]>(mockAnnouncements);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [searchQuery, setSearchQuery] = useState('');

    const columns: ColumnDef<Announcement>[] = [
        {
            id: "select",
            size: 40,
            enableResizing: false,
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="translate-y-[2px]"
                />
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                        className="translate-y-[2px]"
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "status",
            size: 100,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Priority <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                const Icon = getStatusIcon(status);
                return (
                    <div className={cn(
                        "inline-flex items-center px-2 py-0.5 text-[10px] font-bold border rounded-sm tracking-wider",
                        getStatusColor(status)
                    )}>
                        <Icon className="w-3 h-3 mr-1" />
                        {status.toUpperCase()}
                    </div>
                );
            }
        },
        {
            accessorKey: "title",
            size: 400,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Announcement <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const ann = row.original;
                return (
                    <div className="flex flex-col py-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            {ann.pinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
                            {ann.featured && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                            <span className="text-xs font-bold text-foreground truncate">{ann.title}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 leading-relaxed">{ann.body}</p>
                    </div>
                );
            }
        },
        {
            accessorKey: "authorName",
            size: 150,
            header: () => <div className="text-[11px] font-semibold text-muted-foreground">Author</div>,
            cell: ({ row }) => <span className="text-[11px] font-medium text-muted-foreground">{row.getValue("authorName")}</span>,
        },
        {
            id: "stats",
            size: 150,
            header: () => <div className="text-[11px] font-semibold text-muted-foreground">Engagement</div>,
            cell: ({ row }) => {
                const ann = row.original;
                return (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60">
                            <Eye className="w-3 h-3" />
                            {ann.readByUsers.length}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60">
                            <Heart className="w-3 h-3" />
                            {ann.likeCount}
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "createdAt",
            size: 120,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Sent <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="text-[10px] font-medium text-muted-foreground">
                    {format(new Date(row.getValue("createdAt")), 'dd MMM, HH:mm')}
                </div>
            ),
        },
        {
            id: "actions",
            size: 60,
            cell: () => (
                <div className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>
            ),
        }
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter: searchQuery,
        },
        onGlobalFilterChange: setSearchQuery,
    });

    return (
        <div className="w-full h-full flex flex-col min-h-0 bg-background">
            {/* Toolbar */}
            <div className="flex-none flex items-center h-10 bg-background border-b border-border shadow-sm overflow-hidden">
                <div className="flex items-center border-r border-border h-full px-4 bg-muted/20 min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                    <input
                        placeholder="Search bulletins..."
                        className="bg-transparent border-none text-xs focus:ring-0 w-full placeholder:text-muted-foreground/50 font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("status")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[140px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none appearance-none">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                </Select>

                <div className="ml-auto flex items-center h-full">
                    <Button variant="ghost" className="h-full px-4 text-[11px] font-bold text-primary border-l border-border hover:bg-primary/5 rounded-none transition-colors">
                        Draft Bulletin
                    </Button>
                    <Button variant="ghost" className="h-full w-10 p-0 rounded-none border-l border-border hover:bg-muted/50 transition-colors">
                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            <DataTable
                table={table}
                columns={columns}
                selectionLabel="announcement(s)"
            />
        </div>
    );
};
