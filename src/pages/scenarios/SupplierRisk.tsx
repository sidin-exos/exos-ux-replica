import ScenarioLandingPage from '@/components/scenarios/ScenarioLandingPage';

export default function SupplierRisk() {
  return (
    <ScenarioLandingPage
      metaTitle="AI Supplier Risk Assessment Software | EXOS"
      metaDescription="Comprehensive supplier risk analysis covering financial health, geopolitical exposure, legal, cyber, and operational risk. Real-time market intelligence. GDPR-native for EU teams."
      canonicalPath="/scenarios/supplier-risk-assessment"
      category="Risk"
      h1="Supplier Risk Assessment Software"
      subtitle="Identify supplier vulnerabilities before they become supply chain crises. Powered by real-time market intelligence."
      heroMetric="6 weeks"
      heroMetricLabel="Average production halt avoided by early EXOS risk flagging"
      whatItDoesTitle="What Supplier Risk Assessment Does"
      whatItDoesParagraph="Supplier risk is rarely a single event — it compounds. A supplier's financial stress shows up in their audit reports months before a crisis. Geopolitical exposure appears in trade publications weeks before it affects your supply chain. EXOS Supplier Risk Assessment runs a multi-dimensional analysis across financial health, legal standing, cyber risk, operational concentration, and real-time market signals — grounded in live web intelligence via Perplexity Sonar. The output is a structured risk scorecard with prioritised mitigation recommendations, not a generic risk register template."
      features={[
        { icon: "AlertTriangle", title: "Multi-Dimensional Risk Scoring", description: "Legal, financial, cyber, operational, and geopolitical risk assessed in a single structured scorecard." },
        { icon: "Globe", title: "Real-Time Market Intelligence", description: "Live signals from supplier news, regulatory filings, M&A activity, and financial disclosures — not static databases." },
        { icon: "Network", title: "Dependency & Concentration Analysis", description: "Identifies single-source exposure, geographic concentration, and portfolio risk across your supplier base." },
        { icon: "ClipboardList", title: "Mitigation Roadmap", description: "Prioritised risk mitigation actions with alternative sourcing options and contingency planning guidance." }
      ]}
      whoItIsFor={[
        { role: "VP Supply Chain", need: "Needs early warning on supplier vulnerabilities before they trigger production stoppages or contract penalties." },
        { role: "Procurement Risk Manager", need: "Requires structured, defensible risk documentation for board-level reporting and insurance purposes." },
        { role: "Category Manager — Direct Spend", need: "Managing critical component suppliers and needs to quantify dependency risk before contract renewal." },
        { role: "CFO / Operations Director", need: "Needs supplier risk visibility before M&A due diligence or new market entry decisions." }
      ]}
      proof={{
        quote: "When our primary tungsten supplier faced EU regulatory action, EXOS had already flagged the risk two months prior. The contingency plans we had built using the Black Swan module kept our production lines running.",
        person: "Erik Lindqvist, VP Supply Chain",
        company: "NordSteel Industries AB",
        metric: "6-week production halt avoided"
      }}
      relatedScenarios={[
        { name: "Black Swan Scenario Simulator", path: "/scenarios/black-swan-simulation", description: "Simulate catastrophic supply chain disruptions and build proactive mitigation roadmaps." },
        { name: "Supplier Dependency & Exit Planner", path: "/features", description: "Assess concentration risk and build diversification or exit roadmaps for critical suppliers." },
        { name: "Supplier Snapshot", path: "/features", description: "Comprehensive supplier intelligence dossier before entering any negotiation." }
      ]}
    />
  );
}
