import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  UsersRound,
  BedDouble,
  Briefcase,
  FileWarning,
  CalendarClock,
  Bus,
  Wrench,
  Megaphone,
  FolderOpen,
  BarChart3,
  FileBarChart,
  GitCompareArrows,
  Building2,
  ShieldCheck,
  History,
  ClipboardCheck,
  ArrowRight,
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
    title: "Instance Overview",
    items: [
      { icon: Users, title: "People Management", description: "Manage staff and personnel", path: "/people" },
      { icon: UserCheck, title: "Participants", description: "Participant records and details" },
      { icon: UsersRound, title: "Groups", description: "Group management and assignments" },
      { icon: BedDouble, title: "Accommodation", description: "Housing and room allocation" },
    ],
  },
  {
    title: "Case Management & Reporting",
    items: [
      { icon: Briefcase, title: "Case Management", description: "Track and manage cases" },
      { icon: FileWarning, title: "Strikes Report", description: "Incident and strike tracking" },
      { icon: BarChart3, title: "Participant Reports", description: "Individual participant data" },
      { icon: GitCompareArrows, title: "Cross-Instance Reports", description: "Compare across instances" },
    ],
  },
  {
    title: "System Management",
    items: [
      { icon: Building2, title: "Instances", description: "Manage system instances" },
      { icon: ShieldCheck, title: "Roles & Permissions", description: "Access control settings" },
      { icon: History, title: "Audit & History", description: "Change logs and history" },
      { icon: ClipboardCheck, title: "Attendance", description: "Attendance tracking" },
    ],
  },
];

const ItemCard = ({ icon: Icon, title, description }: SectionItem) => (
  <div className="bg-card rounded-lg p-5 flex flex-col items-start gap-3 hover:shadow-md transition-shadow cursor-pointer border border-border">
    <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
      <Icon className="w-6 h-6 text-icon-primary" strokeWidth={1.5} />
    </div>
    <div>
      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      )}
    </div>
  </div>
);

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
