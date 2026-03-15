/**
 * INPUT_EVALUATOR — Group-level checks (A/B/C/D/E)
 * Each group has specific quality expectations beyond universal checks.
 */

import { QualityCheck, ScenarioGroup } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────

function hasNumericContent(text: string): boolean {
  return /\d+/.test(text);
}

function hasCurrencySymbol(text: string): boolean {
  return /[€$£¥₹]/.test(text);
}

function hasPercentage(text: string): boolean {
  return /\d+\s*%/.test(text);
}

function hasTimeframe(text: string): boolean {
  return /\b(year|month|week|quarter|Q[1-4]|20\d{2}|annual|monthly|quarterly|daily|weekly)\b/i.test(text);
}

function hasListStructure(text: string): boolean {
  // Bullet points, numbered lists, pipe-separated, newline-separated items
  return /(?:^|\n)\s*[•\-\*\d+\.]\s/m.test(text) || /\|/.test(text);
}

function countSentences(text: string): number {
  return (text.match(/[.!?]+\s/g) || []).length + 1;
}

// ── GROUP A: Analytical Value (S1–S8) ────────────────────────────────
// Expect: numeric data, currency amounts, timeframes, units

function runGroupAChecks(fieldId: string, text: string): QualityCheck[] {
  const checks: QualityCheck[] = [];
  if (!text.trim()) return checks;

  if (!hasNumericContent(text)) {
    checks.push({
      id: "GROUPA_NUMERIC_PRESENCE",
      severity: "WARNING",
      message: "No numeric data found. Analytical scenarios need numbers (costs, volumes, rates) for accurate modelling.",
      fieldId,
      suggestion: "Add specific figures: costs in €, volumes, percentages, or quantities.",
    });
  }

  if (!hasCurrencySymbol(text) && !hasPercentage(text)) {
    checks.push({
      id: "GROUPA_CURRENCY_CONSISTENCY",
      severity: "WARNING",
      message: "No currency symbols or percentages detected. Financial analysis benefits from explicit monetary values.",
      fieldId,
      suggestion: "Include currency amounts (€, $, £) and percentages where applicable.",
    });
  }

  if (!hasTimeframe(text)) {
    checks.push({
      id: "GROUPA_TIMEFRAME_PRESENT",
      severity: "WARNING",
      message: "No timeframe reference detected. Analytical models need temporal context (years, months, quarters).",
      fieldId,
      suggestion: "Specify the time period: annual figures, contract duration, or planning horizon.",
    });
  }

  return checks;
}

// ── GROUP B: Workflow & Convenience (S9–S15) ─────────────────────────
// Expect: narrative depth, stakeholder references, deliverable lists

function runGroupBChecks(fieldId: string, text: string): QualityCheck[] {
  const checks: QualityCheck[] = [];
  if (!text.trim()) return checks;

  if (countSentences(text) < 3) {
    checks.push({
      id: "GROUPB_NARRATIVE_DEPTH",
      severity: "WARNING",
      message: "Very brief input. Workflow scenarios need descriptive context (at least 3–4 sentences) to produce useful outputs.",
      fieldId,
      suggestion: "Expand your description with business context, requirements, and constraints.",
    });
  }

  const hasStakeholder = /\b(stakeholder|team|manager|lead|director|cpo|cfo|cto|cio|head of|sponsor|owner|approver|decision[\s-]?maker)\b/i.test(text);
  if (!hasStakeholder) {
    checks.push({
      id: "GROUPB_STAKEHOLDER_REFERENCE",
      severity: "WARNING",
      message: "No stakeholder roles mentioned. Workflow outputs improve when key roles are identified.",
      fieldId,
      suggestion: "Reference key roles: project sponsor, approver, procurement lead, etc.",
    });
  }

  return checks;
}

// ── GROUP C: Reliability & Compliance (S16–S20) ──────────────────────
// Expect: regulatory references, risk specificity, document completeness

function runGroupCChecks(fieldId: string, text: string): QualityCheck[] {
  const checks: QualityCheck[] = [];
  if (!text.trim()) return checks;

  const hasRegulatory = /\b(gdpr|iso|soc\s?2|hipaa|sox|pci|dss|nist|regulation|compliance|regulatory|statutory|legal|act|directive|standard)\b/i.test(text);
  if (!hasRegulatory) {
    checks.push({
      id: "GROUPC_REGULATORY_REFERENCE",
      severity: "WARNING",
      message: "No regulatory or compliance framework referenced. Risk and compliance scenarios benefit from explicit framework mentions.",
      fieldId,
      suggestion: "Mention applicable standards: GDPR, ISO 27001, SOC2, industry-specific regulations.",
    });
  }

  // Check for vague risk descriptions
  const vagueRisk = /\b(some risk|general risk|various risks|potential issues|possible problems)\b/i.test(text);
  if (vagueRisk) {
    checks.push({
      id: "GROUPC_RISK_SPECIFICITY",
      severity: "WARNING",
      message: "Risk descriptions appear vague. Specific risk identification produces actionable mitigation plans.",
      fieldId,
      suggestion: "Name specific risks: 'single-source dependency on Supplier A for component X' rather than 'some supply risk'.",
    });
  }

  return checks;
}

// ── GROUP D: Strategic (S21–S27) ─────────────────────────────────────
// Expect: strategic specificity, alternatives present, temporal horizon

function runGroupDChecks(fieldId: string, text: string): QualityCheck[] {
  const checks: QualityCheck[] = [];
  if (!text.trim()) return checks;

  const hasStrategicTerms = /\b(strategy|strategic|objective|goal|target|vision|roadmap|initiative|priority|alignment|competitive|advantage|market position)\b/i.test(text);
  if (!hasStrategicTerms) {
    checks.push({
      id: "GROUPD_STRATEGIC_SPECIFICITY",
      severity: "WARNING",
      message: "No strategic language detected. Strategic scenarios produce better outputs when goals and objectives are explicit.",
      fieldId,
      suggestion: "State your strategic objective: cost leadership, risk reduction, innovation, market expansion, etc.",
    });
  }

  const hasAlternatives = /\b(alternative|option|compare|versus|vs\.?|or|instead|either|choice|candidate)\b/i.test(text);
  if (!hasAlternatives) {
    checks.push({
      id: "GROUPD_ALTERNATIVES_PRESENT",
      severity: "INFO",
      message: "No alternatives or comparison options mentioned. Strategic analysis is stronger with multiple options to evaluate.",
      fieldId,
      suggestion: "Describe at least 2 options or alternatives being considered.",
    });
  }

  if (!hasTimeframe(text)) {
    checks.push({
      id: "GROUPD_TEMPORAL_HORIZON",
      severity: "INFO",
      message: "No planning horizon specified. Strategic analysis needs a timeframe (1-year, 3-year, 5-year).",
      fieldId,
      suggestion: "Specify your planning horizon and key milestones.",
    });
  }

  return checks;
}

// ── GROUP E: Intelligence (S28–S29) ──────────────────────────────────
// Expect: query specificity, niche depth, entity format

function runGroupEChecks(fieldId: string, text: string): QualityCheck[] {
  const checks: QualityCheck[] = [];
  if (!text.trim()) return checks;

  // Check query specificity (too short = too vague)
  const words = text.trim().split(/\s+/);
  if (words.length < 10) {
    checks.push({
      id: "GROUPE_QUERY_SPECIFICITY",
      severity: "WARNING",
      message: "Query is very brief. Intelligence scenarios need specific, detailed queries to return targeted results.",
      fieldId,
      suggestion: "Be specific: include the industry, geography, timeframe, and exact topic of interest.",
    });
  }

  return checks;
}

// ── Public API ───────────────────────────────────────────────────────

export function runGroupChecks(
  group: ScenarioGroup,
  fieldId: string,
  text: string
): QualityCheck[] {
  switch (group) {
    case "A": return runGroupAChecks(fieldId, text);
    case "B": return runGroupBChecks(fieldId, text);
    case "C": return runGroupCChecks(fieldId, text);
    case "D": return runGroupDChecks(fieldId, text);
    case "E": return runGroupEChecks(fieldId, text);
    default: return [];
  }
}
