
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, Users, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";

import { TeamMember, teamMembers } from "@/data/mockData-old";

export function TeamTable() {
    const [data] = useState<TeamMember[]>(teamMembers);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const columns: ColumnDef<TeamMember>[] = [
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
            size: 200,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Name <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2.5">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm", row.original.color)}>
                        {row.original.initials}
                    </div>
                    <div className="text-xs font-medium text-foreground">{row.getValue("name")}</div>
                </div>
            ),
        },
        {
            accessorKey: "role",
            size: 180,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Role <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/80">{row.getValue("role")}</div>,
        },
        {
            accessorKey: "activeTasks",
            size: 120,
            header: ({ column }) => (
                <div className="text-center w-full">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                        Active Tasks <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => <div className="text-center font-mono text-xs font-semibold text-foreground">{row.getValue("activeTasks")}</div>,
        },
        {
            accessorKey: "loggedHours",
            size: 120,
            header: ({ column }) => (
                <div className="text-center w-full">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                        Logged (h) <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => <div className="text-center font-mono text-xs font-bold text-primary">{row.getValue("loggedHours")}h</div>,
        },
        {
            accessorKey: "utilization",
            size: 150,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Utilization <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const hours = row.original.loggedHours;
                const percent = Math.min((hours / 40) * 100, 100).toFixed(0);
                return (
                    <div className="w-full flex items-center gap-3">
                        <div className="h-1.5 flex-1 bg-muted/40 rounded-full overflow-hidden">
                            <div className={cn("h-full transition-all duration-500", row.original.color)} style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-foreground tabular-nums w-8">{percent}%</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "issues",
            size: 100,
            header: ({ column }) => (
                <div className="text-center w-full">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                        Issues <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => {
                const issues = row.getValue("issues") as number;
                return (
                    <div className="flex justify-center">
                        <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold",
                            issues > 0 ? "bg-red-500/10 text-red-600" : "bg-muted/30 text-muted-foreground/40"
                        )}>
                            <AlertCircle className="w-3 h-3" />
                            {issues}
                        </div>
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

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden border-t border-border/50">
            <DataTable table={table} columns={columns} selectionLabel="Member(s)" />
        </div>
    );
}
