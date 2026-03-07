/**
 * EXOS Decision Workflow - Lightweight Orchestrator
 * 
 * Replaces LangGraph with a simple async pipeline that:
 * - Uses existing sentinel utilities (anonymizer, validator, deanonymizer)
 * - Routes AI inference through the sentinel-analysis edge function
 * - Implements self-correction loop for validation failures
 * - Routes all inference through Google AI Studio
 * - Sends traces to LangSmith via REST API (browser-compatible)
 * - Merges server-side DB-driven validation with client-side token integrity
 */

import { checkTokenIntegrity, mergeValidationResults } from '../sentinel/validator';
import type { ServerValidation } from '../sentinel/validator';
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
 * Deep Analytics scenarios that trigger the server-side
 * Multi-Cycle Chain-of-Experts (Analyst → Auditor → Synthesizer).
 * Standard scenarios use single-pass inference.
 */
export const DEEP_ANALYTICS_SCENARIOS = [
  'tco-analysis',
  'cost-breakdown',
  'capex-vs-opex',
  'savings-calculation',
  'make-vs-buy',
  'volume-consolidation',
  'forecasting-budgeting',
  'specification-optimizer',
] as const;

export type DeepAnalyticsScenario = typeof DEEP_ANALYTICS_SCENARIOS[number];

export function isDeepAnalyticsScenario(id: string): id is DeepAnalyticsScenario {
  return (DEEP_ANALYTICS_SCENARIOS as readonly string[]).includes(id);
}

export const LEAKAGE_MARKERS = ['[PASS]', '[FAIL]', '<draft>', '</draft>', '<critique>', '</critique>'];

export function detectPromptLeakage(content: string): boolean {
  return LEAKAGE_MARKERS.some(marker => content.includes(marker));
}

export const LATENCY_BENCHMARKS = {
  multiCycle: { warning: 45000, fail: 60000 },
  standard:   { warning: 15000, fail: 25000 },
} as const;

/**
 * Model configuration type
 */
export type ModelConfigType = {
  model: string;
};

/**
 * Pipeline state during execution
 */
interface PipelineState {
  userQuery: string;
  config: ModelConfigType;
  scenarioId?: string;
  anonymizedQuery: string;
  entityMap: Map<string, SensitiveEntity>;
  aiResponse: string;
  finalAnswer: string;
  confidenceScore: number;
  validationStatus: 'pending' | 'approved' | 'rejected';
  retryCount: number;
  serverValidation: ServerValidation | null;
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
 * Step 1: Anonymization is now handled server-side in sentinel-analysis.
 * Pass raw query through so the server can anonymize it.
 */
function stepAnonymize(state: PipelineState): PipelineState {
  console.log('Pipeline: Skipping client-side anonymization (server handles it)');
  return {
    ...state,
    anonymizedQuery: state.userQuery,
    entityMap: new Map(),
    confidenceScore: 1.0,
  };
}

/**
 * Step 2: AI Reasoning via Edge Function
 * Extracts server-side validation from the response when available.
 */
async function stepReasoning(state: PipelineState): Promise<PipelineState> {
  const { model } = state.config;

  console.log(`🧠 Pipeline: AI Reasoning (model: ${model})`);

  const { data, error } = await supabase.functions.invoke('sentinel-analysis', {
    body: {
      systemPrompt: EXOS_SYSTEM_PROMPT,
      userPrompt: state.anonymizedQuery,
      googleModel: model,
      enableTestLogging: false,
      scenarioId: state.scenarioId,
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

  // Extract server-side validation if present
  const serverValidation: ServerValidation | null = data?.validation || null;
  if (serverValidation) {
    console.log(`✅ Pipeline: Server validation received (passed: ${serverValidation.passed}, confidence: ${serverValidation.confidenceScore}, issues: ${serverValidation.issues.length})`);
  }

  console.log('✅ Pipeline: Received AI response');

  return {
    ...state,
    aiResponse: responseContent,
    serverValidation,
  };
}

/**
 * Step 3: Validate response
 * Runs client-side token integrity check, then merges with server validation.
 */
function stepValidate(state: PipelineState): PipelineState {
  console.log('⚖️ Pipeline: Validating response...');

  const maskedTokens = Array.from(state.entityMap.keys());

  // Run client-side token integrity check (needs local entity map)
  const tokenIssues = checkTokenIntegrity(maskedTokens, state.aiResponse);

  // Merge server validation with client-side token issues
  const validationResult = mergeValidationResults(state.serverValidation, tokenIssues);

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
 * Step 4: Deanonymization is now handled server-side.
 * The AI response is already deanonymized by the edge function.
 */
function stepDeanonymize(state: PipelineState): PipelineState {
  console.log('Pipeline: Skipping client-side deanonymization (server already did it)');
  return {
    ...state,
    finalAnswer: state.aiResponse,
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
  config: ModelConfigType,
  scenarioId?: string
): Promise<{
  finalAnswer: string;
  confidenceScore: number;
  validationStatus: 'pending' | 'approved' | 'rejected';
  retryCount: number;
}> {
  const isMultiCycle = scenarioId ? isDeepAnalyticsScenario(scenarioId) : false;
  console.log(`🚀 Pipeline: Starting (scenarioId: ${scenarioId || 'none'}, multiCycle: ${isMultiCycle})`, config);
  
  // Log tracing config on first run
  if (isTracingEnabled()) {
    logTracingConfig();
  }

  // Start parent trace for entire pipeline
  const parentRunId = await startPipelineTrace("EXOS_Deep_Analysis", {
    userQuery,
    config,
    scenarioId,
    isMultiCycle,
  });

  // Initialize state
  let state: PipelineState = {
    userQuery,
    config,
    scenarioId,
    anonymizedQuery: '',
    entityMap: new Map(),
    aiResponse: '',
    finalAnswer: '',
    confidenceScore: 0,
    validationStatus: 'pending',
    retryCount: 0,
    serverValidation: null,
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
          hasServerValidation: !!state.serverValidation,
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
