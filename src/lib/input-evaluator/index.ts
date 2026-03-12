/**
 * INPUT_EVALUATOR — Main orchestrator
 * Runs: universal checks → group checks → scenario checks → score calculation.
 * Pure client-side function — no API calls, no data persistence (GDPR-safe).
 */

import {
  EvaluationResult,
  BlockEvaluation,
  QualityCheck,
  OverallStatus,
  ConfidenceFlag,
} from "./types";
import { SCENARIO_EVAL_CONFIGS } from "./configs";
import { runUniversalChecks } from "./universal-checks";
import { runGroupChecks } from "./group-checks";
import { runScenarioChecks } from "./scenario-checks";

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function blockStatusFromChecks(checks: QualityCheck[]): "pass" | "warning" | "fail" {
  if (checks.some((c) => c.severity === "CRITICAL")) return "fail";
  if (checks.some((c) => c.severity === "WARNING")) return "warning";
  return "pass";
}

function calculateScore(blocks: BlockEvaluation[], allChecks: QualityCheck[]): number {
  if (blocks.length === 0) return 100;

  let score = 100;

  for (const check of allChecks) {
    switch (check.severity) {
      case "CRITICAL":
        score -= 15;
        break;
      case "WARNING":
        score -= 5;
        break;
      case "INFO":
        score -= 1;
        break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

function deriveStatus(score: number): OverallStatus {
  if (score >= 75) return "READY";
  if (score >= 40) return "IMPROVABLE";
  return "INSUFFICIENT";
}

function deriveConfidence(score: number, hasCritical: boolean): ConfidenceFlag {
  if (hasCritical || score < 50) return "LOW";
  return "HIGH";
}

function buildCoachingMessages(
  status: OverallStatus,
  blocks: BlockEvaluation[],
  financialImpact?: string
): string[] {
  const messages: string[] = [];

  if (status === "READY") {
    messages.push("Your input data is comprehensive. The analysis will produce high-confidence results.");
  } else if (status === "IMPROVABLE") {
    messages.push("Your data is adequate for analysis, but adding more detail will improve recommendation accuracy.");
    const warningBlocks = blocks.filter((b) => b.status === "warning");
    if (warningBlocks.length > 0) {
      messages.push(`Focus on improving: ${warningBlocks.map((b) => b.label).join(", ")}.`);
    }
  } else {
    messages.push("Key information is missing or appears to be placeholder content. Results may be unreliable.");
    const failBlocks = blocks.filter((b) => b.status === "fail");
    if (failBlocks.length > 0) {
      messages.push(`Critical issues in: ${failBlocks.map((b) => b.label).join(", ")}.`);
    }
  }

  if (financialImpact && status !== "READY") {
    messages.push(`⚠ ${financialImpact}`);
  }

  return messages;
}

/**
 * Evaluate the quality of input data for a given scenario.
 * Returns an EvaluationResult with score, status, per-block breakdown, and coaching messages.
 */
export function evaluateInputQuality(
  scenarioId: string,
  formData: Record<string, string>
): EvaluationResult {
  const config = SCENARIO_EVAL_CONFIGS[scenarioId];

  // If scenario has no config, return a neutral READY result
  if (!config) {
    return {
      scenarioId,
      overallStatus: "READY",
      score: 100,
      confidenceFlag: "HIGH",
      blocks: [],
      checks: [],
      gdprWarnings: [],
      coachingMessages: [],
    };
  }

  const allChecks: QualityCheck[] = [];
  const blocks: BlockEvaluation[] = [];

  // Build text map for boilerplate detection
  const allBlockTexts: Record<string, string> = {};
  for (const block of config.blocks) {
    allBlockTexts[block.fieldId] = formData[block.fieldId] || "";
  }

  // ── Pass 1: Universal + Group checks per block ──
  for (const block of config.blocks) {
    const text = formData[block.fieldId] || "";
    const blockChecks: QualityCheck[] = [];

    // Universal checks
    const universalResults = runUniversalChecks(text, block.fieldId, block, allBlockTexts);
    blockChecks.push(...universalResults);

    // Group checks (only on non-empty blocks)
    if (text.trim()) {
      const groupResults = runGroupChecks(config.group, block.fieldId, text);
      blockChecks.push(...groupResults);
    }

    // Expected keyword check (from block config)
    if (block.expectedKeywords && block.expectedKeywords.length > 0 && text.trim()) {
      const lower = text.toLowerCase();
      const found = block.expectedKeywords.filter((kw) => lower.includes(kw.toLowerCase()));
      const ratio = found.length / block.expectedKeywords.length;
      if (ratio < 0.3) {
        blockChecks.push({
          id: `BLOCK_KEYWORDS_${block.fieldId}`,
          severity: "INFO",
          message: `This field is missing expected content. Consider including: ${block.expectedKeywords.filter((kw) => !lower.includes(kw.toLowerCase())).join(", ")}.`,
          fieldId: block.fieldId,
          suggestion: "Use the placeholder text as a guide for what information to include.",
        });
      }
    }

    allChecks.push(...blockChecks);

    blocks.push({
      fieldId: block.fieldId,
      label: block.label,
      wordCount: wordCount(text),
      checks: blockChecks,
      status: blockStatusFromChecks(blockChecks),
    });
  }

  // ── Pass 2: Scenario-specific checks ──
  const scenarioResults = runScenarioChecks(scenarioId, formData);
  allChecks.push(...scenarioResults);

  // Assign scenario checks to relevant blocks
  for (const check of scenarioResults) {
    if (check.fieldId) {
      const block = blocks.find((b) => b.fieldId === check.fieldId);
      if (block) {
        block.checks.push(check);
        block.status = blockStatusFromChecks(block.checks);
      }
    }
  }

  // ── Score calculation ──
  const score = calculateScore(blocks, allChecks);
  const hasCritical = allChecks.some((c) => c.severity === "CRITICAL");
  const overallStatus = deriveStatus(score);
  const confidenceFlag = deriveConfidence(score, hasCritical);

  // ── GDPR warnings ──
  const gdprWarnings = allChecks.filter(
    (c) => c.id.includes("PII") || c.id.includes("GDPR")
  );

  // ── Coaching messages ──
  const coachingMessages = buildCoachingMessages(
    overallStatus,
    blocks,
    config.financialImpactGap
  );

  return {
    scenarioId,
    overallStatus,
    score,
    confidenceFlag,
    blocks,
    checks: allChecks,
    financialImpactWarning: config.financialImpactGap,
    gdprWarnings,
    coachingMessages,
  };
}
