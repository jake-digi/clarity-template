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

const ItemCard = ({ icon: Icon, title, category }: SectionItem & { category: string }) => (
  <div className="bg-card rounded-lg p-5 flex flex-col items-start gap-3 hover:shadow-md transition-shadow cursor-pointer border border-border">
    <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
      <Icon className="w-6 h-6 text-icon-primary" strokeWidth={1.5} />
    </div>
    <div>
      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{category}</p>
    </div>
  </div>
);

const allItems: (SectionItem & { category: string })[] = [
  { icon: LayoutDashboard, title: "Instance Overview", category: "Dashboard" },
  { icon: Users, title: "Participants", category: "People" },
  { icon: UsersRound, title: "Groups", category: "People" },
  { icon: Hotel, title: "Accommodation", category: "People" },
  { icon: Briefcase, title: "Case Management", category: "Cases" },
  { icon: AlertTriangle, title: "Strikes Report", category: "Cases" },
  { icon: CalendarDays, title: "Timetable", category: "Operations" },
  { icon: UserCog, title: "Coach Management", category: "Operations" },
  { icon: Wrench, title: "Maintenance", category: "Operations" },
  { icon: Megaphone, title: "Announcements", category: "Operations" },
  { icon: FolderOpen, title: "Resources", category: "Operations" },
  { icon: FileBarChart, title: "Participant Reports", category: "Reporting" },
  { icon: GitCompareArrows, title: "Cross-Instance Reports", category: "Reporting" },
  { icon: Building2, title: "Instances", category: "System" },
  { icon: Shield, title: "Roles & Permissions", category: "System" },
  { icon: History, title: "Audit & History", category: "System" },
  { icon: ClipboardCheck, title: "Audit Log", category: "Attendance" },
];

const row1 = allItems.slice(0, 9);
const row2 = allItems.slice(9);

const DashboardSections = () => (
  <div className="space-y-5">
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Management</h2>
        <a href="#" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
          All systems <ArrowRight className="w-4 h-4" />
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-9 gap-3">
        {row1.map((item) => (
          <ItemCard key={item.title} {...item} />
        ))}
      </div>
    </section>
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Reporting & System</h2>
        <a href="#" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
          All services <ArrowRight className="w-4 h-4" />
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {row2.map((item) => (
          <ItemCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  </div>
);

export default DashboardSections;
