

# Testing Pipeline: Multi-Cycle Awareness Upgrade

## Summary
Add latency benchmarks, prompt leakage detection, cycle-type badges, and adaptive delays to the testing pipeline -- with shared utilities exported from `graph.ts` (no DRY violations).

## Files Changed (5)

### 1. `src/lib/ai/graph.ts` -- Export Shared Utilities

Add after the existing `isDeepAnalyticsScenario` function (line ~47):

```typescript
export const LEAKAGE_MARKERS = ['[PASS]', '[FAIL]', '<draft>', '</draft>', '<critique>', '</critique>'];

export function detectPromptLeakage(content: string): boolean {
  return LEAKAGE_MARKERS.some(marker => content.includes(marker));
}

export const LATENCY_BENCHMARKS = {
  multiCycle: { warning: 45000, fail: 60000 },
  standard:   { warning: 15000, fail: 25000 },
} as const;
```

No other changes to this file.

### 2. `src/components/testing/TestPlanOrchestrator.tsx` -- Execution Logic + Results UI

**Imports:** Add `isDeepAnalyticsScenario`, `detectPromptLeakage`, `LATENCY_BENCHMARKS` from `@/lib/ai/graph`. Add `AlertTriangle` from lucide.

**Extend `ExecutionResult`:**
```typescript
interface ExecutionResult {
  index: number;
  status: "success" | "error";
  error?: string;
  isMultiCycle?: boolean;
  promptLeakage?: boolean;
  processingTimeMs?: number;
  latencyStatus?: "ok" | "warning" | "fail";
}
```

**Update execution loop** (`handleRunPlan`, inside the success branch ~line 162-163):
- Determine `isMultiCycle` via `isDeepAnalyticsScenario(item.scenarioId)`.
- Extract `processingTimeMs` from `data.processing_time_ms`.
- Compute `latencyStatus` using the appropriate benchmark thresholds.
- Run `detectPromptLeakage(data.content)` -- if true, force status to `"error"` with message `"CRITICAL: Auditor prompt leakage detected in final output."` and set `promptLeakage: true`.
- Store all new fields in the result object.

**Update rate-limit delay** (~line 173): Change from fixed `1000ms` to `isDeepAnalyticsScenario(item.scenarioId) ? 3000 : 1000`.

**Update Results Summary UI** (~lines 274-298):
- Add cycle-type badge per result row: purple `"Multi-Cycle (3)"` or gray `"Single-Pass (1)"`.
- Add latency dot indicator: green (ok), yellow (warning), red (fail).
- If `promptLeakage` is true, show a red `"LEAKAGE"` badge.

### 3. `src/components/testing/LaunchTestBatch.tsx` -- Single Test Leakage Check

**Imports:** Add `isDeepAnalyticsScenario`, `detectPromptLeakage` from `@/lib/ai/graph`. Add `Badge` from ui.

**Update success branch** (~lines 127-133):
- After analysis succeeds, check `detectPromptLeakage(analysisResult?.content || "")`.
- If leakage detected: show destructive toast `"CRITICAL: Auditor prompt leakage detected in final output."`.
- Add cycle type to success toast: `"Multi-Cycle (3) | Gen score: X | Tokens: Y"` or `"Single-Pass | Gen score: X | Tokens: Y"`.

### 4. `src/components/testing/TestSessionLog.tsx` -- Multi-Cycle Count Badge

**Imports:** Add `isDeepAnalyticsScenario` from `@/lib/ai/graph`.

**Update date group row** (~line 127-141): After the existing prompts/success/fail badges, add a small purple badge showing how many prompts in the group are multi-cycle. Example: `"2x Multi-Cycle"`. Only rendered if count > 0.

### 5. `src/components/testing/TestStatsCards.tsx` -- Benchmark Context Label

**Imports:** Add `isDeepAnalyticsScenario` from `@/lib/ai/graph`.

**Update "Avg Processing" StatCard** (~line 49): Below the value, conditionally render benchmark context:
- If `scenarioType` is provided and `isDeepAnalyticsScenario(scenarioType)`: show `"(benchmark: 45s)"`.
- Otherwise if `scenarioType` is provided: show `"(benchmark: 15s)"`.
- If no scenario selected: no benchmark shown.

This is done by adding a small `<span>` beneath the StatCard value, not modifying the StatCard component itself.

## Technical Notes

- **Zero duplication**: `detectPromptLeakage`, `LEAKAGE_MARKERS`, and `LATENCY_BENCHMARKS` are exported once from `graph.ts` and imported everywhere.
- **No database changes** -- all frontend-only, reading data already returned by the edge function.
- **Backward compatible** -- `ExecutionResult` new fields are all optional; persisted localStorage results from previous runs still deserialize fine.
- **Rate-limit adjustment**: 3s delay between multi-cycle tests (3 internal LLM calls each) vs 1s for standard.

