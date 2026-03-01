import { Brain, Database, ArrowRight, Lock, Sparkles, FileCheck, Eye } from "lucide-react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NavLink } from "@/components/NavLink";
import DataFlowDiagram from "@/components/features/DataFlowDiagram";
import SentinelCapabilities from "@/components/features/SentinelCapabilities";
import { useThemedLogo } from "@/hooks/useThemedLogo";

const Features = () => {
  const exosLogo = useThemedLogo();
  const valuePropositions = [
    {
      icon: Brain,
      title: "29 Procurement Scenarios",
      description: "Purpose-built AI models for high-stakes procurement decisions. From cost optimization to risk simulation—each scenario is fine-tuned on proven methodologies.",
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
      description: "Ground every analysis with live market data. Our system queries real-time sources for supplier news, M&A activity, commodity trends, and regulatory changes—then injects this into your analysis.",
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
      description: "Your sensitive commercial data—supplier names, pricing, contract terms—is semantically anonymized before reaching any external API. After AI processing, full context is restored on the way back.",
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
        {/* Hero Section */}
        <section className="mb-16 animate-fade-up text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 md:w-32 md:h-32 overflow-hidden rounded-xl">
              <img src={exosLogo} alt="EXOS" className="w-full h-full object-cover scale-[1.3]" />
            </div>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
            How <span className="text-gradient">EXOS</span> Works
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Enterprise-grade AI analysis with privacy-first architecture. 
            Your sensitive data stays protected while you get powerful insights.
          </p>
        </section>

        {/* Value Propositions */}
        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {valuePropositions.map((prop, index) => (
              <Card 
                key={prop.title} 
                className="card-elevated animate-fade-up border-border/50"
                style={{ animationDelay: `${100 + index * 100}ms` }}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <prop.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="font-display text-xl">{prop.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {prop.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {prop.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-center gap-2 text-sm text-foreground/80">
                        <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                  {"link" in prop && prop.link && (
                    <NavLink
                      to={prop.link as string}
                      className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Know more about EXOS architecture and data flow
                      <ArrowRight className="w-3 h-3" />
                    </NavLink>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Sentinel Capabilities Section - MOVED BEFORE DATA FLOW */}
        <section className="mb-20 animate-fade-up" style={{ animationDelay: "300ms" }}>
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
              Fine-Tuned <span className="text-gradient">AI Orchestration</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our custom-trained intelligence layer validates, enriches, and orchestrates 
              best-in-class cloud AI—ensuring every recommendation is grounded in your reality.
            </p>
          </div>
          
          <SentinelCapabilities />
        </section>

        {/* Data Flow Section */}
        <section className="mb-16 animate-fade-up" style={{ animationDelay: "400ms" }}>
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
      </main>
    </div>
  );
};

export default Features;
