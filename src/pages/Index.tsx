import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { ArrowLeft, Mail, LineChart, CalendarDays, ShieldAlert, FileText, LucideIcon } from "lucide-react";
import SiteFeedbackButton from "@/components/feedback/SiteFeedbackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScenarioCard from "@/components/dashboard/ScenarioCard";
import ConsolidationWizard from "@/components/consolidation/ConsolidationWizard";
import { ChatWidget } from "@/components/chat/ChatWidget";
import GenericScenarioWizard from "@/components/scenarios/GenericScenarioWizard";
import ScenarioPreviewPanel from "@/components/scenarios/ScenarioPreviewPanel";
import { scenarios, getCategoryLabel, Scenario } from "@/lib/scenarios";
import { UseCaseShowcase } from "@/components/enterprise/UseCaseShowcase";

type ActiveView = "dashboard" | "scenario";

const categoryOrder: Scenario["category"][] = ["analysis", "planning", "risk", "documentation"];

const CATEGORY_ICONS: Record<Scenario["category"], LucideIcon> = {
  analysis: LineChart,
  planning: CalendarDays,
  risk: ShieldAlert,
  documentation: FileText,
};

const CATEGORY_ICON_COLOR: Record<Scenario["category"], string> = {
  analysis: "text-info",
  planning: "text-warning",
  risk: "text-destructive",
  documentation: "text-iris",
};

const CATEGORY_BADGE_COLOR: Record<Scenario["category"], string> = {
  analysis: "bg-info/15 text-info",
  planning: "bg-warning/15 text-warning",
  risk: "bg-destructive/15 text-destructive",
  documentation: "bg-iris/15 text-iris",
};

const Index = () => {
  const { user, isLoading: isUserLoading } = useUser();
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

  // Redirect unauthenticated users to /welcome
  if (!isUserLoading && !user) {
    return <Navigate to="/welcome" replace />;
  }

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
                  Critical procurement decisions are often made without adequate preparation due to lack of time, 
                  knowledge, or a specialized function. EXOS gives you AI-powered analysis in minutes — cost 
                  breakdowns, negotiation scenarios, risk assessments — enriched with industry knowledge and online market intelligence.
                </p>
                <p className="text-muted-foreground text-base max-w-2xl mb-4">
                  Your sensitive commercial data is masked before reaching external APIs—then grounded 
                  and validated on the way back.
                </p>
              </div>

              {/* Use Case Preview */}
              <div className="hidden lg:block">
                <UseCaseShowcase platform="scenarios" variant="card" />
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
                      <h2 className="font-display text-2xl font-semibold text-foreground flex items-center gap-2">
                        {(() => { const CatIcon = CATEGORY_ICONS[category]; return <CatIcon className={cn("w-6 h-6", CATEGORY_ICON_COLOR[category])} />; })()}
                        {getCategoryLabel(category)}
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", CATEGORY_BADGE_COLOR[category])}>
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
                          className="animate-fade-up h-full"
                          style={{ animationDelay: `${100 + index * 50}ms` }}
                        >
                          <ScenarioCard
                            title={scenario.title}
                            description={scenario.description}
                            tags={scenario.tags}
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
          <section className="text-center py-16 flex items-center justify-center gap-4 flex-wrap">
            <SiteFeedbackButton scenarioId="homepage" />
            <a href="/pricing#contact">
              <Button size="lg" className="text-lg px-8 py-6 gap-2">
                Get in Touch
                <Mail className="w-5 h-5" />
              </Button>
            </a>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
