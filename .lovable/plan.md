

# Server-Side Multi-Cycle Chain-of-Experts

## Problem with Previous Plan
The original spec orchestrated 3 LLM cycles from the browser (`graph.ts`), causing:
- 3 HTTP round-trips (latency)
- Intermediate AI reasoning (drafts, critiques) exposed in browser Network tab
- Client-side complexity for what should be atomic server logic

## Architecture

```text
CLIENT (graph.ts)                    SERVER (sentinel-analysis/index.ts)
+-----------------------+            +-----------------------------------+
| 1. Anonymize          |            |                                   |
| 2. POST to edge fn    |---HTTP---->| IF isMultiCycle:                  |
|    { ...payload,      |            |   Cycle 1: Analyst Draft          |
|      scenarioId }     |            |   Cycle 2: Auditor Critique       |
|                       |            |   Cycle 3: Synthesizer Final      |
| 3. Receive final only |<---HTTP---| ELSE:                             |
| 4. Validate           |            |   Single-pass inference           |
| 5. Deanonymize        |            +-----------------------------------+
+-----------------------+
```

## Changes

### 1. `src/lib/ai/graph.ts` (Client -- Minimal Changes)

**Add constants** (top of file):
```typescript
export const DEEP_ANALYTICS_SCENARIOS = [
  'tco-analysis', 'cost-breakdown', 'capex-vs-opex',
  'savings-calculation', 'make-vs-buy', 'volume-consolidation',
  'forecasting-budgeting', 'specification-optimizer'
] as const;

export type DeepAnalyticsScenario = typeof DEEP_ANALYTICS_SCENARIOS[number];

export function isDeepAnalyticsScenario(id: string): id is DeepAnalyticsScenario {
  return (DEEP_ANALYTICS_SCENARIOS as readonly string[]).includes(id);
}
```

**Update `runExosGraph` signature** to accept optional `scenarioId`:
```typescript
export async function runExosGraph(
  userQuery: string,
  config: ModelConfigType,
  scenarioId?: string
)
```

**Update `stepReasoning`** to pass `scenarioId` in the edge function payload. This is the ONLY change to the execution flow -- the client still makes one HTTP call and receives the final result:
```typescript
body: {
  ...existingPayload,
  scenarioId,  // edge function uses this for routing
}
```

No new step functions (no `stepCritique`, no `stepSynthesize`). The client is unaware of cycles.

### 2. `src/components/scenarios/GenericScenarioWizard.tsx` (1-line change)

Pass `scenario.id` to `runExosGraph`:
```typescript
const result = await runExosGraph(queryText, graphConfig, scenario.id);
```

### 3. `supabase/functions/sentinel-analysis/index.ts` (Server -- Core Logic)

**Add to `AnalysisRequest` interface:**
```typescript
scenarioId?: string;
```

**Add Deep Analytics constants and prompts** (above main handler):

```typescript
const DEEP_ANALYTICS_SCENARIOS = [
  'tco-analysis', 'cost-breakdown', 'capex-vs-opex',
  'savings-calculation', 'make-vs-buy', 'volume-consolidation',
  'forecasting-budgeting', 'specification-optimizer'
];

const AUDITOR_SYSTEM_PROMPT = `You are a Senior Financial Auditor...
- Verify ALL arithmetic (ROI, NPV, IRR, break-even, payback period)
- Flag missing hidden costs (taxes, depreciation, switching costs, opportunity cost)
- Enforce Hard vs. Soft savings separation
- Check unit consistency (monthly vs. annual, currency alignment)
- Output structured critique with [PASS]/[FAIL] markers per check`;

const SYNTHESIZER_SYSTEM_PROMPT = `You are a Senior Procurement Strategist...
Merge the original analysis draft with the auditor's critique.
Correct any [FAIL] items. Preserve all [PASS] items.
Output only the final polished analysis. Do not include audit markers.`;
```

**Add helper function** `callLLM(systemPrompt, userPrompt, model, tracer, parentRunId, spanName)` to DRY up the existing Google AI Studio / Lovable Gateway call logic into a reusable internal function. This avoids copy-pasting the retry/fallback logic 3 times.

**Add multi-cycle orchestration** after prompt resolution, before the current single inference call:

```typescript
if (DEEP_ANALYTICS_SCENARIOS.includes(scenarioId)) {
  // Cycle 1: Analyst Draft
  const draft = await callLLM(systemPrompt, userPrompt, model, tracer, parentRunId, "Analyst_Draft");

  // Cycle 2: Auditor Critique
  const critiquePrompt = `<draft>\n${draft}\n</draft>\n\n<original-request>\n${userPrompt}\n</original-request>`;
  const critique = await callLLM(AUDITOR_SYSTEM_PROMPT, critiquePrompt, model, tracer, parentRunId, "Auditor_Critique");

  // Cycle 3: Synthesizer
  const synthPrompt = `<draft>\n${draft}\n</draft>\n<critique>\n${critique}\n</critique>\n<original-request>\n${userPrompt}\n</original-request>`;
  const finalContent = await callLLM(SYNTHESIZER_SYSTEM_PROMPT, synthPrompt, model, tracer, parentRunId, "Synthesizer_Final");

  // Return ONLY the final content (drafts/critiques never leave the server)
  return new Response(JSON.stringify({ content: finalContent, model, source, ... }));
}

// ELSE: existing single-pass inference (unchanged)
```

**LangSmith tracing**: Each `callLLM` invocation creates a child span under the parent run, labeled `Analyst_Draft`, `Auditor_Critique`, `Synthesizer_Final`. The parent span gets metadata `{ isMultiCycle: true, cycleCount: 3 }`.

## Security Guarantees
- Intermediate drafts and critiques NEVER leave the edge function boundary
- Browser Network tab shows a single POST/response pair (same as today)
- No client-side looping or retry for multi-cycle scenarios
- Scratchpad reasoning stays server-side only

## What Stays Unchanged
- Client-side anonymization (Step 1) -- PII never leaves the browser
- Client-side validation (Step 3) -- hallucination check on final output
- Client-side deanonymization (Step 4) -- entity restoration after validation
- Standard (non-deep-analytics) scenarios -- completely untouched code path
- Google AI Studio BYOK fallback logic -- reused inside `callLLM`

## Implementation Sequence
1. Add `callLLM` helper to edge function (refactor existing inference into it)
2. Add multi-cycle routing block to edge function
3. Deploy edge function
4. Add constants + `scenarioId` param to `graph.ts`
5. Update wizard to pass `scenario.id`
6. Test end-to-end with a Cost Breakdown scenario

