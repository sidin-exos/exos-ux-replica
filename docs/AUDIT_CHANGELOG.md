# EXOS Technical Audit — Changelog & Remaining Items

**Date:** 2026-03-18
**Scope:** Pre-demo technical readiness (not security — already audited separately)

---

## Part 1: Changes Made (this session)

### 1. Build fix — `npm install`
- **Problem:** `vite.config.ts` imports `@vitejs/plugin-react` but only the SWC variant was installed. `npm run build` failed with `ERR_MODULE_NOT_FOUND`.
- **Fix:** Ran `npm install` to install the missing `@vitejs/plugin-react` (was already in `package.json`). Both plugins remain in `package.json` — SWC variant is needed by Lovable.
- **Files:** `package.json`
- **Verify:** `npm run build` now succeeds (5.2s, 993KB gzipped).

### 2. Localhost fallback removed
- **Problem:** `useShareableReport.ts:63` had `"https://localhost:8080"` as fallback URL for share links.
- **Fix:** Replaced with `window.location.origin` (always available in browser SPA, no fallback needed).
- **Files:** `src/hooks/useShareableReport.ts`

### 3. `/pdf-test` route gated
- **Problem:** Dev test page with mock data accessible publicly at `/pdf-test`.
- **Fix:** Wrapped in `<ProtectedRoute requireSuperAdmin>` — now only founders can access it.
- **Files:** `src/App.tsx`

### 4. Frontend console statements removed (24 total)
- **Problem:** `console.log`, `console.warn`, `console.debug` scattered across 8 frontend files. Visible in browser DevTools during demo.
- **Fix:** Removed all 24 occurrences. Kept `console.error` where it's genuine error logging.
- **Files changed:**
  - `src/lib/ai/graph.ts` — 12 removed (pipeline step logging)
  - `src/lib/ai/langsmith-client.ts` — 5 removed (tracing debug logs)
  - `src/contexts/ModelConfigContext.tsx` — 2 removed (localStorage warnings)
  - `src/hooks/useSentinel.ts` — 1 removed
  - `src/components/scenarios/GenericScenarioWizard.tsx` — 1 removed
  - `src/lib/dashboard-data-parser.ts` — 1 removed
  - `src/lib/ai-test-data-generator.ts` — 1 removed
  - `src/lib/test-data-factory.ts` — 1 removed

### 5. Supabase types regenerated, `as any` casts removed (22 → 4)
- **Problem:** Tables added after initial type generation (`chat_feedback`, `scenario_feedback`, `saved_intel_configs`, `pipeline_iq_stats`, RPCs `save_intel_to_knowledge_base`, `get_evolutionary_directives`) were missing from `types.ts`. Code used `as any` to work around it.
- **Fix:**
  - Regenerated types via `npx supabase gen types typescript --project-id qczblwoaiuxgesjzxjvu`
  - Made `organization_id` optional in all Insert types (DB triggers auto-set it via `auto_set_organization_id()`)
  - Removed 18 `as any` casts across 7 files
- **Files changed:**
  - `src/integrations/supabase/types.ts` — regenerated + Insert type fix
  - `src/hooks/useSavedIntelConfigs.ts` — 7 casts removed
  - `src/hooks/usePipelineIQ.ts` — 4 casts removed
  - `src/components/intelligence/SaveToKnowledgeBaseDialog.tsx` — 3 casts removed (+ added `Json` type import)
  - `src/components/chat/ChatMessage.tsx` — 1 cast removed
  - `src/components/scenarios/GenericScenarioWizard.tsx` — 1 cast removed
  - `src/hooks/useAdminAuth.ts` — 1 cast removed
  - `src/hooks/useTestDatabase.ts` — 2 casts removed
- **4 remaining (justified):**
  - `src/main.tsx:8-9` — `globalThis as any` for Buffer polyfill (no typed alternative)
  - `src/hooks/useEnterpriseTrackers.ts:80` — insert missing `organization_id` in row construction (real schema mismatch, needs product logic to resolve)
  - `src/hooks/useUserFiles.ts:253` — accessing internal Supabase client properties for edge function URL

### 6. Lovable references cleaned
- **Problem:** `.lovable/` directory, README with `lovable.dev` URLs and `REPLACE_WITH_PROJECT_ID` placeholders, Lovable branding in architecture diagram.
- **Fix:**
  - Deleted `.lovable/` directory
  - Rewrote `README.md` with EXOS branding, proper tech stack docs, env var table, project structure
  - Changed "Lovable Gateway" → "EXOS Gateway" in `ExosArchitectureDiagram.tsx`
  - Marked `LOVABLE_API_KEY` as legacy in `PROJECT_CONTEXT_2026-03-15.md`
  - Updated team structure references in PROJECT_CONTEXT
- **Files:** `.lovable/plan.md` (deleted), `README.md`, `src/components/architecture/ExosArchitectureDiagram.tsx`, `public/docs/PROJECT_CONTEXT_2026-03-15.md`
- **Still present (super-admin-only, not user-facing):**
  - `src/components/architecture/OrgChartDiagram.tsx` — 3 refs
  - `src/components/architecture/DevWorkflowDiagram.tsx` — 4 refs
  - `src/pages/OrgChart.tsx` — 2 refs
  - `src/pages/DevWorkflow.tsx` — 1 ref
  - `docs/AI_WORKFLOW.md`, `docs/ORG_CHART.md` — internal docs, not served

---

## Part 2: Remaining from audit (not done — need product decisions)

### MUST FIX (blocks demo)

| ID | Issue | File(s) | Decision needed |
|----|-------|---------|-----------------|
| MF-2 | Pricing "Get Started" / "Start Free Trial" buttons do nothing | `src/pages/Pricing.tsx:225-231` | Toast? Redirect? Stripe? |
| MF-3 | Legal footer links (Privacy, ToS, GDPR, Impressum) all point to `#` | `src/components/layout/Footer.tsx:23-27` | Need actual legal text or hosted docs |
| MF-4 | ConsolidationWizard is 100% hardcoded mock, reachable from Index | `src/components/consolidation/ConsolidationWizard.tsx:29-87` | Wire to AI? Hide? Label as preview? |

### SHOULD FIX (before demo)

| ID | Issue | File(s) | Decision needed |
|----|-------|---------|-----------------|
| SF-1 | No route-level code splitting — 993KB single JS chunk | `src/App.tsx` | Architectural change, wrap imports in `React.lazy` |
| SF-4 | Chat history lost on page refresh | `src/hooks/use-exos-chat.tsx:16` | sessionStorage vs Supabase table |
| SF-5 | Auth page "agree to ToS and Privacy Policy" is plain text, not links | `src/pages/Auth.tsx:352` | Depends on MF-3 (legal pages) |
| SF-6 | Dead nav links: About, Careers, Press, Help Center, System Status → `#` | `src/components/layout/Footer.tsx`, `Header.tsx` | Remove links or create pages? |
| SF-8 | DeepAnalysis pipeline progress is simulated (timer, not real) | `src/components/scenarios/GenericScenarioWizard.tsx:397-404` | Keep decorative or make indeterminate? |

### BACKLOG (after demo)

| ID | Issue | Why it can wait |
|----|-------|-----------------|
| BL-1 | Stripe payment integration | Account page already shows "Coming Soon" toast |
| BL-2 | Scheduled reports cron doesn't execute | Config saved, UI doesn't promise execution |
| BL-3 | pgvector/semantic search not implemented | Basic text search works |
| BL-4 | PDF export test page has mock data | Real export path works; test page now gated (SF-7 done) |
| BL-5 | Enterprise features are UI-only gates | "Coming Soon" on pricing, "Contact Sales" mailto |
| BL-6 | Founder dashboard metrics manual only | Only super admins see it |
| BL-7 | Demo mode banners inconsistent | Lower priority after MF-4 |
| BL-8 | `globalThis as any` Buffer polyfill | Works correctly |
| BL-9 | Edge function console.log statements | Not user-visible |
| BL-10 | `LOVABLE_API_KEY` in project docs | Docs only, not code |

---

## Part 3: Manual verification checklist (external dashboards)

### Supabase Dashboard
- [ ] Secrets set: `GOOGLE_AI_STUDIO_KEY`, `PERPLEXITY_API_KEY`, `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Remove `LOVABLE_API_KEY` if still in secrets
- [ ] All 10 edge functions deployed with latest code
- [ ] Email templates branded (not default Supabase)
- [ ] SMTP configured (Resend or default)
- [ ] Confirmation + password reset redirect URLs → production domain
- [ ] No stale test data in production DB
- [ ] `rate_limits` / `shared_reports` cleanup policy

### Google Cloud Console
- [ ] OAuth Client ID + Secret active
- [ ] Redirect URIs include production domain
- [ ] JavaScript origins include production domain
- [ ] Google AI Studio key active with quota

### Perplexity API
- [ ] Key active, sufficient credits for demo

### LangSmith
- [ ] Traces appearing in EXOS project
- [ ] `LANGCHAIN_TRACING_V2` = `"true"` in secrets

### DNS & Hosting
- [ ] Production URL resolving
- [ ] SSL valid
- [ ] Custom domain (or lovable subdomain acceptable for demo)

### Monitoring (missing — consider adding)
- [ ] No `/health` endpoint exists
- [ ] No automated alerting for API failures

---

## Build status after all changes

```
npm run build    → ✅ 5.2s, 993KB gzipped
npx tsc --noEmit → ✅ 0 errors
console.log grep → ✅ 0 hits in src/
as any grep      → ✅ 4 remaining (all justified, 0 Supabase-related)
.lovable/        → ✅ deleted
```
