import {
  Settings,
  UserCircle,
  Headphones,
  Users,
  AppWindow,
  Database,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SystemCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const SystemCard = ({ icon: Icon, title, description }: SystemCardProps) => (
  <div className="bg-card rounded-lg p-5 flex flex-col items-start gap-3 hover:shadow-md transition-shadow cursor-pointer border border-border">
    <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
      <Icon className="w-6 h-6 text-icon-primary" strokeWidth={1.5} />
    </div>
    <div>
      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
    </div>
  </div>
);

const systems = [
  { icon: Settings, title: "DAM", description: "Document automation management system" },
  { icon: UserCircle, title: "SUMS", description: "User management system personal account" },
  { icon: Headphones, title: "Support", description: "IT service company applications" },
  { icon: Users, title: "HRMS", description: "Automated HR management system" },
  { icon: AppWindow, title: "General Apps", description: "Explorer, browser, office applications" },
  { icon: Database, title: "CDS", description: "Corporate data storage" },
];

const InfoSystems = () => {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Information Systems</h2>
        <a href="#" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
          All systems <ArrowRight className="w-4 h-4" />
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {systems.map((s) => (
          <SystemCard key={s.title} {...s} />
        ))}
      </div>
    </section>
  );
};

export default InfoSystems;
