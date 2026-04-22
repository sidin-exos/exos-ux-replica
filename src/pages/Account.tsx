import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import { Loader2, FileText, BarChart3, FolderOpen, Check, Zap, Shield, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useShareableMode } from "@/hooks/useShareableMode";
import { ModelConfigPanel } from "@/components/settings/ModelConfigPanel";
import UserFilesManager from "@/components/files/UserFilesManager";
import AccountSidebar from "@/components/account/AccountSidebar";
import TeamManagement from "@/components/account/TeamManagement";
import BillingSubscriptionCard from "@/components/account/BillingSubscriptionCard";
import { useAccountData } from "@/hooks/useAccountData";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const PLANS = [
  {
    id: "smb",
    name: "SMB",
    price: "€29",
    period: "/mo",
    icon: Zap,
    description: "Essential tools for small procurement teams.",
    features: ["AI-powered analysis", "5 reports/month", "Email support"],
    highlight: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: "€99",
    period: "/mo",
    icon: Shield,
    description: "Advanced analytics and team collaboration.",
    features: ["Unlimited simulations", "Priority support", "Market intelligence"],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    icon: Building2,
    description: "Bespoke infrastructure for global operations.",
    features: ["SSO & security", "Dedicated manager", "SLA guarantees"],
    highlight: false,
  },
];

const Account = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { showTechnicalDetails } = useShareableMode();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  const { profile, usage, emptyFieldCount, updateProfile, isLoading: profileLoading } = useAccountData();

  useEffect(() => {
    if (searchParams.get("confirmed") === "true") {
      toast({ title: "Account confirmed!", description: "Your email has been verified. Welcome to EXOS!" });
      searchParams.delete("confirmed");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch {
      toast({ title: "Sign out failed", variant: "destructive" });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSubscribe = () => {
    toast({ title: "Coming Soon", description: "Stripe payment integration will be configured shortly." });
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-10 lg:py-12">
        {/* Editorial header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-6 border-b border-border mb-10 gap-4">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl tracking-tight text-primary">Account Space</h1>
            {lastSignIn && (
              <p className="text-sm text-muted-foreground mt-1">Last sign-in · {lastSignIn}</p>
            )}
          </div>
          <div className="flex gap-6 text-sm font-medium items-center">
            <span className="text-iris hidden sm:inline">System Status: Optimal</span>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-copper underline underline-offset-4 hover:text-copper/80 disabled:opacity-50"
            >
              {isSigningOut ? "Signing out…" : "Sign Out"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            {profileLoading || !profile ? (
              <Skeleton className="h-96 w-full rounded-lg" />
            ) : (
              <AccountSidebar
                profile={profile}
                email={user?.email ?? ""}
                emptyFieldCount={emptyFieldCount}
                updateProfile={updateProfile}
                activeSection={activeSection}
                onSectionChange={scrollTo}
              />
            )}
          </div>

          {/* Main content */}
          <section className="lg:col-span-9 space-y-10">
            {/* Plan & Usage */}
            <div id="section-plan" className="space-y-4">
              <div className="flex items-end justify-between">
                <h2 className="font-display text-lg font-semibold text-foreground">Plan & Usage</h2>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Free Plan</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <UsageTile icon={FileText} label="Reports Generated" value="—" />
                <UsageTile icon={BarChart3} label="Analyses Run" value="—" />
                <UsageTile icon={FolderOpen} label="Files Uploaded" value={String(usage.fileCount)} />
              </div>
            </div>

            {/* Team (admin-only) */}
            {profile?.role === "admin" && user && (
              <TeamManagement
                organizationId={profile.organization_id}
                currentUserId={user.id}
              />
            )}

            {/* Upgrade Plans */}
            <div id="section-profile" className="bg-card border border-border p-6 lg:p-8 rounded-lg">
              <div className="flex items-end justify-between mb-6">
                <h2 className="font-display text-lg font-semibold text-foreground">Available Plans</h2>
                <span className="text-xs text-muted-foreground">Cancel anytime · GDPR compliant</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map((plan) => {
                  const Icon = plan.icon;
                  const isHighlight = plan.highlight;
                  return (
                    <div
                      key={plan.id}
                      className={`p-5 rounded-md border transition-all ${
                        isHighlight
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background border-border hover:border-primary"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display font-medium">{plan.name}</h3>
                        <Icon className={`w-4 h-4 ${isHighlight ? "opacity-70" : "text-primary"}`} />
                      </div>
                      <div className="mb-4">
                        <span className={`text-2xl font-display ${
                          isHighlight ? "" : plan.id === "enterprise" ? "text-iris" : "text-copper"
                        }`}>
                          {plan.price}
                        </span>
                        <span className="text-sm opacity-70">{plan.period}</span>
                      </div>
                      <p className={`text-xs mb-4 ${isHighlight ? "opacity-80" : "text-muted-foreground"}`}>
                        {plan.description}
                      </p>
                      <ul className="space-y-1.5 mb-5">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <Check className={`w-3 h-3 mt-0.5 shrink-0 ${isHighlight ? "" : "text-primary"}`} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        size="sm"
                        variant={isHighlight ? "secondary" : "outline"}
                        className="w-full"
                        onClick={handleSubscribe}
                      >
                        {plan.id === "enterprise" ? "Contact Sales" : "Subscribe"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Storage Assets */}
            <div id="section-files" className="bg-card border border-border p-6 lg:p-8 rounded-lg">
              <h2 className="font-display text-lg font-semibold text-foreground mb-6">Storage Assets</h2>
              <UserFilesManager />
            </div>

            {/* Billing */}
            <div id="section-billing" className="bg-card border border-border p-6 lg:p-8 rounded-lg">
              <h2 className="font-display text-lg font-semibold text-foreground mb-6">Recent Billing</h2>
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-sm">No billing history yet.</p>
                <p className="text-xs mt-1">Invoices will appear here after you subscribe to a plan.</p>
              </div>
            </div>

            {/* Admin model config (super-admin only) */}
            {showTechnicalDetails && <ModelConfigPanel />}
          </section>
        </div>
      </main>
    </div>
  );
};

function UsageTile({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) {
  return (
    <div className="bg-card border border-border p-5 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className="w-4 h-4 text-primary/70" />
      </div>
      <p className="text-3xl font-display font-light tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export default Account;
