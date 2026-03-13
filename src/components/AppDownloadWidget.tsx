import { Smartphone, Send, Apple, PlayCircle } from "lucide-react";
import qrCode from "@/assets/qr-checkpoint.png";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AppDownloadWidget = () => {
  const [sendMode, setSendMode] = useState<"single" | "bulk">("single");
  const [recipient, setRecipient] = useState("");
  const [bulkRecipients, setBulkRecipients] = useState("");

  const handleSend = () => {
    // Placeholder — needs Lovable Cloud for actual email/SMS sending
    alert("Sending functionality requires backend setup. Coming soon!");
  };

  return (
    <div className="bg-card rounded-lg p-2.5 text-sm flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Smartphone className="w-3.5 h-3.5 text-icon-primary" />
        <h3 className="font-semibold text-foreground text-[11px]">Checkpoint Mobile</h3>
      </div>

      <div className="flex gap-2 flex-1 min-h-0">
        <img src={qrCode} alt="Download Checkpoint App QR Code" className="w-20 h-20 rounded" />
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <p className="text-[9px] text-muted-foreground">Scan or download</p>
          <a href="#" className="flex items-center gap-1.5 px-2 py-1 rounded bg-accent hover:bg-accent/80 transition-colors text-[10px] font-medium text-foreground">
            <Apple className="w-3 h-3 shrink-0" /> App Store
          </a>
          <a href="#" className="flex items-center gap-1.5 px-2 py-1 rounded bg-accent hover:bg-accent/80 transition-colors text-[10px] font-medium text-foreground">
            <PlayCircle className="w-3 h-3 shrink-0" /> Google Play
          </a>
        </div>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center justify-center gap-1 w-full px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-[10px] font-medium mt-1.5">
            <Send className="w-2.5 h-2.5" />
            Send Link
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
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  sendMode === "single"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                Single Send
              </button>
              <button
                onClick={() => setSendMode("bulk")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  sendMode === "bulk"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                Bulk Send
              </button>
            </div>

            {sendMode === "single" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email or phone number
                </label>
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
                <label className="text-sm font-medium text-foreground">
                  Recipients (one per line)
                </label>
                <textarea
                  value={bulkRecipients}
                  onChange={(e) => setBulkRecipients(e.target.value)}
                  placeholder={"email1@example.com\nemail2@example.com\n+447..."}
                  rows={5}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            )}

            <button
              onClick={handleSend}
              className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sendMode === "single" ? "Send Link" : "Send to All"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppDownloadWidget;
