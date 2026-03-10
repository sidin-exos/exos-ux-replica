/**
 * EXOS Sentinel - Secure Context Restoration
 * 
 * Component 6: De-Anonymizer
 * Restores masked tokens to their original values
 * for final display in the UI dashboard.
 */

import type {
  SensitiveEntity,
  DeAnonymizationResult,
} from './types';

/**
 * Restore anonymized text to its original form
 * 
 * @param anonymizedText - Text containing masked tokens
 * @param entityMap - Map of masked tokens to original entities
 * @returns DeAnonymizationResult with restored text and metadata
 */
export function deanonymize(
  anonymizedText: string,
  entityMap: Map<string, SensitiveEntity>
): DeAnonymizationResult {
  const startTime = performance.now();
  
  let restoredText = anonymizedText;
  const restorationMap = new Map<string, string>();
  const unmappedTokens: string[] = [];
  
  // Find all masked tokens in the text
  const tokenPattern = /\[[A-Z_]+_[A-Z]\d*\]/g;
  const foundTokens = anonymizedText.match(tokenPattern) || [];
  const uniqueTokens = [...new Set(foundTokens)];
  
  // Restore each token
  for (const token of uniqueTokens) {
    const entity = entityMap.get(token);
    
    if (entity) {
      // Replace all occurrences of this token
      restoredText = restoredText.split(token).join(entity.originalValue);
      restorationMap.set(token, entity.originalValue);
    } else {
      unmappedTokens.push(token);
    }
  }
  
  const endTime = performance.now();
  
  return {
    restoredText,
    restorationMap,
    metadata: {
      entitiesRestored: restorationMap.size,
      processingTimeMs: endTime - startTime,
      unmappedTokens,
    },
  };
}

/**
 * Partially restore text, keeping some entities masked
 * Useful for audit logs or reports where some info should remain hidden
 */
export function partialDeanonymize(
  anonymizedText: string,
  entityMap: Map<string, SensitiveEntity>,
  typesToRestore: SensitiveEntity['type'][]
): DeAnonymizationResult {
  const startTime = performance.now();
  
  let restoredText = anonymizedText;
  const restorationMap = new Map<string, string>();
  const unmappedTokens: string[] = [];
  
  // Find all masked tokens
  const tokenPattern = /\[[A-Z_]+_[A-Z]\d*\]/g;
  const foundTokens = anonymizedText.match(tokenPattern) || [];
  const uniqueTokens = [...new Set(foundTokens)];
  
  for (const token of uniqueTokens) {
    const entity = entityMap.get(token);
    
    if (entity && typesToRestore.includes(entity.type)) {
      restoredText = restoredText.split(token).join(entity.originalValue);
      restorationMap.set(token, entity.originalValue);
    } else if (!entity) {
      unmappedTokens.push(token);
    }
    // If entity exists but type not in typesToRestore, leave token as-is
  }
  
  const endTime = performance.now();
  
  return {
    restoredText,
    restorationMap,
    metadata: {
      entitiesRestored: restorationMap.size,
      processingTimeMs: endTime - startTime,
      unmappedTokens,
    },
  };
}

/**
 * Format restored text for display with optional highlighting
 * Returns HTML with spans around restored values
 */
export function formatWithHighlights(
  anonymizedText: string,
  entityMap: Map<string, SensitiveEntity>,
  highlightClass: string = 'restored-entity'
): string {
  let formattedText = anonymizedText;
  
  // Sort tokens by length (descending) to avoid partial replacements
  const tokens = Array.from(entityMap.keys()).sort((a, b) => b.length - a.length);
  
  for (const token of tokens) {
    const entity = entityMap.get(token);
    if (entity) {
      const highlighted = `<span class="${escapeHtml(highlightClass)}" data-entity-type="${escapeHtml(entity.type)}" title="Originally: ${escapeHtml(token)}">${escapeHtml(entity.originalValue)}</span>`;
      formattedText = formattedText.split(token).join(highlighted);
    }
  }
  
  return formattedText;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate that all tokens can be restored before proceeding
 */
export function canFullyRestore(
  anonymizedText: string,
  entityMap: Map<string, SensitiveEntity>
): { canRestore: boolean; missingTokens: string[] } {
  const tokenPattern = /\[[A-Z_]+_[A-Z]\d*\]/g;
  const foundTokens = anonymizedText.match(tokenPattern) || [];
  const uniqueTokens = [...new Set(foundTokens)];
  
  const missingTokens = uniqueTokens.filter(token => !entityMap.has(token));
  
  return {
    canRestore: missingTokens.length === 0,
    missingTokens,
  };
}

/**
 * Create a redacted version for external sharing
 * Replaces all entity values with type-appropriate placeholders
 */
export function createRedactedVersion(
  originalText: string,
  entityMap: Map<string, SensitiveEntity>
): string {
  let redactedText = originalText;
  
  // Sort entities by original value length (descending) to avoid partial replacements
  const entities = Array.from(entityMap.values()).sort(
    (a, b) => b.originalValue.length - a.originalValue.length
  );
  
  for (const entity of entities) {
    const redactionLabel = `[REDACTED ${entity.type.toUpperCase()}]`;
    redactedText = redactedText.split(entity.originalValue).join(redactionLabel);
  }
  
  return redactedText;
}

/**
 * Generate an audit log entry for the de-anonymization process
 */
export function generateAuditLog(
  result: DeAnonymizationResult,
  userId?: string
): Record<string, unknown> {
  return {
    timestamp: new Date().toISOString(),
    userId: userId || 'system',
    action: 'deanonymization',
    entitiesRestored: result.metadata.entitiesRestored,
    unmappedTokens: result.metadata.unmappedTokens,
    processingTimeMs: result.metadata.processingTimeMs,
    tokenTypesRestored: Array.from(result.restorationMap.keys()).map(token => {
      const match = token.match(/\[([A-Z_]+)_/);
      return match ? match[1] : 'unknown';
    }),
  };
}
