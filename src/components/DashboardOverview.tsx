import { MapPin, Users, Briefcase, TrendingUp, Send, Apple, PlayCircle, Smartphone, CalendarCheck, ShieldCheck } from "lucide-react";
import qrCode from "@/assets/qr-checkpoint.png";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const stats = [
  { label: "Total Participants", value: "1,247", icon: Users, trend: "+12%" },
  { label: "Active Cases", value: "38", icon: Briefcase, trend: "-3%" },
  { label: "Attendance Today", value: "96%", icon: CalendarCheck, trend: "+2%" },
  { label: "Safeguarding Alerts", value: "3", icon: ShieldCheck, trend: "" },
];

const StatCard = ({ label, value, icon: Icon, trend }: typeof stats[0]) => (
  <div className="bg-card rounded-lg p-5 border border-border flex flex-col justify-between gap-3">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
        <Icon className="w-4 h-4 text-icon-primary" />
      </div>
    </div>
    <div className="flex items-end gap-2">
      <span className="text-2xl font-bold text-foreground leading-none">{value}</span>
      {trend && (
        <span className={`text-xs font-medium mb-0.5 ${trend.startsWith("+") ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
          <TrendingUp className="w-3 h-3 inline mr-0.5" />
          {trend}
        </span>
      )}
    </div>
  </div>
);

const DashboardOverview = () => {
  const [sendMode, setSendMode] = useState<"single" | "bulk">("single");
  const [recipient, setRecipient] = useState("");
  const [bulkRecipients, setBulkRecipients] = useState("");

  const handleSend = () => {
    alert("Sending functionality requires backend setup. Coming soon!");
  };

  return (
    <div className="space-y-3">
      {/* Top Row: Welcome + QR Download */}
      <div className="grid grid-cols-3 gap-3">
        {/* Welcome Card — 2/3 */}
        <div className="col-span-2 bg-card rounded-lg border border-border p-6 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Dashboard</p>
            <h2 className="text-xl font-semibold text-foreground">Welcome back, Admin</h2>
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="w-4 h-4 text-icon-primary" />
              <span className="text-sm text-muted-foreground">Checkpoint North</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] font-medium">
                Tenant Active
              </span>
            </div>
          </div>
        </div>

        {/* Mobile App Card — 1/3 */}
        <div className="bg-card rounded-lg border border-border p-5 flex gap-4 items-center">
          <div className="shrink-0 w-24 h-24 rounded-lg border border-border bg-background p-1.5 flex items-center justify-center">
            <img src={qrCode} alt="Download WMS Mobile QR Code" className="w-full h-full object-contain rounded" />
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-icon-primary" />
              <span className="text-sm font-semibold text-foreground">WMS Mobile</span>
            </div>
            <div className="flex gap-2">
              <a href="#" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent hover:bg-accent/80 transition-colors text-xs font-medium text-foreground">
                <Apple className="w-3.5 h-3.5" /> iOS
              </a>
              <a href="#" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent hover:bg-accent/80 transition-colors text-xs font-medium text-foreground">
                <PlayCircle className="w-3.5 h-3.5" /> Android
              </a>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 h-7 text-xs w-fit">
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
                      Single Send
                    </button>
                    <button
                      onClick={() => setSendMode("bulk")}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${sendMode === "bulk" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                    >
                      Bulk Send
                    </button>
                  </div>
                  {sendMode === "single" ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email or phone number</label>
                      <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="email@example.com or +44..." className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Recipients (one per line)</label>
                      <textarea value={bulkRecipients} onChange={(e) => setBulkRecipients(e.target.value)} placeholder={"email1@example.com\nemail2@example.com\n+447..."} rows={5} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                    </div>
                  )}
                  <Button onClick={handleSend} className="w-full gap-2">
                    <Send className="w-4 h-4" />
                    {sendMode === "single" ? "Send Link" : "Send to All"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
};

export default DashboardOverview;
