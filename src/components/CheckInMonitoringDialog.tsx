import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import {
  Heart, Clock, AlertTriangle, CalendarDays, Smile, Frown,
  CheckCircle2, Eye, Plus, History,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { BehaviorCase, CaseAction } from "@/hooks/useCases";

interface CheckInMonitoringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: BehaviorCase;
  actions: CaseAction[];
  userId: string;
  userName: string;
}

type CheckInConfig = {
  checkInRequired: boolean;
  checkInFrequency: "every" | "evening" | "once_daily" | "one_off";
  checkInInstructions: string;
  checkInMonitorUntil: string | null;
};

const frequencyLabels: Record<string, string> = {
  every: "Every check-in",
  evening: "Evening check-ins only",
  once_daily: "Once daily",
  one_off: "One-off check",
};

export default function CheckInMonitoringDialog({
  open, onOpenChange, caseData, actions, userId, userName,
}: CheckInMonitoringDialogProps) {
  const qc = useQueryClient();
  const metadata = (caseData.metadata ?? {}) as Record<string, unknown>;

  const [config, setConfig] = useState<CheckInConfig>({
    checkInRequired: (metadata.checkInRequired as boolean) ?? false,
    checkInFrequency: (metadata.checkInFrequency as CheckInConfig["checkInFrequency"]) ?? "every",
    checkInInstructions: (metadata.checkInInstructions as string) ?? "",
    checkInMonitorUntil: (metadata.checkInMonitorUntil as string) ?? null,
  });

  const [tab, setTab] = useState<"settings" | "checkin" | "history">("settings");
  const [saving, setSaving] = useState(false);

  // New check-in form
  const [observations, setObservations] = useState("");
  const [happinessScore, setHappinessScore] = useState(7);
  const [concernsRaised, setConcernsRaised] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filter check-in history from actions
  const checkInHistory = actions.filter((a) => a.action_type === "welfare_checkin")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  useEffect(() => {
    if (open) {
      const md = (caseData.metadata ?? {}) as Record<string, unknown>;
      setConfig({
        checkInRequired: (md.checkInRequired as boolean) ?? false,
        checkInFrequency: (md.checkInFrequency as CheckInConfig["checkInFrequency"]) ?? "every",
        checkInInstructions: (md.checkInInstructions as string) ?? "",
        checkInMonitorUntil: (md.checkInMonitorUntil as string) ?? null,
      });
      setTab("settings");
      setObservations("");
      setHappinessScore(7);
      setConcernsRaised(false);
    }
  }, [open, caseData]);

  const handleSaveConfig = async () => {
    setSaving(true);
    const newMetadata = {
      ...metadata,
      checkInRequired: config.checkInRequired,
      checkInFrequency: config.checkInFrequency,
      checkInInstructions: config.checkInInstructions,
      checkInMonitorUntil: config.checkInMonitorUntil,
    };
    const { error } = await supabase
      .from("behavior_cases")
      .update({ metadata: newMetadata as any, updated_at: new Date().toISOString() })
      .eq("id", caseData.id);
    setSaving(false);
    if (error) { toast.error("Failed to save settings"); return; }
    toast.success("Check-in monitoring settings saved");
    qc.invalidateQueries({ queryKey: ["behavior-case", caseData.id] });

    // Log config change action
    await supabase.from("case_actions").insert({
      case_id: caseData.id,
      instance_id: caseData.instance_id,
      participant_id: caseData.participant_id,
      action_type: "checkin_config",
      description: config.checkInRequired
        ? `Check-in monitoring enabled (${frequencyLabels[config.checkInFrequency]})`
        : "Check-in monitoring disabled",
      performed_by: userId,
      performed_by_name: userName,
    });
    qc.invalidateQueries({ queryKey: ["case-actions", caseData.id] });
  };

  const handleSubmitCheckIn = async () => {
    setSubmitting(true);
    const checkInData = {
      happinessScore,
      observations: observations.trim(),
      concernsRaised,
      timestamp: new Date().toISOString(),
    };

    const { error } = await supabase.from("case_actions").insert({
      case_id: caseData.id,
      instance_id: caseData.instance_id,
      participant_id: caseData.participant_id,
      action_type: "welfare_checkin",
      description: `Welfare check-in: Happiness ${happinessScore}/10${concernsRaised ? " ⚠️ Concerns raised" : ""}${observations.trim() ? ` — ${observations.trim()}` : ""}`,
      performed_by: userId,
      performed_by_name: userName,
      metadata: checkInData as any,
    });

    // Update lastCheckIn in case metadata
    const newMetadata = { ...metadata, lastCheckIn: new Date().toISOString() };
    await supabase.from("behavior_cases")
      .update({ metadata: newMetadata as any, updated_at: new Date().toISOString() })
      .eq("id", caseData.id);

    setSubmitting(false);
    if (error) { toast.error("Failed to log check-in"); return; }
    toast.success("Welfare check-in recorded");
    qc.invalidateQueries({ queryKey: ["case-actions", caseData.id] });
    qc.invalidateQueries({ queryKey: ["behavior-case", caseData.id] });
    setTab("history");
    setObservations("");
    setHappinessScore(7);
    setConcernsRaised(false);
  };

  const getScoreEmoji = (score: number) => {
    if (score <= 3) return "😢";
    if (score <= 5) return "😐";
    if (score <= 7) return "🙂";
    return "😊";
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return "text-destructive";
    if (score <= 5) return "text-orange-500";
    if (score <= 7) return "text-yellow-500";
    return "text-success";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Check-In Monitoring
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{caseData.participant_name}</p>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border -mx-6 px-6">
          {([
            { key: "settings", label: "Settings", icon: Eye },
            { key: "checkin", label: "New Check-In", icon: Plus },
            { key: "history", label: `History (${checkInHistory.length})`, icon: History },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* ---- SETTINGS TAB ---- */}
          {tab === "settings" && (
            <>
              {/* Current status */}
              <div className={cn(
                "rounded-lg p-3 border",
                config.checkInRequired ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-border",
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Welfare Check During Check-Ins</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {config.checkInRequired ? "Leaders will be prompted to perform welfare checks" : "Monitoring is currently disabled"}
                    </p>
                  </div>
                  <Switch
                    checked={config.checkInRequired}
                    onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, checkInRequired: checked }))}
                  />
                </div>
              </div>

              {config.checkInRequired && (
                <>
                  {/* Frequency */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Check-In Frequency</Label>
                    <Select
                      value={config.checkInFrequency}
                      onValueChange={(v) => setConfig((prev) => ({ ...prev, checkInFrequency: v as CheckInConfig["checkInFrequency"] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="every">Every check-in</SelectItem>
                        <SelectItem value="evening">Evening check-ins only</SelectItem>
                        <SelectItem value="once_daily">Once daily</SelectItem>
                        <SelectItem value="one_off">One-off check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Special Instructions */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Special Instructions</Label>
                    <Textarea
                      placeholder="e.g. Ask about sleep quality and appetite..."
                      value={config.checkInInstructions}
                      onChange={(e) => setConfig((prev) => ({ ...prev, checkInInstructions: e.target.value.slice(0, 200) }))}
                      rows={3}
                    />
                    <p className="text-[10px] text-muted-foreground text-right">{config.checkInInstructions.length}/200</p>
                  </div>

                  {/* Monitor Until Date */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monitor Until (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-2 text-sm font-normal">
                          <CalendarDays className="w-4 h-4 text-muted-foreground" />
                          {config.checkInMonitorUntil
                            ? format(new Date(config.checkInMonitorUntil), "d MMM yyyy")
                            : "No end date (until case closed)"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={config.checkInMonitorUntil ? new Date(config.checkInMonitorUntil) : undefined}
                          onSelect={(date) => setConfig((prev) => ({
                            ...prev,
                            checkInMonitorUntil: date ? date.toISOString() : null,
                          }))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                        {config.checkInMonitorUntil && (
                          <div className="px-3 pb-3">
                            <Button variant="ghost" size="sm" className="w-full text-xs"
                              onClick={() => setConfig((prev) => ({ ...prev, checkInMonitorUntil: null }))}>
                              Clear date
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}

              <Button onClick={handleSaveConfig} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </>
          )}

          {/* ---- NEW CHECK-IN TAB ---- */}
          {tab === "checkin" && (
            <>
              {config.checkInInstructions && (
                <div className="rounded-lg p-3 bg-primary/5 border border-primary/20">
                  <p className="text-xs font-semibold text-primary mb-1">Special Instructions</p>
                  <p className="text-sm text-foreground">{config.checkInInstructions}</p>
                </div>
              )}

              {/* Happiness Score */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Happiness Score
                </Label>
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{getScoreEmoji(happinessScore)}</span>
                  <div className="flex-1">
                    <Slider
                      value={[happinessScore]}
                      onValueChange={([v]) => setHappinessScore(v)}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">Very unhappy</span>
                      <span className="text-[10px] text-muted-foreground">Very happy</span>
                    </div>
                  </div>
                  <span className={cn("text-2xl font-extrabold tabular-nums", getScoreColor(happinessScore))}>
                    {happinessScore}
                  </span>
                </div>
              </div>

              {/* Observations */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Observations
                </Label>
                <Textarea
                  placeholder="Note any observations about the participant's wellbeing..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Concerns */}
              <div className={cn(
                "rounded-lg p-3 border flex items-center justify-between",
                concernsRaised ? "bg-destructive/5 border-destructive/20" : "bg-muted/50 border-border",
              )}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn("w-4 h-4", concernsRaised ? "text-destructive" : "text-muted-foreground")} />
                  <div>
                    <p className={cn("text-sm font-medium", concernsRaised ? "text-destructive" : "text-foreground")}>
                      Concerns Raised
                    </p>
                    <p className="text-xs text-muted-foreground">Flag if new welfare concerns were identified</p>
                  </div>
                </div>
                <Switch checked={concernsRaised} onCheckedChange={setConcernsRaised} />
              </div>

              <Button onClick={handleSubmitCheckIn} disabled={submitting} className="w-full">
                {submitting ? "Recording..." : "Record Check-In"}
              </Button>
            </>
          )}

          {/* ---- HISTORY TAB ---- */}
          {tab === "history" && (
            <>
              {checkInHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No check-ins recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {checkInHistory.map((entry) => {
                    const md = (entry.metadata ?? {}) as Record<string, unknown>;
                    const score = (md.happinessScore as number) ?? 0;
                    const concerns = (md.concernsRaised as boolean) ?? false;
                    const obs = (md.observations as string) ?? "";

                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          "rounded-lg p-3 border",
                          concerns ? "bg-destructive/5 border-destructive/20" : "bg-card border-border",
                        )}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getScoreEmoji(score)}</span>
                            <div>
                              <p className="text-sm font-medium text-foreground">{entry.performed_by_name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {format(new Date(entry.timestamp), "d MMM yyyy, HH:mm")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {concerns && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive/10 text-destructive">
                                <AlertTriangle className="w-2.5 h-2.5" /> Concerns
                              </span>
                            )}
                            <span className={cn("text-lg font-extrabold tabular-nums", getScoreColor(score))}>
                              {score}/10
                            </span>
                          </div>
                        </div>
                        {obs && (
                          <p className="text-sm text-muted-foreground mt-1">{obs}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
