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
import exosMark from "@/assets/exos-mark.svg";
import exosMarkDark from "@/assets/exos-mark-dark.svg";
import { useTheme } from "next-themes";
import { useAdminAuth } from "@/hooks/useAdminAuth";


const Features = () => {
  const { resolvedTheme } = useTheme();
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
            <img src={exosMark} alt="EXOS" className="h-24 md:h-32 w-auto object-contain" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            How <span className="text-gradient">EXOS</span> Works
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto">
            Enterprise-grade AI analysis with privacy-first architecture.
          </p>
        </section>

        {/* Value Props */}
        <section className="mb-20">
          <div className="space-y-4">
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
