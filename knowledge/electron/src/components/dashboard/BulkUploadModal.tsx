import { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ParticipantsService } from '@/services/participants.service';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Papa from 'papaparse';
import { useAuth } from '@/components/auth-provider';
import { useInstances } from '@/hooks/useInstances';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface BulkUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    instanceId?: string;
}

export const BulkUploadModal = ({
    open,
    onOpenChange,
    instanceId,
}: BulkUploadModalProps) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedInstanceId, setSelectedInstanceId] = useState<string | undefined>(instanceId);

    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const { data: instancesTree } = useInstances(user?.tenant_id);
    const availableInstances = instancesTree?.active || [];

    const exampleHeaders = [
        "Surname", "Firstname", "Gender", "DOB", "Supergroup", "Subgroup",
        "Level", "Training", "Rucksack", "Attended", "Practice", "Assessed", "Notes"
    ];

    const requiredHeaders = ["Firstname", "Surname"];

    const validateData = (data: any[]) => {
        const errors: string[] = [];
        if (data.length === 0) {
            errors.push("No data found in the CSV.");
            return errors;
        }

        const headers = Object.keys(data[0] || {});
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h) && !headers.includes(h.toLowerCase()));

        if (missingHeaders.length > 0) {
            errors.push(`Missing required columns: ${missingHeaders.join(", ")}`);
        }

        const invalidRows = data.filter(row => !row['Firstname'] && !row['first_name'] && !row['Surname'] && !row['surname']);
        if (invalidRows.length > 0 && invalidRows.length < data.length) {
            errors.push(`Found ${invalidRows.length} empty or invalid rows. They will be skipped.`);
        } else if (invalidRows.length === data.length) {
            errors.push("All rows are missing required Firstname and Surname data.");
        }

        return errors;
    };

    const generateTemplate = () => {
        const csv = Papa.unparse({
            fields: exampleHeaders,
            data: [
                ["Abramson", "Gabriella", "Female", "2012-08-07", "Asgard", "G04", "Bronze", "Bronze", "Not Attended", "2026", "Not Attended", "2026", ""]
            ]
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "bulk_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setIsParsing(true);

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data;
                const errors = validateData(data);

                setParsedData(data);
                setValidationErrors(errors);
                setIsParsing(false);
            },
            error: (err) => {
                console.error('CSV Parsing error:', err);
                toast.error('Failed to parse CSV file');
                setValidationErrors(['Error reading the CSV file format.']);
                setIsParsing(false);
            }
        });
    };

    const handleUpload = async () => {
        const targetInstanceId = instanceId || selectedInstanceId;

        if (!user?.tenant_id || !targetInstanceId || parsedData.length === 0) {
            toast.error('Please select an instance first');
            return;
        }

        setIsSaving(true);
        try {
            const insertedCount = await ParticipantsService.bulkCreateAndAssign(
                parsedData,
                targetInstanceId,
                user.tenant_id
            );

            toast.success(`Successfully uploaded and assigned ${insertedCount} participant(s)`);

            // Invalidate queries to refresh the list
            queryClient.invalidateQueries({ queryKey: ['participants', { instance_id: targetInstanceId }] });
            queryClient.invalidateQueries({ queryKey: ['participants-summary', targetInstanceId] });
            queryClient.invalidateQueries({ queryKey: ['participants'] }); // Global refetch
            // Also invalidate instances so the Groups tab updates with the newly auto-created ones
            queryClient.invalidateQueries({ queryKey: ['instances'] });

            onOpenChange(false);
            resetState();
        } catch (err) {
            console.error('Failed to upload participants:', err);
            toast.error('Failed to process bulk upload');
        } finally {
            setIsSaving(false);
        }
    };

    const resetState = () => {
        setFile(null);
        setParsedData([]);
        setValidationErrors([]);
        setIsParsing(false);
        setIsSaving(false);
        setSelectedInstanceId(instanceId);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            resetState();
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-primary" />
                        Enroll Participants (Bulk Upload)
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 py-4 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                            Upload a CSV file to enroll multiple participants. Include <strong>Supergroup</strong> and <strong>Subgroup</strong> columns — groups will be auto-created if they don't already exist.
                        </p>
                        <Button variant="outline" size="sm" className="shrink-0 gap-2 font-bold" onClick={generateTemplate}>
                            <Download className="w-4 h-4" />
                            Download Template
                        </Button>
                    </div>

                    {!instanceId && (
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground">Target Instance</label>
                            <Select value={selectedInstanceId} onValueChange={setSelectedInstanceId}>
                                <SelectTrigger className="w-full bg-muted/30 border-border">
                                    <SelectValue placeholder="Select an instance to assign participants to..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableInstances.map(inst => (
                                        <SelectItem key={inst.id} value={inst.id}>
                                            {inst.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {!file && (
                        <div
                            className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-10 h-10 text-muted-foreground/50 mb-4" />
                            <h3 className="font-bold text-sm text-foreground mb-1">Click to upload or drag and drop</h3>
                            <p className="text-xs text-muted-foreground">CSV formatting required</p>
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                        </div>
                    )}

                    {file && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-muted/40 p-3 rounded-md border border-border">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-bold">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => resetState()} className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive">
                                    Remove
                                </Button>
                            </div>

                            {validationErrors.length > 0 && (
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md flex gap-2 text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-bold mb-1">Validation Issues</div>
                                        <ul className="list-disc pl-4 space-y-1 text-xs">
                                            {validationErrors.map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {parsedData.length > 0 && validationErrors.length === 0 && (
                                <div className="border border-border rounded-md overflow-hidden">
                                    <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center">
                                        <span className="text-xs font-bold">Data Preview ({parsedData.length} records)</span>
                                        <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">Valid</Badge>
                                    </div>
                                    <ScrollArea className="h-[200px]">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-xs">Name</TableHead>
                                                    <TableHead className="text-xs">Gender</TableHead>
                                                    <TableHead className="text-xs">DOB</TableHead>
                                                    <TableHead className="text-xs">Supergroup</TableHead>
                                                    <TableHead className="text-xs">Subgroup</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {parsedData.slice(0, 5).map((row, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="text-xs font-medium">
                                                            {row['Firstname'] || row['first_name']} {row['Surname'] || row['surname']}
                                                        </TableCell>
                                                        <TableCell className="text-xs">{row['Gender'] || row['gender'] || '-'}</TableCell>
                                                        <TableCell className="text-xs">{row['DOB'] || row['date_of_birth'] || '-'}</TableCell>
                                                        <TableCell className="text-xs">
                                                            {row['Supergroup'] || row['supergroup'] ? (
                                                                <Badge variant="outline" className="text-[10px] bg-primary/5">{row['Supergroup'] || row['supergroup']}</Badge>
                                                            ) : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {row['Subgroup'] || row['subgroup'] ? (
                                                                <Badge variant="outline" className="text-[10px]">{row['Subgroup'] || row['subgroup']}</Badge>
                                                            ) : '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {parsedData.length > 5 && (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-xs text-muted-foreground bg-muted/20">
                                                            ... and {parsedData.length - 5} more records
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-card border-t border-border">
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={parsedData.length === 0 || isSaving || isParsing || (validationErrors.length > 0 && validationErrors[0].startsWith("All rows"))}
                        className="min-w-[120px]"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                                Upload & Assign
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
