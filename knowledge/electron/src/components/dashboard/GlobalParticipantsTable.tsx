
import { useState } from 'react';
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
    Filter,
    Download,
    Mail,
    Phone,
    MoreVertical,
    Activity
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/DataTable";
import { Participant } from '@/types/database';
import { ParticipantDetailsModal } from './ParticipantDetailsModal';
import { useParticipants } from '@/hooks/useParticipants';
import { BulkUploadModal } from './BulkUploadModal';

export const GlobalParticipantsTable = () => {
    // Fetch participants from the real database using the hook
    const { data: participants = [] } = useParticipants();

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

    const handleViewProfile = (participant: Participant) => {
        setSelectedParticipant(participant);
        setIsModalOpen(true);
    };

    const columns: ColumnDef<Participant>[] = [
        {
            id: "select",
            size: 40,
            enableResizing: false,
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "full_name",
            size: 240,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Participant <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 flex items-center justify-center shrink-0 rounded-full border border-primary/20">
                        <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{row.getValue("full_name")}</p>
                        <p className="text-[10px] text-muted-foreground font-mono opacity-60">ID: {row.original.id}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "status",
            size: 120,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Status <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs font-semibold text-foreground bg-muted/30 px-2 py-1 inline-block border border-border/50 capitalize">{row.getValue("status")}</div>,
        },
        {
            accessorKey: "rank",
            size: 130,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Role <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs text-muted-foreground font-medium">{row.getValue("rank")}</div>,
        },
        {
            id: "actions",
            size: 60,
            cell: ({ row }) => (
                <div className="flex justify-end pr-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuItem className="text-xs font-semibold gap-2" onClick={() => handleViewProfile(row.original)}>
                                <Activity className="w-3.5 h-3.5" />
                                View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-semibold gap-2">
                                <Mail className="w-3.5 h-3.5" />
                                Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-semibold gap-2">
                                <Phone className="w-3.5 h-3.5" />
                                Emergency Contact
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-xs font-semibold text-red-600 gap-2">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Flag Incident
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        }
    ];

    const table = useReactTable({
        data: participants,
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
        <div className="w-full h-full flex flex-col min-h-0 bg-background border-l border-border">
            <div className="flex-none p-6 pb-2">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">Global Directory</h1>
                        <p className="text-sm text-muted-foreground">Viewing all participants across the tenant</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-bold gap-2">
                            <Download className="w-3.5 h-3.5" />
                            Export Data
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            className="h-9 px-4 text-xs font-bold gap-2"
                            onClick={() => setIsBulkUploadOpen(true)}
                        >
                            <User className="w-3.5 h-3.5" />
                            Enroll Participant
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-none flex items-center h-12 bg-background border-b border-t border-border mt-4 overflow-hidden">
                <div className="flex items-center border-r border-border h-full px-6 bg-muted/20 min-w-[300px]">
                    <Search className="w-4 h-4 text-muted-foreground mr-3" />
                    <input
                        placeholder="Search by name, ID or group..."
                        className="bg-transparent border-none text-sm focus:ring-0 focus:outline-none w-full placeholder:text-muted-foreground/40"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center h-full px-4 border-r border-border gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[11px] font-semibold text-foreground">Showing {participants.length} records</span>
                </div>

                <div className="ml-auto flex items-center h-full">
                    <Button variant="ghost" className="h-full px-6 text-xs font-bold text-muted-foreground border-l border-border hover:bg-muted/50 rounded-none transition-colors gap-2">
                        <Filter className="w-3.5 h-3.5" />
                        Save View
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-full w-12 p-0 rounded-none border-l border-border hover:bg-muted/50 transition-colors">
                                <Settings2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuLabel className="text-[11px] font-bold">Workspace Display</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {table.getAllColumns().filter((c) => typeof c.accessorFn !== "undefined" && c.getCanHide()).map((c) => (
                                <DropdownMenuCheckboxItem key={c.id} className="capitalize text-xs font-semibold" checked={c.getIsVisible()} onCheckedChange={(v) => c.toggleVisibility(!!v)}>{c.id}</DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex-1 min-h-0 relative overflow-hidden">
                <DataTable
                    table={table}
                    columns={columns}
                    selectionLabel="participant(s)"
                    onRowClick={(participant) => handleViewProfile(participant)}
                />
            </div>

            <ParticipantDetailsModal
                participant={selectedParticipant}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
            />

            <BulkUploadModal
                open={isBulkUploadOpen}
                onOpenChange={setIsBulkUploadOpen}
            />
        </div>
    );
};
