/**
 * EXOS Decision Workflow - LangGraph Architecture
 * 
 * Stateful graph for the decision pipeline with:
 * - Self-correction loops for validation failures
 * - Managed state for anonymization context
 * - Dynamic model configuration (Lovable Gateway / Google AI Studio)
 * - Secure API key handling via edge function proxy
 */

import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { BaseMessage, AIMessage, HumanMessage } from '@langchain/core/messages';
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
 * State Annotation for LangGraph
 * Defines the schema for the agent's memory during a request lifecycle
 */
const ExosStateAnnotation = Annotation.Root({
  // Input
  userQuery: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  
  // Model Configuration
  config: Annotation<ModelConfigType>({
    reducer: (_, next) => next,
    default: () => ({ provider: 'lovable', model: 'gemini-2.0-flash' }),
  }),
  
  // Security Layer
  anonymizedQuery: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  entityMapJson: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '[]',
  }),
  
  // Reasoning
  messages: Annotation<BaseMessage[]>({
    reducer: (current, next) => [...current, ...next],
    default: () => [],
  }),
  
  // Output
  finalAnswer: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  confidenceScore: Annotation<number>({
    reducer: (_, next) => next,
    default: () => 0,
  }),
  
  // Status
  validationStatus: Annotation<'pending' | 'approved' | 'rejected'>({
    reducer: (_, next) => next,
    default: () => 'pending',
  }),
  retryCount: Annotation<number>({
    reducer: (_, next) => next,
    default: () => 0,
  }),
});

/**
 * Type for the state object
 */
export type ExosState = typeof ExosStateAnnotation.State;

/**
 * Helper: Serialize entity Map to JSON string
 */
function serializeEntityMap(entityMap: Map<string, SensitiveEntity>): string {
  return JSON.stringify(Array.from(entityMap.entries()));
}

/**
 * Helper: Deserialize JSON string back to entity Map
 */
function deserializeEntityMap(json: string): Map<string, SensitiveEntity> {
  try {
    const entries = JSON.parse(json) as [string, SensitiveEntity][];
    return new Map(entries);
  } catch {
    return new Map();
  }
}

/**
 * Node 1: Anonymize
 * Calls the existing anonymizer to mask sensitive entities
 */
async function nodeAnonymize(state: ExosState): Promise<Partial<ExosState>> {
  const result = anonymize(state.userQuery, DEFAULT_ANONYMIZATION_CONFIG);
  
  return {
    anonymizedQuery: result.anonymizedText,
    entityMapJson: serializeEntityMap(result.entityMap),
    confidenceScore: result.metadata.confidence,
    messages: [new HumanMessage(result.anonymizedText)],
  };
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

/**
 * Node 2: Reasoning
 * Routes AI inference through the sentinel-analysis edge function
 * Supports both Lovable Gateway and Google AI Studio (BYOK)
 */
async function nodeReasoning(state: ExosState): Promise<Partial<ExosState>> {
  const { provider, model } = state.config;
  const useGoogleAIStudio = provider === 'google_ai_studio';
  
  // Get the anonymized query from the last message
  const lastMessage = state.messages[state.messages.length - 1];
  const userPrompt = typeof lastMessage.content === 'string' 
    ? lastMessage.content 
    : JSON.stringify(lastMessage.content);

  console.log(`🤖 LangGraph: Routing via Edge Function (provider: ${provider}, model: ${model})`);

  // Route through edge function (secure proxy for both providers)
  const { data, error } = await supabase.functions.invoke('sentinel-analysis', {
    body: {
      systemPrompt: EXOS_SYSTEM_PROMPT,
      userPrompt,
      model: useGoogleAIStudio ? undefined : model,
      useGoogleAIStudio,
      googleModel: useGoogleAIStudio ? model : undefined,
      enableTestLogging: false,
    },
  });

  if (error) {
    console.error('🚨 LangGraph: Edge function error', error);
    throw new Error(error.message || 'AI inference failed');
  }

  if (data?.error) {
    console.error('🚨 LangGraph: AI response error', data.error);
    throw new Error(data.error);
  }

  const responseContent = data?.content || data?.result || '';
  
  if (!responseContent) {
    throw new Error('Empty response from AI');
  }

  console.log('✅ LangGraph: Received AI response');

  return {
    messages: [new AIMessage(responseContent)],
  };
}

/**
 * Node 3: Validate
 * Checks AI response for hallucinations and quality
 */
async function nodeValidate(state: ExosState): Promise<Partial<ExosState>> {
  // Get the last AI message
  const lastMessage = state.messages.find(
    (m) => m._getType() === 'ai'
  );
  
  if (!lastMessage) {
    return {
      validationStatus: 'rejected',
      retryCount: state.retryCount + 1,
    };
  }

  const responseText = typeof lastMessage.content === 'string' 
    ? lastMessage.content 
    : JSON.stringify(lastMessage.content);

  // Get masked tokens from entity map
  const entityMap = deserializeEntityMap(state.entityMapJson);
  const maskedTokens = Array.from(entityMap.keys());

  // Use existing validator
  const validationResult = validateResponse(
    responseText,
    state.anonymizedQuery,
    'cost_breakdown', // Default scenario type
    maskedTokens
  );

  // Determine status based on validation
  const hasCriticalIssues = validationResult.issues.some(
    (issue) => issue.severity === 'critical'
  );

  if (hasCriticalIssues || !validationResult.passed) {
    return {
      validationStatus: 'rejected',
      retryCount: state.retryCount + 1,
      confidenceScore: validationResult.confidenceScore,
    };
  }

  return {
    validationStatus: 'approved',
    confidenceScore: validationResult.confidenceScore,
  };
}

/**
 * Node 4: Deanonymize
 * Restores original entity names in the final answer
 */
async function nodeDeanonymize(state: ExosState): Promise<Partial<ExosState>> {
  // Get the last AI message
  const lastAiMessage = [...state.messages]
    .reverse()
    .find((m) => m._getType() === 'ai');

  if (!lastAiMessage) {
    return {
      finalAnswer: 'No response generated.',
    };
  }

  const responseText = typeof lastAiMessage.content === 'string'
    ? lastAiMessage.content
    : JSON.stringify(lastAiMessage.content);

  // Restore entities
  const entityMap = deserializeEntityMap(state.entityMapJson);
  const result = deanonymize(responseText, entityMap);

  return {
    finalAnswer: result.restoredText,
  };
}

/**
 * Routing function: Determines whether to retry or exit
 */
function shouldRetry(state: ExosState): 'node_reasoning' | 'node_deanonymize' {
  const MAX_RETRIES = 3;

  if (state.validationStatus === 'rejected' && state.retryCount < MAX_RETRIES) {
    return 'node_reasoning'; // Loop back for retry
  }

  return 'node_deanonymize'; // Exit to final stage
}

/**
 * Build and compile the EXOS decision graph
 */
const workflow = new StateGraph(ExosStateAnnotation)
  .addNode('node_anonymize', nodeAnonymize)
  .addNode('node_reasoning', nodeReasoning)
  .addNode('node_validate', nodeValidate)
  .addNode('node_deanonymize', nodeDeanonymize)
  .addEdge(START, 'node_anonymize')
  .addEdge('node_anonymize', 'node_reasoning')
  .addEdge('node_reasoning', 'node_validate')
  .addConditionalEdges('node_validate', shouldRetry, {
    node_reasoning: 'node_reasoning',
    node_deanonymize: 'node_deanonymize',
  })
  .addEdge('node_deanonymize', END);

/**
 * Compiled and exported graph
 */
export const exosGraph = workflow.compile();

/**
 * Helper: Run a query through the graph
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
  console.log(`🚀 LangGraph: Starting pipeline with config`, config);
  
  const result = await exosGraph.invoke({
    userQuery,
    config,
  });

  console.log(`🏁 LangGraph: Pipeline complete (status: ${result.validationStatus}, retries: ${result.retryCount})`);

  return {
    finalAnswer: result.finalAnswer,
    confidenceScore: result.confidenceScore,
    validationStatus: result.validationStatus,
    retryCount: result.retryCount,
  };
}

/**
 * Export helpers for external use
 */
export { serializeEntityMap, deserializeEntityMap };
