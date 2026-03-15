import { Users, Briefcase, Building2, Send, Smartphone } from "lucide-react";
import qrCode from "@/assets/qr-checkpoint.png";
import qrCode from "@/assets/qr-checkpoint.png";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DashboardOverview = () => {
  const [sendMode, setSendMode] = useState<"single" | "bulk">("single");
  const [recipient, setRecipient] = useState("");
  const [bulkRecipients, setBulkRecipients] = useState("");

  // Fetch tenant info
  const { data: tenant } = useQuery({
    queryKey: ["tenant-info"],
    queryFn: async () => {
      const { data: userData } = await supabase
        .from("users")
        .select("tenant_id")
        .limit(1)
        .single();
      if (!userData) return null;
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", userData.tenant_id)
        .single();
      return tenantData;
    },
  });

  // Fetch quick stats
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [usersRes, participantsRes, instancesRes, casesRes] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("participants").select("id", { count: "exact", head: true }),
        supabase.from("instances").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "active"),
        supabase.from("behavior_cases").select("id", { count: "exact", head: true }).eq("status", "open"),
      ]);
      return {
        users: usersRes.count ?? 0,
        participants: participantsRes.count ?? 0,
        instances: instancesRes.count ?? 0,
        openCases: casesRes.count ?? 0,
      };
    },
  });

  const handleSend = () => {
    alert("Sending functionality requires backend setup. Coming soon!");
  };

  const quickStats = [
    { label: "Users", value: stats?.users ?? "—", icon: Users },
    { label: "Participants", value: stats?.participants ?? "—", icon: Users },
    { label: "Active Instances", value: stats?.instances ?? "—", icon: Building2 },
    { label: "Open Cases", value: stats?.openCases ?? "—", icon: Briefcase },
  ];

  return (
    <div className="space-y-3">
      {/* Hero Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Welcome + Tenant Info — 4/5 */}
        <div className="lg:col-span-4 bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Dashboard</p>
              <h2 className="text-xl font-bold text-foreground">Welcome back</h2>
            </div>
            <Badge variant="outline" className="bg-[hsl(var(--success)/0.08)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.2)] text-xs font-medium">
              Active
            </Badge>
          </div>

          {/* Tenant details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Organisation</p>
              <p className="text-sm font-semibold text-foreground">{tenant?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Reference</p>
              <p className="text-sm font-medium text-foreground font-mono">{tenant?.reference_number ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Status</p>
              <p className="text-sm font-medium text-foreground">{tenant?.is_active ? "Active" : "Inactive"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Since</p>
              <p className="text-sm font-medium text-foreground">
                {tenant?.created_at
                  ? new Date(tenant.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3">
            {quickStats.map((s) => (
              <div key={s.label} className="bg-muted/50 rounded-md px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="text-lg font-bold text-foreground leading-tight mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* App Download Card */}
        <div className="bg-card rounded-lg border border-border p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Checkpoint App</span>
          </div>

          <div className="flex items-center gap-4 flex-1">
            <Dialog>
              <DialogTrigger asChild>
                <button className="shrink-0 w-24 h-24 rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-border">
                  <img src={qrCode} alt="QR Code" className="w-full h-full object-cover" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xs flex flex-col items-center gap-4 p-8">
                <DialogHeader>
                  <DialogTitle>Scan to Download</DialogTitle>
                </DialogHeader>
                <img src={qrCode} alt="QR Code" className="w-64 h-64 object-cover rounded-lg" />
                <p className="text-sm text-muted-foreground text-center">Scan with your phone camera to download Checkpoint.</p>
              </DialogContent>
            </Dialog>

            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex gap-2">
                <a href="#" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent hover:bg-accent/80 transition-colors text-xs font-medium text-foreground">
                  <SiApple className="w-3.5 h-3.5" /> iOS
                </a>
                <a href="#" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent hover:bg-accent/80 transition-colors text-xs font-medium text-foreground">
                  <SiGoogleplay className="w-3.5 h-3.5" /> Android
                </a>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs w-fit">
                    <Send className="w-3 h-3" /> Send Link
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Send Download Link</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSendMode("single")}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${sendMode === "single" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                      >
                        Single
                      </button>
                      <button
                        onClick={() => setSendMode("bulk")}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${sendMode === "bulk" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                      >
                        Bulk
                      </button>
                    </div>
                    {sendMode === "single" ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Email or phone</label>
                        <input
                          type="text"
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="email@example.com or +44..."
                          className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Recipients (one per line)</label>
                        <textarea
                          value={bulkRecipients}
                          onChange={(e) => setBulkRecipients(e.target.value)}
                          placeholder={"email1@example.com\nemail2@example.com"}
                          rows={5}
                          className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                      </div>
                    )}
                    <Button onClick={handleSend} className="w-full gap-2">
                      <Send className="w-4 h-4" />
                      {sendMode === "single" ? "Send Link" : "Send to All"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs w-fit">
                    <QrCode className="w-3 h-3" /> View QR
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xs flex flex-col items-center gap-4 p-8">
                  <DialogHeader>
                    <DialogTitle>App Download QR</DialogTitle>
                  </DialogHeader>
                  <img src={qrCode} alt="QR Code" className="w-64 h-64 object-cover rounded-lg" />
                  <p className="text-sm text-muted-foreground text-center">Display this QR code for users to scan and download the app.</p>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
