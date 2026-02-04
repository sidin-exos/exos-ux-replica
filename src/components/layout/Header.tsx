import { useState, useEffect } from "react";
import { Settings, Bell, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import exosLogo from "@/assets/logo-concept-layers.png";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Header = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-border/50">
      <div className="container flex h-16 items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex items-center justify-center w-14 h-14 rounded-lg overflow-hidden">
            <img src={exosLogo} alt="EXOS Logo" className="w-24 h-24 object-contain scale-[1.8]" />
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
            Analytics & Simulations
          </NavLink>
          <NavLink 
            to="/market-intelligence" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            activeClassName="text-foreground"
          >
            Market Intelligence
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
            Dashboards
          </NavLink>
          <NavLink 
            to="/pricing" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            activeClassName="text-foreground"
          >
            Pricing
          </NavLink>
          <NavLink 
            to="/faq" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            activeClassName="text-foreground"
          >
            FAQ
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
          
          {user ? (
            <NavLink to="/account">
              <div className="ml-2 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-semibold text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
            </NavLink>
          ) : (
            <NavLink to="/auth">
              <Button variant="default" size="sm" className="ml-2 gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
