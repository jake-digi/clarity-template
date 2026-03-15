import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useCase, useCaseActions, useCaseComments, useAddCaseComment, useUpdateCaseStatus } from "@/hooks/useCases";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight, ArrowLeft, User, Calendar as CalendarIcon, MapPin, AlertTriangle,
  Shield, MessageSquare, Clock, Activity, Send, EyeOff, Bell, ChevronDown,
  Heart, Smile, FileWarning, Users, Pencil
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const categoryOptions = ["Bullying", "Disruption", "Property Damage", "Safeguarding", "Verbal Abuse", "Physical Altercation", "Homesickness", "Other"];
const locationOptions = ["Main Hall", "Briefing Room", "Welfare Tent", "Dining Hall", "Accommodation Block", "Outdoor Area", "Sports Field", "Other"];

const statusOptions = ["pending", "open", "in-progress", "closed", "resolved"];

type TimelineEntry = {
  id: string;
  type: "action" | "comment";
  timestamp: string;
  content: string;
  author: string;
};

// Happiness gauge component (credit-score style)
const HappinessGauge = ({ score }: { score: number }) => {
  const clampedScore = Math.max(1, Math.min(5, score));
  // Map score 1-5 to angle 180°(left) to 0°(right) — higher score = more right
  const needleAngleDeg = 180 - ((clampedScore - 1) / 4) * 180;

  const getLabel = (s: number) => {
    if (s <= 1.8) return "Poor";
    if (s <= 2.6) return "Fair";
    if (s <= 3.4) return "Good";
    if (s <= 4.2) return "Very Good";
    return "Excellent";
  };

  const cx = 150, cy = 140, r = 100;

  // Convert polar (angle in degrees, 0=right, CCW) to cartesian
  const polarToXY = (angleDeg: number, radius: number) => ({
    x: cx + radius * Math.cos((angleDeg * Math.PI) / 180),
    y: cy - radius * Math.sin((angleDeg * Math.PI) / 180),
  });

  // Create arc path between two angles (degrees, 0=right, going CCW)
  const arcPath = (startDeg: number, endDeg: number, radius: number) => {
    const p1 = polarToXY(startDeg, radius);
    const p2 = polarToXY(endDeg, radius);
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    // Sweep flag 0 = CCW in SVG (which is CW visually since Y is flipped)
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArc} 0 ${p2.x} ${p2.y}`;
  };

  // 5 segments: left(180°) to right(0°). Left=Poor(green), Right=Excellent(red)
  const segments = [
    { start: 180, end: 144, color: "#22c55e", label: "POOR", range: "1.0-1.8" },
    { start: 144, end: 108, color: "#84cc16", label: "FAIR", range: "1.8-2.6" },
    { start: 108, end: 72, color: "#eab308", label: "GOOD", range: "2.6-3.4" },
    { start: 72, end: 36, color: "#f97316", label: "V.GOOD", range: "3.4-4.2" },
    { start: 36, end: 0, color: "#ef4444", label: "EXCELLENT", range: "4.2-5.0" },
  ];

  // Needle endpoint
  const needleTip = polarToXY(needleAngleDeg, r - 15);

  const segIdx = Math.min(4, Math.floor(((clampedScore - 1) / 4) * 5));

  return (
    <div className="flex flex-col items-center py-2">
      <svg viewBox="0 0 300 175" className="w-full max-w-[280px]">
        {/* Colored arc segments */}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={arcPath(seg.start, seg.end, r)}
            fill="none"
            stroke={seg.color}
            strokeWidth="24"
            strokeLinecap="butt"
          />
        ))}

        {/* Segment labels */}
        {segments.map((seg, i) => {
          const midAngle = (seg.start + seg.end) / 2;
          const labelPt = polarToXY(midAngle, r + 22);
          const rangePt = polarToXY(midAngle, r + 12);
          return (
            <g key={`lbl-${i}`}>
              <text x={labelPt.x} y={labelPt.y} textAnchor="middle" dominantBaseline="middle"
                className="fill-muted-foreground" fontSize="7" fontWeight="700" letterSpacing="0.5">
                {seg.label}
              </text>
              <text x={rangePt.x} y={rangePt.y + 7} textAnchor="middle" dominantBaseline="middle"
                className="fill-muted-foreground" fontSize="6" fontWeight="500">
                {seg.range}
              </text>
            </g>
          );
        })}

        {/* HAPPINESS SCORE label */}
        <text x={cx} y={cy - 30} textAnchor="middle" className="fill-foreground"
          fontSize="11" fontWeight="700" letterSpacing="1">
          HAPPINESS SCORE
        </text>

        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y}
          stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="8" fill="hsl(210, 10%, 45%)" />
        <circle cx={cx} cy={cy} r="4" fill="hsl(var(--card))" />
      </svg>

      <div className="text-center -mt-3">
        <p className="text-xl font-bold text-foreground">
          {clampedScore.toFixed(1)}
          <span className="text-sm text-muted-foreground font-normal"> / 5</span>
        </p>
        <p className="text-xs font-semibold" style={{ color: segments[segIdx].color }}>
          {getLabel(clampedScore)}
        </p>
      </div>
    </div>
  );
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

  // Fetch all cases for this participant (for summary + related)
  const { data: allParticipantCases } = useQuery({
    queryKey: ["participant-cases", c?.participant_id],
    enabled: !!c?.participant_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("behavior_cases")
        .select("id, category, severity_level, status, overview, created_at, participant_id")
        .eq("participant_id", c!.participant_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

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

  const qc = useQueryClient();

  const handleSeverityChange = async (newSeverity: string) => {
    if (!c || !caseId || newSeverity === c.severity_level) return;
    const { error } = await supabase.from("behavior_cases").update({ severity_level: newSeverity, updated_at: new Date().toISOString() }).eq("id", caseId);
    if (error) { toast.error("Failed to update severity"); return; }
    toast.success(`Severity changed to ${newSeverity}`);
    qc.invalidateQueries({ queryKey: ["behavior-case", caseId] });
    qc.invalidateQueries({ queryKey: ["behavior-cases"] });
  };

  const handleFieldUpdate = async (field: string, value: string | null) => {
    if (!caseId) return;
    const { error } = await supabase.from("behavior_cases").update({ [field]: value, updated_at: new Date().toISOString() } as any).eq("id", caseId);
    if (error) { toast.error(`Failed to update ${field}`); return; }
    toast.success(`${field.replace(/_/g, " ")} updated`);
    qc.invalidateQueries({ queryKey: ["behavior-case", caseId] });
    qc.invalidateQueries({ queryKey: ["behavior-cases"] });
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

  // Participant summary stats
  const relatedCases = (allParticipantCases ?? []).filter((rc) => rc.id !== caseId);
  const totalCases = allParticipantCases?.length ?? 0;
  const behaviourCases = (allParticipantCases ?? []).filter((rc) => rc.category === "Bullying" || rc.category === "Disruption" || rc.category === "Property Damage").length;
  const welfareCases = (allParticipantCases ?? []).filter((rc) => rc.category === "Safeguarding" || rc.category === "Other").length;
  const openCases = (allParticipantCases ?? []).filter((rc) => rc.status === "open" || rc.status === "in-progress" || rc.status === "pending").length;

  // Happiness score: 5 = no cases, decreases with severity and count
  const computeHappiness = () => {
    if (!allParticipantCases || allParticipantCases.length === 0) return 5;
    const severityWeight: Record<string, number> = { low: 0.3, medium: 0.6, high: 1.0, critical: 1.5 };
    const total = allParticipantCases.reduce((acc, rc) => acc + (severityWeight[rc.severity_level] ?? 0.5), 0);
    return Math.max(1, Math.min(5, 5 - total * 0.8));
  };
  const happinessScore = computeHappiness();

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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize cursor-pointer ${severityColors[c.severity_level]}`}>
                        {c.severity_level}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {(["low", "medium", "high", "critical"] as const).map((s) => (
                        <DropdownMenuItem key={s} className="capitalize" onClick={() => handleSeverityChange(s)}>
                          {s}
                          {s === c.severity_level && <span className="ml-auto text-xs text-muted-foreground">current</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border border-border bg-background text-foreground capitalize hover:bg-muted transition-colors">
                        {c.status}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {statusOptions.map((s) => (
                        <DropdownMenuItem key={s} className="capitalize" onClick={() => handleStatusChange(s)}>
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
                  <DetailChip icon={CalendarIcon} label="Raised" value={new Date(c.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />

                  {/* Event Time - editable */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs text-muted-foreground/70">Event Time:</span>
                        <span className="text-foreground text-xs font-medium">
                          {c.event_time
                            ? format(new Date(c.event_time), "d MMM yyyy, HH:mm")
                            : "Not set"}
                        </span>
                        <Pencil className="w-2.5 h-2.5 text-muted-foreground/50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={c.event_time ? new Date(c.event_time) : undefined}
                        onSelect={(date) => {
                          if (date) handleFieldUpdate("event_time", date.toISOString());
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Location - dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-xs text-muted-foreground/70">Location:</span>
                        <span className="text-foreground text-xs font-medium">{c.location || "—"}</span>
                        <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/50" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {locationOptions.map((loc) => (
                        <DropdownMenuItem key={loc} onClick={() => handleFieldUpdate("location", loc)}>
                          {loc}
                          {loc === c.location && <span className="ml-auto text-xs text-muted-foreground">current</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Category - dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Shield className="w-3.5 h-3.5" />
                        <span className="text-xs text-muted-foreground/70">Category:</span>
                        <span className="text-foreground text-xs font-medium">{c.category}</span>
                        <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/50" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {categoryOptions.map((cat) => (
                        <DropdownMenuItem key={cat} onClick={() => handleFieldUpdate("category", cat)}>
                          {cat}
                          {cat === c.category && <span className="ml-auto text-xs text-muted-foreground">current</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

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

          {/* Two-column layout */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Overview + Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Overview</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.overview || "No overview provided."}</p>
              </div>

              {/* Activity Timeline */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Activity Timeline
                </h2>
                <div className="space-y-4">
                  {(actions ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                  ) : (
                    (actions ?? []).map((a) => (
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
                    ))
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Comments ({(comments ?? []).length})
                </h2>
                <div className="space-y-4">
                  {(comments ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  ) : (
                    (comments ?? []).map((cm) => (
                      <div key={cm.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-foreground">{cm.author_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(cm.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">{cm.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

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

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* Participant Summary */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Smile className="w-4 h-4" /> Participant Summary
                </h3>

                {/* Happiness Gauge */}
                <HappinessGauge score={happinessScore} />

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <StatCard label="Total Cases" value={totalCases} icon={FileWarning} />
                  <StatCard label="Open" value={openCases} icon={AlertTriangle} variant={openCases > 0 ? "warning" : "default"} />
                  <StatCard label="Behaviour" value={behaviourCases} icon={Shield} />
                  <StatCard label="Welfare" value={welfareCases} icon={Heart} />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 text-xs gap-1.5"
                  onClick={() => navigate(`/participants/${c.participant_id}`)}
                >
                  <User className="w-3.5 h-3.5" /> View Participant Profile
                </Button>
              </div>

              {/* Related Cases */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Related Cases ({relatedCases.length})
                </h3>
                {relatedCases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No other cases for this participant.</p>
                ) : (
                  <div className="space-y-2.5">
                    {relatedCases.slice(0, 5).map((rc) => (
                      <button
                        key={rc.id}
                        onClick={() => navigate(`/cases/${rc.id}`)}
                        className="w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          rc.status === "open" || rc.status === "pending" || rc.status === "in-progress"
                            ? "bg-primary"
                            : "bg-muted-foreground/30"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {rc.category}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium capitalize ${severityColors[rc.severity_level]}`}>
                              {rc.severity_level}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">{rc.status}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(rc.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                          {rc.overview && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rc.overview}</p>
                          )}
                        </div>
                      </button>
                    ))}
                    {relatedCases.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{relatedCases.length - 5} more cases
                      </p>
                    )}
                  </div>
                )}
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

const StatCard = ({ label, value, icon: Icon, variant = "default" }: { label: string; value: number; icon: React.ElementType; variant?: "default" | "warning" }) => (
  <div className={`rounded-lg p-3 text-center ${variant === "warning" && value > 0 ? "bg-destructive/10 border border-destructive/20" : "bg-muted/50"}`}>
    <Icon className={`w-4 h-4 mx-auto mb-1 ${variant === "warning" && value > 0 ? "text-destructive" : "text-muted-foreground"}`} />
    <p className={`text-xl font-bold ${variant === "warning" && value > 0 ? "text-destructive" : "text-foreground"}`}>{value}</p>
    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
  </div>
);

export default CaseDetailPage;
