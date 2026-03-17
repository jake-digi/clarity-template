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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Upload,
  ImageIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  FileImage,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { matchFileToProduct, type MatchType, type ProductRecord } from "@/lib/productImageMatch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PRODUCT_IMAGE_BUCKET = "freemans-storage-bucket";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/bmp"];
function isAcceptedImage(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type) || (file.type.startsWith("image/") && file.type !== "image/gif");
}

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

type UploadStatus = "pending" | "uploading" | "done" | "error" | "skipped";

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

function productHasImage(p: ProductRecord | null): boolean {
  if (!p) return false;
  const url = (p as { imageUrl?: string | null }).imageUrl ?? (p as { image_url?: string | null }).image_url;
  return !!(url && String(url).trim());
}

export default function AdminProductImagesTab() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [files, setFiles] = useState<FileMatch[]>([]);
  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [skipOverwrite, setSkipOverwrite] = useState(false);

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
      const imageFiles = selected.filter(isAcceptedImage);
      const rejected = selected.filter((f) => f.type.startsWith("image/") && !isAcceptedImage(f));
      if (rejected.length > 0) {
        toast({ title: "GIFs not accepted", description: `${rejected.length} GIF file(s) were skipped. Only JPEG, PNG, WebP, etc. are accepted.`, variant: "destructive" });
      }
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

  const removeFile = useCallback((index: number, row: FileMatch | FileUploadItem) => {
    const key = `${row.file.name}-${row.file.size}`;
    setFiles((prev) => {
      const i = prev.findIndex((f) => `${f.file.name}-${f.file.size}` === key);
      return i === -1 ? prev : prev.filter((_, j) => j !== i);
    });
    setUploadItems((prev) => {
      const i = prev.findIndex((f) => `${f.file.name}-${f.file.size}` === key);
      return i === -1 ? prev : prev.filter((_, j) => j !== i);
    });
  }, []);

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
    const willSkip = (i: FileMatch) => skipOverwrite && productHasImage(i.product);
    let completed = 0;
    const doneCount = { current: 0 };
    const failCount = { current: 0 };
    const skippedCount = { current: 0 };
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
      if (willSkip(item)) {
        setStatus("skipped");
        skippedCount.current += 1;
        updateProgress();
        return runNext();
      }
      setStatus("uploading");
      const path = `product-images/${item.product!.code}.${getExtension(item.file.name)}`;
      try {
        const { error: uploadError } = await supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .upload(path, item.file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data, error: fnError } = await supabase.functions.invoke("update-product-image", {
          body: { code: item.product!.code, image_url: path },
        });
        if (fnError) throw new Error(fnError.message);
        if (data?.error) throw new Error(data.altError ?? data.error);

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
    const parts = [`${doneCount.current} uploaded`];
    if (failCount.current) parts.push(`${failCount.current} failed`);
    if (skippedCount.current) parts.push(`${skippedCount.current} skipped`);
    toast({
      title: "Upload complete",
      description: parts.join(", ") + ".",
    });
  }, [files, toast, skipOverwrite]);

  const stats = {
    exact: files.filter((f) => f.type === "exact").length,
    sku_in_title: files.filter((f) => f.type === "sku_in_title").length,
    description: files.filter((f) => f.type === "description").length,
    none: files.filter((f) => f.type === "none").length,
  };
  const matchedCount = stats.exact + stats.sku_in_title + stats.description;
  const matchedFiles = files.filter((f) => f.type !== "none" && f.product);
  const skipCount = skipOverwrite ? matchedFiles.filter((f) => productHasImage(f.product)).length : 0;
  const uploadCount = skipOverwrite ? matchedCount - skipCount : matchedCount;

  return (
    <div
      className="relative flex flex-col flex-1 min-h-0"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center border-2 border-dashed border-primary bg-primary/5">
          <div className="rounded-lg bg-card px-6 py-4 shadow-lg border border-border">
            <p className="text-sm font-medium text-foreground">Drop images here</p>
            <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP, etc. (no GIFs)</p>
          </div>
        </div>
      )}

      {/* Header - same style as Administration / Catalogue */}
      <div className="border-b border-border bg-card px-6 py-5 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Bulk product image upload
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Load the product catalogue, then select image files (JPEG, PNG, WebP, etc.; GIFs not accepted). Files are matched by exact code, code as a whole word in filename, or description. Matched images upload to storage as <code className="text-xs bg-muted px-1 rounded">product-images/&#123;code&#125;.ext</code>. Remove unwanted rows before uploading; duplicates and overwrites are flagged.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
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
                accept="image/jpeg,image/png,image/webp,image/svg+xml,image/bmp"
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
                <div className="flex items-center gap-2">
                  <Switch
                    id="skip-overwrite"
                    checked={skipOverwrite}
                    onCheckedChange={setSkipOverwrite}
                    disabled={uploading}
                  />
                  <Label htmlFor="skip-overwrite" className="text-sm font-normal cursor-pointer">
                    Don&apos;t overwrite existing images
                  </Label>
                </div>
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
                    disabled={uploading || uploadCount === 0}
                    className="gap-2"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload {uploadCount} matched
                    {skipOverwrite && skipCount > 0 && (
                      <span className="text-muted-foreground font-normal"> ({skipCount} skipped)</span>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {files.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Exact match</p>
                <p className="text-xl font-semibold text-foreground">{stats.exact}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">SKU in title</p>
                <p className="text-xl font-semibold text-foreground">{stats.sku_in_title}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Description match</p>
                <p className="text-xl font-semibold text-foreground">{stats.description}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">No match</p>
                <p className="text-xl font-semibold text-destructive">{stats.none}</p>
              </div>
            </div>

            {uploading && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Uploading…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Table area - full width like Catalogue / Customers */}
      <div className="flex-1 overflow-auto min-h-0">
        {files.length > 0 ? (
          <div className="bg-card overflow-hidden">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-12">Preview</TableHead>
                  <TableHead>File name</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead className="font-medium">SKU</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-32">Issues</TableHead>
                  {uploading || uploadItems.length > 0 ? (
                    <TableHead className="w-24">Status</TableHead>
                  ) : null}
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(uploadItems.length ? uploadItems : files).map((row, i) => {
                  const list = uploadItems.length ? uploadItems : files;
                  const duplicateFilename = list.filter((r, j) => j !== i && r.file.name === row.file.name).length > 0;
                  const duplicateProduct = row.product && list.filter((r, j) => j !== i && r.product?.code === row.product?.code).length > 0;
                  return (
                    <TableRow key={`${row.file.name}-${row.file.size}-${i}`}>
                      <TableCell className="py-1.5 w-12">
                        <FilePreviewThumb file={row.file} />
                      </TableCell>
                      <TableCell className="font-mono text-sm align-top py-2 break-all whitespace-normal min-w-0">
                        {row.file.name}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant={MATCH_BADGE_VARIANTS[row.type]}>
                          {MATCH_LABELS[row.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium text-foreground py-2">
                        {row.product?.code ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-2 max-w-[240px] truncate" title={row.product?.description ?? ""}>
                        {row.product?.description ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs py-2">
                        {duplicateFilename && (
                          <span className="flex items-center gap-1 text-amber-600" title="Same filename appears multiple times">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Duplicate file
                          </span>
                        )}
                        {duplicateProduct && (
                          <span className="flex items-center gap-1 text-amber-600" title="Multiple files match this product; last upload wins">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Will overwrite
                          </span>
                        )}
                        {!duplicateFilename && !duplicateProduct && "—"}
                      </TableCell>
                      {"status" in row && (row as FileUploadItem).status ? (
                        <TableCell className="py-2">
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
                        {(row as FileUploadItem).status === "skipped" && (
                          <span className="text-xs text-muted-foreground">Skipped</span>
                        )}
                        </TableCell>
                      ) : null}
                      <TableCell className="py-1.5 w-12">
                        {!uploading && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFile(i, row)}
                            title="Remove from list"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : products.length > 0 ? (
          <div className="p-8 flex flex-col items-center justify-center border border-dashed border-border rounded-lg m-6 bg-muted/30">
            <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Drag and drop images here, or click &quot;Select images&quot;</p>
          </div>
        ) : !productsLoading ? (
          <div className="p-8 flex flex-col items-center justify-center border border-dashed border-border rounded-lg m-6 bg-muted/30">
            <RefreshCw className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click &quot;Load products&quot; to fetch the catalogue first</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
