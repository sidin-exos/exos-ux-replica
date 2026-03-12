/**
 * INPUT_EVALUATOR — Type definitions
 * Quality-aware input validation for EXOS procurement scenarios.
 */

export type Severity = "CRITICAL" | "WARNING" | "INFO";
export type OverallStatus = "READY" | "IMPROVABLE" | "INSUFFICIENT";
export type ConfidenceFlag = "HIGH" | "LOW";

export type ScenarioGroup = "A" | "B" | "C" | "D" | "E";
export type DeviationType = 0 | 1 | "1H" | 2;

export interface QualityCheck {
  id: string;
  severity: Severity;
  message: string;
  fieldId?: string; // which block triggered it
  suggestion?: string; // coaching text
}

export interface BlockEvaluation {
  fieldId: string;
  label: string;
  wordCount: number;
  checks: QualityCheck[];
  /** Worst severity across all checks for this block */
  status: "pass" | "warning" | "fail";
}

export interface EvaluationResult {
  scenarioId: string;
  overallStatus: OverallStatus;
  /** 0–100 composite score */
  score: number;
  confidenceFlag: ConfidenceFlag;
  blocks: BlockEvaluation[];
  checks: QualityCheck[];
  financialImpactWarning?: string;
  gdprWarnings: QualityCheck[];
  coachingMessages: string[];
}

export interface BlockConfig {
  fieldId: string;
  label: string;
  minWords: number;
  expectedDataType?: "numeric" | "narrative" | "tabular" | "mixed";
  required: boolean;
  subPrompts?: string[];
  /** Keywords that should appear in this block for scenario relevance */
  expectedKeywords?: string[];
}

export interface ScenarioCheckDefinition {
  id: string;
  severity: Severity;
  /** Function name reference in scenario-checks.ts */
  check: string;
  message: string;
  suggestion?: string;
  fieldId?: string;
}

export interface ScenarioEvalConfig {
  scenarioId: string;
  group: ScenarioGroup;
  deviationType: DeviationType;
  blocks: BlockConfig[];
  scenarioChecks: ScenarioCheckDefinition[];
  financialImpactGap?: string;
  commonFailureMode?: string;
  gdprGuardrail?: string;
  enhancedInputItems?: string[];
}
