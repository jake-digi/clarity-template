import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EquipmentItem {
  id: string;
  tenant_id: string;
  instance_id: string | null;
  name: string;
  category: string;
  serial_number: string | null;
  total_quantity: number;
  available_quantity: number;
  condition: string;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  checked_out_count?: number;
}

export interface EquipmentCheckout {
  id: string;
  equipment_id: string;
  instance_id: string;
  checked_out_to: string;
  checked_out_to_type: string;
  quantity: number;
  checked_out_by: string | null;
  checked_out_by_name: string | null;
  checked_out_at: string;
  expected_return_at: string | null;
  returned_at: string | null;
  returned_by: string | null;
  return_condition: string | null;
  notes: string | null;
  equipment_name?: string;
  checked_out_to_name?: string;
}

export function useEquipmentItems(instanceId?: string) {
  return useQuery({
    queryKey: ["equipment-items", instanceId],
    enabled: !!instanceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_items")
        .select("*")
        .eq("instance_id", instanceId!)
        .is("deleted_at", null)
        .order("category")
        .order("name");
      if (error) throw error;
      return (data ?? []) as EquipmentItem[];
    },
  });
}

export function useEquipmentCheckouts(instanceId?: string) {
  return useQuery({
    queryKey: ["equipment-checkouts", instanceId],
    enabled: !!instanceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_checkouts")
        .select("*")
        .eq("instance_id", instanceId!)
        .is("returned_at", null)
        .order("checked_out_at", { ascending: false });
      if (error) throw error;

      // Resolve equipment names and group names
      const eqIds = [...new Set((data ?? []).map((c: any) => c.equipment_id))];
      const groupIds = [...new Set((data ?? []).filter((c: any) => c.checked_out_to_type === "group").map((c: any) => c.checked_out_to))];

      const [eqRes, grRes] = await Promise.all([
        eqIds.length ? supabase.from("equipment_items").select("id, name").in("id", eqIds) : { data: [] },
        groupIds.length ? supabase.from("subgroups").select("id, name").in("id", groupIds) : { data: [] },
      ]);

      const eqMap = Object.fromEntries((eqRes.data ?? []).map((e: any) => [e.id, e.name]));
      const grMap = Object.fromEntries((grRes.data ?? []).map((g: any) => [g.id, g.name]));

      return (data ?? []).map((c: any) => ({
        ...c,
        equipment_name: eqMap[c.equipment_id] ?? "Unknown",
        checked_out_to_name: c.checked_out_to_type === "group"
          ? grMap[c.checked_out_to] ?? c.checked_out_to
          : c.checked_out_to,
      })) as EquipmentCheckout[];
    },
  });
}

export function useAddEquipmentItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { tenant_id: string; instance_id: string; name: string; category: string; serial_number?: string; total_quantity: number; available_quantity: number; condition?: string; location?: string; notes?: string }) => {
      const { error } = await supabase.from("equipment_items").insert(item as any);
      if (error) throw error;
    },
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["equipment-items", v.instance_id] }); },
  });
}

export function useCheckoutEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (checkout: { equipment_id: string; instance_id: string; checked_out_to: string; checked_out_to_type: string; quantity: number; checked_out_by?: string; checked_out_by_name?: string; expected_return_at?: string; notes?: string }) => {
      // Decrement available quantity
      const { data: item, error: fetchErr } = await supabase
        .from("equipment_items")
        .select("available_quantity")
        .eq("id", checkout.equipment_id)
        .single();
      if (fetchErr) throw fetchErr;

      const newAvail = (item.available_quantity as number) - checkout.quantity;
      if (newAvail < 0) throw new Error("Not enough stock available");

      const [, insertRes] = await Promise.all([
        supabase.from("equipment_items").update({ available_quantity: newAvail, updated_at: new Date().toISOString() } as any).eq("id", checkout.equipment_id),
        supabase.from("equipment_checkouts").insert(checkout as any),
      ]);
      if (insertRes.error) throw insertRes.error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["equipment-items", v.instance_id] });
      qc.invalidateQueries({ queryKey: ["equipment-checkouts", v.instance_id] });
    },
  });
}

export function useReturnEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ checkoutId, equipmentId, quantity, instanceId, returnCondition, returnedBy }: { checkoutId: string; equipmentId: string; quantity: number; instanceId: string; returnCondition?: string; returnedBy?: string }) => {
      const { data: item, error: fetchErr } = await supabase
        .from("equipment_items")
        .select("available_quantity")
        .eq("id", equipmentId)
        .single();
      if (fetchErr) throw fetchErr;

      await Promise.all([
        supabase.from("equipment_items").update({
          available_quantity: (item.available_quantity as number) + quantity,
          updated_at: new Date().toISOString(),
        } as any).eq("id", equipmentId),
        supabase.from("equipment_checkouts").update({
          returned_at: new Date().toISOString(),
          return_condition: returnCondition ?? null,
          returned_by: returnedBy ?? null,
        } as any).eq("id", checkoutId),
      ]);
      return instanceId;
    },
    onSuccess: (instanceId) => {
      qc.invalidateQueries({ queryKey: ["equipment-items", instanceId] });
      qc.invalidateQueries({ queryKey: ["equipment-checkouts", instanceId] });
    },
  });
}
