import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  UsersRound,
  Tent,
  Briefcase,
  FileWarning,
  MapPin,
  Activity,
  ClipboardList,
  CheckSquare,
  Building2,
  ShieldCheck,
  History,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SectionItem {
  icon: LucideIcon;
  title: string;
  description?: string;
  path?: string;
}

interface SectionGroup {
  title: string;
  items: SectionItem[];
}

const sections: SectionGroup[] = [
  {
    title: "Tenant Overview",
    items: [
      { icon: Users, title: "Users", description: "Manage staff and personnel", path: "/people" },
      { icon: UserCheck, title: "Participants", description: "Participant records and details", path: "/participants" },
      { icon: UsersRound, title: "Groups", description: "Group management and assignments", path: "/groups" },
      { icon: Tent, title: "Sites", description: "Manage accommodation sites and layouts", path: "/sites" },
    ],
  },
  {
    title: "Operations",
    items: [
      { icon: Building2, title: "Instances", description: "Events, camps and expeditions", path: "/instances" },
      { icon: ClipboardList, title: "Stages", description: "Checklist workflows", path: "/stages" },
      { icon: MapPin, title: "Tracking", description: "Live group tracking", path: "/tracking" },
      { icon: CheckSquare, title: "Check-ins", description: "Attendance and check-in sessions", path: "/checkins" },
    ],
  },
  {
    title: "Case Management & Reporting",
    items: [
      { icon: Briefcase, title: "Cases", description: "Behaviour and welfare cases", path: "/cases" },
      { icon: Activity, title: "Activity Log", description: "Activity and incident logs", path: "/activity" },
      { icon: FileWarning, title: "Strikes Report", description: "Incident and strike tracking" },
    ],
  },
  {
    title: "Administration",
    items: [
      { icon: ShieldCheck, title: "Roles & Permissions", description: "Access control settings", path: "/roles" },
      { icon: History, title: "Audit & History", description: "Change logs and history" },
    ],
  },
];

const ItemCard = ({ icon: Icon, title, description, path }: SectionItem) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => path && navigate(path)}
      className={`bg-card rounded-lg p-5 flex flex-col items-start gap-3 transition-shadow border border-border ${path ? "hover:shadow-md cursor-pointer" : "opacity-60 cursor-default"}`}
    >
      <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
        <Icon className="w-6 h-6 text-accent-foreground" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
};

const CheckpointSections = () => {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.title}>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {section.items.map((item) => (
              <ItemCard key={item.title} {...item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default CheckpointSections;
