import { Clock, Sun, CloudSnow, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

const ClockWidget = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

  return (
    <div className="bg-card rounded-lg p-3 flex flex-col items-end text-right">
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-4xl font-light text-foreground tracking-tight">
        {hours}:{minutes}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{days[time.getDay()]}</p>
      <p className="text-sm text-muted-foreground">
        {time.getDate().toString().padStart(2, "0")}.{months[time.getMonth()]}.{time.getFullYear()}
      </p>
      <div className="mt-3 space-y-0.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 justify-end">
          <span>Moscow -14 °C</span>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <span>St. Petersburg -16 °C</span>
          <CloudSnow className="w-3.5 h-3.5 text-icon-primary" />
        </div>
      </div>
    </div>
  );
};

export default ClockWidget;
