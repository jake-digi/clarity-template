import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TransportVehicle {
  id: string;
  tenant_id: string;
  instance_id: string;
  name: string;
  vehicle_type: string;
  registration: string | null;
  capacity: number | null;
  driver_name: string | null;
  driver_phone: string | null;
  operator: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransportLeg {
  id: string;
  tenant_id: string;
  instance_id: string;
  vehicle_id: string | null;
  leg_type: string;
  departure_location: string;
  arrival_location: string;
  departure_time: string | null;
  arrival_time: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  vehicle_name?: string;
  passenger_count?: number;
}

export interface TransportPassenger {
  id: string;
  leg_id: string;
  participant_id: string;
  checked_in: boolean;
  checked_in_at: string | null;
  pickup_point: string | null;
  notes: string | null;
  participant_name?: string;
}

export function useTransportVehicles(instanceId?: string) {
  return useQuery({
    queryKey: ["transport-vehicles", instanceId],
    enabled: !!instanceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transport_vehicles")
        .select("*")
        .eq("instance_id", instanceId!)
        .is("deleted_at", null)
        .order("name");
      if (error) throw error;
      return (data ?? []) as TransportVehicle[];
    },
  });
}

export function useTransportLegs(instanceId?: string) {
  return useQuery({
    queryKey: ["transport-legs", instanceId],
    enabled: !!instanceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transport_legs")
        .select("*")
        .eq("instance_id", instanceId!)
        .order("departure_time", { ascending: true });
      if (error) throw error;

      // Resolve vehicle names & passenger counts
      const legIds = (data ?? []).map((l: any) => l.id);
      const vehicleIds = [...new Set((data ?? []).map((l: any) => l.vehicle_id).filter(Boolean))];

      const [vRes, pRes] = await Promise.all([
        vehicleIds.length
          ? supabase.from("transport_vehicles").select("id, name").in("id", vehicleIds)
          : { data: [] },
        legIds.length
          ? supabase.from("transport_passengers").select("leg_id").in("leg_id", legIds)
          : { data: [] },
      ]);

      const vMap = Object.fromEntries((vRes.data ?? []).map((v: any) => [v.id, v.name]));
      const pCount: Record<string, number> = {};
      (pRes.data ?? []).forEach((p: any) => { pCount[p.leg_id] = (pCount[p.leg_id] ?? 0) + 1; });

      return (data ?? []).map((l: any) => ({
        ...l,
        vehicle_name: l.vehicle_id ? vMap[l.vehicle_id] ?? "Unknown" : "Unassigned",
        passenger_count: pCount[l.id] ?? 0,
      })) as TransportLeg[];
    },
  });
}

export function useTransportPassengers(legId?: string) {
  return useQuery({
    queryKey: ["transport-passengers", legId],
    enabled: !!legId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transport_passengers")
        .select("*")
        .eq("leg_id", legId!)
        .order("created_at");
      if (error) throw error;

      const pIds = [...new Set((data ?? []).map((p: any) => p.participant_id))];
      const pRes = pIds.length
        ? await supabase.from("participants").select("id, full_name").in("id", pIds)
        : { data: [] };
      const pMap = Object.fromEntries((pRes.data ?? []).map((p: any) => [p.id, p.full_name]));

      return (data ?? []).map((p: any) => ({
        ...p,
        participant_name: pMap[p.participant_id] ?? p.participant_id,
      })) as TransportPassenger[];
    },
  });
}

export function useAddVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: Omit<TransportVehicle, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("transport_vehicles").insert(vehicle as any);
      if (error) throw error;
    },
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["transport-vehicles", v.instance_id] }); },
  });
}

export function useAddLeg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leg: { tenant_id: string; instance_id: string; vehicle_id?: string; leg_type: string; departure_location: string; arrival_location: string; departure_time?: string; arrival_time?: string; notes?: string }) => {
      const { error } = await supabase.from("transport_legs").insert(leg as any);
      if (error) throw error;
    },
    onSuccess: (_, l) => { qc.invalidateQueries({ queryKey: ["transport-legs", l.instance_id] }); },
  });
}

export function useTogglePassengerCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ passengerId, checkedIn, legId }: { passengerId: string; checkedIn: boolean; legId: string }) => {
      const { error } = await supabase.from("transport_passengers").update({
        checked_in: checkedIn,
        checked_in_at: checkedIn ? new Date().toISOString() : null,
      } as any).eq("id", passengerId);
      if (error) throw error;
      return legId;
    },
    onSuccess: (legId) => { qc.invalidateQueries({ queryKey: ["transport-passengers", legId] }); },
  });
}
