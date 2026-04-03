import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Radar, Quote, Building2, CheckCircle } from "lucide-react";
import PillarUseCaseDropdown from "@/components/welcome/PillarUseCaseDropdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SiteFeedbackButton from "@/components/feedback/SiteFeedbackButton";

/* ── Feature Pillars ── */
const pillars = [
  {
    number: "01",
    title: "Analytical Scenarios",
    description:
      "20+ AI scenario types — from cost optimization to negotiation prep. Provide context, receive actionable dashboards.",
    details: [
      "Cost optimization & TCO comparison",
      "Supplier consolidation & scoring",
      "Negotiation prep & SOW analysis",
      "Risk scoring & decision matrices",
    ],
    impact: "Complex analyses in minutes, not weeks.",
    icon: BarChart3,
    cta: "Explore Scenarios",
    href: "/",
    useCaseType: "scenarios" as const,
  },
  {
    number: "02",
    title: "Market Intelligence",
    description:
      "Query global supply chain data, commodity pricing, and geopolitical risks in real time. Schedule automated monitoring.",
    details: [
      "Commodity price tracking & forecasts",
      "Geopolitical risk feeds & alerts",
      "Supplier benchmarking across industries",
      "Scheduled PDF intelligence reports",
    ],
    impact: "Benchmark strategy against live industry data.",
    icon: Radar,
    cta: "Open Intelligence Hub",
    href: "/market-intelligence",
    useCaseType: "scenarios" as const,
  },
  {
    number: "03",
    title: "Enterprise Platforms",
    description:
      "Always-on Risk Assessment and Inflation Analysis platforms with automated alerts and category-level trend tracking.",
    details: [
      "Risk Assessment Platform with automated alerts",
      "Inflation Analysis with category-level trends",
      "Cross-portfolio monitoring dashboards",
    ],
    impact: "From periodic reviews to continuous monitoring.",
    icon: Building2,
    cta: "View Platforms",
    href: "/enterprise/risk",
    useCaseType: "risk" as const,
  },
];

/* ── Stats ── */
const stats = [
  { value: "29", label: "Procurement Scenarios" },
  { value: "30", label: "Industry Knowledge Bases" },
  { value: "99.9%", label: "Compliance Rate" },
];

/* ── Page ── */
const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
        <div className="container relative py-20 md:py-28 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="flex flex-col gap-6 max-w-xl">
              <Badge variant="outline" className="w-fit border-primary/30 text-primary text-xs tracking-wider uppercase">
                ✦ The Future of Procurement
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-foreground leading-[1.1] tracking-tight">
                Procurement Strategy,{" "}
                <span className="italic" style={{ color: "hsl(var(--primary))" }}>
                  Powered by AI
                </span>
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Transform complex data into surgical precision. Decouple from legacy friction and decide with confidence using real-time market architectural intelligence.
              </p>
              <div className="flex flex-wrap gap-3 mt-2">
                <Button size="lg" className="gap-2 px-6" onClick={() => navigate("/")}>
                  Get a Demo
                </Button>
                <Button size="lg" variant="outline" className="gap-2 px-6" onClick={() => navigate("/features")}>
                  Explore Solutions
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-2">
                <span className="uppercase tracking-widest font-medium">Trusted by 500+ Enterprise Teams</span>
              </p>
            </div>

            {/* Right — Abstract dashboard preview */}
            <div className="hidden lg:flex justify-end">
              <Card className="w-full max-w-md border-border/50 shadow-lg overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">AI Optimization</span>
                    <Badge className="bg-success/15 text-success border-0 text-xs">Active</Badge>
                  </div>
                  <div className="space-y-2">
                    {[85, 62, 91, 74].map((val, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-8">Q{i + 1}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${val}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-foreground w-8 text-right">{val}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      <CheckCircle className="w-3 h-3 inline mr-1 text-success" />
                      Savings optimized in 127 dashboard scenarios
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Architectural Intelligence Heading ───── */}
      <section className="container py-10 md:py-12">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Architectural Intelligence
          </h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            A unified ecosystem designed to replace fragmented legacy tools with high-fidelity procurement workflows.
          </p>
        </div>
      </section>

      {/* ───── Feature Pillars (alternating layout) ───── */}
      {pillars.map((pillar, i) => {
        const Icon = pillar.icon;
        const isEven = i % 2 === 0;

        return (
          <section
            key={pillar.number}
            className={`py-8 md:py-10 ${i % 2 === 1 ? "bg-muted/30" : ""}`}
          >
            <div className="container">
              <div className={`grid md:grid-cols-2 gap-8 lg:gap-12 items-center max-w-6xl mx-auto ${!isEven ? "direction-rtl" : ""}`}>
                {/* Text side */}
                <div className={`flex flex-col gap-3 ${!isEven ? "md:order-2" : ""}`}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-5xl font-bold text-primary/15 select-none">
                      {pillar.number}
                    </span>
                    <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                      {pillar.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {pillar.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-3">
                      <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-0.5">
                        Business Impact
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {pillar.impact}
                      </p>
                      <PillarUseCaseDropdown type={pillar.useCaseType} />
                    </CardContent>
                  </Card>
                  <Button className="gap-2 w-fit" onClick={() => navigate(pillar.href)}>
                    {pillar.cta} <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Visual side — abstract placeholder */}
                <div className={`${!isEven ? "md:order-1" : ""}`}>
                  <Card className="overflow-hidden border-border/50 bg-muted/20">
                    <CardContent className="p-0">
                      <div className="aspect-[16/10] flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                          <Icon className="w-8 h-8 text-primary/60" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* ───── Stats Section ───── */}
      <section className="py-16 md:py-20">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Agentic AI Tailored for Your Needs
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-4xl md:text-5xl font-bold" style={{ color: "hsl(var(--primary))" }}>
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Testimonial ───── */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Quote className="w-10 h-10 text-primary/30 mx-auto mb-6" />
            <blockquote className="text-lg md:text-xl text-foreground italic leading-relaxed">
              "EXOS didn't just give us another dashboard. They gave us a new way to see our supply chain architecture. The AI-driven insights have transformed our procurement team from a back-office function to a strategic powerhouse."
            </blockquote>
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Elena Rodriguez</p>
                <p className="text-xs text-muted-foreground">Chief Procurement Officer, Global Logistics Corp.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Bottom CTA ───── */}
      <section className="py-0">
        <div className="w-full" style={{ background: "var(--gradient-primary)" }}>
          <div className="container py-16 md:py-20 flex flex-col items-center text-center gap-6">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground leading-tight max-w-lg">
              Ready to Architect Your Success?
            </h2>
            <p className="text-primary-foreground/80 max-w-md">
              Join the world's most advanced procurement teams and start making high-confidence decisions today.
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              <Button size="lg" variant="secondary" className="gap-2 px-6" onClick={() => navigate("/")}>
                Get Started Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 px-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate("/pricing#contact")}
              >
                Contact Sales
              </Button>
            </div>
            <div className="mt-4">
              <SiteFeedbackButton scenarioId="welcome" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Welcome;
