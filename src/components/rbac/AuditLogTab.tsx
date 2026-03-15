import { useState } from "react";
import { useRbacAuditLogs } from "@/hooks/useRbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";

const actionColors: Record<string, string> = {
  created: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  deleted: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  granted_permission: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  revoked_permission: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  assigned_role: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  revoked_role: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const AuditLogTab = () => {
  const { data: logs, isLoading } = useRbacAuditLogs();
  const [search, setSearch] = useState("");

  const filtered = (logs ?? []).filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.entity_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (l.performed_by_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (l.target_user_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">RBAC Audit Log</CardTitle>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search logs..." className="pl-8 h-9 w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Target User</TableHead>
              <TableHead>Performed By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge className={`text-[10px] ${actionColors[log.action] ?? "bg-muted text-muted-foreground"}`}>
                    {log.action.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{log.entity_name ?? "—"}</p>
                    <p className="text-[10px] text-muted-foreground">{log.entity_type}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{log.target_user_name ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{log.performed_by_name ?? "—"}</TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No audit logs found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AuditLogTab;
