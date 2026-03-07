# EXOS Migration — Comprehensive Testing Plan

> **Date:** 2026-03-06
> **Environment:** `npm run dev` on `localhost:5173` against new self-managed Supabase project
> **Scope:** Database migration (A), Multi-tenancy Phase 1 (B), RLS overhaul (C), Edge function migration (D), Security fixes (E)

---

## PHASE 0: Prerequisites

| # | Test | Pass | Fail |
|---|------|------|------|
| 0.1 | `npm run dev` starts without errors | Dev server running on `localhost:5173` | Build errors or crash |
| 0.2 | App loads at `http://localhost:5173` | Page renders, no white screen | Blank page or Vite error |
| 0.3 | Browser console has no Supabase connection errors | No `Failed to fetch` or `CORS` errors | Red errors referencing Supabase URL |
| 0.4 | `.env` has correct values | `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` point to new project (NOT old Lovable Cloud) | Old `supabase.co` URL from Lovable |

**Checklist:**
- [ ] 0.1 — `npm run dev` starts cleanly
- [ ] 0.2 — App renders at localhost:5173
- [ ] 0.3 — No Supabase connection errors in console
- [ ] 0.4 — `.env` verified: `VITE_SUPABASE_URL` is the new project URL

**Validates:** A (database migration), infrastructure setup

---

## PHASE 1: Public Pages (No Auth Required)

All routes below should load without login. They validate that the database migration (A) preserved reference data and that public RLS policies (C) are working.

| # | Route | What to Check | Validates |
|---|-------|---------------|-----------|
| 1.1 | `/` | Homepage loads, scenario cards visible | A |
| 1.2 | `/features` | Features page renders | A |
| 1.3 | `/reports` | Reports showcase loads | A |
| 1.4 | `/pricing` | Pricing page loads | A |
| 1.5 | `/faq` | FAQ page loads | A |
| 1.6 | `/architecture` | Architecture diagram renders | A |
| 1.7 | `/dev-workflow` | Dev workflow page loads | A |
| 1.8 | `/org-chart` | Org chart page loads | A |
| 1.9 | `/testing-pipeline` | Pipeline page loads, reads from `pipeline_iq_stats` view | A, C |
| 1.10 | `/dashboards` | Dashboard showcase loads | A |
| 1.11 | `/market-intelligence` | Page loads (data requires auth, but page should render) | A |

**For each page:**
- No blank/white screens
- No red console errors
- Data-driven content appears where expected (industry contexts, procurement categories on relevant pages)
- Check Network tab: Supabase queries return 200, not 401/403

**Checklist:**
- [ ] 1.1 — Homepage (`/`) loads with scenario cards
- [ ] 1.2 — Features page loads
- [ ] 1.3 — Reports page loads
- [ ] 1.4 — Pricing page loads
- [ ] 1.5 — FAQ page loads
- [ ] 1.6 — Architecture diagram renders
- [ ] 1.7 — Dev workflow page loads
- [ ] 1.8 — Org chart page loads
- [ ] 1.9 — Testing pipeline loads, shows data from `pipeline_iq_stats` view
- [ ] 1.10 — Dashboard showcase loads
- [ ] 1.11 — Market intelligence page renders (data gated behind auth)

**Validates:** A (schema + data migration), C (public SELECT policies on reference tables)

---

## PHASE 2: Authentication Flow

Test Google OAuth login. Validates database migration (A), profile auto-creation trigger (B), and auth configuration.

> **Note:** Auth uses `lovable.auth.signInWithOAuth("google")` wrapper (`src/integrations/lovable/index.ts`), not direct Supabase OAuth.

**Steps:**
1. Navigate to `/auth`
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Should redirect to `/account`
5. Verify in Supabase Dashboard → Auth → Users that the user appeared
6. Verify profile auto-creation trigger fired:

```sql
SELECT id, display_name, organization_id, role FROM profiles;
```

**Expected:** One row with user's UUID, `display_name` from Google metadata, `organization_id = NULL`, `role = 'user'`.

**If OAuth fails:** Check Google Cloud Console:
- JavaScript origins include `http://localhost:5173`
- Redirect URIs include `https://[project-id].supabase.co/auth/v1/callback`
- Supabase Dashboard → Authentication → Providers → Google is enabled with correct client ID/secret

**Checklist:**
- [ ] 2.1 — `/auth` page loads with Google sign-in button
- [ ] 2.2 — Google OAuth completes successfully
- [ ] 2.3 — Redirects to `/account` after login
- [ ] 2.4 — User appears in Supabase Auth → Users
- [ ] 2.5 — Profile row created automatically (`profiles` table) with correct `display_name`
- [ ] 2.6 — Profile has `organization_id = NULL` and `role = 'user'` initially

**Validates:** A (auth config), B (handle_new_user trigger), C (profiles policies)

---

## PHASE 3: Organization Setup

Test organization assignment. Validates Phase 1 (B) triggers and Phase 2 (C) organization policies.

> **Note:** No frontend UI exists for organization creation. Setup must be done via Supabase SQL Editor or Dashboard.

**Steps (SQL Editor with service_role):**

```sql
-- 1. Verify user's UUID
SELECT id, email FROM auth.users;

-- 2. The default org should already exist from migration backfill
SELECT id, name, settings FROM organizations;
-- Expected: Row with id = '00000000-0000-0000-0000-000000000001', name = 'Default Organization'

-- 3. Assign user to default org as admin
UPDATE profiles
SET organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'admin'
WHERE id = '<user-uuid>';

-- 4. Also set legacy user_roles (needed for admin checks in edge functions)
INSERT INTO user_roles (user_id, role)
VALUES ('<user-uuid>', 'admin')
ON CONFLICT DO NOTHING;

-- 5. Verify
SELECT id, display_name, organization_id, role FROM profiles WHERE id = '<user-uuid>';
-- Expected: organization_id = '00000000-...0001', role = 'admin'
```

**Alternative — Test org creation trigger (from authenticated context):**
If you want to test `handle_org_created()` trigger, the user must call INSERT on `organizations` while authenticated. This requires the user to have `organization_id = NULL` (policy: `insert_if_no_org`). Since there's no UI, this can only be tested via Supabase client in browser console:

```javascript
const { data, error } = await supabase.from('organizations').insert({ name: 'My Company' }).select();
console.log('Created org:', data, error);
// Trigger should auto-set user as admin in profiles
```

**Checklist:**
- [ ] 3.1 — Default organization exists in `organizations` table
- [ ] 3.2 — User assigned to organization with `role = 'admin'`
- [ ] 3.3 — Legacy `user_roles` entry created
- [ ] 3.4 — Profile reflects correct `organization_id` and `role`

**Validates:** B (organizations table, handle_org_created trigger), C (organization INSERT policy)

---

## PHASE 4: Admin Dashboard & Protected Routes

Test authenticated pages after user is set as admin. Validates RLS policies (C) on admin-only tables.

**Steps:**

| # | Action | Expected | If Broken |
|---|--------|----------|-----------|
| 4.1 | Navigate to `/admin/dashboard` | Founder Dashboard loads | `useAdminAuth()` hook check fails — verify `user_roles` has admin entry |
| 4.2 | Check founder_metrics data | MRR, active users, burn rate visible (1 row) | RLS policy `select_admin_in_org` not matching — check profile `role='admin'` and `organization_id` matches `founder_metrics.organization_id` |
| 4.3 | Navigate to `/account` | Account page loads with user info | Auth session missing |
| 4.4 | Navigate to `/market-intelligence` | Page loads, query builder visible | Auth check failed |

**Checklist:**
- [x] 4.1 — `/admin/dashboard` loads for admin user
- [x] 4.2 — Founder metrics data visible (MRR, users, burn rate, etc.)
- [x] 4.3 — `/account` shows user info
- [x] 4.4 — `/market-intelligence` accessible when authenticated

**Validates:** C (admin RLS policies on founder_metrics, test_prompts, test_reports), A (data migration)

---

## PHASE 5: Chatbot — chat-copilot Edge Function

Test the onboarding chatbot. Validates edge function migration (D) — Google AI Studio with `gemini-3-flash` (heavy tier).

> **Note:** chat-copilot **requires authentication** (JWT Bearer token validated in `_shared/auth.ts`). Must be logged in.

**Steps:**
1. Ensure you are logged in
2. Find the chatbot widget (floating trigger bar at bottom of page, implemented in `src/components/chat/ChatWidget.tsx`)
3. Click to expand the chat panel
4. Type: "What can EXOS help me with?"
5. Wait for response
6. **Expected:** Coherent AI response about EXOS procurement capabilities
7. Test multi-turn: "Tell me more about TCO analysis"
8. **Expected:** Response references previous context
9. Test tool calling: "Show me the supplier review scenario" or "Take me to reports"
10. **Expected:** Response includes navigation action — check Network tab for `action: { type: "NAVIGATE", payload: "/reports" }`

**Network tab verification:**
- Request goes to `/functions/v1/chat-copilot`
- Request body: `{ messages: [...], currentPath: "...", scenarios: [...] }`
- Response: `{ content: "...", action?: { type: "NAVIGATE", payload: "..." } }`

**Failure indicators:**
- 500 error → check Supabase Dashboard → Edge Functions → Logs
- 401 error → JWT token not being sent; check auth header
- "GOOGLE_AI_STUDIO_KEY not configured" → secret not set in Supabase
- Empty/null response → model name `gemini-3-flash` may be invalid
- Garbled response → format issue in `_shared/google-ai.ts`

**Checklist:**
- [x] 5.1 — Chatbot widget visible and clickable
- [x] 5.2 — Single message gets coherent response
- [x] 5.3 — Multi-turn conversation maintains context
- [ ] 5.4 — Navigation tool calling works (action field in response)
- [x] 5.5 — No 500/401 errors in Network tab

**Validates:** D (Lovable Gateway → Google AI Studio migration, gemini-3-flash model, tool calling format)

---

## PHASE 6: Scenario Tutorial — scenario-tutorial Edge Function

Test contextual tips. Validates edge function migration (D) — `gemini-3.1-flash-lite-preview` (light tier).

> **Note:** This function is **public** (no auth required), but typically accessed from scenario pages while logged in.

**Steps:**
1. Navigate to any scenario page (click a scenario card from homepage)
2. Look for the tutorial/tips section (`ScenarioTutorial` component)
3. Should display contextual guidance about the scenario
4. Check Network tab: request goes to `/functions/v1/scenario-tutorial`
5. Request body: `{ scenarioTitle, industryName, categoryName }`
6. Response: `{ content: "..." }` with relevant tips

**Checklist:**
- [ ] 6.1 — Scenario tutorial loads on scenario page
- [ ] 6.2 — Content is relevant to the selected scenario
- [ ] 6.3 — Network request succeeds (200 status)
- [ ] 6.4 — Response format is `{ content: "..." }`

**Validates:** D (light tier model, Google AI Studio direct call)

---

## PHASE 7: Scenario Chat Assistant — scenario-chat-assistant Edge Function

Test per-scenario coaching. Validates edge function migration (D) — `gemini-3-flash` (heavy tier) with `update_fields` tool.

> **Note:** Requires authentication.

**Steps:**
1. Open any scenario (e.g., Software Licensing)
2. Find the scenario-specific chat interface (`ScenarioChatAssistant` component)
3. Type a question like "I need to analyze our Microsoft 365 licensing costs"
4. **Expected:** Coaching response with scenario-specific guidance
5. Continue chatting to provide data: "We have 500 users at $36/month"
6. **Expected:** Response extracts fields via `update_fields` tool call → form fields auto-populate
7. Check Network tab: response shape `{ content, extractedFields }`

**Checklist:**
- [ ] 7.1 — Scenario chat assistant visible on scenario page
- [ ] 7.2 — Coaching response is contextual to the scenario
- [ ] 7.3 — Field extraction works (form fields populate from conversation)
- [ ] 7.4 — Network response has `{ content, extractedFields }` shape
- [ ] 7.5 — PII anonymization active (check that emails/prices are masked in request body)

**Validates:** D (tool calling format: OpenAI → Google native, args already parsed)

---

## PHASE 8: Sentinel Analysis — sentinel-analysis Edge Function

Test the core AI analysis engine. Most complex — validates edge function migration (D), `gemini-3-flash` (heavy tier), multi-cycle Chain-of-Experts.

> **Note:** Sentinel has **soft auth** — works with or without login, but logging and grounding features require auth.

**Steps:**

### 8a. Basic Analysis
1. Navigate to a scenario page
2. Fill in required fields:
   - Select industry context (e.g., Manufacturing)
   - Select procurement category
   - Fill scenario-specific fields (e.g., software name, pricing, user counts for Software Licensing)
3. Choose model: Google AI Studio (`gemini-3-flash`)
4. Submit for analysis
5. Wait for response (may take 10–30 seconds)
6. **Expected:** Structured analysis with findings, recommendations, risk assessment

### 8b. Deep Analytics (Chain-of-Experts)
1. Select a deep analytics scenario: TCO Analysis, Make vs Buy, Volume Consolidation, Cost Breakdown, or CapEx vs OpEx
2. Fill in all required fields with detailed data
3. Submit for analysis
4. **Expected:** Multi-cycle output (Analyst draft → Auditor critique → Synthesizer final)
5. Output should be richer and more thorough than basic scenarios

### 8c. Server-Side Grounding
1. Verify that analysis references industry-specific constraints and KPIs
2. Check Network tab: request includes `serverSideGrounding: true`
3. Response should reference industry data from `industry_contexts` table

**Network tab verification:**
- Request to `/functions/v1/sentinel-analysis`
- Response includes: `{ content, validation, model, promptId, processingTimeMs }`
- No `source: "lovable"` — should be Google AI Studio only

**Failure indicators:**
- Timeout → Supabase function 60s limit, check logs
- "Authentication required" → user not logged in (for protected features)
- Truncated output → `maxOutputTokens` too low
- No shadow_log extraction → regex may need adjustment for new model output format

**Checklist:**
- [ ] 8.1 — Basic scenario analysis returns structured results
- [ ] 8.2 — Dashboard visualizations render from analysis data
- [ ] 8.3 — Deep analytics scenarios trigger multi-cycle Chain-of-Experts
- [ ] 8.4 — Server-side grounding includes industry context
- [ ] 8.5 — No Lovable fallback in response (Google AI Studio only)
- [ ] 8.6 — Processing time logged in response
- [ ] 8.7 — Test logging works (check `test_prompts` and `test_reports` tables)

**Validates:** D (Lovable fallback removed, Google AI Studio only, multi-cycle preserved), A (industry_contexts data), C (admin policies on test_prompts/test_reports)

---

## PHASE 9: Market Intelligence — Perplexity (Unchanged)

Verify Perplexity-based market intelligence still works. Should be completely unaffected by migration.

**Steps:**
1. Navigate to `/market-intelligence` (requires auth)
2. Use the Query Builder to perform a search (e.g., "semiconductor supply chain risk 2026")
3. **Expected:** Results with citations from real web sources (Perplexity `sonar-pro` model)
4. Check results display in `IntelResults` component
5. Verify in SQL editor:

```sql
SELECT id, query_type, query, organization_id, created_at
FROM intel_queries
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** New row with the query text. `organization_id` should be set (auto-set trigger).

> **Note on org_id:** Edge functions use service_role client for DB inserts. The `auto_set_organization_id` trigger calls `auth.uid()` which returns NULL in service_role context → org_id defaults to the Default Organization UUID. This is expected behavior for now.

**Checklist:**
- [ ] 9.1 — Market intelligence query returns results
- [ ] 9.2 — Results include Perplexity citations
- [ ] 9.3 — Query logged in `intel_queries` table
- [ ] 9.4 — `organization_id` populated on intel_queries row

**Validates:** D (Perplexity integration unchanged), C (intel_queries org-scoped policies)

---

## PHASE 10: Market Snapshot — Two-Phase (Perplexity + Google AI)

Test the two-phase market snapshot analysis.

> **Note:** Market snapshot bypasses Sentinel. It's triggered from `GenericScenarioWizard` for the `market-snapshot` scenario type.

**Steps:**
1. Navigate to the Market Snapshot scenario (find it on homepage or via URL)
2. Fill in required fields: region and analysis scope
3. Submit the snapshot request
4. Wait for response (two phases)
5. **Expected:**
   - Phase 1: Perplexity `sonar-pro` research → market landscape with citations
   - Phase 2: Google AI `gemini-3.1-flash-lite-preview` quality gate → scores completeness
   - Combined output with both research data and quality assessment
6. Check Network tab: request to `/functions/v1/market-snapshot`

**Checklist:**
- [ ] 10.1 — Market snapshot request succeeds
- [ ] 10.2 — Phase 1 (Perplexity research) returns market data
- [ ] 10.3 — Phase 2 (Google quality gate) provides completeness score
- [ ] 10.4 — Combined output displays correctly
- [ ] 10.5 — Result logged in `intel_queries` table

**Validates:** D (two-phase Perplexity + Google AI pipeline, light tier model)

---

## PHASE 11: Shared Reports

Test report sharing. Validates updated `create_shared_report()` function with `organization_id` tracking.

**Steps:**
1. Generate any analysis/report (complete a scenario in Phase 8)
2. Look for share/export button on the results page
3. Click share → should generate a share link
4. Copy the share link (format: `/report?share={shareId}`)
5. Open the link in an **incognito/private browser window** (no auth session)
6. **Expected:** Report displays correctly — link-based access works for anyone
7. Verify in SQL editor:

```sql
SELECT share_id, organization_id, expires_at
FROM shared_reports
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:** `organization_id` is set (not NULL), `expires_at` is ~5 days from now.

**Checklist:**
- [ ] 11.1 — Share button visible on analysis results
- [ ] 11.2 — Share link generated successfully
- [ ] 11.3 — Shared report viewable in incognito (no auth needed)
- [ ] 11.4 — Report content displays correctly (dashboards, analysis text)
- [ ] 11.5 — `shared_reports` row has `organization_id` populated
- [ ] 11.6 — Expired reports return empty/error (if testable)

**Validates:** C (updated `create_shared_report()` with org_id), A (shared_reports RPC-only access pattern)

---

## PHASE 12: Data Isolation Verification (CRITICAL)

Test that multi-tenancy RLS actually isolates data between organizations. **This is the most important test.**

**Steps:**

### 12a. Verify Org-Scoped Tables Only Show Own Data
Open browser DevTools → Console (while logged in):

```javascript
// Access the Supabase client (exposed globally or via React context)
// May need: const { supabase } = window.__SUPABASE__ or import from module

// Test 1: intel_queries — should only show own org's queries
const { data: iq, error: iqErr } = await supabase.from('intel_queries').select('id, organization_id');
console.log('intel_queries:', iq?.length, 'error:', iqErr);

// Test 2: test_prompts — admin only, own org
const { data: tp, error: tpErr } = await supabase.from('test_prompts').select('id, organization_id');
console.log('test_prompts:', tp?.length, 'error:', tpErr);

// Test 3: test_reports — admin only, own org
const { data: tr, error: trErr } = await supabase.from('test_reports').select('id, organization_id');
console.log('test_reports:', tr?.length, 'error:', trErr);

// Test 4: founder_metrics — admin only, own org
const { data: fm, error: fmErr } = await supabase.from('founder_metrics').select('id, organization_id');
console.log('founder_metrics:', fm?.length, 'error:', fmErr);

// Test 5: saved_intel_configs — own rows or admin sees org
const { data: sic, error: sicErr } = await supabase.from('saved_intel_configs').select('id, organization_id, user_id');
console.log('saved_intel_configs:', sic?.length, 'error:', sicErr);

// Test 6: enterprise_trackers — own rows or admin sees org
const { data: et, error: etErr } = await supabase.from('enterprise_trackers').select('id, organization_id, user_id');
console.log('enterprise_trackers:', et?.length, 'error:', etErr);
```

**Expected:** All queries return ONLY rows where `organization_id` matches user's org. No data from other organizations.

### 12b. Verify Public/Reference Tables Still Return All Data

```javascript
// These should return ALL rows (public read policies)
const { data: ic } = await supabase.from('industry_contexts').select('id');
console.log('industry_contexts:', ic?.length); // Expected: ~30

const { data: pc } = await supabase.from('procurement_categories').select('id');
console.log('procurement_categories:', pc?.length); // Expected: ~30

const { data: vr } = await supabase.from('validation_rules').select('id');
console.log('validation_rules:', vr?.length); // Expected: all rows

const { data: mi } = await supabase.from('market_insights').select('id');
console.log('market_insights:', mi?.length); // Expected: all rows (globally readable)
```

### 12c. Verify Direct Access to shared_reports Is Blocked

```javascript
// shared_reports has FALSE policies — direct access should return empty
const { data: sr, error: srErr } = await supabase.from('shared_reports').select('*');
console.log('shared_reports direct:', sr?.length, 'error:', srErr);
// Expected: 0 rows or error (access only via RPCs)
```

### 12d. Cross-Org Write Prevention

```javascript
// Try to insert with a different organization_id — should be blocked by WITH CHECK
const { error: insertErr } = await supabase.from('saved_intel_configs').insert({
  name: 'test',
  config: {},
  organization_id: '00000000-0000-0000-0000-000000000099' // fake org
});
console.log('Cross-org insert:', insertErr); // Expected: error (policy violation)
```

**Checklist:**
- [ ] 12.1 — Org-scoped tables only return own org's data
- [ ] 12.2 — Reference tables return all rows (public read)
- [ ] 12.3 — `shared_reports` direct SELECT returns 0 rows (RPC-only)
- [ ] 12.4 — Cross-org insert blocked by WITH CHECK policy
- [ ] 12.5 — UPDATE with different `user_id` blocked on `saved_intel_configs`

**Validates:** C (all 36 org-scoped RLS policies), B (organization_id column isolation), E (security fixes)

---

## PHASE 13: Anonymous Features

Test features that should work without login. Validates public policies and anonymous access.

> **Important correction:** chat-copilot **requires authentication** (JWT Bearer token). It is NOT available anonymously. Only `scenario-tutorial` and public INSERT tables are truly anonymous.

**Steps (open app in incognito/private browser — no session):**

| # | Action | Expected | Validates |
|---|--------|----------|-----------|
| 13.1 | Open scenario page, check tutorial tips | Tutorial loads (scenario-tutorial is public) | D |
| 13.2 | Submit scenario feedback (rating) | INSERT succeeds (anon INSERT allowed on scenario_feedback) | C |
| 13.3 | Submit contact form | INSERT succeeds (public INSERT on contact_submissions) | C |
| 13.4 | Try chatbot | Should fail or show auth prompt (chat-copilot requires JWT) | D |
| 13.5 | Navigate to `/admin/dashboard` | Redirect to `/auth` or show nothing | C |
| 13.6 | Navigate to `/market-intelligence` | Page loads but queries require auth | C |
| 13.7 | Try to run Sentinel analysis | May work with soft auth (limited features) | D |

**Checklist:**
- [ ] 13.1 — Scenario tutorial loads without auth
- [ ] 13.2 — Scenario feedback submission works anonymously
- [ ] 13.3 — Contact form submission works anonymously
- [ ] 13.4 — Chatbot correctly requires authentication
- [ ] 13.5 — Admin dashboard not accessible without auth
- [ ] 13.6 — Market intelligence queries blocked without auth
- [ ] 13.7 — Sentinel soft-auth behavior verified

**Validates:** C (anon INSERT policies, public SELECT policies), D (auth requirements per function)

---

## PHASE 14: Edge Function Error Handling

Test graceful degradation across all edge functions.

**Steps:**
1. Check Supabase Dashboard → Edge Functions → Logs for any errors during prior testing phases
2. Review browser Network tab for any 500 errors during normal usage
3. Test empty input: send empty message to chatbot → should return friendly error, not crash
4. Test rate limiting: if Google returns 429, functions should return user-friendly message
   - chat-copilot: returns 200 with "I'm receiving too many requests right now..."
   - scenario-chat-assistant: returns 429 with error message
   - sentinel-analysis: retries up to 3× with exponential backoff (1s, 2s, 4s), then returns error
5. Verify CORS headers present on all responses (check `Access-Control-Allow-Origin: *`)

**Checklist:**
- [ ] 14.1 — No 500 errors in Edge Function logs from prior testing
- [ ] 14.2 — No 500 errors in browser Network tab
- [ ] 14.3 — Empty input handled gracefully (no crashes)
- [ ] 14.4 — CORS headers present on all edge function responses
- [ ] 14.5 — OPTIONS pre-flight requests handled correctly

**Validates:** D (error handling, retry logic, CORS configuration)

---

## PHASE 15: Database Integrity Verification

Run these queries in Supabase SQL Editor after completing all test phases.

### 15.1 — All org-scoped tables have `organization_id` populated

```sql
SELECT 'saved_intel_configs' AS tbl, count(*) AS total, count(organization_id) AS with_org FROM saved_intel_configs
UNION ALL SELECT 'enterprise_trackers', count(*), count(organization_id) FROM enterprise_trackers
UNION ALL SELECT 'chat_feedback', count(*), count(organization_id) FROM chat_feedback
UNION ALL SELECT 'founder_metrics', count(*), count(organization_id) FROM founder_metrics
UNION ALL SELECT 'test_prompts', count(*), count(organization_id) FROM test_prompts
UNION ALL SELECT 'test_reports', count(*), count(organization_id) FROM test_reports
UNION ALL SELECT 'intel_queries', count(*), count(organization_id) FROM intel_queries
UNION ALL SELECT 'shared_reports', count(*), count(organization_id) FROM shared_reports;
-- Expected: total = with_org for ALL tables (no NULLs — columns are NOT NULL)
```

### 15.2 — Profile exists for logged-in user

```sql
SELECT id, display_name, organization_id, role FROM profiles;
-- Expected: at least 1 row with the test user
```

### 15.3 — Organization exists

```sql
SELECT id, name, settings FROM organizations;
-- Expected: at least the default org ('00000000-0000-0000-0000-000000000001')
```

### 15.4 — Policy count is correct

```sql
SELECT count(*) FROM pg_policies WHERE schemaname = 'public';
-- Expected: 36
```

### 15.5 — No LOVABLE references in edge function secrets

Check in Supabase Dashboard → Edge Functions → Secrets:
- `LOVABLE_API_KEY` should NOT exist
- `GOOGLE_AI_STUDIO_KEY` should exist
- `PERPLEXITY_API_KEY` should exist

### 15.6 — Auto-set triggers exist (8 total)

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'trg_auto_org_%'
ORDER BY event_object_table;
-- Expected: 8 triggers on: chat_feedback, enterprise_trackers, founder_metrics,
--   intel_queries, saved_intel_configs, shared_reports, test_prompts, test_reports
```

### 15.7 — Guard trigger exists

```sql
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trg_guard_profile_update';
-- Expected: 1 row
```

### 15.8 — Auth triggers exist

```sql
SELECT trigger_name, event_object_table, event_object_schema
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'on_org_created');
-- Expected: 2 triggers
--   on_auth_user_created on auth.users
--   on_org_created on public.organizations
```

### 15.9 — Foreign keys on user_id columns

```sql
SELECT tc.table_name, tc.constraint_name, kcu.column_name,
       ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id'
  AND tc.table_schema = 'public';
-- Expected: FKs on saved_intel_configs.user_id and enterprise_trackers.user_id → auth.users
```

### 15.10 — get_evolutionary_directives is admin-only

```sql
-- Should fail for non-admin or anonymous
SELECT has_function_privilege('anon', 'get_evolutionary_directives(integer)', 'EXECUTE');
-- Expected: false

SELECT has_function_privilege('authenticated', 'get_evolutionary_directives(integer)', 'EXECUTE');
-- Expected: true (but function internally checks is_org_admin)
```

**Checklist:**
- [ ] 15.1 — All org-scoped tables: `total = with_org` (no NULL org_ids)
- [ ] 15.2 — Profile exists for test user
- [ ] 15.3 — Default organization exists
- [ ] 15.4 — Policy count = 36
- [ ] 15.5 — No LOVABLE_API_KEY in edge function secrets
- [ ] 15.6 — 8 auto-set org triggers exist
- [ ] 15.7 — Guard profile update trigger exists
- [ ] 15.8 — Auth triggers exist (on_auth_user_created, on_org_created)
- [ ] 15.9 — Foreign keys exist on user_id columns
- [ ] 15.10 — get_evolutionary_directives revoked from anon

**Validates:** A (schema integrity), B (triggers, functions), C (policies), E (security fixes)

---

## Summary Checklist

| Phase | Tests | Validates |
|-------|-------|-----------|
| 0. Prerequisites | 4 | Infrastructure |
| 1. Public Pages | 11 | A, C |
| 2. Authentication | 6 | A, B |
| 3. Organization Setup | 4 | B, C |
| 4. Admin Dashboard | 4 | A, C |
| 5. Chatbot | 5 | D |
| 6. Scenario Tutorial | 4 | D |
| 7. Scenario Chat Assistant | 5 | D |
| 8. Sentinel Analysis | 7 | A, D |
| 9. Market Intelligence | 4 | C, D |
| 10. Market Snapshot | 5 | D |
| 11. Shared Reports | 6 | A, C |
| 12. Data Isolation | 5 | B, C, E |
| 13. Anonymous Features | 7 | C, D |
| 14. Error Handling | 5 | D |
| 15. Database Integrity | 10 | A, B, C, E |
| **Total** | **92** | |

**Legend:**
- **A** = Database Migration
- **B** = Multi-Tenancy Phase 1 (orgs, profiles, triggers)
- **C** = Multi-Tenancy Phase 2 (RLS overhaul, 36 policies)
- **D** = Edge Function Migration (Lovable → Google AI Studio)
- **E** = Security Fixes
