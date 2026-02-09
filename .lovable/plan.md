

# Refactor: Hierarchical LangSmith Tracing for Sentinel Analysis

## Summary

Add 3 child trace spans to the existing `sentinel-analysis` root run, turning the flat trace into a collapsible tree in LangSmith.

## Current State

```text
sentinel-analysis (chain)
  +-- google-ai-studio-call (llm)   OR   ai-gateway-call (llm)
```

## Target State

```text
sentinel-analysis (chain)
  +-- fetch-context (tool)
  +-- assemble-prompt (tool)
  +-- ai-inference (chain)
  |     +-- ai-attempt-1 (llm)
  |     +-- ai-attempt-2 (llm)   [only if retry]
  |     +-- ai-attempt-3 (llm)   [only if retry]
```

## Changes

**Single file:** `supabase/functions/sentinel-analysis/index.ts`

No changes to `_shared/langsmith.ts`, no new files, no DB changes.

### 1. Child Run: `fetch-context` (lines ~208-220)

Wrap the `Promise.all` DB fetch block:

- Create run **before** the fetch with inputs `{ industrySlug, categorySlug }`
- Execute the existing fetch logic unchanged
- Patch run with outputs `{ foundIndustry: boolean, foundCategory: boolean, errors: string[] }`
- Use `try/finally` so the run is always patched, even on throw

### 2. Child Run: `assemble-prompt` (lines ~222-240)

Wrap the `buildServerGroundedPrompts` call:

- Create run before assembly (no sensitive inputs logged)
- Patch with metadata-only outputs: `{ systemPromptLength, userPromptLength, contextPartsCount }` (no prompt text)

### 3. Child Run: `ai-inference` (replaces current flat LLM runs)

**Google AI Studio path (lines ~293-393):**
- Wrap the entire Google block in an `ai-inference` chain run
- The existing `google-ai-studio-call` LLM run becomes a child of `ai-inference` instead of the root
- On fallback to gateway, patch with error and let the gateway path continue under the same `ai-inference` parent

**Lovable Gateway path (lines ~405-456):**
- Wrap the retry loop in the `ai-inference` chain run (reuse the same run if it was already created by the Google path fallback)
- Replace the single `ai-gateway-call` LLM run with per-attempt runs: `ai-attempt-1`, `ai-attempt-2`, `ai-attempt-3`
- Each attempt run is patched with either success outputs or error on failure
- The parent `ai-inference` run is patched after the loop completes

### 4. Error Handling

- All child runs use `try/catch` or `try/finally` to guarantee `patchRun` is called with error details
- The existing top-level `catch` block (line 541) continues to patch the root run on unhandled errors
- No changes to the fire-and-forget semantics of `LangSmithTracer`

## Non-Goals

- No changes to `LangSmithTracer` class (it already supports `parentRunId`)
- No logging of full prompt text in any child run (metadata only)
- No changes to business logic, retry delays, or response format

## Estimated Impact

- ~40 new lines of tracing instrumentation
- Zero changes to request/response contract
- LangSmith will show a 4-level collapsible tree with timing and error attribution per step
