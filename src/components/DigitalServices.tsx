import {
  Monitor,
  Wrench,
  Code,
  AlertCircle,
  Car,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
}

const ServiceCard = ({ icon: Icon, title }: ServiceCardProps) => (
  <div className="bg-card rounded-lg p-5 flex flex-col items-start gap-3 hover:shadow-md transition-shadow cursor-pointer border border-border">
    <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
      <Icon className="w-6 h-6 text-icon-primary" strokeWidth={1.5} />
    </div>
    <p className="text-xs text-muted-foreground leading-relaxed">{title}</p>
  </div>
);

const services = [
  { icon: Monitor, title: "Request IT equipment" },
  { icon: Wrench, title: "Report a facility issue" },
  { icon: Code, title: "Install software" },
  { icon: AlertCircle, title: "Report a problem / get info" },
  { icon: Car, title: "Order vehicle transport" },
  { icon: ShoppingCart, title: "Order office supplies" },
];

const DigitalServices = () => {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Digital Services</h2>
        <a href="#" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
          All services <ArrowRight className="w-4 h-4" />
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {services.map((s) => (
          <ServiceCard key={s.title} {...s} />
        ))}
      </div>
    </section>
  );
};

export default DigitalServices;
