

# Client-Side LangSmith Tracing Implementation

## Problem Statement

The `langsmith` SDK's `traceable` function cannot run in browsers because it depends on `AsyncLocalStorage` from `node:async_hooks` - a Node.js-only module. This is a **known limitation** confirmed by the LangChain team (GitHub issue #81, #879).

**Error encountered:**
```
"AsyncLocalStorage" is not exported by "__vite-browser-external", 
imported by "node_modules/langsmith/dist/traceable.js"
```

---

## Solution: Use LangSmith REST API Directly

Instead of using the `traceable` wrapper, we can manually send trace data to LangSmith using their REST API, which is fully browser-compatible.

LangSmith provides two endpoints:
- `POST /runs` - Create a new run (span)
- `PATCH /runs/{id}` - Complete a run with outputs

---

## Implementation Overview

### Architecture

```text
Browser (graph.ts)                    LangSmith EU API
      │                                    │
      ├── Start Parent Run ───────────────►│ POST /runs (EXOS_Deep_Analysis)
      │                                    │
      ├── Start Child: Anonymize ─────────►│ POST /runs (parent_run_id)
      ├── End Child: Anonymize ───────────►│ PATCH /runs/{id}
      │                                    │
      ├── Start Child: Reasoning ─────────►│ POST /runs
      ├── End Child: Reasoning ───────────►│ PATCH /runs/{id}
      │                                    │
      ├── ... (Validate, Deanonymize) ...  │
      │                                    │
      └── End Parent Run ─────────────────►│ PATCH /runs/{id}
```

---

## Files to Create

### 1. LangSmith REST Client
**File:** `src/lib/ai/langsmith-client.ts`

A lightweight browser-compatible client that:
- Reads `VITE_LANGCHAIN_*` environment variables
- Creates runs via `POST /runs`
- Patches runs via `PATCH /runs/{id}`
- Generates unique run IDs using `crypto.randomUUID()`
- Handles parent-child relationships with `parent_run_id`

```typescript
// Key functions
export function isTracingEnabled(): boolean;
export function logTracingConfig(): void;
export async function createRun(options: CreateRunOptions): Promise<string>;
export async function patchRun(runId: string, outputs: object): Promise<void>;
```

---

### 2. Tracing Wrapper for Graph
**File:** `src/lib/ai/trace-utils.ts`

Helper functions to wrap step execution with tracing:

```typescript
// Wraps a step function with before/after tracing
export async function traceStep<T>(
  stepName: string,
  runType: "chain" | "llm",
  inputs: object,
  stepFn: () => T | Promise<T>,
  parentRunId?: string
): Promise<{ result: T; runId: string }>;
```

---

## Files to Modify

### 1. Type Definitions
**File:** `src/vite-env.d.ts`

Add TypeScript declarations for LangSmith environment variables:

```typescript
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
  readonly VITE_LANGCHAIN_TRACING_V2?: string;
  readonly VITE_LANGCHAIN_API_KEY?: string;
  readonly VITE_LANGCHAIN_PROJECT?: string;
  readonly VITE_LANGCHAIN_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### 2. Pipeline Orchestrator
**File:** `src/lib/ai/graph.ts`

Instrument the `runExosGraph` function to:
1. Check if tracing is enabled
2. Create a parent run at start
3. Create child runs for each step (Anonymize, Reasoning, Validate, Deanonymize)
4. Patch runs with outputs when steps complete

---

## Prerequisites (User Action Required)

Before this feature will work, add these secrets in Lovable Cloud:

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `VITE_LANGCHAIN_TRACING_V2` | `true` | Enable tracing |
| `VITE_LANGCHAIN_API_KEY` | `lsv2_...` | Your LangSmith API key |
| `VITE_LANGCHAIN_PROJECT` | `exos-mvp` | Project name in LangSmith |
| `VITE_LANGCHAIN_ENDPOINT` | `https://eu.api.smith.langchain.com` | EU endpoint |

**Security Note:** Exposing the API key to the browser is acceptable for internal/development use. For production, tracing should move server-side.

---

## Expected LangSmith Trace Structure

```text
EXOS_Deep_Analysis (parent chain)
├── Sentinel_Anonymize (chain)
├── AI_Reasoning (llm) - attempt 1
├── Validation_Check (chain) - attempt 1
├── AI_Reasoning (llm) - attempt 2 (if retry)
├── Validation_Check (chain) - attempt 2 (if retry)
└── Deanonymize (chain)
```

---

## Technical Details

### LangSmith REST API Format

**POST /runs:**
```json
{
  "id": "uuid",
  "name": "Sentinel_Anonymize",
  "run_type": "chain",
  "inputs": { "query": "..." },
  "start_time": "2026-02-05T10:00:00Z",
  "session_name": "exos-mvp",
  "parent_run_id": "parent-uuid"
}
```

**PATCH /runs/{id}:**
```json
{
  "outputs": { "result": "..." },
  "end_time": "2026-02-05T10:00:05Z"
}
```

### Key Implementation Points

1. **No External Dependencies**: Uses native `fetch()` API
2. **Background Sends**: Fire-and-forget pattern to not block pipeline
3. **Error Tolerance**: Tracing failures don't break the main pipeline
4. **Hierarchical Traces**: Uses `parent_run_id` to link child runs

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/ai/langsmith-client.ts` | Create | Browser-compatible LangSmith REST client |
| `src/lib/ai/trace-utils.ts` | Create | Tracing wrapper utilities |
| `src/vite-env.d.ts` | Modify | Add TypeScript types for env vars |
| `src/lib/ai/graph.ts` | Modify | Integrate tracing into pipeline |

---

## Verification Steps

1. Add the required secrets in Lovable Cloud
2. Refresh the application
3. Open browser console and check for: `LangSmith Tracing Config: { enabled: true, ... }`
4. Trigger a "Deep Analysis" run from the scenario wizard
5. Navigate to [eu.smith.langchain.com](https://eu.smith.langchain.com)
6. View the `exos-mvp` project to see traces

