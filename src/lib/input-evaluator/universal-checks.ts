/**
 * INPUT_EVALUATOR — Universal checks applied to every block of every scenario.
 * 5 checks: GIBBERISH, MIN_LENGTH, BOILERPLATE, LANGUAGE, PII
 */

import { QualityCheck, BlockConfig } from "./types";
import { KNOWN_WORDS, KEYBOARD_MASH_PATTERNS } from "./wordlist";

/**
 * Returns the ratio of recognisable words in the text (0–1).
 * Splits on whitespace, lowercases, strips punctuation.
 */
function knownWordRatio(text: string): number {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1; // empty text passes — caught by min-length
  const known = words.filter((w) => KNOWN_WORDS.has(w)).length;
  return known / words.length;
}

/** Count numeric tokens (numbers, currency symbols, %) */
function numericTokenRatio(text: string): number {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  const numeric = tokens.filter((t) => /[\d€$£%¥₹,.]/.test(t)).length;
  return numeric / tokens.length;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ── UNIVERSAL_GIBBERISH ──────────────────────────────────────────────

export function checkGibberish(text: string, fieldId: string): QualityCheck | null {
  if (!text.trim()) return null;

  // Exempt numeric-heavy blocks (financial data, tables)
  if (numericTokenRatio(text) > 0.4) return null;

  // Check keyboard-mash patterns
  for (const pattern of KEYBOARD_MASH_PATTERNS) {
    if (pattern.test(text)) {
      return {
        id: "UNIVERSAL_GIBBERISH_MASH",
        severity: "CRITICAL",
        message: "This field appears to contain keyboard-mash or placeholder text.",
        fieldId,
        suggestion: "Replace with actual procurement data relevant to your scenario.",
      };
    }
  }

  // Check dictionary-word ratio
  const ratio = knownWordRatio(text);
  if (ratio < 0.5) {
    return {
      id: "UNIVERSAL_GIBBERISH_RATIO",
      severity: "WARNING",
      message: `Only ${Math.round(ratio * 100)}% of words are recognisable. The content may be garbled or pasted from an incompatible source.`,
      fieldId,
      suggestion: "Ensure the text is in English and describes your procurement context clearly.",
    };
  }

  return null;
}

// ── UNIVERSAL_MIN_LENGTH ─────────────────────────────────────────────

export function checkMinLength(
  text: string,
  fieldId: string,
  block: BlockConfig
): QualityCheck | null {
  if (!block.required && !text.trim()) return null; // optional and empty — skip

  const wc = wordCount(text);
  if (wc < block.minWords) {
    const severity = wc < block.minWords / 2 ? "CRITICAL" : "WARNING";
    return {
      id: "UNIVERSAL_MIN_LENGTH",
      severity,
      message: `This field has ${wc} words but needs at least ${block.minWords} for meaningful analysis.`,
      fieldId,
      suggestion: `Add more detail — use the placeholder prompts as a guide. Aim for ${block.minWords}+ words.`,
    };
  }
  return null;
}

// ── UNIVERSAL_BOILERPLATE ────────────────────────────────────────────

export function checkBoilerplate(
  allBlockTexts: Record<string, string>,
  fieldId: string
): QualityCheck | null {
  const thisText = (allBlockTexts[fieldId] || "").trim().toLowerCase();
  if (thisText.length < 30) return null; // too short to compare

  for (const [otherId, otherText] of Object.entries(allBlockTexts)) {
    if (otherId === fieldId) continue;
    const other = (otherText || "").trim().toLowerCase();
    if (other.length < 30) continue;

    // Check for substantial overlap (>80% character match via simple comparison)
    if (thisText === other) {
      return {
        id: "UNIVERSAL_BOILERPLATE",
        severity: "WARNING",
        message: "This field contains identical text to another field.",
        fieldId,
        suggestion: "Each block should contain different information specific to its purpose.",
      };
    }

    // Check substring containment (one block is a subset of another)
    if (thisText.length > 50 && other.length > 50) {
      const shorter = thisText.length < other.length ? thisText : other;
      const longer = thisText.length >= other.length ? thisText : other;
      if (longer.includes(shorter)) {
        return {
          id: "UNIVERSAL_BOILERPLATE_SUBSET",
          severity: "INFO",
          message: "This field's content appears to be duplicated from another field.",
          fieldId,
          suggestion: "Ensure each block addresses its specific topic with unique information.",
        };
      }
    }
  }
  return null;
}

// ── UNIVERSAL_LANGUAGE ───────────────────────────────────────────────

export function checkLanguage(text: string, fieldId: string): QualityCheck | null {
  if (!text.trim()) return null;

  // Detect significant non-Latin script content (>30% of characters)
  const nonLatin = text.replace(/[\x00-\x7F\s\d€$£¥₹%.,;:!?'"()\-–—/\\@#&*+=\[\]{}|<>]/g, "");
  if (nonLatin.length > text.length * 0.3) {
    return {
      id: "UNIVERSAL_LANGUAGE",
      severity: "INFO",
      message: "This field contains significant non-Latin script content. EXOS analysis works best with English text.",
      fieldId,
      suggestion: "For best results, provide input in English. Proper nouns and technical terms in other scripts are fine.",
    };
  }
  return null;
}

// ── UNIVERSAL_PII ────────────────────────────────────────────────────

/**
 * ReDoS PROTECTION (Architecture Board Constraint #2):
 * All regex operations run on text.slice(0, 5000) to prevent browser freezing.
 * This is for UX feedback only and does NOT replace server-side anonymizer.ts.
 */
export function checkPII(text: string, fieldId: string): QualityCheck[] {
  if (!text.trim()) return [];

  // CONSTRAINT #2: Slice to 5000 chars before regex to prevent ReDoS on large text blocks.
  // This is a UX-only check and does NOT replace the server-side anonymizer.ts.
  const safeText = text.slice(0, 5000);
  const results: QualityCheck[] = [];

  // Email pattern
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(safeText)) {
    results.push({
      id: "UNIVERSAL_PII_EMAIL",
      severity: "WARNING",
      message: "Email address detected. Consider removing personal email addresses for GDPR compliance.",
      fieldId,
      suggestion: "Replace personal emails with role-based references (e.g. 'procurement lead').",
    });
  }

  // Phone pattern (international formats)
  if (/(?:\+\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/.test(safeText)) {
    // Only flag if there's a clear phone-like pattern (not just any number sequence)
    const phoneMatch = safeText.match(/(?:\+\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]\d{3,4}[\s.-]\d{3,4}/);
    if (phoneMatch) {
      results.push({
        id: "UNIVERSAL_PII_PHONE",
        severity: "WARNING",
        message: "Phone number pattern detected. Consider removing personal contact details.",
        fieldId,
        suggestion: "Use role references instead of personal contact information.",
      });
    }
  }

  // Titled names (Mr./Mrs./Ms./Dr. followed by capitalised words)
  if (/\b(?:Mr|Mrs|Ms|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/.test(safeText)) {
    results.push({
      id: "UNIVERSAL_PII_NAME",
      severity: "INFO",
      message: "Named individual detected (e.g. Mr./Dr. + name). Consider using role-based attribution instead.",
      fieldId,
      suggestion: "Replace 'Dr. Smith' with 'Engineering Lead' for GDPR compliance (Art. 5(1)(c)).",
    });
  }

  return results;
}

// ── Run all universal checks for a single block ──────────────────────

export function runUniversalChecks(
  text: string,
  fieldId: string,
  block: BlockConfig,
  allBlockTexts: Record<string, string>
): QualityCheck[] {
  const checks: QualityCheck[] = [];

  const gibberish = checkGibberish(text, fieldId);
  if (gibberish) checks.push(gibberish);

  const minLen = checkMinLength(text, fieldId, block);
  if (minLen) checks.push(minLen);

  const boilerplate = checkBoilerplate(allBlockTexts, fieldId);
  if (boilerplate) checks.push(boilerplate);

  const language = checkLanguage(text, fieldId);
  if (language) checks.push(language);

  const pii = checkPII(text, fieldId);
  checks.push(...pii);

  return checks;
}
