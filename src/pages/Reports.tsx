import Header from "@/components/layout/Header";
import SOWAnalysisDashboard from "@/components/reports/SOWAnalysisDashboard";
import NegotiationPrepDashboard from "@/components/reports/NegotiationPrepDashboard";
import RiskMatrixDashboard from "@/components/reports/RiskMatrixDashboard";
import DataQualityDashboard from "@/components/reports/DataQualityDashboard";
import ScenarioComparisonDashboard from "@/components/reports/ScenarioComparisonDashboard";
import SupplierPerformanceDashboard from "@/components/reports/SupplierPerformanceDashboard";

const Reports = () => {
  return (
    <div className="min-h-screen gradient-hero">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--gradient-glow)" }}
      />

      <Header />

      <main className="container py-8 relative">
        {/* Hero Section */}
        <section className="mb-12 animate-fade-up">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Analysis <span className="text-gradient">Reports</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Interactive dashboards that transform procurement data into actionable insights.
          </p>
        </section>

        {/* Dashboard Grid */}
        <div className="space-y-10">
          {/* Row 1: SOW Analysis + Negotiation Prep */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="animate-fade-up" style={{ animationDelay: "100ms" }}>
              <SOWAnalysisDashboard />
            </section>
            <section className="animate-fade-up" style={{ animationDelay: "150ms" }}>
              <NegotiationPrepDashboard />
            </section>
          </div>

          {/* Row 2: Risk Matrix + Data Quality */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="animate-fade-up" style={{ animationDelay: "200ms" }}>
              <RiskMatrixDashboard />
            </section>
            <section className="animate-fade-up" style={{ animationDelay: "250ms" }}>
              <DataQualityDashboard />
            </section>
          </div>

          {/* Row 3: Scenario Comparison + Supplier Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="animate-fade-up" style={{ animationDelay: "300ms" }}>
              <ScenarioComparisonDashboard />
            </section>
            <section className="animate-fade-up" style={{ animationDelay: "350ms" }}>
              <SupplierPerformanceDashboard />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
