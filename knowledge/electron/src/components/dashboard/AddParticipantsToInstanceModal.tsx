
import { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, UserCircle, Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { useParticipants } from '@/hooks/useParticipants';
import { ParticipantsService } from '@/services/participants.service';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AddParticipantsToInstanceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    instanceId: string;
    existingParticipantIds: string[];
}

export const AddParticipantsToInstanceModal = ({
    open,
    onOpenChange,
    instanceId,
    existingParticipantIds
}: AddParticipantsToInstanceModalProps) => {
    const { data: allParticipants = [], isLoading } = useParticipants(); // Global fetch
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const queryClient = useQueryClient();

    // Filter out participants already in this instance
    const availableParticipants = useMemo(() => {
        const existingSet = new Set(existingParticipantIds);
        return allParticipants.filter(p => !existingSet.has(p.id));
    }, [allParticipants, existingParticipantIds]);

    const filteredParticipants = useMemo(() => {
        if (!searchQuery) return availableParticipants;
        const search = searchQuery.toLowerCase();
        return availableParticipants.filter(p =>
            p.full_name.toLowerCase().includes(search) ||
            p.id.toLowerCase().includes(search)
        );
    }, [availableParticipants, searchQuery]);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleAdd = async () => {
        if (selectedIds.size === 0) return;

        setIsSaving(true);
        try {
            await ParticipantsService.assignMultipleToInstance(Array.from(selectedIds), instanceId);
            toast.success(`Successfully added ${selectedIds.size} participant(s)`);

            // Invalidate queries to refresh the list
            queryClient.invalidateQueries({ queryKey: ['participants', { instance_id: instanceId }] });
            queryClient.invalidateQueries({ queryKey: ['participants-summary', instanceId] });

            onOpenChange(false);
            setSelectedIds(new Set());
        } catch (err) {
            console.error('Failed to add participants:', err);
            toast.error('Failed to add participants to instance');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" />
                        Add Participants to Instance
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <input
                            placeholder="Search directory by name or ID..."
                            className="w-full bg-muted/30 border border-border rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="px-6 py-2 bg-muted/30 border-y border-border flex justify-between items-center">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                        {filteredParticipants.length} Available Participants
                    </span>
                    <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
                        {selectedIds.size} Selected
                    </span>
                </div>

                <ScrollArea className="h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Accessing Directory...</p>
                        </div>
                    ) : filteredParticipants.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Search className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">No participants found</h3>
                            <p className="text-xs text-muted-foreground mt-1">All participants in the directory are already in this instance or don't match your search.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredParticipants.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => toggleSelection(p.id)}
                                >
                                    <Checkbox
                                        checked={selectedIds.has(p.id)}
                                        onCheckedChange={() => toggleSelection(p.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <Avatar className="h-9 w-9 border border-border shadow-sm">
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                            {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-foreground truncate">{p.full_name}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono opacity-60">ID: {p.id.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                    <div className="text-right whitespace-nowrap">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{p.unit_name || 'No Unit'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="p-6 bg-card border-t border-border">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAdd}
                        disabled={selectedIds.size === 0 || isSaving}
                        className="min-w-[120px]"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                                Add {selectedIds.size} Participants
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
