/**
 * EXOS Sentinel Pipeline Types
 * 
 * Core type definitions for the Local Intelligence Layer
 * that handles anonymization, grounding, and validation.
 */

// ============================================
// 1. SEMANTIC ANONYMIZER TYPES
// ============================================

export interface SensitiveEntity {
  id: string;
  type: 'company' | 'person' | 'price' | 'contract' | 'location' | 'date' | 'percentage' | 'email' | 'phone' | 'iban' | 'credit_card' | 'tax_id' | 'custom';
  originalValue: string;
  maskedToken: string;
  context?: string; // surrounding context for better restoration
}

export interface AnonymizationResult {
  anonymizedText: string;
  entityMap: Map<string, SensitiveEntity>;
  metadata: {
    entitiesFound: number;
    processingTimeMs: number;
    confidence: number;
  };
}

export interface AnonymizationConfig {
  preserveStructure: boolean;
  maskingStrategy: 'generic' | 'semantic' | 'hash';
  entityTypes: SensitiveEntity['type'][];
  customPatterns?: RegExp[];
}

// ============================================
// 2. PRIVATE KNOWLEDGE GROUNDING TYPES
// ============================================

export interface GroundingVector {
  id: string;
  content: string;
  category: 'industry' | 'category' | 'historical' | 'benchmark';
  relevanceScore: number;
  metadata: Record<string, unknown>;
}

export interface GroundingContext {
  industryContext: string | null;
  categoryContext: string | null;
  historicalCases: GroundingVector[];
  benchmarks: GroundingVector[];
}

export interface GroundingConfig {
  maxVectors: number;
  minRelevanceScore: number;
  includeHistorical: boolean;
  includeBenchmarks: boolean;
}

// ============================================
// 3. ORCHESTRATOR TYPES
// ============================================

export interface OrchestratorRequest {
  rawInput: string;
  scenarioType: string;
  scenarioData: Record<string, string>;
  industrySlug: string | null;
  categorySlug: string | null;
  config?: Partial<PipelineConfig>;
}

export interface OrchestratorResponse {
  success: boolean;
  result: string;
  metadata: {
    pipelineStages: PipelineStageResult[];
    totalTimeMs: number;
    validationPassed: boolean;
    confidenceScore: number;
  };
  warnings?: string[];
  errors?: string[];
}

export interface PipelineStageResult {
  stage: PipelineStage;
  status: 'success' | 'warning' | 'error' | 'skipped';
  timeMs: number;
  details?: Record<string, unknown>;
}

export type PipelineStage = 
  | 'anonymization'
  | 'grounding'
  | 'cloud_inference'
  | 'validation'
  | 'deanonymization';

export interface PipelineConfig {
  enableAnonymization: boolean;
  enableGrounding: boolean;
  enableValidation: boolean;
  useLocalModel: boolean;
  localModelEndpoint?: string;
  cloudModel: string;
  validationThreshold: number;
}

// ============================================
// 4. VALIDATION TYPES
// ============================================

export interface ValidationResult {
  passed: boolean;
  confidenceScore: number;
  issues: ValidationIssue[];
  goldenCaseMatches: GoldenCaseMatch[];
}

export interface ValidationIssue {
  type: 'hallucination' | 'inconsistency' | 'missing_context' | 'unsafe_content';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  suggestion?: string;
}

export interface GoldenCaseMatch {
  caseId: string;
  similarity: number;
  expectedPattern: string;
  actualPattern: string;
  verdict: 'match' | 'partial' | 'mismatch';
}

export interface GoldenCase {
  id: string;
  scenarioType: string;
  inputPattern: string;
  expectedOutputPattern: string;
  constraints: string[];
  createdAt: string;
}

// ============================================
// 5. DE-ANONYMIZATION TYPES
// ============================================

export interface DeAnonymizationResult {
  restoredText: string;
  restorationMap: Map<string, string>;
  metadata: {
    entitiesRestored: number;
    processingTimeMs: number;
    unmappedTokens: string[];
  };
}

// ============================================
// LOCAL MODEL TYPES (for future Mistral integration)
// ============================================

export interface LocalModelConfig {
  endpoint: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface LocalModelRequest {
  prompt: string;
  context?: string;
  config?: Partial<LocalModelConfig>;
}

export interface LocalModelResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    modelName: string;
    processingTimeMs: number;
  };
}

// ============================================
// 7. SHADOW LOGGING TYPES
// ============================================

export interface ShadowLog {
  redundant_fields: string[];
  missing_context: string[];
  friction_score: number; // 1 (smooth) to 10 (painful)
  input_recommendation: string;
  scenario_type?: string;
  detected_input_format?: 'structured' | 'semi-structured' | 'raw_text' | 'mixed';
}

// ============================================
// 8. EXOS OUTPUT SCHEMA v1.0 — UNIVERSAL ENVELOPE
// ============================================

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type RAGStatus = 'RED' | 'AMBER' | 'GREEN';
export type SchemaVersion = '1.0' | '2.0';
export const SUPPORTED_SCHEMA_VERSIONS: readonly SchemaVersion[] = ['1.0', '2.0'];

export function validateSchemaVersion(envelope: { schema_version?: string } | null | undefined): boolean {
  if (!envelope?.schema_version) return false;
  return (SUPPORTED_SCHEMA_VERSIONS as readonly string[]).includes(envelope.schema_version);
}

export interface ConfidenceFlag {
  field: string;
  reason: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

export interface DataGap {
  field: string;
  impact: string;
  resolution: string;
}

export interface Recommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  financial_impact: string | null;
  next_scenario: string | null;
}

export interface ExportMetadata {
  generated_at: string;
  grounding_sources: string[];
  model_used: string;
  langsmith_trace_id: string | null;
}

export interface ExosOutput {
  schema_version: SchemaVersion;
  scenario_id: string;
  scenario_name: string;
  group: 'A' | 'B' | 'C' | 'D' | 'E';
  group_label: string;
  confidence_level: ConfidenceLevel;
  low_confidence_watermark: boolean;
  confidence_flags: ConfidenceFlag[];
  summary: string;
  executive_bullets: string[];
  data_gaps: DataGap[];
  recommendations: Recommendation[];
  gdpr_flags: string[];
  export_metadata: ExportMetadata;
  payload: Record<string, unknown>;
}

// ============================================
// 9. WAVE 1 DASHBOARD TYPES
// ============================================

/**
 * should-cost-gap (S2 + S21 + S4 secondary).
 * Renderer-only: consumes existing payload.scenario_specific.cost_decomposition[]
 * and payload.scenario_specific.negotiation_anchor — no schema bump.
 */
export interface ShouldCostGapData {
  components: Array<{
    name: string;
    currentPricePct: number;     // from estimated_pct
    benchmarkPct: number | null; // from benchmark_pct
    gapPct: number | null;       // from gap_pct (positive = headroom above benchmark)
    confidence: ConfidenceLevel;
  }>;
  negotiationAnchor: {
    currentPrice: number | null;
    shouldCostTarget: number | null;
    headroomPct: number | null;
    rationale: string | null;
  };
  supplierMarginPct: number | null;
  benchmarkMarginPct: number | null;
  currency: string;
}

/**
 * savings-realization-funnel (S4 + S22 + S24).
 * Backed by the new additive payload.scenario_specific.savings_classification
 * field on Group A. Backwards compatible: null = not present in historical runs.
 */
export interface SavingsClassification {
  baseline_verified: boolean;
  hard: {
    baseline_value: number | null;
    new_value: number | null;
    annual_volume: number | null;
    annualised_savings: number | null;
    pnl_impact: number | null;
  } | null;
  soft: {
    baseline_value: number | null;
    new_value: number | null;
    annualised_avoidance: number | null;
    justification: string | null;
  } | null;
  avoided: {
    inflation_index_applied: string | null;
    inflation_rate_pct: number | null;
    baseline_adjusted_value: number | null;
    protected_value: number | null;
  } | null;
  funnel: {
    identified: number | null;
    committed: number | null;
    realized: number | null;
  };
}

export type CFOAcceptance = 'GREEN' | 'AMBER' | 'RED';

export interface SavingsRealizationFunnelData {
  baselineVerified: boolean;
  cfoAcceptance: CFOAcceptance;
  funnel: Array<{
    stage: 'Baseline' | 'Identified' | 'Committed' | 'Realized';
    hard: number;
    soft: number;
    avoided: number;
  }>;
  hardAnnualised: number | null;
  softAnnualised: number | null;
  avoidedProtected: number | null;
  currency: string;
  lowConfidenceWatermark: boolean;
}

// ============================================
// 10. WAVE 2 DASHBOARD TYPES
// ============================================

/**
 * working-capital-dpo (S4 + S5 + S6 + S22).
 * Lives at payload.financial_model.working_capital — base Group A dimension.
 */
export interface WorkingCapitalData {
  current_weighted_dpo: number | null;
  target_weighted_dpo: number | null;
  working_capital_delta_eur: number | null;
  annual_spend_eur: number | null;
  terms_distribution: Array<{
    term_label: string;
    spend_share_pct: number;
    supplier_count: number | null;
  }>;
  by_supplier: Array<{
    supplier_label: string;
    category: string | null;
    payment_terms_days: number;
    annual_spend: number | null;
    late_payment_directive_risk: boolean;
  }>;
  early_payment_discount_opportunities: Array<{
    supplier_label: string;
    discount_structure: string;
    annualised_value: number | null;
  }>;
  currency: string;
}

/**
 * supplier-concentration-map (S20 + S24 + S25 + S27).
 * Lives at payload.scenario_specific.concentration on Group D.
 */
export type HhiInterpretation = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

export interface ConcentrationData {
  categories: Array<{
    category_id: string;
    category_name: string;
    hhi: number | null;
    hhi_interpretation: HhiInterpretation | null;
    annual_spend: number | null;
  }>;
  flows: Array<{
    source: string;
    target: string;
    value: number;
    tier: 1 | 2;
    single_source_flag: boolean;
  }>;
  suppliers: Array<{
    supplier_label: string;
    geography: string | null;
    total_spend: number;
    category_count: number;
    exit_cost_estimate: number | null;
    exit_cost_rationale: string | null;
  }>;
  tier2_dependencies: Array<{
    tier1_supplier: string;
    tier2_supplier: string;
    dependency_description: string | null;
  }> | null;
  geographic_concentration: Array<{
    country_code: string;
    spend_share_pct: number;
  }>;
  currency: string;
}

/** Helper for HHI interpretation per the documented thresholds. */
export const interpretHhi = (hhi: number | null | undefined): HhiInterpretation | null => {
  if (hhi == null || !Number.isFinite(hhi)) return null;
  if (hhi < 1500) return 'LOW';
  if (hhi < 2500) return 'MODERATE';
  if (hhi <= 5000) return 'HIGH';
  return 'EXTREME';
};
