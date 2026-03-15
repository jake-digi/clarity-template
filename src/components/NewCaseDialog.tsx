import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertTriangle, ChevronsUpDown, Check, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantId } from "@/hooks/useTenantId";
import { useParticipants } from "@/hooks/useParticipants";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const categoryOptions = [
  "Bullying", "Disruption", "Property Damage", "Safeguarding",
  "Verbal Abuse", "Physical Altercation", "Homesickness", "Other",
];

const locationOptions = [
  "Main Hall", "Briefing Room", "Welfare Tent", "Dining Hall",
  "Accommodation Block", "Outdoor Area", "Sports Field", "Other",
];

interface NewCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId?: string;
}

export default function NewCaseDialog({ open, onOpenChange, instanceId }: NewCaseDialogProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: tenantId } = useTenantId();
  const { data: participants } = useParticipants();

  // Fetch instances for the dropdown (only if no instanceId is pre-set)
  const { data: instances } = useQuery({
    queryKey: ["instances-list"],
    enabled: !instanceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instances")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [form, setForm] = useState({
    participant_id: "",
    instance_id: instanceId ?? "",
    category: "",
    severity_level: "medium",
    overview: "",
    location: "",
    requires_immediate_action: false,
    is_sensitive_safeguarding: false,
    involves_staff_member: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [participantOpen, setParticipantOpen] = useState(false);

  const selectedParticipant = (participants ?? []).find((p) => p.id === form.participant_id);

  // Filter participants by selected instance if applicable
  const filteredParticipants = form.instance_id
    ? (participants ?? []).filter((p) =>
        p.assignments.some((a) => a.instance_id === form.instance_id) ||
        p.instance_id === form.instance_id
      )
    : (participants ?? []);

  const handleSubmit = async () => {
    if (!form.participant_id || !form.instance_id || !form.category || !tenantId || !user) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from("behavior_cases")
      .insert({
        tenant_id: tenantId,
        instance_id: form.instance_id,
        participant_id: form.participant_id,
        category: form.category,
        severity_level: form.severity_level,
        overview: form.overview.trim() || null,
        location: form.location || null,
        requires_immediate_action: form.requires_immediate_action,
        is_sensitive_safeguarding: form.is_sensitive_safeguarding,
        involves_staff_member: form.involves_staff_member,
        raised_by: user.id,
        status: "open",
        privacy_level: form.is_sensitive_safeguarding ? "restricted" : "standard",
      })
      .select("id")
      .single();

    if (error) {
      setSubmitting(false);
      toast.error("Failed to create case: " + error.message);
      return;
    }

    // Log creation action
    await supabase.from("case_actions").insert({
      case_id: data.id,
      instance_id: form.instance_id,
      participant_id: form.participant_id,
      action_type: "case_created",
      description: `${form.category} case created (${form.severity_level} severity)`,
      performed_by: user.id,
      performed_by_name: user.email ?? "Unknown",
    });

    setSubmitting(false);
    toast.success("Case created successfully");
    qc.invalidateQueries({ queryKey: ["behavior-cases"] });
    onOpenChange(false);
    resetForm();
    navigate(`/cases/${data.id}`);
  };

  const resetForm = () => {
    setForm({
      participant_id: "",
      instance_id: instanceId ?? "",
      category: "",
      severity_level: "medium",
      overview: "",
      location: "",
      requires_immediate_action: false,
      is_sensitive_safeguarding: false,
      involves_staff_member: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Raise New Case
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Instance selection (only if not pre-set) */}
          {!instanceId && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Instance *</Label>
              <Select value={form.instance_id} onValueChange={(v) => setForm((f) => ({ ...f, instance_id: v, participant_id: "" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select instance..." />
                </SelectTrigger>
                <SelectContent>
                  {(instances ?? []).map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Participant selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Participant *</Label>
            <Popover open={participantOpen} onOpenChange={setParticipantOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  {selectedParticipant ? (
                    <span className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      {selectedParticipant.full_name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Search participant...</span>
                  )}
                  <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search by name..." />
                  <CommandList>
                    <CommandEmpty>No participants found</CommandEmpty>
                    <CommandGroup>
                      {filteredParticipants.slice(0, 50).map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.full_name}
                          onSelect={() => { setForm((f) => ({ ...f, participant_id: p.id })); setParticipantOpen(false); }}
                        >
                          <Check className={cn("w-3.5 h-3.5 mr-2", form.participant_id === p.id ? "opacity-100" : "opacity-0")} />
                          {p.full_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category *</Label>
            <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Severity</Label>
            <Select value={form.severity_level} onValueChange={(v) => setForm((f) => ({ ...f, severity_level: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</Label>
            <Select value={form.location} onValueChange={(v) => setForm((f) => ({ ...f, location: v }))}>
              <SelectTrigger><SelectValue placeholder="Select location..." /></SelectTrigger>
              <SelectContent>
                {locationOptions.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Overview */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overview</Label>
            <Textarea
              placeholder="Describe the incident..."
              value={form.overview}
              onChange={(e) => setForm((f) => ({ ...f, overview: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Flags */}
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Requires Immediate Action</p>
                <p className="text-xs text-muted-foreground">Flag for urgent response</p>
              </div>
              <Switch checked={form.requires_immediate_action} onCheckedChange={(v) => setForm((f) => ({ ...f, requires_immediate_action: v }))} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Sensitive / Safeguarding</p>
                <p className="text-xs text-muted-foreground">Restrict visibility to authorised staff</p>
              </div>
              <Switch checked={form.is_sensitive_safeguarding} onCheckedChange={(v) => setForm((f) => ({ ...f, is_sensitive_safeguarding: v }))} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Involves Staff Member</p>
                <p className="text-xs text-muted-foreground">A staff member is involved in this incident</p>
              </div>
              <Switch checked={form.involves_staff_member} onCheckedChange={(v) => setForm((f) => ({ ...f, involves_staff_member: v }))} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !form.participant_id || !form.instance_id || !form.category}
          >
            {submitting ? "Creating..." : "Create Case"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
