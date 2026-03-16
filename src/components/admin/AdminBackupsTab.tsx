import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Database,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardDrive,
  Info,
  ExternalLink,
  Key,
} from "lucide-react";
import { toast } from "sonner";

const EDGE_FN_URL = "https://avcqdbhnxzfkxxsqdvae.supabase.co/functions/v1/backup-manager";

interface Backup {
  id: number | string;
  inserted_at: string;
  status: string;
  isPhysicalBackup?: boolean;
  size?: number;
  type?: string;
}

function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === "completed" || s === "success") {
    return (
      <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 gap-1.5">
        <CheckCircle2 className="w-3 h-3" />
        Completed
      </Badge>
    );
  }
  if (s === "in_progress" || s === "running") {
    return (
      <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-500/10 gap-1.5">
        <Clock className="w-3 h-3" />
        In Progress
      </Badge>
    );
  }
  if (s === "failed" || s === "error") {
    return (
      <Badge variant="outline" className="border-red-500/40 text-red-600 bg-red-500/10 gap-1.5">
        <AlertTriangle className="w-3 h-3" />
        Failed
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="capitalize">{status ?? "Unknown"}</Badge>
  );
}

async function callBackupFn(path: string, method: "GET" | "POST", body?: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(`${EDGE_FN_URL}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

export default function AdminBackupsTab() {
  const qc = useQueryClient();
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["supabase-backups"],
    queryFn: () => callBackupFn("list", "GET"),
    retry: false,
  });

  const restore = useMutation({
    mutationFn: (backupId: number | string) =>
      callBackupFn("restore", "POST", { backup_id: backupId }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Restore initiated successfully. This may take several minutes.");
        qc.invalidateQueries({ queryKey: ["supabase-backups"] });
      } else {
        toast.error(res.error ?? "Restore failed");
      }
    },
    onError: () => toast.error("Failed to initiate restore"),
  });

  const setupRequired = data?.setup_required;
  const backups: Backup[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.data?.backups)
      ? data.data.backups
      : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Database Backups</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            View and restore your Supabase database backups
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://supabase.com/dashboard/project/avcqdbhnxzfkxxsqdvae/database/backups/scheduled"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Open in Supabase
            </a>
          </Button>
        </div>
      </div>

      {/* Setup required notice */}
      {setupRequired && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5 flex gap-4">
          <Key className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Management API key not configured</p>
            <p className="text-sm text-muted-foreground">
              To enable backup management, create a Supabase personal access token and set it as an edge function secret:
            </p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>
                Go to{" "}
                <a
                  href="https://supabase.com/dashboard/account/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-foreground hover:text-primary"
                >
                  supabase.com/dashboard/account/tokens
                </a>{" "}
                and create a new token
              </li>
              <li>
                Run in your terminal:{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                  supabase secrets set SUPABASE_MANAGEMENT_API_KEY=sbp_xxxx --project-ref avcqdbhnxzfkxxsqdvae
                </code>
              </li>
              <li>Redeploy the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">backup-manager</code> edge function</li>
            </ol>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !setupRequired && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-5 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Failed to load backups</p>
            <p className="text-sm text-muted-foreground mt-1">
              {(error as Error).message ?? "An unexpected error occurred"}
            </p>
          </div>
        </div>
      )}

      {/* API error (non-setup) */}
      {data && !data.success && !data.setup_required && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-5 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">API error</p>
            <p className="text-sm text-muted-foreground mt-1">{data.error}</p>
          </div>
        </div>
      )}

      {/* Info notice */}
      {!setupRequired && !error && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex gap-3 text-sm text-muted-foreground">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          <span>
            Restoring a backup will overwrite all current data. This action cannot be undone.
            Supabase retains daily backups for 7 days on the Pro plan and 30 days on Team/Enterprise.
          </span>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 rounded" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Backups table */}
      {!isLoading && !setupRequired && backups.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-medium">Date</TableHead>
                <TableHead className="font-medium">Type</TableHead>
                <TableHead className="font-medium">Size</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-sm">
                    {formatDate(b.inserted_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      {b.isPhysicalBackup ? (
                        <><HardDrive className="w-3.5 h-3.5" /> Physical</>
                      ) : (
                        <><Database className="w-3.5 h-3.5" /> {b.type ?? "Logical"}</>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatBytes(b.size)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRestoreTarget(b)}
                      disabled={
                        restore.isPending ||
                        (b.status?.toLowerCase() !== "completed" && b.status?.toLowerCase() !== "success")
                      }
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Restore
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty state (loaded, no backups) */}
      {!isLoading && !setupRequired && !error && data?.success && backups.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <Database className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No backups found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Backups are created automatically on the Pro plan and above.
          </p>
        </div>
      )}

      {/* Restore confirmation dialog */}
      <AlertDialog open={!!restoreTarget} onOpenChange={(o) => !o && setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Restore this backup?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to restore the backup from{" "}
                  <strong className="text-foreground">
                    {restoreTarget ? formatDate(restoreTarget.inserted_at) : ""}
                  </strong>.
                </p>
                <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600">
                  <strong>Warning:</strong> This will permanently overwrite all current database data.
                  Any changes made after this backup was taken will be lost. This action cannot be undone.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (restoreTarget) {
                  restore.mutate(restoreTarget.id);
                  setRestoreTarget(null);
                }
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Yes, restore backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
