import {
    ColumnDef,
    flexRender,
    Table as TanstackTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useMemo } from "react";

interface DataTableProps<TData> {
    table: TanstackTable<TData>;
    columns: ColumnDef<TData>[];
    selectionLabel?: string;
    className?: string;
    onRowClick?: (row: TData) => void;
}

export function DataTable<TData>({
    table,
    columns,
    selectionLabel = "row(s)",
    className,
    onRowClick,
}: DataTableProps<TData>) {
    const [pageSize, setPageSize] = useState(50);
    const [displayLimit, setDisplayLimit] = useState(pageSize);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const allRows = table.getRowModel().rows;

    const visibleRows = useMemo(() => {
        return allRows.slice(0, displayLimit);
    }, [allRows, displayLimit]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 300) {
            if (displayLimit < allRows.length) {
                setDisplayLimit(prev => Math.min(prev + pageSize, allRows.length));
            }
        }
    };

    // Reset limit when data or page size change
    useEffect(() => {
        setDisplayLimit(pageSize);
    }, [allRows.length, pageSize]);

    return (
        <div className={cn("w-full h-full flex flex-col min-h-0", className)}>
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-auto bg-card min-h-0 relative scroll-smooth"
                onScroll={handleScroll}
            >
                <Table className="w-full border-separate border-spacing-0">
                    <TableHeader className="sticky top-0 z-20 bg-muted/95 backdrop-blur shadow-sm">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="h-10 relative group bg-muted/95" style={{ width: header.getSize() }}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            {header.column.getCanResize() && (
                                                <div
                                                    onMouseDown={header.getResizeHandler()}
                                                    onTouchStart={header.getResizeHandler()}
                                                    onDoubleClick={() => header.column.resetSize()}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={cn(
                                                        "absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none hover:bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity",
                                                        header.column.getIsResizing() ? "bg-primary opacity-100" : ""
                                                    )}
                                                />
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {visibleRows.length ? (
                            visibleRows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={cn(
                                        "border-b border-border/50 hover:bg-muted/20 transition-colors",
                                        onRowClick && "cursor-pointer"
                                    )}
                                    onClick={() => onRowClick?.(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-2.5" style={{ width: cell.column.getSize() }}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}

                        {displayLimit < allRows.length && (
                            <TableRow className="hover:bg-transparent border-none">
                                <TableCell colSpan={columns.length} className="h-14 py-6 text-center text-xs text-muted-foreground/60 italic font-medium bg-muted/5">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                        <div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                        <div className="h-1 w-1 rounded-full bg-primary animate-bounce" />
                                        <span>Loading more {selectionLabel}...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex-none flex items-center justify-between space-x-2 py-2 px-4 border-t border-border bg-background">
                <div className="flex-1 text-xs text-muted-foreground pl-1 font-medium">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} {selectionLabel} selected.
                    <span className="ml-2 opacity-40 font-normal">| {visibleRows.length} loaded</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <span className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-tight">Load step:</span>
                    <Select
                        value={pageSize.toString()}
                        onValueChange={(v) => setPageSize(parseInt(v))}
                    >
                        <SelectTrigger className="h-6 w-[64px] text-[10px] font-bold border-muted/20 bg-transparent hover:bg-muted/10 transition-colors">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="min-w-[64px]">
                            {[20, 50, 100, 200].map((size) => (
                                <SelectItem key={size} value={size.toString()} className="text-[10px]">
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
