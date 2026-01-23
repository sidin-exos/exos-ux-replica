import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import ScenarioCard from "@/components/dashboard/ScenarioCard";
import ConsolidationWizard from "@/components/consolidation/ConsolidationWizard";
import GenericScenarioWizard from "@/components/scenarios/GenericScenarioWizard";
import { scenarios, getCategoryLabel, Scenario } from "@/lib/scenarios";

type ActiveView = "dashboard" | "scenario";

const Index = () => {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

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
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(scenario);
    return acc;
  }, {} as Record<Scenario["category"], Scenario[]>);

  const categoryOrder: Scenario["category"][] = ["analysis", "planning", "risk", "documentation"];

  return (
    <div className="min-h-screen gradient-hero">
      {/* Glow effect overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--gradient-glow)" }}
      />

      <Header />

      <main className="container py-8 relative">
        {activeView === "dashboard" ? (
          <>
            {/* Hero Section */}
            <section className="mb-10 animate-fade-up">
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
                AI Procurement{" "}
                <span className="text-gradient">Assistant</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Select an analysis scenario below. Upload your data manually and get 
                AI-powered recommendations tailored to your specific situation.
              </p>
            </section>

            {/* Scenarios by Category */}
            {categoryOrder.map((category) => (
              <section key={category} className="mb-10">
                <div className="mb-4">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {getCategoryLabel(category)}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {category === "analysis" && "Optimize costs, consolidate volumes, and calculate savings"}
                    {category === "planning" && "Source efficiently and gather requirements"}
                    {category === "risk" && "Assess supplier risks and manage disruptions"}
                    {category === "documentation" && "Generate and review procurement documents"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        isActive={selectedScenario?.id === scenario.id}
                        onClick={() => handleScenarioClick(scenario.id)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
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
      </main>
    </div>
  );
};

export default Index;
