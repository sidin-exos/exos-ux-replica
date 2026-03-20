/**
 * EXOS Sentinel - Local Intelligence Layer
 * 
 * Privacy-preserving AI pipeline for procurement analysis.
 * Implements semantic anonymization, context grounding,
 * response validation, and secure de-anonymization.
 * 
 * Architecture:
 * 1. Semantic Anonymizer - Masks sensitive data
 * 2. Private Knowledge Grounding - Injects domain context
 * 3. Backend Orchestrator - Coordinates pipeline stages
 * 4. Cloud/Local Inference - AI analysis (external)
 * 5. Reasoning Integrity Validator - Checks for hallucinations
 * 6. Secure Context Restoration - De-anonymizes for display
 */

// Core types
export type {
  SensitiveEntity,
  AnonymizationResult,
  AnonymizationConfig,
  GroundingVector,
  GroundingContext,
  GroundingConfig,
  OrchestratorRequest,
  OrchestratorResponse,
  PipelineStageResult,
  PipelineStage,
  PipelineConfig,
  ValidationResult,
  ValidationIssue,
  GoldenCaseMatch,
  GoldenCase,
  DeAnonymizationResult,
  LocalModelConfig,
  LocalModelRequest,
  LocalModelResponse,
} from './types';

// Anonymizer exports
export {
  anonymize,
  containsSensitiveData,
  detectSensitiveEntities,
  DEFAULT_ANONYMIZATION_CONFIG,
} from './anonymizer';

// Grounding exports
export {
  buildGroundingContext,
  generateGroundedPrompt,
  getGroundingMetadata,
  DEFAULT_GROUNDING_CONFIG,
} from './grounding';

// Validator exports
export {
  validateResponse,
  getValidationSummary,
} from './validator';

// De-anonymizer exports
export {
  deanonymize,
  partialDeanonymize,
  formatWithHighlights,
  canFullyRestore,
  createRedactedVersion,
  generateAuditLog,
} from './deanonymizer';

// Orchestrator exports
export {
  preparePipelineRequest,
  completePipeline,
  getPipelineSummary,
  serializeContext,
  deserializeContext,
  DEFAULT_PIPELINE_CONFIG,
} from './orchestrator';

/**
 * Quick pipeline execution for simple use cases
 * Prepares the request and returns what's needed for the edge function
 */
export function prepareAnalysis(
  scenarioType: string,
  scenarioData: Record<string, string>,
  industrySlug: string | null,
  categorySlug: string | null,
  options?: {
    enableAnonymization?: boolean;
    enableValidation?: boolean;
  }
) {
  const request = {
    rawInput: '',
    scenarioType,
    scenarioData,
    industrySlug,
    categorySlug,
    config: {
      enableAnonymization: options?.enableAnonymization ?? true,
      enableValidation: options?.enableValidation ?? true,
    },
  };
  
  // Note: Industry and category data should be fetched separately
  // This is just the preparation phase
  return {
    request,
    // Caller should fetch industry/category and call preparePipelineRequest
  };
}
