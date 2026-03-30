import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Brain, Database, ArrowRight, Lock, Mail } from "lucide-react";
import SiteFeedbackButton from "@/components/feedback/SiteFeedbackButton";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataFlowDiagram from "@/components/features/DataFlowDiagram";
import SentinelCapabilities from "@/components/features/SentinelCapabilities";
import { useThemedLogo } from "@/hooks/useThemedLogo";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { UseCaseShowcase } from "@/components/enterprise/UseCaseShowcase";

const Features = () => {
  const exosLogo = useThemedLogo();
  const location = useLocation();
  const { isSuperAdmin } = useAdminAuth();

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    }
  }, [location.hash]);

  const valuePropositions = [
    {
      icon: Brain,
      title: "29 Procurement Scenarios",
      description: "Purpose-built AI models for high-stakes procurement decisions — from cost optimization to risk simulation.",
      highlights: [
        "Make-or-Buy & TCO analysis",
        "Supplier dependency & exit planning",
        "Black Swan scenario simulation",
        "SOW & specification optimization"
      ]
    },
    {
      icon: Database,
      title: "Real-Time Market Intelligence",
      description: "Ground every analysis with live market data — supplier news, M&A activity, commodity trends, and regulatory changes.",
      highlights: [
        "Live supplier & category intelligence",
        "30+ industry grounding profiles",
        "30+ category strategy frameworks",
        "Cited sources for full transparency"
      ]
    },
    {
      icon: Lock,
      title: "Commercial Data Safety",
      description: "Sensitive commercial data is semantically anonymized before reaching any external API, then restored on return.",
      highlights: [
        "Semantic anonymization of commercial data",
        "PII and financial identifier masking",
        "Enterprise InfoSec Gate for traffic audit",
        "Full data restoration after AI processing"
      ],
      link: "/architecture"
    }
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--gradient-glow)" }}
      />
      
      <Header />
      
      <main className="container py-8 relative">
        {/* Hero heading */}
        <section className="mb-10 animate-fade-up text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 md:w-24 md:h-24 overflow-hidden rounded-xl">
              <img src={exosLogo} alt="EXOS" className="w-full h-full object-cover scale-[1.3]" />
            </div>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            How <span className="text-gradient">EXOS</span> Works
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto">
            Enterprise-grade AI analysis with privacy-first architecture.
          </p>
        </section>

        {/* 2/3 Value Props + 1/3 Success Story */}
        <section className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2/3 — Value proposition cards */}
            <div className="lg:col-span-2 space-y-4">
              {valuePropositions.map((prop, index) => (
                <Card 
                  key={prop.title} 
                  className="card-elevated animate-fade-up border-border/50"
                  style={{ animationDelay: `${100 + index * 80}ms` }}
                >
                  <div className="flex items-start gap-4 p-5">
                    <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <prop.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-semibold mb-1">{prop.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{prop.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {prop.highlights.map((h) => (
                          <span key={h} className="flex items-center gap-1.5 text-xs text-foreground/70">
                            <ArrowRight className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                            {h}
                          </span>
                        ))}
                      </div>
                      {"link" in prop && prop.link && (
                        <NavLink
                          to={prop.link as string}
                          className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          Learn about EXOS architecture
                          <ArrowRight className="w-3 h-3" />
                        </NavLink>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Right 1/3 — Success story preview */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <Card className="card-elevated border-border/50 animate-fade-up" style={{ animationDelay: "300ms" }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Customer Success
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={nextStory}
                        aria-label="Show another story"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-copper/15 flex items-center justify-center">
                        <story.icon className="w-4.5 h-4.5 text-copper" />
                      </div>
                      <Badge variant="outline" className="text-iris border-iris/30 bg-iris/10 text-xs">
                        {story.industry}
                      </Badge>
                    </div>
                    <CardTitle className="font-display text-base mt-2">{story.company}</CardTitle>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {story.scenarios.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs bg-info/10 text-info border-info/20">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative pl-3 border-l-2 border-primary/30">
                      <Quote className="w-3.5 h-3.5 text-muted-foreground/40 absolute -left-2 -top-0.5 bg-card" />
                      <p className="text-sm text-foreground/80 italic leading-relaxed">
                        "{story.quote}"
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 font-medium">
                        — {story.person}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-border/50 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary font-display">{story.metric}</span>
                      <span className="text-xs text-muted-foreground">{story.metricLabel}</span>
                    </div>
                    <button
                      onClick={() => {
                        const el = document.getElementById("success");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                      View all stories <ArrowRight className="w-3 h-3" />
                    </button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Sentinel Capabilities Section */}
        <section id="orchestration" className="mb-20 animate-fade-up" style={{ animationDelay: "300ms" }}>
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
              Fine-Tuned <span className="text-gradient">AI Agentic Orchestration</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our custom-trained intelligence layer validates, enriches, and orchestrates 
              best-in-class cloud AI—ensuring every recommendation is grounded in your reality.
            </p>
          </div>
          
          <SentinelCapabilities />
        </section>

        {/* Architecture Deep-Dive Section */}
        <section id="architecture" className="mb-20 animate-fade-up" style={{ animationDelay: "350ms" }}>
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
              Enterprise <span className="text-gradient">Architecture</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A purpose-built, privacy-first AI backend designed for high-stakes procurement decisions 
              in regulated European industries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="card-elevated border-border/50">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mb-2">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <CardTitle className="font-display text-lg">Agentic Structure & Chain of Experts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  EXOS employs an <strong className="text-foreground">agentic structure</strong> where 
                  specialized AI agents collaborate in a server-side <strong className="text-foreground">Chain of Experts</strong> pipeline. 
                  For complex financial scenarios, a 3-cycle flow — Analyst → Auditor → Synthesizer — ensures 
                  every recommendation is rigorously challenged, mathematically verified, and synthesized into 
                  actionable intelligence before reaching the user.
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated border-border/50">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mb-2">
                  <Lock className="w-5 h-5 text-primary-foreground" />
                </div>
                <CardTitle className="font-display text-lg">Anti-Hallucination & Grounding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every AI output passes through a multi-layer <strong className="text-foreground">anti-hallucination</strong> framework. 
                  Server-side <strong className="text-foreground">grounding</strong> injects live market data, industry KPIs, 
                  and regulatory context directly into prompts. Post-inference <strong className="text-foreground">validation</strong> cross-checks 
                  arithmetic (ROI, NPV, break-even), flags unsupported claims, and enforces separation 
                  of hard vs. soft savings — ensuring outputs you can trust in boardroom presentations.
                </p>
              </CardContent>
            </Card>
          </div>

          {isSuperAdmin && (
            <div className="text-center">
              <NavLink
                to="/architecture"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Explore full architecture diagram
                <ArrowRight className="w-4 h-4" />
              </NavLink>
            </div>
          )}
        </section>

        {/* Data Flow Section */}
        <section id="dataflow" className="mb-20 animate-fade-up" style={{ animationDelay: "400ms" }}>
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
              Privacy-First <span className="text-gradient">Data Flow</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Your data passes through multiple protection layers before reaching cloud AI, 
              ensuring sensitive commercial information never leaves your control.
            </p>
          </div>
          
          <DataFlowDiagram />
        </section>

        {/* Customer Success Stories — Full Section */}
        <section id="success" className="mb-16 animate-fade-up" style={{ animationDelay: "500ms" }}>
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
              Customer <span className="text-gradient">Success Stories</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              See how EU procurement teams use EXOS to prevent value leakage, 
              manage supply chain risk, and drive measurable savings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {successStories.map((s, index) => (
              <Card
                key={s.company}
                className="card-elevated border-border/50 animate-fade-up"
                style={{ animationDelay: `${600 + index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-copper/15 flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-copper" />
                    </div>
                    <Badge variant="outline" className="text-iris border-iris/30 bg-iris/10 text-xs">
                      {s.industry}
                    </Badge>
                  </div>
                  <CardTitle className="font-display text-lg">{s.company}</CardTitle>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {s.scenarios.map((sc) => (
                      <Badge key={sc} variant="secondary" className="text-xs bg-info/10 text-info border-info/20">
                        {sc}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative pl-4 border-l-2 border-primary/30">
                    <Quote className="w-4 h-4 text-muted-foreground/40 absolute -left-2 -top-1 bg-card" />
                    <p className="text-sm text-foreground/80 italic leading-relaxed">
                      "{s.quote}"
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 font-medium">
                      — {s.person}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-border/50 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary font-display">{s.metric}</span>
                    <span className="text-xs text-muted-foreground">{s.metricLabel}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="text-center py-16 flex items-center justify-center gap-4 flex-wrap">
          <SiteFeedbackButton scenarioId="features" />
          <a href="/pricing#contact">
            <Button size="lg" className="text-lg px-8 py-6 gap-2">
              Get in Touch
              <Mail className="w-5 h-5" />
            </Button>
          </a>
        </section>
      </main>
    </div>
  );
};

export default Features;
