# EXOS Project Context - Critical AI Infrastructure Files

> **Generated:** 2026-02-06  
> **Purpose:** Concatenated source files for LangSmith integration and AI pipeline development

---

## Table of Contents

1. [AI Pipeline Core](#ai-pipeline-core)
   - `src/lib/ai/graph.ts` - EXOS Decision Workflow Orchestrator
   - `src/lib/ai/langsmith-client.ts` - Browser-compatible LangSmith REST Client
   - `src/lib/ai/trace-utils.ts` - Tracing Utilities
2. [Type Definitions](#type-definitions)
   - `src/lib/sentinel/types.ts` - Complete Sentinel Pipeline Types
3. [UI Components](#ui-components)
   - `src/components/analysis/DeepAnalysisPipeline.tsx` - Pipeline Visualization
   - `src/components/analysis/DeepAnalysisResult.tsx` - Analysis Result Display
   - `src/components/scenarios/GenericScenarioWizard.tsx` - Full Scenario Wizard
4. [Edge Functions](#edge-functions)
   - `supabase/functions/sentinel-analysis/index.ts` - Main AI Inference Endpoint
   - `supabase/functions/generate-market-insights/index.ts` - Market Intelligence Generation

---

## AI Pipeline Core

### `src/lib/ai/graph.ts`

```typescript
/**
 * EXOS Decision Workflow - Lightweight Orchestrator
 * 
 * Replaces LangGraph with a simple async pipeline that:
 * - Uses existing sentinel utilities (anonymizer, validator, deanonymizer)
 * - Routes AI inference through the sentinel-analysis edge function
 * - Implements self-correction loop for validation failures
 * - Supports both Lovable Gateway and Google AI Studio (BYOK)
 * - Sends traces to LangSmith via REST API (browser-compatible)
 */

import { anonymize, DEFAULT_ANONYMIZATION_CONFIG } from '../sentinel/anonymizer';
import { deanonymize } from '../sentinel/deanonymizer';
import { validateResponse } from '../sentinel/validator';
import type { SensitiveEntity } from '../sentinel/types';
import { supabase } from '@/integrations/supabase/client';
import { 
  isTracingEnabled, 
  logTracingConfig 
} from './langsmith-client';
import { 
  traceStep, 
  startPipelineTrace, 
  endPipelineTrace 
} from './trace-utils';

/**
 * Model configuration type for provider selection
 */
export type ModelConfigType = {
  provider: 'lovable' | 'google_ai_studio';
  model: string;
};

/**
 * Pipeline state during execution
 */
interface PipelineState {
  userQuery: string;
  config: ModelConfigType;
  anonymizedQuery: string;
  entityMap: Map<string, SensitiveEntity>;
  aiResponse: string;
  finalAnswer: string;
  confidenceScore: number;
  validationStatus: 'pending' | 'approved' | 'rejected';
  retryCount: number;
}

/**
 * System prompt for EXOS procurement analysis
 */
const EXOS_SYSTEM_PROMPT = `You are EXOS, an expert procurement analyst AI. Your role is to analyze procurement scenarios with precision and provide actionable recommendations.

Guidelines:
- Provide structured analysis with clear sections
- Include quantitative insights where possible
- Suggest negotiation strategies based on the context
- Identify risks and mitigation approaches
- Be concise but comprehensive

Format your response with markdown headers for clarity.`;

const MAX_RETRIES = 3;

/**
 * Step 1: Anonymize sensitive data
 */
function stepAnonymize(state: PipelineState): PipelineState {
  console.log('🛡️ Pipeline: Anonymizing sensitive data...');
  
  const result = anonymize(state.userQuery, DEFAULT_ANONYMIZATION_CONFIG);
  
  return {
    ...state,
    anonymizedQuery: result.anonymizedText,
    entityMap: result.entityMap,
    confidenceScore: result.metadata.confidence,
  };
}

/**
 * Step 2: AI Reasoning via Edge Function
 */
async function stepReasoning(state: PipelineState): Promise<PipelineState> {
  const { provider, model } = state.config;
  const useGoogleAIStudio = provider === 'google_ai_studio';

  console.log(`🧠 Pipeline: AI Reasoning (provider: ${provider}, model: ${model})`);

  const { data, error } = await supabase.functions.invoke('sentinel-analysis', {
    body: {
      systemPrompt: EXOS_SYSTEM_PROMPT,
      userPrompt: state.anonymizedQuery,
      model: useGoogleAIStudio ? undefined : model,
      useGoogleAIStudio,
      googleModel: useGoogleAIStudio ? model : undefined,
      enableTestLogging: false,
    },
  });

  if (error) {
    console.error('🚨 Pipeline: Edge function error', error);
    throw new Error(error.message || 'AI inference failed');
  }

  if (data?.error) {
    console.error('🚨 Pipeline: AI response error', data.error);
    throw new Error(data.error);
  }

  const responseContent = data?.content || data?.result || '';

  if (!responseContent) {
    throw new Error('Empty response from AI');
  }

  console.log('✅ Pipeline: Received AI response');

  return {
    ...state,
    aiResponse: responseContent,
  };
}

/**
 * Step 3: Validate response for hallucinations
 */
function stepValidate(state: PipelineState): PipelineState {
  console.log('⚖️ Pipeline: Validating response...');

  const maskedTokens = Array.from(state.entityMap.keys());

  const validationResult = validateResponse(
    state.aiResponse,
    state.anonymizedQuery,
    'cost_breakdown',
    maskedTokens
  );

  const hasCriticalIssues = validationResult.issues.some(
    (issue) => issue.severity === 'critical'
  );

  if (hasCriticalIssues || !validationResult.passed) {
    console.log('⚠️ Pipeline: Validation failed, will retry');
    return {
      ...state,
      validationStatus: 'rejected',
      retryCount: state.retryCount + 1,
      confidenceScore: validationResult.confidenceScore,
    };
  }

  console.log('✅ Pipeline: Validation passed');
  return {
    ...state,
    validationStatus: 'approved',
    confidenceScore: validationResult.confidenceScore,
  };
}

/**
 * Step 4: Deanonymize the final response
 */
function stepDeanonymize(state: PipelineState): PipelineState {
  console.log('🔓 Pipeline: Deanonymizing response...');

  const result = deanonymize(state.aiResponse, state.entityMap);

  return {
    ...state,
    finalAnswer: result.restoredText,
  };
}

/**
 * Run the complete EXOS decision pipeline
 * 
 * @param userQuery - The user's input query
 * @param config - Model configuration (provider and model name)
 */
export async function runExosGraph(
  userQuery: string,
  config: ModelConfigType
): Promise<{
  finalAnswer: string;
  confidenceScore: number;
  validationStatus: 'pending' | 'approved' | 'rejected';
  retryCount: number;
}> {
  console.log(`🚀 Pipeline: Starting with config`, config);
  
  // Log tracing config on first run
  if (isTracingEnabled()) {
    logTracingConfig();
  }

  // Start parent trace for entire pipeline
  const parentRunId = await startPipelineTrace("EXOS_Deep_Analysis", {
    userQuery,
    config,
  });

  // Initialize state
  let state: PipelineState = {
    userQuery,
    config,
    anonymizedQuery: '',
    entityMap: new Map(),
    aiResponse: '',
    finalAnswer: '',
    confidenceScore: 0,
    validationStatus: 'pending',
    retryCount: 0,
  };

  try {
    // Step 1: Anonymize (traced)
    const anonymizeResult = await traceStep(
      "Sentinel_Anonymize",
      "chain",
      { query: userQuery },
      () => stepAnonymize(state),
      parentRunId
    );
    state = anonymizeResult.result;

    // Retry loop for reasoning + validation
    while (state.retryCount <= MAX_RETRIES) {
      // Step 2: AI Reasoning (traced)
      const reasoningResult = await traceStep(
        "AI_Reasoning",
        "llm",
        { 
          anonymizedQuery: state.anonymizedQuery,
          attempt: state.retryCount + 1,
          model: config.model,
        },
        () => stepReasoning(state),
        parentRunId
      );
      state = reasoningResult.result;

      // Step 3: Validate (traced)
      const validateResult = await traceStep(
        "Validation_Check",
        "chain",
        { 
          responseLength: state.aiResponse.length,
          attempt: state.retryCount + 1,
        },
        () => stepValidate(state),
        parentRunId
      );
      state = validateResult.result;

      if (state.validationStatus === 'approved') {
        break;
      }

      if (state.retryCount >= MAX_RETRIES) {
        console.log('⚠️ Pipeline: Max retries reached, proceeding with best effort');
        break;
      }

      console.log(`🔄 Pipeline: Retry ${state.retryCount}/${MAX_RETRIES}`);
    }

    // Step 4: Deanonymize (traced)
    const deanonymizeResult = await traceStep(
      "Deanonymize",
      "chain",
      { responseLength: state.aiResponse.length },
      () => stepDeanonymize(state),
      parentRunId
    );
    state = deanonymizeResult.result;

    console.log(`🏁 Pipeline: Complete (status: ${state.validationStatus}, retries: ${state.retryCount})`);

    // End parent trace with success
    await endPipelineTrace(parentRunId, {
      validationStatus: state.validationStatus,
      confidenceScore: state.confidenceScore,
      retryCount: state.retryCount,
    });

    return {
      finalAnswer: state.finalAnswer,
      confidenceScore: state.confidenceScore,
      validationStatus: state.validationStatus,
      retryCount: state.retryCount,
    };
  } catch (error) {
    // End parent trace with error
    await endPipelineTrace(
      parentRunId,
      { error: true },
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}
```

---

### `src/lib/ai/langsmith-client.ts`

```typescript
/**
 * Browser-compatible LangSmith REST Client
 * 
 * Uses native fetch() with exponential backoff retry logic.
 * Enterprise-grade resilience with strict TypeScript typing.
 * No external dependencies - avoids AsyncLocalStorage issues.
 */

// ============================================================================
// Configuration
// ============================================================================

const TRACING_ENABLED = import.meta.env.VITE_LANGCHAIN_TRACING_V2 === "true";
const API_KEY = import.meta.env.VITE_LANGCHAIN_API_KEY || "";
const PROJECT = import.meta.env.VITE_LANGCHAIN_PROJECT || "default";
const ENDPOINT = import.meta.env.VITE_LANGCHAIN_ENDPOINT || "https://api.smith.langchain.com";

// ============================================================================
// Type Definitions
// ============================================================================

/** LangSmith API run types */
type RunType = "chain" | "llm" | "tool" | "retriever" | "embedding" | "parser";

/** Payload for POST /runs */
interface CreateRunPayload {
  id: string;
  name: string;
  run_type: RunType;
  inputs: Record<string, unknown>;
  start_time: string;
  session_name: string;
  parent_run_id?: string;
  tags?: string[];
  extra?: {
    metadata?: Record<string, unknown>;
  };
}

/** Payload for PATCH /runs/{id} */
interface UpdateRunPayload {
  outputs?: Record<string, unknown>;
  error?: string;
  end_time: string;
}

/** Retry configuration */
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  backoffFactor: number;
}

/** Public options for creating a run */
export interface CreateRunOptions {
  name: string;
  run_type: RunType;
  inputs: Record<string, unknown>;
  parent_run_id?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/** Public options for patching a run */
export interface PatchRunOptions {
  outputs?: Record<string, unknown>;
  error?: string;
  end_time?: string;
}

// ============================================================================
// Retry Configuration & Utilities
// ============================================================================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 100,
  backoffFactor: 2,
};

/**
 * Promise-based sleep using native setTimeout
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if HTTP status code is retryable
 * Retries on 429 (rate limit) and 5xx (server errors)
 */
const isRetryableStatus = (status: number): boolean =>
  status === 429 || (status >= 500 && status < 600);

/**
 * Fetch with exponential backoff retry logic
 * 
 * @param url - Request URL
 * @param options - Fetch options
 * @param config - Retry configuration
 * @returns Response object
 * @throws Error if all retries exhausted
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      if (!isRetryableStatus(response.status)) {
        // Non-retryable client error (4xx except 429)
        return response;
      }

      // Retryable error - calculate delay and wait
      if (attempt < config.maxRetries - 1) {
        const delay = config.baseDelayMs * Math.pow(config.backoffFactor, attempt);
        console.warn(
          `🔍 LangSmith: HTTP ${response.status}, retry ${attempt + 1}/${config.maxRetries} in ${delay}ms`
        );
        await sleep(delay);
      }
    } catch (err) {
      // Network error
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < config.maxRetries - 1) {
        const delay = config.baseDelayMs * Math.pow(config.backoffFactor, attempt);
        console.warn(
          `🔍 LangSmith: Network error, retry ${attempt + 1}/${config.maxRetries} in ${delay}ms`
        );
        await sleep(delay);
      }
    }
  }

  // All retries exhausted
  throw lastError ?? new Error("LangSmith: All retries exhausted");
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if LangSmith tracing is enabled
 */
export function isTracingEnabled(): boolean {
  return TRACING_ENABLED && !!API_KEY;
}

/**
 * Get the configured project name
 */
export function getProjectName(): string {
  return PROJECT;
}

/**
 * Log the current tracing configuration (for debugging)
 */
export function logTracingConfig(): void {
  console.log("🔍 LangSmith Tracing Config:", {
    enabled: TRACING_ENABLED,
    project: PROJECT,
    endpoint: ENDPOINT,
    hasApiKey: !!API_KEY,
  });
}

/**
 * Create a new run (span) in LangSmith
 * 
 * Fire-and-forget with retry logic - never blocks the pipeline.
 * 
 * @param options - Run configuration
 * @returns The generated run ID (returned immediately, before network call completes)
 */
export async function createRun(options: CreateRunOptions): Promise<string> {
  if (!isTracingEnabled()) {
    return "";
  }

  const runId = crypto.randomUUID();
  const startTime = new Date().toISOString();

  const payload: CreateRunPayload = {
    id: runId,
    name: options.name,
    run_type: options.run_type,
    inputs: options.inputs,
    start_time: startTime,
    session_name: PROJECT,
    parent_run_id: options.parent_run_id,
    tags: options.tags,
    extra: options.metadata ? { metadata: options.metadata } : undefined,
  };

  // Fire-and-forget with retry logic - never blocks pipeline
  fetchWithRetry(`${ENDPOINT}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.warn("🔍 LangSmith: Failed to create run after retries", options.name, err);
  });

  return runId;
}

/**
 * Complete a run with outputs or error
 * 
 * Fire-and-forget with retry logic - never blocks the pipeline.
 * 
 * @param runId - The run ID to patch
 * @param options - Outputs and/or error information
 */
export async function patchRun(runId: string, options: PatchRunOptions): Promise<void> {
  if (!isTracingEnabled() || !runId) {
    return;
  }

  const payload: UpdateRunPayload = {
    outputs: options.outputs,
    error: options.error,
    end_time: options.end_time || new Date().toISOString(),
  };

  // Fire-and-forget with retry logic - never blocks pipeline
  fetchWithRetry(`${ENDPOINT}/runs/${runId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.warn("🔍 LangSmith: Failed to patch run after retries", runId, err);
  });
}
```

---

### `src/lib/ai/trace-utils.ts`

```typescript
/**
 * Tracing Utilities for EXOS Pipeline
 * 
 * Provides helper functions to wrap step execution with LangSmith tracing.
 * Uses the langsmith-client for REST API communication.
 */

import { createRun, patchRun, isTracingEnabled } from "./langsmith-client";

export interface TraceStepResult<T> {
  result: T;
  runId: string;
}

/**
 * Wrap a step function with tracing instrumentation
 * 
 * Creates a run before execution and patches it with outputs after.
 * Tracing failures are caught and logged, never blocking the pipeline.
 * 
 * @param stepName - Display name for the trace span
 * @param runType - Type of run (chain, llm, tool)
 * @param inputs - Input data to log
 * @param stepFn - The actual step function to execute
 * @param parentRunId - Optional parent run ID for hierarchical traces
 */
export async function traceStep<T>(
  stepName: string,
  runType: "chain" | "llm" | "tool",
  inputs: Record<string, unknown>,
  stepFn: () => T | Promise<T>,
  parentRunId?: string
): Promise<TraceStepResult<T>> {
  let runId = "";

  try {
    // Create the run (fire-and-forget internally)
    if (isTracingEnabled()) {
      runId = await createRun({
        name: stepName,
        run_type: runType,
        inputs,
        parent_run_id: parentRunId,
      });
    }

    // Execute the actual step
    const result = await Promise.resolve(stepFn());

    // Patch with outputs (fire-and-forget internally)
    if (runId) {
      patchRun(runId, {
        outputs: { result: typeof result === "object" ? result : { value: result } },
      });
    }

    return { result, runId };
  } catch (error) {
    // Patch with error info
    if (runId) {
      patchRun(runId, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
  }
}

/**
 * Create a parent trace span for the entire pipeline
 * 
 * @param pipelineName - Name of the pipeline
 * @param inputs - Initial inputs
 * @returns The parent run ID
 */
export async function startPipelineTrace(
  pipelineName: string,
  inputs: Record<string, unknown>
): Promise<string> {
  if (!isTracingEnabled()) {
    return "";
  }

  return createRun({
    name: pipelineName,
    run_type: "chain",
    inputs,
    tags: ["exos", "pipeline"],
  });
}

/**
 * Complete the parent pipeline trace
 * 
 * @param runId - The parent run ID
 * @param outputs - Final outputs from the pipeline
 * @param error - Optional error if pipeline failed
 */
export async function endPipelineTrace(
  runId: string,
  outputs: Record<string, unknown>,
  error?: string
): Promise<void> {
  if (!runId) {
    return;
  }

  patchRun(runId, { outputs, error });
}
```

---

## Type Definitions

### `src/lib/sentinel/types.ts`

```typescript
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
```

---

## UI Components

### `src/components/analysis/DeepAnalysisPipeline.tsx`

```typescript
import { motion } from "framer-motion";
import { Shield, BrainCircuit, Scale, Unlock, Check, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DeepAnalysisPipelineProps {
  status: 'idle' | 'running' | 'completed' | 'error';
  currentStepIndex: number;
  errorMessage?: string;
}

const PIPELINE_STEPS = [
  {
    id: 'anonymize',
    icon: Shield,
    label: 'Sentinel Layer',
    description: 'Anonymizing sensitive entities',
  },
  {
    id: 'reasoning',
    icon: BrainCircuit,
    label: 'AI Reasoning',
    description: 'Generating strategic insights',
  },
  {
    id: 'validate',
    icon: Scale,
    label: 'Validation Loop',
    description: 'Checking for hallucinations',
  },
  {
    id: 'deanonymize',
    icon: Unlock,
    label: 'Deanonymization',
    description: 'Restoring real data context',
  },
];

export const DeepAnalysisPipeline = ({
  status,
  currentStepIndex,
  errorMessage,
}: DeepAnalysisPipelineProps) => {
  const progressPercentage = status === 'completed' 
    ? 100 
    : Math.min(((currentStepIndex + 1) / PIPELINE_STEPS.length) * 100, 95);

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="font-display text-xl font-semibold mb-2">
          Deep Analysis Pipeline
        </h3>
        <p className="text-sm text-muted-foreground">
          Multi-stage reasoning with validation
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {PIPELINE_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStepIndex || status === 'completed';
          const isActive = index === currentStepIndex && status === 'running';
          const isPending = index > currentStepIndex && status !== 'completed';
          const isError = status === 'error' && index === currentStepIndex;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border transition-all duration-300",
                isCompleted && "bg-green-500/10 border-green-500/30",
                isActive && "bg-primary/10 border-primary/50",
                isPending && "bg-muted/30 border-border opacity-50",
                isError && "bg-destructive/10 border-destructive/50"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  isCompleted && "bg-green-500/20 text-green-600",
                  isActive && "bg-primary/20 text-primary",
                  isPending && "bg-muted text-muted-foreground",
                  isError && "bg-destructive/20 text-destructive"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isError ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-medium text-sm",
                      isCompleted && "text-green-600",
                      isActive && "text-primary",
                      isPending && "text-muted-foreground",
                      isError && "text-destructive"
                    )}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-xs text-primary font-medium"
                    >
                      Processing...
                    </motion.span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>

              {/* Status indicator */}
              {isActive && (
                <motion.div
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Error Message */}
      {status === 'error' && errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-destructive/10 border border-destructive/30"
        >
          <p className="text-sm text-destructive">{errorMessage}</p>
        </motion.div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercentage} className="h-2" />
        <p className="text-xs text-center text-muted-foreground">
          {status === 'completed' 
            ? 'Analysis complete' 
            : `Step ${currentStepIndex + 1} of ${PIPELINE_STEPS.length}`}
        </p>
      </div>
    </div>
  );
};
```

---

### `src/components/analysis/DeepAnalysisResult.tsx`

```typescript
import { BrainCircuit, ArrowLeft, FileText, RotateCcw, CheckCircle2, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DeepAnalysisResultProps {
  result: {
    finalAnswer: string;
    confidenceScore: number;
    validationStatus: 'pending' | 'approved' | 'rejected';
    retryCount: number;
  };
  onStartOver: () => void;
  onGenerateReport: () => void;
}

export const DeepAnalysisResult = ({
  result,
  onStartOver,
  onGenerateReport,
}: DeepAnalysisResultProps) => {
  const { finalAnswer, confidenceScore, validationStatus, retryCount } = result;

  // Confidence color based on score
  const getConfidenceColor = (score: number) => {
    if (score >= 70) return "bg-green-500/20 text-green-600 border-green-500/30";
    if (score >= 50) return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
    return "bg-red-500/20 text-red-600 border-red-500/30";
  };

  // Validation status styling
  const getValidationStyle = (status: typeof validationStatus) => {
    switch (status) {
      case 'approved':
        return { className: "bg-green-500/20 text-green-600 border-green-500/30", icon: CheckCircle2 };
      case 'rejected':
        return { className: "bg-red-500/20 text-red-600 border-red-500/30", icon: XCircle };
      default:
        return { className: "bg-muted text-muted-foreground", icon: Info };
    }
  };

  const validationStyle = getValidationStyle(validationStatus);
  const ValidationIcon = validationStyle.icon;

  return (
    <div className="space-y-6">
      {/* Main Result Card with Gradient Border */}
      <div className="relative rounded-xl p-[2px] bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500">
        <div className="rounded-[10px] bg-card p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">
                Deep Reasoning Engine Output
              </h3>
              <p className="text-xs text-muted-foreground">
                Autonomous multi-step analysis with validation
              </p>
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap gap-2">
            {/* Confidence Score */}
            <Badge
              variant="outline"
              className={cn("gap-1.5", getConfidenceColor(confidenceScore))}
            >
              {Math.round(confidenceScore)}% Confidence
            </Badge>

            {/* Validation Status */}
            <Badge
              variant="outline"
              className={cn("gap-1.5", validationStyle.className)}
            >
              <ValidationIcon className="w-3 h-3" />
              {validationStatus === 'approved' ? 'Validated' : validationStatus === 'rejected' ? 'Rejected' : 'Pending'}
            </Badge>

            {/* Retry Count (only if > 0) */}
            {retryCount > 0 && (
              <Badge variant="outline" className="gap-1.5">
                <RotateCcw className="w-3 h-3" />
                {retryCount} {retryCount === 1 ? 'Retry' : 'Retries'}
              </Badge>
            )}
          </div>

          {/* Content */}
          <ScrollArea className="h-[400px] rounded-lg border border-border bg-background p-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-foreground">
                {finalAnswer}
              </div>
            </div>
          </ScrollArea>

          {/* Footer Disclaimer */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
            <Info className="w-3.5 h-3.5" />
            <span>Generated via EXOS Autonomous Graph with LangGraph architecture</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="lg"
          onClick={onStartOver}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Start Over
        </Button>
        <Button
          variant="hero"
          size="lg"
          onClick={onGenerateReport}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          Generate Report
        </Button>
      </div>
    </div>
  );
};
```

---

### `src/components/scenarios/GenericScenarioWizard.tsx`

```typescript
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, AlertTriangle, FlaskConical, Loader2, Wand2, BrainCircuit } from "lucide-react";
import { AnalysisPipelineAnimation } from "@/components/sentinel/AnalysisPipelineAnimation";
import { DeepAnalysisPipeline } from "@/components/analysis/DeepAnalysisPipeline";
import { DeepAnalysisResult } from "@/components/analysis/DeepAnalysisResult";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataRequirementsAlert from "@/components/consolidation/DataRequirementsAlert";
import StrategySelector, { StrategyType, strategyPresets } from "./StrategySelector";
import DashboardSelector from "./DashboardSelector";
import { IndustrySelector } from "@/components/context/IndustrySelector";
import { CategorySelector } from "@/components/context/CategorySelector";
import { ContextPreview } from "@/components/context/ContextPreview";
import { 
  IndustryContextEditor, 
  IndustryContextOverrides,
  getDefaultOverrides 
} from "@/components/context/IndustryContextEditor";
import { 
  CategoryContextEditor, 
  CategoryContextOverrides,
  getDefaultCategoryOverrides 
} from "@/components/context/CategoryContextEditor";
import OutputFeedback from "@/components/feedback/OutputFeedback";
import { MasterXMLPreview } from "@/components/sentinel/MasterXMLPreview";
import { FinalXMLPreview } from "@/components/sentinel/FinalXMLPreview";
import { BusinessContextField } from "./BusinessContextField";
import { ModelSelector, DEFAULT_MODEL, type AIModel } from "./ModelSelector";
import { DraftedParametersCard } from "./DraftedParametersCard";
import { MarketInsightsBanner } from "@/components/insights/MarketInsightsBanner";
import {
  Scenario,
  ScenarioRequiredField,
  getMissingRequiredFields,
  getMissingOptionalFields,
} from "@/lib/scenarios";
import { DashboardType, getDashboardsForScenario } from "@/lib/dashboard-mappings";
import { useSentinel } from "@/hooks/useSentinel";
import { useIndustryContext, useProcurementCategory } from "@/hooks/useContextData";
import { useShareableMode } from "@/hooks/useShareableMode";
import { useModelConfig } from "@/contexts/ModelConfigContext";
import { useMarketInsightsAvailability } from "@/hooks/useMarketInsights";
import { generateTestData } from "@/lib/test-data-factory";
import { runExosGraph, type ModelConfigType } from "@/lib/ai/graph";
import {
  DraftedParameters,
  draftParameters,
  generateWithParameters,
} from "@/lib/drafted-parameters";
import { toast } from "sonner";

interface GenericScenarioWizardProps {
  scenario: Scenario;
}

type Step = "input" | "review" | "analyzing" | "results";

const GenericScenarioWizard = ({ scenario }: GenericScenarioWizardProps) => {
  const navigate = useNavigate();
  const { showTechnicalDetails } = useShareableMode();
  const [step, setStep] = useState<Step>("input");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [strategyValue, setStrategyValue] = useState<StrategyType>("balanced");
  const [industrySlug, setIndustrySlug] = useState<string | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [industryOverrides, setIndustryOverrides] = useState<IndustryContextOverrides>(getDefaultOverrides());
  const [categoryOverrides, setCategoryOverrides] = useState<CategoryContextOverrides>(getDefaultCategoryOverrides());
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
  const [selectedDashboards, setSelectedDashboards] = useState<DashboardType[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string | null>(null);
  
  // Drafter-Validator state
  const [draftedParams, setDraftedParams] = useState<DraftedParameters | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isGeneratingFromDraft, setIsGeneratingFromDraft] = useState(false);
  const [testDataMetadata, setTestDataMetadata] = useState<{
    source: "ai" | "static";
    score?: number;
    reasoning?: string;
  } | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  // Market insights state
  const [isMarketInsightsActive, setIsMarketInsightsActive] = useState(false);

  // Deep Analysis state (LangGraph pipeline)
  const [isDeepAnalysisRunning, setIsDeepAnalysisRunning] = useState(false);
  const [deepAnalysisStep, setDeepAnalysisStep] = useState(0);
  const [deepAnalysisResult, setDeepAnalysisResult] = useState<{
    finalAnswer: string;
    confidenceScore: number;
    validationStatus: 'pending' | 'approved' | 'rejected';
    retryCount: number;
  } | null>(null);
  const [deepAnalysisError, setDeepAnalysisError] = useState<string | null>(null);

  // Fetch context data for AI grounding
  const { data: industryContext } = useIndustryContext(industrySlug);
  const { data: categoryContext } = useProcurementCategory(categorySlug);
  
  // Check for available market insights
  const { isAvailable: hasMarketInsights, insight: marketInsight } = useMarketInsightsAvailability(industrySlug, categorySlug);

  // Sentinel AI pipeline
  const { analyze, isProcessing, currentStage, error: sentinelError, tokenUsage, processingTimeMs } = useSentinel({
    onProgress: (stage, status) => {
      console.log(`[Sentinel] ${stage}: ${status}`);
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  // === DRAFTER-VALIDATOR WORKFLOW ===
  
  // Step 1: Draft parameters (1 AI call)
  const handleDraftTestCase = async () => {
    setIsDrafting(true);
    setDraftedParams(null);
    setTestDataMetadata(null);
    
    try {
      const result = await draftParameters(scenario.id, 0.8);
      
      if (result.success && result.parameters) {
        setDraftedParams(result.parameters);
        toast.success("Draft ready", {
          description: `${result.parameters.industry} • ${result.parameters.companySize}`,
        });
      } else {
        toast.error("Draft failed", { description: result.error });
      }
    } catch (err) {
      console.error("[Draft] Error:", err);
      toast.error("Failed to draft parameters");
    } finally {
      setIsDrafting(false);
    }
  };

  // Step 2: Generate with approved parameters (1 AI call)
  const handleApproveAndGenerate = async (params: DraftedParameters) => {
    setIsGeneratingFromDraft(true);
    
    try {
      const result = await generateWithParameters(scenario.id, params, 0.7);
      
      if (result.success && result.data) {
        setFormData(result.data);
        setTestDataMetadata({
          source: "ai",
          score: result.metadata?.score,
          reasoning: result.metadata?.reasoning,
        });
        setDraftedParams(null); // Clear draft after success
        toast.success("Test Data Generated", {
          description: `Score: ${result.metadata?.score}/100`,
        });
      } else {
        toast.error("Generation failed", { description: result.error });
      }
    } catch (err) {
      console.error("[Generate] Error:", err);
      toast.error("Failed to generate test data");
    } finally {
      setIsGeneratingFromDraft(false);
    }
  };

  // Static fallback
  const handleStaticGenerate = () => {
    const testData = generateTestData(scenario.id);
    setFormData(testData);
    setDraftedParams(null);
    setTestDataMetadata({ source: "static" });
    toast.success("Static test data generated");
  };

  // Reset overrides when context selection changes
  const handleIndustryChange = (slug: string | null) => {
    setIndustrySlug(slug);
    setIndustryOverrides(getDefaultOverrides());
  };

  const handleCategoryChange = (slug: string | null) => {
    setCategorySlug(slug);
    setCategoryOverrides(getDefaultCategoryOverrides());
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFieldClick = (fieldId: string) => {
    const element = fieldRefs.current[fieldId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus();
    }
  };

  const missingRequired = getMissingRequiredFields(scenario.id, formData);
  const missingOptional = getMissingOptionalFields(scenario.id, formData);

  const canProceed = missingRequired.length === 0;

  // Get model config from context for BYOK support
  const { provider: configProvider, model: configModel } = useModelConfig();

  const handleAnalyze = async () => {
    setStep("analyzing");
    
    // Determine if we should use Google AI Studio (BYOK)
    const useGoogleAIStudio = configProvider === "google_ai_studio";
    const effectiveModel = useGoogleAIStudio ? configModel : selectedModel;
    
    // Include strategy and market insights in form data for AI grounding
    const enrichedData = {
      ...formData,
      strategy: strategyValue,
      // Include market insights if activated
      ...(isMarketInsightsActive && marketInsight ? {
        _marketInsights: JSON.stringify({
          content: marketInsight.content,
          keyTrends: marketInsight.key_trends,
          riskSignals: marketInsight.risk_signals,
          opportunities: marketInsight.opportunities,
          updatedAt: marketInsight.created_at,
        }),
      } : {}),
    };

    const result = await analyze(
      scenario.id,
      enrichedData,
      industryContext || null,
      categoryContext || null,
      undefined, // config
      effectiveModel, // pass the effective model (from config or selector)
      useGoogleAIStudio // pass the BYOK flag
    );

    if (result?.success) {
      setAnalysisResult(result.result);
      setAnalysisTimestamp(new Date().toISOString());
      setStep("results");
      toast.success("Analysis complete!");
    } else {
      setStep("review");
      toast.error(sentinelError?.message || "Analysis failed. Please try again.");
    }
  };

  // Deep Analysis handler (LangGraph pipeline)
  const handleDeepAnalysis = async () => {
    setStep("analyzing");
    setIsDeepAnalysisRunning(true);
    setDeepAnalysisStep(0);
    setDeepAnalysisResult(null);
    setDeepAnalysisError(null);

    // Start simulated step progress (4 steps, ~3s each)
    let currentStepLocal = 0;
    const progressInterval = setInterval(() => {
      if (currentStepLocal < 3) {
        currentStepLocal++;
        setDeepAnalysisStep(currentStepLocal);
      }
    }, 3500);

    try {
      // Build query from form data
      const queryText = Object.entries(formData)
        .filter(([_, value]) => value) // Only include non-empty values
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

      const graphConfig: ModelConfigType = {
        provider: configProvider,
        model: configModel,
      };

      const result = await runExosGraph(queryText, graphConfig);

      clearInterval(progressInterval);
      setDeepAnalysisStep(4); // Complete all steps
      setDeepAnalysisResult(result);
      setAnalysisTimestamp(new Date().toISOString());
      setStep("results");
      toast.success("Deep Analysis complete!");
    } catch (err) {
      clearInterval(progressInterval);
      const errorMessage = err instanceof Error ? err.message : "Analysis failed";
      setDeepAnalysisError(errorMessage);
      setStep("review");
      toast.error(`Deep Analysis failed: ${errorMessage}`);
    } finally {
      setIsDeepAnalysisRunning(false);
    }
  };

  const handleFeedbackSubmit = (rating: number, feedback: string) => {
    console.log("Feedback submitted:", { rating, feedback, scenario: scenario.id });
    // Could be stored in database in future
  };

  const handleGenerateReport = () => {
    navigate("/report", {
      state: {
        scenarioTitle: scenario.title,
        scenarioId: scenario.id,
        analysisResult: analysisResult,
        formData: formData,
        timestamp: analysisTimestamp,
        selectedDashboards: selectedDashboards,
      },
    });
  };

  const renderField = (field: ScenarioRequiredField, skipBusinessContextField = false) => {
    const commonClasses = "bg-background";

    // Special handling for industryContext field - use BusinessContextField component
    if (field.id === "industryContext" && !skipBusinessContextField) {
      return (
        <BusinessContextField
          value={formData[field.id] || ""}
          onChange={(value) => handleFieldChange(field.id, value)}
          placeholder={field.placeholder || field.description}
        />
      );
    }

    if (field.type === "select" && field.options) {
      return (
        <Select
          value={formData[field.id] || ""}
          onValueChange={(value) => handleFieldChange(field.id, value)}
        >
          <SelectTrigger
            ref={(el) => (fieldRefs.current[field.id] = el)}
            className={commonClasses}
          >
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.type === "textarea") {
      return (
        <Textarea
          ref={(el) => (fieldRefs.current[field.id] = el)}
          placeholder={field.placeholder || field.description}
          value={formData[field.id] || ""}
          onChange={(e) => handleFieldChange(field.id, e.target.value)}
          className={`${commonClasses} min-h-[120px]`}
          rows={5}
        />
      );
    }

    if (field.type === "text" && field.label.toLowerCase().includes("text")) {
      return (
        <Textarea
          ref={(el) => (fieldRefs.current[field.id] = el)}
          placeholder={field.placeholder || field.description}
          value={formData[field.id] || ""}
          onChange={(e) => handleFieldChange(field.id, e.target.value)}
          className={commonClasses}
          rows={4}
        />
      );
    }

    return (
      <Input
        ref={(el) => (fieldRefs.current[field.id] = el)}
        type={field.type === "number" || field.type === "percentage" || field.type === "currency" ? "number" : "text"}
        placeholder={field.description}
        value={formData[field.id] || ""}
        onChange={(e) => handleFieldChange(field.id, e.target.value)}
        className={commonClasses}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {["input", "review", "results"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step === s || (step === "analyzing" && s === "results")
                  ? "gradient-primary text-primary-foreground"
                  : step === "results" || (step === "review" && i === 0)
                  ? "bg-primary/30 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  i === 0 && (step === "review" || step === "analyzing" || step === "results")
                    ? "bg-primary"
                    : i === 1 && step === "results"
                    ? "bg-primary"
                    : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold mb-1">
                  Enter Your Data
                </h3>
                <p className="text-sm text-muted-foreground">
                  Fields marked with <span className="text-destructive">*</span> are required 
                  for the analysis. Optional fields improve recommendation accuracy.
                </p>
              </div>
              
              {/* Drafter-Validator test data generator (only visible in non-shared mode) */}
              {showTechnicalDetails && (
                <div className="flex items-center gap-2">
                  {testDataMetadata && (
                    <span className="text-xs text-muted-foreground">
                      {testDataMetadata.source === "ai" ? (
                        <>Score: {testDataMetadata.score}/100</>
                      ) : (
                        "Static"
                      )}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDraftTestCase}
                    disabled={isDrafting || isGeneratingFromDraft}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    {isDrafting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    {isDrafting ? "Drafting..." : "Draft Test Case"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStaticGenerate}
                    disabled={isDrafting || isGeneratingFromDraft}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <FlaskConical className="w-4 h-4" />
                    Static
                  </Button>
                </div>
              )}
            </div>

            {/* Drafted Parameters Card (shown when draft is ready) */}
            {showTechnicalDetails && draftedParams && (
              <DraftedParametersCard
                parameters={draftedParams}
                onApprove={handleApproveAndGenerate}
                onRedraft={handleDraftTestCase}
                isGenerating={isGeneratingFromDraft}
                isRedrafting={isDrafting}
              />
            )}

            {/* Master XML Template Preview (hidden in shareable mode) */}
            <MasterXMLPreview scenarioType={scenario.id} />

            {/* Context Selectors for AI Grounding */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-border bg-card/50">
              <IndustrySelector
                value={industrySlug}
                onChange={handleIndustryChange}
              />
              <CategorySelector
                value={categorySlug}
                onChange={handleCategoryChange}
              />
            </div>

            {/* Interactive Context Editors */}
            {industrySlug && (
              <IndustryContextEditor
                industrySlug={industrySlug}
                overrides={industryOverrides}
                onOverridesChange={setIndustryOverrides}
              />
            )}
            
            {categorySlug && (
              <CategoryContextEditor
                categorySlug={categorySlug}
                overrides={categoryOverrides}
                onOverridesChange={setCategoryOverrides}
              />
            )}

            {/* Market Insights Banner - shown when insights are available for this combination */}
            {hasMarketInsights && marketInsight && (
              <MarketInsightsBanner
                insight={marketInsight}
                onActivate={() => {
                  setIsMarketInsightsActive(true);
                  toast.success("Market insights activated", {
                    description: "Real-time market intelligence will be included in your analysis.",
                  });
                }}
                isActivated={isMarketInsightsActive}
              />
            )}

            {/* Context Preview (collapsed by default, XML hidden in shared mode) */}
            {(industrySlug || categorySlug) && (
              <ContextPreview
                industrySlug={industrySlug}
                categorySlug={categorySlug}
                showXML={true}
              />
            )}

            {/* Strategy Selector */}
            {scenario.strategySelector && (
              <div className="mb-6">
                <StrategySelector
                  value={strategyValue}
                  onChange={setStrategyValue}
                  title={strategyPresets[scenario.strategySelector].title}
                  description={strategyPresets[scenario.strategySelector].description}
                  options={strategyPresets[scenario.strategySelector].options}
                />
              </div>
            )}

            {/* Required Fields */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Required Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenario.requiredFields
                  .filter((f) => f.required)
                  .map((field) => {
                    // BusinessContextField renders its own label
                    if (field.id === "industryContext") {
                      return (
                        <div key={field.id} className="md:col-span-2">
                          {renderField(field)}
                        </div>
                      );
                    }
                    
                    return (
                      <div key={field.id} className={`space-y-2 ${field.type === "textarea" ? "md:col-span-2" : ""}`}>
                        <Label className="flex items-center gap-1">
                          {field.label}
                          <span className="text-destructive">*</span>
                          {field.type === "percentage" && (
                            <span className="text-muted-foreground text-xs">(%)</span>
                          )}
                          {field.type === "currency" && (
                            <span className="text-muted-foreground text-xs">($)</span>
                          )}
                        </Label>
                        {renderField(field)}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Optional Fields */}
            {scenario.requiredFields.some((f) => !f.required) && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Optional Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scenario.requiredFields
                    .filter((f) => !f.required)
                    .map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label className="flex items-center gap-1">
                          {field.label}
                          {field.type === "percentage" && (
                            <span className="text-muted-foreground text-xs">(%)</span>
                          )}
                          {field.type === "currency" && (
                            <span className="text-muted-foreground text-xs">($)</span>
                          )}
                        </Label>
                        {renderField(field)}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Dashboard Selector */}
            <DashboardSelector
              scenarioId={scenario.id}
              selectedDashboards={selectedDashboards}
              onSelectionChange={setSelectedDashboards}
            />

            {/* AI Model Selector - hidden in shareable mode */}
            <ModelSelector value={selectedModel} onChange={setSelectedModel} />

            {/* Final XML Preview - shows complete XML after form is filled (hidden in shareable mode) */}
            <FinalXMLPreview
              scenarioType={scenario.id}
              scenarioData={formData}
              industry={industryContext || null}
              category={categoryContext || null}
              strategyValue={strategyValue}
            />

            <div className="flex justify-end">
              <Button
                variant="hero"
                size="lg"
                onClick={() => setStep("review")}
                className="gap-2"
              >
                Review Data
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="font-display text-lg font-semibold mb-1">
                Data Review
              </h3>
              <p className="text-sm text-muted-foreground">
                Review your input data and check for any missing information before analysis.
              </p>
            </div>

            <DataRequirementsAlert
              missingRequired={missingRequired}
              missingOptional={missingOptional}
              onFieldClick={(fieldId) => {
                setStep("input");
                setTimeout(() => handleFieldClick(fieldId), 100);
              }}
            />

            {/* Expected Outputs */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="font-medium mb-3">Analysis Will Generate:</h4>
              <ul className="space-y-2">
                {scenario.outputs.map((output, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span className="text-muted-foreground">{output}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setStep("input")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Edit Data
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!canProceed || isDeepAnalysisRunning}
                  className="gap-2"
                >
                  {!canProceed && <AlertTriangle className="w-4 h-4" />}
                  <Sparkles className="w-4 h-4" />
                  {canProceed ? "Analyze with AI" : "Complete Required Fields"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDeepAnalysis}
                  disabled={!canProceed || isDeepAnalysisRunning}
                  className="gap-2 border-purple-500/50 hover:bg-purple-500/10"
                >
                  <BrainCircuit className="w-4 h-4" />
                  Deep Analysis
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 uppercase">Beta</Badge>
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-10"
          >
            {isDeepAnalysisRunning ? (
              <DeepAnalysisPipeline
                status="running"
                currentStepIndex={deepAnalysisStep}
                errorMessage={deepAnalysisError || undefined}
              />
            ) : (
              <>
                <div className="text-center mb-8">
                  <h3 className="font-display text-xl font-semibold mb-2">
                    Analyzing Your Data
                  </h3>
                  <p className="text-muted-foreground">
                    Running {scenario.title} analysis through EXOS Sentinel pipeline...
                  </p>
                </div>

                <AnalysisPipelineAnimation
                  isProcessing={isProcessing}
                  currentApiStage={currentStage}
                />
              </>
            )}
          </motion.div>
        )}

        {step === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {deepAnalysisResult ? (
              <DeepAnalysisResult
                result={deepAnalysisResult}
                onStartOver={() => {
                  setDeepAnalysisResult(null);
                  setStep("input");
                }}
                onGenerateReport={handleGenerateReport}
              />
            ) : (
              <>
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                    <h3 className="font-display text-xl font-semibold">
                      Analysis Complete
                    </h3>
                  </div>
                  
                  {analysisResult ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="whitespace-pre-wrap text-foreground bg-card rounded-lg p-4 border border-border max-h-[500px] overflow-y-auto">
                        {analysisResult}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Your {scenario.title} analysis is ready.
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {scenario.outputs.map((output, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground"
                      >
                        {output.split(":")[0]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Output Feedback */}
                <OutputFeedback
                  onFeedbackSubmit={handleFeedbackSubmit}
                  onGenerateReport={handleGenerateReport}
                  tokenUsage={tokenUsage}
                  processingTimeMs={processingTimeMs}
                  model={selectedModel}
                />

                <div className="flex justify-start">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStep("input")}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Start Over
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GenericScenarioWizard;
```

---

## Edge Functions

### `supabase/functions/sentinel-analysis/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * EXOS Sentinel Analysis Edge Function
 * 
 * Processes procurement analysis requests through the full pipeline:
 * 1. Receives pre-processed (anonymized + grounded) context from client
 * 2. Calls AI gateway with grounded prompt (Gemini 3 Flash)
 * 3. Logs prompts and responses to testing database
 * 4. Returns response for client-side validation and de-anonymization
 */

interface AnalysisRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  useLocalModel?: boolean;
  localModelEndpoint?: string;
  useGoogleAIStudio?: boolean;
  googleModel?: string;
  stream?: boolean;
  // Testing metadata
  scenarioType?: string;
  scenarioData?: Record<string, unknown>;
  industrySlug?: string | null;
  categorySlug?: string | null;
  groundingContext?: Record<string, unknown>;
  anonymizationMetadata?: Record<string, unknown>;
  enableTestLogging?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      systemPrompt, 
      userPrompt, 
      model = "google/gemini-3-flash-preview", // Default to Gemini 3 Flash
      useLocalModel = false,
      localModelEndpoint,
      useGoogleAIStudio = false,
      googleModel = "gemini-2.0-flash",
      stream = false,
      // Testing metadata
      scenarioType,
      scenarioData,
      industrySlug,
      categorySlug,
      groundingContext,
      anonymizationMetadata,
      enableTestLogging = true
    }: AnalysisRequest = await req.json();

    // Validate required fields
    if (!systemPrompt || !userPrompt) {
      return new Response(
        JSON.stringify({ error: "Missing systemPrompt or userPrompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client for test logging
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = supabaseUrl && supabaseKey 
      ? createClient(supabaseUrl, supabaseKey)
      : null;

    let promptId: string | null = null;
    const startTime = performance.now();

    // Log the prompt to testing database
    if (enableTestLogging && supabase && scenarioType) {
      try {
        const { data: promptData, error: promptError } = await supabase
          .from("test_prompts")
          .insert({
            scenario_type: scenarioType,
            scenario_data: scenarioData || {},
            industry_slug: industrySlug,
            category_slug: categorySlug,
            system_prompt: systemPrompt,
            user_prompt: userPrompt,
            grounding_context: groundingContext,
            anonymization_metadata: anonymizationMetadata
          })
          .select("id")
          .single();

        if (promptError) {
          console.error("[Sentinel] Failed to log prompt:", promptError);
        } else {
          promptId = promptData.id;
          console.log(`[Sentinel] Logged prompt: ${promptId}`);
        }
      } catch (logError) {
        console.error("[Sentinel] Prompt logging error:", logError);
      }
    }

    // Future: Route to local Mistral model if configured
    if (useLocalModel && localModelEndpoint) {
      console.log(`[Sentinel] Routing to local model at ${localModelEndpoint}`);
      
      return new Response(
        JSON.stringify({ 
          error: "Local model endpoint not yet implemented",
          message: "Configure your Mistral model endpoint and uncomment the local model logic"
        }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route to Google AI Studio (BYOK mode)
    if (useGoogleAIStudio) {
      const GOOGLE_AI_STUDIO_KEY = Deno.env.get("GOOGLE_AI_STUDIO_KEY");
      
      if (!GOOGLE_AI_STUDIO_KEY) {
        console.error("[Sentinel] GOOGLE_AI_STUDIO_KEY not configured, falling back to Lovable AI");
        // Fall through to Lovable AI Gateway
      } else {
        console.log(`[Sentinel] Routing to Google AI Studio with model: ${googleModel}`);
        
        const googleEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${GOOGLE_AI_STUDIO_KEY}`;
        
        try {
          const googleResponse = await fetch(googleEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
              ],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 4096,
              },
            }),
          });

          const processingTime = Math.round(performance.now() - startTime);

          if (!googleResponse.ok) {
            const errorText = await googleResponse.text();
            console.error(`[Sentinel] Google AI Studio error: ${googleResponse.status}`, errorText);
            
            if (enableTestLogging && supabase && promptId) {
              await supabase.from("test_reports").insert({
                prompt_id: promptId,
                model: googleModel,
                raw_response: errorText,
                processing_time_ms: processingTime,
                success: false,
                error_message: `Google AI Studio error: ${googleResponse.status}`
              });
            }
            
            return new Response(
              JSON.stringify({ error: "Google AI Studio error", details: errorText }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const googleData = await googleResponse.json();
          const content = googleData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          
          // Extract token usage from Google's format
          const usage = googleData.usageMetadata ? {
            prompt_tokens: googleData.usageMetadata.promptTokenCount || 0,
            completion_tokens: googleData.usageMetadata.candidatesTokenCount || 0,
            total_tokens: googleData.usageMetadata.totalTokenCount || 0,
          } : null;

          console.log(`[Sentinel] Google AI Studio response: ${content.length} chars`);
          console.log(`[Sentinel] Processing time: ${processingTime}ms`);

          // Log successful response
          if (enableTestLogging && supabase && promptId) {
            try {
              await supabase.from("test_reports").insert({
                prompt_id: promptId,
                model: googleModel,
                raw_response: content,
                processing_time_ms: processingTime,
                token_usage: usage,
                success: true
              });
              console.log(`[Sentinel] Logged report for prompt: ${promptId}`);
            } catch (reportError) {
              console.error("[Sentinel] Failed to log report:", reportError);
            }
          }

          return new Response(
            JSON.stringify({
              content,
              model: googleModel,
              source: "google_ai_studio",
              usage,
              promptId,
              processingTimeMs: processingTime
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (googleError) {
          console.error("[Sentinel] Google AI Studio fetch error:", googleError);
          // Fall through to Lovable AI Gateway
        }
      }
    }

    // Call Lovable AI Gateway with retry logic for transient errors
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[Sentinel] LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Sentinel] Calling AI gateway with model: ${model}`);
    console.log(`[Sentinel] System prompt length: ${systemPrompt.length} chars`);
    console.log(`[Sentinel] User prompt length: ${userPrompt.length} chars`);

    // Retry logic for transient errors (503, connection resets)
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff
    let aiResponse: Response | null = null;
    let lastError: string | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[Sentinel] Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${RETRY_DELAYS[attempt - 1]}ms`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
        }

        aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.4,
            max_completion_tokens: 4096,
            stream
          }),
        });

        // If we get a 503 (service unavailable), retry
        if (aiResponse.status === 503) {
          lastError = await aiResponse.text();
          console.warn(`[Sentinel] Got 503 on attempt ${attempt + 1}: ${lastError}`);
          if (attempt < MAX_RETRIES - 1) continue;
        }

        // Success or non-retryable error, break out
        break;
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError.message : "Network error";
        console.warn(`[Sentinel] Fetch error on attempt ${attempt + 1}: ${lastError}`);
        if (attempt === MAX_RETRIES - 1) {
          return new Response(
            JSON.stringify({ error: "AI gateway connection failed after retries", details: lastError }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (!aiResponse) {
      return new Response(
        JSON.stringify({ error: "AI gateway unavailable", details: lastError }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processingTime = Math.round(performance.now() - startTime);

    // Handle rate limits and payment required
    if (aiResponse.status === 429) {
      console.warn("[Sentinel] Rate limit exceeded");
      
      // Log error to test reports
      if (enableTestLogging && supabase && promptId) {
        await supabase.from("test_reports").insert({
          prompt_id: promptId,
          model,
          raw_response: "",
          processing_time_ms: processingTime,
          success: false,
          error_message: "Rate limit exceeded"
        });
      }
      
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (aiResponse.status === 402) {
      console.warn("[Sentinel] Payment required");
      
      if (enableTestLogging && supabase && promptId) {
        await supabase.from("test_reports").insert({
          prompt_id: promptId,
          model,
          raw_response: "",
          processing_time_ms: processingTime,
          success: false,
          error_message: "Payment required"
        });
      }
      
      return new Response(
        JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`[Sentinel] AI gateway error: ${aiResponse.status}`, errorText);
      
      if (enableTestLogging && supabase && promptId) {
        await supabase.from("test_reports").insert({
          prompt_id: promptId,
          model,
          raw_response: errorText,
          processing_time_ms: processingTime,
          success: false,
          error_message: `AI gateway error: ${aiResponse.status}`
        });
      }
      
      return new Response(
        JSON.stringify({ error: "AI gateway error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle streaming response
    if (stream) {
      return new Response(aiResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Handle non-streaming response
    const data = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log(`[Sentinel] Response received: ${content.length} chars`);
    console.log(`[Sentinel] Processing time: ${processingTime}ms`);

    // Log successful response to test reports
    if (enableTestLogging && supabase && promptId) {
      try {
        await supabase.from("test_reports").insert({
          prompt_id: promptId,
          model,
          raw_response: content,
          processing_time_ms: processingTime,
          token_usage: data.usage || null,
          success: true
        });
        console.log(`[Sentinel] Logged report for prompt: ${promptId}`);
      } catch (reportError) {
        console.error("[Sentinel] Failed to log report:", reportError);
      }
    }

    return new Response(
      JSON.stringify({
        content,
        model,
        source: "cloud",
        usage: data.usage,
        promptId, // Return for client-side reference
        processingTimeMs: processingTime
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Sentinel] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

### `supabase/functions/generate-market-insights/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IndustryCategory {
  industrySlug: string;
  industryName: string;
  categorySlug: string;
  categoryName: string;
  geography?: string; // e.g., "EU", "US", "APAC", "Global"
}

interface GenerateRequest {
  combinations: IndustryCategory[];
  validateOnly?: boolean;
  defaultGeography?: string; // Applied to combinations without explicit geography
}

// Plausible industry+category combinations with expected high confidence
const PLAUSIBLE_COMBINATIONS: IndustryCategory[] = [
  { industrySlug: "pharma-life-sciences", industryName: "Pharma & Life Sciences", categorySlug: "lab-supplies", categoryName: "Lab Supplies" },
  { industrySlug: "automotive-oem", industryName: "Automotive (OEM)", categorySlug: "raw-materials-steel", categoryName: "Raw Materials (Steel)" },
  { industrySlug: "retail", industryName: "Retail", categorySlug: "logistics-small-parcel", categoryName: "Logistics (Small Parcel)" },
  { industrySlug: "saas-enterprise", industryName: "SaaS (Enterprise)", categorySlug: "it-software-saas", categoryName: "IT Software (SaaS)" },
  { industrySlug: "healthcare", industryName: "Healthcare", categorySlug: "mro-maintenance", categoryName: "MRO (Maintenance)" },
  { industrySlug: "electronics", industryName: "Electronics", categorySlug: "semiconductors", categoryName: "Semiconductors" },
  { industrySlug: "food-beverage", industryName: "Food & Beverage", categorySlug: "packaging-primary", categoryName: "Packaging (Primary)" },
  { industrySlug: "construction-infra", industryName: "Construction & Infra", categorySlug: "construction-materials", categoryName: "Construction Materials" },
  { industrySlug: "aerospace-defense", industryName: "Aerospace & Defense", categorySlug: "electronic-components", categoryName: "Electronic Components" },
  { industrySlug: "chemicals", industryName: "Chemicals", categorySlug: "chemicals-specialty", categoryName: "Chemicals (Specialty)" },
];

const VALIDATION_PROMPT = `You are a procurement industry expert. Evaluate how plausible this industry+category combination is for procurement analysis.

Industry: {{INDUSTRY}}
Procurement Category: {{CATEGORY}}

Rate the plausibility on a scale of 0.0 to 1.0 where:
- 1.0 = Highly relevant (this category is core to this industry's procurement)
- 0.7-0.9 = Relevant (common procurement category for this industry)
- 0.4-0.6 = Somewhat relevant (occasionally procured)
- 0.1-0.3 = Low relevance (rare for this industry)
- 0.0 = Not relevant (makes no sense)

Respond with ONLY a JSON object:
{"confidence": 0.85, "reasoning": "Brief explanation"}`;

const MARKET_INSIGHTS_PROMPT = `You are a senior procurement intelligence analyst with 20+ years of experience. Generate an exhaustive, deeply-researched market intelligence briefing for the following industry and procurement category combination.

Industry: {{INDUSTRY}}
Procurement Category: {{CATEGORY}}
Geographic Focus: {{GEOGRAPHY}}

Provide a comprehensive market intelligence report covering ALL of the following sections in depth:

## 1. EXECUTIVE SUMMARY
- 3-5 key takeaways for procurement leaders
- Overall market outlook (bullish/bearish/neutral) with justification
- Critical action items for the next 90 days

## 2. MARKET STRUCTURE & DYNAMICS
- Market size and growth rates (YoY, 5-year CAGR) in {{GEOGRAPHY}}
- Supply/demand balance and capacity utilization rates
- Market concentration (HHI, CR4/CR5 ratios if available)
- Entry barriers and switching costs
- Seasonal patterns and cyclicality

## 3. COMPETITIVE LANDSCAPE
- Top 10-15 suppliers in {{GEOGRAPHY}} with estimated market shares
- Recent M&A activity (last 24 months) and strategic implications
- New market entrants and disruptors
- Supplier financial health indicators
- Vertical integration trends

## 4. PRICING ANALYSIS
- Current price levels and 12-month price trajectory
- Key price drivers (raw materials, labor, energy, logistics)
- Price indices and benchmarks used in {{GEOGRAPHY}}
- Currency exposure and hedging considerations
- Total Cost of Ownership (TCO) components

## 5. SUPPLY CHAIN RISK ASSESSMENT
- Geopolitical risks affecting {{GEOGRAPHY}} supply chains
- Single points of failure and concentration risks
- Regulatory and compliance changes (current and pending)
- ESG/sustainability mandates and implications
- Force majeure history and vulnerability assessment
- Lead time volatility and inventory considerations

## 6. TECHNOLOGY & INNOVATION
- Emerging technologies disrupting this category
- Automation and digitalization trends
- Sustainability innovations and circular economy initiatives
- R&D investment levels and innovation pipeline
- Digital procurement tools and e-sourcing platforms

## 7. REGULATORY & COMPLIANCE LANDSCAPE
- Current regulations affecting procurement in {{GEOGRAPHY}}
- Upcoming regulatory changes (next 12-24 months)
- Certification and standard requirements
- Trade policy and tariff considerations
- Data privacy and security requirements

## 8. STRATEGIC PROCUREMENT OPPORTUNITIES
- Optimal timing for negotiations and tenders
- Negotiation leverage points and BATNA strategies
- Alternative sourcing regions and near-shoring options
- Volume consolidation and demand pooling opportunities
- Contract structure recommendations (length, pricing mechanisms)
- Supplier development and partnership opportunities

## 9. FORWARD-LOOKING INTELLIGENCE
- 12-month market forecast with confidence levels
- Emerging risks on the horizon
- Strategic scenarios (best case, base case, worst case)
- Early warning indicators to monitor

## 10. RECOMMENDED ACTIONS
- Immediate actions (0-30 days)
- Short-term initiatives (1-6 months)
- Strategic priorities (6-18 months)
- KPIs and success metrics

Be extremely specific and quantitative. Include actual company names, real data points, specific percentages, exact timeframes, and cite your sources. Reference {{GEOGRAPHY}}-specific regulations, standards, trade associations, and market dynamics. This report should be actionable for a Chief Procurement Officer making strategic decisions.`;

async function validateCombination(
  apiKey: string,
  industry: string,
  category: string
): Promise<{ confidence: number; reasoning: string }> {
  const prompt = VALIDATION_PROMPT
    .replace("{{INDUSTRY}}", industry)
    .replace("{{CATEGORY}}", category);

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Validation API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    console.error("Failed to parse validation response:", content);
  }
  
  return { confidence: 0.5, reasoning: "Unable to parse validation response" };
}

async function generateMarketInsights(
  apiKey: string,
  industry: string,
  category: string,
  geography: string
): Promise<{ content: string; citations: string[]; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null }> {
  const prompt = MARKET_INSIGHTS_PROMPT
    .replace("{{INDUSTRY}}", industry)
    .replace("{{CATEGORY}}", category)
    .replace(/\{\{GEOGRAPHY\}\}/g, geography);

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        { role: "system", content: "You are a world-class procurement intelligence analyst. Provide exhaustive, deeply-researched market intelligence with specific data points, exact figures, named companies, and cited sources. Be extremely thorough and quantitative. Your reports inform C-level procurement decisions worth millions." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 5000, // 5x increase for comprehensive insights
      search_recency_filter: "month",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Market insights API error:", response.status, errorText);
    throw new Error(`Market insights API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices?.[0]?.message?.content || "",
    citations: data.citations || [],
    usage: data.usage || null,
  };
}

function extractInsightArrays(content: string): { trends: string[]; risks: string[]; opportunities: string[] } {
  const trends: string[] = [];
  const risks: string[] = [];
  const opportunities: string[] = [];

  // Extract key trends (items after "Market Conditions" or "Trends")
  const trendMatches = content.match(/(?:trend|condition|dynamic)[s]?[:\s]*[-•*]\s*([^\n]+)/gi);
  if (trendMatches) {
    trends.push(...trendMatches.slice(0, 5).map(m => m.replace(/^[^:]+:\s*[-•*]\s*/, '').trim()));
  }

  // Extract risk signals
  const riskMatches = content.match(/(?:risk|disrupt|threat|concern)[s]?[:\s]*[-•*]\s*([^\n]+)/gi);
  if (riskMatches) {
    risks.push(...riskMatches.slice(0, 5).map(m => m.replace(/^[^:]+:\s*[-•*]\s*/, '').trim()));
  }

  // Extract opportunities
  const oppMatches = content.match(/(?:opportunit|recommend|leverage|advantage)[ies]*[:\s]*[-•*]\s*([^\n]+)/gi);
  if (oppMatches) {
    opportunities.push(...oppMatches.slice(0, 5).map(m => m.replace(/^[^:]+:\s*[-•*]\s*/, '').trim()));
  }

  return { trends, risks, opportunities };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { combinations, validateOnly, defaultGeography = "EU" } = body as GenerateRequest;

    // Use provided combinations or default plausible ones
    const targetCombinations = combinations?.length > 0 
      ? combinations 
      : PLAUSIBLE_COMBINATIONS.slice(0, 5);
    
    // Apply default geography to combinations that don't have one
    const combinationsWithGeo = targetCombinations.map(c => ({
      ...c,
      geography: c.geography || defaultGeography,
    }));

    const results: Array<{
      industry: string;
      category: string;
      confidence: number;
      success: boolean;
      error?: string;
      insightId?: string;
    }> = [];

    let totalTokens = 0;
    let totalCost = 0;

    for (const combo of combinationsWithGeo) {
      try {
        console.log(`Processing: ${combo.industryName} + ${combo.categoryName} [${combo.geography}]`);

        // Step 1: Validate combination plausibility
        const validation = await validateCombination(
          PERPLEXITY_API_KEY,
          combo.industryName,
          combo.categoryName
        );

        console.log(`Validation: confidence=${validation.confidence}, reason=${validation.reasoning}`);

        // Skip if confidence too low
        if (validation.confidence < 0.4) {
          results.push({
            industry: combo.industrySlug,
            category: combo.categorySlug,
            confidence: validation.confidence,
            success: false,
            error: `Low confidence: ${validation.reasoning}`,
          });
          continue;
        }

        if (validateOnly) {
          results.push({
            industry: combo.industrySlug,
            category: combo.categorySlug,
            confidence: validation.confidence,
            success: true,
          });
          continue;
        }

        // Step 2: Archive existing active insight
        await supabase
          .from("market_insights")
          .update({ is_active: false })
          .eq("industry_slug", combo.industrySlug)
          .eq("category_slug", combo.categorySlug)
          .eq("is_active", true);

        // Step 3: Generate market insights with geography focus
        const insights = await generateMarketInsights(
          PERPLEXITY_API_KEY,
          combo.industryName,
          combo.categoryName,
          combo.geography
        );

        if (insights.usage) {
          totalTokens += insights.usage.total_tokens;
          // Sonar-pro pricing: $5/1000 requests, roughly $0.003/1K tokens
          totalCost += (insights.usage.total_tokens / 1000) * 0.003;
        }

        // Extract structured data from content
        const { trends, risks, opportunities } = extractInsightArrays(insights.content);

        // Step 4: Store new insight
        const { data: insertedData, error: insertError } = await supabase
          .from("market_insights")
          .insert({
            industry_slug: combo.industrySlug,
            industry_name: combo.industryName,
            category_slug: combo.categorySlug,
            category_name: combo.categoryName,
            confidence_score: validation.confidence,
            content: insights.content,
            citations: insights.citations.map((url, i) => ({ index: i + 1, url })),
            key_trends: trends,
            risk_signals: risks,
            opportunities: opportunities,
            raw_response: { usage: insights.usage },
            model_used: "sonar-pro",
            processing_time_ms: Date.now() - startTime,
            is_active: true,
          })
          .select("id")
          .single();

        if (insertError) {
          throw new Error(`Insert error: ${insertError.message}`);
        }

        results.push({
          industry: combo.industrySlug,
          category: combo.categorySlug,
          confidence: validation.confidence,
          success: true,
          insightId: insertedData?.id,
        });

      } catch (error) {
        console.error(`Error processing ${combo.industrySlug}+${combo.categorySlug}:`, error);
        results.push({
          industry: combo.industrySlug,
          category: combo.categorySlug,
          confidence: 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const processingTimeMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          processingTimeMs,
          totalTokens,
          estimatedCost: `$${totalCost.toFixed(4)}`,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Generate market insights error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
```

---

## End of PROJECT_CONTEXT.md

*Total files: 9*  
*Approximate line count: ~2,870 lines*
