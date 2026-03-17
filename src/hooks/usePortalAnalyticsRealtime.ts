import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to Supabase Realtime INSERTs on portal_analytics.
 * Invalidates portal analytics queries so Insights page and customer-scoped
 * insights refetch and update in real time when new events are recorded.
 */
export function usePortalAnalyticsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("portal_analytics_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "portal_analytics",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["portal_analytics"] });
          queryClient.invalidateQueries({ queryKey: ["portal_analytics_by_customer"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
