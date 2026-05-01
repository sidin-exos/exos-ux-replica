/**
 * Shared PII Sanitizer for Edge Functions
 *
 * Two modes:
 * 1. One-way masking (sanitizeMessages) — replaces PII with generic tokens.
 *    Used by scenario-chat-assistant where no restoration is needed.
 * 2. Reversible anonymization (anonymizeText / deanonymizeText) — replaces PII
 *    with unique indexed tokens and returns an entity map for restoration.
 *    Used by sentinel-analysis where the AI response must be deanonymized.
 *
 * Ported from src/lib/sentinel/anonymizer.ts (regex patterns only).
 */

// ============================================================================
// TYPES (for reversible anonymization)
// ============================================================================

export type EntityType =
  | "company"
  | "person"
  | "price"
  | "contract"
  | "location"
  | "date"
  | "percentage"
  | "email"
  | "phone"
  | "iban"
  | "credit_card"
  | "tax_id"
  | "custom";

export interface SensitiveEntityServer {
  id: string;
  type: EntityType;
  originalValue: string;
  maskedToken: string;
  context?: string;
}

/** JSON-serializable (Record, not Map) so it can be logged to test_prompts/test_reports */
export interface AnonymizationResultServer {
  anonymizedText: string;
  entityMap: Record<string, SensitiveEntityServer>;
  metadata: {
    entitiesFound: number;
    processingTimeMs: number;
    confidence: number;
  };
}

export interface DeanonymizationResultServer {
  restoredText: string;
  metadata: {
    entitiesRestored: number;
    unmappedTokens: string[];
  };
}

// ============================================================================
// ONE-WAY MASKING (unchanged — used by scenario-chat-assistant)
// ============================================================================

const PII_PATTERNS: { token: string; patterns: RegExp[] }[] = [
  {
    token: "[EMAIL]",
    patterns: [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    ],
  },
  {
    token: "[IBAN]",
    patterns: [
      /[A-Z]{2}\d{2}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]?\d{0,8}/g,
      /[A-Z]{2}\d{2}[A-Z0-9]{10,30}/g,
    ],
  },
  {
    token: "[CREDIT_CARD]",
    patterns: [
      /(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})/g,
    ],
  },
  {
    token: "[PHONE]",
    patterns: [
      /(?!\d{4}-\d{2}-\d{2})\+?\d{2,3}[\s.-]?\d{1,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}\b/g,
      /\b0\d{2,4}[\s./-]?\d{3,8}\b/g,
    ],
  },
  {
    token: "[TAX_ID]",
    patterns: [
      /\b[A-Z]{2}[0-9A-Z]{8,12}\b/g,
      /\b[1-9]\d?-\d{7}\b/g,
    ],
  },
  {
    token: "[COMPANY]",
    patterns: [
      /\b[\w]+(?:\s+[\w]+)*\s+(?:Inc|LLC|Ltd|GmbH|Corp|Co|S\.A\.|NV|Pty|AG|PLC)\.?\b/gi,
    ],
  },
  {
    token: "[PRICE]",
    patterns: [
      /[$€£][\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|M|B|k|K))?/g,
      /[\d,]+(?:\.\d{2})?\s*(?:USD|EUR|GBP|CHF)/g,
    ],
  },
];

// Common terms that should never be masked
const SKIP_TERMS = new Set([
  "invoice", "contract", "agreement", "total", "subtotal",
  "vendor", "supplier", "client", "manager", "bank",
  "payment", "amount", "purchase", "order",
]);

function sanitizeText(text: string): string {
  let result = text;
  for (const { token, patterns } of PII_PATTERNS) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      result = result.replace(pattern, (match) => {
        if (match.length < 3) return match;
        if (SKIP_TERMS.has(match.toLowerCase())) return match;
        return token;
      });
    }
  }
  return result;
}

/**
 * Sanitize an array of chat messages, masking PII in user content only.
 * Assistant messages are left untouched.
 */
export function sanitizeMessages(
  messages: { role: string; content: string }[]
): { role: string; content: string }[] {
  return messages.map((msg) => {
    if (msg.role !== "user") return msg;
    return { ...msg, content: sanitizeText(msg.content) };
  });
}

// ============================================================================
// REVERSIBLE ANONYMIZATION (used by sentinel-analysis)
// ============================================================================

// Full entity patterns ported from src/lib/sentinel/anonymizer.ts
const REVERSIBLE_ENTITY_PATTERNS: Record<EntityType, RegExp[]> = {
  company: [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|LLC|Ltd|Corp|GmbH|SA|AG|PLC|Co)\.?))\b/g,
    /\b([A-Z]{2,}(?:\s+[A-Z]{2,})*)\b/g,
    /\b[\w]+(?:\s+[\w]+)*\s+(?:Inc|LLC|Ltd|GmbH|Corp|Co|S\.A\.|NV|Pty|AG|PLC)\.?\b/gi,
    /(?<=(?:Vendor|Supplier|Client|Partner|Counterparty|Customer|Contractor|Subcontractor):\s*)[\w]+(?:\s+[\w]+)*/gi,
  ],
  person: [
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g,
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
    /\b[A-Z]{2,4}-\d{4,}-\d{2,}\b/g,
  ],
  location: [
    /\b\d{5}(?:-\d{4})?\b/g,
    /\b[A-Z][a-z]+(?:,\s*[A-Z]{2})?\b/g,
  ],
  date: [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    /\b\d{4}-\d{2}-\d{2}\b/g,
  ],
  percentage: [
    /\b\d+(?:\.\d+)?%/g,
  ],
  email: [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  ],
  phone: [
    /(?!\d{4}-\d{2}-\d{2})\+?\d{2,3}[\s.-]?\d{1,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}\b/g,
    /\b0\d{2,4}[\s./-]?\d{3,8}\b/g,
  ],
  iban: [
    /[A-Z]{2}\d{2}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]?\d{0,8}/g,
    /[A-Z]{2}\d{2}[A-Z0-9]{10,30}/g,
  ],
  credit_card: [
    /(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})/g,
  ],
  tax_id: [
    /\b[A-Z]{2}[0-9A-Z]{8,12}\b/g,
    /\b[1-9]\d?-\d{7}\b/g,
  ],
  custom: [],
};

// Token prefixes for each entity type
const TOKEN_PREFIXES: Record<EntityType, string> = {
  company: "SUPPLIER",
  person: "CONTACT",
  price: "AMOUNT",
  contract: "CONTRACT_REF",
  location: "LOCATION",
  date: "DATE_REF",
  percentage: "PERCENT",
  email: "CONTACT_EMAIL",
  phone: "PHONE",
  iban: "BANK_ACCT",
  credit_card: "CC_NUM",
  tax_id: "TAX_ID",
  custom: "ENTITY",
};

// Common business terms that should never be masked (false positive protection).
// Includes regulatory/compliance standards, currencies, and common acronyms that
// the all-caps regex (line ~156) would otherwise treat as supplier names — e.g.
// "ISO 27001" rendering as "[SUPPLIER_C] 27001" in the output. The deanonymizer
// has no way to recover these because they were never real PII to begin with.
const COMMON_BUSINESS_TERMS = new Set([
  "invoice", "contract", "agreement", "total", "subtotal",
  "date", "vendor", "supplier", "client", "manager",
  "director", "chief", "officer", "bank", "swift",
  "iban", "payment", "due", "amount", "reference",
  "purchase", "order", "quote", "proposal", "estimate",
  "receipt", "statement", "balance", "credit", "debit",
  "tax", "vat", "net", "gross", "fee", "charge",
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
  "monday", "tuesday", "wednesday", "thursday", "friday",
  "saturday", "sunday",
  // Regulatory standards & compliance frameworks (NEVER tokenise)
  "iso", "gdpr", "soc2", "soc", "hipaa", "pci", "pci-dss", "dss",
  "nis2", "nis", "tupe", "ccpa", "fcpa", "sox", "ferpa", "glba",
  "iec", "ansi", "nist", "fedramp", "itar", "ear", "rohs", "reach",
  "cmmc", "fips", "csa", "owasp", "cis", "cobit", "itil", "togaf",
  "asme", "din", "bs", "en", "ul", "ce", "fcc", "etsi", "ieee",
  // Common business acronyms
  "rfp", "rfi", "rfq", "sow", "sla", "kpi", "mou", "nda", "lol",
  "tco", "roi", "npv", "irr", "ebitda", "capex", "opex", "p&l",
  "msp", "mssp", "saas", "paas", "iaas", "iot", "ai", "ml", "api",
  "ceo", "cto", "cfo", "coo", "cio", "ciso", "vp", "svp", "evp",
  // Currencies & units (caught by all-caps regex)
  "eur", "usd", "gbp", "chf", "jpy", "cny", "cad", "aud", "nok", "sek",
  "ltd", "llc", "inc", "gmbh", "ag", "plc", "sa", "bv", "nv", "spa",
  // EXOS/internal placeholders & dimensions
  "kg", "mt", "tco", "tb", "gb", "mb", "ghz", "mhz", "dpo", "dso", "dio",
  // Geographic regions/blocs commonly all-caps
  "eu", "us", "uk", "uae", "apac", "emea", "latam", "asean", "mena",
]);

/** Generate a unique masked token for an entity */
function generateMaskedToken(type: EntityType, index: number): string {
  const prefix = TOKEN_PREFIXES[type];
  const letter = String.fromCharCode(65 + (index % 26)); // A-Z
  const number = Math.floor(index / 26) + 1;
  return `[${prefix}_${letter}${number > 1 ? number : ""}]`;
}

/** Extract surrounding context for better restoration debugging */
function extractContext(text: string, matchIndex: number, matchLength: number): string {
  const contextRadius = 50;
  const start = Math.max(0, matchIndex - contextRadius);
  const end = Math.min(text.length, matchIndex + matchLength + contextRadius);
  return text.slice(start, end);
}

/** Calculate dynamic confidence score based on analysis quality */
function calculateConfidenceServer(
  text: string,
  entityMap: Record<string, SensitiveEntityServer>
): number {
  let confidence = 1.0;

  const types = new Set(Object.values(entityMap).map((e) => e.type));
  const entityCount = Object.keys(entityMap).length;

  // Low Density Penalty: long text with few entities suggests missed detections
  if (text.length > 500 && entityCount < 2) {
    confidence -= 0.15;
  }

  // Missing Actor Penalty: transactions without identifiable parties
  const hasTransaction =
    types.has("contract") || types.has("price") || types.has("iban") || types.has("credit_card");
  const hasActor = types.has("company") || types.has("person");
  if (hasTransaction && !hasActor) {
    confidence -= 0.2;
  }

  // PII Mismatch Penalty: email without associated person
  if (types.has("email") && !types.has("person")) {
    confidence -= 0.05;
  }

  return Math.max(0.1, Math.min(1.0, confidence));
}

// "price" was previously included but removed: financial amounts (€8.5M, $1.2K)
// are not personally identifying — they're commercial figures the AI needs to
// compute TCO/NPV/cost analyses. Anonymising them broke every Group A scenario
// because the AI received [AMOUNT_A] tokens it couldn't do math on, returning
// `amount: null` everywhere and blanking the Cost Breakdown / TCO dashboards.
// PII proper (names, emails, phones, IBAN, tax IDs, supplier names) is still
// anonymised. The "price" patterns remain available in REVERSIBLE_ENTITY_PATTERNS
// for any caller that explicitly opts in.
const DEFAULT_ENTITY_TYPES: EntityType[] = [
  "company", "person", "contract", "email",
  "phone", "iban", "credit_card", "tax_id",
];

/**
 * Reversible anonymization — replaces PII with unique indexed tokens.
 * Returns entity map for subsequent deanonymization.
 *
 * Deterministic within a single call: same input value always gets the same token.
 *
 * Pass `existingContext` to continue from a prior anonymization's entity map,
 * ensuring the same real-world value gets the same token across multiple texts
 * (e.g. user textarea + attached document content).
 */
export function anonymizeText(
  text: string,
  entityTypes: EntityType[] = DEFAULT_ENTITY_TYPES,
  existingContext?: { entityMap: Record<string, SensitiveEntityServer>; entityIndex: number }
): AnonymizationResultServer {
  const startTime = performance.now();
  const entityMap: Record<string, SensitiveEntityServer> = existingContext
    ? { ...existingContext.entityMap }
    : {};
  let anonymizedText = text;
  let entityIndex = existingContext?.entityIndex ?? 0;

  // Build value→token lookup from existing entity map for consistency
  const valueToToken = new Map<string, string>();
  for (const entity of Object.values(entityMap)) {
    valueToToken.set(entity.originalValue, entity.maskedToken);
  }

  // Collect all matches with their positions
  const allMatches: Array<{
    type: EntityType;
    value: string;
    index: number;
    length: number;
  }> = [];

  for (const entityType of entityTypes) {
    const patterns = REVERSIBLE_ENTITY_PATTERNS[entityType];
    if (!patterns) continue;

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[0].length < 3) continue;
        if (COMMON_BUSINESS_TERMS.has(match[0].toLowerCase())) continue;

        allMatches.push({
          type: entityType,
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
        return false;
      }
    }
    return true;
  });

  for (const match of filteredMatches) {
    let maskedToken: string;

    if (valueToToken.has(match.value)) {
      maskedToken = valueToToken.get(match.value)!;
    } else {
      maskedToken = generateMaskedToken(match.type, entityIndex);
      valueToToken.set(match.value, maskedToken);

      entityMap[maskedToken] = {
        id: `entity_${entityIndex}`,
        type: match.type,
        originalValue: match.value,
        maskedToken,
        context: extractContext(text, match.index, match.length),
      };
      entityIndex++;
    }

    // Replace in text (from end to start avoids index drift)
    anonymizedText =
      anonymizedText.slice(0, match.index) +
      maskedToken +
      anonymizedText.slice(match.index + match.length);
  }

  return {
    anonymizedText,
    entityMap,
    metadata: {
      entitiesFound: Object.keys(entityMap).length,
      processingTimeMs: performance.now() - startTime,
      confidence: calculateConfidenceServer(text, entityMap),
    },
    // Expose next entity index so callers can chain anonymization
    _nextEntityIndex: entityIndex,
  } as AnonymizationResultServer & { _nextEntityIndex: number };
}

/**
 * Deanonymize text by replacing indexed tokens with original values.
 */
export function deanonymizeText(
  anonymizedText: string,
  entityMap: Record<string, SensitiveEntityServer>
): DeanonymizationResultServer {
  let restoredText = anonymizedText;
  const unmappedTokens: string[] = [];
  let entitiesRestored = 0;

  // Find all tokens in the text. Two suffix shapes are valid:
  //   - Original anonymiser: [SUPPLIER_A], [COMPANY_B2]    → _<LETTER><digits?>
  //   - AI-introduced [ALT_*] namespace: [ALT_SUPPLIER_1]  → _<digits>
  const tokenPattern = /\[[A-Z][A-Z_]*_(?:[A-Z]\d*|\d+)\]/g;
  const foundTokens = anonymizedText.match(tokenPattern) || [];
  const uniqueTokens = [...new Set(foundTokens)];

  for (const token of uniqueTokens) {
    const entity = entityMap[token];
    if (entity) {
      restoredText = restoredText.split(token).join(entity.originalValue);
      entitiesRestored++;
    } else {
      unmappedTokens.push(token);
    }
  }

  // Friendly fallback for the AI-generated [ALT_*] namespace and any other
  // unmapped tokens. Without this, alternative-sourcing sections would render
  // raw brackets like "[ALT_SUPPLIER_1]" which look like a leaked placeholder.
  // We convert them to readable labels: "[ALT_SUPPLIER_1]" → "Alternative Supplier 1".
  for (const token of unmappedTokens) {
    const inner = token.slice(1, -1); // strip [ ]
    // Match patterns like ALT_SUPPLIER_1, ALT_PARTNER_2, ALT_VENDOR_3 …
    const altMatch = inner.match(/^ALT_([A-Z]+)_(\d+)$/);
    if (altMatch) {
      const noun = altMatch[1].charAt(0) + altMatch[1].slice(1).toLowerCase();
      const friendly = `Alternative ${noun} ${altMatch[2]}`;
      restoredText = restoredText.split(token).join(friendly);
      continue;
    }
    // Generic single-letter unmapped token (e.g. [SUPPLIER_Z] the AI invented)
    // Convert "[SUPPLIER_Z]" → "Supplier Z" so the report stays readable.
    const generic = inner.match(/^([A-Z]+)_([A-Z]\d*)$/);
    if (generic) {
      const noun = generic[1].charAt(0) + generic[1].slice(1).toLowerCase().replace(/_/g, " ");
      restoredText = restoredText.split(token).join(`${noun} ${generic[2]}`);
    }
  }

  return {
    restoredText,
    metadata: { entitiesRestored, unmappedTokens },
  };
}
