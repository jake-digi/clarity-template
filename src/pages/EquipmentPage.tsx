import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Package, Search, AlertTriangle } from "lucide-react";

const conditionColors: Record<string, string> = {
  good: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  fair: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  poor: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  damaged: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const EquipmentPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: items, isLoading } = useQuery({
    queryKey: ["all-equipment-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_items")
        .select("*")
        .is("deleted_at", null)
        .order("category")
        .order("name");
      if (error) throw error;

      const instanceIds = [...new Set((data ?? []).map((i: any) => i.instance_id).filter(Boolean))];
      const iRes = instanceIds.length ? await supabase.from("instances").select("id, name").in("id", instanceIds) : { data: [] };
      const iMap = Object.fromEntries((iRes.data ?? []).map((i: any) => [i.id, i.name]));

      return (data ?? []).map((i: any) => ({ ...i, instance_name: i.instance_id ? iMap[i.instance_id] ?? i.instance_id : "Global" }));
    },
  });

  const filtered = (items ?? []).filter((i: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.instance_name?.toLowerCase().includes(q);
  });

  const totalItems = (items ?? []).reduce((s: number, i: any) => s + i.total_quantity, 0);
  const availableItems = (items ?? []).reduce((s: number, i: any) => s + i.available_quantity, 0);
  const availPct = totalItems > 0 ? (availableItems / totalItems) * 100 : 100;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <div className="bg-card border-b border-border px-6 py-5">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Equipment & Kit</h1>
            <p className="text-sm text-muted-foreground mt-1">Track inventory, checkouts, and returns across all instances</p>
          </div>
          <div className="p-6 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Items</p>
                <p className="text-xl font-semibold text-foreground">{totalItems}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-xl font-semibold text-foreground">{availableItems}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Checked Out</p>
                <p className="text-xl font-semibold text-foreground">{totalItems - availableItems}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Availability</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={availPct} className="h-2 flex-1" />
                  <span className="text-xs font-medium text-foreground">{Math.round(availPct)}%</span>
                </div>
              </div>
            </div>

            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search equipment..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Package className="w-10 h-10 mb-3 opacity-40" />
                <p className="font-medium">No equipment found</p>
                <p className="text-sm mt-1">Equipment is managed per instance</p>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Instance</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item: any) => {
                      const lowStock = item.available_quantity === 0;
                      return (
                        <TableRow key={item.id} className="cursor-pointer" onClick={() => item.instance_id && navigate(`/instances/${item.instance_id}`)}>
                          <TableCell>
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            {item.serial_number && <p className="text-xs text-muted-foreground">S/N: {item.serial_number}</p>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.instance_name}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize text-xs">{item.category}</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {lowStock && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                              <span className={`text-sm font-medium ${lowStock ? "text-destructive" : "text-foreground"}`}>
                                {item.available_quantity}/{item.total_quantity}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${conditionColors[item.condition] ?? ""}`}>
                              {item.condition}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.location ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })}
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

export default EquipmentPage;
