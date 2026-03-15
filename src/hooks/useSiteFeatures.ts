import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const FEATURE_TYPES = [
  { value: "swimming-pool", label: "Swimming Pool", icon: "waves", color: "#0ea5e9" },
  { value: "dining-hall", label: "Dining Hall", icon: "utensils", color: "#f59e0b" },
  { value: "events-hall", label: "Events Hall", icon: "calendar", color: "#8b5cf6" },
  { value: "information", label: "Information Point", icon: "info", color: "#3b82f6" },
  { value: "parking", label: "Parking", icon: "car", color: "#6b7280" },
  { value: "sports", label: "Sports Area", icon: "trophy", color: "#10b981" },
  { value: "playground", label: "Playground", icon: "ferris-wheel", color: "#f97316" },
  { value: "first-aid", label: "First Aid", icon: "cross", color: "#ef4444" },
  { value: "toilet", label: "Toilets", icon: "droplets", color: "#06b6d4" },
  { value: "entrance", label: "Entrance/Gate", icon: "log-in", color: "#84cc16" },
  { value: "campfire", label: "Campfire/BBQ", icon: "flame", color: "#ea580c" },
  { value: "worship", label: "Place of Worship", icon: "church", color: "#a855f7" },
  { value: "shop", label: "Shop", icon: "shopping-bag", color: "#ec4899" },
  { value: "laundry", label: "Laundry", icon: "shirt", color: "#14b8a6" },
  { value: "other", label: "Other", icon: "map-pin", color: "#6b7280" },
] as const;

export type FeatureType = typeof FEATURE_TYPES[number]["value"];

export interface SiteFeature {
  id: string;
  site_id: string;
  tenant_id: string;
  name: string;
  feature_type: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  geo_position: { lat: number; lng: number } | null;
  geo_polygon: [number, number][] | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function useSiteFeatures(siteId: string) {
  return useQuery({
    queryKey: ["site-features", siteId],
    enabled: !!siteId,
    queryFn: async (): Promise<SiteFeature[]> => {
      const { data, error } = await (supabase as any)
        .from("site_features")
        .select("*")
        .eq("site_id", siteId)
        .is("deleted_at", null)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((f: any) => ({
        ...f,
        geo_position: f.geo_position as { lat: number; lng: number } | null,
        geo_polygon: f.geo_polygon as [number, number][] | null,
      }));
    },
  });
}

export function useCreateSiteFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      site_id: string;
      tenant_id: string;
      name: string;
      feature_type: string;
      description?: string;
      icon?: string;
      color?: string;
      geo_position?: { lat: number; lng: number };
    }) => {
      const { data, error } = await (supabase as any)
        .from("site_features")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ["site-features", vars.site_id] });
      toast.success("Feature added");
    },
    onError: (e: Error) => toast.error("Failed to add feature: " + e.message),
  });
}

export function useUpdateSiteFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, site_id, ...updates }: {
      id: string;
      site_id: string;
      name?: string;
      feature_type?: string;
      description?: string;
      icon?: string;
      color?: string;
      geo_position?: { lat: number; lng: number } | null;
    }) => {
      const { error } = await (supabase as any)
        .from("site_features")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ["site-features", vars.site_id] });
      toast.success("Feature updated");
    },
    onError: (e: Error) => toast.error("Failed to update feature: " + e.message),
  });
}

export function useDeleteSiteFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, site_id }: { id: string; site_id: string }) => {
      const { error } = await (supabase as any)
        .from("site_features")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ["site-features", vars.site_id] });
      toast.success("Feature deleted");
    },
    onError: (e: Error) => toast.error("Failed to delete feature: " + e.message),
  });
}
