import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bus, Search, MapPin, Users, Clock } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, "default" | "secondary" | "outline"> = {
  scheduled: "outline", "in-transit": "default", completed: "secondary", cancelled: "secondary",
};

const TransportPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: legs, isLoading } = useQuery({
    queryKey: ["all-transport-legs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transport_legs")
        .select("*")
        .order("departure_time", { ascending: true });
      if (error) throw error;

      const instanceIds = [...new Set((data ?? []).map((l: any) => l.instance_id))];
      const vehicleIds = [...new Set((data ?? []).map((l: any) => l.vehicle_id).filter(Boolean))];

      const [iRes, vRes] = await Promise.all([
        instanceIds.length ? supabase.from("instances").select("id, name").in("id", instanceIds) : { data: [] },
        vehicleIds.length ? supabase.from("transport_vehicles").select("id, name").in("id", vehicleIds) : { data: [] },
      ]);

      const iMap = Object.fromEntries((iRes.data ?? []).map((i: any) => [i.id, i.name]));
      const vMap = Object.fromEntries((vRes.data ?? []).map((v: any) => [v.id, v.name]));

      return (data ?? []).map((l: any) => ({
        ...l,
        instance_name: iMap[l.instance_id] ?? l.instance_id,
        vehicle_name: l.vehicle_id ? vMap[l.vehicle_id] ?? "Unknown" : "Unassigned",
      }));
    },
  });

  const filtered = (legs ?? []).filter((l: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.departure_location.toLowerCase().includes(q) || l.arrival_location.toLowerCase().includes(q) || l.instance_name?.toLowerCase().includes(q);
  });

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <div className="bg-card border-b border-border px-6 py-5">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Transport & Logistics</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage coaches, journeys, and passenger manifests across all instances</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search journeys..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bus className="w-10 h-10 mb-3 opacity-40" />
                <p className="font-medium">No journeys found</p>
                <p className="text-sm mt-1">Transport legs are managed per instance</p>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instance</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Departure</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((l: any) => (
                      <TableRow key={l.id} className="cursor-pointer" onClick={() => navigate(`/instances/${l.instance_id}`)}>
                        <TableCell className="text-sm font-medium text-foreground">{l.instance_name}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize text-xs">{l.leg_type}</Badge></TableCell>
                        <TableCell className="text-sm">{l.departure_location} → {l.arrival_location}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {l.departure_time ? format(new Date(l.departure_time), "d MMM, HH:mm") : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.vehicle_name}</TableCell>
                        <TableCell><Badge variant={statusColors[l.status] ?? "outline"} className="capitalize text-xs">{l.status}</Badge></TableCell>
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

export default TransportPage;
