import { useState } from "react";
import { useEquipmentItems, useEquipmentCheckouts, useAddEquipmentItem, useCheckoutEquipment, useReturnEquipment } from "@/hooks/useEquipment";
import { useTenantId } from "@/hooks/useTenantId";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Package, Plus, RotateCcw, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const conditionColors: Record<string, string> = {
  good: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  fair: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  poor: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  damaged: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const categoryIcons: Record<string, string> = {
  general: "📦",
  safety: "🦺",
  communication: "📻",
  medical: "🏥",
  camping: "⛺",
  cooking: "🍳",
  navigation: "🧭",
};

interface Props { instanceId: string }

export default function InstanceEquipmentTab({ instanceId }: Props) {
  const tenantId = useTenantId();
  const { user } = useAuth();
  const { data: items, isLoading: iLoading } = useEquipmentItems(instanceId);
  const { data: checkouts, isLoading: cLoading } = useEquipmentCheckouts(instanceId);
  const addItem = useAddEquipmentItem();
  const checkoutEquipment = useCheckoutEquipment();
  const returnEquipment = useReturnEquipment();

  const [addDialog, setAddDialog] = useState(false);
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [form, setForm] = useState({ name: "", category: "general", serial_number: "", total_quantity: "1", condition: "good", location: "", notes: "" });
  const [coForm, setCoForm] = useState({ equipment_id: "", checked_out_to: "", checked_out_to_type: "group", quantity: "1", notes: "" });

  // Fetch subgroups for checkout target
  const { data: subgroups } = useQuery({
    queryKey: ["instance-subgroups", instanceId],
    queryFn: async () => {
      const { data, error } = await supabase.from("subgroups").select("id, name").eq("instance_id", instanceId).is("deleted_at", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleAddItem = () => {
    if (!form.name.trim() || !tenantId) return;
    const qty = parseInt(form.total_quantity) || 1;
    addItem.mutate(
      { tenant_id: tenantId, instance_id: instanceId, name: form.name, category: form.category, serial_number: form.serial_number || undefined, total_quantity: qty, available_quantity: qty, condition: form.condition, location: form.location || undefined, notes: form.notes || undefined },
      {
        onSuccess: () => { setAddDialog(false); setForm({ name: "", category: "general", serial_number: "", total_quantity: "1", condition: "good", location: "", notes: "" }); toast.success("Equipment added"); },
        onError: () => toast.error("Failed to add equipment"),
      }
    );
  };

  const handleCheckout = () => {
    if (!coForm.equipment_id || !coForm.checked_out_to) return;
    checkoutEquipment.mutate(
      { equipment_id: coForm.equipment_id, instance_id: instanceId, checked_out_to: coForm.checked_out_to, checked_out_to_type: coForm.checked_out_to_type, quantity: parseInt(coForm.quantity) || 1, checked_out_by: user?.id, checked_out_by_name: user?.email ?? "Unknown", notes: coForm.notes || undefined },
      {
        onSuccess: () => { setCheckoutDialog(false); setCoForm({ equipment_id: "", checked_out_to: "", checked_out_to_type: "group", quantity: "1", notes: "" }); toast.success("Equipment checked out"); },
        onError: (e) => toast.error(e.message || "Failed to checkout"),
      }
    );
  };

  const handleReturn = (checkout: any) => {
    returnEquipment.mutate(
      { checkoutId: checkout.id, equipmentId: checkout.equipment_id, quantity: checkout.quantity, instanceId, returnCondition: "good", returnedBy: user?.id },
      {
        onSuccess: () => toast.success("Equipment returned"),
        onError: () => toast.error("Failed to return equipment"),
      }
    );
  };

  const isLoading = iLoading || cLoading;

  // Stats
  const totalItems = (items ?? []).reduce((s, i) => s + i.total_quantity, 0);
  const availableItems = (items ?? []).reduce((s, i) => s + i.available_quantity, 0);
  const checkedOutItems = totalItems - availableItems;
  const availPct = totalItems > 0 ? (availableItems / totalItems) * 100 : 100;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Total Items</p>
          <p className="text-xl font-semibold text-foreground">{totalItems}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Available</p>
          <p className="text-xl font-semibold text-emerald-600">{availableItems}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Checked Out</p>
          <p className="text-xl font-semibold text-amber-600">{checkedOutItems}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Availability</p>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={availPct} className="h-2 flex-1" />
            <span className="text-xs font-medium text-foreground">{Math.round(availPct)}%</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="inventory">
        <div className="flex items-center justify-between">
          <TabsList className="h-8">
            <TabsTrigger value="inventory" className="text-xs h-7 gap-1"><Package className="w-3 h-3" />Inventory</TabsTrigger>
            <TabsTrigger value="checkouts" className="text-xs h-7 gap-1"><ArrowRightLeft className="w-3 h-3" />Active Checkouts</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setCheckoutDialog(true)}><ArrowRightLeft className="w-3.5 h-3.5" />Check Out</Button>
            <Button size="sm" className="gap-1.5 h-8" onClick={() => setAddDialog(true)}><Plus className="w-3.5 h-3.5" />Add Item</Button>
          </div>
        </div>

        {/* Inventory */}
        <TabsContent value="inventory" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (items ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-medium">No equipment registered</p>
              <p className="text-sm mt-1">Add items to track inventory for this instance</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items ?? []).map((item) => {
                    const lowStock = item.available_quantity === 0;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-base">{categoryIcons[item.category] ?? "📦"}</span>
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.name}</p>
                              {item.serial_number && <p className="text-xs text-muted-foreground">S/N: {item.serial_number}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="capitalize text-xs">{item.category}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {lowStock && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                            <span className={`text-sm font-medium ${lowStock ? "text-destructive" : "text-foreground"}`}>
                              {item.available_quantity}/{item.total_quantity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${conditionColors[item.condition] ?? ""}`}>
                            {item.condition}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.location ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Active Checkouts */}
        <TabsContent value="checkouts" className="mt-4">
          {cLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (checkouts ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ArrowRightLeft className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-medium">No active checkouts</p>
              <p className="text-sm mt-1">All equipment is currently available</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Checked Out To</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(checkouts ?? []).map((co) => (
                    <TableRow key={co.id}>
                      <TableCell className="text-sm font-medium text-foreground">{co.equipment_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="capitalize text-[10px]">{co.checked_out_to_type}</Badge>
                          <span className="text-sm text-foreground">{co.checked_out_to_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{co.quantity}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(co.checked_out_at), "d MMM HH:mm")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{co.checked_out_by_name ?? "—"}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => handleReturn(co)}>
                          <RotateCcw className="w-3 h-3" />Return
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Equipment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Two-way radio" /></div>
              <div><Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="camping">Camping</SelectItem>
                    <SelectItem value="cooking">Cooking</SelectItem>
                    <SelectItem value="navigation">Navigation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Quantity</Label><Input type="number" value={form.total_quantity} onChange={(e) => setForm({ ...form, total_quantity: e.target.value })} /></div>
              <div><Label className="text-xs">Condition</Label>
                <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">S/N</Label><Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Store room A" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={!form.name.trim()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Check Out Equipment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Equipment *</Label>
              <Select value={coForm.equipment_id} onValueChange={(v) => setCoForm({ ...coForm, equipment_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>
                  {(items ?? []).filter((i) => i.available_quantity > 0).map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name} ({i.available_quantity} available)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Assign To Type</Label>
                <Select value={coForm.checked_out_to_type} onValueChange={(v) => setCoForm({ ...coForm, checked_out_to_type: v, checked_out_to: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Quantity</Label>
                <Input type="number" min={1} value={coForm.quantity} onChange={(e) => setCoForm({ ...coForm, quantity: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">{coForm.checked_out_to_type === "group" ? "Group *" : "Person Name *"}</Label>
              {coForm.checked_out_to_type === "group" ? (
                <Select value={coForm.checked_out_to} onValueChange={(v) => setCoForm({ ...coForm, checked_out_to: v })}>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    {(subgroups ?? []).map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={coForm.checked_out_to} onChange={(e) => setCoForm({ ...coForm, checked_out_to: e.target.value })} placeholder="Staff member name" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutDialog(false)}>Cancel</Button>
            <Button onClick={handleCheckout} disabled={!coForm.equipment_id || !coForm.checked_out_to}>Check Out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
