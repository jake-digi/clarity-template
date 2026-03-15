import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Announcement {
  id: string;
  tenant_id: string;
  instance_id: string | null;
  title: string;
  content: string;
  priority: string;
  created_by: string | null;
  created_by_name: string | null;
  published_at: string;
  expires_at: string | null;
  is_pinned: boolean;
  target_groups: string[];
  created_at: string;
  read_count?: number;
}

export function useAnnouncements(instanceId?: string) {
  return useQuery({
    queryKey: ["announcements", instanceId],
    queryFn: async () => {
      let q = supabase
        .from("announcements")
        .select("*")
        .is("deleted_at", null)
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });
      if (instanceId) q = q.eq("instance_id", instanceId);
      const { data, error } = await q;
      if (error) throw error;

      // Fetch read counts
      const ids = (data ?? []).map((a: any) => a.id);
      if (ids.length === 0) return [] as Announcement[];

      const { data: receipts } = await supabase
        .from("announcement_read_receipts")
        .select("announcement_id")
        .in("announcement_id", ids);

      const countMap: Record<string, number> = {};
      (receipts ?? []).forEach((r: any) => {
        countMap[r.announcement_id] = (countMap[r.announcement_id] || 0) + 1;
      });

      return (data ?? []).map((a: any) => ({
        ...a,
        read_count: countMap[a.id] ?? 0,
      })) as Announcement[];
    },
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (announcement: any) => {
      const { error } = await supabase.from("announcements").insert(announcement);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("announcements")
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}

export function useMarkAnnouncementRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ announcementId, userId, userName }: { announcementId: string; userId: string; userName: string }) => {
      const { error } = await supabase
        .from("announcement_read_receipts")
        .insert({ announcement_id: announcementId, user_id: userId, user_name: userName });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}
