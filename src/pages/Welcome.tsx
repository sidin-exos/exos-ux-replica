import { useNavigate } from "react-router-dom";
import { Play, ArrowRight, Settings2, Brain, Zap, BarChart3, Globe, TrendingUp, Shield, Users, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useThemedLogo } from "@/hooks/useThemedLogo";

/* ── Video Placeholder ── */
const VideoPlaceholder = ({ label, id }: { label: string; id: string }) => (
  <Card className="overflow-hidden border-border/50 bg-muted/30" id={id}>
    <AspectRatio ratio={16 / 9}>
      <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-muted to-muted/50 gap-3">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
          <Play className="w-7 h-7 text-primary ml-1" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
      </div>
    </AspectRatio>
  </Card>
);

/* ── How it Works Steps ── */
const steps = [
  {
    icon: Settings2,
    title: "Define Context",
    description: "Select your scenario, set parameters, and provide business context. EXOS adapts to your industry and category.",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Our Sentinel pipeline anonymises data, grounds it with market intelligence, and generates structured insights.",
  },
  {
    icon: Zap,
    title: "Actionable Output",
    description: "Get dashboards, negotiation playbooks, risk matrices, and exportable reports — ready for stakeholder review.",
  },
];

/* ── Success Stories ── */
const successStories = [
  {
    company: "MedTech Solutions GmbH",
    industry: "Medical Devices",
    quote: "EXOS revealed hidden logistics costs we'd been overlooking for years.",
    person: "Dr. Katrin Schäfer, Head of Strategic Procurement",
    metric: "18%",
    metricLabel: "Cost savings",
    icon: TrendingUp,
  },
  {
    company: "NordSteel Industries AB",
    industry: "Heavy Industry",
    quote: "EXOS flagged the risk two months prior. Our production lines kept running.",
    person: "Erik Lindqvist, VP Supply Chain",
    metric: "6-week",
    metricLabel: "Halt avoided",
    icon: Shield,
  },
  {
    company: "CleanTech Mobility SAS",
    industry: "Green Mobility",
    quote: "Going from 47 suppliers to 12 strategic partners in one quarter.",
    person: "Amélie Durand, CPO",
    metric: "35%",
    metricLabel: "Overhead reduction",
    icon: Users,
  },
];

/* ── Page ── */
const Welcome = () => {
  const exosLogo = useThemedLogo();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
        <div className="container relative py-20 md:py-28 flex flex-col items-center text-center gap-6">
          <Badge variant="outline" className="border-primary/30 text-primary font-medium">
            AI-Powered Procurement Intelligence
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground max-w-3xl leading-tight">
            Your Procurement <span className="text-primary">Exoskeleton</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Transform complex procurement decisions into structured, data-driven strategies. From cost analysis to risk simulation — EXOS amplifies your expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button size="lg" className="gap-2" onClick={() => navigate("/")}>
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2" onClick={() => document.getElementById("promo-video")?.scrollIntoView({ behavior: "smooth" })}>
              <Play className="w-4 h-4" /> Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Promo Video */}
      <section className="container py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <VideoPlaceholder label="General Overview — Product Demo" id="promo-video" />
        </div>
      </section>

      {/* How it Works */}
      <section className="container py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">How It Works</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Three steps from raw procurement data to boardroom-ready insights.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <Card key={i} className="glass-effect border-border/50 relative overflow-hidden group hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="absolute top-3 right-4 text-6xl font-display font-bold text-primary/5 select-none">{i + 1}</div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Scenarios Section */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
            <div className="flex flex-col gap-5">
              <Badge variant="outline" className="w-fit border-primary/30 text-primary">
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Scenarios Engine
              </Badge>
              <h2 className="font-display text-3xl font-bold text-foreground">15+ Procurement Scenarios</h2>
              <p className="text-muted-foreground leading-relaxed">
                From TCO analysis and make-or-buy decisions to Black Swan simulations and negotiation prep — each scenario is purpose-built with structured AI prompts, anonymisation, and grounding context.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Cost Analysis & Benchmarking", "Supplier Risk Assessment", "Contract & SOW Analysis", "Strategic Planning & Simulation"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-fit gap-2 mt-2" onClick={() => navigate("/")}>
                Explore Scenarios <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <VideoPlaceholder label="Scenarios — Walkthrough" id="scenarios-video" />
          </div>
        </div>
      </section>

      {/* Market Intelligence Section */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1">
              <VideoPlaceholder label="Market Intelligence — Walkthrough" id="intel-video" />
            </div>
            <div className="flex flex-col gap-5 order-1 md:order-2">
              <Badge variant="outline" className="w-fit border-accent/30 text-accent">
                <Globe className="w-3.5 h-3.5 mr-1.5" /> Market Intelligence
              </Badge>
              <h2 className="font-display text-3xl font-bold text-foreground">Real-Time Market Insights</h2>
              <p className="text-muted-foreground leading-relaxed">
                Query live market data with AI-powered search. Set up scheduled reports, trigger-based alerts, and build a knowledge base of curated intelligence for your procurement categories.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["AI-grounded market research", "Scheduled & trigger-based reports", "Persistent knowledge base", "Multi-source citation tracking"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-fit gap-2 mt-2" onClick={() => navigate("/market-intelligence")}>
                Explore Intelligence <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Trusted by Procurement Leaders</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {successStories.map((story) => {
              const Icon = story.icon;
              return (
                <Card key={story.company} className="glass-effect border-border/50 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">{story.industry}</Badge>
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="font-display font-bold text-primary text-lg">{story.metric}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Quote className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground italic leading-relaxed">{story.quote}</p>
                    </div>
                    <div className="mt-auto pt-3 border-t border-border/50">
                      <p className="text-sm font-medium text-foreground">{story.company}</p>
                      <p className="text-xs text-muted-foreground">{story.person}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 md:py-20">
        <div className="container">
          <Card className="max-w-3xl mx-auto overflow-hidden border-0" style={{ background: "var(--gradient-primary)" }}>
            <CardContent className="p-8 md:p-12 flex flex-col items-center text-center gap-5">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground">
                Ready to transform your procurement?
              </h2>
              <p className="text-primary-foreground/80 max-w-lg">
                Start your first scenario in minutes. No complex setup — just define your context and let EXOS do the heavy lifting.
              </p>
              <Button size="lg" variant="secondary" className="gap-2" onClick={() => navigate("/")}>
                Start Your First Scenario <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Welcome;
