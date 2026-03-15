
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { InstancesService } from '@/services/instances.service';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface GroupCreatorProps {
    instanceId: string;
    tenantId: string;
    supergroups: any[];
    onSuccess: () => void;
    initialMode?: 'supergroup' | 'subgroup';
    trigger?: React.ReactNode;
}

export const GroupCreator = ({ instanceId, tenantId, supergroups, onSuccess, initialMode = 'supergroup', trigger }: GroupCreatorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'supergroup' | 'subgroup'>(initialMode);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState(initialMode === 'supergroup' ? 'Village' : 'Unit');
    const [parentHelper, setParentHelper] = useState('');

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Name is required");
            return;
        }

        try {
            const newId = self.crypto.randomUUID(); // Generate ID client-side to prevent DB null error

            if (mode === 'supergroup') {
                await InstancesService.createSupergroup({
                    id: newId,
                    instance_id: instanceId,
                    tenant_id: tenantId,
                    name: name,
                    type: type,
                    notifications: true,
                });
                toast.success("Supergroup created");
            } else {
                if (!parentHelper) {
                    toast.error("Please select a parent Supergroup");
                    return;
                }
                await InstancesService.createSubgroup({
                    id: newId,
                    instance_id: instanceId,
                    tenant_id: tenantId,
                    name: name,
                    type: type,
                    parent_supergroup_id: parentHelper,
                    notifications: true,
                });
                toast.success("Group created");
            }

            setIsOpen(false);
            setName('');
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to create group: " + (error.message || "Unknown error"));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" className="h-full px-4 text-[11px] font-bold text-primary border-l border-border hover:bg-primary/5 rounded-none transition-colors">
                        <Plus className="w-3.5 h-3.5 mr-2" />
                        New Group
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New {mode === 'supergroup' ? 'Supergroup' : 'Subgroup'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Mode Switcher - Optional if we want strict distinct buttons, but helpful to keep */}
                    <div className="flex bg-muted p-1 rounded-lg">
                        <button
                            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${mode === 'supergroup' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => { setMode('supergroup'); setType('Village'); }}
                        >
                            Supergroup
                        </button>
                        <button
                            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${mode === 'subgroup' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => { setMode('subgroup'); setType('Unit'); }}
                        >
                            Group
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                            placeholder={mode === 'supergroup' ? "New Supergroup Name" : "New Group Name"}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Type Label</Label>
                        <Input
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            placeholder={mode === 'supergroup' ? "e.g. Village" : "e.g. Unit"}
                        />
                    </div>

                    {mode === 'subgroup' && (
                        <div className="space-y-2">
                            <Label>Parent Supergroup</Label>
                            <select
                                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={parentHelper}
                                onChange={(e) => setParentHelper(e.target.value)}
                            >
                                <option value="">Select a Parent...</option>
                                {supergroups.map(sg => (
                                    <option key={sg.id} value={sg.id}>{sg.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate}>Create</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
