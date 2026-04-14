

## Problem

In `src/hooks/useScenarioDraft.ts`, `isSavingRef` and `lastSavedRef` are `useRef` values. Mutating refs does not cause React re-renders, so the draft status UI in `GenericScenarioWizard.tsx` (lines 1046-1058) never updates — "Saving...", "Draft saved X ago", and "Draft restored" are effectively dead code.

Additionally, `hasDraft` is computed once during render using `localStorage.getItem()` and never updates reactively.

## Plan

**File: `src/hooks/useScenarioDraft.ts`**

1. Replace `isSavingRef` and `lastSavedRef` with `useState` so changes trigger re-renders.
2. Replace the static `hasDraft` computation with a `useState<boolean>` that updates when drafts are saved, loaded, or cleared.
3. Update all mutation sites (`saveDraft`, `loadDraft`, `clearDraft`) to call the new state setters.

### Specific changes:

- Add `useState` to the React import
- `const [isSaving, setIsSaving] = useState(false)` — replace `isSavingRef`
- `const [lastSaved, setLastSaved] = useState<Date | null>(null)` — replace `lastSavedRef`
- `const [hasDraft, setHasDraft] = useState(() => enabled ? localStorage.getItem(localKey) !== null : false)`
- In `saveDraft`: use `setIsSaving(true/false)`, `setLastSaved(new Date())`, `setHasDraft(true)`
- In `clearDraft`: `setHasDraft(false)`, `setLastSaved(null)`
- In `loadDraft`: if draft found, `setHasDraft(true)`
- Return the state values directly instead of `.current`

No changes needed to `GenericScenarioWizard.tsx` — it already reads these values correctly.

