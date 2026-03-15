import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Shield, Bell } from "lucide-react";
import { useFormalWarnings } from "@/hooks/useFormalWarnings";
import { cn } from "@/lib/utils";

const warningLevelLabel: Record<number, { label: string; class: string }> = {
  1: { label: "1st Warning", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  2: { label: "2nd Warning", class: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  3: { label: "Final Warning", class: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
};

interface FormalWarningsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FormalWarningsSheet({ open, onOpenChange }: FormalWarningsSheetProps) {
  const { data: warnings, isLoading } = useFormalWarnings();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-3xl w-full overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Formal Warnings
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {warnings?.length ?? 0} warning{(warnings?.length ?? 0) !== 1 ? "s" : ""} issued across all instances
          </p>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !warnings?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Shield className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-medium">No formal warnings</p>
            <p className="text-sm mt-1">No formal warnings have been issued yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {warnings.map((w) => {
              const level = warningLevelLabel[w.warning_level] ?? warningLevelLabel[1];
              return (
                <div key={w.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{w.participant_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{w.reason}</p>
                    </div>
                    <span className={cn("shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", level.class)}>
                      {level.label}
                    </span>
                  </div>

                  {/* Details */}
                  {w.details && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{w.details}</p>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span>Issued by <span className="font-medium text-foreground">{w.issued_by_name ?? "Unknown"}</span></span>
                    <span>{new Date(w.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={w.parent_notified ? "default" : "outline"}
                      className="text-[10px] gap-1"
                    >
                      <Bell className="w-2.5 h-2.5" />
                      {w.parent_notified
                        ? `Parent notified ${w.parent_notification_date ? new Date(w.parent_notification_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}`
                        : "Parent not notified"}
                    </Badge>
                    <Badge
                      variant={w.acknowledged_by_participant ? "default" : "outline"}
                      className="text-[10px] gap-1"
                    >
                      {w.acknowledged_by_participant
                        ? <><CheckCircle2 className="w-2.5 h-2.5" /> Acknowledged</>
                        : <><XCircle className="w-2.5 h-2.5" /> Not acknowledged</>}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
