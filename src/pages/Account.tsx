import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/Header";
import { User, CreditCard, LogOut, Loader2, Check, Zap, Shield, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useShareableMode } from "@/hooks/useShareableMode";
import { ModelConfigPanel } from "@/components/settings/ModelConfigPanel";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const subscriptionPlans = [
  {
    id: "smb",
    name: "SMB",
    price: "€29",
    period: "/month",
    icon: Zap,
    features: ["AI-powered analysis", "SOW review tools", "Email support"],
    current: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: "€99",
    period: "/month",
    icon: Shield,
    features: ["Unlimited simulations", "Full dashboard access", "Priority support"],
    current: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    icon: Building2,
    features: ["Custom integrations", "SSO & security", "Dedicated manager"],
    current: false,
    comingSoon: true,
  },
];

const Account = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showTechnicalDetails } = useShareableMode();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "An error occurred while signing out",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSubscribe = (planId: string) => {
    toast({
      title: "Coming Soon",
      description: "Stripe payment integration will be configured shortly",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--gradient-glow)" }}
      />

      <Header />

      <main className="container py-8 relative">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Account Info Section */}
          <Card className="card-elevated animate-fade-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-semibold text-primary-foreground">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl">
                      {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {user?.email}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="gap-2"
                >
                  {isSigningOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  Sign Out
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Current Subscription Section */}
          <Card className="card-elevated animate-fade-up" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <CardTitle className="font-display text-lg">Subscription</CardTitle>
              </div>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div>
                  <p className="font-medium text-foreground">Free Plan</p>
                  <p className="text-sm text-muted-foreground">
                    Basic access to EXOS features
                  </p>
                </div>
                <Badge variant="secondary">Current Plan</Badge>
              </div>
            </CardContent>
          </Card>

          {/* AI Model Configuration Panel (internal users only) */}
          {showTechnicalDetails && (
            <ModelConfigPanel />
          )}

          <Separator className="my-8" />

          {/* Subscription Plans Section */}
          <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
            <h2 className="font-display text-2xl font-semibold text-center mb-6">
              Upgrade Your Plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan, index) => {
                const Icon = plan.icon;
                return (
                  <Card
                    key={plan.id}
                    className={`card-elevated relative ${
                      plan.current ? "border-primary/50 shadow-lg shadow-primary/10" : ""
                    }`}
                    style={{ animationDelay: `${300 + index * 100}ms` }}
                  >
                    {plan.comingSoon && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="secondary">Coming Soon</Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-2 pt-8">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-foreground" />
                      </div>
                      <h3 className="font-display text-xl font-semibold text-foreground">
                        {plan.name}
                      </h3>
                    </CardHeader>

                    <CardContent className="pt-4">
                      <div className="text-center mb-6">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-display font-bold text-foreground">
                            {plan.price}
                          </span>
                          <span className="text-muted-foreground">{plan.period}</span>
                        </div>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="w-full"
                        variant={plan.current ? "secondary" : "default"}
                        disabled={plan.comingSoon || plan.current}
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        {plan.current ? "Current Plan" : plan.comingSoon ? "Coming Soon" : "Subscribe"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Billing History Placeholder */}
          <Card className="card-elevated animate-fade-up" style={{ animationDelay: "600ms" }}>
            <CardHeader>
              <CardTitle className="font-display text-lg">Billing History</CardTitle>
              <CardDescription>
                View your past invoices and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No billing history yet</p>
                <p className="text-sm">
                  Your invoices will appear here after you subscribe
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Account;
