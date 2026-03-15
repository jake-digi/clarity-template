import { useState, useRef } from "react";
import { useDocuments, useUploadDocument, useDeleteDocument, getDocumentUrl } from "@/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Upload, Trash2, Download, Search, File, FileImage, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenantId } from "@/hooks/useTenantId";

const categories = [
  { value: "consent_form", label: "Consent Form" },
  { value: "risk_assessment", label: "Risk Assessment" },
  { value: "site_map", label: "Site Map" },
  { value: "medical", label: "Medical" },
  { value: "itinerary", label: "Itinerary" },
  { value: "general", label: "General" },
];

const fileIcon = (type: string | null) => {
  if (!type) return File;
  if (type.startsWith("image/")) return FileImage;
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) return FileSpreadsheet;
  return FileText;
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const InstanceDocumentsTab = ({ instanceId, tenantId: propTenantId }: { instanceId: string; tenantId?: string }) => {
  const hookTenantId = useTenantId();
  const tenantId = propTenantId || hookTenantId;
  const { data: documents = [], isLoading } = useDocuments(instanceId);
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        instanceId,
        tenantId,
        category,
        description,
      });
      toast({ title: "Document uploaded" });
      setOpen(false);
      setSelectedFile(null);
      setDescription("");
      setCategory("general");
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const handleDelete = async (doc: any) => {
    try {
      await deleteMutation.mutateAsync({ id: doc.id, filePath: doc.file_path, instanceId });
      toast({ title: "Document deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const filtered = documents.filter((d) => {
    const matchSearch = !search || d.file_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || d.category === filterCategory;
    return matchSearch && matchCat;
  });

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Documents</h3>
          <Badge variant="secondary">{documents.length}</Badge>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" />Upload Document</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                {selectedFile ? (
                  <p className="text-sm font-medium text-foreground">{selectedFile.name} ({formatSize(selectedFile.size)})</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Click to select a file</p>
                )}
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending} className="w-full">
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No documents found</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border">
          {filtered.map((doc) => {
            const Icon = fileIcon(doc.file_type);
            const catLabel = categories.find((c) => c.value === doc.category)?.label ?? doc.category;
            return (
              <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] h-5">{catLabel}</Badge>
                    <span>{formatSize(doc.file_size)}</span>
                    <span>{new Date(doc.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={getDocumentUrl(doc.file_path)} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(doc)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InstanceDocumentsTab;
