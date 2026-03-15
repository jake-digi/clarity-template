
import { useState, useMemo, useEffect, useCallback } from "react";
import { Check, UserPlus } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
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
import { ArrowUpDown, X, CalendarIcon, Settings2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DataTable } from "@/components/ui/DataTable";
import { getPriorityColor, getStatusColor } from "@/lib/tableUtils";
import { TaskDetailSheet } from "../shared/TaskDetailSheet";

import { demoTasks as initialTasks, Task, LEADS } from "@/data/mockData-old";

export interface TasksTableProps {
    tasks?: Task[];
    selectedTaskId?: string;
}

export function TasksTable({ tasks, selectedTaskId: externalSelectedTaskId }: TasksTableProps) {
    const [data, setData] = useState<Task[]>(tasks || initialTasks);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Sync external selected task
    useEffect(() => {
        if (externalSelectedTaskId) {
            const task = data.find(t => t.id === externalSelectedTaskId);
            if (task) {
                setSelectedTask(task);
                setIsSheetOpen(true);
            }
        }
    }, [externalSelectedTaskId, data]);

    const handleRowClick = (task: Task) => {
        setSelectedTask(task);
        setIsSheetOpen(true);
    };

    const updateTaskAssignees = useCallback((taskId: string, newAssignees: string[]) => {
        setData(prev => prev.map(t => t.id === taskId ? { ...t, assignees: newAssignees } : t));
    }, []);

    const phases = useMemo(() => Array.from(new Set(data.map(item => item.phase))), [data]);
    const allUniqueAssignees = useMemo(() => Array.from(new Set(data.flatMap(item => item.assignees))), [data]);
    const priorities = useMemo(() => Array.from(new Set(data.map(item => item.priority))), [data]);
    const statuses = useMemo(() => Array.from(new Set(data.map(item => item.status))), [data]);

    const columns: ColumnDef<Task>[] = [
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
                <div
                    className="flex items-center gap-2 pl-2"
                    onClick={(e) => e.stopPropagation()}
                >
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
            accessorKey: "priority",
            size: 100,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Priority <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const priority = row.getValue("priority") as string;
                return (
                    <div className={cn("inline-flex items-center justify-center rounded-none px-2 py-0.5 text-[10px] font-bold", getPriorityColor(priority))}>
                        {priority}
                    </div>
                )
            },
        },
        {
            accessorKey: "taskName",
            size: 250,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Task Name <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="font-semibold text-xs text-foreground truncate" title={row.getValue("taskName")}>{row.getValue("taskName")}</div>,
        },
        {
            accessorKey: "phase",
            size: 140,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Phase <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-[10px] font-semibold text-muted-foreground tracking-tight">{row.getValue("phase")}</div>,
        },
        {
            accessorKey: "assignees",
            size: 180,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Assignee <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const taskAssignees = row.original.assignees || [];
                const taskId = row.original.id;

                return (
                    <Popover>
                        <PopoverTrigger asChild>
                            <div
                                className="flex items-center cursor-pointer hover:bg-muted/50 py-1 px-1 rounded-sm transition-colors overflow-hidden max-w-full group"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {taskAssignees.length > 0 ? (
                                    <>
                                        <div className="flex items-center -space-x-2 flex-shrink-0">
                                            {taskAssignees.slice(0, 3).map((a, i) => (
                                                <div
                                                    key={a}
                                                    className="h-6 w-6 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[8px] font-bold text-secondary-foreground shrink-0"
                                                    title={a}
                                                    style={{ zIndex: 10 - i }}
                                                >
                                                    {a.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                                </div>
                                            ))}
                                            {taskAssignees.length > 3 && (
                                                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[8px] font-bold text-muted-foreground shrink-0 z-0">
                                                    +{taskAssignees.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <span className="ml-2 text-xs font-medium truncate group-hover:text-primary transition-colors">
                                            {taskAssignees.length === 1 ? taskAssignees[0] : `${taskAssignees.length} people`}
                                        </span>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 text-muted-foreground/60 italic text-xs">
                                        <div className="h-6 w-6 rounded-full bg-muted/30 border border-dashed border-muted-foreground/30 flex items-center justify-center">
                                            <UserPlus className="w-3 h-3" />
                                        </div>
                                        <span>Unassigned</span>
                                    </div>
                                )}
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start" onClick={(e) => e.stopPropagation()}>
                            <Command>
                                <CommandInput placeholder="Search people..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>No results found.</CommandEmpty>
                                    <CommandGroup>
                                        {LEADS.map((name) => (
                                            <CommandItem
                                                key={name}
                                                onSelect={() => {
                                                    const isSelected = taskAssignees.includes(name);
                                                    const newAssignees = isSelected
                                                        ? taskAssignees.filter((a) => a !== name)
                                                        : [...taskAssignees, name];
                                                    updateTaskAssignees(taskId, newAssignees);
                                                }}
                                                className="text-xs"
                                            >
                                                <div className={cn(
                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary transition-colors",
                                                    taskAssignees.includes(name) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                                )}>
                                                    <Check className="h-3 w-3" />
                                                </div>
                                                {name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )
            },
            filterFn: (row, id, value) => {
                const rowValue = row.getValue(id) as string[];
                if (!value || value === "all") return true;
                return rowValue.includes(value);
            }
        },
        {
            accessorKey: "startDate",
            size: 110,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Start Date <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs text-muted-foreground">{row.getValue("startDate")}</div>,
        },
        {
            accessorKey: "deadline",
            size: 110,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Deadline <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs text-foreground font-medium">{row.getValue("deadline")}</div>,
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
                    <div className={cn("inline-flex items-center rounded-none px-2 py-0.5 text-[10px] font-bold", getStatusColor(status))}>
                        {status}
                    </div>
                )
            },
        },
        {
            accessorKey: "estHours",
            size: 80,
            header: ({ column }) => (
                <div className="text-right">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-mr-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                        Est. (h) <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => <div className="text-xs text-muted-foreground text-right font-mono">{row.getValue("estHours")}</div>,
        },
        {
            accessorKey: "loggedHours",
            size: 90,
            header: ({ column }) => (
                <div className="text-right">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-mr-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                        Logged (h) <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => {
                const logged = row.getValue("loggedHours") as number;
                return (
                    <div className={cn("text-xs font-mono text-right font-medium", logged > 0 ? "text-blue-500 dark:text-blue-400" : "text-muted-foreground/50")}>
                        {logged}
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
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
    });

    const clearFilters = () => {
        setColumnFilters([]);
        setDateRange(undefined);
        table.setColumnFilters([]);
    };

    const handleDateSelect = (range: DateRange | undefined) => {
        setDateRange(range);
        table.getColumn("deadline")?.setFilterValue(range);
    };

    return (
        <div className="w-full h-full flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="flex-none flex items-center h-10 bg-background border-b border-border shadow-sm overflow-hidden">
                <Select value={(table.getColumn("phase")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("phase")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[120px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Phase">
                            {table.getColumn("phase")?.getFilterValue() ? (table.getColumn("phase")?.getFilterValue() as string) : "Phase"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent><SelectItem value="all">All Phases</SelectItem>{phases.map((p) => (<SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>))}</SelectContent>
                </Select>

                <Select value={(table.getColumn("assignees")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("assignees")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[130px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Assignee">
                            {table.getColumn("assignees")?.getFilterValue() ? (table.getColumn("assignees")?.getFilterValue() as string) : "Assignee"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent><SelectItem value="all">All Assignees</SelectItem>{allUniqueAssignees.map((a) => (<SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>))}</SelectContent>
                </Select>

                <Select value={(table.getColumn("priority")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("priority")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[110px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Priority">
                            {table.getColumn("priority")?.getFilterValue() ? (table.getColumn("priority")?.getFilterValue() as string) : "Priority"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent><SelectItem value="all">All Priorities</SelectItem>{priorities.map((p) => (<SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>))}</SelectContent>
                </Select>

                <Select value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("status")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[120px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Status">
                            {table.getColumn("status")?.getFilterValue() ? (table.getColumn("status")?.getFilterValue() as string) : "Status"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent><SelectItem value="all">All Statuses</SelectItem>{statuses.map((s) => (<SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>))}</SelectContent>
                </Select>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" className={cn("h-full min-w-[180px] justify-start text-left font-normal text-xs rounded-none border-r border-border hover:bg-muted/50 px-4", !dateRange && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                                {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}</> : format(dateRange.from, "LLL dd")) : "Pick deadline range"}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={handleDateSelect} numberOfMonths={2} />
                    </PopoverContent>
                </Popover>

                <div className="ml-auto flex items-center h-full">
                    {(columnFilters.length > 0 || dateRange) && (
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
                selectionLabel="task(s)"
                onRowClick={handleRowClick}
            />

            <TaskDetailSheet
                task={selectedTask}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
            />
        </div>
    );
}
