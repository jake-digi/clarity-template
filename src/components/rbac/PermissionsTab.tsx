import { useState } from "react";
import { usePermissions, useCreatePermission } from "@/hooks/useRbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Search } from "lucide-react";

const PermissionsTab = () => {
  const { data: permissions, isLoading } = usePermissions();
  const createPermission = useCreatePermission();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [search, setSearch] = useState("");

  const filtered = (permissions ?? []).filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!newName.trim()) return;
    createPermission.mutate({ name: newName, description: newDesc, category: newCategory }, {
      onSuccess: () => { setShowCreate(false); setNewName(""); setNewDesc(""); setNewCategory(""); },
    });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Permissions Registry</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8 h-9 w-56" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" /> New</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((perm) => (
              <TableRow key={perm.id}>
                <TableCell className="font-medium">{perm.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{perm.description ?? "—"}</TableCell>
                <TableCell>
                  {perm.category ? <Badge variant="outline" className="text-[10px]">{perm.category}</Badge> : "—"}
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No permissions found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Permission</DialogTitle>
            <DialogDescription>Define a granular permission for your system</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Permission name (e.g. instances.create)" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            <Input placeholder="Category (e.g. Instances, Users)" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || createPermission.isPending}>
              {createPermission.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PermissionsTab;
