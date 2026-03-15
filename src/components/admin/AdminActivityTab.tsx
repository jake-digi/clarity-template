import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Activity, AlertTriangle, Info, CheckCircle2, Clock } from "lucide-react";
import { useTenantId } from "@/hooks/useTenantId";

const iconForAction = (action: string) => {
  if (action.includes("delete") || action.includes("remove")) return AlertTriangle;
  if (action.includes("create") || action.includes("grant")) return CheckCircle2;
  return Info;
};

const AdminActivityTab = () => {
  const tenantId = useTenantId();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["rbac-audit-logs", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rbac_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Activity className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No activity logs recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px]">Timestamp</TableHead>
            <TableHead className="w-[140px]">Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead className="w-[160px]">Performed By</TableHead>
            <TableHead className="w-[160px]">Target</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const Icon = iconForAction(log.action);
            return (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(log.created_at).toLocaleString("en-GB", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Icon className="w-3 h-3" />{log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  <span className="text-muted-foreground text-xs">{log.entity_type}: </span>
                  {log.entity_name ?? log.entity_id.slice(0, 8)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{log.performed_by_name ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{log.target_user_name ?? "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminActivityTab;
