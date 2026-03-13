import { Search, Bell, MessageSquare, User } from "lucide-react";
import jlgbLogo from "@/assets/jlgb-logo.png";

const DashboardHeader = () => {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-card border-b border-border">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <img src={jlgbLogo} alt="JLGB" className="h-9 w-auto" />
        </div>
        <nav className="flex items-center gap-6">
          <a href="https://www.jlgb.org" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-primary transition-colors">JLGB Website</a>
          <a href="https://www.jlgb.org/component/users/login" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-primary transition-colors">FUEL</a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <Search className="w-5 h-5 text-muted-foreground" />
        </button>
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="w-9 h-9 rounded-full bg-muted overflow-hidden">
          <User className="w-full h-full p-1.5 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
