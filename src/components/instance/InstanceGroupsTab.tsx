import { useState, useMemo } from "react";
import ParticipantDrawer from "@/components/ParticipantDrawer";
import {
  useSupergroups, useSubgroups, useSubgroupParticipants,
  useCreateSupergroup, useUpdateSupergroup, useDeleteSupergroup,
  useCreateSubgroup, useUpdateSubgroup, useDeleteSubgroup,
  useAssignParticipantToSubgroup,
  Supergroup, Subgroup,
} from "@/hooks/useGroups";
import { useTenantId } from "@/hooks/useTenantId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard, EmptyState } from "@/components/participant/ProfileShared";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FolderTree, Plus, Pencil, Trash2, Users, ChevronDown, ChevronRight,
  UserPlus, UserMinus, Search,
} from "lucide-react";

interface Props {
  instanceId: string;
}

const InstanceGroupsTab = ({ instanceId }: Props) => {
  const { data: tenantId } = useTenantId();
  const { data: supergroups = [], isLoading: sgLoading } = useSupergroups(instanceId);
  const { data: subgroups = [], isLoading: subLoading } = useSubgroups(instanceId);
  const { data: participantData, isLoading: pLoading } = useSubgroupParticipants(instanceId);

  const createSg = useCreateSupergroup();
  const updateSg = useUpdateSupergroup();
  const deleteSg = useDeleteSupergroup();
  const createSub = useCreateSubgroup();
  const updateSub = useUpdateSubgroup();
  const deleteSub = useDeleteSubgroup();
  const assignParticipant = useAssignParticipantToSubgroup();

  // UI state
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sgDialog, setSgDialog] = useState<{ open: boolean; editing: Supergroup | null }>({ open: false, editing: null });
  const [subDialog, setSubDialog] = useState<{ open: boolean; editing: Subgroup | null; parentId: string }>({ open: false, editing: null, parentId: "" });
  const [deleteTarget, setDeleteTarget] = useState<{ type: "supergroup" | "subgroup"; id: string; name: string } | null>(null);
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; subgroupId: string; supergroupId: string } | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [drawerParticipantId, setDrawerParticipantId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState("");
  const [formPurpose, setFormPurpose] = useState("");

  const assignments = participantData?.assignments ?? [];
  const participantMap = participantData?.participantMap ?? new Map();

  const participantsInSubgroup = useMemo(() => {
    const map = new Map<string, typeof assignments>();
    assignments.forEach((a) => {
      const key = a.sub_group_id ?? "__unassigned__";
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    });
    return map;
  }, [assignments]);

  const unassignedParticipants = useMemo(() => {
    return assignments.filter((a) => !a.sub_group_id);
  }, [assignments]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openSgDialog = (editing: Supergroup | null = null) => {
    setFormName(editing?.name ?? "");
    setFormDesc(editing?.description ?? "");
    setFormType(editing?.type ?? "");
    setFormPurpose(editing?.purpose ?? "");
    setSgDialog({ open: true, editing });
  };

  const openSubDialog = (parentId: string, editing: Subgroup | null = null) => {
    setFormName(editing?.name ?? "");
    setFormDesc(editing?.description ?? "");
    setFormType(editing?.type ?? "");
    setFormPurpose(editing?.purpose ?? "");
    setSubDialog({ open: true, editing, parentId });
  };

  const saveSupergroup = () => {
    if (!formName.trim() || !tenantId) return;
    if (sgDialog.editing) {
      updateSg.mutate({ id: sgDialog.editing.id, instance_id: instanceId, name: formName, description: formDesc || undefined, type: formType || undefined, purpose: formPurpose || undefined });
    } else {
      createSg.mutate({ name: formName, description: formDesc || undefined, type: formType || undefined, purpose: formPurpose || undefined, instance_id: instanceId, tenant_id: tenantId });
    }
    setSgDialog({ open: false, editing: null });
  };

  const saveSubgroup = () => {
    if (!formName.trim() || !tenantId) return;
    if (subDialog.editing) {
      updateSub.mutate({ id: subDialog.editing.id, instance_id: instanceId, name: formName, description: formDesc || undefined, type: formType || undefined, purpose: formPurpose || undefined, parent_supergroup_id: subDialog.parentId });
    } else {
      createSub.mutate({ name: formName, description: formDesc || undefined, type: formType || undefined, purpose: formPurpose || undefined, parent_supergroup_id: subDialog.parentId, instance_id: instanceId, tenant_id: tenantId });
    }
    setSubDialog({ open: false, editing: null, parentId: "" });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "supergroup") {
      deleteSg.mutate({ id: deleteTarget.id, instance_id: instanceId });
    } else {
      deleteSub.mutate({ id: deleteTarget.id, instance_id: instanceId });
    }
    setDeleteTarget(null);
  };

  const handleAssign = (assignmentId: string, subGroupId: string | null, superGroupId: string | null) => {
    assignParticipant.mutate({ assignmentId, subGroupId, superGroupId, instanceId });
  };

  const isLoading = sgLoading || subLoading || pLoading;

  if (isLoading) {
    return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {supergroups.length} supergroup{supergroups.length !== 1 ? "s" : ""} · {subgroups.length} subgroup{subgroups.length !== 1 ? "s" : ""}
          </p>
          {unassignedParticipants.length > 0 && (
            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
              {unassignedParticipants.length} unassigned
            </Badge>
          )}
        </div>
        <Button size="sm" className="gap-1.5 h-8" onClick={() => openSgDialog()}>
          <Plus className="w-3.5 h-3.5" />Add Supergroup
        </Button>
      </div>

      {/* Supergroups */}
      {supergroups.length === 0 ? (
        <SectionCard title="Groups" icon={FolderTree}>
          <EmptyState icon={FolderTree} message="No groups configured. Create a supergroup to organise participants into groups and subgroups." />
        </SectionCard>
      ) : (
        <div className="space-y-3">
          {supergroups.map((sg) => {
            const children = subgroups.filter((s) => s.parent_supergroup_id === sg.id);
            const isExpanded = expanded.has(sg.id);
            const totalParticipants = children.reduce((sum, c) => sum + (participantsInSubgroup.get(c.id)?.length ?? 0), 0);

            return (
              <div key={sg.id} className="bg-card rounded-lg border border-border overflow-hidden">
                {/* Supergroup header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                  <button onClick={() => toggleExpand(sg.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <FolderTree className="w-4 h-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">{sg.name}</h3>
                    {sg.description && <p className="text-xs text-muted-foreground mt-0.5">{sg.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{children.length} subgroup{children.length !== 1 ? "s" : ""}</Badge>
                    <Badge variant="outline" className="text-[10px]">{totalParticipants} participant{totalParticipants !== 1 ? "s" : ""}</Badge>
                    {sg.type && <Badge variant="outline" className="text-[10px] capitalize">{sg.type}</Badge>}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openSubDialog(sg.id)}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openSgDialog(sg)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ type: "supergroup", id: sg.id, name: sg.name })}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Subgroups */}
                {isExpanded && (
                  <div className="divide-y divide-border">
                    {children.length === 0 ? (
                      <div className="px-8 py-4 text-sm text-muted-foreground">
                        No subgroups yet. <button className="text-primary hover:underline" onClick={() => openSubDialog(sg.id)}>Add one</button>
                      </div>
                    ) : (
                      children.map((sub) => {
                        const subParticipants = participantsInSubgroup.get(sub.id) ?? [];
                        const isSubExpanded = expanded.has(sub.id);
                        return (
                          <div key={sub.id}>
                            <div className="flex items-center gap-3 px-8 py-2.5 hover:bg-muted/20 transition-colors">
                              <button onClick={() => toggleExpand(sub.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                                {isSubExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>
                              <Users className="w-3.5 h-3.5 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground">{sub.name}</span>
                                {sub.description && <p className="text-xs text-muted-foreground">{sub.description}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">{subParticipants.length} participant{subParticipants.length !== 1 ? "s" : ""}</Badge>
                                {sub.type && <Badge variant="outline" className="text-[10px] capitalize">{sub.type}</Badge>}
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAssignDialog({ open: true, subgroupId: sub.id, supergroupId: sg.id })}>
                                  <UserPlus className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openSubDialog(sg.id, sub)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeleteTarget({ type: "subgroup", id: sub.id, name: sub.name })}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            {/* Participant list for subgroup */}
                            {isSubExpanded && subParticipants.length > 0 && (
                              <div className="px-16 py-2 space-y-1 bg-muted/10">
                                {subParticipants.map((a) => {
                                  const p = participantMap.get(a.participant_id);
                                  return (
                                    <div key={a.id} className="flex items-center gap-2.5 py-1 cursor-pointer hover:bg-muted/30 rounded-md px-1 -mx-1 transition-colors" onClick={() => setDrawerParticipantId(a.participant_id)}>
                                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                                        {p?.first_name?.[0]}{p?.surname?.[0]}
                                      </div>
                                      <span className="text-xs text-foreground flex-1">{p?.full_name ?? "Unknown"}</span>
                                      <Button
                                        variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => { e.stopPropagation(); handleAssign(a.id, null, null); }}
                                        title="Remove from subgroup"
                                      >
                                        <UserMinus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {isSubExpanded && subParticipants.length === 0 && (
                              <div className="px-16 py-2 text-xs text-muted-foreground bg-muted/10">No participants assigned</div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Unassigned participants */}
      {unassignedParticipants.length > 0 && (
        <SectionCard title={`Unassigned Participants (${unassignedParticipants.length})`} icon={Users}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {unassignedParticipants.map((a) => {
              const p = participantMap.get(a.participant_id);
              return (
                <div key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 text-sm cursor-pointer hover:bg-muted transition-colors" onClick={() => setDrawerParticipantId(a.participant_id)}>
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                    {p?.first_name?.[0]}{p?.surname?.[0]}
                  </div>
                  <span className="text-foreground text-xs truncate">{p?.full_name ?? "Unknown"}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* ── Create/Edit Supergroup Dialog ── */}
      <Dialog open={sgDialog.open} onOpenChange={(open) => !open && setSgDialog({ open: false, editing: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{sgDialog.editing ? "Edit Supergroup" : "Create Supergroup"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Companies, Platoons" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Optional description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                <Input value={formType} onChange={(e) => setFormType(e.target.value)} placeholder="e.g. company, section" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Purpose</label>
                <Input value={formPurpose} onChange={(e) => setFormPurpose(e.target.value)} placeholder="e.g. operational" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={saveSupergroup} disabled={!formName.trim()}>{sgDialog.editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create/Edit Subgroup Dialog ── */}
      <Dialog open={subDialog.open} onOpenChange={(open) => !open && setSubDialog({ open: false, editing: null, parentId: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{subDialog.editing ? "Edit Subgroup" : "Create Subgroup"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Parent Supergroup</label>
              <Select value={subDialog.parentId} onValueChange={(v) => setSubDialog((p) => ({ ...p, parentId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {supergroups.map((sg) => (
                    <SelectItem key={sg.id} value={sg.id}>{sg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Patrol 01, Team Alpha" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Optional description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                <Input value={formType} onChange={(e) => setFormType(e.target.value)} placeholder="e.g. patrol, team" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Purpose</label>
                <Input value={formPurpose} onChange={(e) => setFormPurpose(e.target.value)} placeholder="e.g. hiking, activities" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={saveSubgroup} disabled={!formName.trim() || !subDialog.parentId}>{subDialog.editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign Participant Dialog ── */}
      <Dialog open={!!assignDialog?.open} onOpenChange={(open) => { if (!open) { setAssignDialog(null); setAssignSearch(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Participants</DialogTitle>
          </DialogHeader>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search participants..." value={assignSearch} onChange={(e) => setAssignSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1">
            {(() => {
              // Show unassigned + those in other subgroups
              const available = assignments.filter((a) => a.sub_group_id !== assignDialog?.subgroupId);
              const filtered = available.filter((a) => {
                if (!assignSearch) return true;
                const p = participantMap.get(a.participant_id);
                return p?.full_name?.toLowerCase().includes(assignSearch.toLowerCase());
              });
              if (filtered.length === 0) {
                return <p className="text-sm text-muted-foreground py-4 text-center">No participants available</p>;
              }
              return filtered.map((a) => {
                const p = participantMap.get(a.participant_id);
                const currentSub = a.sub_group_id ? subgroups.find((s) => s.id === a.sub_group_id) : null;
                return (
                  <div key={a.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                      {p?.first_name?.[0]}{p?.surname?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground">{p?.full_name ?? "Unknown"}</span>
                      {currentSub && <span className="text-[10px] text-muted-foreground ml-1.5">({currentSub.name})</span>}
                    </div>
                    <Button
                      variant="outline" size="sm" className="h-6 text-[10px] px-2"
                      onClick={() => handleAssign(a.id, assignDialog!.subgroupId, assignDialog!.supergroupId)}
                    >
                      Assign
                    </Button>
                  </div>
                );
              });
            })()}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Done</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === "supergroup" ? "Supergroup" : "Subgroup"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"?
              {deleteTarget?.type === "supergroup" && " This will also delete all subgroups within it."}
              {" "}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InstanceGroupsTab;
