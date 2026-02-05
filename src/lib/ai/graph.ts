/**
 * EXOS Decision Workflow - LangGraph Architecture
 * 
 * Stateful graph for the decision pipeline with:
 * - Self-correction loops for validation failures
 * - Managed state for anonymization context
 * - LangSmith visualization support
 */

import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { BaseMessage, AIMessage, HumanMessage } from '@langchain/core/messages';
import { anonymize, DEFAULT_ANONYMIZATION_CONFIG } from '../sentinel/anonymizer';
import { deanonymize } from '../sentinel/deanonymizer';
import { validateResponse } from '../sentinel/validator';
import type { SensitiveEntity } from '../sentinel/types';

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
 * Node 2: Reasoning (Placeholder)
 * Simulates AI processing - will be replaced with actual AI call
 */
async function nodeReasoning(state: ExosState): Promise<Partial<ExosState>> {
  // Placeholder: In production, this calls the edge function or Lovable AI
  // For now, generate a mock response based on the anonymized input
  const mockResponse = `Based on the analysis of the provided context:

## Key Findings
- The scenario involves ${state.anonymizedQuery.includes('[SUPPLIER_') ? 'supplier evaluation' : 'procurement analysis'}
- Confidence level: ${(state.confidenceScore * 100).toFixed(0)}%

## Recommendations
1. Review the masked entities for accuracy
2. Consider market benchmarks for validation
3. Proceed with structured negotiation approach

## Next Steps
- Validate findings against industry standards
- Prepare stakeholder communication`;

  return {
    messages: [new AIMessage(mockResponse)],
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
 */
export async function runExosGraph(userQuery: string): Promise<{
  finalAnswer: string;
  confidenceScore: number;
  validationStatus: 'pending' | 'approved' | 'rejected';
  retryCount: number;
}> {
  const result = await exosGraph.invoke({
    userQuery,
  });

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
