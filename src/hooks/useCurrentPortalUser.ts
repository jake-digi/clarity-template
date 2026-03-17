import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentPortalUser {
  id: string;
  auth_id: string | null;
  customer_id: string | null;
  name: string;
  email: string;
  role: string | null;
  is_admin: boolean;
  is_active: boolean;
}

/**
 * Fetches the current user's portal_users row by auth id.
 * Used to gate management platform access: only users in portal_users who are
 * active and either admin or not customer-linked (staff) may access.
 */
export function useCurrentPortalUser(authUserId: string | undefined) {
  const query = useQuery({
    queryKey: ["currentPortalUser", authUserId ?? null],
    enabled: !!authUserId,
    queryFn: async (): Promise<CurrentPortalUser | null> => {
      const { data, error } = await supabase
        .from("portal_users")
        .select("id, auth_id, customer_id, name, email, role, is_admin, is_active")
        .eq("auth_id", authUserId!)
        .maybeSingle();

      if (error) throw error;
      return data as CurrentPortalUser | null;
    },
  });

  const portalUser = query.data ?? null;

  /** True if this user is allowed to use the management platform (not orders-only). */
  const canAccessManagement =
    !!portalUser &&
    portalUser.is_active !== false &&
    // Admins can always access, even if linked to a customer account
    (portalUser.is_admin === true ||
      // Non-admin staff can also be allowed in future via role
      (portalUser.role && portalUser.role !== "customer"));

  return {
    portalUser,
    canAccessManagement,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
