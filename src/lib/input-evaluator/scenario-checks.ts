/**
 * INPUT_EVALUATOR — Scenario-specific checks
 * Type 1H critical overrides and per-scenario keyword/pattern checks.
 */

import { QualityCheck } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────

function hasKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function countKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
}

function hasNumericValue(text: string): boolean {
  return /\d+/.test(text);
}

function hasListItems(text: string, minItems: number): boolean {
  const lines = text.split(/\n/).filter((l) => /^\s*[•\-\*\d+\.]\s/.test(l));
  if (lines.length >= minItems) return true;
  // Also check pipe-separated
  const pipeLines = text.split(/\n/).filter((l) => (l.match(/\|/g) || []).length >= 2);
  return pipeLines.length >= minItems;
}

// ── TYPE 1H CRITICAL CHECKS ─────────────────────────────────────────
// S3 (capex-vs-opex), S14 (supplier-review), S23 (make-vs-buy), S29 (market-research)

export function checkS3Critical(formData: Record<string, string>): QualityCheck[] {
  const checks: QualityCheck[] = [];
  const financials = formData["financialContext"] || "";
  const asset = formData["assetFinancials"] || "";

  if (!hasKeyword(financials, ["wacc", "hurdle rate", "discount rate"])) {
    checks.push({
      id: "S3_WACC_MISSING",
      severity: "CRITICAL",
      message: "No WACC or discount rate provided. NPV comparison will be unreliable without this.",
      fieldId: "financialContext",
      suggestion: "Add your WACC or internal hurdle rate (%). A 5% miscalculation on €500k over 5 years = €25k+ misallocated capital.",
    });
  }

  if (!hasKeyword(financials, ["tax rate", "corporate tax", "tax"])) {
    checks.push({
      id: "S3_TAX_MISSING",
      severity: "CRITICAL",
      message: "No corporate tax rate specified. Tax treatment significantly affects lease vs. buy calculations.",
      fieldId: "financialContext",
      suggestion: "Include your corporate tax rate (%) for accurate IFRS 16 and depreciation modelling.",
    });
  }

  if (!hasKeyword(asset, ["lifespan", "lifecycle", "years", "year", "duration"])) {
    checks.push({
      id: "S3_LIFECYCLE_MISSING",
      severity: "CRITICAL",
      message: "No asset lifecycle duration specified. TCO cannot be calculated without a time horizon.",
      fieldId: "assetFinancials",
      suggestion: "Specify the financial lifespan in years (e.g. '5 years' or '7-year lifecycle').",
    });
  }

  return checks;
}

export function checkS14Critical(formData: Record<string, string>): QualityCheck[] {
  const checks: QualityCheck[] = [];
  const metrics = formData["performanceMetrics"] || "";

  if (!hasNumericValue(metrics)) {
    checks.push({
      id: "S14_KPI_NUMERIC",
      severity: "CRITICAL",
      message: "No numeric KPI values provided. Supplier scorecard requires quantified metrics.",
      fieldId: "performanceMetrics",
      suggestion: "Add specific numbers: on-time delivery %, quality reject rate %, invoice accuracy %, satisfaction score (1-5).",
    });
  }

  if (!hasKeyword(metrics, ["satisfaction", "score", "rating", "1-5", "out of"])) {
    checks.push({
      id: "S14_SATISFACTION_MISSING",
      severity: "CRITICAL",
      message: "No stakeholder satisfaction rating detected. Quantitative scores without qualitative context are strategically limited.",
      fieldId: "performanceMetrics",
      suggestion: "Include an overall stakeholder satisfaction score (e.g. '3.5 out of 5').",
    });
  }

  return checks;
}

export function checkS23Critical(formData: Record<string, string>): QualityCheck[] {
  const checks: QualityCheck[] = [];
  const makeCosts = formData["makeCosts"] || "";
  const buyCosts = formData["buyCosts"] || "";

  if (!hasKeyword(makeCosts, ["€", "$", "£", "cost", "annual", "total"])) {
    checks.push({
      id: "S23_MAKE_COST_MISSING",
      severity: "CRITICAL",
      message: "No internal cost figures provided. Make vs. Buy analysis requires fully-loaded internal costs.",
      fieldId: "makeCosts",
      suggestion: "Include total internal annual cost (€) covering: direct labour + materials + overhead + management time.",
    });
  }

  if (!hasKeyword(buyCosts, ["€", "$", "£", "quote", "rate", "price"])) {
    checks.push({
      id: "S23_BUY_COST_MISSING",
      severity: "CRITICAL",
      message: "No external vendor quote provided. Cannot compare options without external pricing.",
      fieldId: "buyCosts",
      suggestion: "Include the external vendor quote or market rate (€ per year or per unit).",
    });
  }

  if (!hasKeyword(makeCosts, ["overhead", "management", "indirect", "fully loaded", "fully-loaded"])) {
    checks.push({
      id: "S23_OVERHEAD_MISSING",
      severity: "WARNING",
      message: "Overhead costs not explicitly mentioned. Internal costs are typically underestimated by 30-50% when overhead is excluded.",
      fieldId: "makeCosts",
      suggestion: "Include overhead allocation, management time, and indirect costs for accurate comparison.",
    });
  }

  return checks;
}

export function checkS29Critical(formData: Record<string, string>): QualityCheck[] {
  const checks: QualityCheck[] = [];
  // S29 = market-research
  const query = formData["researchQuery"] || formData["industryContext"] || "";

  if (query.trim().split(/\s+/).length < 15) {
    checks.push({
      id: "S29_QUERY_DEPTH",
      severity: "WARNING",
      message: "Research query is too brief. Detailed queries produce significantly more targeted intelligence.",
      fieldId: "researchQuery",
      suggestion: "Include specific industry, geography, company types, and the exact question you need answered.",
    });
  }

  return checks;
}

// ── GENERAL SCENARIO CHECKS ─────────────────────────────────────────

export function checkKeywordPresence(
  text: string,
  fieldId: string,
  keywords: string[],
  minCount: number,
  checkId: string,
  message: string,
  suggestion: string,
  severity: "CRITICAL" | "WARNING" | "INFO" = "WARNING"
): QualityCheck | null {
  if (!text.trim()) return null;
  const found = countKeywords(text, keywords);
  if (found < minCount) {
    return { id: checkId, severity, message, fieldId, suggestion };
  }
  return null;
}

export function checkListPresence(
  text: string,
  fieldId: string,
  minItems: number,
  checkId: string,
  message: string,
  suggestion: string
): QualityCheck | null {
  if (!text.trim()) return null;
  if (!hasListItems(text, minItems)) {
    return { id: checkId, severity: "INFO", message, fieldId, suggestion };
  }
  return null;
}

// ── Run scenario-specific checks ─────────────────────────────────────

export function runScenarioChecks(
  scenarioId: string,
  formData: Record<string, string>
): QualityCheck[] {
  const checks: QualityCheck[] = [];

  // Type 1H critical scenarios
  switch (scenarioId) {
    case "capex-vs-opex":
      checks.push(...checkS3Critical(formData));
      break;
    case "supplier-review":
      checks.push(...checkS14Critical(formData));
      break;
    case "make-vs-buy":
      checks.push(...checkS23Critical(formData));
      break;
    case "market-research":
      checks.push(...checkS29Critical(formData));
      break;
  }

  // Scenario-specific keyword checks for key scenarios
  const industryContext = formData["industryContext"] || "";

  // All scenarios: check that industryContext mentions an actual industry
  const industryKeywords = [
    "manufacturing", "retail", "healthcare", "financial", "technology", "automotive",
    "pharmaceutical", "energy", "construction", "logistics", "food", "aerospace",
    "defense", "telecoms", "mining", "chemical", "agriculture", "public sector",
    "government", "education", "hospitality", "insurance", "banking", "oil", "gas",
  ];
  const industryCheck = checkKeywordPresence(
    industryContext, "industryContext", industryKeywords, 1,
    "SCENARIO_INDUSTRY_MISSING",
    "No specific industry mentioned in business context. Industry-specific recommendations require industry identification.",
    "Name your industry: manufacturing, healthcare, financial services, retail, etc."
  );
  if (industryCheck) checks.push(industryCheck);

  // S5 (spend-analysis): check for tabular data
  if (scenarioId === "spend-analysis-categorization") {
    const spendData = formData["rawSpendData"] || "";
    if (spendData.trim() && !hasListItems(spendData, 3)) {
      checks.push({
        id: "S5_TABULAR_MISSING",
        severity: "WARNING",
        message: "Spend data should be structured (table format with columns). Unstructured text reduces classification accuracy below 60%.",
        fieldId: "rawSpendData",
        suggestion: "Use pipe-separated or bullet-point format: Supplier | Description | Amount | Date",
      });
    }
  }

  // S7 (saas-optimization): check for tool listing
  if (scenarioId === "saas-optimization") {
    const subs = formData["subscriptionDetails"] || "";
    if (subs.trim() && !hasListItems(subs, 2)) {
      checks.push({
        id: "S7_TOOL_LIST_MISSING",
        severity: "WARNING",
        message: "SaaS portfolio should list individual tools. A paragraph description reduces optimisation accuracy.",
        fieldId: "subscriptionDetails",
        suggestion: "List each tool on a line: Tool Name | Licences | Active | Annual Cost | Renewal Date",
      });
    }
  }

  // S16 (sow-critic): check document completeness
  if (scenarioId === "sow-critic") {
    const sow = formData["sowText"] || "";
    if (sow.trim().split(/\s+/).length < 100) {
      checks.push({
        id: "S16_DOCUMENT_SHORT",
        severity: "WARNING",
        message: "SOW text appears very short. Partial SOW submissions produce partial reviews.",
        fieldId: "sowText",
        suggestion: "Paste the complete SOW including schedules and appendices, or upload the full document.",
      });
    }
  }

  // S24 (volume-consolidation): check supplier count
  if (scenarioId === "volume-consolidation") {
    const scope = formData["consolidationScope"] || "";
    const lineCount = scope.split(/\n/).filter((l) => l.trim().length > 5).length;
    if (scope.trim() && lineCount < 3) {
      checks.push({
        id: "S24_SUPPLIER_COUNT",
        severity: "WARNING",
        message: "Fewer than 3 suppliers listed. Volume consolidation modelling requires minimum 3 suppliers.",
        fieldId: "consolidationScope",
        suggestion: "List at least 3 suppliers with spend, percentage, geography, and contract expiry.",
      });
    }
  }

  return checks;
}
