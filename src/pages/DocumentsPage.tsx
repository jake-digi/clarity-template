import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const DocumentsPage = () => {
  const navigate = useNavigate();
  const { data: instances = [], isLoading } = useQuery({
    queryKey: ["instances-for-docs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instances")
        .select("id, name, status")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: docCounts = {} } = useQuery({
    queryKey: ["doc-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instance_documents")
        .select("instance_id")
        .is("deleted_at", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((d: any) => {
        counts[d.instance_id] = (counts[d.instance_id] || 0) + 1;
      });
      return counts;
    },
  });

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <div className="bg-card border-b border-border px-6 py-5">
            <p className="text-xs text-muted-foreground mb-1">Dashboard / Documents</p>
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Document Management</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Manage consent forms, risk assessments, and site maps per instance.</p>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : instances.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No instances found</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg divide-y divide-border">
                {instances.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => navigate(`/instances/${inst.id}?tab=documents`)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{inst.name}</p>
                      <p className="text-xs text-muted-foreground">{inst.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{docCounts[inst.id] ?? 0} docs</Badge>
                      <Badge variant={inst.status === "active" ? "default" : "secondary"} className="capitalize">{inst.status}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocumentsPage;
