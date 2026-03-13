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
  <div className="bg-card rounded-lg p-3 flex items-center gap-2.5 hover:shadow-md transition-shadow cursor-pointer border border-border">
    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-icon-primary" strokeWidth={1.5} />
    </div>
    <p className="text-sm font-medium text-foreground">{title}</p>
  </div>
);

const SectionGroup = ({ title, items }: SectionProps) => (
  <div>
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
    <div className="flex flex-col gap-1.5">
      {items.map((item) => (
        <ItemCard key={item.title} {...item} />
      ))}
    </div>
  </div>
);

const row1 = sections.slice(0, 4);
const row2 = sections.slice(4);

const DashboardSections = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {row1.map((section) => (
        <SectionGroup key={section.title} {...section} />
      ))}
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {row2.map((section) => (
        <SectionGroup key={section.title} {...section} />
      ))}
    </div>
  </div>
);

export default DashboardSections;
