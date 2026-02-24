

# Fix #8: Replace Mocked Sentinel Grounding with Real Data (Option C, Phase 1)

## Summary

Wire the existing `market_insights` table (102 rows) into the `sentinel-analysis` edge function as a third grounding source. Strip all hardcoded mock arrays from client-side `grounding.ts` and `validator.ts`. Fix the confidence score math so it does not penalize when no golden cases exist.

---

## Changes (3 files)

### 1. `supabase/functions/sentinel-analysis/index.ts`

**In the `fetch-context` block (lines 472-490):**
- Add a third query to the existing `Promise.all` that fetches `market_insights`:
  ```typescript
  (industrySlug && categorySlug)
    ? supabase.from("market_insights")
        .select("key_trends, risk_signals, opportunities")
        .eq("industry_slug", industrySlug)
        .eq("category_slug", categorySlug)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null })
  ```
- Log `foundInsight: !!insightResult.data` in the `patchRun` metadata for the `fetch-context` span.

**In `buildServerGroundedPrompts` (lines 208-255):**
- Add a new parameter: `marketInsight: { key_trends: string[]; risk_signals: string[]; opportunities: string[] } | null`
- If `marketInsight` is provided, inject a new XML block into the system prompt's `<grounding-context>`:
  ```xml
  <market-intelligence>
    <key-trends>
      <trend>...</trend>
    </key-trends>
    <risk-signals>
      <signal>...</signal>
    </risk-signals>
    <opportunities>
      <opportunity>...</opportunity>
    </opportunities>
  </market-intelligence>
  ```
- Update the call site (line ~501) to pass the fetched market insight data.

### 2. `src/lib/sentinel/grounding.ts`

- **DELETE** the `MOCK_HISTORICAL_CASES` array (lines ~36-55)
- **DELETE** the `MOCK_BENCHMARKS` array (lines ~61-80)
- **DELETE** the `simulateVectorSearch()` function (lines ~86-100)
- **Refactor** `buildGroundingContext()` to return empty arrays for `historicalCases` and `benchmarks`, with a comment: `// Grounding is handled server-side in the sentinel-analysis edge function`
- **Refactor** `generateGroundedPrompt()`: replace the historical-context and benchmark-context XML sections with a single placeholder:
  ```xml
  <server-side-grounding>Enterprise context, benchmarks, and market insights are securely injected at the Edge layer.</server-side-grounding>
  ```
- Keep `getGroundingMetadata()` and `DEFAULT_GROUNDING_CONFIG` as-is (they're used by other components)

### 3. `src/lib/sentinel/validator.ts`

- **DELETE** the `MOCK_GOLDEN_CASES` array (lines ~18-50)
- **DELETE** the `GoldenCase` import if no longer used
- **Update** `matchGoldenCases()` to immediately return `[]` with a `// TODO (Phase 2): Integrate with DB-backed golden cases` comment
- **CRITICAL MATH FIX** in `calculateConfidenceScore()` (lines ~170-195):
  - Current logic: `score = score * 0.7 + avgSimilarity * 0.3` -- this penalizes when golden cases are empty (avgSimilarity = 0)
  - New logic: if `goldenCaseMatches.length === 0`, skip the weighting entirely and return the score based 100% on structural validation (token integrity, hallucinations, unsafe content checks)
  ```typescript
  if (goldenCaseMatches.length > 0) {
    const avgSimilarity = goldenCaseMatches.reduce((sum, m) => sum + m.similarity, 0) / goldenCaseMatches.length;
    score = score * 0.7 + avgSimilarity * 0.3;
  }
  // else: score relies entirely on structural validation — no penalty
  ```
- Keep all real regex-based validators: `checkTokenIntegrity`, `checkForHallucinations`, `checkForUnsafeContent`

---

## What Stays Untouched (Intentional, Phase 2 Backlog)

| Item | Reason |
|---|---|
| `pgvector` extension | No real vector embeddings to search yet |
| `grounding_cases` / `grounding_benchmarks` tables | Need real procurement case data to seed |
| DB-backed golden cases for validator | Needs a curation workflow first |

---

## Technical Notes

- The `market_insights` table has RLS allowing public SELECT, so the service-role client in the edge function will have access.
- The `key_trends`, `risk_signals`, and `opportunities` columns are `text[]` arrays, so they can be iterated and XML-escaped per element.
- The edge function already deploys automatically -- no manual deployment needed.
- The client-side XML preview components (`FinalXMLPreview`, `MasterXMLPreview`) will show the `<server-side-grounding>` placeholder instead of fake data, which is more honest and protects IP.

