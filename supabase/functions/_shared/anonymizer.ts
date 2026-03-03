/**
 * Shared PII Sanitizer for Edge Functions
 * 
 * One-way masking — replaces PII with generic tokens before LLM contact.
 * No entity map or restoration needed since LLM response goes back as-is.
 * 
 * Ported from src/lib/sentinel/anonymizer.ts (regex patterns only).
 */

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
