import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentPortalUser } from "./useCurrentPortalUser";

export type AnalyticsEventType =
  | "view_product"
  | "search"
  | "search_click"
  | "search_no_results"
  | "filter_used"
  | "sort_changed"
  | "add_to_cart"
  | "order_placed"
  | "cart_abandoned"
  | "list_add_item"
  | "invoice_view"
  | "invoice_download"
  | "stock_notification_signup"
  | "ui_error";

export interface AnalyticsMetadata {
  query?: string;
  order_id?: string;
  total?: number;
  quantity?: number;
  delta?: number;
  error?: string;
  context?: string;
  [key: string]: unknown;
}

/**
 * Non-blocking analytics tracking. Merges user context, url, timestamp, user_agent.
 * Failures are silent so tracking never impacts UX.
 */
export function useAnalytics() {
  const { user } = useAuth();
  const { portalUser } = useCurrentPortalUser(user?.id);

  const track = useCallback(
    (
      eventType: AnalyticsEventType,
      options?: { productCode?: string | null; metadata?: AnalyticsMetadata }
    ) => {
      const payload = {
        portal_user_id: portalUser?.id ?? null,
        event_type: eventType,
        product_code: options?.productCode ?? null,
        metadata: {
          user_name: portalUser?.name ?? null,
          user_email: portalUser?.email ?? null,
          url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "",
          timestamp: new Date().toISOString(),
          ...options?.metadata,
        },
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      };

      supabase
        .from("portal_analytics")
        .insert(payload)
        .then(() => {})
        .catch(() => {});
    },
    [portalUser?.id, portalUser?.name, portalUser?.email]
  );

  return { track };
}
