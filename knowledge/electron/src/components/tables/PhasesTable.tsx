
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
import { ArrowUpDown, X, Settings2, Plus } from "lucide-react";
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
import { Phase } from "@/data/mockData-old";

export interface PhasesTableProps {
    phases: Phase[];
    onPhaseSelect: (phase: Phase) => void;
    onNewPhase: () => void;
}

export function PhasesTable({ phases: data, onPhaseSelect, onNewPhase }: PhasesTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const statuses = useMemo(() => Array.from(new Set(data.map(item => item.status))), [data]);
    const allLeads = useMemo(() => Array.from(new Set(data.flatMap(item => item.leads))), [data]);

    const getProgressColor = (percent: number) => {
        if (percent < 25) return 'bg-red-500';
        if (percent < 50) return 'bg-orange-500';
        if (percent < 85) return 'bg-blue-500';
        return 'bg-green-500';
    };

    const columns: ColumnDef<Phase>[] = [
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
            accessorKey: "name",
            size: 250,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Phase Name <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className={cn("w-1 h-8 shrink-0", getProgressColor(row.original.progress))} />
                    <div className="font-semibold text-xs text-foreground truncate">{row.getValue("name")}</div>
                </div>
            ),
        },
        {
            accessorKey: "status",
            size: 130,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Status <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                return (
                    <div className={cn(
                        "inline-flex items-center rounded-none px-2 py-0.5 text-[10px] font-bold uppercase",
                        status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                            status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' :
                                'bg-accent text-muted-foreground'
                    )}>
                        {status}
                    </div>
                )
            },
        },
        {
            accessorKey: "progress",
            size: 200,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Progress <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const progress = row.getValue("progress") as number;
                return (
                    <div className="w-full max-w-[160px]">
                        <div className="flex justify-between text-[10px] font-semibold mb-1">
                            <span className="text-foreground">{progress}%</span>
                        </div>
                        <div className="h-1 bg-accent rounded-none overflow-hidden">
                            <div className={cn("h-full transition-all duration-500", getProgressColor(progress))} style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: "leads",
            size: 100,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Leads <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const leads = row.original.leads || [];
                return (
                    <div className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                        {leads.length > 0 ? leads.map(l => l.split(" ").map(n => n[0]).join("")).join(", ") : "-"}
                    </div>
                );
            },
            filterFn: (row, id, value) => {
                const rowValue = row.getValue(id) as string[];
                if (!value || value === "all") return true;
                return rowValue.includes(value);
            }
        },
        {
            accessorKey: "date",
            size: 130,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Est. Completion <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs text-muted-foreground font-medium">{row.getValue("date")}</div>,
        },
        {
            accessorKey: "template",
            size: 120,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Template <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">{row.getValue("template")}</div>,
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
                <Select value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("status")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[130px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Status">
                            {table.getColumn("status")?.getFilterValue() ? (table.getColumn("status")?.getFilterValue() as string) : "Status"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent><SelectItem value="all">All Statuses</SelectItem>{statuses.map((s) => (<SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>))}</SelectContent>
                </Select>

                <Select value={(table.getColumn("leads")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("leads")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[110px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Lead">
                            {table.getColumn("leads")?.getFilterValue() ? (table.getColumn("leads")?.getFilterValue() as string) : "Lead"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent><SelectItem value="all">All Leads</SelectItem>{allLeads.map((l) => (<SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>))}</SelectContent>
                </Select>

                <div className="ml-auto flex items-center h-full">
                    <Button
                        variant="ghost"
                        onClick={onNewPhase}
                        className="h-full px-4 text-[10px] text-primary hover:text-primary hover:bg-primary/5 uppercase font-bold tracking-tight rounded-none border-l border-border transition-colors flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        New Phase
                    </Button>

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

            <DataTable
                table={table}
                columns={columns}
                selectionLabel="phase(s)"
                onRowClick={(row) => onPhaseSelect(row)}
            />
        </div>
    );
}
