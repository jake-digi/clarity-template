import { MapPin, Users, UserCheck, Briefcase, CalendarCheck, TrendingUp, Activity } from "lucide-react";

const stats = [
  { label: "Total Participants", value: "1,247", icon: Users, trend: "+12%" },
  { label: "Active Cases", value: "38", icon: Briefcase, trend: "-3%" },
  { label: "Attendance Rate", value: "94.2%", icon: CalendarCheck, trend: "+1.5%" },
  { label: "Staff On Duty", value: "64", icon: UserCheck, trend: "" },
];

const DashboardOverview = () => {
  return (
    <div className="bg-card rounded-lg p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Welcome back, Admin</h2>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>Checkpoint North — Instance Active</span>
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Last updated: just now</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-accent/50 rounded-lg p-3 flex flex-col gap-1"
          >
            <div className="flex items-center gap-2">
              <stat.icon className="w-4 h-4 text-icon-primary" />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-xl font-bold text-foreground">{stat.value}</span>
              {stat.trend && (
                <span className={`text-xs font-medium mb-0.5 ${stat.trend.startsWith("+") ? "text-green-600" : "text-red-500"}`}>
                  <TrendingUp className="w-3 h-3 inline mr-0.5" />
                  {stat.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardOverview;
