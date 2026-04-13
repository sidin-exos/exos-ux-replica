import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Radar, Quote, Building2, CheckCircle, Lock, Compass, Globe, RefreshCw, Shield, Database } from "lucide-react";
import PillarUseCaseDropdown from "@/components/welcome/PillarUseCaseDropdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SiteFeedbackButton from "@/components/feedback/SiteFeedbackButton";
import riskSignalsPreview from "@/assets/risk-signals-preview.png";

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
    previewImage: undefined as string | undefined,
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
    previewImage: undefined as string | undefined,
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
    previewImage: riskSignalsPreview,
  },
];

/* ── Stats ── */
const stats = [
  { value: "29", label: "Procurement Scenarios" },
  { value: "30", label: "Industry Knowledge Bases" },
  { value: "70", label: "Procurement Categories Covered" },
];

/* ── Page ── */
const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main>
      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
        <div className="container relative py-20 md:py-28 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="flex flex-col gap-6 max-w-xl">
              <Badge variant="outline" className="w-fit border-primary/30 text-primary text-xs tracking-wider uppercase animate-in fade-in slide-in-from-bottom-2 duration-500">
                ✦ Agentic AI Procurement Analytical Platform
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-foreground leading-[1.1] tracking-tight">
                Do More With Less.{" "}
                <span className="italic" style={{ color: "hsl(var(--primary))" }}>
                  Decide With Confidence.
                </span>
              </h1>
              <div className="text-muted-foreground text-base leading-relaxed space-y-3">
                <p className="text-base leading-relaxed text-muted-foreground">
                  Critical <strong className="text-foreground font-semibold">procurement decisions</strong> are often made without adequate preparation due to lack of time, knowledge, or a specialised function.
                  <br />
                  <span className="text-base leading-relaxed text-muted-foreground">EXOS works from the <strong className="text-foreground font-semibold">first day and first user</strong>, no integration or company-wide adoption needed. Get better results with <strong className="text-foreground font-semibold">agentic AI</strong>.</span>
                </p>
                <p className="text-base leading-relaxed text-muted-foreground">
                  Your <strong className="text-foreground font-semibold">sensitive commercial data</strong> is masked before reaching external APIs — then <strong className="text-foreground font-semibold">grounded and validated</strong> on the way back.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                <Button size="lg" className="gap-2 px-8 font-semibold" onClick={() => navigate("/auth")}>
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" className="gap-2 px-6" onClick={() => navigate("/features")}>
                  Explore Solutions
                </Button>
              </div>
              <div className="mt-3">
                <p className="text-sm font-semibold text-foreground">
                  Get ROI from first day, first user.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="font-display text-lg font-bold text-foreground">29</span>
                  <span className="uppercase tracking-wider">Scenarios</span>
                </span>
                <span className="w-px h-4 bg-border" />
                <span className="flex items-center gap-1.5">
                  <span className="font-display text-lg font-bold text-foreground">30</span>
                  <span className="uppercase tracking-wider">Industries</span>
                </span>
                <span className="w-px h-4 bg-border" />
                <span className="flex items-center gap-1.5">
                  <span className="font-display text-lg font-bold text-foreground">70</span>
                  <span className="uppercase tracking-wider">Categories</span>
                </span>
              </div>
            </div>

            {/* Right — Abstract dashboard preview */}
            <div className="hidden lg:flex justify-end">
              <div className="w-full max-w-md">
                <div role="img" aria-label="EXOS platform overview diagram" className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-5 backdrop-blur-sm">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/20">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-mono text-primary uppercase tracking-wider">EXOS Platform</span>
                    </div>
                  </div>

                  {/* User Input — compact bookend */}
                  <div className="flex items-center gap-3 py-2 px-3 rounded-lg border bg-accent/8 border-accent/40 shadow-sm shadow-accent/10 mb-1.5">
                    <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center shrink-0">
                      <Lock className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Data anonymised & secured before processing</p>
                  </div>

                  {/* Arrow down */}
                  <div className="flex justify-center py-0.5">
                    <svg aria-hidden="true" width="12" height="16" viewBox="0 0 12 16" className="text-primary/50">
                      <line x1="6" y1="0" x2="6" y2="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M6 16 L2 10 L10 10 Z" fill="currentColor" />
                    </svg>
                  </div>

                  {/* Three EXOS pillars — emphasized */}
                  <div className="space-y-1.5 py-1">
                    {[
                      { icon: BarChart3, label: "Analytical Scenarios", desc: "20+ agentic AI flows for cost, risk, negotiation & sourcing", tier: "scenarios" as const },
                      { icon: Radar, label: "Market Intelligence", desc: "Live benchmarks, pricing signals & geopolitical risk feeds", tier: "intelligence" as const },
                      { icon: Database, label: "Risk & Inflation Platforms", desc: "Always-on monitoring with automated alerts & trend tracking", tier: "platforms" as const },
                    ].map((pillar, i, arr) => {
                      const styles = {
                        scenarios: {
                          card: "bg-primary/10 border-primary/40 shadow-md shadow-primary/15 ring-1 ring-primary/20",
                          icon: "bg-primary shadow-md shadow-primary/30",
                          label: "text-primary",
                        },
                        intelligence: {
                          card: "bg-iris/10 border-iris/40 shadow-md shadow-iris/15 ring-1 ring-iris/20",
                          icon: "bg-iris shadow-md shadow-iris/30",
                          label: "text-iris",
                        },
                        platforms: {
                          card: "bg-copper/10 border-copper/40 shadow-md shadow-copper/15 ring-1 ring-copper/20",
                          icon: "bg-copper shadow-md shadow-copper/30",
                          label: "text-copper",
                        },
                      };
                      const s = styles[pillar.tier];
                      return (
                        <div key={pillar.label}>
                          <div className={`flex items-center gap-3 py-3 px-4 rounded-lg border cursor-default transition-all hover:shadow-lg ${s.card}`}>
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.icon}`}>
                              <pillar.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-bold leading-tight ${s.label}`}>{pillar.label}</p>
                              <p className="text-[10px] text-foreground/70 leading-snug mt-0.5">{pillar.desc}</p>
                            </div>
                          </div>
                          {i < arr.length - 1 && (
                            <div className="flex justify-center py-0.5">
                              <svg aria-hidden="true" width="24" height="20" viewBox="0 0 24 20" className="text-primary/40">
                                <path d="M12 0 L16 5 L13 5 L13 9 L11 9 L11 5 L8 5 Z" fill="currentColor" />
                                <path d="M12 20 L8 15 L11 15 L11 11 L13 11 L13 15 L16 15 Z" fill="currentColor" />
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Arrow down */}
                  <div className="flex justify-center py-0.5">
                    <svg aria-hidden="true" width="12" height="16" viewBox="0 0 12 16" className="text-primary/50">
                      <line x1="6" y1="0" x2="6" y2="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M6 16 L2 10 L10 10 Z" fill="currentColor" />
                    </svg>
                  </div>

                  {/* Output — compact bookend */}
                  <div className="flex items-center gap-3 py-2 px-3 rounded-lg border bg-positive/8 border-positive/40 shadow-sm shadow-positive/10">
                    <div className="w-6 h-6 rounded-md bg-positive flex items-center justify-center shrink-0">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Validated reports, dashboards & action roadmaps</p>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Architectural Intelligence Heading ───── */}
      <section className="container py-10 md:py-12">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            EXOS works as three interconnected layers:
          </h2>
          <ul className="space-y-2 pl-1 mt-4 text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
              <span><strong className="text-foreground">Scenarios</strong> — pre-defined agentic AI flows with procurement methodology, agentic loops, and custom LLM settings.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
              <span><strong className="text-foreground">Market Intelligence</strong> — live market context injected into AI results: benchmarks, risks, pricing signals, regulatory shifts.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
              <span><strong className="text-foreground">Continuous Monitoring</strong> — Inflation and Risk platforms that surface what's changed and flag only what requires your decision.</span>
            </li>
          </ul>
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
                      <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
                        {pillar.previewImage ? (
                          <img
                            src={pillar.previewImage}
                            alt={`${pillar.title} preview`}
                            className="w-full h-full object-cover object-top"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                              <Icon className="w-8 h-8 text-primary/60" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-muted to-transparent" />
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
          <div className="container py-8 md:py-10 flex flex-col items-center text-center gap-4">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground leading-tight max-w-lg">
              Ready to Architect Your Success?
            </h2>
            <p className="text-primary-foreground/80 max-w-md text-sm">
              Join the world's most advanced procurement teams and start making high-confidence decisions today.
            </p>
            <div className="flex flex-wrap gap-3 mt-1">
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
          </div>
        </div>
      </section>

      </main>

      <Footer />
    </div>
  );
};

export default Welcome;
