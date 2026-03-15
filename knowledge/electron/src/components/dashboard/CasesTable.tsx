
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
    ShieldAlert,
    User,
    ArrowUpDown,
    Settings2,
    MoreHorizontal,
    Heart,
    Gavel,
    Clock,
    AlertCircle
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
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/DataTable";
import { InstanceCase, mockCases } from '@/data/mockData-old';
import { format } from 'date-fns';

const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
        case 'critical':
        case 'urgent': return "text-red-600 bg-red-50 border-red-200";
        case 'high': return "text-orange-600 bg-orange-50 border-orange-200";
        case 'medium': return "text-blue-600 bg-blue-50 border-blue-200";
        case 'low': return "text-slate-600 bg-slate-50 border-slate-200";
        default: return "text-slate-600 bg-slate-50";
    }
};

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'resolved':
        case 'closed': return "text-green-600 bg-green-50 border-green-200";
        case 'inprogress':
        case 'open': return "text-blue-600 bg-blue-50 border-blue-200";
        case 'pending':
        case 'triage': return "text-amber-600 bg-amber-50 border-amber-200";
        default: return "text-slate-600 bg-slate-50";
    }
};

export const CasesTable = () => {
    const [data] = useState<InstanceCase[]>(mockCases);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [searchQuery, setSearchQuery] = useState('');

    const categories = useMemo(() => Array.from(new Set(data.map(c => c.category))), [data]);
    const types = useMemo(() => Array.from(new Set(data.map(c => c.type))), [data]);
    const statuses = useMemo(() => Array.from(new Set(data.map(c => c.status))), [data]);

    const columns: ColumnDef<InstanceCase>[] = [
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
            accessorKey: "id",
            size: 80,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Case ID <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase">{row.getValue("id")}</div>,
        },
        {
            accessorKey: "title",
            size: 220,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Case Title <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs font-bold text-foreground truncate">{row.getValue("title")}</div>,
        },
        {
            accessorKey: "type",
            size: 100,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Type <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const type = row.getValue("type") as string;
                return (
                    <div className="flex items-center gap-2">
                        {type === 'behavior' ? (
                            <Gavel className="w-3.5 h-3.5 text-orange-500" />
                        ) : (
                            <Heart className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{type}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "participantName",
            size: 180,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Participant <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-muted flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-semibold text-foreground truncate">{row.getValue("participantName")}</span>
                </div>
            ),
        },
        {
            accessorKey: "category",
            size: 150,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Category <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs font-semibold text-foreground truncate">{row.getValue("category")}</div>,
        },
        {
            id: "priority",
            size: 100,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Priority <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const c = row.original;
                const priority = c.type === 'behavior' ? c.severityLevel : c.urgencyLevel;
                const isCritical = priority === 'critical' || priority === 'urgent';
                return (
                    <div className={cn(
                        "inline-flex items-center px-2 py-0.5 text-[10px] font-bold border",
                        getSeverityColor(priority)
                    )}>
                        {isCritical && <AlertCircle className="w-3 h-3 mr-1" />}
                        {priority.toUpperCase()}
                    </div>
                );
            }
        },
        {
            accessorKey: "status",
            size: 120,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Status <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                return (
                    <div className={cn(
                        "inline-flex items-center px-2 py-0.5 text-[10px] font-bold border",
                        getStatusColor(status)
                    )}>
                        {status.toUpperCase()}
                    </div>
                );
            }
        },
        {
            accessorKey: "assignedToName",
            size: 140,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Assigned To <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs text-muted-foreground">{row.getValue("assignedToName") || "Unassigned"}</div>,
        },
        {
            accessorKey: "timestamp",
            size: 140,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Time <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue("timestamp"));
                return (
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">{format(date, 'HH:mm')}</span>
                        <span className="text-[10px] text-muted-foreground">{format(date, 'dd MMM')}</span>
                    </div>
                );
            }
        },
        {
            id: "actions",
            size: 60,
            cell: () => (
                <div className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
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

    const currentTypeFilter = (table.getColumn("type")?.getFilterValue() as string) ?? "all";

    return (
        <div className="w-full h-full flex flex-col min-h-0 bg-background">
            {/* Toolbar */}
            <div className="flex-none flex items-center h-10 bg-background border-b border-border shadow-sm overflow-hidden">
                <div className="flex items-center border-r border-border h-full px-4 bg-muted/20 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                    <input
                        placeholder="Search cases..."
                        className="bg-transparent border-none text-xs focus:ring-0 w-full placeholder:text-muted-foreground/50 font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={currentTypeFilter} onValueChange={(v) => table.getColumn("type")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[120px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none appearance-none">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {types.map((t) => (<SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>))}
                    </SelectContent>
                </Select>

                <Select value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("status")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[120px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {statuses.map((s) => (<SelectItem key={s} value={s} className="text-xs uppercase">{s}</SelectItem>))}
                    </SelectContent>
                </Select>

                <Select value={(table.getColumn("category")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("category")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[150px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((c) => (<SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>))}
                    </SelectContent>
                </Select>

                <div className="ml-auto flex items-center h-full">
                    <Button variant="ghost" className="h-full px-4 text-[11px] font-bold text-primary border-l border-border hover:bg-primary/5 rounded-none transition-colors">
                        Raise Case
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-full w-10 p-0 rounded-none border-l border-border hover:bg-muted/50 transition-colors">
                                <Settings2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[150px]">
                            <DropdownMenuLabel className="text-xs">Toggle Columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {table.getAllColumns().filter((c) => typeof c.accessorFn !== "undefined" && c.getCanHide()).map((c) => (
                                <DropdownMenuCheckboxItem key={c.id} className="capitalize text-xs" checked={c.getIsVisible()} onCheckedChange={(v) => c.toggleVisibility(!!v)}>{c.id}</DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <DataTable
                table={table}
                columns={columns}
                selectionLabel="case(s)"
            />
        </div>
    );
};
