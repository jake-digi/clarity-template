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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronRight, ArrowLeft, User, Calendar as CalendarIcon, MapPin, AlertTriangle,
  Shield, MessageSquare, Clock, Activity, Send, EyeOff, Bell, ChevronDown,
  Heart, Smile, FileWarning, Users, Pencil, Phone, Mail, CalendarPlus,
  ShieldAlert, Siren, BookOpen, Gavel
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
const gaugeSegments = [
  { label: "POOR", range: "1.0-1.8", color: "#F44336", startAngle: 180, endAngle: 144 },
  { label: "FAIR", range: "1.8-2.6", color: "#FF9800", startAngle: 144, endAngle: 108 },
  { label: "GOOD", range: "2.6-3.4", color: "#CDDC39", startAngle: 108, endAngle: 72 },
  { label: "V.GOOD", range: "3.4-4.2", color: "#8BC34A", startAngle: 72, endAngle: 36 },
  { label: "EXCELLENT", range: "4.2-5.0", color: "#4CAF50", startAngle: 36, endAngle: 0 },
];

function gaugePolar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function scoreToAngle(score: number) {
  const clamped = Math.max(1, Math.min(5, score));
  return 180 - ((clamped - 1) / 4) * 180;
}

function getScoreColor(score: number) {
  if (score < 1.8) return "#F44336";
  if (score < 2.6) return "#FF9800";
  if (score < 3.4) return "#CDDC39";
  if (score < 4.2) return "#8BC34A";
  return "#4CAF50";
}

function getScoreLabel(score: number) {
  if (score <= 1.8) return "Poor";
  if (score <= 2.6) return "Fair";
  if (score <= 3.4) return "Good";
  if (score <= 4.2) return "Very Good";
  return "Excellent";
}

const HappinessGauge = ({ score }: { score: number }) => {
  const cx = 200, cy = 190, outerR = 150, innerR = 90, labelR = 170, rangeR = 120;
  const clampedScore = Math.max(1, Math.min(5, score));
  const needleAngle = scoreToAngle(clampedScore);

  const needleEnd = gaugePolar(cx, cy, outerR - 10, needleAngle);
  const needleBase1 = gaugePolar(cx, cy, 8, needleAngle + 90);
  const needleBase2 = gaugePolar(cx, cy, 8, needleAngle - 90);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 400 240" className="w-full max-w-[300px]">
        {gaugeSegments.map((seg, i) => {
          const outerStart = gaugePolar(cx, cy, outerR, seg.startAngle);
          const outerEnd = gaugePolar(cx, cy, outerR, seg.endAngle);
          const innerStart = gaugePolar(cx, cy, innerR, seg.endAngle);
          const innerEnd = gaugePolar(cx, cy, innerR, seg.startAngle);
          const largeArc = seg.startAngle - seg.endAngle > 180 ? 1 : 0;

          const d = [
            `M ${outerStart.x} ${outerStart.y}`,
            `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
            `L ${innerStart.x} ${innerStart.y}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
            "Z",
          ].join(" ");

          const midAngle = (seg.startAngle + seg.endAngle) / 2;
          const labelPos = gaugePolar(cx, cy, labelR, midAngle);
          const rangePos = gaugePolar(cx, cy, rangeR, midAngle);

          return (
            <g key={i}>
              <path d={d} fill={seg.color} />
              <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fontWeight="700" className="fill-foreground">
                {seg.label}
              </text>
              <text x={rangePos.x} y={rangePos.y} textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fontWeight="500" className="fill-muted-foreground">
                {seg.range}
              </text>
            </g>
          );
        })}

        {/* Needle */}
        <polygon
          points={`${needleEnd.x},${needleEnd.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill="hsl(var(--foreground))"
        />
        <circle cx={cx} cy={cy} r={12} fill="hsl(210, 10%, 40%)" />
        <circle cx={cx} cy={cy} r={6} fill="hsl(var(--card))" />
      </svg>

      <div className="text-center -mt-3">
        <p className="text-[10px] font-bold tracking-[3px] text-muted-foreground mb-1">HAPPINESS SCORE</p>
        <p className="text-2xl font-extrabold leading-none" style={{ color: getScoreColor(clampedScore) }}>
          {clampedScore.toFixed(1)}
          <span className="text-sm text-muted-foreground font-normal"> / 5</span>
        </p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: getScoreColor(clampedScore) }}>
          {getScoreLabel(clampedScore)}
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
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: string; label: string }>({ open: false, type: "", label: "" });
  const [actionNotes, setActionNotes] = useState("");
  const [strikeConfirmed, setStrikeConfirmed] = useState<Record<string, boolean>>({});

  // Fetch formal warning (strike) count for this participant
  const { data: strikeActions } = useQuery({
    queryKey: ["participant-strikes", c?.participant_id],
    enabled: !!c?.participant_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_actions")
        .select("id")
        .eq("participant_id", c!.participant_id)
        .eq("action_type", "formal_warning");
      if (error) throw error;
      return data ?? [];
    },
  });
  const strikeCount = strikeActions?.length ?? 0;

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

  const caseActionTypes = [
    { type: "formal_warning", label: "Formal Warning", icon: Gavel, variant: "warning" as const },
    { type: "phone_call", label: "Log Phone Call", icon: Phone, variant: "default" as const },
    { type: "follow_up", label: "Schedule Follow-up", icon: CalendarPlus, variant: "default" as const },
    { type: "email_parent", label: "Email Parent", icon: Mail, variant: "default" as const },
    { type: "safeguard", label: "Safeguard Case", icon: ShieldAlert, variant: "danger" as const },
    { type: "escalate", label: "Escalate", icon: Siren, variant: "danger" as const },
    { type: "add_note", label: "Add Case Note", icon: BookOpen, variant: "default" as const },
  ];

  const handleCaseAction = async () => {
    if (!caseId || !user || !c) return;
    const { error } = await supabase.from("case_actions").insert({
      case_id: caseId,
      instance_id: c.instance_id,
      participant_id: c.participant_id,
      action_type: actionDialog.type,
      description: `${actionDialog.label}${actionNotes.trim() ? `: ${actionNotes.trim()}` : ""}`,
      performed_by: user.id,
      performed_by_name: user.email ?? "Unknown",
    });
    if (error) { toast.error("Failed to log action"); return; }
    toast.success(`${actionDialog.label} logged`);
    setActionDialog({ open: false, type: "", label: "" });
    setActionNotes("");
    qc.invalidateQueries({ queryKey: ["case-actions", caseId] });
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
                {c.overview && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">{c.overview}</p>
                )}

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
              {/* Case Actions */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Gavel className="w-4 h-4" /> Case Actions
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {caseActionTypes.map((action) => (
                    <button
                      key={action.type}
                      onClick={() => { setActionDialog({ open: true, type: action.type, label: action.label }); setActionNotes(""); }}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                        action.variant === "warning" && "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
                        action.variant === "danger" && "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10",
                        action.variant === "default" && "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <action.icon className="w-5 h-5" />
                      <span className="text-[11px] font-medium text-center leading-tight">{action.label}</span>
                    </button>
                  ))}
                </div>
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

                {/* Formal Warnings (Strikes) */}
                <div className={cn(
                  "rounded-lg p-4 mb-4 border",
                  strikeCount === 0 && "bg-muted/50 border-border",
                  strikeCount === 1 && "bg-orange-50 border-orange-300",
                  strikeCount === 2 && "bg-orange-100 border-orange-400",
                  strikeCount >= 3 && "bg-destructive/10 border-destructive/40",
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gavel className={cn("w-5 h-5", strikeCount === 0 ? "text-muted-foreground" : strikeCount < 3 ? "text-orange-600" : "text-destructive")} />
                      <div>
                        <p className={cn("text-sm font-semibold", strikeCount === 0 ? "text-muted-foreground" : strikeCount < 3 ? "text-orange-700" : "text-destructive")}>
                          Formal Warnings
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          {strikeCount === 0 ? "No active warnings" : strikeCount === 1 ? "Warning level" : strikeCount === 2 ? "Escalation level" : strikeCount === 3 ? "Critical level" : "Severe level"}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-3xl font-extrabold",
                      strikeCount === 0 ? "text-muted-foreground" : strikeCount < 3 ? "text-orange-600" : "text-destructive",
                    )}>
                      {strikeCount}
                    </span>
                  </div>
                  {strikeCount >= 3 && (
                    <p className="text-[11px] text-destructive font-medium mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Mandatory parent meeting required
                    </p>
                  )}
                </div>

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
      {/* Case Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{actionDialog.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Add notes or details about this action..."
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, type: "", label: "" })}>Cancel</Button>
            <Button onClick={handleCaseAction}>Log Action</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
