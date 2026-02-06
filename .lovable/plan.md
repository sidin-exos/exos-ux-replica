

# Generate PROJECT_CONTEXT.md

## Overview

I'll create a comprehensive `PROJECT_CONTEXT.md` file concatenating the full contents of the critical AI infrastructure files. Since some requested files don't exist, I'll include the closest equivalents:

| Requested File | Status | Included File |
|---------------|--------|---------------|
| `src/lib/ai/graph.ts` | ✅ Exists | Full content |
| `src/lib/ai/langsmith-client.ts` | ✅ Exists | Full content |
| `src/lib/ai/trace-utils.ts` | ✅ Related | Full content (part of AI infrastructure) |
| `DeepAnalysisWizard.tsx` | ❌ Doesn't exist | Using `GenericScenarioWizard.tsx` + `DeepAnalysisPipeline.tsx` + `DeepAnalysisResult.tsx` |
| `fetch-market-data` | ❌ Doesn't exist | Using `generate-market-insights/index.ts` + `sentinel-analysis/index.ts` |
| `src/types/index.ts` | ❌ Doesn't exist | Using `src/lib/sentinel/types.ts` |

---

## File Structure

```text
PROJECT_CONTEXT.md
├── Header & Description
├── Table of Contents
├── src/lib/ai/graph.ts (304 lines)
├── src/lib/ai/langsmith-client.ts (252 lines)
├── src/lib/ai/trace-utils.ts (109 lines)
├── src/lib/sentinel/types.ts (192 lines)
├── src/components/analysis/DeepAnalysisPipeline.tsx (166 lines)
├── src/components/analysis/DeepAnalysisResult.tsx (135 lines)
├── src/components/scenarios/GenericScenarioWizard.tsx (866 lines)
├── supabase/functions/sentinel-analysis/index.ts (414 lines)
└── supabase/functions/generate-market-insights/index.ts (432 lines)
```

---

## Content Summary

The document will contain:

1. **AI Pipeline Core** (`graph.ts`, `langsmith-client.ts`, `trace-utils.ts`)
   - EXOS Decision Workflow orchestrator
   - Browser-compatible LangSmith REST client with exponential backoff
   - Tracing utilities for pipeline instrumentation

2. **Type Definitions** (`sentinel/types.ts`)
   - Complete type system for Sentinel pipeline
   - Anonymization, grounding, validation, and orchestrator types

3. **UI Components** (DeepAnalysis components + GenericScenarioWizard)
   - Pipeline visualization component
   - Analysis result display with confidence badges
   - Full scenario wizard with form handling and AI integration

4. **Edge Functions** (sentinel-analysis, generate-market-insights)
   - Main AI inference endpoint with retry logic
   - Market intelligence generation with Perplexity integration

---

## Implementation

I will create a single markdown file at `PROJECT_CONTEXT.md` in the project root with:

- Clear section headers using `##` for each file
- Complete file contents in TypeScript code blocks
- No summarization - full raw content as requested
- Line count annotations for reference

