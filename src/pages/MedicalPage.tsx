import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Heart, AlertTriangle, ShieldAlert, Filter } from "lucide-react";

const MedicalPage = () => {
  const [search, setSearch] = useState("");
  const [instanceFilter, setInstanceFilter] = useState("all");

  const { data: instances } = useQuery({
    queryKey: ["instances-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("instances").select("id, name").is("deleted_at", null).order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: participants, isLoading } = useQuery({
    queryKey: ["all-medical-overview", instanceFilter],
    queryFn: async () => {
      let pQuery = supabase.from("participants").select("id, full_name, date_of_birth, instance_id");
      if (instanceFilter !== "all") pQuery = pQuery.eq("instance_id", instanceFilter);
      const { data: pData, error: pErr } = await pQuery;
      if (pErr) throw pErr;
      if (!pData?.length) return [];

      const pIds = pData.map((p: any) => p.id);

      const [medRes, dietRes] = await Promise.all([
        supabase.from("participant_medical_info").select("*").in("participant_id", pIds),
        supabase.from("participant_dietary_needs").select("*").in("participant_id", pIds),
      ]);

      const medMap = Object.fromEntries((medRes.data ?? []).map((m: any) => [m.participant_id, m]));
      const dietMap = Object.fromEntries((dietRes.data ?? []).map((d: any) => [d.participant_id, d]));

      const iIds = [...new Set(pData.map((p: any) => p.instance_id).filter(Boolean))];
      const iRes = iIds.length ? await supabase.from("instances").select("id, name").in("id", iIds) : { data: [] };
      const iMap = Object.fromEntries((iRes.data ?? []).map((i: any) => [i.id, i.name]));

      return pData.map((p: any) => {
        const med = medMap[p.id];
        const diet = dietMap[p.id];
        return {
          ...p,
          instance_name: p.instance_id ? iMap[p.instance_id] ?? p.instance_id : "—",
          medical: med ?? null,
          dietary: diet ?? null,
          hasAllergies: (med?.allergies ?? []).length > 0,
          hasConditions: (med?.conditions ?? []).length > 0,
          hasDietary: (diet?.restrictions ?? []).length > 0,
          isCritical: (med?.allergies ?? []).some((a: string) => /anaphyla|epipen|severe|insulin/i.test(a)) ||
            (med?.conditions ?? []).some((c: string) => /epilep|diabet|asthma|anaphyla/i.test(c)),
        };
      }).filter((p: any) => p.hasAllergies || p.hasConditions || p.hasDietary);
    },
  });

  const filtered = (participants ?? []).filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.full_name.toLowerCase().includes(q) ||
      (p.medical?.allergies ?? []).some((a: string) => a.toLowerCase().includes(q)) ||
      (p.medical?.conditions ?? []).some((c: string) => c.toLowerCase().includes(q)) ||
      (p.dietary?.restrictions ?? []).some((r: string) => r.toLowerCase().includes(q));
  });

  const criticalCount = filtered.filter((p: any) => p.isCritical).length;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <div className="bg-card border-b border-border px-6 py-5">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Medical & Dietary Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">Allergies, medical conditions, and dietary restrictions across all participants</p>
          </div>
          <div className="p-6 space-y-4">
            {criticalCount > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{criticalCount}</strong> participant{criticalCount > 1 ? "s" : ""} with critical medical conditions requiring immediate attention.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by name, allergy, condition..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={instanceFilter} onValueChange={setInstanceFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Instance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instances</SelectItem>
                  {(instances ?? []).map((i: any) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Heart className="w-10 h-10 mb-3 opacity-40" />
                <p className="font-medium">No medical records found</p>
                <p className="text-sm mt-1">Medical and dietary data is linked to participant profiles</p>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Instance</TableHead>
                      <TableHead>Allergies</TableHead>
                      <TableHead>Medical Conditions</TableHead>
                      <TableHead>Dietary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p: any) => (
                      <TableRow key={p.id} className={p.isCritical ? "bg-destructive/5" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {p.isCritical && <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />}
                            <p className="text-sm font-medium text-foreground">{p.full_name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.instance_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(p.medical?.allergies ?? []).map((a: string, i: number) => (
                              <Badge key={i} variant="outline" className={`text-[10px] ${/anaphyla|epipen|severe/i.test(a) ? "border-destructive text-destructive" : ""}`}>{a}</Badge>
                            ))}
                            {!(p.medical?.allergies ?? []).length && <span className="text-xs text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(p.medical?.conditions ?? []).map((c: string, i: number) => (
                              <Badge key={i} variant="secondary" className={`text-[10px] ${/epilep|diabet|asthma/i.test(c) ? "border-destructive text-destructive bg-destructive/10" : ""}`}>{c}</Badge>
                            ))}
                            {!(p.medical?.conditions ?? []).length && <span className="text-xs text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(p.dietary?.restrictions ?? []).map((r: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px] border-amber-500/30 text-amber-700 dark:text-amber-400">{r}</Badge>
                            ))}
                            {!(p.dietary?.restrictions ?? []).length && <span className="text-xs text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MedicalPage;
