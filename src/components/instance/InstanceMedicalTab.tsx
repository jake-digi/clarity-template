import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Heart, Utensils, AlertTriangle, ShieldAlert, Pill } from "lucide-react";

interface Props { instanceId: string }

export default function InstanceMedicalTab({ instanceId }: Props) {
  const [search, setSearch] = useState("");

  // Fetch participants for this instance
  const { data: participants, isLoading: pLoading } = useQuery({
    queryKey: ["instance-participants-medical", instanceId],
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from("participant_instance_assignments")
        .select("participant_id")
        .eq("instance_id", instanceId);
      if (error) throw error;
      const pIds = (assignments ?? []).map((a: any) => a.participant_id);
      if (!pIds.length) return [];
      const { data, error: pErr } = await supabase
        .from("participants")
        .select("id, full_name, first_name, surname, gender, date_of_birth, sub_group_id")
        .in("id", pIds);
      if (pErr) throw pErr;
      return data ?? [];
    },
  });

  const pIds = (participants ?? []).map((p: any) => p.id);

  // Fetch medical info
  const { data: medicalInfo, isLoading: mLoading } = useQuery({
    queryKey: ["medical-info", instanceId],
    enabled: pIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participant_medical_info")
        .select("*")
        .in("participant_id", pIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch dietary info
  const { data: dietaryInfo, isLoading: dLoading } = useQuery({
    queryKey: ["dietary-info", instanceId],
    enabled: pIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participant_dietary_needs")
        .select("*")
        .in("participant_id", pIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const medMap = Object.fromEntries((medicalInfo ?? []).map((m: any) => [m.participant_id, m]));
  const dietMap = Object.fromEntries((dietaryInfo ?? []).map((d: any) => [d.participant_id, d]));

  const isLoading = pLoading || mLoading || dLoading;

  // Enrich participants
  const enriched = (participants ?? []).map((p: any) => ({
    ...p,
    medical: medMap[p.id] ?? null,
    dietary: dietMap[p.id] ?? null,
    hasAllergies: (medMap[p.id]?.allergies ?? []).length > 0,
    hasConditions: (medMap[p.id]?.conditions ?? []).length > 0,
    hasDietary: (dietMap[p.id]?.restrictions ?? []).length > 0,
    isCritical: (medMap[p.id]?.allergies ?? []).some((a: string) => /anaphyla|epipen|severe|insulin/i.test(a)) ||
      (medMap[p.id]?.conditions ?? []).some((c: string) => /epilep|diabet|asthma|anaphyla/i.test(c)),
  }));

  const filtered = enriched.filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.full_name.toLowerCase().includes(q) ||
      (p.medical?.allergies ?? []).some((a: string) => a.toLowerCase().includes(q)) ||
      (p.medical?.conditions ?? []).some((c: string) => c.toLowerCase().includes(q)) ||
      (p.dietary?.restrictions ?? []).some((r: string) => r.toLowerCase().includes(q));
  });

  // Stats
  const criticalCount = enriched.filter((p: any) => p.isCritical).length;
  const allergyCount = enriched.filter((p: any) => p.hasAllergies).length;
  const dietaryCount = enriched.filter((p: any) => p.hasDietary).length;
  const conditionCount = enriched.filter((p: any) => p.hasConditions).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Total Participants</p>
          <p className="text-xl font-semibold text-foreground">{enriched.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Critical Alerts</p>
            <p className="text-xl font-semibold text-destructive">{criticalCount}</p>
          </div>
          {criticalCount > 0 && <ShieldAlert className="w-6 h-6 text-destructive opacity-60 ml-auto" />}
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">With Allergies</p>
          <p className="text-xl font-semibold text-foreground">{allergyCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Dietary Restrictions</p>
          <p className="text-xl font-semibold text-foreground">{dietaryCount}</p>
        </div>
      </div>

      {criticalCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{criticalCount} participant{criticalCount > 1 ? "s" : ""}</strong> with critical medical conditions (anaphylaxis, epilepsy, diabetes, severe asthma). Review flagged entries below.
          </AlertDescription>
        </Alert>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name, allergy, condition..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="h-8">
          <TabsTrigger value="all" className="text-xs h-7">All ({enriched.length})</TabsTrigger>
          <TabsTrigger value="critical" className="text-xs h-7 gap-1"><ShieldAlert className="w-3 h-3" />Critical ({criticalCount})</TabsTrigger>
          <TabsTrigger value="allergies" className="text-xs h-7 gap-1"><AlertTriangle className="w-3 h-3" />Allergies ({allergyCount})</TabsTrigger>
          <TabsTrigger value="dietary" className="text-xs h-7 gap-1"><Utensils className="w-3 h-3" />Dietary ({dietaryCount})</TabsTrigger>
          <TabsTrigger value="conditions" className="text-xs h-7 gap-1"><Pill className="w-3 h-3" />Conditions ({conditionCount})</TabsTrigger>
        </TabsList>

        {["all", "critical", "allergies", "dietary", "conditions"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (() => {
              let rows = filtered;
              if (tab === "critical") rows = rows.filter((p: any) => p.isCritical);
              if (tab === "allergies") rows = rows.filter((p: any) => p.hasAllergies);
              if (tab === "dietary") rows = rows.filter((p: any) => p.hasDietary);
              if (tab === "conditions") rows = rows.filter((p: any) => p.hasConditions);

              if (rows.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Heart className="w-10 h-10 mb-3 opacity-40" />
                    <p className="font-medium">No records found</p>
                  </div>
                );
              }

              return (
                <div className="bg-card rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Participant</TableHead>
                        <TableHead>Allergies</TableHead>
                        <TableHead>Medical Conditions</TableHead>
                        <TableHead>Dietary Restrictions</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((p: any) => (
                        <TableRow key={p.id} className={p.isCritical ? "bg-destructive/5" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {p.isCritical && <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />}
                              <div>
                                <p className="text-sm font-medium text-foreground">{p.full_name}</p>
                                {p.date_of_birth && (
                                  <p className="text-xs text-muted-foreground">
                                    DOB: {new Date(p.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(p.medical?.allergies ?? []).map((a: string, i: number) => (
                                <Badge key={i} variant="outline" className={`text-[10px] ${/anaphyla|epipen|severe/i.test(a) ? "border-destructive text-destructive" : ""}`}>{a}</Badge>
                              ))}
                              {(p.medical?.allergies ?? []).length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(p.medical?.conditions ?? []).map((c: string, i: number) => (
                                <Badge key={i} variant="secondary" className={`text-[10px] ${/epilep|diabet|asthma/i.test(c) ? "border-destructive text-destructive bg-destructive/10" : ""}`}>{c}</Badge>
                              ))}
                              {(p.medical?.conditions ?? []).length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(p.dietary?.restrictions ?? []).map((r: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-[10px] border-amber-500/30 text-amber-700 dark:text-amber-400">{r}</Badge>
                              ))}
                              {(p.dietary?.restrictions ?? []).length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">
                              {[p.medical?.notes, p.dietary?.notes].filter(Boolean).join("; ") || "—"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })()}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
