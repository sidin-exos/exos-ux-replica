

## Problem

The input evaluator's **gibberish detection** (`UNIVERSAL_GIBBERISH_RATIO` check) fires false positives on legitimate English procurement text. This happens because domain-specific terms, company names, product codes, and abbreviations aren't in the `KNOWN_WORDS` set, causing the "known word ratio" to drop below 50%.

When triggered, it shows:
- **Message**: "Only X% of words are recognisable. The content may be garbled or pasted from an incompatible source."
- **Suggestion**: "Ensure the text is in English and describes your procurement context clearly."

Both are **factually incorrect** (the text IS in English) and **impolite** (implying the user wrote gibberish when they provided quality data).

## Plan

### 1. Raise the gibberish threshold and soften the messaging

**File**: `src/lib/input-evaluator/universal-checks.ts`

- Lower the trigger threshold from `ratio < 0.5` (50%) to `ratio < 0.35` (35%) — legitimate procurement text with domain terms, proper nouns, and codes typically scores 40-60% on this dictionary, so 50% is far too aggressive.
- Rewrite the message to be constructive and respectful:
  - **Message**: `"Some specialised terms weren't recognised by our dictionary — this is normal for domain-specific content and won't affect your analysis."`
  - **Suggestion**: `"No action needed if your input is accurate. Our analysis engine handles industry jargon, product codes, and company names."`
- Downgrade severity from `WARNING` to `INFO` — this should never alarm the user.

### 2. Exempt fields with sufficient word count and numeric content

**File**: `src/lib/input-evaluator/universal-checks.ts`

- Add an early return in `checkGibberish` when the text has 30+ words AND contains numeric data — this pattern strongly indicates real procurement input, not gibberish, even if many words aren't in the dictionary.

### 3. Soften the language check message

**File**: `src/lib/input-evaluator/universal-checks.ts`

- The `UNIVERSAL_LANGUAGE` check (line 145) also has a slightly commanding tone. Rewrite to: `"This field contains non-Latin characters. EXOS produces the most detailed output with English text — proper nouns and technical terms in other scripts work fine."`

