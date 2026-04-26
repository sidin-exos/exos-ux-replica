import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, BarChart3, Radar, Quote, Building2, CheckCircle, Lock, Compass, Globe, RefreshCw, Shield, Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SiteFeedbackButton from "@/components/feedback/SiteFeedbackButton";
import { PipelinePreviewAnimation } from "@/components/welcome/PipelinePreviewAnimation";
import { MarketIntelPreview } from "@/components/welcome/MarketIntelPreview";
import { AnalyticalPlatformsPreview } from "@/components/welcome/AnalyticalPlatformsPreview";

/* ── Feature Pillars ── */
const pillars = [
  {
    number: "01",
    title: "Procurement Scenarios",
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
    showPipeline: true,
  },
  {
    number: "02",
    title: "Analytical Platforms",
    description:
      "Continuous Risk and Inflation monitoring that filters market noise into concise executive summaries — so you spend less time reading and more time deciding, with full control over what matters.",
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
    previewImage: undefined as string | undefined,
    showPipeline: false,
    showPlatformsPreview: true,
  },
  {
    number: "03",
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
    showPipeline: false,
    showIntelPreview: true,
  },
];

/* ── Stats ── */
const stats = [
  { value: "20+", label: "Procurement Scenarios" },
  { value: "30", label: "Industry Knowledge Bases" },
  { value: "70", label: "Procurement Categories Covered" },
];

/* ── Page ── */
const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="force-light min-h-screen flex flex-col bg-background text-foreground" data-force-light="true">
      <Helmet>
        <title>EXOS — Agentic AI Procurement Platform | No Implementation</title>
        <meta
          name="description"
          content="Agentic AI procurement platform — negotiation preparation, supplier risk monitoring, TCO analysis, and inflation tracking. 20+ expert scenarios. No implementation needed."
        />
        <link rel="canonical" href="https://exosproc.com/" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <div className="contents text-foreground">
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
                ✦ Agentic AI procurement — works alongside Zip, Coupa, and SAP Ariba
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-foreground leading-[1.1] tracking-tight">
                Agentic AI Procurement Analysis.{" "}
                <span className="italic" style={{ color: "hsl(var(--primary))" }}>
                  No Implementation. No Wait.
                </span>
              </h1>
              <div className="text-muted-foreground text-base leading-relaxed space-y-3">
                <p className="text-base leading-relaxed text-muted-foreground">
                  Most procurement platforms take months to implement and require company-wide adoption before delivering value. <strong className="text-foreground font-semibold">EXOS is an agentic AI procurement platform</strong> that works from day one, for one user, alongside the tools you already have. Negotiation preparation, supplier risk monitoring, TCO analysis, inflation tracking — and many more expert scenarios. <strong className="text-foreground font-semibold">No integration. No IT project. No change management.</strong>
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
                  <span className="font-display text-lg font-bold text-foreground">20+</span>
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
              <div className="w-full max-w-xl">
                <div role="img" aria-label="EXOS agentic AI orchestration pipeline diagram" className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-6 md:p-8 backdrop-blur-sm">
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/20 mb-1">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-mono text-primary uppercase tracking-wider">EXOS Agentic AI workflow</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-0">
                    {/* Step 1 — User Input + Risk & Inflation side button */}
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-[280px] shrink-0 mx-auto rounded-xl border border-accent/30 bg-background p-4 transition-all hover:shadow-md">
                        <div className="flex items-start gap-3">
                          <span className="font-display text-2xl font-light text-accent/40 leading-none mt-0.5">1</span>
                          <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Lock className="w-3.5 h-3.5 text-accent" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground leading-tight">User Input</p>
                            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">Scenario data, documents & supplier info — anonymised before processing</p>
                          </div>
                        </div>
                      </div>
                      <div className="hidden min-[480px]:flex items-center gap-1.5 shrink-0">
                        <svg aria-hidden="true" width="24" height="10" viewBox="0 0 24 10" className="text-muted-foreground/30 shrink-0">
                          <line x1="4" y1="5" x2="24" y2="5" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M0 5 L5 2 L5 8 Z" fill="currentColor" />
                        </svg>
                        <div className="flex items-center gap-2.5 py-3.5 px-4 rounded-xl border border-copper/30 bg-copper/10 text-foreground shadow-sm cursor-default min-h-[56px]">
                          <Database className="w-4.5 h-4.5 text-copper shrink-0" />
                          <p className="text-xs font-bold leading-tight max-w-[7rem]">Risk & Inflation Platforms</p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow 1→2 */}
                    <svg aria-hidden="true" width="12" height="20" viewBox="0 0 12 20" className="text-muted-foreground/40 my-0.5">
                      <line x1="6" y1="0" x2="6" y2="14" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M6 20 L2 13 L10 13 Z" fill="currentColor" />
                    </svg>

                    {/* Step 2 — Core Engine (elevated) + Market Intelligence side button */}
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-[280px] shrink-0 mx-auto rounded-xl bg-primary border border-primary/80 p-4 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                        <div className="flex items-start gap-3">
                          <span className="font-display text-2xl font-light text-primary-foreground/30 leading-none mt-0.5">2</span>
                          <div className="w-7 h-7 rounded-lg bg-primary-foreground/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Shield className="w-3.5 h-3.5 text-primary-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-primary-foreground leading-tight">Core Engine</p>
                            <p className="text-[10px] text-primary-foreground/70 leading-snug mt-0.5">Grounding, market enrichment, validation & de-anonymisation pipeline</p>
                          </div>
                        </div>
                      </div>
                      <div className="hidden min-[480px]:flex items-center gap-1.5 shrink-0">
                        <svg aria-hidden="true" width="24" height="10" viewBox="0 0 24 10" className="text-muted-foreground/30 shrink-0">
                          <line x1="4" y1="5" x2="24" y2="5" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M0 5 L5 2 L5 8 Z" fill="currentColor" />
                        </svg>
                        <div className="flex items-center gap-2.5 py-3.5 px-4 rounded-xl border border-iris/30 bg-iris/10 text-foreground shadow-sm cursor-default min-h-[56px]">
                          <Radar className="w-4.5 h-4.5 text-iris shrink-0" />
                          <p className="text-xs font-bold leading-tight max-w-[7rem]">Market Intelligence</p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow 2→3 */}
                    <svg aria-hidden="true" width="12" height="20" viewBox="0 0 12 20" className="text-muted-foreground/40 my-0.5">
                      <line x1="6" y1="0" x2="6" y2="14" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M6 20 L2 13 L10 13 Z" fill="currentColor" />
                    </svg>

                    {/* Step 3 — Cloud AI */}
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-[280px] shrink-0 mx-auto rounded-xl border border-iris/30 bg-background p-4 transition-all hover:shadow-md">
                        <div className="flex items-start gap-3">
                          <span className="font-display text-2xl font-light text-iris/40 leading-none mt-0.5">3</span>
                          <div className="w-7 h-7 rounded-lg bg-iris/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Globe className="w-3.5 h-3.5 text-iris" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground leading-tight">Cloud AI</p>
                            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">Auditor, Optimiser & Strategist agents analyse in parallel</p>
                          </div>
                        </div>
                      </div>
                      {/* Invisible spacer to match rows with side buttons */}
                      <div className="hidden min-[480px]:flex items-center gap-1.5 shrink-0 invisible">
                        <svg aria-hidden="true" width="24" height="10" viewBox="0 0 24 10" className="shrink-0"><line x1="0" y1="5" x2="24" y2="5" /></svg>
                        <div className="flex items-center gap-2.5 py-3.5 px-4 min-h-[56px]">
                          <Database className="w-4.5 h-4.5" />
                          <p className="text-xs font-bold leading-tight max-w-[7rem]">Placeholder</p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow 3→4 */}
                    <svg aria-hidden="true" width="12" height="20" viewBox="0 0 12 20" className="text-muted-foreground/40 my-0.5">
                      <line x1="6" y1="0" x2="6" y2="14" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M6 20 L2 13 L10 13 Z" fill="currentColor" />
                    </svg>

                    {/* Step 4 — User Interface */}
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-[280px] shrink-0 mx-auto rounded-xl border border-positive/30 bg-background p-4 transition-all hover:shadow-md">
                        <div className="flex items-start gap-3">
                          <span className="font-display text-2xl font-light text-positive/40 leading-none mt-0.5">4</span>
                          <div className="w-7 h-7 rounded-lg bg-positive/15 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle className="w-3.5 h-3.5 text-positive" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground leading-tight">User Interface</p>
                            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">Validated reports, interactive dashboards & action roadmaps</p>
                          </div>
                        </div>
                      </div>
                      {/* Invisible spacer to match rows with side buttons */}
                      <div className="hidden min-[480px]:flex items-center gap-1.5 shrink-0 invisible">
                        <svg aria-hidden="true" width="24" height="10" viewBox="0 0 24 10" className="shrink-0"><line x1="0" y1="5" x2="24" y2="5" /></svg>
                        <div className="flex items-center gap-2.5 py-3.5 px-4 min-h-[56px]">
                          <Database className="w-4.5 h-4.5" />
                          <p className="text-xs font-bold leading-tight max-w-[7rem]">Placeholder</p>
                        </div>
                      </div>
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
        <div className="max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground whitespace-nowrap">
            EXOS works as three interconnected layers:
          </h2>
          <ul className="space-y-2 pl-1 mt-4 text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
              <span><strong className="text-foreground">Procurement Scenarios</strong> — pre-defined agentic AI flows with procurement methodology, agentic loops, and custom LLM settings.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
              <span><strong className="text-foreground">Analytical Platforms</strong> — Inflation and Risk platforms that surface what's changed and flag only what requires your decision.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
              <span><strong className="text-foreground">Market Intelligence</strong> — live market context injected into AI results: benchmarks, risks, pricing signals, regulatory shifts.</span>
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
                      <p className="text-sm text-foreground leading-relaxed">
                        {pillar.impact}
                      </p>
                      
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
                        ) : pillar.showPipeline ? (
                          <PipelinePreviewAnimation />
                        ) : (pillar as any).showPlatformsPreview ? (
                          <AnalyticalPlatformsPreview />
                        ) : (pillar as any).showIntelPreview ? (
                          <MarketIntelPreview />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                              <Icon className="w-8 h-8 text-primary/60" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-muted to-transparent" />
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

      {/* ───── Problem / Solution ───── */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <p className="exos-label text-primary mb-3">The Procurement Software Problem</p>
              <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground leading-tight">
                Six months to implement. Two years to adopt. <span className="italic text-primary">Still no answers.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Problem */}
              <div className="rounded-lg border border-border bg-background p-6 md:p-7">
                <p className="exos-label text-muted-foreground mb-3">The traditional way</p>
                <ul className="space-y-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                  <li className="flex gap-3">
                    <span className="text-destructive mt-1">✕</span>
                    <span>Months of implementation before the first insight.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-destructive mt-1">✕</span>
                    <span>Requires company-wide rollout to deliver any value.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-destructive mt-1">✕</span>
                    <span>IT projects, change management, integration backlog.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-destructive mt-1">✕</span>
                    <span>Dashboards full of data — but no decisions.</span>
                  </li>
                </ul>
              </div>

              {/* Solution */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 md:p-7">
                <p className="exos-label text-primary mb-3">The EXOS way</p>
                <ul className="space-y-3 text-sm md:text-base text-foreground leading-relaxed">
                  <li className="flex gap-3">
                    <span className="text-primary mt-1">✓</span>
                    <span>Works from day one — no setup, no integration.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary mt-1">✓</span>
                    <span>Delivers value for one user, alongside Zip, Coupa, or SAP Ariba.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary mt-1">✓</span>
                    <span>Agentic AI grounded in proven procurement methodology.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary mt-1">✓</span>
                    <span>Decisions, not dashboards — with the reasoning behind them.</span>
                  </li>
                </ul>
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
    </div>
  );
};

export default Welcome;
