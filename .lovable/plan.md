

## Close the Generate-then-Execute Loop + Pass Persona

### Problem
`LaunchTestBatch` calls `generateAITestData()` to create synthetic data, then stops. It never sends that data through `sentinel-analysis`, so nothing is recorded in `test_prompts`/`test_reports`, and the Session Log stays empty. Additionally, the `persona` selection is not being passed to the generation function.

### Changes (2 files)

**1. `src/lib/ai-test-data-generator.ts`**
- Add `persona?: string` to the `GenerateOptions` interface
- Pass `persona` in the request body to `generate-test-data`

**2. `src/components/testing/LaunchTestBatch.tsx`**
- Import `supabase` client and `useModelConfig` hook
- Import `useQueryClient` from `@tanstack/react-query` for cache invalidation
- Add a `phase` state (`"idle" | "generating" | "analyzing"`) replacing the boolean `isRunning`
- Update `handleLaunch` to a two-phase flow:
  - **Phase 1 ("Generating..."):** Call `generateAITestData()` with `persona` included in the options. On failure, toast error and stop.
  - **Phase 2 ("Analyzing..."):** Call `supabase.functions.invoke('sentinel-analysis', ...)` with the generated data, passing `scenarioType`, `scenarioData`, `industrySlug`, `categorySlug`, `serverSideGrounding: true`, `enableTestLogging: true`, and the current `model` from `ModelConfigContext`.
  - On success, toast with generation score + token count from the sentinel response.
  - On failure in Phase 2, toast the error but note Phase 1 succeeded.
  - Invalidate `["test-prompts", ...]` and `["test-stats", ...]` queries so the Session Log and Stats Cards auto-refresh.
- Update button text: `"Generating..."` / `"Analyzing..."` / `"Launch Test"` based on `phase`

### UX Flow After Fix

```text
User clicks "Launch Test"
  Phase 1: generate-test-data (synthetic input created, persona applied)
    Button shows "Generating..."
  Phase 2: sentinel-analysis (input analyzed, logged to DB)
    Button shows "Analyzing..."
  Toast: "Test complete -- Score: 95 | Tokens: 1,234"
  Session Log auto-refreshes with new entry
```

### What Stays the Same
- Edge functions are unchanged (both already support these parameters)
- Session Log and Stats Cards already read from `test_prompts`/`test_reports` -- they auto-populate once data flows in
- The `userPrompt` sent to `sentinel-analysis` will be a JSON stringification of the generated scenario data (matching how the wizard sends data)

