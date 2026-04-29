import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Shield, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const plans = [
  {
    id: "smb",
    name: "SMB",
    price: "€29",
    period: "/month",
    icon: Zap,
    color: "var(--info)",
    features: ["AI-powered analysis", "SOW review tools", "5 reports/month", "Email support"],
    recommended: false,
    priceId: "price_1TEPHc34h5FyPJ356pnUXQNs",
  },
  {
    id: "professional",
    name: "Professional",
    price: "€99",
    period: "/month",
    icon: Shield,
    color: "var(--primary)",
    features: [
      "Unlimited simulations",
      "Full dashboard access",
      "Priority support",
      "Custom templates",
      "Market intelligence",
      "Team collaboration",
    ],
    recommended: true,
    priceId: "price_1TEPBt34h5FyPJ35YRdvRUc7",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    icon: Building2,
    color: "var(--iris)",
    features: ["Custom integrations", "SSO & security", "Dedicated manager", "SLA guarantees"],
    recommended: false,
    priceId: null,
  },
];

const UpgradePlansCard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof plans[number]) => {
    if (plan.id === "enterprise") {
      navigate("/pricing#contact");
      return;
    }
    if (!plan.priceId) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth?redirect=" + encodeURIComponent("/account"));
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { price_id: plan.priceId },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (err) {
      console.error("[checkout] failed", err);
      toast({
        title: "Could not start checkout",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      setLoadingPlan(null);
    }
  };

  return (
    <div id="upgrade-plans" className="space-y-6">
      <h2 className="font-display text-2xl font-semibold text-center">Upgrade Your Plan</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card
              key={plan.id}
              className={`card-elevated relative overflow-hidden ${
                plan.recommended ? "ring-2 ring-primary/30 shadow-lg shadow-primary/10" : ""
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
              )}
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground">Recommended</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2 pt-8">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `hsl(${plan.color} / 0.1)` }}
                >
                  <Icon className="w-6 h-6" style={{ color: `hsl(${plan.color})` }} />
                </div>
                <CardTitle className="font-display text-xl">{plan.name}</CardTitle>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-display font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: `hsl(${plan.color})` }} />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.recommended ? "default" : "outline"}
                  disabled={loadingPlan === plan.id}
                  onClick={() => handleSubscribe(plan)}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting…
                    </>
                  ) : plan.id === "enterprise" ? (
                    "Contact Sales"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trust bar */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <span>🔒 GDPR Compliant</span>
        <span>🛡️ SOC2-Ready</span>
        <span>✓ Cancel Anytime</span>
      </div>
    </div>
  );
};

export default UpgradePlansCard;
