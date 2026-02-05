/**
 * EXOS Sentinel - Semantic Anonymizer
 * 
 * Component 1: Contextual Masking
 * Transforms raw sensitive data into generic descriptors
 * that preserve semantic meaning without revealing identities.
 */

import type {
  SensitiveEntity,
  AnonymizationResult,
  AnonymizationConfig,
} from './types';

// Default entity patterns for procurement context
const ENTITY_PATTERNS: Record<SensitiveEntity['type'], RegExp[]> = {
  company: [
    // Existing: Capitalized words with legal suffixes (highest precision)
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|LLC|Ltd|Corp|GmbH|SA|AG|PLC|Co)\.?))\b/g,
    // Existing: All-caps company names
    /\b([A-Z]{2,}(?:\s+[A-Z]{2,})*)\b/g,
    // New: Case-insensitive legal suffixes (catches lowercase like "acme ltd", "nvidia gmbh")
    /\b[\w]+(?:\s+[\w]+)*\s+(?:Inc|LLC|Ltd|GmbH|Corp|Co|S\.A\.|NV|Pty|AG|PLC)\.?\b/gi,
    // New: B2B contextual keyword anchors (catches "Vendor: TechSolutions", "Supplier: Acme")
    /(?<=(?:Vendor|Supplier|Client|Partner|Counterparty|Customer|Contractor|Subcontractor):\s*)[\w]+(?:\s+[\w]+)*/gi,
  ],
  person: [
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g, // First Last
    /\b(Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
  ],
  price: [
    /\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|M|B|k|K))?/g,
    /€[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|M|B|k|K))?/g,
    /£[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|M|B|k|K))?/g,
    /[\d,]+(?:\.\d{2})?\s*(?:USD|EUR|GBP|CHF)/g,
  ],
  contract: [
    /\b(?:Contract|Agreement|PO|Purchase Order)[\s#-]*[A-Z0-9-]+\b/gi,
    /\b[A-Z]{2,4}-\d{4,}-\d{2,}\b/g, // Contract IDs like MSA-2024-001
  ],
  location: [
    /\b\d{5}(?:-\d{4})?\b/g, // ZIP codes
    /\b[A-Z][a-z]+(?:,\s*[A-Z]{2})?\b/g, // City, State
  ],
  date: [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    /\b\d{4}-\d{2}-\d{2}\b/g, // ISO dates
  ],
  percentage: [
    /\b\d+(?:\.\d+)?%/g,
  ],
  // Email addresses (RFC-5322 compatible, practical variant)
  // Catches: john.doe@company.com, support+id@service.co.uk
  email: [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  ],
  // Phone numbers - EU-focused formats
  // Catches: +49 30 1234567, +33 1 23 45 67 89, +44 20 7123 4567
  // Also: 0049 30 1234567, 030/1234567, 030-1234567
  // Negative lookahead excludes ISO dates (2024-01-01)
  phone: [
    // International EU format: +XX or 00XX followed by digits with various separators
    /(?!\d{4}-\d{2}-\d{2})\+?\d{2,3}[\s.-]?\d{1,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}\b/g,
    // Local EU format with leading 0: 030 1234567, 030/1234567
    /\b0\d{2,4}[\s./-]?\d{3,8}\b/g,
  ],
  custom: [],
};

// Token prefixes for different entity types
const TOKEN_PREFIXES: Record<SensitiveEntity['type'], string> = {
  company: 'SUPPLIER',
  person: 'CONTACT',
  price: 'AMOUNT',
  contract: 'CONTRACT_REF',
  location: 'LOCATION',
  date: 'DATE_REF',
  percentage: 'PERCENT',
  email: 'CONTACT_EMAIL',
  phone: 'PHONE',
  custom: 'ENTITY',
};

/**
 * Calculate dynamic confidence score based on analysis quality
 * Applies penalties for potential gaps in entity detection
 */
function calculateConfidence(
  text: string,
  entityMap: Map<string, SensitiveEntity>
): number {
  let confidence = 1.0;
  
  // Extract entity types present
  const types = new Set([...entityMap.values()].map(e => e.type));
  
  // Low Density Penalty: long text with few entities suggests missed detections
  if (text.length > 500 && entityMap.size < 2) {
    confidence -= 0.15;
  }
  
  // Missing Actor Penalty: transactions without identifiable parties
  const hasTransaction = types.has('contract') || types.has('price');
  const hasActor = types.has('company') || types.has('person');
  if (hasTransaction && !hasActor) {
    confidence -= 0.20;
  }
  
  // PII Mismatch Penalty: email without associated person
  if (types.has('email') && !types.has('person')) {
    confidence -= 0.05;
  }
  
  // Clamp between 0.1 and 1.0
  return Math.max(0.1, Math.min(1.0, confidence));
}

/**
 * Generate a unique masked token for an entity
 */
function generateMaskedToken(type: SensitiveEntity['type'], index: number): string {
  const prefix = TOKEN_PREFIXES[type];
  const letter = String.fromCharCode(65 + (index % 26)); // A-Z
  const number = Math.floor(index / 26) + 1;
  return `[${prefix}_${letter}${number > 1 ? number : ''}]`;
}

/**
 * Extract context around a match for better restoration
 */
function extractContext(text: string, matchIndex: number, matchLength: number): string {
  const contextRadius = 50;
  const start = Math.max(0, matchIndex - contextRadius);
  const end = Math.min(text.length, matchIndex + matchLength + contextRadius);
  return text.slice(start, end);
}

/**
 * Default anonymization configuration
 */
export const DEFAULT_ANONYMIZATION_CONFIG: AnonymizationConfig = {
  preserveStructure: true,
  maskingStrategy: 'semantic',
  entityTypes: ['company', 'person', 'price', 'contract', 'email', 'phone'],
  customPatterns: [],
};

/**
 * Anonymize sensitive data in procurement text
 * 
 * @param text - Raw input text containing sensitive information
 * @param config - Anonymization configuration
 * @returns AnonymizationResult with masked text and entity mapping
 */
export function anonymize(
  text: string,
  config: Partial<AnonymizationConfig> = {}
): AnonymizationResult {
  const startTime = performance.now();
  const mergedConfig = { ...DEFAULT_ANONYMIZATION_CONFIG, ...config };
  
  const entityMap = new Map<string, SensitiveEntity>();
  let anonymizedText = text;
  let entityIndex = 0;
  
  // Track all matches with their positions to handle overlaps
  const allMatches: Array<{
    type: SensitiveEntity['type'];
    value: string;
    index: number;
    length: number;
  }> = [];
  
  // Find all entities
  for (const entityType of mergedConfig.entityTypes) {
    const patterns = ENTITY_PATTERNS[entityType];
    
    for (const pattern of patterns) {
      // Reset regex state
      pattern.lastIndex = 0;
      
      let match;
      while ((match = pattern.exec(text)) !== null) {
        // Avoid duplicates and very short matches
        if (match[0].length < 3) continue;
        
        allMatches.push({
          type: entityType,
          value: match[0],
          index: match.index,
          length: match[0].length,
        });
      }
    }
  }
  
  // Add custom patterns
  if (mergedConfig.customPatterns) {
    for (const pattern of mergedConfig.customPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        allMatches.push({
          type: 'custom',
          value: match[0],
          index: match.index,
          length: match[0].length,
        });
      }
    }
  }
  
  // Sort by position (descending) to replace from end to start
  allMatches.sort((a, b) => b.index - a.index);
  
  // Remove overlapping matches (keep longer ones)
  const filteredMatches = allMatches.filter((match, i) => {
    for (let j = 0; j < i; j++) {
      const other = allMatches[j];
      if (
        match.index < other.index + other.length &&
        match.index + match.length > other.index
      ) {
        return false; // Overlaps with a previous (longer/earlier) match
      }
    }
    return true;
  });
  
  // Deduplicate by value (same value gets same token)
  const valueToToken = new Map<string, string>();
  
  // Process matches and replace
  for (const match of filteredMatches) {
    let maskedToken: string;
    
    if (valueToToken.has(match.value)) {
      maskedToken = valueToToken.get(match.value)!;
    } else {
      maskedToken = generateMaskedToken(match.type, entityIndex);
      valueToToken.set(match.value, maskedToken);
      
      const entity: SensitiveEntity = {
        id: `entity_${entityIndex}`,
        type: match.type,
        originalValue: match.value,
        maskedToken,
        context: extractContext(text, match.index, match.length),
      };
      
      entityMap.set(maskedToken, entity);
      entityIndex++;
    }
    
    // Replace in text
    anonymizedText = 
      anonymizedText.slice(0, match.index) + 
      maskedToken + 
      anonymizedText.slice(match.index + match.length);
  }
  
  const endTime = performance.now();
  
  return {
    anonymizedText,
    entityMap,
    metadata: {
      entitiesFound: entityMap.size,
      processingTimeMs: endTime - startTime,
      confidence: calculateConfidence(text, entityMap),
    },
  };
}

/**
 * Check if text contains potentially sensitive information
 * Useful for pre-screening before full anonymization
 */
export function containsSensitiveData(
  text: string,
  entityTypes: SensitiveEntity['type'][] = ['company', 'person', 'price']
): boolean {
  for (const entityType of entityTypes) {
    const patterns = ENTITY_PATTERNS[entityType];
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Get a summary of sensitive entities in text without full anonymization
 */
export function detectSensitiveEntities(text: string): Map<SensitiveEntity['type'], string[]> {
  const detected = new Map<SensitiveEntity['type'], string[]>();
  
  for (const [entityType, patterns] of Object.entries(ENTITY_PATTERNS) as [SensitiveEntity['type'], RegExp[]][]) {
    const matches: string[] = [];
    
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (!matches.includes(match[0])) {
          matches.push(match[0]);
        }
      }
    }
    
    if (matches.length > 0) {
      detected.set(entityType, matches);
    }
  }
  
  return detected;
}
