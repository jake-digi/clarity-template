import { useNavigate } from "react-router-dom";
import {
  Users, UserCheck, UserPlus, Upload, Tent, Building2,
  Briefcase, PlusCircle, FileBarChart, Code2, BookOpen,
  MapPin, Bus, Package, Heart, CalendarDays, Megaphone, FileText,
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
    title: "People",
    items: [
      { icon: Users, title: "Users", description: "Manage staff and personnel", path: "/people" },
      { icon: UserPlus, title: "Invite User", description: "Send a new user invitation", path: "/admin?tab=users" },
      { icon: UserCheck, title: "Participants", description: "Participant records and details", path: "/participants" },
      { icon: Upload, title: "Import Participants", description: "Bulk import from CSV or Excel", path: "/participants?import=true" },
    ],
  },
  {
    title: "Operations",
    items: [
      { icon: Building2, title: "Instances", description: "Events, camps and expeditions", path: "/instances" },
      { icon: PlusCircle, title: "Add Instance", description: "Create a new instance", path: "/instances/new" },
      { icon: Tent, title: "Sites", description: "Manage accommodation sites", path: "/sites" },
      { icon: MapPin, title: "Tracking", description: "Live group tracking", path: "/tracking" },
    ],
  },
  {
    title: "Cases & Reporting",
    items: [
      { icon: Briefcase, title: "Cases", description: "Behaviour and welfare cases", path: "/cases" },
      { icon: PlusCircle, title: "New Case", description: "Open a new case", path: "/cases?new=true" },
      { icon: FileBarChart, title: "Report Builder", description: "Build and export reports", path: "/reports" },
    ],
  },
  {
    title: "Developer & Admin",
    items: [
      { icon: Code2, title: "Developer", description: "API keys, playground and logs", path: "/admin?tab=developer" },
      { icon: BookOpen, title: "Documentation", description: "Guides and API reference", path: "/docs" },
    ],
  },
];

const ItemCard = ({ icon: Icon, title, description, path }: SectionItem) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => path && navigate(path)}
      className={`bg-card rounded-lg p-5 flex flex-col items-start gap-3 transition-all border border-border ${path ? "hover:shadow-md hover:border-primary/20 cursor-pointer" : "opacity-60 cursor-default"}`}
    >
      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
        <Icon className="w-5 h-5 text-accent-foreground" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
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
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{section.title}</h2>
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
