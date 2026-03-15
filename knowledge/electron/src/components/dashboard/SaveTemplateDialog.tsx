import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { GlobalTemplatesService } from '@/services/global-templates.service';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

interface SaveTemplateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    stagesData: any[];
    tenantId: string;
    onSuccess?: () => void;
}

export const SaveTemplateDialog = ({
    isOpen,
    onClose,
    stagesData,
    tenantId,
    onSuccess
}: SaveTemplateDialogProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Please enter a template name');
            return;
        }

        setSaving(true);
        try {
            await GlobalTemplatesService.saveAsTemplate(
                tenantId,
                name,
                description,
                stagesData
            );

            toast.success('Template saved successfully');
            setName('');
            setDescription('');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Failed to save template:', error);
            toast.error('Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Save as Template</DialogTitle>
                    <DialogDescription>
                        Save the current stages configuration as a reusable template.
                        You'll be able to apply this template to other instances.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="template-name">
                            Template Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="template-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Standard Safety Briefing"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="template-description">Description (Optional)</Label>
                        <Textarea
                            id="template-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe when to use this template..."
                            rows={3}
                        />
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg border">
                        <div className="text-xs font-semibold text-muted-foreground mb-1">
                            This template will include:
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                            <li>• {stagesData.length} stage{stagesData.length !== 1 ? 's' : ''}</li>
                            <li>• {stagesData.reduce((sum, s) => sum + (s.tasks?.length || 0), 0)} task{stagesData.reduce((sum, s) => sum + (s.tasks?.length || 0), 0) !== 1 ? 's' : ''}</li>
                            <li>• All field types and configurations</li>
                        </ul>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !name.trim()}>
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Template
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
