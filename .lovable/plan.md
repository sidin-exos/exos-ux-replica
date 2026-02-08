

# Create Project Context Snapshot v2

## What

Create a new file `docs/PROJECT_CONTEXT_2026-02-09.md` documenting the current system state after the infrastructure migration and optimization phase. This is a standalone snapshot -- the existing `PROJECT_CONTEXT.md` (code concatenation file) remains untouched.

## File

`docs/PROJECT_CONTEXT_2026-02-09.md` -- new file in the existing `docs/` directory.

## Content

The file will contain the full markdown provided in the request, with the cut-off "Active Components" section completed based on the current codebase state:

```text
# Project EXOS: Context Snapshot (2026-02-09)

## Milestone: Infrastructure Independence & Optimization
Status, Architecture header

## Security & Infrastructure
- Database, RLS Policies (Bronze level), Secrets management

## Performance & Cost Optimization
- Surgical Context Injection (server-side grounding via sentinel-analysis)
- Lazy Loading (RecentQueries refactored to pull model)

## Observability (LangSmith)
- Production Quiet mode, parent/child run hierarchy, metadata captured

## Active Components
1. Sentinel Pipeline:
   - Input: Anonymized User Prompt + Slugs
   - Processing: Edge function fetches industry/category from DB,
     builds grounding XML server-side, calls AI gateway (Lovable or Google AI Studio)
   - Output: Raw AI response returned for client-side validation + de-anonymization
   - Retry: 3 attempts with exponential backoff on 503s

2. Market Intelligence:
   - Perplexity Sonar Pro API via edge function
   - Search filters: recency, domain type

3. Shareable Reports:
   - Security Definer functions for create/get
   - Time-based expiry with opportunistic cleanup

## Edge Functions Inventory
| Function | Purpose |
|----------|---------|
| sentinel-analysis | AI inference with server-side grounding |
| market-intelligence | Perplexity-powered market research |
| generate-market-insights | Market insights generation |
| generate-test-data | Test data factory |

## Key Files Reference
- Pipeline orchestrator: src/lib/ai/graph.ts
- Sentinel types: src/lib/sentinel/types.ts
- LangSmith client (browser): src/lib/ai/langsmith-client.ts
- LangSmith tracer (edge): supabase/functions/_shared/langsmith.ts
- Anonymizer: src/lib/sentinel/anonymizer.ts
- Grounding (client, legacy): src/lib/sentinel/grounding.ts
- Grounding (server, active): built into sentinel-analysis/index.ts
```

## Scope

- One new file only
- No modifications to existing files
- No database or edge function changes

