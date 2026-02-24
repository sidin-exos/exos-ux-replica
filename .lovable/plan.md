

# Fix #9: Data-Driven Server-Side Validation

## Architecture Overview

```text
BEFORE (current):
  Edge Function → raw content → Client (graph.ts) → hardcoded regex validation → result

AFTER (this fix):
  Edge Function → fetch validation_rules from DB → validate content → return { content, validation }
  Client (graph.ts) → extract server validation → run local checkTokenIntegrity → merge → result
```

## 4 Implementation Steps

---

### Step 1: Database Migration — `validation_rules` Table + Seed Data

Create table with public SELECT RLS (edge function uses service role, but keeping consistent with `market_insights` pattern). Seed with the 7 current hardcoded patterns + 3 scenario-specific rules.

```sql
CREATE TABLE public.validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_type TEXT,  -- NULL = applies to ALL scenarios
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'hallucination_indicator', 'unsafe_content', 'forbidden_pattern',
    'required_section', 'required_keyword', 'token_integrity'
  )),
  pattern TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  suggestion TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.validation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Validation rules are publicly readable"
  ON public.validation_rules FOR SELECT USING (true);
```

**Seed data** (10 rows):
- 4 hallucination indicators from current `HALLUCINATION_INDICATORS` (severity: medium)
- 3 unsafe content patterns from current `UNSAFE_PATTERNS` (severity: critical)
- `tco-analysis` → required_keyword: `total cost of ownership|TCO`
- `cost-breakdown` → required_section: `cost breakdown|cost analysis|cost structure`
- `risk-assessment` → required_section: `risk matrix|risk assessment|risk mitigation`

---

### Step 2: Edge Function — `supabase/functions/sentinel-analysis/index.ts`

Add a server-side validation stage that runs after LLM inference. Changes at 3 points:

**A. New helper function `runServerValidation()`** (after `buildMarketIntelligenceXML`):
- Takes `content: string`, `scenarioType: string`, `supabase` client
- Fetches active rules: `WHERE (scenario_type = $scenarioType OR scenario_type IS NULL) AND is_active = true`
- Runs each rule's regex `pattern` against the content
- Computes `issues[]`, `passed`, `confidenceScore` (same deduction math as current client)
- Returns `{ passed, confidenceScore, issues: { rule_type, severity, description, match }[] }`

**B. Multi-cycle path** (line ~648-681):
- After getting `finalContent` from Synthesizer, call `runServerValidation(finalContent, scenarioType, supabase)`
- Store validation result in `test_reports.validation_result` JSONB column
- Include `validation` object in the JSON response

**C. Single-pass paths** (Google AI Studio ~772-799, Gateway ~954-977):
- After extracting `content`, call `runServerValidation(content, scenarioType, supabase)`
- Store validation result in `test_reports.validation_result`
- Include `validation` object in the JSON response

**Response shape change** — all paths now return:
```json
{
  "content": "...",
  "validation": {
    "passed": true,
    "confidenceScore": 0.92,
    "issues": [
      { "rule_type": "hallucination_indicator", "severity": "medium", "description": "...", "match": "..." }
    ]
  },
  ...existing fields...
}
```

---

### Step 3: Client Validator — `src/lib/sentinel/validator.ts`

- **DELETE** `HALLUCINATION_INDICATORS` array (lines 21-26)
- **DELETE** `UNSAFE_PATTERNS` array (lines 31-35)
- **DELETE** `checkForHallucinations()` function (lines 77-95)
- **DELETE** `checkForUnsafeContent()` function (lines 100-118)
- **KEEP** `checkTokenIntegrity()` — this needs the client-side entity map
- **KEEP** `matchGoldenCases()` (already returns `[]`)
- **KEEP** `calculateConfidenceScore()` (already fixed in Fix #8)

**NEW export** — `mergeValidationResults()`:
```typescript
export interface ServerValidation {
  passed: boolean;
  confidenceScore: number;
  issues: Array<{ rule_type: string; severity: string; description: string; match?: string }>;
}

export function mergeValidationResults(
  serverValidation: ServerValidation | null,
  clientTokenIssues: ValidationIssue[]
): ValidationResult {
  // Combine server issues (converted to ValidationIssue format) + client token issues
  // Recalculate confidence from merged issues
  // Return unified ValidationResult
}
```

**UPDATE** `validateResponse()` — add optional `serverValidation` parameter. When provided, skip local hallucination/unsafe checks (they ran server-side) and only run `checkTokenIntegrity`. Then merge via `mergeValidationResults`.

---

### Step 4: Client Orchestrator — `src/lib/ai/graph.ts`

**A. Extend `PipelineState`** (line 71):
```typescript
interface PipelineState {
  ...existing fields...
  serverValidation: ServerValidation | null;  // NEW
}
```

**B. Update `stepReasoning()`** (line 119):
- Extract `data.validation` from edge function response
- Store in `state.serverValidation`

**C. Update `stepValidate()`** (line 164):
- Run `checkTokenIntegrity(maskedTokens, state.aiResponse)` locally
- Call `mergeValidationResults(state.serverValidation, tokenIssues)` to get final result
- Use merged result for `validationStatus` and `confidenceScore`
- If validation fails, trigger existing retry loop (unchanged)

**D. Update import** — import `mergeValidationResults`, `checkTokenIntegrity`, `ServerValidation` from validator instead of `validateResponse`

---

## Files Changed

| # | File | Type | Summary |
|---|---|---|---|
| 1 | New migration | DB | Create `validation_rules` + seed 10 rows |
| 2 | `supabase/functions/sentinel-analysis/index.ts` | Edge Fn | Fetch rules, validate, store in `test_reports`, return in response |
| 3 | `src/lib/sentinel/validator.ts` | Client | Remove hardcoded patterns, add `mergeValidationResults()` |
| 4 | `src/lib/ai/graph.ts` | Client | Extract server validation, merge with local token checks |

## What Does NOT Change
- `useSentinel.ts` — not the active orchestrator (per your correction)
- `orchestrator.ts` — not the active orchestrator
- `checkTokenIntegrity()` — stays client-side (needs entity map)
- `matchGoldenCases()` / `calculateConfidenceScore()` — already cleaned in Fix #8
- Retry loop logic in `graph.ts` — unchanged, just driven by merged validation now

## Risk Assessment
- **Low risk**: The `validation_rules` fetch adds ~10ms (single indexed query)
- **Low risk**: Existing `test_reports.validation_result` column is already JSONB — we just start populating it
- **Medium risk**: All 3 response paths (multi-cycle, Google, Gateway) need the validation injection — must not miss any path

