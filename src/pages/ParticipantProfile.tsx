import { useParams, useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useParticipant } from "@/hooks/useParticipant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight, User, MapPin, Calendar, Shield, Heart, UtensilsCrossed,
  Building2, Users, Phone, AlertTriangle, Pencil, ArrowLeft, Flag,
  School, Star, Bed, Loader2
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
  <div className="flex items-start gap-3 py-2.5">
    {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value || "—"}</p>
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, actions }: { title: string; icon: React.ElementType; children: React.ReactNode; actions?: React.ReactNode }) => (
  <div className="bg-card rounded-lg border border-border">
    <div className="flex items-center justify-between px-5 py-3 border-b border-border">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {actions}
    </div>
    <div className="px-5 py-3">{children}</div>
  </div>
);

const ParticipantProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: p, isLoading, error } = useParticipant(id ?? "");

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 p-6">
            <div className="space-y-4 max-w-4xl">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-48 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
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
          {/* Banner */}
          <div className="border-b border-border bg-card px-6 py-5">
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
                {/* Avatar */}
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
                    {p.is_off_site && <Badge variant="outline" className="text-orange-600 border-orange-300">Off-site</Badge>}
                    {p.light_load && <Badge variant="outline" className="text-amber-600 border-amber-300">Light Load</Badge>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
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

          {/* Content */}
          <div className="px-6 py-6 space-y-6 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - Personal + Instance */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Details */}
                <SectionCard title="Personal Details" icon={User}>
                  <div className="grid grid-cols-2 gap-x-8">
                    <InfoRow label="First Name" value={p.first_name} icon={User} />
                    <InfoRow label="Surname" value={p.surname} />
                    <InfoRow label="Date of Birth" value={p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null} icon={Calendar} />
                    <InfoRow label="Gender" value={p.gender} />
                    <InfoRow label="Pronouns" value={(p as any).pronouns} />
                    <InfoRow label="School / Institute" value={p.school_institute} icon={School} />
                    <InfoRow label="Unit Name" value={p.unit_name} icon={Flag} />
                    <InfoRow label="Rank" value={p.rank} icon={Star} />
                  </div>
                </SectionCard>

                {/* Instance & Accommodation */}
                <SectionCard title="Instance & Accommodation" icon={Building2}>
                  <div className="grid grid-cols-2 gap-x-8">
                    <InfoRow label="Instance" value={p.instance?.name} icon={Building2} />
                    <InfoRow label="Location" value={p.instance?.location} icon={MapPin} />
                    <InfoRow label="Supergroup" value={p.supergroup?.name} icon={Users} />
                    <InfoRow label="Subgroup" value={p.subgroup?.name} icon={Users} />
                    <InfoRow label="Room" value={(p as any).room_number} icon={Bed} />
                    <InfoRow label="Off-site" value={p.is_off_site ? `Yes${(p as any).off_site_comment ? ` — ${(p as any).off_site_comment}` : ""}` : "No"} />
                    <InfoRow label="Arrival" value={p.arrival_date ? new Date(p.arrival_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null} icon={Calendar} />
                    <InfoRow label="Departure" value={p.departure_date ? new Date(p.departure_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null} icon={Calendar} />
                  </div>
                </SectionCard>
              </div>

              {/* Right column - Welfare */}
              <div className="space-y-6">
                {/* Medical Info */}
                <SectionCard title="Medical Information" icon={Heart} actions={
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                }>
                  {p.medical ? (
                    <div className="space-y-3">
                      {p.medical.conditions?.length ? (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Conditions</p>
                          <div className="flex flex-wrap gap-1.5">
                            {p.medical.conditions.map((c: string) => (
                              <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {p.medical.allergies?.length ? (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Allergies</p>
                          <div className="flex flex-wrap gap-1.5">
                            {p.medical.allergies.map((a: string) => (
                              <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {p.medical.notes && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                          <p className="text-sm text-foreground bg-muted/50 rounded-md p-2.5">{p.medical.notes}</p>
                        </div>
                      )}
                      {!p.medical.conditions?.length && !p.medical.allergies?.length && !p.medical.notes && (
                        <p className="text-sm text-muted-foreground py-2">No medical information recorded.</p>
                      )}
                    </div>
                  ) : (
                    <div className="py-3 text-center">
                      <Heart className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No medical info on file.</p>
                    </div>
                  )}
                </SectionCard>

                {/* Dietary Needs */}
                <SectionCard title="Dietary Requirements" icon={UtensilsCrossed} actions={
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                }>
                  {p.dietary ? (
                    <div className="space-y-3">
                      {p.dietary.restrictions?.length ? (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Restrictions</p>
                          <div className="flex flex-wrap gap-1.5">
                            {p.dietary.restrictions.map((r: string) => (
                              <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {p.dietary.notes && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                          <p className="text-sm text-foreground bg-muted/50 rounded-md p-2.5">{p.dietary.notes}</p>
                        </div>
                      )}
                      {!p.dietary.restrictions?.length && !p.dietary.notes && (
                        <p className="text-sm text-muted-foreground py-2">No dietary restrictions recorded.</p>
                      )}
                    </div>
                  ) : (
                    <div className="py-3 text-center">
                      <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No dietary info on file.</p>
                    </div>
                  )}
                </SectionCard>

                {/* Welfare Flags */}
                <SectionCard title="Welfare Flags" icon={AlertTriangle}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-foreground">Light Load</span>
                      <Badge variant={p.light_load ? "default" : "outline"} className="text-xs">
                        {p.light_load ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-foreground">Off-site</span>
                      <Badge variant={p.is_off_site ? "default" : "outline"} className="text-xs">
                        {p.is_off_site ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {p.is_off_site && (p as any).off_site_comment && (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">{(p as any).off_site_comment}</p>
                    )}
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ParticipantProfile;
