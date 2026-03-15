import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard, EmptyState } from "@/components/participant/ProfileShared";
import { Search, Users, Bed } from "lucide-react";
import ParticipantDrawer from "@/components/ParticipantDrawer";

interface Props {
  instanceId: string;
}

const InstanceParticipantsTab = ({ instanceId }: Props) => {
  const [search, setSearch] = useState("");
  const [drawerParticipantId, setDrawerParticipantId] = useState<string | null>(null);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["instance-participant-assignments", instanceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participant_instance_assignments")
        .select("*")
        .eq("instance_id", instanceId);
      if (error) throw error;

      if (!data?.length) return [];

      const participantIds = data.map((a) => a.participant_id);
      const { data: participants } = await supabase
        .from("participants")
        .select("id, full_name, first_name, surname, gender, status, photo_link, unit_name")
        .in("id", participantIds);

      const pMap = new Map((participants ?? []).map((p) => [p.id, p]));

      return data.map((a) => ({
        ...a,
        participant: pMap.get(a.participant_id) ?? null,
      }));
    },
  });

  const filtered = (assignments ?? []).filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = a.participant?.full_name?.toLowerCase() ?? "";
    const unit = a.participant?.unit_name?.toLowerCase() ?? "";
    return name.includes(q) || unit.includes(q) || (a.room_number ?? "").toLowerCase().includes(q);
  });

  if (isLoading) {
    return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search participants..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <p className="text-xs text-muted-foreground">{filtered.length} participant{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {filtered.length === 0 ? (
        <SectionCard title="Participants" icon={Users}>
          <EmptyState icon={Users} message={search ? "No participants match your search." : "No participants assigned to this instance yet."} />
        </SectionCard>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Name</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Unit</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Room</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setDrawerParticipantId(a.participant_id)}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {a.participant?.first_name?.[0]}{a.participant?.surname?.[0]}
                      </div>
                      <span className="font-medium text-foreground">{a.participant?.full_name ?? "Unknown"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{a.participant?.unit_name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {a.room_number ? (
                      <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{a.room_number}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {a.is_off_site ? (
                      <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">Off-site</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">On-site</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ParticipantDrawer
        participantId={drawerParticipantId}
        open={!!drawerParticipantId}
        onOpenChange={(open) => { if (!open) setDrawerParticipantId(null); }}
      />
    </div>
  );
};

export default InstanceParticipantsTab;
