import { useState } from "react";
import { useUserRoleAssignments, useRoles, useAssignRoleToUser, useRevokeRoleFromUser } from "@/hooks/useRbac";
import { useUsers } from "@/hooks/useUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Search, X } from "lucide-react";

const UserAssignmentsTab = () => {
  const { data: assignments, isLoading } = useUserRoleAssignments();
  const { data: roles } = useRoles();
  const { data: users } = useUsers();
  const assignRole = useAssignRoleToUser();
  const revokeRole = useRevokeRoleFromUser();

  const [showAssign, setShowAssign] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [search, setSearch] = useState("");

  const filtered = (assignments ?? []).filter(
    (a) =>
      a.user_name.toLowerCase().includes(search.toLowerCase()) ||
      a.role_name.toLowerCase().includes(search.toLowerCase()) ||
      a.user_email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = () => {
    if (!selectedUserId || !selectedRoleId) return;
    const user = users?.find((u) => u.id === selectedUserId);
    const role = roles?.find((r) => r.id === selectedRoleId);
    assignRole.mutate(
      {
        userId: selectedUserId,
        userName: user ? `${user.first_name} ${user.last_name ?? ""}`.trim() : selectedUserId,
        roleId: selectedRoleId,
        roleName: role?.name ?? selectedRoleId,
      },
      { onSuccess: () => { setShowAssign(false); setSelectedUserId(""); setSelectedRoleId(""); } }
    );
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">User Role Assignments</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8 h-9 w-56" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button size="sm" onClick={() => setShowAssign(true)}><Plus className="w-4 h-4 mr-1" /> Assign</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned At</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.user_name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{a.user_email}</TableCell>
                <TableCell><Badge variant="secondary">{a.role_name}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(a.assigned_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => revokeRole.mutate({ assignmentId: a.id, userName: a.user_name, roleName: a.role_name })}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No assignments found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>Select a user and the role to assign</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>
                {(users ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.first_name} {u.last_name ?? ""} — {u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {(roles ?? []).map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedUserId || !selectedRoleId || assignRole.isPending}>
              {assignRole.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UserAssignmentsTab;
