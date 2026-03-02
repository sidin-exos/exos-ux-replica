import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowLeft, Quote, TrendingUp, Shield, Users, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import ScenarioCard from "@/components/dashboard/ScenarioCard";
import ConsolidationWizard from "@/components/consolidation/ConsolidationWizard";
import { ChatWidget } from "@/components/chat/ChatWidget";
import GenericScenarioWizard from "@/components/scenarios/GenericScenarioWizard";
import ScenarioPreviewPanel from "@/components/scenarios/ScenarioPreviewPanel";
import { scenarios, getCategoryLabel, Scenario } from "@/lib/scenarios";

type ActiveView = "dashboard" | "scenario";

const successStories = [
  {
    company: "MedTech Solutions GmbH",
    industry: "Medical Devices",
    scenarios: ["TCO Analysis", "Make-or-Buy"],
    quote: "EXOS revealed hidden logistics costs we'd been overlooking for years.",
    person: "Dr. Katrin Schäfer, Head of Strategic Procurement",
    metric: "18%",
    metricLabel: "Cost savings",
    icon: TrendingUp,
  },
  {
    company: "NordSteel Industries AB",
    industry: "Heavy Industry",
    scenarios: ["Black Swan Simulation", "Supplier Risk"],
    quote: "EXOS flagged the risk two months prior. Our production lines kept running.",
    person: "Erik Lindqvist, VP Supply Chain",
    metric: "6-week",
    metricLabel: "Halt avoided",
    icon: Shield,
  },
  {
    company: "CleanTech Mobility SAS",
    industry: "Green Mobility",
    scenarios: ["Consolidation Wizard", "Negotiation Prep"],
    quote: "Going from 47 suppliers to 12 strategic partners in one quarter.",
    person: "Amélie Durand, CPO",
    metric: "35%",
    metricLabel: "Overhead reduction",
    icon: Users,
  },
];

const categoryOrder: Scenario["category"][] = ["analysis", "planning", "risk", "documentation"];

const Index = () => {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [hoveredScenario, setHoveredScenario] = useState<Scenario | null>(null);
  const [activeCategory, setActiveCategory] = useState<Scenario["category"] | null>("analysis");
  const location = useLocation();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Hash-based scrolling
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [location.hash]);

  // IntersectionObserver to track visible category
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    categoryOrder.forEach((cat) => {
      const el = sectionRefs.current[cat];
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveCategory(cat);
          }
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [activeView]);

  const navigate = useNavigate();
  const [storyIndex, setStoryIndex] = useState(() => Math.floor(Math.random() * successStories.length));

  const nextStory = useCallback(() => {
    setStoryIndex((prev) => (prev + 1) % successStories.length);
  }, []);

  const handleScenarioClick = (scenarioId: string) => {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (scenario && scenario.status === "available") {
      setSelectedScenario(scenario);
      setActiveView("scenario");
    }
  };

  const handleBack = () => {
    setActiveView("dashboard");
    setSelectedScenario(null);
  };

  // Group scenarios by category
  const scenariosByCategory = scenarios.reduce((acc, scenario) => {
    const category = scenario.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(scenario);
    return acc;
  }, {} as Record<Scenario["category"], Scenario[]>);

  return (
    <div className="min-h-screen gradient-hero">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--gradient-glow)" }}
      />

      <Header />

      <main className="container py-8 relative">
        {activeView === "dashboard" ? (
          <>
            {/* Hero Section — split layout */}
            <section className="mb-10 animate-fade-up grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2">
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
                  Do More With Less.{" "}
                  <span className="text-gradient">Decide With Confidence.</span>
                </h1>
                <p className="text-muted-foreground text-base max-w-2xl mb-4">
                  Critical procurement decisions are often made unprepared due to lack of time, 
                  knowledge, or a specialized function. EXOS gives you AI-powered analysis in minutes—cost 
                  breakdowns, negotiation scenarios, make-or-buy simulations—all tailored to your business case.
                </p>
                <p className="text-muted-foreground text-base max-w-2xl mb-4">
                  Your sensitive commercial data is masked before reaching external APIs—then grounded 
                  and validated on the way back.
                </p>
              </div>

              {/* Customer Success Preview */}
              <div className="hidden lg:block">
                {(() => {
                  const story = successStories[storyIndex];
                  const Icon = story.icon;
                  return (
                    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">{story.industry}</Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextStory}>
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-iris shrink-0" />
                          <span className="font-semibold text-sm">{story.company}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {story.scenarios.map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">{s}</Badge>
                          ))}
                        </div>
                        <blockquote className="text-xs text-muted-foreground italic border-l-2 border-iris/30 pl-3">
                          <Quote className="w-3 h-3 inline mr-1 opacity-50" />
                          {story.quote}
                        </blockquote>
                        <p className="text-[11px] text-muted-foreground">{story.person}</p>
                        <div className="flex items-baseline gap-1.5 pt-1">
                          <span className="text-xl font-bold text-iris">{story.metric}</span>
                          <span className="text-xs text-muted-foreground">{story.metricLabel}</span>
                        </div>
                        <button
                          onClick={() => navigate("/features#success")}
                          className="text-xs text-iris hover:underline cursor-pointer"
                        >
                          See all success stories →
                        </button>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            </section>

            {/* AI Guide */}
            <ChatWidget />

            {/* Split layout: 2/3 scenarios + 1/3 preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Scenarios */}
              <div className="lg:col-span-2">
                {categoryOrder.map((category, catIndex) => (
                  <section
                    key={category}
                    id={`category-${category}`}
                    ref={(el) => { sectionRefs.current[category] = el; }}
                    className={cn(
                      "mb-10 rounded-xl p-5 -mx-2 transition-colors",
                      catIndex % 2 === 1 ? "bg-surface" : ""
                    )}
                  >
                    <div className="mb-4">
                      <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                        {getCategoryLabel(category)}
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-iris/15 text-iris">
                          {scenariosByCategory[category]?.length ?? 0}
                        </span>
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {category === "analysis" && "Optimize costs, consolidate volumes, and calculate savings"}
                        {category === "planning" && "Source efficiently and gather requirements"}
                        {category === "risk" && "Assess supplier risks and manage disruptions"}
                        {category === "documentation" && "Generate and review procurement documents"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {scenariosByCategory[category]?.map((scenario, index) => (
                        <div
                          key={scenario.id}
                          className="animate-fade-up"
                          style={{ animationDelay: `${100 + index * 50}ms` }}
                        >
                          <ScenarioCard
                            title={scenario.title}
                            description={scenario.description}
                            icon={scenario.icon}
                            status={scenario.status}
                            category={scenario.category}
                            isActive={selectedScenario?.id === scenario.id}
                            onClick={() => handleScenarioClick(scenario.id)}
                            onMouseEnter={() => setHoveredScenario(scenario)}
                            onMouseLeave={() => setHoveredScenario(null)}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              {/* Right: Preview panel */}
              <div className="hidden lg:block">
                <ScenarioPreviewPanel scenario={hoveredScenario} activeCategory={activeCategory} />
              </div>
            </div>
          </>
        ) : selectedScenario ? (
          <section className="animate-fade-up">
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Scenarios
              </button>
            </div>

            <div className="mb-8">
              <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                <span className="text-gradient">{selectedScenario.title}</span>{" "}
                Analysis
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                {selectedScenario.description}
              </p>
            </div>

            <div className="card-elevated rounded-2xl p-6 md:p-8">
              {selectedScenario.id === "volume-consolidation" ? (
                <ConsolidationWizard />
              ) : (
                <GenericScenarioWizard scenario={selectedScenario} />
              )}
            </div>
          </section>
        ) : null}

        {activeView === "dashboard" && (
          <section className="text-center py-12">
            <a href="/faq#contact" className="text-primary hover:underline font-medium text-sm">
              Contact us
            </a>
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;
