

## Fix "Generate Full Report" redirect to "/"

### Root cause

In `src/App.tsx` line 90, the `/report` route is explicitly mapped to `<Navigate to="/" replace />`, which immediately redirects to the homepage. Meanwhile, `handleGenerateReport` in `GenericScenarioWizard.tsx` navigates to `/report` with state data expecting the `GeneratedReport` page to render.

The `GeneratedReport` page component exists at `src/pages/GeneratedReport.tsx` and reads `location.state` for the report data — it just isn't wired up.

### Fix

**File: `src/App.tsx`, line 90**

Replace:
```tsx
<Route path="/report" element={<Navigate to="/" replace />} />
```
With:
```tsx
<Route path="/report" element={<ProtectedRoute><GeneratedReport /></ProtectedRoute>} />
```

Add the missing import at the top of the file:
```tsx
import GeneratedReport from "@/pages/GeneratedReport";
```

Or, if `GeneratedReport` is already lazy-loaded elsewhere in the file, use that reference instead. This is a one-line route fix plus one import.

### What does NOT change
- No changes to `GenericScenarioWizard.tsx`, `OutputFeedback.tsx`, or `GeneratedReport.tsx`
- No database or migration changes

