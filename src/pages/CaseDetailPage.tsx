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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight, ArrowLeft, User, Calendar, MapPin, AlertTriangle,
  Shield, MessageSquare, Clock, Activity, Send, EyeOff, Bell, ChevronDown
} from "lucide-react";
import { toast } from "sonner";

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const statusOptions = ["pending", "open", "in-progress", "closed", "resolved"];

type TimelineEntry = {
  id: string;
  type: "action" | "comment";
  timestamp: string;
  content: string;
  author: string;
};

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
    if (!c || !caseId || !user || newStatus === c.status) return;
    updateStatus.mutate(
      { caseId, newStatus, oldStatus: c.status, performedBy: user.id, performedByName: user.email ?? "Unknown" },
      {
        onSuccess: () => toast.success(`Status changed to ${newStatus}`),
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  // Merge actions + comments into a single sorted timeline
  const timeline: TimelineEntry[] = [
    ...(actions ?? []).map((a) => ({
      id: a.id,
      type: "action" as const,
      timestamp: a.timestamp,
      content: a.description ?? "",
      author: a.performed_by_name ?? "System",
    })),
    ...(comments ?? []).map((cm) => ({
      id: cm.id,
      type: "comment" as const,
      timestamp: cm.timestamp,
      content: cm.content,
      author: cm.author_name,
    })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

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
          {/* Header with details moved here */}
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize cursor-pointer ${severityColors[c.severity_level]}`}>
                        {c.severity_level}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {(["low", "medium", "high", "critical"] as const).map((s) => (
                        <DropdownMenuItem
                          key={s}
                          className="capitalize"
                          onClick={() => handleSeverityChange(s)}
                        >
                          {s}
                          {s === c.severity_level && <span className="ml-auto text-xs text-muted-foreground">current</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Status dropdown in header */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border border-border bg-background text-foreground capitalize hover:bg-muted transition-colors">
                        {c.status}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {statusOptions.map((s) => (
                        <DropdownMenuItem
                          key={s}
                          className="capitalize"
                          onClick={() => handleStatusChange(s)}
                        >
                          {s}
                          {s === c.status && <span className="ml-auto text-xs text-muted-foreground">current</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-muted-foreground">{c.participant_name} · {c.instance_name}</p>

                {/* Case details row */}
                <div className="flex items-center gap-5 mt-3 flex-wrap">
                  <DetailChip icon={User} label="Assigned" value={c.assigned_to_name ?? "Unassigned"} />
                  <DetailChip icon={Calendar} label="Raised" value={new Date(c.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
                  <DetailChip icon={MapPin} label="Location" value={c.location || "—"} />
                  <DetailChip icon={Shield} label="Category" value={c.category} />
                  {/* Flags as small indicators */}
                  {c.requires_immediate_action && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                      <AlertTriangle className="w-3 h-3" /> Immediate Action
                    </span>
                  )}
                  {c.is_sensitive_safeguarding && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                      <EyeOff className="w-3 h-3" /> Safeguarding
                    </span>
                  )}
                  {c.involves_staff_member && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600">
                      <User className="w-3 h-3" /> Staff Involved
                    </span>
                  )}
                  {c.parent_notification_sent && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Bell className="w-3 h-3" /> Parent Notified
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" onClick={() => navigate("/cases")} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              </div>
            </div>
          </div>

          {/* Single-column content: overview + unified timeline */}
          <div className="p-6 max-w-4xl space-y-6">
            {/* Overview */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Overview</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.overview || "No overview provided."}</p>
            </div>

            {/* Unified Activity & Comments Timeline */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Activity & Comments
              </h2>
              <div className="space-y-4">
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  timeline.map((entry) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        entry.type === "comment" ? "bg-primary/10" : "bg-muted"
                      }`}>
                        {entry.type === "comment" ? (
                          <MessageSquare className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {entry.type === "comment" ? (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-foreground">{entry.author}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">{entry.content}</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-foreground">{entry.content}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {entry.author} · {new Date(entry.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment inline at bottom of timeline */}
              <div className="mt-5 pt-4 border-t border-border">
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
          </div>
        </main>
      </div>
    </div>
  );
};

const DetailChip = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
    <Icon className="w-3.5 h-3.5" />
    <span className="text-xs text-muted-foreground/70">{label}:</span>
    <span className="text-foreground text-xs font-medium capitalize">{value}</span>
  </div>
);

export default CaseDetailPage;
