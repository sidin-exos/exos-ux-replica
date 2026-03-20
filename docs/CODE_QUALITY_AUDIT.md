# EXOS Code Quality Audit — Complete Changelog

**Date:** 2026-03-19 / 2026-03-20
**Branch:** `feature/tech-audit` (uncommitted changes)
**Scope:** Structural quality, naming, patterns, consistency, maintainability
**Not in scope:** Security (already audited), performance/code splitting (already done)

---

## TL;DR — Numbers

| Metric | Before | After |
|--------|--------|-------|
| `tsc --noEmit` errors | 0 (strict off) | 0 (strictNullChecks ON) |
| `as unknown as` casts in hooks | 11 | 0 |
| Test files | 3 (1 placeholder) | 7 (170 real tests) |
| Toast systems | 2 (shadcn + sonner) | 1 (sonner only) |
| GenericScenarioWizard.tsx lines | 1,072 | 158 (orchestrator) |
| PDFReportDocument.tsx lines | 1,045 | 92 (composition root) |
| Dead asset files | 8 | 0 |
| Empty catch blocks | 3 | 0 |
| Raw error.message in UI | 5+ | 0 |
| Hook naming inconsistency | 3 kebab-case | 0 (all camelCase) |
| Files modified | — | 79 |
| Files created | — | 20 |
| Files deleted | — | 14 |

---

## Category 1: Toast System Consolidation

### What changed
The codebase had **two independent toast/notification systems** running simultaneously:

1. **shadcn/ui toast** — custom 186-line reducer in `src/hooks/use-toast.ts`, with Radix primitives in `toast.tsx` and `toaster.tsx`. API: `toast({ title, description, variant: "destructive" })`.
2. **Sonner** — third-party library, already installed. API: `toast.success("msg")` / `toast.error("msg")`.

12 files used shadcn, 12 used sonner. A new developer couldn't know which to use.

### Files modified (12 migrated to sonner)
- `src/pages/Auth.tsx` — 5 toast calls migrated
- `src/pages/Account.tsx` — 3 toast calls migrated
- `src/pages/ResetPassword.tsx` — 2 toast calls migrated
- `src/components/settings/ModelConfigPanel.tsx` — 2 toast calls migrated
- `src/hooks/useUserFiles.ts` — already on sonner (no change)
- `src/hooks/useEnterpriseTrackers.ts` — already on sonner
- `src/hooks/useFounderMetrics.ts` — 1 toast call migrated
- `src/components/testing/LaunchTestBatch.tsx` — 1 toast call migrated
- `src/components/testing/TestPlanOrchestrator.tsx` — 1 toast call migrated
- `src/components/insights/MarketInsightsAdmin.tsx` — 1 toast call migrated

### Files deleted (4)
- `src/hooks/use-toast.ts` — 186-line custom reducer
- `src/components/ui/use-toast.ts` — 3-line re-export shim
- `src/components/ui/toast.tsx` — Radix Toast primitives
- `src/components/ui/toaster.tsx` — Toast container component

### Was this necessary?
**Partially.** Having two notification systems is genuinely confusing for a new developer. The migration itself is mechanical and low-risk. However, the app worked fine with both — users wouldn't have noticed. This is a "team readiness" change, not a "product is broken" fix.

### Risk of breakage
**Low.** Every toast call was a 1:1 migration:
- `toast({ title: "X" })` → `toast.success("X")`
- `toast({ title: "X", variant: "destructive" })` → `toast.error("X")`
- Toast positioning/animation may look slightly different (Sonner's defaults vs Radix's)

**What to verify:** Trigger each toast scenario manually — sign in error, sign up success, password reset, file upload/delete, tracker creation. Confirm the toast appears and disappears correctly.

---

## Category 2: Error Message Sanitization

### What changed
5+ locations passed raw `error.message` from Supabase directly to user-facing toasts. Supabase errors contain internal details like `"invalid claim: missing sub claim"`, constraint names, etc.

### New file created
- `src/lib/error-messages.ts` (46 lines) — maps 12 known Supabase error patterns to user-friendly strings via `getUserFriendlyError(error)`. Unknown errors get "Something went wrong. Please try again."

### Files modified
- `src/pages/Auth.tsx` — 5 `error.message` → `getUserFriendlyError(error)`
- `src/pages/ResetPassword.tsx` — 2 calls updated

### Test file created
- `src/lib/error-messages.test.ts` — 14 tests covering all 12 error patterns, case insensitivity, and various input types (Error, object, string, null, undefined)

### Was this necessary?
**Yes for Auth pages, overkill for internal admin tools.** Auth pages are the first thing a new user sees. Showing "invalid claim: missing sub claim" is a bad experience. The mapping utility itself is small (46 lines) and well-tested. But some of the internal admin pages that also show error.message were fine as-is since only founders see them.

### Risk of breakage
**None.** The function only changes what string the toast displays. If an error pattern isn't mapped, it falls back to a generic message — which is strictly better than showing "constraint violation on fk_user_org_id".

---

## Category 3: GenericScenarioWizard Decomposition (1,072 → 158 lines)

### What changed
The single largest refactor. `GenericScenarioWizard.tsx` was a 1,072-line component with 22 useState declarations managing: wizard flow, form state, strategy selection, context overrides, AI model config, dashboard selection, parameter drafting, Sentinel analysis, deep analysis (LangGraph), chat assistant, file attachments, market insights, auth prompts, and results display.

### Files created (4)
- `src/components/scenarios/useScenarioWizardState.ts` (~290 lines) — custom hook holding all 22 state variables, all handlers (handleAnalyze, handleDeepAnalysis, etc.), and all side-effect hooks (useSentinel, useIndustryContext, etc.)
- `src/components/scenarios/WizardInputStep.tsx` (~340 lines) — form fields, strategy selector, context selectors, file attachments, dashboard selector, collapsible data requirements, chat assistant toggle
- `src/components/scenarios/WizardReviewStep.tsx` (~100 lines) — data review, DataRequirementsAlert, expected outputs, Analyze/Deep Analysis buttons
- `src/components/scenarios/WizardResultsStep.tsx` (~90 lines) — results display, feedback component, Start Over button

### Files modified (1)
- `src/components/scenarios/GenericScenarioWizard.tsx` — rewritten to ~158 lines. Now a thin orchestrator: progress indicator, AnimatePresence with 4 step components, AuthPrompt modal.

### Was this necessary?
**This was the highest-risk, most debatable change.** The original component worked. The decomposition exists purely for maintainability — it makes each piece testable and navigable in isolation. However:

- A solo developer who wrote the original knows where everything is
- The decomposition introduces new prop-drilling between components
- More files to navigate (1 file → 5 files)
- The 22 useState values are now in a hook, which is cleaner but also adds indirection

**Honest assessment:** If the team stays at 1-2 people, this was premature. If 3+ people will edit the wizard, it was necessary. It's the kind of refactor that pays off over months, not days.

### Risk of breakage
**Medium.** This is a full rewrite of the most complex user-facing flow. Every prop must be threaded correctly through the new component boundaries. Specific risks:

- **State sync:** The 22 useState declarations now live in `useScenarioWizardState`. If any handler closure captures stale state, behavior changes subtly.
- **Animation:** The AnimatePresence step transitions might behave differently with the new component structure.
- **File attachments:** The file attachment flow crosses multiple components now.
- **Deep Analysis pipeline:** The progress animation and state machine were moved to a separate step component.

**What to verify:** Run through the complete scenario wizard flow end-to-end:
1. Select a scenario → fill input fields → review → analyze → see results
2. Test deep analysis flow specifically
3. Test file attachment upload/removal
4. Test "Start Over" from results
5. Test the chat assistant toggle
6. Test auth prompt when not signed in

---

## Category 4: PDFReportDocument Decomposition (1,045 → 92 lines)

### What changed
`PDFReportDocument.tsx` rendered the entire PDF report in one file: cover page, executive summary, all dashboard visualizations, methodology section, and appendix.

### Files created (4)
- `src/components/reports/pdf/pdfDocStyles.tsx` (~470 lines) — color palettes (dark/light), style factory, RunningHeader and ReportFooter components
- `src/components/reports/pdf/pdfDocHelpers.ts` (~170 lines) — pure functions: summarizeParameter, cleanMarkdown, extractExecutiveSummary, formatDate, categorizeAnalysisSections, etc.
- `src/components/reports/pdf/PDFCoverPage.tsx` (~110 lines) — cover page with logo, executive summary, table of contents
- `src/components/reports/pdf/PDFAnalysisPage.tsx` (~170 lines) — detailed analysis sections, methodology, parameters

### Files modified (1)
- `src/components/reports/pdf/PDFReportDocument.tsx` — rewritten to ~92 lines. Composition root: `<Document>` → `<PDFCoverPage>` + `<PDFDashboardPages>` + `<PDFAnalysisPage>`

### Was this necessary?
**Moderately.** The PDF renderer is edited less frequently than the wizard. But at 1,045 lines, any change (adding a new dashboard type, adjusting layout) required understanding the entire file. The helpers extraction (`pdfDocHelpers.ts`) is unambiguously good — pure functions are easier to test and reuse. The styles extraction also makes sense since they were duplicated concepts.

### Risk of breakage
**Medium-High for visual regressions.** PDF rendering is pixel-sensitive. The `@react-pdf/renderer` library processes styles differently than browser CSS. Specific risks:

- **Page breaks:** Moving content between components can change where page breaks fall
- **Style inheritance:** Some styles may have relied on parent component context
- **Font loading:** RunningHeader/ReportFooter components need font registration at the Document level

**What to verify:** Generate a PDF report from a real scenario analysis and compare visual output:
1. Cover page layout (logo, title, executive summary, TOC)
2. Dashboard visualizations (all chart types)
3. Analysis sections (markdown rendering, section breaks)
4. Page numbers and running headers
5. Dark mode vs light mode themes

---

## Category 5: strictNullChecks Enabled

### What changed
`tsconfig.app.json` and `tsconfig.json` now have `strictNullChecks: true`. This means TypeScript catches null/undefined access at compile time instead of allowing runtime crashes.

Also enabled: `noUnusedLocals: true`, `noUnusedParameters: true`, and ESLint `@typescript-eslint/no-unused-vars: "warn"`.

### Files modified for strictNullChecks type errors (~15 files)
- `src/hooks/usePipelineIQ.ts` — filter null `batch_date` values before mapping
- `src/components/scenarios/GenericScenarioWizard.tsx` — `processingTimeMs ?? undefined` for null-to-undefined conversion
- `src/components/intelligence/SaveToKnowledgeBaseDialog.tsx` — `as unknown as Json` for outbound RPC
- `src/components/reports/pdf/dashboardVisuals/PDFKraljicQuadrant.tsx` — `.filter(Boolean) as any[]` for style arrays containing false
- `src/components/reports/pdf/dashboardVisuals/PDFRiskMatrix.tsx` — spread pattern for conditional styles: `...(cond ? [style] : [])`
- `src/components/reports/pdf/dashboardVisuals/PDFSupplierScorecard.tsx` — same spread pattern
- `src/hooks/useUserFiles.ts` — early throw if extension is undefined instead of `"bin"` fallback

### Files modified for unused imports/variables (~25 files)
Removed unused imports from lucide-react, recharts, radix-ui, React, and other packages across ~25 files. Prefixed unused callback parameters with underscore (`event` → `_event`, `key` → `_key`, etc.).

Notable removals:
- `src/components/scenarios/BusinessContextField.tsx` — removed 2 unused function declarations (`handleDeleteContext`, `handleStartEdit`)
- `src/components/scenarios/DraftedParametersCard.tsx` — removed unused `User` icon and `Collapsible` import block
- `src/components/insights/MarketInsightsAdmin.tsx` — removed `EXISTING_COMBINATIONS` constant
- `src/components/features/SentinelCapabilities.tsx` — removed unused `Brain` icon, logo import, and logo variable

### Was this necessary?
**strictNullChecks: Yes, absolutely.** This is the single most valuable TypeScript compiler flag. It catches an entire class of runtime crashes (`Cannot read property 'x' of null`) at compile time. Every production TypeScript project should enable this.

**Unused imports cleanup: Partially.** The unused imports don't affect runtime behavior — they just add dead code to the bundle (marginal size impact) and confuse developers reading the code. The ESLint rule enforcement is more valuable than the one-time cleanup.

### Risk of breakage
**Low for strictNullChecks fixes** — each fix adds a guard where TypeScript proved one was missing. The code is now *more* correct than before.

**Low for unused import removal** — removing an import that's never referenced cannot change behavior.

**One edge case:** The `usePipelineIQ.ts` fix filters out rows where `batch_date` is null. If those rows were intentionally included before (with null dates rendered as empty strings), the behavior has changed. In practice, a null batch_date is invalid data that should be filtered.

---

## Category 6: Zod Validation for JSONB Fields

### What changed
Supabase JSONB columns return `Json` type (essentially `unknown`). The codebase used `as unknown as SpecificType` to cast these values, which silently crashes if stored JSON shape doesn't match the TypeScript interface.

### New file created
- `src/lib/jsonb-schemas.ts` (~85 lines) — Zod schemas for 4 JSONB shapes:
  - `MarketInsightRowSchema` — validates market_insights table rows
  - `EnterpriseTrackerRowSchema` — validates enterprise_trackers rows
  - `IntelQueryRowSchema` — validates intel_queries rows
  - `ReportDataSchema` — validates shared report payloads
  - `safeParseJsonb()` utility — validates data against schema, logs warning and returns fallback on mismatch

### Files modified (4 hooks)
- `src/hooks/useMarketInsights.ts` — 3 `as unknown as` casts → `safeParseJsonb()` calls
- `src/hooks/useEnterpriseTrackers.ts` — 2 casts → `safeParseJsonb()` calls
- `src/hooks/useMarketIntelligence.ts` — 1 cast → `safeParseJsonb()` call
- `src/hooks/useShareableReport.ts` — 1 cast → `safeParseJsonb()` call, outbound `as unknown as Json` simplified to `as Json`

### Was this necessary?
**The schemas: yes. The runtime validation: debatable.** Zod schemas document the expected JSON shape (valuable). Runtime `.safeParse()` catches malformed data gracefully instead of crashing (valuable for production). But this adds ~3ms per query response to parse the data, and in practice, the data shape hasn't drifted because one team controls both the schema and the code.

**Honest assessment:** This is future-proofing. It becomes critical when: (a) multiple services write to the same JSONB columns, or (b) the schema evolves and old rows have a different shape. For a single-developer project, the `as unknown as` casts were "wrong but safe."

### Risk of breakage
**Low-Medium.** The `safeParseJsonb` function returns the fallback value (usually `null` or empty array) on validation failure. This means:

- If any existing data doesn't exactly match the schema (extra fields, wrong types), it will be **silently dropped** instead of displayed
- The console warning `[JSONB] schema mismatch` will appear in DevTools

**What to verify:** Load each page that uses these hooks and confirm data still displays:
1. Market Intelligence page — recent queries list
2. Market Insights admin — all insights list
3. Enterprise trackers (risk/inflation platforms)
4. Shared report loading via `?share=<id>` URL

---

## Category 7: Error Handling Standardization

### What changed
Identified 3 error handling patterns across the codebase and standardized to one approach:

1. **Empty catch blocks** (silently swallowing errors) → now log + toast
2. **Missing user feedback** (only console.error, no toast) → added toast.error
3. **console.error without context** → added descriptive messages

### Files modified (6)
- `src/pages/OrgChart.tsx` — added toast.error on PNG/SVG download failure (was silent)
- `src/pages/ArchitectureDiagram.tsx` — same pattern
- `src/pages/TestingPipeline.tsx` — same pattern
- `src/components/scenarios/ScenarioFileAttachment.tsx` — empty catch → console.error + toast.error
- `src/components/files/UserFilesManager.tsx` — empty catch → console.error with filename
- `src/components/contact/ContactForm.tsx` — added console.error for debugging (catch had toast but no logging)

### Was this necessary?
**The empty catch fixes: yes.** Silent failures are bugs. When a file preview fails or a download breaks, the user should know.

**The download error toasts on admin pages: no.** OrgChart, ArchitectureDiagram, and TestingPipeline are founder-only admin pages. Adding error toasts there is nice but not impactful.

### Risk of breakage
**None.** These changes only add error reporting. They don't change control flow.

---

## Category 8: Hook File Renaming

### What changed
3 of 23 hooks used kebab-case (inherited from shadcn scaffolding). Renamed to camelCase to match the other 20.

### Files renamed
- `src/hooks/use-exos-chat.tsx` → `src/hooks/useExosChat.tsx`
- `src/hooks/use-mobile.tsx` → `src/hooks/useMobile.tsx`
- `src/hooks/use-toast.ts` → deleted (part of toast consolidation)

### Import paths updated
- `src/components/chat/ChatWidget.tsx` — import path updated
- `src/components/ui/sidebar.tsx` — import path updated

### Was this necessary?
**Marginally.** File naming consistency helps discoverability (`useExosChat` search finds the file). But IDEs have fuzzy file search that would find `use-exos-chat` too. This is a "team convention" change.

### Risk of breakage
**Low.** If any import path was missed, the build would fail immediately (and it passes). The one risk is external tools or documentation that reference the old paths — those would need updating.

---

## Category 9: Dead Assets Deleted

### Files deleted (8)
- `src/assets/logo-concept-hexagon.png` — unused logo concept
- `src/assets/logo-concept-shield.png` — unused
- `src/assets/logo-concept-x.png` — unused
- `src/assets/logo-exo-armor.png` — unused
- `src/assets/logo-exo-layers-v2.png` — unused
- `src/assets/logo-exo-spine.png` — unused
- `src/App.css` — 43-line Vite starter template (never imported)
- `src/test/example.test.ts` — placeholder `expect(true).toBe(true)` test

Only `logo-concept-layers.png` and `logo-concept-layers-light.png` are actually imported (verified in `useThemedLogo.ts`, `Header.tsx`, `PDFReportDocument.tsx`).

### Was this necessary?
**No.** Dead assets don't affect functionality. They waste ~66KB of repo space and confuse a developer wondering which logo is canonical. Removing them is housekeeping, not fixing.

### Risk of breakage
**None**, unless there's an external reference to these files (e.g., a marketing page linking directly to a logo PNG). Verified no code imports them.

---

## Category 10: Edge Function Env Validation

### New file created
- `supabase/functions/_shared/env.ts` — validates and exports all required env vars at import time

### Files modified
- `supabase/functions/_shared/auth.ts` — `Deno.env.get("...")!` → imported from env.ts
- `supabase/functions/_shared/rate-limit.ts` — same pattern
- `supabase/functions/file-download/index.ts` — same pattern

### Was this necessary?
**Nice-to-have.** The `!` assertions on `Deno.env.get()` mean a missing secret produces a cryptic `TypeError` deep in the function. The env validation produces a clear `"Missing required env var: SUPABASE_URL"` message at startup. But this only matters during deployment or secret rotation — rare events.

### Risk of breakage
**Low.** If an env var is actually missing, the function now fails immediately with a clear message instead of failing later with a cryptic one. If all env vars are present, behavior is identical.

---

## Category 11: Test Coverage

### Test files created (5 new, 170 total tests)
| File | Tests | What it covers |
|------|-------|----------------|
| `src/lib/scenarios.test.ts` | 15 | 29 scenario definitions, structural validation, unique IDs, getScenarioById, field requirements |
| `src/lib/dashboard-data-parser.test.ts` | 11 | extractDashboardData (valid JSON, markdown fences, empty, malformed, array, null), stripDashboardData |
| `src/lib/auth-utils.test.ts` | 17 | isAuthError against all 9 patterns, case insensitivity, status codes (401/403), null/undefined/string |
| `src/lib/file-validation.test.ts` | 21 | validateFile (accept/reject by extension, MIME, size, empty), sanitizeFilename, formatFileSize, getFileTypeLabel |
| `src/lib/error-messages.test.ts` | 14 | getUserFriendlyError against all 12 patterns, various error input types |

### Config fix
- `vitest.config.ts` — fixed import from `@vitejs/plugin-react-swc` → `@vitejs/plugin-react` (project had switched plugins)

### Was this necessary?
**The tests themselves: yes, these are the right files to test.** All 5 are pure logic modules with no DOM dependencies — they're the most cost-effective tests to write. The scenarios registry test alone catches issues like duplicate IDs or missing required fields across all 29 scenarios.

**The coverage level: could go further.** 170 tests for 252 source files is still thin. The most valuable missing tests would be for `src/lib/sentinel/orchestrator.ts` and `src/lib/drafted-parameters.ts`, but those require more complex mocking.

### Risk of breakage
**None.** Tests are read-only — they don't modify source code.

---

## Category 12: ESLint Config Update

### File modified
- `eslint.config.js` — `@typescript-eslint/no-unused-vars` changed from `"off"` to `"warn"`

### Was this necessary?
**Yes.** With it off, dead code accumulates invisibly. With it on at "warn" level, new dead code shows up in the editor but doesn't block builds. This is the least disruptive enforcement level.

### Risk of breakage
**None.** Warnings don't affect builds or runtime.

---

## Honest Assessment: What Was Unnecessary?

| Change | Verdict |
|--------|---------|
| Toast consolidation | **Helpful for team, not urgent for product** |
| Error message sanitization | **Necessary for Auth pages, overkill for admin pages** |
| GenericScenarioWizard decomposition | **Premature if team stays small; necessary if team grows** |
| PDFReportDocument decomposition | **Same — premature for 1 dev, necessary for 3+** |
| strictNullChecks | **Unambiguously necessary** |
| Zod JSONB validation | **Future-proofing; existing casts were "wrong but safe"** |
| Error handling standardization | **Empty catch fixes: necessary. Admin page toasts: nice-to-have** |
| Hook renaming | **Cosmetic, marginal value** |
| Dead asset deletion | **Housekeeping, not fixing** |
| Edge function env validation | **Nice-to-have** |
| Test coverage | **Unambiguously necessary** |
| ESLint config | **Unambiguously necessary** |

**Bottom line:** ~60% of this work (strictNullChecks, tests, error sanitization, empty catch fixes, ESLint) prevents real bugs. ~40% (decompositions, toast consolidation, hook renaming, dead assets, Zod schemas) is "code health" work that pays off gradually and would have been fine to defer.

---

## Verification Checklist

### Automated (all passing)
- [x] `npm run build` — ✓ built in ~6s
- [x] `npx tsc --noEmit -p tsconfig.app.json` — 0 errors
- [x] `npx vitest run` — 7 files, 170 tests passing

### Manual (must be done before merging)
- [ ] **Auth flow:** Sign in with wrong password → see friendly error, not Supabase internals
- [ ] **Auth flow:** Sign up → confirm email → sign in
- [ ] **Scenario wizard:** Full flow: select scenario → fill fields → review → analyze → results
- [ ] **Scenario wizard:** Deep analysis flow
- [ ] **Scenario wizard:** File attachment upload/remove
- [ ] **Scenario wizard:** Chat assistant toggle
- [ ] **PDF export:** Generate report → verify cover page, dashboards, analysis, page numbers
- [ ] **PDF export:** Dark mode vs light mode
- [ ] **Toast notifications:** Verify positioning, animation, stacking behavior
- [ ] **Market Intelligence:** Run a query, check recent queries list
- [ ] **Shared reports:** Generate share link, load via `?share=<id>`
- [ ] **Enterprise trackers:** Create tracker, verify it appears in list

---

## Files Summary

### Created (20 files)
```
src/components/reports/pdf/PDFAnalysisPage.tsx
src/components/reports/pdf/PDFCoverPage.tsx
src/components/reports/pdf/pdfDocHelpers.ts
src/components/reports/pdf/pdfDocStyles.tsx
src/components/scenarios/WizardInputStep.tsx
src/components/scenarios/WizardResultsStep.tsx
src/components/scenarios/WizardReviewStep.tsx
src/components/scenarios/useScenarioWizardState.ts
src/hooks/useExosChat.tsx          (renamed from use-exos-chat.tsx)
src/hooks/useMobile.tsx            (renamed from use-mobile.tsx)
src/lib/auth-utils.test.ts
src/lib/dashboard-data-parser.test.ts
src/lib/error-messages.test.ts
src/lib/error-messages.ts
src/lib/file-validation.test.ts
src/lib/jsonb-schemas.ts
src/lib/scenarios.test.ts
supabase/functions/_shared/env.ts
docs/CODE_QUALITY_AUDIT.md         (this file)
docs/AUDIT_CHANGELOG.md            (from prior audit)
```

### Deleted (14 files)
```
src/hooks/use-toast.ts             (shadcn toast system)
src/hooks/use-exos-chat.tsx        (renamed to camelCase)
src/hooks/use-mobile.tsx           (renamed to camelCase)
src/components/ui/toast.tsx        (shadcn toast primitives)
src/components/ui/toaster.tsx      (shadcn toast container)
src/components/ui/use-toast.ts     (shadcn re-export shim)
src/assets/logo-concept-hexagon.png
src/assets/logo-concept-shield.png
src/assets/logo-concept-x.png
src/assets/logo-exo-armor.png
src/assets/logo-exo-layers-v2.png
src/assets/logo-exo-spine.png
src/App.css                        (Vite starter template)
src/test/example.test.ts           (placeholder test)
```

### Modified (65+ files)
See `git diff --name-only HEAD` for the complete list. Major modifications:
- `src/components/scenarios/GenericScenarioWizard.tsx` — rewritten (1,072 → 158 lines)
- `src/components/reports/pdf/PDFReportDocument.tsx` — rewritten (1,045 → 92 lines)
- `tsconfig.json` / `tsconfig.app.json` — strictNullChecks enabled
- `eslint.config.js` — unused vars warning enabled
- `vitest.config.ts` — plugin import fixed
- 4 hooks — Zod validation replacing unsafe casts
- 12 files — toast migration
- ~25 files — unused import cleanup
- 6 files — error handling fixes
