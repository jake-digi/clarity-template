import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUsers } from "@/hooks/useUsers";
import { useParticipants } from "@/hooks/useParticipants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ChevronRight, Loader2, CheckCircle2, AlertCircle, Search,
  Building2, Award, Users, UserPlus,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type CreationStatus = "idle" | "creating" | "success" | "error";

interface InstanceDetails {
  name: string;
  description: string;
  location: string;
  type: "standard" | "dofe";
  status: "draft" | "upcoming" | "active";
  level: string;
  expeditionType: string;
  capacity: string;
  startDate: string;
  endDate: string;
}

const generateCode = () => {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INS-${year}-${rand}`;
};

const NewInstancePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: participants = [], isLoading: participantsLoading } = useParticipants();

  const [tab, setTab] = useState("details");
  const [creationStatus, setCreationStatus] = useState<CreationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [details, setDetails] = useState<InstanceDetails>({
    name: "",
    description: "",
    location: "",
    type: "standard",
    status: "draft",
    level: "bronze",
    expeditionType: "practice",
    capacity: "",
    startDate: "",
    endDate: "",
  });

  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set());
  const [staffSearch, setStaffSearch] = useState("");
  const [participantSearch, setParticipantSearch] = useState("");

  const code = useMemo(() => generateCode(), []);

  const updateDetail = <K extends keyof InstanceDetails>(key: K, value: InstanceDetails[K]) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const toggleStaff = (id: string) => {
    setSelectedStaffIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipantIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredStaff = useMemo(() => {
    const q = staffSearch.toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.first_name.toLowerCase().includes(q) ||
        (u.surname ?? u.last_name ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, staffSearch]);

  const filteredParticipants = useMemo(() => {
    const q = participantSearch.toLowerCase();
    if (!q) return participants;
    return participants.filter((p) => p.full_name.toLowerCase().includes(q));
  }, [participants, participantSearch]);

  const handleCreate = useCallback(async () => {
    if (!details.name.trim()) {
      toast({ title: "Validation Error", description: "Instance name is required.", variant: "destructive" });
      setTab("details");
      return;
    }

    // Get tenant_id from the current user's record
    const { data: currentUser } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("auth_id", user?.id ?? "")
      .single();

    const tenantId = currentUser?.tenant_id;
    if (!tenantId) {
      toast({ title: "Error", description: "Could not resolve tenant. Please try again.", variant: "destructive" });
      return;
    }

    setCreationStatus("creating");
    setErrorMessage("");

    try {
      // 1. Create the instance
      const { data: newInstance, error: instErr } = await supabase
        .from("instances")
        .insert({
          id: code,
          tenant_id: tenantId,
          name: details.name.trim(),
          description: details.description || null,
          status: details.status,
          location: details.location || null,
          start_date: details.startDate || null,
          end_date: details.endDate || null,
          settings: {
            type: details.type,
            level: details.type === "dofe" ? details.level : undefined,
            expeditionType: details.type === "dofe" ? details.expeditionType : undefined,
            code,
            capacity: details.capacity ? Number(details.capacity) : undefined,
          },
        })
        .select()
        .single();

      if (instErr) throw instErr;

      // 2. Assign staff
      const staffIds = [...selectedStaffIds];
      if (staffIds.length > 0) {
        const staffRows = staffIds.map((userId) => ({
          user_id: userId,
          instance_id: newInstance.id,
          instance_name: newInstance.name,
        }));
        const { error: staffErr } = await supabase
          .from("user_instance_assignments")
          .insert(staffRows);
        if (staffErr) throw staffErr;
      }

      // 3. Assign participants
      const partIds = [...selectedParticipantIds];
      if (partIds.length > 0) {
        const partRows = partIds.map((pid) => ({
          participant_id: pid,
          instance_id: newInstance.id,
        }));
        const { error: partErr } = await supabase
          .from("participant_instance_assignments")
          .insert(partRows);
        if (partErr) throw partErr;
      }

      // 4. Invalidate cache
      queryClient.invalidateQueries({ queryKey: ["instances"] });

      setCreationStatus("success");
      setTimeout(() => navigate(`/instances/${newInstance.id}`), 1200);
    } catch (err: any) {
      setCreationStatus("error");
      setErrorMessage(err?.message ?? "An unexpected error occurred.");
    }
  }, [details, code, selectedStaffIds, selectedParticipantIds, user, queryClient, navigate]);

  const isDirty =
    details.name.trim() !== "" ||
    selectedStaffIds.size > 0 ||
    selectedParticipantIds.size > 0;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          {/* Breadcrumb + Header */}
          <div className="border-b border-border bg-card px-6 py-5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Dashboard</button>
              <ChevronRight className="w-3 h-3" />
              <button onClick={() => navigate("/instances")} className="hover:text-foreground transition-colors">Instances</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">New Instance</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">Create New Instance</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Code: <span className="font-mono text-foreground">{code}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => navigate("/instances")}>Cancel</Button>
                <Button
                  onClick={handleCreate}
                  disabled={creationStatus === "creating" || creationStatus === "success"}
                  className="gap-2"
                >
                  {creationStatus === "creating" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {creationStatus === "success" && <CheckCircle2 className="w-4 h-4" />}
                  {creationStatus === "creating" ? "Creating..." : creationStatus === "success" ? "Created!" : "Create Instance"}
                </Button>
              </div>
            </div>
          </div>

          {/* Error banner */}
          {creationStatus === "error" && (
            <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setCreationStatus("idle")}>
                Go Back & Fix
              </Button>
            </div>
          )}

          {/* Tabs */}
          <div className="px-6 py-5">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="details" className="gap-1.5">
                  <Building2 className="w-4 h-4" />Details
                </TabsTrigger>
                <TabsTrigger value="staffing" className="gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  Staffing
                  {selectedStaffIds.size > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{selectedStaffIds.size}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="participants" className="gap-1.5">
                  <Users className="w-4 h-4" />
                  Participants
                  {selectedParticipantIds.size > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{selectedParticipantIds.size}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* ─── Details Tab ─── */}
              <TabsContent value="details">
                <div className="max-w-2xl space-y-6 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Instance Name *</Label>
                      <Input
                        value={details.name}
                        onChange={(e) => updateDetail("name", e.target.value)}
                        placeholder="e.g. Summer Camp 2026"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label>Type</Label>
                      <Select value={details.type} onValueChange={(v) => updateDetail("type", v as any)}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">
                            <span className="flex items-center gap-2"><Building2 className="w-4 h-4" />Standard</span>
                          </SelectItem>
                          <SelectItem value="dofe">
                            <span className="flex items-center gap-2"><Award className="w-4 h-4" />DofE</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Status</Label>
                      <Select value={details.status} onValueChange={(v) => updateDetail("status", v as any)}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {details.type === "dofe" && (
                      <>
                        <div>
                          <Label>Level</Label>
                          <Select value={details.level} onValueChange={(v) => updateDetail("level", v)}>
                            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bronze">Bronze</SelectItem>
                              <SelectItem value="silver">Silver</SelectItem>
                              <SelectItem value="gold">Gold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Expedition Type</Label>
                          <Select value={details.expeditionType} onValueChange={(v) => updateDetail("expeditionType", v)}>
                            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="practice">Practice</SelectItem>
                              <SelectItem value="qualifying">Qualifying</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    <div>
                      <Label>Location</Label>
                      <Input
                        value={details.location}
                        onChange={(e) => updateDetail("location", e.target.value)}
                        placeholder="e.g. Peak District"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label>Capacity</Label>
                      <Input
                        type="number"
                        value={details.capacity}
                        onChange={(e) => updateDetail("capacity", e.target.value)}
                        placeholder="e.g. 60"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={details.startDate}
                        onChange={(e) => updateDetail("startDate", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={details.endDate}
                        onChange={(e) => updateDetail("endDate", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={details.description}
                        onChange={(e) => updateDetail("description", e.target.value)}
                        placeholder="Optional description..."
                        className="mt-1.5"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ─── Staffing Tab ─── */}
              <TabsContent value="staffing">
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Select staff members to assign to this instance.
                      <span className="ml-2 font-medium text-foreground">{selectedStaffIds.size} selected</span>
                    </p>
                  </div>
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search staff..."
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="bg-card rounded-lg border border-border overflow-hidden max-h-[400px] overflow-y-auto">
                    {usersLoading ? (
                      <div className="p-8 text-center text-muted-foreground">Loading staff...</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px]" />
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Roles</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStaff.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No staff found.</TableCell>
                            </TableRow>
                          ) : filteredStaff.map((u) => (
                            <TableRow
                              key={u.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => toggleStaff(u.id)}
                            >
                              <TableCell>
                                <Checkbox checked={selectedStaffIds.has(u.id)} />
                              </TableCell>
                              <TableCell className="font-medium">
                                {u.first_name} {u.surname ?? u.last_name ?? ""}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{u.email}</TableCell>
                              <TableCell>
                                {u.role_names.map((r) => (
                                  <Badge key={r} variant="outline" className="mr-1 text-xs">{r}</Badge>
                                ))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* ─── Participants Tab ─── */}
              <TabsContent value="participants">
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Select participants to assign.
                      <span className="ml-2 font-medium text-foreground">{selectedParticipantIds.size} selected</span>
                    </p>
                  </div>
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search participants..."
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="bg-card rounded-lg border border-border overflow-hidden max-h-[400px] overflow-y-auto">
                    {participantsLoading ? (
                      <div className="p-8 text-center text-muted-foreground">Loading participants...</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px]" />
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Current Instance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredParticipants.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No participants found.</TableCell>
                            </TableRow>
                          ) : filteredParticipants.map((p) => (
                            <TableRow
                              key={p.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => toggleParticipant(p.id)}
                            >
                              <TableCell>
                                <Checkbox checked={selectedParticipantIds.has(p.id)} />
                              </TableCell>
                              <TableCell className="font-medium">{p.full_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize text-xs">{p.status}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {p.instance_name ?? "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewInstancePage;
