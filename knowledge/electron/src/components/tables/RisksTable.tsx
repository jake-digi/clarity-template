
import { useState, useMemo } from "react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, X, Settings2, AlertTriangle, CheckCircle2, AlertCircle, Clock, Search, FileText, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/DataTable";
import { getStatusColor } from "@/lib/tableUtils";

// --- Types ---
import { risks as initialRisks, Risk as RiskRecord } from "@/data/mockData-old";

const getScoreColor = (score: number) => {
    if (score >= 15) return "bg-red-500 text-white";
    if (score >= 10) return "bg-orange-500 text-white";
    if (score >= 5) return "bg-yellow-500 text-black";
    return "bg-emerald-500 text-white";
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case "CLOSED": return <CheckCircle2 className="w-3 h-3 mr-1" />;
        case "OPEN": return <AlertCircle className="w-3 h-3 mr-1" />;
        default: return null;
    }
}

export function RisksTable() {
    const [data] = useState<RiskRecord[]>(initialRisks);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
        l: false,
        i: false,
        lPost: false,
        iPost: false,
    });

    const categories = useMemo(() => Array.from(new Set(data.map(item => item.category))).sort(), [data]);
    const projects = useMemo(() => Array.from(new Set(data.map(item => item.project))).sort(), [data]);
    const statuses = useMemo(() => Array.from(new Set(data.map(item => item.status))), [data]);

    const columns: ColumnDef<RiskRecord>[] = [
        {
            id: "select",
            size: 40,
            enableResizing: false,
            header: ({ table }) => (
                <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} aria-label="Select all" className="translate-y-[2px]" />
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2 pl-2">
                    <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" className="translate-y-[2px]" />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "id",
            size: 90,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Risk ID <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="font-mono text-[11px] text-foreground">{row.getValue("id")}</div>,
        },
        {
            accessorKey: "status",
            size: 100,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Status <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                return (
                    <div className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight", getStatusColor(status))}>
                        {getStatusIcon(status)}
                        {status}
                    </div>
                )
            },
        },
        {
            accessorKey: "category",
            size: 180,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Category <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/80 truncate" title={row.getValue("category")}>{row.getValue("category")}</div>,
        },
        {
            accessorKey: "project",
            size: 120,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Project <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs text-foreground font-medium truncate">{row.getValue("project")}</div>,
        },
        {
            accessorKey: "description",
            size: 280,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Description <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs text-foreground leading-snug break-words whitespace-normal py-1 pr-4">{row.getValue("description")}</div>,
        },
        { accessorKey: "l", size: 40, header: "L", },
        { accessorKey: "i", size: 40, header: "I", },
        {
            accessorKey: "score",
            size: 80,
            header: ({ column }) => (
                <div className="text-center w-full">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                        Score <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => {
                const score = row.getValue("score") as number;
                const l = row.original.l;
                const i = row.original.i;
                return (
                    <div className="flex flex-col items-center">
                        <div className={cn("w-full text-center py-1 rounded-sm text-[11px] font-bold", getScoreColor(score))}>
                            {score}
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-0.5 opacity-50">{l} x {i}</div>
                    </div>
                )
            },
        },
        {
            accessorKey: "mitigation",
            size: 280,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Mitigation <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs text-muted-foreground leading-snug break-words whitespace-normal py-1 pr-4 italic">{row.getValue("mitigation")}</div>,
        },
        { accessorKey: "lPost", size: 40, header: "LP", },
        { accessorKey: "iPost", size: 40, header: "IP", },
        {
            accessorKey: "scorePost",
            size: 100,
            header: ({ column }) => (
                <div className="text-center w-full">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                        Mitigated <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => {
                const score = row.getValue("scorePost") as number;
                const lp = row.original.lPost;
                const ip = row.original.iPost;
                return (
                    <div className="flex flex-col items-center">
                        <div className={cn("w-full text-center py-1 rounded-sm text-[11px] font-bold", getScoreColor(score))}>
                            {score}
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-0.5 opacity-50">{lp} x {ip}</div>
                    </div>
                )
            },
        },
        {
            accessorKey: "latestUpdate",
            size: 280,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Latest Update <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-start gap-2 py-1 pr-2">
                    <Info className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs text-foreground font-medium leading-relaxed">{row.getValue("latestUpdate")}</div>
                </div>
            ),
        },
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
        columnResizeMode: "onChange",
        state: { sorting, columnFilters, columnVisibility },
    });

    const clearFilters = () => setColumnFilters([]);

    return (
        <div className="w-full h-full flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="flex-none flex items-center h-10 bg-background border-b border-border shadow-sm overflow-hidden">
                <Select value={(table.getColumn("category")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("category")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[180px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Category">
                            {table.getColumn("category")?.getFilterValue() ? (table.getColumn("category")?.getFilterValue() as string) : "Category"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent><SelectItem value="all">All Categories</SelectItem>{categories.map((s) => (<SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>))}</SelectContent>
                </Select>

                <Select value={(table.getColumn("project")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("project")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[140px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Project">
                            {table.getColumn("project")?.getFilterValue() ? (table.getColumn("project")?.getFilterValue() as string) : "Project"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent><SelectItem value="all">All Projects</SelectItem>{projects.map((s) => (<SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>))}</SelectContent>
                </Select>

                <Select value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("status")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[110px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Status">
                            {table.getColumn("status")?.getFilterValue() ? (table.getColumn("status")?.getFilterValue() as string) : "Status"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent><SelectItem value="all">All Statuses</SelectItem>{statuses.map((s) => (<SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>))}</SelectContent>
                </Select>

                <div className="ml-auto flex items-center h-full">
                    {columnFilters.length > 0 && (
                        <Button variant="ghost" onClick={clearFilters} className="h-full px-4 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/5 uppercase font-bold tracking-tight rounded-none border-l border-border transition-colors">
                            Clear All <X className="ml-1.5 h-3 w-3" />
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-full w-10 p-0 rounded-none border-l border-border hover:bg-muted/50"><Settings2 className="h-4 w-4 text-muted-foreground" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuLabel className="text-xs font-bold px-2 py-1.5 uppercase tracking-widest text-muted-foreground/60">Risk Matrix Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="p-2 space-y-2">
                                <DropdownMenuCheckboxItem className="text-xs" checked={columnVisibility.l} onCheckedChange={(v) => table.getColumn("l")?.toggleVisibility(!!v)}>Show L/I Metrics</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem className="text-xs" checked={columnVisibility.mitigation} onCheckedChange={(v) => table.getColumn("mitigation")?.toggleVisibility(!!v)}>Show Mitigation Strategy</DropdownMenuCheckboxItem>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs">Visible Columns</DropdownMenuLabel>
                            {table.getAllColumns().filter((c) => typeof c.accessorFn !== "undefined" && c.getCanHide()).map((c) => (
                                <DropdownMenuCheckboxItem key={c.id} className="capitalize text-xs" checked={c.getIsVisible()} onCheckedChange={(v) => c.toggleVisibility(!!v)}>{c.id}</DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <DataTable table={table} columns={columns} selectionLabel="Risk(s)" />
        </div>
    );
}
