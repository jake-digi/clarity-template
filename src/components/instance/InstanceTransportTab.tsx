import { useState } from "react";
import { useTransportVehicles, useTransportLegs, useAddVehicle, useAddLeg } from "@/hooks/useTransport";
import { useTenantId } from "@/hooks/useTenantId";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bus, Plus, MapPin, Clock, Users, Truck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors: Record<string, "default" | "secondary" | "outline"> = {
  scheduled: "outline",
  "in-transit": "default",
  completed: "secondary",
  cancelled: "secondary",
};

interface Props { instanceId: string }

export default function InstanceTransportTab({ instanceId }: Props) {
  const { data: tenantId } = useTenantId();
  const { data: vehicles, isLoading: vLoading } = useTransportVehicles(instanceId);
  const { data: legs, isLoading: lLoading } = useTransportLegs(instanceId);
  const addVehicle = useAddVehicle();
  const addLeg = useAddLeg();

  const [vehicleDialog, setVehicleDialog] = useState(false);
  const [legDialog, setLegDialog] = useState(false);
  const [vForm, setVForm] = useState({ name: "", vehicle_type: "coach", registration: "", capacity: "", driver_name: "", driver_phone: "", operator: "" });
  const [lForm, setLForm] = useState({ leg_type: "outbound", departure_location: "", arrival_location: "", departure_time: "", arrival_time: "", vehicle_id: "", notes: "" });

  const handleAddVehicle = () => {
    if (!vForm.name.trim() || !tenantId) return;
    addVehicle.mutate(
      { tenant_id: tenantId, instance_id: instanceId, name: vForm.name, vehicle_type: vForm.vehicle_type, registration: vForm.registration || null, capacity: vForm.capacity ? parseInt(vForm.capacity) : null, driver_name: vForm.driver_name || null, driver_phone: vForm.driver_phone || null, operator: vForm.operator || null, notes: null } as any,
      {
        onSuccess: () => { setVehicleDialog(false); setVForm({ name: "", vehicle_type: "coach", registration: "", capacity: "", driver_name: "", driver_phone: "", operator: "" }); toast.success("Vehicle added"); },
        onError: () => toast.error("Failed to add vehicle"),
      }
    );
  };

  const handleAddLeg = () => {
    if (!lForm.departure_location.trim() || !lForm.arrival_location.trim() || !tenantId) return;
    addLeg.mutate(
      { tenant_id: tenantId, instance_id: instanceId, leg_type: lForm.leg_type, departure_location: lForm.departure_location, arrival_location: lForm.arrival_location, departure_time: lForm.departure_time || undefined, arrival_time: lForm.arrival_time || undefined, vehicle_id: lForm.vehicle_id || undefined, notes: lForm.notes || undefined },
      {
        onSuccess: () => { setLegDialog(false); setLForm({ leg_type: "outbound", departure_location: "", arrival_location: "", departure_time: "", arrival_time: "", vehicle_id: "", notes: "" }); toast.success("Journey added"); },
        onError: () => toast.error("Failed to add journey"),
      }
    );
  };

  const isLoading = vLoading || lLoading;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="journeys">
        <div className="flex items-center justify-between">
          <TabsList className="h-8">
            <TabsTrigger value="journeys" className="text-xs h-7 gap-1"><MapPin className="w-3 h-3" />Journeys</TabsTrigger>
            <TabsTrigger value="vehicles" className="text-xs h-7 gap-1"><Bus className="w-3 h-3" />Vehicles</TabsTrigger>
          </TabsList>
        </div>

        {/* Journeys */}
        <TabsContent value="journeys" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5 h-8" onClick={() => setLegDialog(true)}><Plus className="w-3.5 h-3.5" />Add Journey</Button>
          </div>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (legs ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <MapPin className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-medium">No journeys scheduled</p>
              <p className="text-sm mt-1">Add transport legs for this instance</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>From → To</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Passengers</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(legs ?? []).map((leg) => (
                    <TableRow key={leg.id}>
                      <TableCell><Badge variant="outline" className="capitalize text-xs">{leg.leg_type}</Badge></TableCell>
                      <TableCell className="text-sm">{leg.departure_location} → {leg.arrival_location}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {leg.departure_time ? format(new Date(leg.departure_time), "d MMM, HH:mm") : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{leg.vehicle_name}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground"><Users className="w-3 h-3" />{leg.passenger_count}</span>
                      </TableCell>
                      <TableCell><Badge variant={statusColors[leg.status] ?? "outline"} className="capitalize text-xs">{leg.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Vehicles */}
        <TabsContent value="vehicles" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5 h-8" onClick={() => setVehicleDialog(true)}><Plus className="w-3.5 h-3.5" />Add Vehicle</Button>
          </div>
          {vLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (vehicles ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bus className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-medium">No vehicles registered</p>
              <p className="text-sm mt-1">Add coaches, buses, or minibuses for transport</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(vehicles ?? []).map((v) => (
                <div key={v.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                        {v.vehicle_type === "minibus" ? <Truck className="w-4 h-4 text-primary" /> : <Bus className="w-4 h-4 text-primary" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{v.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{v.vehicle_type}</p>
                      </div>
                    </div>
                    {v.capacity && <Badge variant="secondary" className="text-xs">{v.capacity} seats</Badge>}
                  </div>
                  {(v.registration || v.driver_name || v.operator) && (
                    <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t border-border">
                      {v.registration && <p>Reg: <span className="text-foreground font-medium">{v.registration}</span></p>}
                      {v.driver_name && <p>Driver: {v.driver_name}{v.driver_phone ? ` (${v.driver_phone})` : ""}</p>}
                      {v.operator && <p>Operator: {v.operator}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Vehicle Dialog */}
      <Dialog open={vehicleDialog} onOpenChange={setVehicleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Vehicle</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Name *</Label><Input value={vForm.name} onChange={(e) => setVForm({ ...vForm, name: e.target.value })} placeholder="Coach 1" /></div>
              <div><Label className="text-xs">Type</Label>
                <Select value={vForm.vehicle_type} onValueChange={(v) => setVForm({ ...vForm, vehicle_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="bus">Bus</SelectItem>
                    <SelectItem value="minibus">Minibus</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Registration</Label><Input value={vForm.registration} onChange={(e) => setVForm({ ...vForm, registration: e.target.value })} /></div>
              <div><Label className="text-xs">Capacity</Label><Input type="number" value={vForm.capacity} onChange={(e) => setVForm({ ...vForm, capacity: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Driver Name</Label><Input value={vForm.driver_name} onChange={(e) => setVForm({ ...vForm, driver_name: e.target.value })} /></div>
              <div><Label className="text-xs">Driver Phone</Label><Input value={vForm.driver_phone} onChange={(e) => setVForm({ ...vForm, driver_phone: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Operator</Label><Input value={vForm.operator} onChange={(e) => setVForm({ ...vForm, operator: e.target.value })} placeholder="Transport company" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVehicleDialog(false)}>Cancel</Button>
            <Button onClick={handleAddVehicle} disabled={!vForm.name.trim()}>Add Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Journey Dialog */}
      <Dialog open={legDialog} onOpenChange={setLegDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Journey</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Journey Type</Label>
              <Select value={lForm.leg_type} onValueChange={(v) => setLForm({ ...lForm, leg_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">From *</Label><Input value={lForm.departure_location} onChange={(e) => setLForm({ ...lForm, departure_location: e.target.value })} placeholder="London Victoria" /></div>
              <div><Label className="text-xs">To *</Label><Input value={lForm.arrival_location} onChange={(e) => setLForm({ ...lForm, arrival_location: e.target.value })} placeholder="Camp Site" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Departure</Label><Input type="datetime-local" value={lForm.departure_time} onChange={(e) => setLForm({ ...lForm, departure_time: e.target.value })} /></div>
              <div><Label className="text-xs">Arrival</Label><Input type="datetime-local" value={lForm.arrival_time} onChange={(e) => setLForm({ ...lForm, arrival_time: e.target.value })} /></div>
            </div>
            <div>
              <Label className="text-xs">Vehicle</Label>
              <Select value={lForm.vehicle_id} onValueChange={(v) => setLForm({ ...lForm, vehicle_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {(vehicles ?? []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name} ({v.vehicle_type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLegDialog(false)}>Cancel</Button>
            <Button onClick={handleAddLeg} disabled={!lForm.departure_location.trim() || !lForm.arrival_location.trim()}>Add Journey</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
