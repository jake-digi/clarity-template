import { useNavigate } from "react-router-dom";
import { useParticipant } from "@/hooks/useParticipant";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  User, ExternalLink, Calendar, MapPin, Heart, UtensilsCrossed,
  Building2, Users, Bed, School, Star, Flag, AlertTriangle,
} from "lucide-react";

interface Props {
  participantId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ParticipantDrawer = ({ participantId, open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const { data: p, isLoading } = useParticipant(participantId ?? "");

  const age = p?.date_of_birth
    ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto p-0">
        {isLoading || !p ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 pb-4">
              <SheetHeader className="mb-0">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                    {p.first_name?.[0]}{p.surname?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-lg leading-tight">{p.full_name}</SheetTitle>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant={p.status === "active" ? "default" : "secondary"} className="capitalize text-[10px]">
                        {p.status ?? "unknown"}
                      </Badge>
                      {p.rank && <Badge variant="outline" className="text-[10px]">{p.rank}</Badge>}
                      {p.pronouns && <span className="text-xs text-muted-foreground">({p.pronouns})</span>}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <Button
                className="w-full mt-4 gap-2"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/participants/${p.id}`);
                }}
              >
                <ExternalLink className="w-4 h-4" />
                View Full Profile
              </Button>
            </div>

            <Separator />

            {/* Quick Info */}
            <div className="p-6 space-y-5">
              {/* Personal */}
              <Section title="Personal Details" icon={User}>
                <InfoLine icon={Calendar} label="Age" value={age ? `${age} years old` : null} />
                <InfoLine icon={Calendar} label="DOB" value={p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null} />
                <InfoLine icon={User} label="Gender" value={p.gender} />
                <InfoLine icon={School} label="School" value={p.school_institute} />
                <InfoLine icon={Star} label="School Year" value={p.school_year} />
                <InfoLine icon={Flag} label="Unit" value={p.unit_name} />
              </Section>

              {/* Current Assignment */}
              {p.assignments && p.assignments.length > 0 && (
                <Section title="Instance Assignments" icon={Building2}>
                  {p.assignments.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 py-1.5">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{a.instance_name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {a.subgroup_name && <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{a.subgroup_name}</span>}
                          {a.room_number && <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" />{a.room_number}</span>}
                          {a.is_off_site && <Badge variant="outline" className="text-destructive border-destructive/30 text-[9px] h-4">Off-site</Badge>}
                        </div>
                      </div>
                      <Badge variant={a.instance_status === "active" ? "default" : "secondary"} className="text-[9px] capitalize shrink-0">
                        {a.instance_status}
                      </Badge>
                    </div>
                  ))}
                </Section>
              )}

              {/* Medical */}
              {p.medical && (
                <Section title="Medical" icon={Heart}>
                  {p.medical.conditions?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {p.medical.conditions.map((c: string) => (
                        <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                      ))}
                    </div>
                  ) : <p className="text-xs text-muted-foreground">No conditions recorded</p>}
                  {p.medical.allergies?.length ? (
                    <div className="mt-2">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Allergies</p>
                      <div className="flex flex-wrap gap-1">
                        {p.medical.allergies.map((a: string) => (
                          <Badge key={a} variant="destructive" className="text-[10px]">{a}</Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {p.medical.notes && <p className="text-xs text-muted-foreground mt-2">{p.medical.notes}</p>}
                </Section>
              )}

              {/* Dietary */}
              {p.dietary && (
                <Section title="Dietary" icon={UtensilsCrossed}>
                  {p.dietary.restrictions?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {p.dietary.restrictions.map((r: string) => (
                        <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
                      ))}
                    </div>
                  ) : <p className="text-xs text-muted-foreground">No dietary restrictions</p>}
                  {p.dietary.notes && <p className="text-xs text-muted-foreground mt-2">{p.dietary.notes}</p>}
                </Section>
              )}

              {/* Flags */}
              {(p.has_active_behavior_case || p.has_active_welfare_case || p.requires_welfare_check_in || p.light_load) && (
                <Section title="Active Flags" icon={AlertTriangle}>
                  <div className="flex flex-wrap gap-1.5">
                    {p.has_active_behavior_case && <Badge variant="destructive" className="text-[10px]">Behaviour Case</Badge>}
                    {p.has_active_welfare_case && <Badge className="bg-amber-500 text-white text-[10px]">Welfare Case</Badge>}
                    {p.requires_welfare_check_in && <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[10px]">Welfare Check-in</Badge>}
                    {p.light_load && <Badge variant="outline" className="text-[10px]">Light Load</Badge>}
                  </div>
                </Section>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InfoLine({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className="text-xs text-foreground">{value}</span>
    </div>
  );
}

export default ParticipantDrawer;
