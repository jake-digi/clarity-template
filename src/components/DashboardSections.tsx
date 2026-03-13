import {
  LayoutDashboard,
  Users,
  UsersRound,
  Hotel,
  Briefcase,
  AlertTriangle,
  CalendarDays,
  UserCog,
  Wrench,
  Megaphone,
  FolderOpen,
  FileBarChart,
  GitCompareArrows,
  Building2,
  Shield,
  History,
  ClipboardCheck,
  ScrollText,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SectionItem {
  icon: LucideIcon;
  title: string;
}

interface SectionProps {
  title: string;
  items: SectionItem[];
}

const ItemCard = ({ icon: Icon, title }: SectionItem) => (
  <div className="bg-card rounded-lg p-4 flex flex-col items-start gap-3 hover:shadow-md transition-shadow cursor-pointer border border-border">
    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
      <Icon className="w-5 h-5 text-icon-primary" strokeWidth={1.5} />
    </div>
    <p className="text-sm font-medium text-foreground">{title}</p>
  </div>
);

const Section = ({ title, items }: SectionProps) => (
  <section>
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <a href="#" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
        View all <ArrowRight className="w-4 h-4" />
      </a>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item) => (
        <ItemCard key={item.title} {...item} />
      ))}
    </div>
  </section>
);

const sections: SectionProps[] = [
  {
    title: "Dashboard",
    items: [{ icon: LayoutDashboard, title: "Instance Overview" }],
  },
  {
    title: "People Management",
    items: [
      { icon: Users, title: "Participants" },
      { icon: UsersRound, title: "Groups" },
      { icon: Hotel, title: "Accommodation" },
    ],
  },
  {
    title: "Case Management",
    items: [
      { icon: Briefcase, title: "Case Management" },
      { icon: AlertTriangle, title: "Strikes Report" },
    ],
  },
  {
    title: "Operations",
    items: [
      { icon: CalendarDays, title: "Timetable" },
      { icon: UserCog, title: "Coach Management" },
      { icon: Wrench, title: "Maintenance" },
      { icon: Megaphone, title: "Announcements" },
      { icon: FolderOpen, title: "Resources" },
    ],
  },
  {
    title: "Reporting",
    items: [
      { icon: FileBarChart, title: "Participant Reports" },
      { icon: GitCompareArrows, title: "Cross-Instance Reports" },
    ],
  },
  {
    title: "System Management",
    items: [
      { icon: Building2, title: "Instances" },
      { icon: Shield, title: "Roles & Permissions" },
      { icon: History, title: "Audit & History" },
    ],
  },
  {
    title: "Attendance",
    items: [{ icon: ClipboardCheck, title: "Audit Log" }],
  },
];

const DashboardSections = () => (
  <div className="space-y-5">
    {sections.map((section) => (
      <Section key={section.title} {...section} />
    ))}
  </div>
);

export default DashboardSections;
