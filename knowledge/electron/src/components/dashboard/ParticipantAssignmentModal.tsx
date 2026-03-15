import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { ParticipantsService } from '@/services/participants.service';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Users } from 'lucide-react';
import type { Participant } from '@/types/database';

interface ParticipantAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    subgroupId: string;
    subgroupName: string;
    supergroupId: string;
    instanceId: string;
    onSuccess: () => void;
}

export const ParticipantAssignmentModal = ({
    isOpen,
    onClose,
    subgroupId,
    subgroupName,
    supergroupId,
    instanceId,
    onSuccess
}: ParticipantAssignmentModalProps) => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [assignedParticipants, setAssignedParticipants] = useState<Participant[]>([]);
    const [unassignedParticipants, setUnassignedParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            loadParticipants();
        }
    }, [isOpen, instanceId, subgroupId]);

    const loadParticipants = async () => {
        setLoading(true);
        try {
            // Get all participants for this instance
            const all = await ParticipantsService.getAll({ instance_id: instanceId });

            // Separate into assigned and unassigned
            const assigned = all.filter(p => p.sub_group_id === subgroupId);
            const unassigned = all.filter(p => !p.sub_group_id || p.sub_group_id !== subgroupId);

            setParticipants(all);
            setAssignedParticipants(assigned);
            setUnassignedParticipants(unassigned);
        } catch (error) {
            console.error('Failed to load participants:', error);
            toast.error('Failed to load participants');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (selectedIds.size === 0) {
            toast.error('Please select at least one participant');
            return;
        }

        setLoading(true);
        try {
            // Assign each selected participant
            await Promise.all(
                Array.from(selectedIds).map(participantId =>
                    ParticipantsService.assignToGroup(
                        participantId,
                        instanceId,
                        supergroupId,
                        subgroupId
                    )
                )
            );

            toast.success(`Assigned ${selectedIds.size} participant(s) to ${subgroupName}`);
            setSelectedIds(new Set());
            onSuccess();
            await loadParticipants();
        } catch (error: any) {
            console.error('Failed to assign participants:', error);
            toast.error('Failed to assign participants: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleUnassign = async (participantId: string) => {
        setLoading(true);
        try {
            await ParticipantsService.assignToGroup(
                participantId,
                instanceId,
                null,
                null
            );

            toast.success('Participant unassigned');
            onSuccess();
            await loadParticipants();
        } catch (error: any) {
            console.error('Failed to unassign participant:', error);
            toast.error('Failed to unassign: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const filteredUnassigned = unassignedParticipants.filter(p =>
        p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.surname?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage Participants - {subgroupName}</DialogTitle>
                </DialogHeader>

                {loading && !participants.length ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden flex flex-col gap-4">
                        {/* Currently Assigned Section */}
                        <div className="border rounded-lg p-4 bg-muted/5">
                            <div className="flex items-center gap-2 mb-3">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <Label className="text-sm font-semibold">Currently Assigned ({assignedParticipants.length})</Label>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                                {assignedParticipants.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No participants assigned yet</p>
                                ) : (
                                    assignedParticipants.map(p => (
                                        <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-background rounded border border-border">
                                            <span className="text-sm font-medium">{p.full_name}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleUnassign(p.id)}
                                                disabled={loading}
                                                className="text-xs text-destructive hover:text-destructive"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Available Participants Section */}
                        <div className="flex-1 overflow-hidden flex flex-col border rounded-lg p-4">
                            <Label className="text-sm font-semibold mb-3">Available Participants</Label>

                            {/* Search */}
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search participants..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            {/* Participant List */}
                            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                                {filteredUnassigned.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No unassigned participants</p>
                                ) : (
                                    filteredUnassigned.map(p => (
                                        <div
                                            key={p.id}
                                            className="flex items-center gap-3 py-2 px-3 hover:bg-muted/50 rounded cursor-pointer transition-colors"
                                            onClick={() => toggleSelection(p.id)}
                                        >
                                            <Checkbox
                                                checked={selectedIds.has(p.id)}
                                                onCheckedChange={() => toggleSelection(p.id)}
                                            />
                                            <span className="text-sm flex-1">{p.full_name}</span>
                                            {p.sub_group_name && (
                                                <span className="text-xs text-muted-foreground">
                                                    Currently in: {p.sub_group_name}
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between items-center pt-3 border-t">
                                <span className="text-xs text-muted-foreground">
                                    {selectedIds.size} selected
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={onClose}>
                                        Close
                                    </Button>
                                    <Button
                                        onClick={handleAssign}
                                        disabled={selectedIds.size === 0 || loading}
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Assign Selected
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
