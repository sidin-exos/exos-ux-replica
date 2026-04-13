

## Create `src/hooks/useScenarioDraft.ts`

### Single file to create

`src/hooks/useScenarioDraft.ts` — a pure hook (zero UI/JSX) implementing two-layer draft persistence.

### Implementation

- **Types**: `DraftBlocks = Record<string, string>`, options interface with `scenarioId`, `userId`, `enabled`
- **localStorage helpers**: `saveToLocal`, `loadFromLocal`, `clearFromLocal` — all wrapped in try/catch, never throw
- **`saveDraft(blocks)`**: writes to localStorage immediately, stages blocks in a ref, schedules a 3-second debounced Supabase upsert via `setTimeout`. Skips Supabase if `userId` is null.
- **`loadDraft()`**: checks localStorage first; if empty and authenticated, falls back to Supabase `maybeSingle()` query
- **`clearDraft()`**: clears timeout, removes localStorage key, deletes Supabase row if authenticated
- **Supabase upsert** uses `onConflict: 'user_id,scenario_id'` against the `scenario_drafts` table
- **Cleanup**: `useEffect` clears the debounce timeout on unmount
- **Returns**: `{ saveDraft, clearDraft, loadDraft, isSaving, lastSaved, hasDraft }`
- Uses existing `useDebounce` is NOT used (ref-based debounce instead to avoid re-renders on every keystroke)
- JSONB blocks cast through `unknown` to satisfy Supabase generated types

### What does NOT change
- No existing hooks, components, or files modified
- Hook is not wired into any component yet (that's a later task)

