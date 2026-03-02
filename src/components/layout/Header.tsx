import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, LogIn, User, ChevronDown, CreditCard, LogOut, HelpCircle, FileText, Database } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { useThemedLogo } from "@/hooks/useThemedLogo";
import exosLogoFallback from "@/assets/logo-concept-layers.png";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getCategoryLabel, type Scenario } from "@/lib/scenarios";

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
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => navigate("/")}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors outline-none"
            >
              Scenarios & Simulations
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-primary transition-colors outline-none p-0.5">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {(["analysis", "planning", "risk", "documentation"] as Scenario["category"][]).map((cat) => (
                  <DropdownMenuItem
                    key={cat}
                    className="cursor-pointer"
                    onClick={() => navigate(`/#category-${cat}`)}
                  >
                    {getCategoryLabel(cat)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => navigate("/market-intelligence")}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors outline-none"
            >
              Market Intelligence
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-primary transition-colors outline-none p-0.5">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/market-intelligence")}
                >
                  Generate a report
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/market-intelligence?tab=queries&mode=regular")}
                >
                  Set-up scheduled report or scenario trigger
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/market-intelligence?tab=insights")}
                >
                  Manage my knowledge base
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => navigate("/features")}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors outline-none"
            >
              Technology & Customer Success
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-primary transition-colors outline-none p-0.5">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/features#orchestration")}
                >
                  Fine-Tuned AI Agentic Orchestration
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/features#dataflow")}
                >
                  Privacy-First Data Flow
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/features#success")}
                >
                  Customer Success Stories
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-2 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-semibold text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity outline-none">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => navigate("/account")}
                >
                  <User className="w-4 h-4" />
                  My Account
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => navigate("/reports")}
                >
                  <FileText className="w-4 h-4" />
                  My Reports
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => navigate("/market-intelligence?tab=insights")}
                >
                  <Database className="w-4 h-4" />
                  My Knowledge Database
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => navigate("/account")}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => navigate("/pricing")}
                >
                  <CreditCard className="w-4 h-4" />
                  Manage Subscription
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => navigate("/faq")}
                >
                  <HelpCircle className="w-4 h-4" />
                  Help & FAQ
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate("/");
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
