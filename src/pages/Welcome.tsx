import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Radar, Quote, Building2, CheckCircle } from "lucide-react";
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
    title: "Analysis & Optimization",
    description:
      "Don't just collect data; architect it. Our AI engine identifies structural inefficiencies in your spending patterns that traditional analytics miss. We provide the \"why\" behind the numbers, enabling a shift from reactive reporting to proactive cost governance.",
    impact:
      "Identify 15-20% hidden savings opportunities within the first 30 days of implementation.",
    icon: BarChart3,
  },
  {
    number: "02",
    title: "Planning & Sourcing",
    description:
      "Strategic sourcing redefined as a collaborative art. EXOS automates the friction of vendor selection while maintaining human-centric decision paths. Access global Market Intelligence feeds to benchmark your sourcing strategy against real-time industry shifts.",
    impact:
      "Reduce sourcing cycle times by 40% while expanding your high-quality vendor pool.",
    icon: Network,
  },
  {
    number: "03",
    title: "Risk Management",
    description:
      "Navigate uncertainty with an automated early-warning system. We monitor global supply chain nodes, financial stability, and geopolitical indicators to protect your operations before the disruption occurs.",
    impact:
      "Predict and mitigate supply chain disruptions 3-6 months before they impact the bottom line.",
    icon: ShieldAlert,
  },
  {
    number: "04",
    title: "Documentation & Contracts",
    description:
      "The end of manual tracking. EXOS uses natural language processing to audit your entire contract repository, surfacing hidden liabilities and renewal opportunities automatically. Modern compliance without the spreadsheet fatigue.",
    impact:
      "Eliminate 100% of unattended contract renewals and ensure total compliance across regions.",
    icon: FileText,
  },
];

/* ── Stats ── */
const stats = [
  { value: "$12B+", label: "Spend Optimized" },
  { value: "500+", label: "Enterprise Clients" },
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
      <section className="container py-16 md:py-20">
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
            className={`py-12 md:py-16 ${i % 2 === 1 ? "bg-muted/30" : ""}`}
          >
            <div className="container">
              <div className={`grid md:grid-cols-2 gap-10 lg:gap-16 items-center max-w-6xl mx-auto ${!isEven ? "direction-rtl" : ""}`}>
                {/* Text side */}
                <div className={`flex flex-col gap-5 ${!isEven ? "md:order-2" : ""}`}>
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
                  <Card className="border-primary/20 bg-primary/5 mt-2">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">
                        Business Impact
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {pillar.impact}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Visual side — abstract placeholder */}
                <div className={`${!isEven ? "md:order-1" : ""}`}>
                  <Card className="overflow-hidden border-border/50 bg-muted/20">
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                          <Icon className="w-10 h-10 text-primary/60" />
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
            Empowering Global Procurement Leaders
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
