import { useState } from "react";
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from "@/hooks/useAnnouncements";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Megaphone, Plus, Pin, Trash2, Eye, AlertTriangle, Info, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenantId } from "@/hooks/useTenantId";



const priorityConfig: Record<string, { label: string; color: string; icon: typeof Bell }> = {
  urgent: { label: "Urgent", color: "text-destructive", icon: AlertTriangle },
  high: { label: "High", color: "text-[hsl(var(--warning))]", icon: Bell },
  normal: { label: "Normal", color: "text-foreground", icon: Info },
  low: { label: "Low", color: "text-muted-foreground", icon: Info },
};

const InstanceAnnouncementsTab = ({ instanceId }: { instanceId: string }) => {
  const { data: announcements = [], isLoading } = useAnnouncements(instanceId);
  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();
  const { toast } = useToast();
  const { data: tenantId } = useTenantId();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [pinned, setPinned] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    try {
      await createMutation.mutateAsync({
        tenant_id: tenantId,
        instance_id: instanceId,
        title: title.trim(),
        content: content.trim(),
        priority,
        is_pinned: pinned,
      });
      toast({ title: "Announcement published" });
      setOpen(false);
      setTitle("");
      setContent("");
      setPriority("normal");
      setPinned(false);
    } catch {
      toast({ title: "Failed to create announcement", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Announcement removed" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Announcements</h3>
          <Badge variant="secondary">{announcements.length}</Badge>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" />New Announcement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea placeholder="Announcement content..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
              <div className="flex gap-3">
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="normal">🔵 Normal</SelectItem>
                    <SelectItem value="low">⚪ Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant={pinned ? "default" : "outline"} size="sm" onClick={() => setPinned(!pinned)} className="gap-1.5">
                  <Pin className="w-3.5 h-3.5" />{pinned ? "Pinned" : "Pin"}
                </Button>
              </div>
              <Button onClick={handleCreate} disabled={!title.trim() || !content.trim()} className="w-full">Publish Announcement</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const cfg = priorityConfig[a.priority] || priorityConfig.normal;
            const Icon = cfg.icon;
            return (
              <div key={a.id} className={`bg-card border border-border rounded-lg p-4 ${a.is_pinned ? "ring-1 ring-primary/20" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                      <h4 className="font-semibold text-foreground text-sm truncate">{a.title}</h4>
                      {a.is_pinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
                      <Badge variant="outline" className="text-[10px] shrink-0">{cfg.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{new Date(a.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      {a.created_by_name && <span>by {a.created_by_name}</span>}
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{a.read_count ?? 0} read</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InstanceAnnouncementsTab;
