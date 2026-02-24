

# Fix #10: Replace Pipeline IQ Mock Data with Real Aggregation (Views + RPC)

## Status: ✅ IMPLEMENTED

## Architecture

```text
SQL View: pipeline_iq_stats → aggregates test_reports by date → accuracy trend
SQL RPC: get_evolutionary_directives() → extracts redundant fields from shadow_log JSONB
usePipelineIQ.ts hooks → React Query wrappers
TestingPipeline.tsx → real data + loading skeletons + dynamic labels
```

No new tables. Single Source of Truth from `test_reports`.

## What Was Done

1. **Migration 1**: Created `pipeline_iq_stats` view + `get_evolutionary_directives` RPC
2. **Migration 2**: Set `security_invoker = on` on the view (linter fix)
3. **Hook**: `src/hooks/usePipelineIQ.ts` — `useAccuracyTrend()` + `useEvolutionaryDirectives()`
4. **UI**: Removed `MOCK_ACCURACY_TREND`, `MOCK_DIRECTIVES`, wired real hooks with loading/empty states and dynamic labels
