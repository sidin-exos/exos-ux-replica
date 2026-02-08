

# Create Project Context Snapshot for Feb 6th (Apples-to-Apples Comparison)

## What

Create `docs/PROJECT_CONTEXT_2026-02-06.md` using the exact same section structure as the existing `2026-02-09` snapshot, but reflecting the system state as of Feb 6th (derived from the uploaded code concatenation file).

## File

`docs/PROJECT_CONTEXT_2026-02-06.md` -- new file, no existing files modified.

## Key Differences (Feb 6th vs Feb 9th)

The Feb 6th codebase shows a system **before** the optimization phase:

| Area | Feb 6th State | Feb 9th State |
|------|--------------|--------------|
| **Grounding** | Client-side (full XML built in browser, sent as payload) | Server-side (edge function fetches DB + builds XML) |
| **Logging** | Verbose (`console.log` everywhere -- config dumps, routing info, response lengths) | Production Quiet (only `console.error` + retry warnings) |
| **LangSmith** | Active, browser-side client with `logTracingConfig()` exposing endpoint/key presence | Server-side only, verbose logs stripped |
| **Context Injection** | Full grounding XML assembled client-side via `grounding.ts` + `ai-context-templates.ts` | Surgical: edge function fetches only needed rows by slug |
| **Token Usage** | Higher (~60% more per request due to full context in payload + mock data) | Optimized via server-side assembly + mock data removal |
| **RecentQueries** | Eager loading (API calls on page load) | Lazy "Pull" model (load on click) |
| **RLS** | In progress (policies being added) | Hardened (Bronze level) |

## Content (Feb 6th Snapshot)

```text
# Project EXOS: Context Snapshot (2026-02-06)

## Milestone: LangSmith Integration & Pipeline Stabilization
- Status: BETA (Backend + Frontend)
- Architecture: Lovable Managed Supabase + Edge Functions + Client-Side Grounding

## Security & Infrastructure
- Database: Lovable Managed Supabase (shared infrastructure)
- RLS Policies: In Progress (being added incrementally)
- Secrets: API Keys managed in Supabase Edge Secrets
  (Perplexity, Google AI Studio key via BYOK)

## Performance & Cost
- Client-Side Context Injection:
  grounding.ts + ai-context-templates.ts build full XML in browser,
  sent as systemPrompt/userPrompt payload to edge function
- Includes mock historical cases and benchmarks (~500 extra tokens)
- RecentQueries: Eager loading (API calls + traces fired on page load)

## Observability (LangSmith)
- Status: Active (Browser-Side + Server-Side)
- Mode: "Verbose" (console.log for config, routing, response lengths,
  success/skip messages)
- Browser client exposes logTracingConfig() with endpoint/key presence
- Tracing: Parent/Child run hierarchy active

## Active Components
1. Sentinel Pipeline:
   - Input: User prompt anonymized client-side, full grounding XML
     assembled client-side, both sent as payload
   - Processing: Edge function receives pre-built prompts, routes to
     AI gateway (Lovable or Google AI Studio)
   - Output: Raw AI response for client-side validation + de-anonymization
   - Retry: 3 attempts with exponential backoff on 503s

2. Market Intelligence:
   - Perplexity Sonar Pro API via edge function
   - Search filters: recency, domain type

3. Shareable Reports:
   - Security Definer functions for create/get
   - Time-based expiry with opportunistic cleanup

4. graph.ts Pipeline:
   - Self-contained orchestrator with own EXOS_SYSTEM_PROMPT constant
   - Runs anonymize -> reason -> validate -> (retry or deanonymize)
   - Browser-side LangSmith tracing with logTracingConfig()

## Edge Functions Inventory
| Function | Purpose |
|----------|---------|
| sentinel-analysis | AI inference (receives pre-built prompts) |
| market-intelligence | Perplexity-powered market research |
| generate-market-insights | Market insights generation |
| generate-test-data | Test data factory |

## Key Files Reference
- Pipeline orchestrator: src/lib/ai/graph.ts
- Sentinel types: src/lib/sentinel/types.ts
- LangSmith client (browser): src/lib/ai/langsmith-client.ts
- LangSmith tracer (edge): supabase/functions/_shared/langsmith.ts
- Anonymizer: src/lib/sentinel/anonymizer.ts
- Grounding (client, active): src/lib/sentinel/grounding.ts
- Context templates: src/lib/ai-context-templates.ts
```

## Scope

- One new file only
- No modifications to existing files
- No database or edge function changes

