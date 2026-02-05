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
  type: 'company' | 'person' | 'price' | 'contract' | 'location' | 'date' | 'percentage' | 'email' | 'phone' | 'custom';
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
