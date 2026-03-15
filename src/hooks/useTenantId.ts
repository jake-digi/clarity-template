import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useTenantId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tenant-id", user?.id],
    enabled: !!user?.id,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("auth_id", user!.id)
        .single();
      if (error) throw error;
      return data.tenant_id as string;
    },
  });
}
