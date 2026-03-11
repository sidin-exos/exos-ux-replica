import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings, LogIn, User, ChevronDown, CreditCard, LogOut, HelpCircle, FileText, Database, Menu, ShieldAlert, TrendingUp } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getCategoryLabel, type Scenario } from "@/lib/scenarios";
import { Separator } from "@/components/ui/separator";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search, location.hash]);

  const mobileNavigate = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-border/50">
      <div className="container flex h-16 items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl overflow-hidden ring-2 ring-primary/20 shadow-md shadow-primary/10">
            <img src={exosLogo} alt="EXOS Logo" className="w-full h-full object-contain" />
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
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <div className="relative flex items-center gap-0.5">
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
              <DropdownMenuContent align="end" className="w-56">
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
          <div className="relative flex items-center gap-0.5">
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
              <DropdownMenuContent align="end" className="w-64">
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
          <div className="relative flex items-center gap-0.5">
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
              <DropdownMenuContent align="end" className="w-72">
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
          <div className="relative flex items-center gap-0.5">
            <button
              onClick={() => navigate("/enterprise/risk")}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors outline-none"
            >
              Enterprise
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-primary transition-colors outline-none p-0.5">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => navigate("/enterprise/risk")}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Risk Assessment Platform
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => navigate("/enterprise/inflation")}
                >
                  <TrendingUp className="w-4 h-4" />
                  Inflation Analysis Platform
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
            Pricing & FAQ
          </NavLink>
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto">
              <SheetHeader className="mb-4">
                <SheetTitle className="font-display text-lg">EXOS</SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-1">
                <button
                  onClick={() => mobileNavigate("/")}
                  className="text-sm font-medium text-foreground py-2.5 px-3 rounded-md hover:bg-muted text-left"
                >
                  Scenarios & Simulations
                </button>
                <button
                  onClick={() => mobileNavigate("/market-intelligence")}
                  className="text-sm font-medium text-foreground py-2.5 px-3 rounded-md hover:bg-muted text-left"
                >
                  Market Intelligence
                </button>
                <button
                  onClick={() => mobileNavigate("/features")}
                  className="text-sm font-medium text-foreground py-2.5 px-3 rounded-md hover:bg-muted text-left"
                >
                  Technology & Customer Success
                </button>
                <button
                  onClick={() => mobileNavigate("/reports")}
                  className="text-sm font-medium text-foreground py-2.5 px-3 rounded-md hover:bg-muted text-left"
                >
                  Dashboards & Analytics
                </button>
                <button
                  onClick={() => mobileNavigate("/enterprise/risk")}
                  className="text-sm font-medium text-foreground py-2.5 px-3 rounded-md hover:bg-muted text-left"
                >
                  Enterprise: Risk Assessment
                </button>
                <button
                  onClick={() => mobileNavigate("/enterprise/inflation")}
                  className="text-sm font-medium text-foreground py-2.5 px-3 rounded-md hover:bg-muted text-left"
                >
                  Enterprise: Inflation Analysis
                </button>
                <button
                  onClick={() => mobileNavigate("/pricing")}
                  className="text-sm font-medium text-foreground py-2.5 px-3 rounded-md hover:bg-muted text-left"
                >
                  Pricing & FAQ
                </button>
              </nav>

              <Separator className="my-4" />

              {user ? (
                <div className="flex flex-col gap-1">
                  <div className="px-3 py-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => mobileNavigate("/account")}
                    className="text-sm text-muted-foreground py-2.5 px-3 rounded-md hover:bg-muted text-left flex items-center gap-2"
                  >
                    <User className="w-4 h-4" /> My Account
                  </button>
                  <button
                    onClick={() => mobileNavigate("/reports")}
                    className="text-sm text-muted-foreground py-2.5 px-3 rounded-md hover:bg-muted text-left flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> My Reports
                  </button>
                  <button
                    onClick={() => mobileNavigate("/pricing#faq")}
                    className="text-sm text-muted-foreground py-2.5 px-3 rounded-md hover:bg-muted text-left flex items-center gap-2"
                  >
                    <HelpCircle className="w-4 h-4" /> Help & FAQ
                  </button>
                  <Separator className="my-2" />
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      mobileNavigate("/");
                    }}
                    className="text-sm text-destructive py-2.5 px-3 rounded-md hover:bg-muted text-left flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => mobileNavigate("/auth")}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              )}
            </SheetContent>
          </Sheet>
          
          {/* Desktop user menu */}
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
                  onClick={() => navigate("/pricing#faq")}
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
            <NavLink to="/auth" className="hidden md:inline-flex">
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
