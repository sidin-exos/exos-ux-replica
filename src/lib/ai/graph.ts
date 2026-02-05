/**
 * EXOS Decision Workflow - Lightweight Orchestrator
 * 
 * Replaces LangGraph with a simple async pipeline that:
 * - Uses existing sentinel utilities (anonymizer, validator, deanonymizer)
 * - Routes AI inference through the sentinel-analysis edge function
 * - Implements self-correction loop for validation failures
 * - Supports both Lovable Gateway and Google AI Studio (BYOK)
 */

import { anonymize, DEFAULT_ANONYMIZATION_CONFIG } from '../sentinel/anonymizer';
import { deanonymize } from '../sentinel/deanonymizer';
import { validateResponse } from '../sentinel/validator';
import type { SensitiveEntity } from '../sentinel/types';
import { supabase } from '@/integrations/supabase/client';

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

  // Step 1: Anonymize
  state = stepAnonymize(state);

  // Retry loop for reasoning + validation
  while (state.retryCount <= MAX_RETRIES) {
    // Step 2: AI Reasoning
    state = await stepReasoning(state);

    // Step 3: Validate
    state = stepValidate(state);

    if (state.validationStatus === 'approved') {
      break;
    }

    if (state.retryCount >= MAX_RETRIES) {
      console.log('⚠️ Pipeline: Max retries reached, proceeding with best effort');
      break;
    }

    console.log(`🔄 Pipeline: Retry ${state.retryCount}/${MAX_RETRIES}`);
  }

  // Step 4: Deanonymize
  state = stepDeanonymize(state);

  console.log(`🏁 Pipeline: Complete (status: ${state.validationStatus}, retries: ${state.retryCount})`);

  return {
    finalAnswer: state.finalAnswer,
    confidenceScore: state.confidenceScore,
    validationStatus: state.validationStatus,
    retryCount: state.retryCount,
  };
}
