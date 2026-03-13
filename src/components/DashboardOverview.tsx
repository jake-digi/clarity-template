import { MapPin, Users, UserCheck, Briefcase, CalendarCheck, TrendingUp, Activity, Send, Apple, PlayCircle, Smartphone } from "lucide-react";
import qrCode from "@/assets/qr-checkpoint.png";
import { useState } from "react";
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
];

const StatCard = ({ label, value, icon: Icon, trend }: typeof stats[0]) => (
  <div className="bg-card rounded-lg p-4 border border-border flex flex-col gap-1">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-icon-primary" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <div className="flex items-end gap-2">
      <span className="text-xl font-bold text-foreground">{value}</span>
      {trend && (
        <span className={`text-xs font-medium mb-0.5 ${trend.startsWith("+") ? "text-green-600" : "text-red-500"}`}>
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
    <div className="grid grid-cols-4 gap-3">
      {/* 2/4 - Welcome + App Download */}
      <div className="col-span-2 bg-card rounded-lg p-5 border border-border">
        <h2 className="text-lg font-semibold text-foreground">Welcome back, Admin</h2>
        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span>Checkpoint North — Instance Active</span>
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1" />
        </div>

        <div className="flex items-center gap-4 mt-4">
          <img src={qrCode} alt="Download Checkpoint App QR Code" className="w-20 h-20 rounded" />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Smartphone className="w-3.5 h-3.5 text-icon-primary" />
              Checkpoint Mobile
            </div>
            <div className="flex gap-1.5">
              <a href="#" className="flex items-center gap-1 px-2 py-1 rounded bg-accent hover:bg-accent/80 transition-colors text-[10px] font-medium text-foreground">
                <Apple className="w-3 h-3" /> App Store
              </a>
              <a href="#" className="flex items-center gap-1 px-2 py-1 rounded bg-accent hover:bg-accent/80 transition-colors text-[10px] font-medium text-foreground">
                <PlayCircle className="w-3 h-3" /> Google Play
              </a>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-[10px] font-medium w-fit">
                  <Send className="w-2.5 h-2.5" /> Send Download Link
                </button>
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
                  <button onClick={handleSend} className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    {sendMode === "single" ? "Send Link" : "Send to All"}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <StatCard {...stats[0]} />
      <StatCard {...stats[1]} />
    </div>
  );
};

export default DashboardOverview;
