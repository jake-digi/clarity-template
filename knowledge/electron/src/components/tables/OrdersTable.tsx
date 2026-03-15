
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
import { ArrowUpDown, X, Settings2, Package, Truck, CheckCircle2, AlertCircle } from "lucide-react";
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

import { orders as initialOrders, Order } from "@/data/mockData-old";

const getStatusIcon = (status: string) => {
    switch (status) {
        case "RECEIVED": return <CheckCircle2 className="w-3 h-3 mr-1" />;
        case "ORDERED": return <Truck className="w-3 h-3 mr-1" />;
        case "DELAYED": return <AlertCircle className="w-3 h-3 mr-1" />;
        case "PENDING": return <Package className="w-3 h-3 mr-1" />;
        default: return null;
    }
}

export function OrdersTable() {
    const [data] = useState<Order[]>(initialOrders);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const suppliers = useMemo(() => Array.from(new Set(data.map(item => item.supplier))), [data]);
    const orderedByList = useMemo(() => Array.from(new Set(data.flatMap(item => item.orderedBy))), [data]);
    const statuses = useMemo(() => Array.from(new Set(data.map(item => item.status))), [data]);

    const columns: ColumnDef<Order>[] = [
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
            size: 110,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    PO Number <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="font-mono text-[11px] text-foreground">{row.getValue("id")}</div>,
        },
        {
            accessorKey: "description",
            size: 220,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Description <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="font-semibold text-xs text-foreground truncate" title={row.getValue("description")}>{row.getValue("description")}</div>,
        },
        {
            accessorKey: "supplier",
            size: 160,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Supplier <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs text-foreground font-medium truncate" title={row.getValue("supplier")}>{row.getValue("supplier")}</div>,
        },
        {
            accessorKey: "orderedBy",
            size: 140,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Ordered By <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const orderedBy = row.original.orderedBy || [];
                return (
                    <div className="text-xs text-foreground font-medium truncate">
                        {orderedBy.join(", ")}
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
            accessorKey: "costCenter",
            size: 110,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Cost Center <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-[10px] font-semibold text-muted-foreground tracking-tight">{row.getValue("costCenter")}</div>,
        },
        {
            accessorKey: "amount",
            size: 100,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Amount <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="font-mono text-xs text-foreground text-right">{row.getValue("amount")}</div>,
        },
        {
            accessorKey: "orderDate",
            size: 110,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Order Date <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-[11px] text-muted-foreground">{row.getValue("orderDate")}</div>,
        },
        {
            accessorKey: "expectedDelivery",
            size: 130,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Expected Delivery <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-[11px] text-foreground font-medium">{row.getValue("expectedDelivery")}</div>,
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
                    <div className={cn("inline-flex items-center rounded-none px-2 py-0.5 text-[10px] font-bold", getStatusColor(status))}>
                        {getStatusIcon(status)}
                        {status}
                    </div>
                )
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
                <Select value={(table.getColumn("supplier")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("supplier")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[140px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Supplier">
                            {table.getColumn("supplier")?.getFilterValue() ? (table.getColumn("supplier")?.getFilterValue() as string) : "Supplier"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent><SelectItem value="all">All Suppliers</SelectItem>{suppliers.map((s) => (<SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>))}</SelectContent>
                </Select>

                <Select value={(table.getColumn("orderedBy")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("orderedBy")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[140px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Ordered By">
                            {table.getColumn("orderedBy")?.getFilterValue() ? (table.getColumn("orderedBy")?.getFilterValue() as string) : "Ordered By"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent><SelectItem value="all">All People</SelectItem>{orderedByList.map((p) => (<SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>))}</SelectContent>
                </Select>

                <Select value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("status")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[130px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
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

            <DataTable table={table} columns={columns} selectionLabel="PO(s)" />
        </div>
    );
}
