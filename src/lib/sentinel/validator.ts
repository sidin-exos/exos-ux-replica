/**
 * EXOS Sentinel - Reasoning Integrity Validator
 * 
 * Component 5: The Internal Auditor
 * Validates AI responses using a hybrid approach:
 * - Server-side: DB-backed regex rules (hallucination, unsafe content, scenario-specific)
 * - Client-side: Token integrity checks (requires local entity map)
 * 
 * NOTE: Golden case matching is a Phase 2 feature that will use
 * DB-backed golden cases. Currently returns empty matches.
 */

import type {
  ValidationResult,
  ValidationIssue,
  GoldenCaseMatch,
} from './types';

/**
 * Server-side validation result shape returned by the edge function
 */
export interface ServerValidation {
  passed: boolean;
  confidenceScore: number;
  issues: Array<{ rule_type: string; severity: string; description: string; match?: string }>;
}

/**
 * Check if response maintains masked tokens (CLIENT-SIDE ONLY)
 * This must stay client-side because it needs the entity map from anonymization.
 */
export function checkTokenIntegrity(
  originalTokens: string[],
  response: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const token of originalTokens) {
    if (!response.includes(token)) {
      issues.push({
        type: 'inconsistency',
        severity: 'high',
        description: `Masked token ${token} is missing from response`,
        location: token,
        suggestion: `Ensure the response maintains the masked token ${token} without revealing the underlying value`,
      });
    }
  }
  
  // Check for potential token revelation (e.g., "SUPPLIER_A, which is Acme Corp")
  const revelationPattern = /\[([A-Z_]+_[A-Z]\d*)\][,\s]+(?:which is|i\.e\.|namely|specifically)\s+([^,.\n]+)/gi;
  let match;
  while ((match = revelationPattern.exec(response)) !== null) {
    issues.push({
      type: 'unsafe_content',
      severity: 'critical',
      description: `Potential reveal of masked entity: ${match[1]} appears to be associated with "${match[2]}"`,
      location: match[0],
      suggestion: 'Remove any attempts to reveal or guess masked entity values',
    });
  }
  
  return issues;
}

/**
 * Match response against golden cases.
 * TODO (Phase 2): Integrate with DB-backed golden cases table.
 * Currently returns empty array — confidence scoring relies
 * entirely on structural validation checks.
 */
function matchGoldenCases(
  _scenarioType: string,
  _input: string,
  _response: string
): GoldenCaseMatch[] {
  return [];
}

/**
 * Calculate overall confidence score.
 * When no golden cases exist, score relies 100% on structural validation.
 */
function calculateConfidenceScore(
  issues: ValidationIssue[],
  goldenCaseMatches: GoldenCaseMatch[]
): number {
  let score = 1.0;
  
  // Deduct for issues found by structural validators
  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical':
        score -= 0.3;
        break;
      case 'high':
        score -= 0.15;
        break;
      case 'medium':
        score -= 0.08;
        break;
      case 'low':
        score -= 0.03;
        break;
    }
  }
  
  // Only blend in golden case similarity when matches exist
  if (goldenCaseMatches.length > 0) {
    const avgSimilarity = goldenCaseMatches.reduce((sum, m) => sum + m.similarity, 0) / goldenCaseMatches.length;
    score = score * 0.7 + avgSimilarity * 0.3;
  }
  // else: score relies entirely on structural validation — no penalty
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Convert server-side validation issues to client ValidationIssue format
 */
function convertServerIssues(serverIssues: ServerValidation['issues']): ValidationIssue[] {
  return serverIssues.map(issue => ({
    type: issue.rule_type === 'unsafe_content' ? 'unsafe_content' as const
      : issue.rule_type === 'hallucination_indicator' ? 'hallucination' as const
      : 'inconsistency' as const,
    severity: issue.severity as ValidationIssue['severity'],
    description: issue.description,
    location: issue.match,
    suggestion: undefined,
  }));
}

/**
 * Merge server-side validation results with client-side token integrity issues.
 * This is the primary validation entry point when server validation is available.
 */
export function mergeValidationResults(
  serverValidation: ServerValidation | null,
  clientTokenIssues: ValidationIssue[]
): ValidationResult {
  const allIssues: ValidationIssue[] = [...clientTokenIssues];
  
  if (serverValidation) {
    allIssues.push(...convertServerIssues(serverValidation.issues));
  }
  
  // Check against golden cases (empty until Phase 2)
  const goldenCaseMatches = matchGoldenCases('', '', '');
  
  // Calculate confidence from merged issues
  const confidenceScore = calculateConfidenceScore(allIssues, goldenCaseMatches);
  
  // Determine pass/fail
  const hasCriticalIssues = allIssues.some(i => i.severity === 'critical');
  const passed = !hasCriticalIssues && confidenceScore >= 0.6;
  
  return {
    passed,
    confidenceScore,
    issues: allIssues,
    goldenCaseMatches,
  };
}

/**
 * Validate AI response for quality and safety.
 * When serverValidation is provided, skips local hallucination/unsafe checks
 * (they ran server-side) and only runs client-side token integrity.
 */
export function validateResponse(
  response: string,
  originalInput: string,
  scenarioType: string,
  maskedTokens: string[] = [],
  serverValidation?: ServerValidation | null
): ValidationResult {
  // Always run client-side token integrity
  const tokenIssues = checkTokenIntegrity(maskedTokens, response);
  
  if (serverValidation !== undefined) {
    // Server validation available — merge with client token issues only
    return mergeValidationResults(serverValidation, tokenIssues);
  }
  
  // Fallback: no server validation — run everything client-side (legacy path)
  // This should not happen in normal flow but keeps backward compat
  const issues: ValidationIssue[] = [...tokenIssues];
  
  const goldenCaseMatches = matchGoldenCases(scenarioType, originalInput, response);
  const confidenceScore = calculateConfidenceScore(issues, goldenCaseMatches);
  const hasCriticalIssues = issues.some(i => i.severity === 'critical');
  const passed = !hasCriticalIssues && confidenceScore >= 0.6;
  
  return {
    passed,
    confidenceScore,
    issues,
    goldenCaseMatches,
  };
}

/**
 * Get a summary of validation results for logging
 */
export function getValidationSummary(result: ValidationResult): string {
  const issueCountByType = result.issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const goldenCaseVerdicts = result.goldenCaseMatches.reduce((acc, match) => {
    acc[match.verdict] = (acc[match.verdict] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return [
    `Validation ${result.passed ? 'PASSED' : 'FAILED'}`,
    `Confidence: ${(result.confidenceScore * 100).toFixed(1)}%`,
    `Issues: ${JSON.stringify(issueCountByType)}`,
    `Golden Cases: ${JSON.stringify(goldenCaseVerdicts)}`,
  ].join(' | ');
}
