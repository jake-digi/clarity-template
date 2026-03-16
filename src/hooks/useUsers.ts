import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserRow {
  id: string;
  auth_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  name: string;
  email: string;
  role: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<UserRow[]> => {
      const db = supabase as any;

      const { data: users, error } = await db
        .from("portal_users")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      if (!users?.length) return [];

      // Fetch customer names for users that have a customer_id
      const customerIds = [
        ...new Set(
          (users as any[])
            .filter((u) => u.customer_id)
            .map((u) => u.customer_id)
        ),
      ];

      let customerMap: Record<string, string> = {};
      if (customerIds.length) {
        const { data: customers } = await db
          .from("customers")
          .select("id, name")
          .in("id", customerIds);
        customerMap = Object.fromEntries(
          (customers ?? []).map((c: any) => [c.id, c.name])
        );
      }

      return (users as any[]).map((u) => ({
        id: u.id,
        auth_id: u.auth_id ?? null,
        customer_id: u.customer_id ?? null,
        customer_name: u.customer_id ? (customerMap[u.customer_id] ?? null) : null,
        name: u.name,
        email: u.email,
        role: u.role ?? null,
        is_admin: u.is_admin ?? false,
        is_active: u.is_active ?? true,
        created_at: u.created_at,
        updated_at: u.updated_at,
      }));
    },
  });
}
