import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useTenantId } from "@/hooks/useTenantId";
import {
  useSiteDetail, useUpdateSite,
  useCreateBlock, useUpdateBlock, useDeleteBlock,
  useCreateRoom, useUpdateRoom, useDeleteRoom,
  useUpdateBlockPolygon,
  SiteBlock, SiteRoom,
} from "@/hooks/useSites";
import SiteMapEditor, { GeoBounds, GeoPolygon, MapMode } from "@/components/site/SiteMapEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronRight, ChevronDown, ArrowLeft, MapPin, Building, DoorOpen,
  Plus, MoreHorizontal, Pencil, Trash2, Tent,
} from "lucide-react";

// ── Block Card ───────────────────────────────────────────
const BlockCard = ({ block, siteId, tenantId }: { block: SiteBlock; siteId: string; tenantId: string }) => {
  const [open, setOpen] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showEditBlock, setShowEditBlock] = useState(false);
  const [editRoom, setEditRoom] = useState<SiteRoom | null>(null);
  const [roomForm, setRoomForm] = useState({ room_number: "", name: "", capacity: "" });
  const [blockForm, setBlockForm] = useState({ name: block.name, description: block.description ?? "" });

  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const updateBlock = useUpdateBlock();
  const deleteBlock = useDeleteBlock();

  const handleAddRoom = () => {
    if (!roomForm.room_number.trim()) return;
    createRoom.mutate({
      id: crypto.randomUUID(),
      block_id: block.id,
      room_number: roomForm.room_number.trim(),
      name: roomForm.name || undefined,
      capacity: roomForm.capacity ? Number(roomForm.capacity) : undefined,
      site_id: siteId,
      tenant_id: tenantId,
    }, {
      onSuccess: () => { setShowAddRoom(false); setRoomForm({ room_number: "", name: "", capacity: "" }); },
    });
  };

  const handleEditRoom = () => {
    if (!editRoom || !roomForm.room_number.trim()) return;
    updateRoom.mutate({
      id: editRoom.id,
      room_number: roomForm.room_number.trim(),
      name: roomForm.name || undefined,
      capacity: roomForm.capacity ? Number(roomForm.capacity) : undefined,
    }, {
      onSuccess: () => { setEditRoom(null); setRoomForm({ room_number: "", name: "", capacity: "" }); },
    });
  };

  const handleEditBlock = () => {
    if (!blockForm.name.trim()) return;
    updateBlock.mutate({ id: block.id, name: blockForm.name.trim(), description: blockForm.description || undefined }, {
      onSuccess: () => setShowEditBlock(false),
    });
  };

  const hasPolygon = !!block.geo_polygon?.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
              <Building className="w-4 h-4 text-primary" />
              <div>
                <span className="font-medium text-foreground">{block.name}</span>
                {block.description && <p className="text-xs text-muted-foreground">{block.description}</p>}
              </div>
              <Badge variant="secondary" className="text-xs">{block.rooms.length} room{block.rooms.length !== 1 ? "s" : ""}</Badge>
              {hasPolygon && <Badge variant="outline" className="text-xs text-primary border-primary/30">📍 Mapped</Badge>}
            </div>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setShowAddRoom(true)}>
                <Plus className="w-3 h-3" />Room
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setBlockForm({ name: block.name, description: block.description ?? "" }); setShowEditBlock(true); }}>
                    <Pencil className="w-3.5 h-3.5 mr-2" />Edit Block
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => deleteBlock.mutate(block.id)}>
                    <Trash2 className="w-3.5 h-3.5 mr-2" />Delete Block
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {block.rooms.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground border-t border-border">
              No rooms yet. Add your first room to this block.
            </div>
          ) : (
            <div className="border-t border-border">
              <div className="grid grid-cols-[1fr_1fr_80px_40px] gap-0 text-xs font-medium text-muted-foreground px-4 py-2 bg-muted/30 border-b border-border">
                <span>Number</span><span>Name</span><span>Capacity</span><span />
              </div>
              {block.rooms.map((room) => (
                <div key={room.id} className="grid grid-cols-[1fr_1fr_80px_40px] gap-0 items-center px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <DoorOpen className="w-3.5 h-3.5 text-muted-foreground" />{room.room_number}
                  </span>
                  <span className="text-sm text-muted-foreground">{room.name || "—"}</span>
                  <span className="text-sm text-muted-foreground">{room.capacity ?? "—"}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditRoom(room);
                        setRoomForm({ room_number: room.room_number, name: room.name ?? "", capacity: room.capacity?.toString() ?? "" });
                      }}>
                        <Pencil className="w-3.5 h-3.5 mr-2" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteRoom.mutate(room.id)}>
                        <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </div>

      {/* Add Room Dialog */}
      <Dialog open={showAddRoom} onOpenChange={setShowAddRoom}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Room to {block.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Room Number *</Label><Input placeholder="e.g. 101" value={roomForm.room_number} onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Name</Label><Input placeholder="e.g. Eagle Room" value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" placeholder="e.g. 4" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRoom(false)}>Cancel</Button>
            <Button onClick={handleAddRoom} disabled={!roomForm.room_number.trim() || createRoom.isPending}>{createRoom.isPending ? "Adding..." : "Add Room"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={!!editRoom} onOpenChange={(v) => { if (!v) setEditRoom(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Room</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Room Number *</Label><Input value={roomForm.room_number} onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Name</Label><Input value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoom(null)}>Cancel</Button>
            <Button onClick={handleEditRoom} disabled={!roomForm.room_number.trim() || updateRoom.isPending}>{updateRoom.isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Block Dialog */}
      <Dialog open={showEditBlock} onOpenChange={setShowEditBlock}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Block</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={blockForm.name} onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={blockForm.description} onChange={(e) => setBlockForm({ ...blockForm, description: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditBlock(false)}>Cancel</Button>
            <Button onClick={handleEditBlock} disabled={!blockForm.name.trim() || updateBlock.isPending}>{updateBlock.isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
};

// ── Site Detail Page ─────────────────────────────────────
const SiteDetailPage = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { data: tenantId } = useTenantId();
  const { data, isLoading } = useSiteDetail(siteId ?? "");
  const updateSite = useUpdateSite();
  const createBlock = useCreateBlock();
  const updateBlockPolygon = useUpdateBlockPolygon();
  const createRoom = useCreateRoom();

  const [showAddBlock, setShowAddBlock] = useState(false);
  const [showEditSite, setShowEditSite] = useState(false);
  const [blockForm, setBlockForm] = useState({ name: "", description: "" });
  const [siteForm, setSiteForm] = useState({ name: "", location: "", address: "", description: "" });
  const [mapMode, setMapMode] = useState<MapMode>("view");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showAssignPolygon, setShowAssignPolygon] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<GeoPolygon | null>(null);
  const [assignBlockId, setAssignBlockId] = useState<string>("");
  // Room pin placement state
  const [showRoomPinDialog, setShowRoomPinDialog] = useState(false);
  const [pendingRoomPin, setPendingRoomPin] = useState<{ blockId: string; position: { lat: number; lng: number } } | null>(null);
  const [roomPinForm, setRoomPinForm] = useState({ room_number: "", name: "", capacity: "" });

  const site = data?.site;
  const blocks = data?.blocks ?? [];
  const geoBounds = (site as any)?.geo_bounds as GeoBounds | null;

  const totalRooms = blocks.reduce((sum, b) => sum + b.rooms.length, 0);
  const totalCapacity = blocks.reduce((sum, b) => sum + b.rooms.reduce((rs, r) => rs + (r.capacity ?? 0), 0), 0);

  const handleBlockPolygonDrawn = useCallback((polygon: GeoPolygon) => {
    setPendingPolygon(polygon);

    // If a block is explicitly selected, assign to it
    if (selectedBlockId) {
      updateBlockPolygon.mutate({ id: selectedBlockId, geo_polygon: polygon });
      setPendingPolygon(null);
      return;
    }

    const unmappedBlocks = blocks.filter((b) => !b.geo_polygon?.length);

    // If exactly one unmapped block, auto-assign
    if (unmappedBlocks.length === 1) {
      updateBlockPolygon.mutate({ id: unmappedBlocks[0].id, geo_polygon: polygon });
      setPendingPolygon(null);
      return;
    }

    // If there are unmapped blocks, show dialog defaulting to first unmapped
    if (unmappedBlocks.length > 1) {
      setAssignBlockId(unmappedBlocks[0].id);
      setTimeout(() => setShowAssignPolygon(true), 0);
      return;
    }

    // All blocks already have polygons — show dialog so user can pick which to reassign
    if (blocks.length > 0) {
      setAssignBlockId(blocks[0].id);
      setTimeout(() => setShowAssignPolygon(true), 0);
    }
  }, [blocks, selectedBlockId, updateBlockPolygon]);

  const handleAssignPolygon = () => {
    if (!pendingPolygon || !assignBlockId) return;
    updateBlockPolygon.mutate({ id: assignBlockId, geo_polygon: pendingPolygon });
    setPendingPolygon(null);
    setShowAssignPolygon(false);
  };

  const handleBoundsChange = useCallback((newBounds: GeoBounds | null) => {
    if (!siteId) return;
    updateSite.mutate({ id: siteId, geo_bounds: newBounds }, { onSuccess: () => {} });
  }, [siteId, updateSite]);

  const handleBlockPolygonChange = useCallback((blockId: string, polygon: GeoPolygon | null) => {
    updateBlockPolygon.mutate({ id: blockId, geo_polygon: polygon as any });
  }, [updateBlockPolygon]);

  const handleBlockClick = useCallback((block: SiteBlock) => {
    setSelectedBlockId((prev) => prev === block.id ? null : block.id);
  }, []);

  const handleRoomPinPlaced = useCallback((blockId: string, position: { lat: number; lng: number }) => {
    setPendingRoomPin({ blockId, position });
    setRoomPinForm({ room_number: "", name: "", capacity: "" });
    setTimeout(() => setShowRoomPinDialog(true), 0);
  }, []);

  const handleCreateRoomAtPin = () => {
    if (!pendingRoomPin || !roomPinForm.room_number.trim() || !siteId || !tenantId) return;
    createRoom.mutate({
      id: crypto.randomUUID(),
      block_id: pendingRoomPin.blockId,
      room_number: roomPinForm.room_number.trim(),
      name: roomPinForm.name || undefined,
      capacity: roomPinForm.capacity ? Number(roomPinForm.capacity) : undefined,
      site_id: siteId,
      tenant_id: tenantId,
      geo_position: pendingRoomPin.position,
    } as any, {
      onSuccess: () => {
        setShowRoomPinDialog(false);
        setPendingRoomPin(null);
        setRoomPinForm({ room_number: "", name: "", capacity: "" });
      },
    });
  };

  const handleAddBlock = () => {
    if (!blockForm.name.trim() || !tenantId || !siteId) return;
    createBlock.mutate({
      id: crypto.randomUUID(),
      name: blockForm.name.trim(),
      description: blockForm.description || undefined,
      site_id: siteId,
      tenant_id: tenantId,
    }, {
      onSuccess: () => { setShowAddBlock(false); setBlockForm({ name: "", description: "" }); },
    });
  };

  const handleEditSite = () => {
    if (!siteForm.name.trim() || !siteId) return;
    updateSite.mutate({
      id: siteId,
      name: siteForm.name.trim(),
      location: siteForm.location || undefined,
      address: siteForm.address || undefined,
      description: siteForm.description || undefined,
    }, {
      onSuccess: () => setShowEditSite(false),
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 overflow-auto p-6 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive font-medium">Site not found</p>
              <Button variant="outline" className="mt-3" onClick={() => navigate("/sites")}>Back to Sites</Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <div className="border-b border-border bg-card px-6 py-5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Dashboard</button>
              <ChevronRight className="w-3 h-3" />
              <button onClick={() => navigate("/sites")} className="hover:text-foreground transition-colors">Sites</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">{site.name}</span>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Tent className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground tracking-tight">{site.name}</h1>
                  <div className="flex items-center gap-4 mt-0.5 text-sm text-muted-foreground">
                    {site.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{site.location}</span>}
                    <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" />{blocks.length} block{blocks.length !== 1 ? "s" : ""}</span>
                    <span className="flex items-center gap-1"><DoorOpen className="w-3.5 h-3.5" />{totalRooms} room{totalRooms !== 1 ? "s" : ""}</span>
                    {totalCapacity > 0 && <span>Total capacity: {totalCapacity}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2" onClick={() => navigate("/sites")}>
                  <ArrowLeft className="w-4 h-4" />Back
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => {
                  setSiteForm({ name: site.name, location: site.location ?? "", address: site.address ?? "", description: site.description ?? "" });
                  setShowEditSite(true);
                }}>
                  <Pencil className="w-4 h-4" />Edit Site
                </Button>
                <Button className="gap-2" onClick={() => setShowAddBlock(true)}>
                  <Plus className="w-4 h-4" />Add Block
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {site.description && <p className="text-sm text-muted-foreground">{site.description}</p>}

            {/* Map */}
            <SiteMapEditor
              bounds={geoBounds}
              blocks={blocks}
              onBoundsChange={handleBoundsChange}
              onBlockPolygonChange={handleBlockPolygonChange}
              onBlockPolygonDrawn={handleBlockPolygonDrawn}
              onRoomPinPlaced={handleRoomPinPlaced}
              onBlockClick={handleBlockClick}
              selectedBlockId={selectedBlockId}
              mode={mapMode}
              onModeChange={setMapMode}
            />

            {/* Blocks list */}
            {blocks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
                <Building className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No blocks yet. Add blocks (buildings, villages) and their rooms/tents.</p>
                <Button variant="outline" className="gap-2" onClick={() => setShowAddBlock(true)}>
                  <Plus className="w-4 h-4" />Add First Block
                </Button>
              </div>
            ) : (
              blocks.map((block) => (
                <BlockCard key={block.id} block={block} siteId={siteId!} tenantId={tenantId!} />
              ))
            )}
          </div>
        </main>
      </div>

      {/* Add Block Dialog */}
      <Dialog open={showAddBlock} onOpenChange={setShowAddBlock}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Block</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Block Name *</Label><Input placeholder="e.g. Block A, North Village" value={blockForm.name} onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea placeholder="Optional description..." value={blockForm.description} onChange={(e) => setBlockForm({ ...blockForm, description: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBlock(false)}>Cancel</Button>
            <Button onClick={handleAddBlock} disabled={!blockForm.name.trim() || createBlock.isPending}>{createBlock.isPending ? "Adding..." : "Add Block"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Site Dialog */}
      <Dialog open={showEditSite} onOpenChange={setShowEditSite}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Site</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={siteForm.name} onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={siteForm.location} onChange={(e) => setSiteForm({ ...siteForm, location: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Address</Label><Input value={siteForm.address} onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={siteForm.description} onChange={(e) => setSiteForm({ ...siteForm, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditSite(false)}>Cancel</Button>
            <Button onClick={handleEditSite} disabled={!siteForm.name.trim() || updateSite.isPending}>{updateSite.isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Polygon to Block Dialog */}
      <Dialog open={showAssignPolygon} onOpenChange={setShowAssignPolygon}>
        <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader><DialogTitle>Assign Area to Block</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Select which block this drawn area belongs to:</p>
          <Select value={assignBlockId} onValueChange={setAssignBlockId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a block" />
            </SelectTrigger>
            <SelectContent>
              {blocks.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name} {b.geo_polygon?.length ? "(will replace existing)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAssignPolygon(false); setPendingPolygon(null); }}>Cancel</Button>
            <Button onClick={handleAssignPolygon} disabled={!assignBlockId || updateBlockPolygon.isPending}>
              {updateBlockPolygon.isPending ? "Saving..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Room at Pin Dialog */}
      <Dialog open={showRoomPinDialog} onOpenChange={setShowRoomPinDialog}>
        <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add Room at Pin</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Block: <strong>{blocks.find((b) => b.id === pendingRoomPin?.blockId)?.name ?? "—"}</strong>
          </p>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Room Number *</Label>
              <Input placeholder="e.g. 101" value={roomPinForm.room_number} onChange={(e) => setRoomPinForm({ ...roomPinForm, room_number: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="e.g. Eagle Room" value={roomPinForm.name} onChange={(e) => setRoomPinForm({ ...roomPinForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Capacity</Label>
              <Input type="number" placeholder="e.g. 4" value={roomPinForm.capacity} onChange={(e) => setRoomPinForm({ ...roomPinForm, capacity: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRoomPinDialog(false); setPendingRoomPin(null); }}>Cancel</Button>
            <Button onClick={handleCreateRoomAtPin} disabled={!roomPinForm.room_number.trim() || createRoom.isPending}>
              {createRoom.isPending ? "Creating..." : "Create Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SiteDetailPage;
