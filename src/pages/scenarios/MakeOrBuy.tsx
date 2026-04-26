import ScenarioLandingPage from '@/components/scenarios/ScenarioLandingPage';

export default function MakeOrBuy() {
  return (
    <ScenarioLandingPage
      metaTitle="Make vs Buy Analysis Tool | EXOS"
      metaDescription="Evaluate whether to produce in-house or outsource. EXOS Make vs Buy analysis covers cost, capability, strategic fit, quality, and speed — with a structured recommendation for EU procurement teams."
      canonicalPath="/scenarios/make-or-buy-analysis"
      category="Analysis"
      h1="Make vs Buy Analysis Tool"
      subtitle="One of the most consequential procurement decisions. Get a structured, multi-factor analysis before you commit to either path."
      heroMetric="5 factors"
      heroMetricLabel="Cost, capability, speed, quality, and strategic fit — all modelled simultaneously"
      whatItDoesTitle="What Make vs Buy Analysis Does"
      whatItDoesParagraph="The make vs buy decision is deceptively complex. Unit cost comparisons miss capability gaps, hidden transaction costs, strategic dependency risks, and long-term flexibility trade-offs. EXOS Make vs Buy Analysis structures the decision across five dimensions — cost, internal capability, production speed, quality assurance, and strategic fit — and weights them against your specific business context. The output is a structured recommendation with sensitivity analysis: what changes if labour costs rise, if a key capability is acquired, or if the outsourced supplier fails."
      features={[
        { icon: "Scale", title: "Five-Dimension Framework", description: "Cost, capability, speed, quality, and strategic fit assessed simultaneously — not just unit economics." },
        { icon: "TrendingUp", title: "Sensitivity Analysis", description: "Model how the decision changes under different cost, capability, and supply risk scenarios." },
        { icon: "Building2", title: "Strategic Fit Scoring", description: "Assesses whether in-house production aligns with core competency strategy or creates distraction risk." },
        { icon: "ArrowLeftRight", title: "Switching Cost Modelling", description: "Quantifies the cost and complexity of reversing the decision if circumstances change." }
      ]}
      whoItIsFor={[
        { role: "CPO / Head of Procurement", need: "Needs a defensible, multi-factor analysis to support a board-level build-or-buy recommendation." },
        { role: "CFO", need: "Evaluating capital allocation between internal investment and outsourcing for a core production capability." },
        { role: "Operations Director", need: "Deciding whether to insource a previously outsourced function as part of a supply chain resilience strategy." },
        { role: "Category Manager — Manufacturing or IT", need: "Assessing whether a specialist component or service is better built internally or sourced from the market." }
      ]}
      relatedScenarios={[
        { name: "Total Cost of Ownership Analysis", path: "/scenarios/tco-analysis", description: "Full lifecycle cost modelling to anchor the financial dimension of your make vs buy decision." },
        { name: "Capex vs Opex Analysis", path: "/features", description: "NPV and cash flow comparison between asset purchase and leasing alternatives." },
        { name: "Supplier Dependency & Exit Planner", path: "/features", description: "Assess outsourcing risk and build exit roadmaps before committing to external supply." }
      ]}
    />
  );
}
