import { useState } from "react";
import { useRoles, usePermissions, useRolePermissions, useCreateRole, useDeleteRole, useToggleRolePermission } from "@/hooks/useRbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Shield, Loader2 } from "lucide-react";

const RolesTab = () => {
  const { data: roles, isLoading } = useRoles();
  const { data: permissions } = usePermissions();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const selectedRole = roles?.find((r) => r.id === selectedRoleId);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createRole.mutate({ name: newName, description: newDesc }, {
      onSuccess: () => { setShowCreate(false); setNewName(""); setNewDesc(""); },
    });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
      {/* Roles List */}
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Roles</CardTitle>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" /> New</Button>
        </CardHeader>
        <CardContent className="space-y-1 p-3 pt-0">
          {(roles ?? []).map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRoleId(role.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors ${
                selectedRoleId === role.id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{role.name}</span>
              </div>
              {role.is_system_role && <Badge variant="secondary" className="text-[10px]">System</Badge>}
            </button>
          ))}
          {!roles?.length && <p className="text-sm text-muted-foreground text-center py-6">No roles defined</p>}
        </CardContent>
      </Card>

      {/* Role Detail / Permission Matrix */}
      <Card className="lg:col-span-2">
        {selectedRole ? (
          <RolePermissionMatrix role={selectedRole} permissions={permissions ?? []} onDelete={() => {
            deleteRole.mutate({ roleId: selectedRole.id, roleName: selectedRole.name });
            setSelectedRoleId(null);
          }} />
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Select a role to view and manage permissions
          </div>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription>Define a new role for your organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Role name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || createRole.isPending}>
              {createRole.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function RolePermissionMatrix({
  role,
  permissions,
  onDelete,
}: {
  role: { id: string; name: string; description: string | null; is_system_role: boolean };
  permissions: { id: string; name: string; description: string | null; category: string | null }[];
  onDelete: () => void;
}) {
  const { data: grantedIds, isLoading } = useRolePermissions(role.id);
  const toggle = useToggleRolePermission();

  const grouped = permissions.reduce<Record<string, typeof permissions>>((acc, p) => {
    const cat = p.category || "General";
    (acc[cat] ??= []).push(p);
    return acc;
  }, {});

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">{role.name}</CardTitle>
          {role.description && <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>}
        </div>
        {!role.is_system_role && (
          <Button variant="destructive" size="sm" onClick={onDelete}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : !permissions.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No permissions defined yet. Create permissions first.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-20 text-center">Granted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(grouped).map(([cat, perms]) =>
                perms.map((perm, i) => (
                  <TableRow key={perm.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{perm.name}</p>
                        {perm.description && <p className="text-xs text-muted-foreground">{perm.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{i === 0 && <Badge variant="outline" className="text-[10px]">{cat}</Badge>}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={(grantedIds ?? []).includes(perm.id)}
                        disabled={toggle.isPending}
                        onCheckedChange={(checked) =>
                          toggle.mutate({
                            roleId: role.id,
                            roleName: role.name,
                            permissionId: perm.id,
                            permissionName: perm.name,
                            grant: !!checked,
                          })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </>
  );
}

export default RolesTab;
