/**
 * EXOS Automated Testing Pipeline Types
 *
 * Strict contracts for the 3-phase pipeline:
 *   Phase 1 – Synthesis (test prompt generation)
 *   Phase 2 – Execution (sentinel-analysis runs)
 *   Phase 3 – Evaluation (LLM-as-a-Judge verdicts)
 */

// ============================================
// PRIMITIVES
// ============================================

/** Entropy level controlling input messiness: L1 (80% structured) → L3 (90% raw dump) */
export type EntropyLevel = 1 | 2 | 3;

/** Buyer persona archetypes used by the Synthesis Engine */
export type BuyerPersona =
  | 'rushed-junior'
  | 'methodical-manager'
  | 'cfo-finance'
  | 'frustrated-stakeholder';

/** Field-level verdict produced by the AI Judge */
export type FieldAction =
  | 'REDUNDANT_HIDE'
  | 'OPTIONAL_KEEP'
  | 'CRITICAL_REQUIRE'
  | 'SCHEMA_GAP_DETECTED';

// ============================================
// PHASE 1 – SYNTHESIS
// ============================================

/** Maps to a row in the `test_prompts` table */
export interface TestPromptRecord {
  id: string;
  scenario_type: string;
  buyer_persona: BuyerPersona;
  entropy_level: EntropyLevel;
  payload: {
    structured_data: Record<string, unknown>;
    raw_text: string;
  };
  industry_slug: string | null;
  category_slug: string | null;
  created_at: string;
}

// ============================================
// PHASE 2 – EXECUTION
// ============================================

/** Maps to a row in the `test_reports` table */
export interface ExecutionReport {
  id: string;
  prompt_id: string;
  model: string;
  status: 'SUCCESS' | 'PIPELINE_FAILURE';
  processing_time_ms: number | null;
  extracted_json: Record<string, unknown>;
  token_usage: Record<string, unknown> | null;
  error_message: string | null;
  shadow_log: Record<string, unknown> | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  created_at: string;
}

// ============================================
// PHASE 3 – EVALUATION
// ============================================

/** Individual field verdict with triangulation data */
export interface FieldEvaluation {
  field_name: string;
  action: FieldAction;
  /** 0-1 confidence score */
  confidence: number;
  reasoning: string;
  /** Triangulation: which sources contained this field's data */
  source_match: {
    user_input: boolean;
    server_context: boolean;
    ai_output: boolean;
  };
}

/** Recommendation for a field not present in the current schema */
export interface SchemaGap {
  suggested_field: string;
  reason: string;
  /** How often this gap was detected across prompts */
  frequency: number;
  persona_source: BuyerPersona;
}

/** Full output from the AI Judge for a single prompt */
export interface EvaluationVerdict {
  prompt_id: string;
  /** 0-1 aggregate triangulation score */
  triangulation_score: number;
  field_evaluations: FieldEvaluation[];
  schema_gaps: SchemaGap[];
  overall_recommendation: string;
  model_used: string;
  evaluated_at: string;
}

// ============================================
// PIPELINE-LEVEL AGGREGATION
// ============================================

/** Summary of a complete pipeline run across all prompts */
export interface PipelineRunSummary {
  run_id: string;
  entropy_level: EntropyLevel;
  total_prompts: number;
  total_reports: number;
  /** 0-1 ratio of SUCCESS reports */
  success_rate: number;
  avg_processing_time_ms: number;
  verdict_distribution: Record<FieldAction, number>;
  schema_gaps: SchemaGap[];
  created_at: string;
}

// ============================================
// GEA – GROUP-EVOLVING AGENTS
// ============================================

/** Directive generated from past failures to steer future test synthesis */
export interface EvolutionaryDirective {
  id: string;
  target_scenario: string;
  directive_text: string;
  /** Projected improvement in inference accuracy (0-1) */
  confidence_gain_projected: number;
  source_field_action: FieldAction;
  generated_at: string;
}

/** Aggregated view of the Shared Experience Pool */
export interface ExperiencePoolSummary {
  /** Most frequent failure patterns across test runs */
  top_failure_patterns: string[];
  /** Number of previously-failing cases now passing */
  solved_cases: number;
  /** Total test runs contributing to this pool */
  total_runs: number;
  /** 0-1 overall inference accuracy (SWE-bench-like) */
  inference_accuracy: number;
  /** Accuracy trend per batch: [batch_index, accuracy] */
  accuracy_trend: Array<{ batch: number; accuracy: number }>;
}
