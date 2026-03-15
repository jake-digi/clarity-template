
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
import { ArrowUpDown, X, Settings2, ShieldCheck, CheckCircle2, AlertCircle, Clock, Search, FileWarning, HeartPulse } from "lucide-react";
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
export type HSRecord = {
    id: string;
    category: string;
    title: string;
    responsibleParty: string;
    project: string;
    phase: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
    status: "OPEN" | "RESOLVED" | "IN_PROGRESS" | "PENDING";
    dateRaised: string;
    assignedTo: string;
    ncr: boolean;
};

// --- Mock Data ---
const initialRecords: HSRecord[] = [
    {
        id: "HS-003",
        category: "Safety Compliance",
        title: "Safety zone markings required",
        responsibleParty: "CUSTOMER",
        project: "SDM",
        phase: "Installation",
        severity: "CRITICAL",
        status: "OPEN",
        dateRaised: "04 Dec 2025",
        assignedTo: "Madina Barker",
        ncr: true
    },
    {
        id: "HS-005",
        category: "PPE",
        title: "Arc flash PPE not available on site",
        responsibleParty: "CONTRACTOR",
        project: "BASE SANDING",
        phase: "Electrical Build",
        severity: "HIGH",
        status: "RESOLVED",
        dateRaised: "17 Nov 2025",
        assignedTo: "Sarah Chen",
        ncr: false
    },
    {
        id: "HS-007",
        category: "Risk Assessment",
        title: "RAMS not approved before hot work",
        responsibleParty: "CNCR",
        project: "CES Composites",
        phase: "Installation",
        severity: "MEDIUM",
        status: "RESOLVED",
        dateRaised: "30 Nov 2025",
        assignedTo: "Madina Barker",
        ncr: true
    },
    {
        id: "HS-010",
        category: "Emergency",
        title: "Fire extinguisher missing from robot cell",
        responsibleParty: "CUSTOMER",
        project: "SDM",
        phase: "Installation",
        severity: "HIGH",
        status: "OPEN",
        dateRaised: "13 Dec 2025",
        assignedTo: "Madina Barker",
        ncr: false
    },
];

const getStatusIcon = (status: string) => {
    switch (status) {
        case "RESOLVED": return <CheckCircle2 className="w-3 h-3 mr-1" />;
        case "OPEN": return <AlertCircle className="w-3 h-3 mr-1 text-white" />;
        case "IN_PROGRESS": return <Clock className="w-3 h-3 mr-1" />;
        case "PENDING": return <Search className="w-3 h-3 mr-1" />;
        default: return null;
    }
}

export function HSTable() {
    const [data] = useState<HSRecord[]>(initialRecords);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const categories = useMemo(() => Array.from(new Set(data.map(item => item.category))), [data]);
    const projects = useMemo(() => Array.from(new Set(data.map(item => item.project))), [data]);
    const statuses = useMemo(() => Array.from(new Set(data.map(item => item.status))), [data]);
    const severities = useMemo(() => Array.from(new Set(data.map(item => item.severity))), [data]);

    const columns: ColumnDef<HSRecord>[] = [
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
            size: 80,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    ID <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="font-mono text-[11px] text-foreground">{row.getValue("id")}</div>,
        },
        {
            accessorKey: "category",
            size: 130,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Category <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{row.getValue("category")}</div>,
        },
        {
            accessorKey: "title",
            size: 220,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Title <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="font-semibold text-xs text-foreground truncate" title={row.getValue("title")}>{row.getValue("title")}</div>,
        },
        {
            accessorKey: "responsibleParty",
            size: 140,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Resp. Party <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs text-foreground font-medium truncate" title={row.getValue("responsibleParty")}>{row.getValue("responsibleParty")}</div>,
        },
        {
            accessorKey: "project",
            size: 130,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Project <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs font-medium text-foreground truncate">{row.getValue("project")}</div>,
        },
        {
            accessorKey: "phase",
            size: 120,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Phase <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/80">{row.getValue("phase")}</div>,
        },
        {
            accessorKey: "severity",
            size: 90,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Severity <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const severity = row.getValue("severity") as string;
                const colorMap: Record<string, string> = {
                    CRITICAL: "bg-red-600 text-white",
                    HIGH: "bg-orange-600 text-white",
                    MEDIUM: "bg-blue-500 text-white",
                    LOW: "bg-emerald-500 text-white",
                    NONE: "bg-muted text-muted-foreground"
                };
                return (
                    <div className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight", colorMap[severity] || "bg-muted text-muted-foreground")}>
                        {severity}
                    </div>
                )
            },
        },
        {
            accessorKey: "status",
            size: 110,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Status <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                const statusColor = status === "RESOLVED" ? "bg-emerald-500 text-white" : getStatusColor(status);
                return (
                    <div className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight", statusColor)}>
                        {getStatusIcon(status)}
                        {status}
                    </div>
                )
            },
        },
        {
            accessorKey: "dateRaised",
            size: 110,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Date Raised <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-[11px] text-muted-foreground">{row.getValue("dateRaised")}</div>,
        },
        {
            accessorKey: "assignedTo",
            size: 120,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Assigned To <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs text-foreground font-medium">{row.getValue("assignedTo")}</div>,
        },
        {
            accessorKey: "ncr",
            size: 80,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground text-center w-full">
                    NCR <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const ncr = row.getValue("ncr") as boolean;
                return ncr ? (
                    <div className="flex justify-center w-full">
                        <div className="bg-red-500/10 text-red-500 rounded p-0.5">
                            <FileWarning className="w-3.5 h-3.5" />
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center w-full">
                        <span className="text-[10px] text-muted-foreground/20">-</span>
                    </div>
                );
            },
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
                    <SelectTrigger className="w-[150px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
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

            <DataTable table={table} columns={columns} selectionLabel="Record(s)" />
        </div>
    );
}
