import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SiteRow {
  id: string;
  tenant_id: string;
  name: string;
  location: string | null;
  address: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  block_count: number;
  room_count: number;
}

export interface SiteBlock {
  id: string;
  name: string;
  description: string | null;
  site_id: string;
  tenant_id: string;
  created_at: string;
  geo_polygon: [number, number][] | null;
  rooms: SiteRoom[];
}

export interface SiteRoom {
  id: string;
  block_id: string;
  room_number: string;
  name: string | null;
  capacity: number | null;
  site_id: string;
  tenant_id: string;
  geo_position: { lat: number; lng: number } | null;
}

export function useSites() {
  return useQuery({
    queryKey: ["sites"],
    queryFn: async (): Promise<SiteRow[]> => {
      const { data: sites, error } = await supabase
        .from("sites")
        .select("*")
        .is("deleted_at", null)
        .order("name");

      if (error) throw error;
      if (!sites?.length) return [];

      const siteIds = sites.map((s) => s.id);

      const [blocksRes, roomsRes] = await Promise.all([
        supabase.from("blocks").select("site_id").in("site_id", siteIds).is("deleted_at", null),
        supabase.from("rooms").select("site_id").in("site_id", siteIds).is("deleted_at", null),
      ]);

      const blockCounts = new Map<string, number>();
      (blocksRes.data ?? []).forEach((b) => {
        if (b.site_id) blockCounts.set(b.site_id, (blockCounts.get(b.site_id) ?? 0) + 1);
      });
      const roomCounts = new Map<string, number>();
      (roomsRes.data ?? []).forEach((r) => {
        if (r.site_id) roomCounts.set(r.site_id, (roomCounts.get(r.site_id) ?? 0) + 1);
      });

      return sites.map((s) => ({
        ...s,
        block_count: blockCounts.get(s.id) ?? 0,
        room_count: roomCounts.get(s.id) ?? 0,
      }));
    },
  });
}

export function useSiteDetail(siteId: string) {
  return useQuery({
    queryKey: ["site", siteId],
    enabled: !!siteId,
    queryFn: async () => {
      const [siteRes, blocksRes, roomsRes] = await Promise.all([
        supabase.from("sites").select("*").eq("id", siteId).single(),
        supabase.from("blocks").select("*").eq("site_id", siteId).is("deleted_at", null).order("name"),
        supabase.from("rooms").select("*").eq("site_id", siteId).is("deleted_at", null).order("room_number"),
      ]);

      if (siteRes.error) throw siteRes.error;

      const blocks: SiteBlock[] = (blocksRes.data ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        site_id: b.site_id!,
        tenant_id: b.tenant_id,
        created_at: b.created_at,
        geo_polygon: (b as any).geo_polygon as [number, number][] | null,
        rooms: (roomsRes.data ?? [])
          .filter((r) => r.block_id === b.id)
          .map((r) => ({
            id: r.id,
            block_id: r.block_id,
            room_number: r.room_number,
            name: r.name,
            capacity: r.capacity,
            site_id: r.site_id!,
            tenant_id: r.tenant_id,
            geo_position: (r as any).geo_position as { lat: number; lng: number } | null,
          })),
      }));

      return { site: siteRes.data, blocks };
    },
  });
}

export function useCreateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; location?: string; address?: string; description?: string; tenant_id: string }) => {
      const { data, error } = await supabase.from("sites").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Site created");
    },
    onError: (e) => toast.error("Failed to create site: " + e.message),
  });
}

export function useUpdateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; location?: string; address?: string; description?: string; geo_bounds?: any }) => {
      const { error } = await supabase.from("sites").update({ ...updates, updated_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sites"] });
      qc.invalidateQueries({ queryKey: ["site"] });
      toast.success("Site updated");
    },
    onError: (e) => toast.error("Failed to update site: " + e.message),
  });
}

export function useUpdateBlockPolygon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, geo_polygon }: { id: string; geo_polygon: [number, number][] | null }) => {
      const { error } = await supabase.from("blocks").update({ geo_polygon, updated_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site"] });
    },
    onError: (e) => toast.error("Failed to update block polygon: " + e.message),
  });
}

export function useDeleteSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sites").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Site deleted");
    },
    onError: (e) => toast.error("Failed to delete site: " + e.message),
  });
}

export function useCreateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name: string; description?: string; site_id: string; tenant_id: string }) => {
      const { data, error } = await supabase.from("blocks").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site"] });
      qc.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Block created");
    },
    onError: (e) => toast.error("Failed to create block: " + e.message),
  });
}

export function useUpdateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string }) => {
      const { error } = await supabase.from("blocks").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site"] });
      toast.success("Block updated");
    },
    onError: (e) => toast.error("Failed to update block: " + e.message),
  });
}

export function useDeleteBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blocks").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site"] });
      qc.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Block deleted");
    },
    onError: (e) => toast.error("Failed to delete block: " + e.message),
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; block_id: string; room_number: string; name?: string; capacity?: number; site_id: string; tenant_id: string }) => {
      const { data, error } = await supabase.from("rooms").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site"] });
      qc.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Room created");
    },
    onError: (e) => toast.error("Failed to create room: " + e.message),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; room_number?: string; name?: string; capacity?: number }) => {
      const { error } = await supabase.from("rooms").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site"] });
      toast.success("Room updated");
    },
    onError: (e) => toast.error("Failed to update room: " + e.message),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rooms").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site"] });
      qc.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Room deleted");
    },
    onError: (e) => toast.error("Failed to delete room: " + e.message),
  });
}
