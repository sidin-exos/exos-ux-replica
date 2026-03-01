import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, LogIn, User } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { useThemedLogo } from "@/hooks/useThemedLogo";
import exosLogoFallback from "@/assets/logo-concept-layers.png";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const exosLogo = useThemedLogo();

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
          <div className="flex items-center justify-center w-16 h-16 rounded-xl overflow-hidden ring-2 ring-primary/20 shadow-md shadow-primary/10">
            <img src={exosLogo} alt="EXOS Logo" className="w-28 h-28 object-contain scale-[1.8]" />
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
            Scenarios & Simulations
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
            Dashboards & Analytics
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

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" aria-label="Settings" onClick={() => navigate("/account")}>
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
