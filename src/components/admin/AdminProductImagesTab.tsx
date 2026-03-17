import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Upload,
  ImageIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  FileImage,
  RefreshCw,
} from "lucide-react";
import { matchFileToProduct, type MatchType, type ProductRecord } from "@/lib/productImageMatch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PRODUCT_IMAGE_BUCKET = "freemans-storage-bucket";

function FilePreviewThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  if (!file.type.startsWith("image/"))
    return (
      <div className="w-10 h-10 rounded border border-border bg-muted flex items-center justify-center">
        <FileImage className="w-5 h-5 text-muted-foreground" />
      </div>
    );
  if (!url) return <div className="w-10 h-10 rounded border border-border bg-muted animate-pulse" />;
  return (
    <div className="w-10 h-10 rounded border border-border bg-muted overflow-hidden flex items-center justify-center">
      <img src={url} alt="" className="w-full h-full object-contain" />
    </div>
  );
}
const UPLOAD_CONCURRENCY = 4;

type FileMatch = {
  file: File;
  type: MatchType;
  product: ProductRecord | null;
};

type UploadStatus = "pending" | "uploading" | "done" | "error";

type FileUploadItem = FileMatch & {
  status: UploadStatus;
  error?: string;
};

const MATCH_LABELS: Record<MatchType, string> = {
  exact: "Exact match",
  sku_in_title: "SKU in title",
  description: "Description match",
  none: "No match",
};

const MATCH_BADGE_VARIANTS: Record<MatchType, "default" | "secondary" | "destructive" | "outline"> = {
  exact: "default",
  sku_in_title: "secondary",
  description: "outline",
  none: "destructive",
};

async function fetchAllProducts(): Promise<ProductRecord[]> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const all: ProductRecord[] = [];
  let page = 0;
  const pageSize = 500;
  while (true) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    const res = await fetch(`${baseUrl}/functions/v1/list-products?${params.toString()}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? "Failed to load products");
    const products = (json.products ?? []) as ProductRecord[];
    all.push(...products);
    const total = json.totalCount ?? 0;
    if (all.length >= total || products.length === 0) break;
    page += 1;
  }
  return all;
}

function getExtension(filename: string): string {
  const m = filename.match(/\.([^.]+)$/);
  return m ? m[1].toLowerCase() : "jpg";
}

export default function AdminProductImagesTab() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [files, setFiles] = useState<FileMatch[]>([]);
  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const list = await fetchAllProducts();
      setProducts(list);
      toast({ title: "Products loaded", description: `${list.length} products available for matching.` });
    } catch (e: any) {
      toast({ title: "Failed to load products", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setProductsLoading(false);
    }
  }, [toast]);

  const addFiles = useCallback(
    (selected: File[]) => {
      const imageFiles = selected.filter((f) => f.type.startsWith("image/"));
      if (!imageFiles.length) return;
      if (!products.length) {
        toast({
          title: "Load products first",
          description: "Click \"Load products\" to fetch the catalogue, then add images again.",
          variant: "destructive",
        });
        return;
      }
      const matches: FileMatch[] = imageFiles.map((file) => {
        const result = matchFileToProduct(file.name, products);
        return { file, type: result.type, product: result.product };
      });
      setFiles((prev) => [...prev, ...matches]);
    },
    [products, toast]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []);
      e.target.value = "";
      addFiles(selected);
    },
    [addFiles]
  );

  const [isDragging, setIsDragging] = useState(false);
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files ?? []);
      addFiles(dropped);
    },
    [addFiles]
  );

  const clearFiles = useCallback(() => {
    setFiles([]);
    setUploadItems([]);
    setUploading(false);
    setUploadProgress(0);
  }, []);

  const startUpload = useCallback(async () => {
    const toUpload = files.filter((f) => f.type !== "none" && f.product);
    if (!toUpload.length) {
      toast({ title: "No files to upload", description: "Only matched files are uploaded.", variant: "destructive" });
      return;
    }
    const initialItems: FileUploadItem[] = toUpload.map((f) => ({ ...f, status: "pending" as UploadStatus }));
    setUploadItems(initialItems);
    setUploading(true);
    setUploadProgress(0);

    const total = toUpload.length;
    let completed = 0;
    const doneCount = { current: 0 };
    const failCount = { current: 0 };
    const updateProgress = () => {
      completed += 1;
      setUploadProgress(Math.round((completed / total) * 100));
    };

    let nextIndex = 0;
    const getNextIdx = (): number | null => {
      const i = nextIndex;
      nextIndex += 1;
      return i < total ? i : null;
    };
    const runNext = async (): Promise<void> => {
      const idx = getNextIdx();
      if (idx === null) return;
      const item = toUpload[idx];
      const setStatus = (status: UploadStatus, error?: string) => {
        setUploadItems((prev) =>
          prev.map((p, i) => (i === idx ? { ...p, status, error } : p))
        );
      };
      setStatus("uploading");
      const path = `product-images/${item.product!.code}.${getExtension(item.file.name)}`;
      try {
        const { error } = await supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .upload(path, item.file, { upsert: true });
        if (error) throw error;
        setStatus("done");
        doneCount.current += 1;
      } catch (err: any) {
        setStatus("error", err?.message ?? "Upload failed");
        failCount.current += 1;
      }
      updateProgress();
      return runNext();
    };

    const workers = Array.from({ length: Math.min(UPLOAD_CONCURRENCY, total) }, () =>
      runNext()
    );
    await Promise.all(workers);

    setUploading(false);
    toast({
      title: "Upload complete",
      description: `${doneCount.current} uploaded${failCount.current ? `, ${failCount.current} failed` : ""}.`,
    });
  }, [files, toast]);

  const stats = {
    exact: files.filter((f) => f.type === "exact").length,
    sku_in_title: files.filter((f) => f.type === "sku_in_title").length,
    description: files.filter((f) => f.type === "description").length,
    none: files.filter((f) => f.type === "none").length,
  };
  const matchedCount = stats.exact + stats.sku_in_title + stats.description;

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Bulk product image upload</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Load the product catalogue, then select image files. Files are matched to products by exact code, code in
          filename, or description. Matched images upload to storage as <code className="text-xs bg-muted px-1 rounded">product-images/&#123;code&#125;.ext</code>.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={loadProducts}
          disabled={productsLoading}
          className="gap-2"
        >
          {productsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Load products ({products.length})
        </Button>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFileSelect}
            disabled={!products.length}
          />
          <Button type="button" variant="outline" className="gap-2" asChild>
            <span>
              <Upload className="w-4 h-4" />
              Select images
            </span>
          </Button>
        </label>
        {files.length > 0 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFiles}
              disabled={uploading}
            >
              Clear list
            </Button>
            {matchedCount > 0 && (
              <Button
                onClick={startUpload}
                disabled={uploading}
                className="gap-2"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload {matchedCount} matched
              </Button>
            )}
          </>
        )}
      </div>

      {files.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Exact match</p>
              <p className="text-xl font-semibold text-foreground">{stats.exact}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">SKU in title</p>
              <p className="text-xl font-semibold text-foreground">{stats.sku_in_title}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Description match</p>
              <p className="text-xl font-semibold text-foreground">{stats.description}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">No match</p>
              <p className="text-xl font-semibold text-destructive">{stats.none}</p>
            </div>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Uploading…</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <ScrollArea className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Preview</TableHead>
                  <TableHead>File name</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead>Product</TableHead>
                  {uploading || uploadItems.length > 0 ? (
                    <TableHead className="w-24">Status</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(uploadItems.length ? uploadItems : files).map((row, i) => (
                  <TableRow key={`${row.file.name}-${i}`}>
                    <TableCell className="py-1.5">
                      <FilePreviewThumb file={row.file} />
                    </TableCell>
                    <TableCell className="font-mono text-sm max-w-[200px] truncate" title={row.file.name}>
                      {row.file.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={MATCH_BADGE_VARIANTS[row.type]}>
                        {MATCH_LABELS[row.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[240px]">
                      {row.product ? (
                        <>
                          <span className="font-medium text-foreground">{row.product.code}</span>
                          {row.product.description && (
                            <span className="block truncate" title={row.product.description}>
                              {row.product.description}
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    {"status" in row && (row as FileUploadItem).status ? (
                      <TableCell>
                        {(row as FileUploadItem).status === "uploading" && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                        {(row as FileUploadItem).status === "done" && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                        {(row as FileUploadItem).status === "error" && (
                          <XCircle className="w-4 h-4 text-destructive" title={(row as FileUploadItem).error} />
                        )}
                        {(row as FileUploadItem).status === "pending" && (
                          <span className="text-xs text-muted-foreground">Pending</span>
                        )}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </>
      )}

      {!files.length && products.length > 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
          <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Select images to match and upload</p>
        </div>
      )}

      {!products.length && !productsLoading && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
          <RefreshCw className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Click &quot;Load products&quot; to fetch the catalogue first</p>
        </div>
      )}
    </div>
  );
}
