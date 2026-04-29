import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Minus, Zap, Shield, Building2, HelpCircle, Mail, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactForm } from "@/components/contact/ContactForm";
import { useThemedLogo } from "@/hooks/useThemedLogo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type BillingInterval = "monthly" | "quarterly";

type PriceVariant = {
  priceId: string;
  price: number;
  displayPerMonth: number;
};

type PricingTier = {
  id: string;
  name: string;
  subtitle: string;
  icon: typeof Zap;
  featured: boolean;
  comingSoon?: boolean;
  features: string[];
  cta: string;
  monthly?: PriceVariant;
  quarterly?: PriceVariant;
};

const pricingTiers: PricingTier[] = [
  {
    id: "smb",
    name: "Starter/SMB",
    subtitle: "For companies without a dedicated procurement function",
    icon: Zap,
    featured: false,
    monthly:   { priceId: "price_1TEPHc34h5FyPJ356pnUXQNs", price: 29, displayPerMonth: 29 },
    quarterly: { priceId: "price_1TEPId34h5FyPJ35CAqDvL37", price: 72, displayPerMonth: 24 },
    features: [
      "Distilled procurement knowledge in one place",
      "29 Analytical scanarios",
      "Market Intelligence",
      "Validated secure data protocols",
      "100 AI reports a month",
      "Email support",
    ],
    cta: "Start Free Trial",
  },
  {
    id: "professional",
    name: "Professional",
    subtitle: "For dedicated procurement teams",
    icon: Shield,
    featured: true,
    monthly:   { priceId: "price_1TEPBt34h5FyPJ35YRdvRUc7", price: 99,  displayPerMonth: 99 },
    quarterly: { priceId: "price_1TEPCj34h5FyPJ35fAYMOadX", price: 197, displayPerMonth: 66 },
    features: [
      "Full EXOS Platform functionality",
      "Risk Assessment Platform",
      "Inflation Analysis Platform",
      "Multi-user collaboration",
      "Advanced reporting & exports",
      "200 AI reports a month",
      "1 Custom scenario per user per month*",
    ],
    cta: "Start Free Trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    subtitle: "Custom solutions for large organizations",
    icon: Building2,
    featured: false,
    comingSoon: false,
    features: [
      "Everything in Professional, plus:",
      "Custom data integrations",
      "Full InfoSec access to outgoing API requests",
      "Dedicated success manager",
      "Custom AI models configuration",
      "Custom enterprise Risk and Inflation analytics",
      "Custom API integrations",
    ],
    cta: "Book a 15-min Demo",
  },
];

const faqData = [
  {
    id: "tariff",
    question: "What is the right plan for me?",
    answer: `Pick the SMB (small and medium-sized business) option if you're in a small-to-medium-sized business, responsible for commercial transactions, and need distilled procurement best practices tailored to your business case each time.\n\nPick the Pro option if you're a full-time procurement professional who needs to run multiple simulations almost every day to improve decision-making and save significant time. We also recommend Pro for CFOs and business owners who are responsible for high-value decisions and need 24/7 analytical support.`,
  },
  {
    id: "data-privacy",
    question: "How do you ensure commercial data privacy?",
    answer: `All commercial data — supplier names, contract details, negotiation positions — is semantically anonymised before it reaches any external AI provider. For Enterprise users, we can additionally deploy our engine on your own server, giving your InfoSec team full visibility and control over all outgoing API requests.`,
  },
  {
    id: "fine-tuned-scenarios",
    question: "What do you mean by fine-tuned procurement scenarios?",
    answer: `Each scenario is enriched with industry-specific context, category expertise, and real-time market intelligence before analysis. EXOS validates your inputs against best-practice business cases, applies grounding from live market data—including trends, risk signals, and pricing benchmarks—and clearly flags its limitations when information is insufficient. The result is a decision-ready report, not a generic AI response.`,
  },
  {
    id: "price-comparison",
    question: "How is EXOS different from ChatGPT, Claude or Gemini?",
    answer: `EXOS is a specialised procurement tool, not a general-purpose chatbot. Three things set it apart: (1) it is purpose-built for procurement scenarios—sourcing, negotiation, supplier risk, TCO, should-cost—with category and industry expertise baked in; (2) every analysis goes through grounding, validation, and semantic anonymisation, so commercial data never leaks to external providers and outputs are checked against best-practice business cases rather than hallucinated; (3) it injects current market updates—live trends, risk signals, and pricing benchmarks from your private knowledge base—directly into every report. The result is a decision-ready procurement deliverable, not a generic AI answer.`,
  },
  {
    id: "market-intelligence",
    question: "How does Market Intelligence work?",
    answer: `Market Intelligence continuously scans trusted sources to deliver real-time insights on suppliers, commodities, regulations, and industry trends. Every finding is stored in your private knowledge base—never shared externally—and automatically used to enrich your analytical reports with live market data, risk signals, and pricing benchmarks. The more market intelligence you accumulate in your private knowledge base, the richer the context available to enrich your analytical reports.`,
  },
  {
    id: "fine-tuning",
    question: "Can I get EXOS fine-tuned for my purposes?",
    answer: `Absolutely. We can offer fine-tuning and customisation for Enterprise users. Pro users can request one custom scenario and one custom dashboard per month (conditions apply). Enterprise users get fully customised analytics and dashboards, the ability to upload their company knowledge base into the system, and regular market intelligence reports configured to continuously improve analysis quality.`,
  },
];

const Pricing = () => {
  const exosLogo = useThemedLogo();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        document.querySelector(location.hash)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.hash]);

  const handleSubscribe = async (tier: PricingTier) => {
    if (tier.id === "enterprise") {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const variant = billingInterval === "quarterly" ? tier.quarterly : tier.monthly;
    if (!variant?.priceId) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth?redirect=" + encodeURIComponent("/pricing"));
      return;
    }

    setLoadingTier(tier.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { price_id: variant.priceId },
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
      setLoadingTier(null);
    }
  };

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
            <img src={exosLogo} alt="EXOS procurement platform logo" className="h-24 md:h-32 w-auto object-contain" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Procurement AI at a fraction of enterprise cost. No implementation.
            No minimum seats. Cancel anytime.
          </h1>
        </section>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pricingTiers.map((tier, index) => {
            const Icon = tier.icon;
            return (
              <Card
                key={tier.id}
                className={`card-elevated relative animate-fade-up flex flex-col ${
                  tier.featured ? "border-primary/50 shadow-lg shadow-primary/10" : ""
                }`}
                style={{ animationDelay: `${100 + index * 100}ms` }}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
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

                <CardContent className="pt-4 flex flex-col flex-1">
                  {/* Price */}
                  <div className="text-center mb-6">
                    {tier.id === "enterprise" ? (
                      <div className="text-2xl font-display font-semibold text-muted-foreground">
                        Custom Pricing
                      </div>
                    ) : (() => {
                      const variant = billingInterval === "quarterly" ? tier.quarterly : tier.monthly;
                      if (!variant) return null;
                      return (
                        <div>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-display font-bold text-foreground">
                              €{variant.displayPerMonth}
                            </span>
                            <span className="text-muted-foreground">/month</span>
                          </div>
                          {billingInterval === "quarterly" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              €{variant.price} billed every 3 months
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6 flex-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    className={`w-full mt-auto ${tier.featured ? "" : "variant-outline"}`}
                    variant={tier.featured ? "default" : "outline"}
                    disabled={tier.comingSoon || loadingTier === tier.id}
                    onClick={() => handleSubscribe(tier)}
                  >
                    {loadingTier === tier.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Redirecting…
                      </>
                    ) : (
                      tier.cta
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trial disclaimer */}
        <p className="text-center text-xs text-muted-foreground mt-6 max-w-2xl mx-auto">
          30-day free trial. Cancel anytime before the trial ends to avoid being charged.
        </p>


        {/* Feature Comparison Table */}
        <section className="mt-20 max-w-5xl mx-auto animate-fade-up" style={{ animationDelay: "250ms" }}>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-center">
            Compare Plan <span className="text-gradient">Features</span>
          </h2>
          <div className="card-elevated border border-border/50 rounded-xl overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Feature</TableHead>
                  <TableHead className="text-center">Starter/SMB</TableHead>
                  <TableHead className="text-center font-semibold text-primary">Professional</TableHead>
                  <TableHead className="text-center">Enterprise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { feature: "AI Credits", smb: "100 / month", pro: "200 / month", enterprise: "Custom" },
                  { feature: "20+ procurement scenarios and Market Intelligence", smb: true, pro: true, enterprise: true },
                  { feature: "Risk and Inflation Platforms", smb: false, pro: true, enterprise: true },
                  { feature: "Users Training", smb: false, pro: false, enterprise: true },
                  { feature: "Custom integrations", smb: false, pro: false, enterprise: true },
                ].map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell className="font-medium text-foreground">{row.feature}</TableCell>
                    {(["smb", "pro", "enterprise"] as const).map((tier) => {
                      const val = row[tier];
                      return (
                        <TableCell key={tier} className="text-center">
                          {typeof val === "string" ? (
                            <span className="text-sm text-foreground">{val}</span>
                          ) : val ? (
                            <Check className="w-5 h-5 text-success mx-auto" />
                          ) : (
                            <Minus className="w-5 h-5 text-muted-foreground mx-auto" />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="mt-20 max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: "300ms" }}>
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to know about EXOS — AI architecture, data privacy, GDPR compliance, and procurement scenario coverage.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqData.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="card-elevated border border-border/50 rounded-lg px-6 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left text-foreground hover:no-underline py-5">
                  <span className="font-display font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 whitespace-pre-line">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Contact Section */}
        <section id="contact" className="mt-16 max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: "400ms" }}>
          <div className="card-elevated border border-border/50 rounded-xl p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">
                Contact <span className="text-gradient">Us</span>
              </h2>
              <p className="text-muted-foreground">
                Have a question or want to learn more? We'd love to hear from you.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
