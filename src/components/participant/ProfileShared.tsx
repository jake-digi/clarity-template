import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export const statusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active": return "default" as const;
    case "inactive": return "secondary" as const;
    case "completed": return "outline" as const;
    case "withdrawn": return "destructive" as const;
    default: return "default" as const;
  }
};

export const InfoRow = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) => (
  <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
    {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value || "—"}</p>
    </div>
  </div>
);

export const SectionCard = ({ title, icon: Icon, children, actions }: { title: string; icon: React.ElementType; children: React.ReactNode; actions?: React.ReactNode }) => (
  <div className="bg-card rounded-lg border border-border">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {actions}
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
);

export const EmptyState = ({ icon: Icon, message }: { icon: React.ElementType; message: string }) => (
  <div className="py-8 text-center">
    <Icon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

export const EditButton = () => (
  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Pencil className="w-3 h-3" /> Edit</Button>
);
