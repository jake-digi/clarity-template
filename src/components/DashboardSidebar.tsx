import { Home, BarChart3, Users, Newspaper, Settings, Waypoints } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Waypoints, label: "Processes" },
  { icon: Newspaper, label: "News" },
  { icon: Users, label: "Contacts" },
  { icon: Settings, label: "Settings" },
];

const DashboardSidebar = () => {
  return (
    <aside className="w-14 bg-card border-r border-border flex flex-col items-center py-4 gap-2 shrink-0">
      {navItems.map((item, i) => (
        <button
          key={item.label}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            i === 0
              ? "bg-accent text-icon-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          title={item.label}
        >
          <item.icon className="w-5 h-5" />
        </button>
      ))}
    </aside>
  );
};

export default DashboardSidebar;
