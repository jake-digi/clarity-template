import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useParticipant } from "@/hooks/useParticipant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChevronRight, User, MapPin, Calendar, Heart, UtensilsCrossed,
  Building2, Users, AlertTriangle, Pencil, ArrowLeft, Flag,
  School, Star, Bed, ShieldAlert, ClipboardList, FileText
} from "lucide-react";

const statusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active": return "default" as const;
    case "inactive": return "secondary" as const;
    case "completed": return "outline" as const;
    case "withdrawn": return "destructive" as const;
    default: return "default" as const;
  }
};

const InfoRow = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) => (
  <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
    {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value || "—"}</p>
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, actions }: { title: string; icon: React.ElementType; children: React.ReactNode; actions?: React.ReactNode }) => (
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

const EmptyState = ({ icon: Icon, message }: { icon: React.ElementType; message: string }) => (
  <div className="py-8 text-center">
    <Icon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

const ParticipantProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: p, isLoading, error } = useParticipant(id ?? "");
  const [activeTab, setActiveTab] = useState("personal");

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 overflow-auto">
            <div className="border-b border-border bg-card px-6 py-5">
              <Skeleton className="h-4 w-48 mb-4" />
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-7 w-56" />
                  <Skeleton className="h-4 w-72" />
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-96" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !p) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive font-medium">Participant not found</p>
              <Button variant="outline" className="mt-3" onClick={() => navigate("/participants")}>Back to Participants</Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const age = p.date_of_birth
    ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          {/* Header Banner */}
          <div className="bg-card border-b border-border">
            <div className="px-6 py-5">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Dashboard</button>
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => navigate("/participants")} className="hover:text-foreground transition-colors">Participants</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">{p.full_name}</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-border overflow-hidden shrink-0">
                    {p.photo_link ? (
                      <img src={p.photo_link} alt={p.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-2xl font-semibold text-foreground tracking-tight">{p.full_name}</h1>
                      <Badge variant={statusVariant(p.status)} className="capitalize">{p.status}</Badge>
                      {p.is_off_site && <Badge variant="outline" className="text-destructive border-destructive/30">Off-site</Badge>}
                      {p.light_load && <Badge variant="outline" className="text-muted-foreground border-border">Light Load</Badge>}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                      {p.rank && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" />{p.rank}</span>}
                      {p.instance && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{p.instance.name}</span>}
                      {p.subgroup && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{p.subgroup.name}</span>}
                      {age !== null && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{age} years old</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => navigate("/participants")}>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs in header */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-t border-border px-6 pt-2">
                <TabsList className="bg-muted/60 h-10 p-1 rounded-lg gap-0.5">
                  {[
                    { value: "personal", label: "Personal", icon: User },
                    { value: "instance", label: "Instance & Accommodation", icon: Building2 },
                    { value: "medical", label: "Medical", icon: Heart },
                    { value: "dietary", label: "Dietary", icon: UtensilsCrossed },
                    { value: "welfare", label: "Welfare", icon: AlertTriangle },
                    { value: "behaviour", label: "Behaviour", icon: ShieldAlert },
                    { value: "notes", label: "Notes & Logs", icon: FileText },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-md px-3.5 py-1.5 text-sm gap-1.5 text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Tab Content */}
              <div className="px-6 py-6">
                {/* Personal */}
                <TabsContent value="personal" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="Identity" icon={User}>
                      <div className="grid grid-cols-2 gap-x-6">
                        <InfoRow label="First Name" value={p.first_name} icon={User} />
                        <InfoRow label="Surname" value={p.surname} />
                        <InfoRow label="Date of Birth" value={p.date_of_birth ? `${new Date(p.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}${age !== null ? ` (${age})` : ""}` : null} icon={Calendar} />
                        <InfoRow label="Gender" value={p.gender} />
                        <InfoRow label="Pronouns" value={(p as any).pronouns} />
                        <InfoRow label="Status" value={<Badge variant={statusVariant(p.status)} className="capitalize">{p.status}</Badge>} />
                      </div>
                    </SectionCard>

                    <SectionCard title="Organisation" icon={Flag}>
                      <div className="grid grid-cols-2 gap-x-6">
                        <InfoRow label="Unit Name" value={p.unit_name} icon={Flag} />
                        <InfoRow label="Rank" value={p.rank} icon={Star} />
                        <InfoRow label="School / Institute" value={p.school_institute} icon={School} />
                        <InfoRow label="School Year" value={(p as any).school_year} />
                      </div>
                    </SectionCard>
                  </div>
                </TabsContent>

                {/* Instance & Accommodation */}
                <TabsContent value="instance" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="Instance Assignment" icon={Building2}>
                      <InfoRow label="Instance" value={p.instance?.name} icon={Building2} />
                      <InfoRow label="Location" value={p.instance?.location} icon={MapPin} />
                      <InfoRow label="Instance Dates" value={
                        p.instance?.start_date && p.instance?.end_date
                          ? `${new Date(p.instance.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(p.instance.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                          : null
                      } icon={Calendar} />
                    </SectionCard>

                    <SectionCard title="Groups" icon={Users}>
                      <InfoRow label="Supergroup" value={p.supergroup?.name} icon={Users} />
                      <InfoRow label="Subgroup" value={p.subgroup?.name} icon={Users} />
                    </SectionCard>

                    <SectionCard title="Accommodation" icon={Bed}>
                      <InfoRow label="Room Number" value={(p as any).room_number} icon={Bed} />
                      <InfoRow label="Arrival" value={p.arrival_date ? new Date(p.arrival_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null} icon={Calendar} />
                      <InfoRow label="Departure" value={p.departure_date ? new Date(p.departure_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null} icon={Calendar} />
                      <InfoRow label="Off-site" value={p.is_off_site ? `Yes${(p as any).off_site_comment ? ` — ${(p as any).off_site_comment}` : ""}` : "No"} />
                    </SectionCard>
                  </div>
                </TabsContent>

                {/* Medical */}
                <TabsContent value="medical" className="mt-0 space-y-6">
                  <SectionCard title="Medical Information" icon={Heart} actions={
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Pencil className="w-3 h-3" /> Edit</Button>
                  }>
                    {p.medical ? (
                      <div className="space-y-5">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Conditions</p>
                          {p.medical.conditions?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {p.medical.conditions.map((c: string) => (
                                <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">None recorded</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Allergies</p>
                          {p.medical.allergies?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {p.medical.allergies.map((a: string) => (
                                <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">None recorded</p>
                          )}
                        </div>
                        {p.medical.notes && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Additional Notes</p>
                            <p className="text-sm text-foreground bg-muted/50 rounded-md p-3">{p.medical.notes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <EmptyState icon={Heart} message="No medical information has been recorded for this participant." />
                    )}
                  </SectionCard>
                </TabsContent>

                {/* Dietary */}
                <TabsContent value="dietary" className="mt-0 space-y-6">
                  <SectionCard title="Dietary Requirements" icon={UtensilsCrossed} actions={
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Pencil className="w-3 h-3" /> Edit</Button>
                  }>
                    {p.dietary ? (
                      <div className="space-y-5">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Restrictions</p>
                          {p.dietary.restrictions?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {p.dietary.restrictions.map((r: string) => (
                                <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">None recorded</p>
                          )}
                        </div>
                        {p.dietary.notes && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Additional Notes</p>
                            <p className="text-sm text-foreground bg-muted/50 rounded-md p-3">{p.dietary.notes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <EmptyState icon={UtensilsCrossed} message="No dietary requirements have been recorded for this participant." />
                    )}
                  </SectionCard>
                </TabsContent>

                {/* Welfare */}
                <TabsContent value="welfare" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="Welfare Flags" icon={AlertTriangle}>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between py-3 border-b border-border">
                          <span className="text-sm text-foreground">Light Load</span>
                          <Badge variant={p.light_load ? "default" : "outline"} className="text-xs">
                            {p.light_load ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-border">
                          <span className="text-sm text-foreground">Off-site</span>
                          <Badge variant={p.is_off_site ? "destructive" : "outline"} className="text-xs">
                            {p.is_off_site ? "Yes" : "No"}
                          </Badge>
                        </div>
                        {p.is_off_site && (p as any).off_site_comment && (
                          <div className="py-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Off-site reason</p>
                            <p className="text-sm text-foreground bg-muted/50 rounded-md p-2.5">{(p as any).off_site_comment}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between py-3">
                          <span className="text-sm text-foreground">Status</span>
                          <Badge variant={statusVariant(p.status)} className="capitalize text-xs">{p.status}</Badge>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Welfare Summary" icon={ClipboardList}>
                      <EmptyState icon={ClipboardList} message="No welfare cases or notes recorded yet. Welfare incidents will appear here once logged." />
                    </SectionCard>
                  </div>
                </TabsContent>

                {/* Behaviour */}
                <TabsContent value="behaviour" className="mt-0 space-y-6">
                  <SectionCard title="Behaviour & Incidents" icon={ShieldAlert}>
                    <EmptyState icon={ShieldAlert} message="No behaviour records or incidents have been logged for this participant. Strikes and incident reports will appear here." />
                  </SectionCard>
                </TabsContent>

                {/* Notes & Logs */}
                <TabsContent value="notes" className="mt-0 space-y-6">
                  <SectionCard title="Activity Log" icon={FileText}>
                    <EmptyState icon={FileText} message="No activity logs found for this participant. Check-in records, stage completions, and general notes will appear here." />
                  </SectionCard>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ParticipantProfile;
