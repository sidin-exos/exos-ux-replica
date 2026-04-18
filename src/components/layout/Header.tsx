import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings, LogIn, User, CreditCard, LogOut, HelpCircle, FileText, Database, Menu, ShieldAlert, TrendingUp, BarChart3, Sparkles, BookOpen, DollarSign, Zap, ClipboardList, AlertTriangle, FileCheck, PenLine } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { useThemedLogo } from "@/hooks/useThemedLogo";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import exosLogoFallback from "@/assets/exos-logo-dark.svg";
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

type NavItem = {
  label: string;
  path: string;
  icon: typeof BarChart3;
  description?: string;
};

type NavFeature = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaPath: string;
  icon: typeof Sparkles;
};

type NavGroup = {
  label: string;
  items: NavItem[];
  feature?: NavFeature;
};

const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: "Scenarios",
    items: [
      { label: "Analysis", path: "/#category-analysis", icon: BarChart3, description: "TCO, should-cost & cost waterfalls" },
      { label: "Planning", path: "/#category-planning", icon: ClipboardList, description: "Make-or-buy & sourcing strategy" },
      { label: "Risk", path: "/#category-risk", icon: AlertTriangle, description: "Supplier, geopolitical & black swan" },
      { label: "Documentation", path: "/#category-documentation", icon: FileCheck, description: "SOW reviews & negotiation prep" },
    ],
    feature: {
      eyebrow: "Featured",
      title: "29 Scenarios Library",
      description: "Human-in-the-loop analyses for the procurement decisions that matter most.",
      ctaLabel: "Explore scenarios",
      ctaPath: "/",
      icon: Sparkles,
    },
  },
  {
    label: "Analytical Platforms",
    items: [
      { label: "Risk Assessment Platform", path: "/enterprise/risk", icon: ShieldAlert, description: "Continuous monitoring of suppliers & exposure" },
      { label: "Inflation Analysis Platform", path: "/enterprise/inflation", icon: TrendingUp, description: "Driver-level signal radar for cost shifts" },
    ],
    feature: {
      eyebrow: "New",
      title: "Delta-First Monitoring",
      description: "Catch material changes early — focus your team on what actually moved.",
      ctaLabel: "See how it works",
      ctaPath: "/features",
      icon: TrendingUp,
    },
  },
  {
    label: "About EXOS",
    items: [
      { label: "Technology & AI", path: "/features", icon: Sparkles, description: "Agentic workflow & grounding stack" },
      { label: "Blog", path: "/blog", icon: PenLine, description: "Procurement insights & playbooks" },
      { label: "Pricing", path: "/pricing", icon: DollarSign, description: "Plans for SMB to enterprise" },
      { label: "Help & FAQ", path: "/pricing#faq", icon: HelpCircle, description: "Answers to common questions" },
    ],
    feature: {
      eyebrow: "Get started",
      title: "ROI from day one",
      description: "Transparent pricing, no consultants needed. Start with the Starter plan.",
      ctaLabel: "View pricing",
      ctaPath: "/pricing",
      icon: DollarSign,
    },
  },
] as const;

// Smart navigation that handles hash links to the current page
const HEADER_OFFSET = 96;
const scrollToHashId = (hashPart: string) => {
  const el = document.getElementById(hashPart);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
  return true;
};
const navigateWithHash = (path: string, navigate: (p: string) => void) => {
  const hashIndex = path.indexOf("#");
  if (hashIndex !== -1) {
    const [pathPart, hashPart] = [path.slice(0, hashIndex) || "/", path.slice(hashIndex + 1)];
    if (window.location.pathname === pathPart) {
      if (scrollToHashId(hashPart)) {
        window.history.replaceState(null, "", `${pathPart}#${hashPart}`);
        return;
      }
    }
  }
  navigate(path);
};

// Shared mega-dropdown content renderer
const MegaDropdown = ({ group, navigate }: { group: NavGroup; navigate: (path: string) => void }) => {
  const hasFeature = !!group.feature;
  const FeatureIcon = group.feature?.icon;
  return (
    <div className={`grid ${hasFeature ? "w-[640px] grid-cols-3" : "w-[420px] grid-cols-2"}`}>
      <div className="col-span-2 p-5">
        <p className="font-display text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-3">
          {group.label}
        </p>
        <ul className="grid grid-cols-2 gap-1.5">
          {group.items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigateWithHash(item.path, navigate)}
                  type="button"
                  className="group flex items-start gap-3 w-full rounded-lg p-2.5 hover:bg-accent transition-colors text-left"
                >
                  <div className="shrink-0 w-9 h-9 rounded-md bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center text-primary transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors leading-tight">
                      {item.label}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {group.feature && FeatureIcon && (
        <div className="border-l border-border bg-muted/30 p-5 flex flex-col">
          <p className="font-display text-[11px] font-semibold tracking-[0.18em] uppercase text-primary mb-3">
            {group.feature.eyebrow}
          </p>
          <div className="aspect-[4/3] rounded-md bg-gradient-to-br from-primary via-accent to-primary/60 mb-3 flex items-center justify-center">
            <FeatureIcon className="w-8 h-8 text-primary-foreground/90" />
          </div>
          <h4 className="font-display font-semibold text-sm text-foreground leading-tight mb-1">
            {group.feature.title}
          </h4>
          <p className="text-xs text-muted-foreground leading-snug mb-3 flex-1">
            {group.feature.description}
          </p>
          <button
            onClick={() => navigate(group.feature!.ctaPath)}
            type="button"
            className="text-xs font-semibold text-primary hover:underline text-left"
          >
            {group.feature.ctaLabel} →
          </button>
        </div>
      )}
    </div>
  );
};

// -- Component ----------------------------------------------------------------

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { isSuperAdmin } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const exosLogo = useThemedLogo();

  // Close transient navigation UI on route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search, location.hash]);

  const mobileNavigate = (path: string) => {
    setMobileOpen(false);
    setTimeout(() => navigateWithHash(path, navigate), 50);
  };

  return (
    <header className="sticky top-0 z-50 mx-3 md:mx-6 rounded-b-2xl bg-background/80 dark:bg-card/95 backdrop-blur-md border border-t-0 border-border/50 dark:border-border shadow-lg dark:shadow-2xl dark:shadow-black/40">
      <div className="px-4 md:px-6 flex h-16 items-center justify-between">
        {/* Logo */}
        <NavLink to="/welcome" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img src={exosLogo} alt="EXOS procurement platform logo" className="h-9 md:h-10 w-auto object-contain" />
          <div className="h-7 w-px bg-border/60" />
          <span className="font-display font-bold text-2xl md:text-[28px] tracking-[0.15em] text-foreground leading-none">
            EXOS
          </span>
        </NavLink>

        {/* Desktop Mega-Menu */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_GROUPS.slice(0, 2).map((group) => (
            <NavigationMenu key={group.label}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className="font-display font-semibold tracking-tight text-[15px] text-foreground/80 bg-transparent hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent/50"
                    onClick={() => {
                      if (group.label === "Scenarios") {
                        navigate("/");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                  >
                    {group.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <MegaDropdown group={group} navigate={navigate} />
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          ))}

          <button
            onClick={() => navigate("/market-intelligence")}
            className="font-display font-semibold tracking-tight text-[15px] text-foreground/80 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Market Intelligence
          </button>

          {NAV_GROUPS.slice(2).map((group) => (
            <NavigationMenu key={group.label}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className="font-display font-semibold tracking-tight text-[15px] text-foreground/80 bg-transparent hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent/50"
                  >
                    {group.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <MegaDropdown group={group} navigate={navigate} />
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          ))}
        </div>

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
                {NAV_GROUPS.slice(0, 2).map((group) => (
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

              <button
                onClick={() => mobileNavigate("/market-intelligence")}
                className="text-sm font-medium text-foreground py-2.5 px-3 hover:bg-muted rounded-md text-left flex items-center gap-2 w-full"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                Market Intelligence
              </button>

              <Accordion type="multiple" className="w-full">
                {NAV_GROUPS.slice(2).map((group) => (
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
                    onClick={() => mobileNavigate("/features#dashboards")}
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
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate("/features#dashboards")}>
                  <FileText className="w-4 h-4" /> My Reports
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate("/market-intelligence?tab=insights")}>
                  <Database className="w-4 h-4" /> My Knowledge Database
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
