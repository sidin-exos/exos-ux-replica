import ScenarioLandingPage from '@/components/scenarios/ScenarioLandingPage';

export default function TCOAnalysis() {
  return (
    <ScenarioLandingPage
      metaTitle="Total Cost of Ownership Analysis Software | EXOS"
      metaDescription="Calculate the true lifecycle cost of any procurement decision. EXOS TCO analysis covers acquisition, operation, risk, and exit costs — GDPR-native, built for EU mid-market teams."
      canonicalPath="/scenarios/tco-analysis"
      category="Analysis"
      h1="Total Cost of Ownership Analysis"
      subtitle="Go beyond unit price. Uncover the full lifecycle cost of every procurement decision before you commit."
      heroMetric="18%"
      heroMetricLabel="Average cost reduction identified by EXOS TCO analysis"
      whatItDoesTitle="What TCO Analysis Does"
      whatItDoesParagraph="Most procurement decisions are made on purchase price alone — the most visible and least representative cost. EXOS TCO Analysis calculates the complete financial picture: acquisition cost, implementation, training, ongoing operation, maintenance, compliance burden, risk exposure, and end-of-life exit costs. The AI extracts hidden cost drivers from your supplier proposals and contract terms, then runs the mathematics deterministically on our secure backend — not by a language model that can hallucinate. Every output is formatted for boardroom presentation, with hard and soft savings clearly separated and audit-ready."
      features={[
        { icon: "Calculator", title: "Full Lifecycle Costing", description: "Acquisition, operation, risk, compliance, and exit costs calculated in a single structured model." },
        { icon: "Shield", title: "Hidden Cost Detection", description: "AI identifies depreciation schedules, true-up fees, inflation escalators, and tax liabilities buried in proposal documents." },
        { icon: "BarChart3", title: "Deterministic Maths", description: "Financial calculations run on our secure edge backend — not by an LLM. Every number is verifiable and traceable." },
        { icon: "FileText", title: "Boardroom-Ready Output", description: "Hard savings, soft savings, and risk-adjusted scenarios presented in structured reports with Excel export." }
      ]}
      whoItIsFor={[
        { role: "Head of Procurement / CPO", need: "Needs defensible cost analysis to challenge vendor pricing and justify sourcing decisions to the CFO." },
        { role: "CFO / Finance Business Partner", need: "Requires lifecycle cost visibility before capital allocation decisions, not just sticker price comparisons." },
        { role: "Category Manager", need: "Needs to identify hidden cost drivers across complex categories like IT, logistics, and manufacturing equipment." },
        { role: "Mid-market Operations Lead", need: "Carries procurement responsibility without a specialist function — needs expert-grade analysis without consulting fees." }
      ]}
      proof={{
        quote: "EXOS revealed hidden logistics costs we had been overlooking for years. The TCO breakdown across our 12 hospital supply chains was eye-opening — we renegotiated three major contracts within weeks.",
        person: "Dr. Katrin Schäfer, Head of Strategic Procurement",
        company: "MedTech Solutions GmbH",
        metric: "18% cost saving on surgical instrument procurement"
      }}
      relatedScenarios={[
        { name: "Make vs Buy Analysis", path: "/scenarios/make-or-buy-analysis", description: "Decide whether to produce in-house or outsource using cost, capability, and strategic fit analysis." },
        { name: "Cost Breakdown", path: "/features", description: "Analyse cost drivers for goods and services to build negotiation leverage." },
        { name: "Savings Calculation", path: "/features", description: "Document and validate procurement savings with inflation adjustment and audit-ready reporting." }
      ]}
    />
  );
}
