import ScenarioLandingPage from '@/components/scenarios/ScenarioLandingPage';

export default function NegotiationPrep() {
  return (
    <ScenarioLandingPage
      metaTitle="AI Negotiation Preparation Tool for Procurement | EXOS"
      metaDescription="Calculate your BATNA, ZOPA, and buying power before any supplier negotiation. AI-powered negotiation strategy with tactical recommendations. Built for EU procurement teams."
      canonicalPath="/scenarios/negotiation-preparation"
      category="Planning"
      h1="Negotiation Preparation"
      subtitle="Walk into every supplier negotiation knowing your BATNA, your leverage, and your walk-away position — calculated before you sit down."
      heroMetric="40 min"
      heroMetricLabel="Average time saved per negotiation brief vs manual preparation"
      whatItDoesTitle="What Negotiation Preparation Does"
      whatItDoesParagraph="Most procurement teams negotiate reactively — responding to supplier proposals without a structured position. EXOS Negotiation Preparation changes that. The AI calculates your Best Alternative to a Negotiated Agreement (BATNA), maps the Zone of Possible Agreement (ZOPA), assesses your buying power using the Kraljic Matrix, and generates tactical recommendations grounded in battle-tested negotiation frameworks. Every output includes three negotiation scenarios — aggressive, balanced, and conservative — so you control the pace of the negotiation, not the supplier."
      features={[
        { icon: "Target", title: "BATNA & ZOPA Calculation", description: "Quantified best alternatives and zone of agreement calculated before you open any negotiation." },
        { icon: "TrendingUp", title: "Buying Power Assessment", description: "Kraljic Matrix positioning, spend concentration, and switching cost analysis to determine your true leverage." },
        { icon: "Swords", title: "Tactical Recommendations", description: "Battle-tested negotiation tactics from senior procurement experts, injected as few-shot AI grounding." },
        { icon: "GitBranch", title: "Three Negotiation Scenarios", description: "Aggressive, balanced, and conservative negotiation paths with expected outcomes and risk trade-offs." }
      ]}
      whoItIsFor={[
        { role: "Procurement Manager / Category Manager", need: "Needs a structured negotiation position prepared in minutes, not days of manual research and brief-writing." },
        { role: "CPO", need: "Wants consistent, framework-driven negotiation preparation across the team — not dependent on individual experience." },
        { role: "CFO / Business Owner", need: "Preparing for a high-value supplier contract renewal without an in-house procurement specialist." },
        { role: "Mid-market Operations Lead", need: "Negotiating IT, logistics, or services contracts and needs expert-level preparation without consulting support." }
      ]}
      relatedScenarios={[
        { name: "Total Cost of Ownership Analysis", path: "/scenarios/tco-analysis", description: "Build your cost position before negotiation with full lifecycle cost visibility." },
        { name: "Category Strategy", path: "/features", description: "Three-year category roadmap using Kraljic Matrix and Porter's Five Forces." },
        { name: "Pre-Flight Audit", path: "/features", description: "Supplier intelligence dossier — know your counterpart before the meeting starts." }
      ]}
    />
  );
}
