import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard, EmptyState } from "@/components/participant/ProfileShared";
import { Search, UserCheck, ExternalLink } from "lucide-react";

interface Props {
  instanceId: string;
}

const InstanceStaffTab = ({ instanceId }: Props) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["instance-staff-assignments", instanceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_instance_assignments")
        .select("*")
        .eq("instance_id", instanceId)
        .is("removed_at", null);
      if (error) throw error;

      if (!data?.length) return [];

      const userIds = data.map((a) => a.user_id);
      const { data: users } = await supabase
        .from("users")
        .select("id, first_name, last_name, surname, email, status, profile_photo_url")
        .in("id", userIds);

      const uMap = new Map((users ?? []).map((u) => [u.id, u]));

      return data.map((a) => ({
        ...a,
        user: uMap.get(a.user_id) ?? null,
      }));
    },
  });

  const filtered = (assignments ?? []).filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${a.user?.first_name ?? ""} ${a.user?.last_name ?? a.user?.surname ?? ""}`.toLowerCase();
    const email = a.user?.email?.toLowerCase() ?? "";
    const role = a.role?.toLowerCase() ?? "";
    return name.includes(q) || email.includes(q) || role.includes(q);
  });

  if (isLoading) {
    return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <p className="text-xs text-muted-foreground">{filtered.length} staff member{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {filtered.length === 0 ? (
        <SectionCard title="Staff" icon={UserCheck}>
          <EmptyState icon={UserCheck} message={search ? "No staff match your search." : "No staff assigned to this instance yet."} />
        </SectionCard>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Name</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Email</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Role</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Status</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => {
                const displayName = a.user
                  ? `${a.user.first_name} ${a.user.last_name ?? a.user.surname ?? ""}`.trim()
                  : a.instance_name ?? "Unknown";
                return (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {a.user?.first_name?.[0]}{(a.user?.last_name ?? a.user?.surname)?.[0]}
                        </div>
                        <span className="font-medium text-foreground">{displayName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{a.user?.email ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      {a.role ? <Badge variant="secondary" className="text-[10px] capitalize">{a.role}</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={a.user?.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">
                        {a.user?.status ?? "unknown"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/people/${a.user_id}`)}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InstanceStaffTab;
