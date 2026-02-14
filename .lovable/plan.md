

# Reactive AI Scenario Tutorial

## Summary

A reactive tutorial component that displays the static scenario description by default, then automatically fetches and displays a personalized AI explanation when the user selects an industry and/or category in the main wizard. No duplicate dropdowns -- the tutorial listens to the wizard's existing state.

## Architecture

### 1. Edge Function: `supabase/functions/scenario-tutorial/index.ts`

- **Input:** `{ scenarioTitle, industryName?, categoryName? }`
- **Guard:** If neither `industryName` nor `categoryName` is provided, returns `{ content: null }` (no token waste)
- **Model:** `google/gemini-3-flash-preview` via Lovable AI Gateway (fast, cheap)
- **System prompt:** "You are a procurement strategy advisor. Given a scenario name and an industry/category context, write 2-3 punchy bullet points explaining how this scenario solves real problems in that specific context. Markdown format. Under 100 words. No generic filler."
- **CORS:** Standard Supabase CORS headers
- **Error handling:** Returns 500 with error message; frontend catches gracefully

### 2. Component: `src/components/scenarios/ScenarioTutorial.tsx`

**Props (no internal dropdowns):**
```text
scenario: { title, description }
industryName: string | null
categoryName: string | null
```

**Behavior:**
- Default state: renders `scenario.description` in a subtle Card with a `GraduationCap` icon
- `useEffect` watches `industryName` + `categoryName`
  - If both are null: show static description (no AI call)
  - If either is set: call the edge function, show skeleton while loading
- On success: animate transition (framer-motion `AnimatePresence`) from static text to AI text, show a "Personalized for your context" badge with `Sparkles` icon
- On error: toast via sonner, fall back to static description silently
- Debounce: 500ms delay before firing the AI call (prevents rapid-fire on quick selection changes)

**Visual:**
```text
+----------------------------------------------------------+
| [GraduationCap]  About this scenario                     |
|                                                          |
| [Static description OR AI-personalized bullets]          |
|                                                          |
|              [Sparkles] Personalized for your context     |
+----------------------------------------------------------+
```

### 3. Wizard Integration: `src/components/scenarios/GenericScenarioWizard.tsx`

- Place `<ScenarioTutorial>` at the top of the `step === "input"` section (line ~449, before "Enter Your Data")
- Pass existing state:
  ```text
  <ScenarioTutorial
    scenario={scenario}
    industryName={industryContext?.name ?? null}
    categoryName={categoryContext?.name ?? null}
  />
  ```
- `industryContext` and `categoryContext` are already fetched at lines 111-112 via `useIndustryContext(industrySlug)` and `useProcurementCategory(categorySlug)` -- zero new queries needed

### 4. Config: `supabase/config.toml`

Add:
```text
[functions.scenario-tutorial]
verify_jwt = false
```

## Files

| File | Action |
|------|--------|
| `supabase/functions/scenario-tutorial/index.ts` | Create -- edge function |
| `supabase/config.toml` | Auto-updated with new function entry |
| `src/components/scenarios/ScenarioTutorial.tsx` | Create -- reactive tutorial component |
| `src/components/scenarios/GenericScenarioWizard.tsx` | Edit -- add tutorial at top of input step |

## Constraints Met

- NO internal dropdowns in tutorial (reacts to wizard state)
- NO on-mount generic AI call (shows static `scenario.description` instead)
- Strict error handling (sonner toast on failure, graceful fallback)
- Token-efficient (only fires when user has selected context)
