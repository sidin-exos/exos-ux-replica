import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings, LogIn, User, CreditCard, LogOut, HelpCircle, FileText, Database, Menu, ShieldAlert, TrendingUp, BarChart3, Sparkles, BookOpen, DollarSign, Zap, ClipboardList, AlertTriangle, FileCheck } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { useThemedLogo } from "@/hooks/useThemedLogo";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import exosLogoFallback from "@/assets/logo-concept-layers.png";
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
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

// -- Navigation data ----------------------------------------------------------

const NAV_GROUPS = [
  {
    label: "Scenarios",
    items: [
      { label: "Analysis", path: "/#category-analysis", icon: BarChart3 },
      { label: "Planning", path: "/#category-planning", icon: ClipboardList },
      { label: "Risk", path: "/#category-risk", icon: AlertTriangle },
      { label: "Documentation", path: "/#category-documentation", icon: FileCheck },
    ],
  },
  {
    label: "Analytical Platforms",
    items: [
      { label: "Risk Assessment Platform", path: "/enterprise/risk", icon: ShieldAlert },
      { label: "Inflation Analysis Platform", path: "/enterprise/inflation", icon: TrendingUp },
    ],
  },
  {
    label: "About EXOS",
    items: [
      { label: "Dashboards & Analytics", path: "/reports", icon: BarChart3 },
      { label: "Technology & AI", path: "/features#orchestration", icon: Sparkles },
      { label: "Customer Success", path: "/features#success", icon: BookOpen },
      { label: "Pricing", path: "/pricing", icon: DollarSign },
      { label: "Help & FAQ", path: "/pricing#faq", icon: HelpCircle },
    ],
  },
] as const;

// -- Component ----------------------------------------------------------------

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { isSuperAdmin } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const exosLogo = useThemedLogo();

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
        {/* Logo */}
        <NavLink to="/welcome" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex items-center justify-center h-14 w-14 rounded-xl overflow-hidden ring-2 ring-primary/20 shadow-md shadow-primary/10">
            <img src={exosLogo} alt="EXOS Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground">EXOS</h1>
            <p className="text-xs text-muted-foreground">Your procurement exoskeleton</p>
          </div>
        </NavLink>

        {/* Desktop Mega-Menu */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {NAV_GROUPS.map((group) => (
              <NavigationMenuItem key={group.label}>
                <NavigationMenuTrigger className="text-sm font-medium text-muted-foreground bg-transparent hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent/50">
                  {group.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className={`grid gap-2 p-4 ${group.items.length > 3 ? "w-[480px] grid-cols-2" : "w-[320px] grid-cols-1"}`}>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.path}>
                          <button
                            onClick={() => navigate(item.path)}
                            className="flex items-center gap-3 w-full rounded-md p-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                          >
                            {Icon && <Icon className="h-4 w-4 shrink-0 text-primary" />}
                            {item.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

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

              <Accordion type="multiple" className="w-full">
                {NAV_GROUPS.map((group) => (
                  <AccordionItem key={group.label} value={group.label}>
                    <AccordionTrigger className="text-sm font-medium text-foreground py-2.5 px-3 hover:no-underline hover:bg-muted rounded-md">
                      {group.label}
                    </AccordionTrigger>
                    <AccordionContent className="pb-1 pt-0">
                      <div className="flex flex-col gap-0.5 pl-3">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.path}
                              onClick={() => mobileNavigate(item.path)}
                              className="text-sm text-muted-foreground py-2 px-3 rounded-md hover:bg-muted text-left flex items-center gap-2"
                            >
                              {Icon && <Icon className="w-4 h-4 text-primary" />}
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

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
                  {isSuperAdmin && (
                    <>
                      <Separator className="my-2" />
                      <button
                        onClick={() => mobileNavigate("/admin/methodology")}
                        className="text-sm text-muted-foreground py-2.5 px-3 rounded-md hover:bg-muted text-left flex items-center gap-2"
                      >
                        <BookOpen className="w-4 h-4" /> Methodology
                      </button>
                      <button
                        onClick={() => mobileNavigate("/admin/dashboard")}
                        className="text-sm text-muted-foreground py-2.5 px-3 rounded-md hover:bg-muted text-left flex items-center gap-2"
                      >
                        <BarChart3 className="w-4 h-4" /> Command Center
                      </button>
                      <button
                        onClick={() => mobileNavigate("/admin/analytics")}
                        className="text-sm text-muted-foreground py-2.5 px-3 rounded-md hover:bg-muted text-left flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" /> Analytics
                      </button>
                    </>
                  )}
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
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate("/account")}>
                  <User className="w-4 h-4" /> My Account
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate("/reports")}>
                  <FileText className="w-4 h-4" /> My Reports
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate("/market-intelligence?tab=insights")}>
                  <Database className="w-4 h-4" /> My Knowledge Database
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate("/account")}>
                  <Settings className="w-4 h-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate("/pricing")}>
                  <CreditCard className="w-4 h-4" /> Manage Subscription
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate("/pricing#faq")}>
                  <HelpCircle className="w-4 h-4" /> Help & FAQ
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate("/admin/methodology")}>
                      <BookOpen className="w-4 h-4" /> Methodology
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate("/admin/dashboard")}>
                      <BarChart3 className="w-4 h-4" /> Command Center
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate("/admin/analytics")}>
                      <Zap className="w-4 h-4" /> Analytics
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate("/");
                  }}
                >
                  <LogOut className="w-4 h-4" /> Sign Out
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
