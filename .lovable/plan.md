

# Create PROJECT_CONTEXT for Feb 9th (Code Concatenation Format)

## What

Create a new file `PROJECT_CONTEXT.md` (root level, replacing the existing one) that concatenates the **current** source code of the same 9 critical files, using the exact same format as the Feb 6th version. This allows apples-to-apples comparison of actual code changes between the two dates.

## Format (Matching Feb 6th Exactly)

```text
# EXOS Project Context - Critical AI Infrastructure Files

> **Generated:** 2026-02-09
> **Purpose:** Concatenated source files for [...]

---

## Table of Contents
1. [AI Pipeline Core]
   - graph.ts
   - langsmith-client.ts
   - trace-utils.ts
2. [Type Definitions]
   - types.ts
3. [UI Components]
   - DeepAnalysisPipeline.tsx
   - DeepAnalysisResult.tsx
   - GenericScenarioWizard.tsx
4. [Edge Functions]
   - sentinel-analysis/index.ts
   - generate-market-insights/index.ts

---

[Each file as ### header + full code in ```typescript fences]

---

## End of PROJECT_CONTEXT.md
*Total files: 9*
*Approximate line count: ~X lines*
```

## Files Included (Same 9 as Feb 6th)

| # | File | Current Lines |
|---|------|--------------|
| 1 | `src/lib/ai/graph.ts` | ~195 |
| 2 | `src/lib/ai/langsmith-client.ts` | ~195 |
| 3 | `src/lib/ai/trace-utils.ts` | ~109 |
| 4 | `src/lib/sentinel/types.ts` | ~192 |
| 5 | `src/components/analysis/DeepAnalysisPipeline.tsx` | ~166 |
| 6 | `src/components/analysis/DeepAnalysisResult.tsx` | ~135 |
| 7 | `src/components/scenarios/GenericScenarioWizard.tsx` | ~866 |
| 8 | `supabase/functions/sentinel-analysis/index.ts` | ~549 |
| 9 | `supabase/functions/generate-market-insights/index.ts` | ~432 |

**Estimated total: ~2,840 lines** (comparable to Feb 6th's ~2,870)

## Key Differences You'll See in the Code

When comparing side-by-side with Feb 6th:

- **sentinel-analysis**: Now contains server-side grounding helpers (`buildIndustryXML`, `buildCategoryXML`, `buildServerGroundedPrompts`) and DB fetching logic -- these did not exist in the Feb 6th version
- **langsmith.ts (edge)**: Now uses a `LangSmithTracer` class with "Production Quiet" logging (only `console.error`) instead of verbose `console.log` statements
- **graph.ts**: Uses `trace-utils.ts` wrappers instead of inline `logTracingConfig()` calls throughout

## Scope

- One new/updated file: `PROJECT_CONTEXT.md` (root)
- Contains only concatenated source code (no summaries)
- No modifications to any source files
- No database or edge function changes
