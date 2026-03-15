
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
    Utensils,
    Stethoscope,
    User,
    ArrowUpDown,
    Settings2,
    MoreHorizontal,
    Trash2,
    UserMinus,
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
import { useParticipants } from '@/hooks/useParticipants';
import { Loader2 } from 'lucide-react';
import { ParticipantsService } from '@/services/participants.service';
import { ParticipantDetailsModal } from './ParticipantDetailsModal';
import { AddParticipantsToInstanceModal } from './AddParticipantsToInstanceModal';
import { BulkUploadModal } from './BulkUploadModal';
import { toast } from 'sonner';

interface ParticipantsTableProps {
    instanceId?: string;
}

export const ParticipantsTable = ({ instanceId }: ParticipantsTableProps) => {
    const { data: participants = [], isLoading, error, refetch } = useParticipants({ instance_id: instanceId });

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
    const [isBulkRemoving, setIsBulkRemoving] = useState(false);

    const handleViewProfile = (participant: any) => {
        setSelectedParticipant(participant);
        setIsModalOpen(true);
    };

    const handleBulkRemove = async () => {
        if (!instanceId) return;
        const selectedRows = table.getSelectedRowModel().rows;
        const ids = selectedRows.map(r => r.original.id as string);
        if (ids.length === 0) return;

        const confirmed = window.confirm(`Remove ${ids.length} participant(s) from this instance? Their participant records will be kept.`);
        if (!confirmed) return;

        setIsBulkRemoving(true);
        try {
            await ParticipantsService.bulkRemoveFromInstance(ids, instanceId);
            toast.success(`Removed ${ids.length} participant(s) from instance`);
            setRowSelection({});
            refetch();
        } catch (err) {
            console.error(err);
            toast.error('Failed to remove participants');
        } finally {
            setIsBulkRemoving(false);
        }
    };

    // Calculate unique values for filters
    const groups = useMemo(() => Array.from(new Set(participants.map(p => p.sub_group_name).filter(Boolean))), [participants]);
    const institutes = useMemo(() => Array.from(new Set(participants.map(p => p.school_institute).filter(Boolean))), [participants]);
    const years = useMemo(() => Array.from(new Set(participants.map(p => p.school_year).filter(Boolean))), [participants]);

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
            accessorKey: "full_name",
            size: 220,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Participant <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{row.getValue("full_name")}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{row.original.id ? row.original.id.slice(0, 8).toUpperCase() : '-'}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "sub_group_name",
            size: 120,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Group <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs font-semibold text-foreground">{row.getValue("sub_group_name") || "-"}</div>,
        },
        {
            accessorKey: "school_year",
            size: 100,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Year <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs text-muted-foreground">{row.getValue("school_year") || "-"}</div>,
        },
        {
            accessorKey: "school_institute",
            size: 140,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Institute <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-xs text-muted-foreground truncate">{row.getValue("school_institute") || "-"}</div>,
        },
        {
            id: "healthStatus",
            size: 180,
            header: () => <div className="text-[11px] font-semibold text-muted-foreground px-4">Health & safety</div>,
            cell: ({ row }) => {
                const p = row.original;
                const medInfo = p.medical_info;
                const diet = p.dietary_needs;

                const hasMed = ((medInfo?.allergies?.length || 0) + (medInfo?.conditions?.length || 0)) > 0;
                const hasDiet = (diet?.restrictions?.length || 0) > 0;
                const hasCases = (p.activeCaseIds?.length || 0) > 0;

                return (
                    <div className="flex items-center gap-3 pl-4">
                        {/* Medical */}
                        <div className={cn(
                            "p-1 flex items-center gap-1",
                            hasMed ? "text-red-600 bg-red-50" : "text-muted-foreground/30"
                        )}>
                            <Stethoscope className="w-3.5 h-3.5" />
                            {hasMed && <span className="text-[10px] font-bold">Med</span>}
                        </div>
                        {/* Dietary */}
                        <div className={cn(
                            "p-1 flex items-center gap-1",
                            hasDiet ? "text-amber-600 bg-amber-50" : "text-muted-foreground/30"
                        )}>
                            <Utensils className="w-3.5 h-3.5" />
                            {hasDiet && <span className="text-[10px] font-bold">Diet</span>}
                        </div>
                        {/* Cases */}
                        <div className={cn(
                            "p-1 flex items-center gap-1",
                            hasCases ? "text-red-600 font-bold" : "text-muted-foreground/30"
                        )}>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            {hasCases && <span className="text-[10px]">{p.activeCaseIds.length} Case</span>}
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "is_off_site",
            size: 100,
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Status <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => {
                const isOffSite = row.getValue("is_off_site");
                return isOffSite ? (
                    <div className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200">Off-site</div>
                ) : (
                    <div className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold border border-green-200">On-site</div>
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
        data: participants,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter: searchQuery,
        },
        onGlobalFilterChange: setSearchQuery,
    });

    const selectedCount = Object.keys(rowSelection).length;

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-sm font-medium text-muted-foreground">Loading participants...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-background">
                <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">Connection Error</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    {(error as any)?.message || 'Failed to connect to the participant database. Please ensure you have run the schema update script in Supabase.'}
                </p>
                <div className="flex gap-3">
                    <Button onClick={() => window.location.reload()} variant="default">
                        Retry
                    </Button>
                    <Button onClick={() => console.log(error)} variant="outline">
                        Log Details
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col min-h-0 bg-background">
            {/* Toolbar - Matching Tasks/Orders style */}
            <div className="flex-none flex items-center h-10 bg-background border-b border-border shadow-sm overflow-hidden">
                <div className="flex items-center border-r border-border h-full px-4 bg-muted/20 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                    <input
                        placeholder="Search participants..."
                        className="bg-transparent border-none text-xs focus:ring-0 w-full placeholder:text-muted-foreground/50 font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={(table.getColumn("sub_group_name")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("sub_group_name")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[120px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none appearance-none">
                        <SelectValue placeholder="Group" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Groups</SelectItem>
                        {groups.map((g) => (<SelectItem key={g} value={g as string} className="text-xs">{g as string}</SelectItem>))}
                    </SelectContent>
                </Select>

                <Select value={(table.getColumn("school_year")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("school_year")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[110px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {years.map((y) => (<SelectItem key={y as string} value={y as string} className="text-xs">{y as string}</SelectItem>))}
                    </SelectContent>
                </Select>

                <Select value={(table.getColumn("school_institute")?.getFilterValue() as string) ?? "all"} onValueChange={(v) => table.getColumn("school_institute")?.setFilterValue(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[130px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Institute" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Institutes</SelectItem>
                        {institutes.map((i) => (<SelectItem key={i as string} value={i as string} className="text-xs">{i as string}</SelectItem>))}
                    </SelectContent>
                </Select>

                <div className="ml-auto flex items-center h-full">
                    {instanceId && (
                        <Button
                            variant="ghost"
                            onClick={() => setIsBulkUploadOpen(true)}
                            className="h-full px-4 text-[11px] font-bold text-primary border-l border-border hover:bg-primary/5 rounded-none transition-colors"
                        >
                            Bulk Upload
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-full px-4 text-[11px] font-bold text-primary border-l border-border hover:bg-primary/5 rounded-none transition-colors"
                    >
                        Add Participant
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

            {/* Bulk Action Bar */}
            {selectedCount > 0 && instanceId && (
                <div className="flex-none flex items-center h-10 bg-destructive/5 border-b border-destructive/20 px-4 gap-3 animate-in slide-in-from-top-1 duration-150">
                    <span className="text-xs font-bold text-destructive">{selectedCount} participant{selectedCount !== 1 ? 's' : ''} selected</span>
                    <div className="h-4 w-px bg-destructive/20" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 px-3"
                        onClick={handleBulkRemove}
                        disabled={isBulkRemoving}
                    >
                        {isBulkRemoving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <UserMinus className="w-3.5 h-3.5" />
                        )}
                        Remove from Instance
                    </Button>
                    <button
                        className="ml-auto text-[10px] font-bold text-muted-foreground hover:text-foreground"
                        onClick={() => setRowSelection({})}
                    >
                        Clear selection
                    </button>
                </div>
            )}

            <DataTable
                table={table}
                columns={columns}
                selectionLabel="participant(s)"
                onRowClick={(participant) => handleViewProfile(participant)}
            />

            <ParticipantDetailsModal
                participant={selectedParticipant}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
            />

            {instanceId && (
                <>
                    <AddParticipantsToInstanceModal
                        open={isAddModalOpen}
                        onOpenChange={setIsAddModalOpen}
                        instanceId={instanceId}
                        existingParticipantIds={participants.map(p => p.id)}
                    />
                    <BulkUploadModal
                        open={isBulkUploadOpen}
                        onOpenChange={setIsBulkUploadOpen}
                        instanceId={instanceId}
                    />
                </>
            )}
        </div>
    );
};
