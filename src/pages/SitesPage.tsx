import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useSites, useCreateSite, useDeleteSite } from "@/hooks/useSites";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Plus, ChevronRight, MapPin, Building, MoreHorizontal, Tent, DoorOpen,
} from "lucide-react";

const SitesPage = () => {
  const navigate = useNavigate();
  const { tenantId } = useAuth();
  const { data: sites = [], isLoading } = useSites();
  const createSite = useCreateSite();
  const deleteSite = useDeleteSite();

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", address: "", description: "" });

  const filtered = sites.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.location?.toLowerCase().includes(q);
  });

  const handleCreate = () => {
    if (!form.name.trim() || !tenantId) return;
    createSite.mutate(
      { name: form.name.trim(), location: form.location || undefined, address: form.address || undefined, description: form.description || undefined, tenant_id: tenantId },
      { onSuccess: () => { setShowCreate(false); setForm({ name: "", location: "", address: "", description: "" }); } }
    );
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col min-h-0">
          {/* Banner */}
          <div className="border-b border-border bg-card px-6 py-5 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Dashboard</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">Sites</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">Sites</h1>
                {!isLoading && <Badge variant="secondary" className="text-sm font-medium">{sites.length}</Badge>}
              </div>
              <Button className="gap-2" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" />New Site
              </Button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3 shrink-0">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search sites..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Blocks / Villages</TableHead>
                    <TableHead>Rooms / Tents</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        {search ? "No sites match your search." : "No sites yet. Create your first site to get started."}
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((site) => (
                    <TableRow key={site.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/sites/${site.id}`)}>
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Tent className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <span>{site.name}</span>
                            {site.description && <p className="text-xs text-muted-foreground line-clamp-1">{site.description}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {site.location ? (
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{site.location}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-muted-foreground"><Building className="w-3.5 h-3.5" />{site.block_count}</span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-muted-foreground"><DoorOpen className="w-3.5 h-3.5" />{site.room_count}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/sites/${site.id}`)}>Manage</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteSite.mutate(site.id)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 bg-card border-t border-border px-6 py-2.5 flex items-center">
            <span className="text-xs text-muted-foreground">
              Showing {filtered.length} of {sites.length} site{sites.length !== 1 ? "s" : ""}
            </span>
          </div>
        </main>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Site</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Site Name *</Label>
              <Input placeholder="e.g. Bushey Camp" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input placeholder="e.g. Bushey, Hertfordshire" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input placeholder="Full address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Notes about this site..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name.trim() || createSite.isPending}>
              {createSite.isPending ? "Creating..." : "Create Site"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SitesPage;
