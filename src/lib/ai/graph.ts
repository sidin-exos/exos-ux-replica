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
  scenarioId?: string;
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
