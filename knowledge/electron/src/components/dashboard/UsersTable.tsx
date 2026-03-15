
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
    User,
    ArrowUpDown,
    Settings2,
    MoreHorizontal,
    Mail,
    ShieldCheck,
    Calendar,
    CheckCircle2,
    XCircle,
    Clock
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
import { UsersService } from '@/services/users.service';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const getStatusColor = (status: string) => {
    switch (status) {
        case 'active': return "text-green-600 bg-green-50 border-green-200";
        case 'pending_assignment': return "text-amber-600 bg-amber-50 border-amber-200";
        case 'inactive': return "text-slate-400 bg-slate-50 border-slate-200";
        default: return "text-slate-600 bg-slate-50";
    }
};

interface UsersTableProps {
    instanceId?: string;
}

export const UsersTable = ({ instanceId }: UsersTableProps) => {
    const { data = [], isLoading } = useQuery({
        queryKey: ['users', instanceId],
        queryFn: () => instanceId ? UsersService.getByInstance(instanceId) : UsersService.getAll(),
    });

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [searchQuery, setSearchQuery] = useState('');

    const rolesList = useMemo(() => Array.from(new Set(data.flatMap((u: any) => u.roles || []))), [data]);
    const statuses = ['active', 'pending_assignment', 'inactive'];

    const columns: ColumnDef<any>[] = [
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
            accessorKey: "fullName",
            size: 240,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    User <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const u = row.original;
                const name = `${u.first_name || ''} ${u.surname || u.last_name || ''}`.trim();
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                            {u.profile_photo_url ? (
                                <img src={u.profile_photo_url} alt={name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-4 h-4 text-primary" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{name || 'Unnamed User'}</p>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate font-medium">
                                <Mail className="w-3 h-3" />
                                {u.email}
                            </div>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "status",
            size: 140,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Status <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                return (
                    <div className={cn(
                        "inline-flex items-center px-2 py-0.5 text-[10px] font-bold border rounded-sm",
                        getStatusColor(status)
                    )}>
                        {status === 'active' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {status === 'pending_assignment' && <Clock className="w-3 h-3 mr-1" />}
                        {status === 'inactive' && <XCircle className="w-3 h-3 mr-1" />}
                        {status.replace('_', ' ').toUpperCase()}
                    </div>
                );
            }
        },
        {
            accessorKey: "roles",
            size: 180,
            header: () => <div className="text-[11px] font-semibold text-muted-foreground">Roles</div>,
            cell: ({ row }) => {
                const roles = row.getValue("roles") as string[];
                return (
                    <div className="flex flex-wrap gap-1">
                        {roles.map(role => (
                            <span key={role} className="px-1.5 py-0.5 bg-muted text-[9px] font-bold text-muted-foreground border border-border">
                                {role}
                            </span>
                        ))}
                    </div>
                );
            }
        },
        {
            id: "instances",
            size: 140,
            header: () => <div className="text-[11px] font-semibold text-muted-foreground">Instances</div>,
            cell: ({ row }) => {
                const instancesCount = (row.original as any).assigned_instances?.length || 0;
                return (
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span className="text-xs font-mono font-bold text-foreground">{instancesCount}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">Assigned</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "created_at",
            size: 140,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Joined <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const rawDate = row.getValue("created_at") as string;
                if (!rawDate) return <span className="text-xs text-muted-foreground opacity-30">-</span>;
                const date = new Date(rawDate);
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground/40" />
                        <span className="text-xs text-muted-foreground">{format(date, 'MMM yyyy')}</span>
                    </div>
                );
            }
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

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50 mx-auto mb-3" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-bold">Accessing User records...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col min-h-0 bg-background">
            {/* Toolbar */}
            <div className="flex-none flex items-center h-10 bg-background border-b border-border shadow-sm overflow-hidden">
                <div className="flex items-center border-r border-border h-full px-4 bg-muted/20 min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                    <input
                        placeholder="Search users..."
                        className="bg-transparent border-none text-xs focus:ring-0 w-full placeholder:text-muted-foreground/50 font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("status")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[140px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none appearance-none">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {statuses.map((s) => (<SelectItem key={s} value={s} className="text-xs capitalize">{s.replace('_', ' ')}</SelectItem>))}
                    </SelectContent>
                </Select>

                <div className="ml-auto flex items-center h-full">
                    <Button variant="ghost" className="h-full px-4 text-[11px] font-bold text-primary border-l border-border hover:bg-primary/5 rounded-none transition-colors">
                        Invite User
                    </Button>
                    <Button variant="ghost" className="h-full w-10 p-0 rounded-none border-l border-border hover:bg-muted/50 transition-colors">
                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            <DataTable
                table={table}
                columns={columns}
                selectionLabel="user(s)"
            />
        </div>
    );
};
