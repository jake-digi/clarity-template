import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useCase, useCaseActions, useCaseComments, useAddCaseComment, useUpdateCaseStatus } from "@/hooks/useCases";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight, ArrowLeft, User, Calendar, MapPin, AlertTriangle,
  Shield, MessageSquare, Clock, Activity, Send, Eye, EyeOff, Bell
} from "lucide-react";
import { toast } from "sonner";

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const statusOptions = ["pending", "open", "in-progress", "closed", "resolved"];

const CaseDetailPage = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: c, isLoading } = useCase(caseId ?? "");
  const { data: actions } = useCaseActions(caseId ?? "");
  const { data: comments } = useCaseComments(caseId ?? "");
  const addComment = useAddCaseComment();
  const updateStatus = useUpdateCaseStatus();
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (!newComment.trim() || !caseId || !user) return;
    addComment.mutate(
      { case_id: caseId, author_id: user.id, author_name: user.email ?? "Unknown", content: newComment.trim() },
      {
        onSuccess: () => { setNewComment(""); toast.success("Comment added"); },
        onError: () => toast.error("Failed to add comment"),
      }
    );
  };

  const handleStatusChange = (newStatus: string) => {
    if (!c || !caseId || !user) return;
    updateStatus.mutate(
      { caseId, newStatus, oldStatus: c.status, performedBy: user.id, performedByName: user.email ?? "Unknown" },
      {
        onSuccess: () => toast.success(`Status changed to ${newStatus}`),
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 overflow-auto p-6">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </div>
    );
  }

  if (!c) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive font-medium">Case not found</p>
              <Button variant="outline" className="mt-3" onClick={() => navigate("/cases")}>Back to Cases</Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <div className="bg-card border-b border-border px-6 py-5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Dashboard</button>
              <ChevronRight className="w-3 h-3" />
              <button onClick={() => navigate("/cases")} className="hover:text-foreground transition-colors">Cases</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">{c.participant_name}</span>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">{c.category} Case</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[c.severity_level]}`}>
                    {c.severity_level}
                  </span>
                  <Badge variant="outline" className="capitalize">{c.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{c.participant_name} · {c.instance_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => navigate("/cases")} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Overview</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.overview || "No overview provided."}</p>
              </div>

              {/* Timeline */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Activity Timeline
                </h2>
                <div className="space-y-4">
                  {(actions ?? []).length === 0 && (comments ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                  ) : (
                    <>
                      {(actions ?? []).map((a) => (
                        <div key={a.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{a.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {a.performed_by_name} · {new Date(a.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Comments ({(comments ?? []).length})
                </h2>
                <div className="space-y-4 mb-4">
                  {(comments ?? []).map((cm) => (
                    <div key={cm.id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-foreground">{cm.author_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(cm.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">{cm.content}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addComment.isPending}
                    size="icon"
                    className="shrink-0 self-end"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Status</h3>
                <Select value={c.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Details */}
              <div className="bg-card rounded-lg border border-border p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground mb-1">Details</h3>
                <DetailRow icon={User} label="Participant" value={c.participant_name ?? "—"} />
                <DetailRow icon={User} label="Assigned To" value={c.assigned_to_name ?? "Unassigned"} />
                <DetailRow icon={Calendar} label="Raised" value={new Date(c.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />
                <DetailRow icon={MapPin} label="Location" value={c.location || "—"} />
                <DetailRow icon={AlertTriangle} label="Severity" value={c.severity_level} />
                <DetailRow icon={Shield} label="Category" value={c.category} />
              </div>

              {/* Flags */}
              <div className="bg-card rounded-lg border border-border p-5 space-y-2.5">
                <h3 className="text-sm font-semibold text-foreground mb-1">Flags</h3>
                <FlagRow icon={AlertTriangle} label="Immediate Action" active={c.requires_immediate_action} />
                <FlagRow icon={EyeOff} label="Sensitive / Safeguarding" active={c.is_sensitive_safeguarding} />
                <FlagRow icon={User} label="Involves Staff" active={c.involves_staff_member} />
                <FlagRow icon={Bell} label="Parent Notified" active={c.parent_notification_sent} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-start gap-2.5">
    <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground capitalize">{value}</p>
    </div>
  </div>
);

const FlagRow = ({ icon: Icon, label, active }: { icon: React.ElementType; label: string; active: boolean }) => (
  <div className="flex items-center gap-2.5">
    <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-destructive" : "text-muted-foreground/40"}`} />
    <span className={`text-sm ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
    {active && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 ml-auto">Yes</Badge>}
  </div>
);

export default CaseDetailPage;
