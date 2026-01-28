import { Brain, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-border/50">
      <div className="container flex h-16 items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg gradient-primary">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground">
              EXOS
            </h1>
            <p className="text-xs text-muted-foreground">
              Your procurement exoskeleton
            </p>
          </div>
        </NavLink>
        
        <nav className="hidden md:flex items-center gap-6">
          <NavLink 
            to="/" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            activeClassName="text-foreground"
          >
            Scenarios
          </NavLink>
          <NavLink 
            to="/features" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            activeClassName="text-foreground"
          >
            Technology
          </NavLink>
          <NavLink 
            to="/reports" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            activeClassName="text-foreground"
          >
            Reports
          </NavLink>
          <NavLink 
            to="/pricing" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            activeClassName="text-foreground"
          >
            Pricing
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
          <div className="ml-2 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-semibold text-primary-foreground">
            JD
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
