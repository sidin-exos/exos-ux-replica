import { useState } from "react";
import {
  Package,
  TrendingUp,
  Users,
  BarChart3,
  Layers,
  Network,
  Scale,
  FileSearch,
} from "lucide-react";
import Header from "@/components/layout/Header";
import ScenarioCard from "@/components/dashboard/ScenarioCard";
import StatCard from "@/components/dashboard/StatCard";
import ConsolidationWizard from "@/components/consolidation/ConsolidationWizard";

type ActiveView = "dashboard" | "volume-consolidation";

const scenarios = [
  {
    id: "volume-consolidation",
    title: "Volume Consolidation",
    description:
      "Analyze supplier spend and identify opportunities to consolidate volume for better pricing and reduced complexity.",
    icon: Layers,
    status: "available" as const,
  },
  {
    id: "supplier-rationalization",
    title: "Supplier Rationalization",
    description:
      "Evaluate supplier performance and identify candidates for strategic partnerships or phase-out.",
    icon: Network,
    status: "coming-soon" as const,
  },
  {
    id: "spend-analysis",
    title: "Spend Analysis",
    description:
      "Deep-dive into procurement data to uncover maverick spend, compliance issues, and savings opportunities.",
    icon: BarChart3,
    status: "coming-soon" as const,
  },
  {
    id: "contract-optimization",
    title: "Contract Optimization",
    description:
      "Review existing contracts and recommend renegotiation strategies based on market benchmarks.",
    icon: FileSearch,
    status: "coming-soon" as const,
  },
  {
    id: "make-vs-buy",
    title: "Make vs Buy Analysis",
    description:
      "Evaluate whether to produce in-house or outsource based on cost, capability, and strategic fit.",
    icon: Scale,
    status: "coming-soon" as const,
  },
];

const Index = () => {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const handleScenarioClick = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    if (scenarioId === "volume-consolidation") {
      setActiveView("volume-consolidation");
    }
  };

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
                Procurement Intelligence{" "}
                <span className="text-gradient">Dashboard</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                AI-powered analytics to optimize your supplier relationships,
                reduce costs, and drive strategic sourcing decisions.
              </p>
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
                <StatCard
                  title="Total Spend (YTD)"
                  value="$2.4M"
                  change="+12%"
                  trend="up"
                  icon={TrendingUp}
                />
              </div>
              <div className="animate-fade-up" style={{ animationDelay: "150ms" }}>
                <StatCard
                  title="Active Suppliers"
                  value="147"
                  change="-8%"
                  trend="down"
                  icon={Users}
                />
              </div>
              <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
                <StatCard
                  title="Categories"
                  value="24"
                  icon={Package}
                />
              </div>
              <div className="animate-fade-up" style={{ animationDelay: "250ms" }}>
                <StatCard
                  title="Savings Identified"
                  value="$180K"
                  change="+24%"
                  trend="up"
                  icon={BarChart3}
                />
              </div>
            </section>

            {/* Scenarios Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-xl font-semibold">
                    Analysis Scenarios
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Select a scenario to begin AI-powered analysis
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scenarios.map((scenario, index) => (
                  <div
                    key={scenario.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${300 + index * 50}ms` }}
                  >
                    <ScenarioCard
                      {...scenario}
                      isActive={selectedScenario === scenario.id}
                      onClick={() => handleScenarioClick(scenario.id)}
                    />
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="animate-fade-up">
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => {
                  setActiveView("dashboard");
                  setSelectedScenario(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>

            <div className="mb-8">
              <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                <span className="text-gradient">Volume Consolidation</span>{" "}
                Analysis
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Enter your supplier data to identify consolidation opportunities
                and calculate potential savings.
              </p>
            </div>

            <div className="card-elevated rounded-2xl p-6 md:p-8">
              <ConsolidationWizard />
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;
