import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from "@/hooks/useAnnouncements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Megaphone, Plus, Pin, Trash2, Eye, AlertTriangle, Info, Bell, Search } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTenantId } from "@/hooks/useTenantId";
import { Skeleton } from "@/components/ui/skeleton";

const priorityConfig: Record<string, { label: string; color: string; icon: typeof Bell }> = {
  urgent: { label: "Urgent", color: "text-destructive", icon: AlertTriangle },
  high: { label: "High", color: "text-[hsl(var(--warning))]", icon: Bell },
  normal: { label: "Normal", color: "text-foreground", icon: Info },
  low: { label: "Low", color: "text-muted-foreground", icon: Info },
};

const AnnouncementsPage = () => {
  const { data: announcements = [], isLoading } = useAnnouncements();
  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();
  const { toast } = useToast();
  const { data: tenantId } = useTenantId();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [pinned, setPinned] = useState(false);
  const [search, setSearch] = useState("");

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    try {
      await createMutation.mutateAsync({
        tenant_id: tenantId,
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
      toast({ title: "Failed to create", variant: "destructive" });
    }
  };

  const filtered = announcements.filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <div className="bg-card border-b border-border px-6 py-5">
            <p className="text-xs text-muted-foreground mb-1">Dashboard / Announcements</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Megaphone className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-semibold text-foreground">Announcements</h1>
                <Badge variant="secondary">{announcements.length}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-56 h-9" />
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" />New Announcement</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                      <Textarea placeholder="Content..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
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
                      <Button onClick={handleCreate} disabled={!title.trim() || !content.trim()} className="w-full">Publish</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {isLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No announcements</p>
              </div>
            ) : (
              filtered.map((a) => {
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
                          <Badge variant="outline" className="text-[10px]">{cfg.label}</Badge>
                          {a.instance_id && <Badge variant="secondary" className="text-[10px]">{a.instance_id}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{a.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{new Date(a.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                          {a.created_by_name && <span>by {a.created_by_name}</span>}
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{a.read_count ?? 0} read</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(a.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
