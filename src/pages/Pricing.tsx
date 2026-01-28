import { Check, Zap, Shield, Building2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import exosLogo from "@/assets/logo-concept-layers.png";

const pricingTiers = [
  {
    id: "smb",
    name: "SMB",
    subtitle: "For companies without dedicated procurement",
    price: "49",
    period: "month",
    icon: Zap,
    featured: false,
    features: [
      "Distilled procurement knowledge in one place",
      "AI-powered analysis scenarios",
      "SOW & contract review tools",
      "Negotiation preparation frameworks",
      "Risk assessment matrices",
      "Email support",
    ],
    cta: "Get Started",
  },
  {
    id: "professional",
    name: "Procurement Professionals",
    subtitle: "For dedicated procurement teams",
    price: "199",
    period: "month",
    icon: Shield,
    featured: true,
    features: [
      "Everything in SMB, plus:",
      "Unlimited simulations & scenarios",
      "Full dashboard access",
      "Validated secure data protocols",
      "Multi-user collaboration",
      "Advanced reporting & exports",
      "Priority support",
    ],
    cta: "Start Free Trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    subtitle: "Custom solutions for large organizations",
    price: null,
    period: null,
    icon: Building2,
    featured: false,
    comingSoon: true,
    features: [
      "Everything in Professional, plus:",
      "Custom data integrations",
      "SSO & advanced security",
      "Dedicated success manager",
      "Custom AI model training",
      "On-premise deployment options",
      "SLA guarantees",
    ],
    cta: "Contact Sales",
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen gradient-hero">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--gradient-glow)" }}
      />

      <Header />

      <main className="container py-8 relative">
        {/* Hero Section */}
        <section className="mb-12 text-center animate-fade-up">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 md:w-32 md:h-32 overflow-hidden rounded-xl">
              <img src={exosLogo} alt="EXOS" className="w-full h-full object-contain scale-[1.8]" />
            </div>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Simple, Transparent <span className="text-gradient">Pricing</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the plan that fits your procurement needs. 
            No hidden fees, cancel anytime.
          </p>
        </section>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pricingTiers.map((tier, index) => {
            const Icon = tier.icon;
            return (
              <Card
                key={tier.id}
                className={`card-elevated relative animate-fade-up ${
                  tier.featured ? "border-primary/50 shadow-lg shadow-primary/10" : ""
                }`}
                style={{ animationDelay: `${100 + index * 100}ms` }}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                {tier.comingSoon && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2 pt-8">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tier.subtitle}
                  </p>
                </CardHeader>

                <CardContent className="pt-4">
                  {/* Price */}
                  <div className="text-center mb-6">
                    {tier.price ? (
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-display font-bold text-foreground">
                          €{tier.price}
                        </span>
                        <span className="text-muted-foreground">/{tier.period}</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-display font-semibold text-muted-foreground">
                        Custom Pricing
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    className={`w-full ${tier.featured ? "" : "variant-outline"}`}
                    variant={tier.featured ? "default" : "outline"}
                    disabled={tier.comingSoon}
                  >
                    {tier.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ or Trust Section */}
        <section className="mt-16 text-center animate-fade-up" style={{ animationDelay: "400ms" }}>
          <p className="text-muted-foreground">
            Questions? <a href="#" className="text-primary hover:underline">Contact our team</a> or 
            check our <a href="#" className="text-primary hover:underline">FAQ</a>
          </p>
        </section>
      </main>
    </div>
  );
};

export default Pricing;
