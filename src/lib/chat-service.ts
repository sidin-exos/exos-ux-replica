// ── Scenario Knowledge Base ──────────────────────────────────────────────────

interface ScenarioInfo {
  name: string;
  logic: string;
  useCases: string[];
  inputs: string;
  outputs: string;
  limitations: string;
}

const SCENARIOS: Record<string, ScenarioInfo> = {
  costBreakdown: {
    name: 'Cost Breakdown Analysis',
    logic:
      'Decomposes a product or service price into granular cost components — materials, labor, overhead, logistics, and profit margin — then benchmarks each against industry norms to surface hidden mark-ups and negotiation levers.',
    useCases: [
      'A buyer receives a supplier quote of $1.2M and wants to understand what portion is raw material vs. margin',
      'Procurement team preparing for a price re-negotiation needs data-backed arguments',
      "Finance needs to validate whether a vendor's annual price increase is justified",
    ],
    inputs:
      'Supplier quote or pricing data, product/service description, optional commodity indices, industry & category context.',
    outputs:
      '**Cost Waterfall** dashboard showing component-level breakdown, **Sensitivity Spider** chart for what-if modeling, and a prioritized list of negotiation levers.',
    limitations:
      'Relies on user-provided cost data and does not independently verify market prices. Accuracy improves significantly when commodity indices or benchmark data are supplied.',
  },
  volumeConsolidation: {
    name: 'Volume Consolidation',
    logic:
      'Aggregates demand across business units, categories, or time periods to identify bundling opportunities. Calculates potential volume discounts using tiered pricing models and estimates savings from supplier rationalization.',
    useCases: [
      'A multi-site company discovers 5 departments buy the same MRO supplies from different vendors',
      'Procurement wants to leverage combined annual spend to negotiate better tier pricing',
      'A merger integration team needs to consolidate overlapping supplier bases',
    ],
    inputs:
      'Spend data by category/BU, current supplier list with volumes, target consolidation scope.',
    outputs:
      '**Scenario Comparison** dashboard with before/after savings, **Supplier Performance** scorecard, and risk-adjusted consolidation roadmap.',
    limitations:
      'Savings estimates assume suppliers will offer standard volume discounts. Actual negotiated outcomes may differ. Does not account for switching costs unless explicitly provided.',
  },
  makeOrBuy: {
    name: 'Make-or-Buy Analysis',
    logic:
      'Evaluates the total cost and strategic implications of producing in-house vs. outsourcing. Compares direct costs, overhead absorption, quality control, lead times, and strategic dependency risks across both options.',
    useCases: [
      'A manufacturer weighing whether to insource a machined component currently bought from a single supplier',
      'IT department deciding between building a tool internally or licensing a SaaS solution',
      'Operations evaluating whether to bring logistics in-house after repeated delivery failures',
    ],
    inputs:
      'Current outsourcing costs, internal production cost estimates, capacity utilization data, quality metrics, strategic priorities.',
    outputs:
      '**TCO Comparison** dashboard (in-house vs. outsource), **Decision Matrix** with weighted scoring, **Risk Matrix** for dependency analysis.',
    limitations:
      'Requires honest internal cost estimates including overhead allocation. Hidden costs (management overhead, training) are often underestimated by users and should be explicitly included.',
  },
  tcoAnalysis: {
    name: 'Total Cost of Ownership (TCO)',
    logic:
      'Performs lifecycle cost analysis covering acquisition, operation (energy, maintenance, consumables), vendor lock-in risks (proprietary parts, data portability), macroeconomic factors (inflation, interest rates), and exit costs (decommissioning, residual value).',
    useCases: [
      'Evaluating competing bids for industrial equipment where upfront prices differ but operational costs vary dramatically',
      'Comparing SaaS vs. on-premise software over a 5-year horizon',
      'Assessing fleet replacement options with different fuel/maintenance profiles',
    ],
    inputs:
      'Vendor quotes, operational cost estimates, contract terms, expected lifecycle duration, discount rate assumptions.',
    outputs:
      '**TCO Comparison** dashboard with lifecycle waterfall, **Sensitivity Spider** for variable stress-testing, **Timeline Roadmap** for cost milestones.',
    limitations:
      'Projections beyond 3-5 years carry increasing uncertainty. Macro assumptions (inflation, energy prices) are user-defined and not dynamically updated.',
  },
  supplierReview: {
    name: 'Supplier Review',
    logic:
      'Multi-dimensional evaluation of supplier performance across quality, delivery, cost competitiveness, innovation, and relationship health. Uses weighted scoring with configurable priorities to produce a balanced assessment.',
    useCases: [
      'Annual supplier performance review for top-20 strategic vendors',
      'Evaluating whether to renew or replace an underperforming logistics provider',
      'Onboarding assessment to benchmark a new supplier against incumbents',
    ],
    inputs:
      'Supplier performance data (quality metrics, delivery stats), contract terms, relationship history, business context.',
    outputs:
      '**Supplier Performance** scorecard with radar chart, **Kraljic Quadrant** positioning, **Action Checklist** with prioritized improvement actions.',
    limitations:
      'Scoring is based on user-supplied performance data. Without objective KPIs, results reflect perception rather than measurement. Best used alongside actual delivery and quality records.',
  },
  riskAssessment: {
    name: 'Risk Assessment',
    logic:
      'Multi-dimensional risk analysis combining market dynamics (volatility, regulatory exposure), contract analysis (liability, termination rights), and situation assessment (supplier financial health, geopolitical factors). Produces a risk heat map with mitigation strategies.',
    useCases: [
      'Assessing supply chain risk exposure ahead of a critical product launch',
      'Evaluating geopolitical risk for a sole-source component from a volatile region',
      'Pre-contract risk review for a high-value outsourcing agreement',
    ],
    inputs:
      'Supplier information, contract terms, market context, known risk factors, risk appetite setting.',
    outputs:
      '**Risk Matrix** dashboard with probability/impact mapping, **Action Checklist** for mitigation priorities, narrative risk summary.',
    limitations:
      'Cannot predict black-swan events. Risk scores are qualitative estimates informed by the data provided. For financial risk, actual credit reports should supplement the analysis.',
  },
  contractReview: {
    name: 'Contract Review',
    logic:
      'Analyzes contract documents for risk clauses, unfavorable terms, missing protections, and compliance gaps. Flags specific sections with severity ratings and suggests alternative language.',
    useCases: [
      "Legal/procurement reviewing a vendor's standard T&Cs before signing",
      'Identifying liability gaps in an existing services agreement up for renewal',
      'Comparing two competing vendor contracts to see which has better protections',
    ],
    inputs:
      'Contract text or key terms summary, business context, industry-specific compliance requirements.',
    outputs:
      '**SOW Analysis** dashboard with clause-by-clause assessment, **Risk Matrix** for contract-specific risks, redline suggestions.',
    limitations:
      'This is an analytical tool, not legal advice. All flagged issues should be reviewed by qualified legal counsel before acting. Jurisdiction-specific regulations may not be fully covered.',
  },
  sowCritic: {
    name: 'SOW Critic / Generator',
    logic:
      'Evaluates or generates Statements of Work by checking for completeness, ambiguity, measurability of deliverables, acceptance criteria clarity, and alignment with industry best practices.',
    useCases: [
      'Reviewing a vendor-drafted SOW before project kickoff to catch vague deliverables',
      'Generating a structured SOW template from a project brief',
      'Improving an existing SOW that led to disputes in a previous engagement',
    ],
    inputs:
      'Draft SOW or project requirements, project scope description, key deliverables, timeline expectations.',
    outputs:
      '**SOW Analysis** dashboard with completeness scoring, gap identification, suggested improvements, and a clean revised version.',
    limitations:
      'Generated SOWs are templates requiring domain-specific customization. Technical specifications must be validated by subject matter experts.',
  },
  negotiationPrep: {
    name: 'Negotiation Preparation',
    logic:
      'Builds a tactical negotiation playbook by analyzing the power balance, identifying BATNAs (best alternatives), mapping concession strategies, and preparing data-backed arguments for each negotiation lever.',
    useCases: [
      'Preparing for an annual contract renewal with a sole-source supplier',
      'Building arguments for a price reduction based on market changes',
      'Multi-party negotiation where multiple vendors compete for a bundled deal',
    ],
    inputs:
      'Current contract terms, market benchmarks, supplier relationship context, negotiation objectives, available alternatives.',
    outputs:
      '**Negotiation Prep** dashboard with power balance analysis, BATNA mapping, concession ladder, and scripted talking points.',
    limitations:
      'Playbook effectiveness depends on the quality of market intelligence and alternatives data provided. Real-time negotiation dynamics cannot be predicted.',
  },
  categoryStrategy: {
    name: 'Category Strategy',
    logic:
      'Comprehensive category management analysis covering market structure, supply risk, business impact, and strategic positioning. Uses Kraljic matrix logic to classify categories and recommend differentiated strategies.',
    useCases: [
      'Developing a 3-year sourcing strategy for a critical indirect category',
      'Re-evaluating category positioning after a major market disruption',
      'New CPO building category strategies across the full procurement portfolio',
    ],
    inputs:
      'Category spend data, supplier landscape, market dynamics, business priorities, risk tolerance.',
    outputs:
      '**Kraljic Quadrant** positioning, **Decision Matrix** for strategic options, **Timeline Roadmap** for implementation, **Action Checklist**.',
    limitations:
      'Strategy recommendations are directional and assume stable market conditions. Rapid market shifts may require re-analysis. Implementation feasibility depends on organizational capabilities.',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function countAssistantMessages(
  msgs: { role: string; content: string }[],
): number {
  return msgs.filter((m) => m.role === 'assistant').length;
}

function allText(msgs: { role: string; content: string }[]): string {
  return msgs.map((m) => m.content).join(' ').toLowerCase();
}

function formatScenario(s: ScenarioInfo): string {
  const cases = s.useCases.map((c) => `- ${c}`).join('\n');
  return [
    `**${s.name}**\n`,
    `**How it works:** ${s.logic}\n`,
    `**Typical use-cases:**\n${cases}\n`,
    `**Required inputs:** ${s.inputs}\n`,
    `**Generated outputs:** ${s.outputs}\n`,
    `**Limitations:** ${s.limitations}`,
  ].join('\n');
}

// ── Topic detection ─────────────────────────────────────────────────────────

type Topic = 'cost' | 'supplier' | 'risk' | 'docs' | 'strategy' | null;

function detectTopic(text: string): Topic {
  if (/cost|saving|price|spend|budget|cheap|expens|breakdown|consolidat|volume|bundle/i.test(text)) return 'cost';
  if (/supplier|vendor|sourc|evaluat|perform|scorecard/i.test(text)) return 'supplier';
  if (/risk|disrupt|vulnerab|audit|compliance|contingenc/i.test(text)) return 'risk';
  if (/contract|sow|document|scope|agreement|legal|clause/i.test(text)) return 'docs';
  if (/strateg|plan|negotiat|category|roadmap|long.?term/i.test(text)) return 'strategy';
  return null;
}

// ── Phase-specific responses per topic ──────────────────────────────────────

const PHASE2: Record<NonNullable<Topic>, string> = {
  cost:
    "Great — cost optimization is one of EXOS's strongest areas. To narrow it down: **what data do you currently have available?** For example, do you have detailed supplier quotes, historical spend data, or are you starting from a rough budget estimate?",
  supplier:
    "Supplier management is critical. To recommend the right scenario: **what's your current situation?** Do you have performance metrics on existing suppliers, or are you evaluating new vendors you haven't worked with yet?",
  risk:
    "Risk management — smart priority. Help me understand: **what kind of risk concerns you most?** Supply chain disruption, contractual liability, financial exposure of a supplier, or regulatory compliance?",
  docs:
    "Document analysis is a great use of AI leverage. Quick question: **are you working with an existing contract/SOW that needs review, or do you need to create a new scope document from scratch?**",
  strategy:
    "Strategic planning — that's where EXOS really shines. To guide you well: **what's the scope?** Are you preparing for a specific negotiation, building a long-term category strategy, or prioritizing across multiple procurement projects?",
};

const PHASE3: Record<NonNullable<Topic>, string> = {
  cost:
    "Got it. One more question: **what's driving the timing?** Is this for an upcoming negotiation, a scheduled budget review, a new RFP evaluation, or a general cost reduction initiative?",
  supplier:
    "Understood. And **what's the urgency?** Is this a routine periodic review, are you facing performance issues that need immediate attention, or is this part of a larger sourcing event?",
  risk:
    "Clear. **What's the context for this assessment?** Is it triggered by a specific event (supplier issue, market change), part of a scheduled risk review, or preparation for a new contract/relationship?",
  docs:
    "Makes sense. **What's the deadline pressure?** Is this for an imminent signing, a scheduled renewal, or a proactive review with no immediate deadline?",
  strategy:
    "Helpful context. **What resources and data do you have on hand?** Detailed spend analytics, market research, supplier assessments, or are you starting relatively fresh?",
};

function getRecommendation(topic: NonNullable<Topic>, text: string): string {
  const header = "Based on what you've told me, here's what I'd recommend:\n\n---\n\n";

  switch (topic) {
    case 'cost': {
      const wantsConsolidation = /volume|bundl|consolidat|multiple|several|departments/i.test(text);
      const wantsMakeOrBuy = /make.?or.?buy|insourc|outsourc|build.?vs/i.test(text);
      const wantsTCO = /tco|total cost|lifecycle|long.?term|equipment|asset/i.test(text);
      if (wantsConsolidation) return header + formatScenario(SCENARIOS.volumeConsolidation);
      if (wantsMakeOrBuy) return header + formatScenario(SCENARIOS.makeOrBuy);
      if (wantsTCO) return header + formatScenario(SCENARIOS.tcoAnalysis);
      return header + formatScenario(SCENARIOS.costBreakdown) + '\n\n---\n\nIf you also want to compare lifecycle costs across options, consider running a **TCO Analysis** afterward.';
    }
    case 'supplier':
      return header + formatScenario(SCENARIOS.supplierReview);
    case 'risk':
      return header + formatScenario(SCENARIOS.riskAssessment);
    case 'docs': {
      const wantsSOW = /sow|scope|generat|creat|new|draft|write/i.test(text);
      if (wantsSOW) return header + formatScenario(SCENARIOS.sowCritic);
      return header + formatScenario(SCENARIOS.contractReview);
    }
    case 'strategy': {
      const wantsNeg = /negotiat|renew|deal|bargain/i.test(text);
      if (wantsNeg) return header + formatScenario(SCENARIOS.negotiationPrep);
      return header + formatScenario(SCENARIOS.categoryStrategy);
    }
  }
}

// ── Main entry point ────────────────────────────────────────────────────────

export async function getMockAIResponse(
  messages: { role: string; content: string }[],
): Promise<string> {
  // Simulate network delay
  const delay = 800 + Math.random() * 1200;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const assistantCount = countAssistantMessages(messages);
  const combined = allText(messages);
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content.toLowerCase() ?? '';

  // ── "How to use EXOS?" guided flow ─────────────────────────────────────
  const isGuidedFlow = /how to use exos/i.test(messages[0]?.content ?? '');

  if (isGuidedFlow) {
    // Phase 1: Greeting
    if (assistantCount === 0) {
      return (
        "Welcome to **EXOS** — your AI-powered procurement analysis platform! 🚀\n\n" +
        "EXOS offers **20+ analytical scenarios** across four categories:\n" +
        "- **Cost Optimization** — break down prices, consolidate volumes, compare total ownership costs\n" +
        "- **Planning & Sourcing** — build strategies, prepare negotiations, plan procurement projects\n" +
        "- **Risk Management** — assess supply chain risks, audit suppliers, map vulnerabilities\n" +
        "- **Documentation** — review contracts, critique SOWs, generate scope documents\n\n" +
        "Each scenario takes your data, enriches it with industry context, and produces a detailed AI-generated report with interactive dashboards.\n\n" +
        "**What's your main goal right now?** Are you looking to save money, manage risk, evaluate suppliers, or prepare documents?"
      );
    }

    const topic = detectTopic(combined);

    // Phase 2: Goal clarification
    if (assistantCount === 1 && topic) {
      return PHASE2[topic];
    }

    // Phase 3: Context gathering
    if (assistantCount === 2 && topic) {
      return PHASE3[topic];
    }

    // Phase 4: Recommendation
    if (assistantCount >= 3 && topic) {
      return getRecommendation(topic, combined);
    }

    // Fallback if topic not detected yet
    if (!topic) {
      return "Could you tell me a bit more? Are you focused on **reducing costs**, **managing suppliers**, **handling risks**, or **working with contracts and documents**? That'll help me point you to the right scenario.";
    }
  }

  // ── Direct topic chips (quicker path with 1 clarifying question) ───────

  const topic = detectTopic(lastUserMsg) ?? detectTopic(combined);

  if (topic && assistantCount === 0) {
    return PHASE2[topic];
  }

  if (topic && assistantCount >= 1) {
    return getRecommendation(topic, combined);
  }

  // ── Generic fallback ──────────────────────────────────────────────────
  return "Tell me more about your procurement challenge — are you focused on **reducing costs**, **managing suppliers**, **handling risks**, or **preparing documents**? I'll recommend the best EXOS scenario for you.";
}
