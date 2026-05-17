# EXOS Backend Security Audit — 2026-05-17

**Scope:** Supabase Edge Functions (27) and Postgres migrations / RLS / SECURITY DEFINER functions (58 migrations) at `/home/user/exos-ux-replica/supabase/`.
**Method:** Two parallel sub-audits — (A) edge functions, (B) database / RLS / migrations. Post-PR-#34 follow-up.
**Companion doc:** `docs/security-audit-frontend-2026-05-17.md`.

---

## Headline

**4 production-breaking regressions** were introduced when PR #34 changed `corsHeaders` from a static object to a function `corsHeaders(req)`: the refactor was not applied everywhere, so `chat-copilot` and `send-team-invite` are currently broken in browsers and `draft-scenario-fields` / `evaluate-project-coverage` have duplicate-auth blocks that silently drop CORS on the error path.

**2 SECURITY DEFINER functions** that the previous audit flagged for lockdown (`cleanup_rate_limits`, `save_intel_to_knowledge_base`) were **not** addressed in PR #34 — they remain callable by every authenticated user (and `cleanup_rate_limits` by anon).

The schema and RLS layer is otherwise in good shape: every PR #34 migration fix re-verified intact.

---

## Critical

### 1. `chat-copilot` — bare `corsHeaders` references break preflight + every response
**File:** `supabase/functions/chat-copilot/index.ts:153,169,192,290,302,328`

PR #34 made `corsHeaders` a function. `chat-copilot` was not updated. Line 153 passes the function as `HeadersInit` (throws `TypeError` in preflight); lines 169/192/290/302/328 spread a function (which has no own enumerables) so every JSON response ships with no `Access-Control-Allow-Origin`, no `Vary`, no CSP, no `X-Content-Type-Options`. Browsers refuse to expose the response.

**Fix:** replace every occurrence with `corsHeaders(req)`.

### 2. `draft-scenario-fields` — duplicate auth block + bare `corsHeaders`
**File:** `supabase/functions/draft-scenario-fields/index.ts:42-49`

Outer `authenticateRequest` runs correctly (lines 31-40). An inner duplicate block then re-authenticates and uses `{ ...corsHeaders, ... }` (function spread → empty), so the inner failure path returns a CORS-less 401/403. Also doubles the Auth API call cost per request.

**Fix:** delete the inner duplicate block.

### 3. `evaluate-project-coverage` — identical duplicate-auth pattern
**File:** `supabase/functions/evaluate-project-coverage/index.ts:42-49`. Same pattern; same fix.

### 4. `send-team-invite` — `jsonResponse` references `req` from out-of-scope
**File:** `supabase/functions/send-team-invite/index.ts:28-33`

```ts
function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },  // req: ReferenceError
  });
}
Deno.serve(async (req) => { ... jsonResponse(...) ... });
```

`jsonResponse` is module-scoped; `req` belongs to the `Deno.serve` callback and is not in `jsonResponse`'s lexical scope. **Every** call site (send/resend/revoke, 401, 403, 404, 409, 500) throws `ReferenceError: req is not defined`. Only the OPTIONS preflight (which doesn't use `jsonResponse`) works. The team-invite endpoint is currently unusable.

**Fix:** move `jsonResponse` inside `Deno.serve` (closure capture of `req`) or take `req` as the first parameter and pass it at every call site.

### 5. `cleanup_rate_limits()` callable by **anyone** → wipes all rate-limit history
**File:** `supabase/migrations/20260310124845_create_rate_limits.sql:20-27`

```sql
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$ DELETE FROM public.rate_limits WHERE created_at < now() - interval '2 hours'; $$;
```

No `REVOKE EXECUTE FROM PUBLIC`, no `auth.uid()` check. Any client (anon or authenticated) can call `select cleanup_rate_limits();` and erase 2-hour-old rate-limit rows, defeating per-user rate limits on every AI-spending endpoint.

**Fix:**
```sql
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'cleanup_rate_limits is service_role only';
  END IF;
  DELETE FROM public.rate_limits WHERE created_at < now() - interval '2 hours';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;
```

### 6. `save_intel_to_knowledge_base()` callable by any authenticated user → AI knowledge-base poisoning
**File:** `supabase/migrations/20260305185732_baseline_schema.sql:322-363`

Internal check only requires `auth.uid() IS NOT NULL`, then inserts caller-supplied content into `market_insights` (which is **globally readable** — RLS SELECT is `TO public USING (true)`). Any logged-in user can plant adversarial content (prompt-injection payloads, fake regulatory claims) tagged under any `industry_slug`/`category_slug`; the data flows into downstream LLM grounding prompts served to every other tenant.

**Fix:**
```sql
REVOKE EXECUTE ON FUNCTION public.save_intel_to_knowledge_base(...) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.save_intel_to_knowledge_base(...) TO service_role;
```
Route writes through an edge function that authenticates the agent context.

---

## High

### 7. Stripe webhook idempotency row written **before** mutation — retries permanently blocked on transient failure
**File:** `supabase/functions/stripe-webhook/index.ts:57-76, 78-150`

The `stripe_events` insert happens before applying the subscription/profile updates. If the mutation throws (transient DB error, schema mismatch, missing `user_id`), the function returns 500, Stripe retries, and the retry short-circuits at the unique-violation with `{ duplicate: true }` — **without** ever applying the missed state change. Subscription rows drift permanently out of sync.

**Fix:** add `processed_at TIMESTAMPTZ NULL` to `stripe_events`. Only stamp it after the switch-case succeeds. On retry, treat null `processed_at` as not-yet-applied and replay.

### 8. `im-driver-propose` still uses `supabase.auth.getClaims()` + unbounded `driver_count_target`
**File:** `supabase/functions/im-driver-propose/index.ts:38, 54, 82`

`getClaims` verifies signature + expiry only — not revocation. A revoked JWT keeps working until expiry. `driver_count_target` has no upper bound, gets interpolated into the system prompt, and Gemini will happily generate against the request. `goodsDefinition` is inlined into the user prompt without tag-block wrapping.

**Fix:** switch to `authenticateRequest`; cap `driver_count_target` to `1..20`; wrap user input in `<goods>…</goods>` tags.

### 9. `run-inflation-scan` — LLM output drives DB writes via naive substring match
**File:** `supabase/functions/run-inflation-scan/index.ts:240-257`

```ts
if (sectionText.includes("**deteriorating**") || sectionText.includes("deteriorating")) {
  newStatus = "deteriorating";
}
await adminClient.from("inflation_drivers").update({ current_status: newStatus }).eq("id", d.id);
```
Perplexity output (which contains text from external web pages) is parsed by substring search. Any third-party page indexed by Perplexity that contains the trigger word can flip the driver's `current_status`, which then surfaces in procurement decisions.

**Fix:** require structured JSON via function-call schema (the helper supports it); validate `status` against an allowlist before writing.

### 10. `create-checkout-session` / `create-portal-session` — `Origin` header trusted in Stripe redirect URLs
**File:** `supabase/functions/create-checkout-session/index.ts:50, 63-64`; `create-portal-session/index.ts:68`

```ts
const origin = req.headers.get("origin") ?? "https://exosproc.com";
success_url: `${origin}/account?checkout=success`,
cancel_url:  `${origin}/pricing?checkout=cancelled`,
```
A non-browser caller (or proxied request) supplying `Origin: https://evil.example/` makes Stripe redirect the user there after payment.

**Fix:** validate `Origin` against the same allowlist regex in `_shared/cors.ts`, or hard-pin to a `SITE_URL` env var.

### 11. `chat-copilot` rate limit keyed on forgeable `x-forwarded-for`
**File:** `supabase/functions/chat-copilot/index.ts:176-180`. Same pattern PR #34 fixed in `route-feedback`. An anonymous caller can rotate the header per request to bypass the 10/hour Gemini Pro rate limit.

**Fix:** switch to `Deno.serve(async (req, info) => …)` and use `info?.remoteAddr.hostname` for the `anon:` key.

### 12. `send-transactional-email` — non-allowlisted recipients need only **any** authenticated JWT
**File:** `supabase/functions/send-transactional-email/index.ts:177-198`

Any logged-in user can call the endpoint directly (bypassing `send-team-invite`'s admin check) and send the `team-invite` template — no hardcoded `to`, attacker-controlled `inviterName` / `organizationName` — to any address from the verified `notify.exosproc.com` domain. Credible-looking brand-real phishing.

**Fix:** require admin role for non-allowlisted recipients, OR gate by an `X-Internal-Source` header signed with a per-request HMAC that only `send-team-invite` can produce, OR hardcode `to` per template (force internal-only invocation paths).

### 13. Helper functions accept arbitrary `_user_id` — directory-harvest primitive
**Files:** `supabase/migrations/20260305195130_helper_functions.sql:31-84`, `supabase/migrations/20260310130000_add_super_admin.sql:25-36`

`is_super_admin(_user_id)`, `get_user_org_id(_user_id)`, `get_user_org_role(_user_id)`, `is_org_admin(_user_id)` are all `SECURITY DEFINER`, run against `profiles` with the parameter rather than `auth.uid()`, and never had `REVOKE EXECUTE FROM PUBLIC`. Any authenticated (or anonymous) caller can enumerate:
```sql
select is_super_admin('<arbitrary-uuid>');     -- discovers super-admins
select get_user_org_id('<arbitrary-uuid>');    -- maps users to orgs
select get_user_org_role('<arbitrary-uuid>');  -- reveals roles
```
This confirms the open item from the frontend audit (the `_user_id` argument from `ProtectedRoute.tsx`): the SQL side has zero defense.

**Fix:** add a self-or-super-admin check inside each function (keep `auth.uid() = _user_id` as the fast path; require super-admin for cross-user inspection; allow service_role unconditionally).

### 14. `handle_new_user` invite-accept branch may run before email confirmation
**File:** `supabase/migrations/20260419143532_update_handle_new_user_for_invites.sql:9-65`

The `AFTER INSERT ON auth.users` trigger accepts the invite when `lower(invitee_email) = lower(NEW.email)`. There is no `NEW.email_confirmed_at IS NOT NULL` check. If email confirmation is disabled in the Supabase Auth project settings, an attacker who knows an invite token + invitee email can sign up unconfirmed and join the org.

**Fix:** add `IF NEW.email_confirmed_at IS NULL THEN RETURN NEW; END IF;` to defer invite acceptance until confirmation; or move acceptance into a separate RPC the user calls after confirming.

### 15. `auto_set_organization_id` default-org fallback is a cross-tenant data sink
**File:** `supabase/migrations/20260305204137_new_org_scoped_policies.sql:42-72`

Any service-role write that forgets to set `organization_id` is silently misfiled into the Default Organization (`00000000-…-0001`). Combined with `intel_queries`' policy that lets any user with `organization_id = get_user_org_id(auth.uid())` read (i.e. any default-org member), this becomes a global read-everything sink for platform staff seeded into default org. Pre-multi-tenancy `intel_queries` rows backfilled into default org are still readable.

**Fix:** convert the fallback to a hard error (`RAISE EXCEPTION 'organization_id is required'`); require service-role callers to set the field explicitly; fence the default org so no real user belongs to it.

### 16. `preview-transactional-email` IP rate-limit on forgeable `x-forwarded-for`
**File:** `supabase/functions/preview-transactional-email/index.ts:37-41`. Lower exploit value (LOVABLE_API_KEY gates the endpoint) but defense-in-depth gap.

**Fix:** use `Deno.serve(req, info)`.

---

## Medium

### 17. `inflation_trackers` / `inflation_drivers` INSERT not hardened with `created_by = auth.uid()`
**File:** `supabase/migrations/20260514061559_c3ddce9b-057d-4ef6-ace3-7e6084da37b1.sql`

The migration tightened SELECT/UPDATE/DELETE to require `created_by = auth.uid()` for ownership but left INSERT as `organization_id = get_user_org_id(auth.uid())` only. A user can plant a tracker with `created_by = <colleague>` — the colleague "owns" the row per the new policies.

**Fix:** add `auth.uid() = created_by` to INSERT WITH CHECK on both tables.

### 18. PII / business-string logging via `console.log`
**Files:** `send-transactional-email/index.ts:211-214, 233, 257, 289-291, 316-319, 341, 413-417, 433-437` (full email + template/error info); `handle-email-unsubscribe/index.ts:133, 150-157` (logs full token + email).

`handle-email-suppression` already redacts correctly (`<first>***@<domain>`) — apply same pattern everywhere.

### 19. Raw upstream error messages returned to client
**Files:** `run-monitor-scan/index.ts:163-164, 213`; `run-inflation-scan/index.ts:160-161, 272`. Perplexity error bodies sometimes echo API-key fragments or upstream stack traces.

**Fix:** return generic message; keep details in `console.error` / Sentry only.

### 20. `user` / `authResult` / `tracer` referenced in catch blocks where block-scoped
**Files:** `run-monitor-scan/index.ts:211`, `run-inflation-scan/index.ts:270`, `scenario-chat-assistant/index.ts:299`, `market-intelligence/index.ts:350`.

Either silently `undefined` (via `typeof X !== "undefined"`) or hard `ReferenceError` swallowed by an outer `try`. Result: Sentry never tags `userId`; a second exception is dropped.

**Fix:** hoist `let X: T | undefined;` before the `try`.

### 21. Google API key in URL query string
**File:** `supabase/functions/_shared/google-ai.ts:136` — `${BASE_URL}/${model}:generateContent?key=${apiKey}`. Secret travels through any proxy or diagnostic log.

**Fix:** move to header `x-goog-api-key`.

### 22. `scenario-chat-assistant` / `market-snapshot` — user-supplied strings interpolated into system prompts without tag boundaries
**Files:** `scenario-chat-assistant/index.ts:53-58, 117-126` (`scenarioFields[].label/description/placeholder`); `market-snapshot/index.ts:111, 209, 211` (`industryContext`).

5000-char user input flows raw into system prompts. Server-side must not trust frontend.

**Fix:** wrap in `<![CDATA[…]]>` or `<industry-context>…</industry-context>` tags; or fetch canonical config from DB (service-role client already available).

### 23. `validate.ts` `validationErrorResponse` is called without `req`
**File:** `supabase/functions/_shared/validate.ts:25-30` plus 30+ call sites (`chat-copilot:315`, `generate-pdf:143`, `generate-excel:122`, etc.). Optional `req?` is never passed → origin always defaults. Validation errors lose ACAO match for Vercel preview / localhost.

**Fix:** make `req` required and update all callers.

### 24. `org_invitations` lacks DELETE policy / per-org invite rate limit
**File:** `supabase/migrations/20260419143529_create_org_invitations.sql`. Compromised admin account can mass-spam invites (each triggers `enqueue_email`). Pending invites accumulate indefinitely.

**Fix:** add admin DELETE policy + application-level rate limit on invite creation.

---

## Low / Info

| # | Item | File |
|---|---|---|
| 25 | `pipeline_iq_stats` view granted `SELECT TO anon` (inert today because of `security_invoker = on`; remove for hygiene) | `20260305185732_baseline_schema.sql:579` |
| 26 | `scenario_drafts` policy uses `FOR ALL` (functional but harder to audit / add super-admin bypass) | `20260413184818_*.sql:34-38` |
| 27 | `chatbot_sessions` has no SELECT-by-self — only admins can read | `20260322121114_*.sql` |
| 28 | Payload-size cap only fires when `Content-Length` is set; chunked uploads bypass | `generate-pdf/index.ts`, `generate-excel/index.ts` |
| 29 | `file-download` records IP from forgeable `x-forwarded-for` (audit-log only — not auth) | `file-download/index.ts:128,167` |
| 30 | `scenario-tutorial` / `draft-scenario-fields` interpolate `scenarioTitle` unwrapped into prompts (500-char cap; low exploit value) | both `index.ts` |

---

## Verified intact (PR #34 fixes re-confirmed)

### Edge functions
- `_shared/auth.ts` `getUserOrgId()` discriminated union still in place; no null-as-bypass anywhere.
- `_shared/cors.ts` `corsHeaders(req)` function form intact; `25fbe7a` widened regex to allow `www.exosproc.com`. (Regression is at call sites — see #1–#4.)
- `extract-file-content` org check + 15 MB cap before parser invocation (`extract-file-content/index.ts:144-161, 191-195`).
- `generate-pdf` / `generate-excel` `authResult` request-local + 500 KB payload cap.
- `handle-email-unsubscribe` RFC 8058 One-Click model holds.
- `create-portal-session` no email-fallback for Stripe customer.
- `route-feedback` uses `Deno.serve(req, info).remoteAddr.hostname`.
- Sentinel analysis: anonymization pipeline + service-role writes gated on resolved `userOrgId` + fileIds filtered before fetch + server-side model allowlist.
- All `fetch(...)` URLs are constant or fixed-base + non-user path — no SSRF.

### Database
- `guard_profile_update` Block 1 (NULL→org) + Block 4 (billing + email pins) intact.
- `enqueue_email` requires `auth.uid() IS NULL` + EXECUTE REVOKEd from PUBLIC/anon/authenticated.
- `stripe_events` table RLS-on, zero policies (service-role only).
- `chatbot_sessions` INSERT/UPDATE require `organization_id = get_user_org_id(auth.uid())`.
- `handle_new_user_funnel()` carries `SET search_path = public, pg_catalog`.
- All four super-admin RPCs (`get_founder_metrics`, `get_coaching_cards`, `get_methodology_configs`, `get_methodology_change_log`) re-check `is_super_admin(auth.uid())` and `EXECUTE` is granted to `authenticated` only.
- Funnel views (`v_funnel_overview`, `v_checkpoint_dropoff`, `v_user_journey`, `v_weekly_cohort_health`) have `security_invoker = on`.
- Storage bucket `user-files` policies enforce org + user path segments; CHECK constraint on `storage_path` blocks traversal.

---

## RLS coverage matrix (current)

| Table | RLS | Org-scoped | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|---|
| `chat_feedback` | ✓ | ✓ | auth own user/org + anon to default-org | — | — | OK |
| `chatbot_sessions` | ✓ | ✓ | own AND org | own AND org | — | PR #34 fix intact |
| `coaching_cards` | ✓ | — global | super_admin | super_admin | super_admin | Methodology IP |
| `contact_submissions` | ✓ | — | public WITH CHECK (true) | — | — | Public form |
| `email_send_log` | ✓ | — | DENY | DENY | DENY | service-role only |
| `email_unsubscribe_tokens` | ✓ | — | DENY | DENY | DENY | service-role only |
| `enterprise_trackers` | ✓ | ✓ | own AND org | own AND org | own AND org | OK |
| `file_access_audit` | ✓ | ✓ | (no policy) | (no policy) | (no policy) | service-role only, audit integrity OK |
| `founder_metrics` | ✓ | ✓ | org_admin AND org | org_admin AND org | — | Read via `get_founder_metrics` RPC |
| `industry_contexts` | ✓ | — global | — | — | — | Reference data |
| `inflation_alerts` | ✓ | ✓ | — | org match | — | service-role writes |
| `inflation_drivers` | ✓ | ✓ | **org only — `created_by` not enforced (#17)** | own | own | M1 |
| `inflation_event_scans` | ✓ | ✓ | org match | — | — | OK |
| `inflation_trackers` | ✓ | ✓ | **org only — `created_by` not enforced (#17)** | own AND org | own AND org | M1 |
| `intel_queries` | ✓ | ✓ | — service-role | — | — | Default-org spillover (#15) |
| `market_insights` | ✓ | — global | — | — | — | Write only via SECURITY DEFINER (broken, #6) |
| `methodology_change_log` | ✓ | — | — trigger-only | — | — | OK |
| `methodology_config` | ✓ | — | super_admin | super_admin | — | OK |
| `monitor_reports` | ✓ | ✓ | DENY (false) | — | — | service-role only |
| `org_invitations` | ✓ | ✓ | org_admin in org AND inviter=self | org_admin in org | — | No DELETE policy (#24) |
| `organizations` | ✓ | by id | only-if-no-current-org | super_admin / admin own | — | OK |
| `procurement_categories` | ✓ | — global | — | — | — | Reference data |
| `profiles` | ✓ | ✓ | trigger-only | self/admin/super_admin (with pins) | — | PR #34 pins intact |
| `project_files` | ✓ | ✓ | own/org_admin AND org | — | own/org_admin AND org | OK |
| `projects` | ✓ | ✓ | own AND org | own/admin AND org | own/admin AND org | OK |
| `rate_limits` | ✓ | — | DENY | DENY | DENY | service-role only — but `cleanup_rate_limits()` is unguarded (#5) |
| `saved_intel_configs` | ✓ | ✓ | own AND org | own AND org | own AND org | OK |
| `scenario_drafts` | ✓ | — | own (FOR ALL) | own | own | M7 stylistic |
| `scenario_feedback` | ✓ | — | public WITH CHECK (true) | — | — | Public form |
| `scenario_field_config` | ✓ | — global | super_admin | super_admin | super_admin | OK |
| `scenario_file_attachments` | ✓ | ✓ | own AND org | — | own AND org | OK |
| `shared_reports` | ✓ | — (tracking) | DENY | DENY | DENY | RPC-only |
| `stripe_events` | ✓ | — | (no policies) | (no policies) | (no policies) | service-role only (idempotency) |
| `suppressed_emails` | ✓ | — | DENY | DENY | DENY | service-role only |
| `test_prompts` | ✓ | ✓ | org_admin AND org | — | — | OK |
| `test_reports` | ✓ | ✓ | org_admin AND org | — | — | OK |
| `user_files` | ✓ | ✓ | own AND org | storage UPDATE | own AND org | Tightened in `20260430162104` |
| `user_funnel_events` | ✓ | by user | auth `user_id IS NULL or =auth.uid()` | — | — | OK |
| `validation_rules` | ✓ | — global | — | — | — | Reference data |

---

## Severity summary

| Severity | Count |
|---|---|
| Critical | 6 |
| High | 10 |
| Medium | 8 |
| Low / Info | 6 |

---

## Recommended fix order

1. **Today (production-breaking):** #1–#4 — the four CORS / closure regressions. `chat-copilot` and `send-team-invite` are broken from a browser right now. Reproduce in staging to confirm.
2. **Today (one-line migrations):** #5 lock down `cleanup_rate_limits()`, #6 lock down `save_intel_to_knowledge_base()`. Same shape as the PR #34 `enqueue_email` fix.
3. **This week:** #7 Stripe webhook `processed_at` flag; #8 `im-driver-propose` switch to `authenticateRequest`; #9 structured-JSON for inflation-scan status writes; #10 origin allowlist on checkout/portal URLs; #13 self-or-super-admin guards on helper RPCs; #14 invite-accept gated on `email_confirmed_at`; #15 kill default-org fallback or fence the default org.
4. **Then:** #11 / #16 Deno `info.remoteAddr` migration; #12 `send-transactional-email` HMAC; #17 `inflation_*` INSERT `created_by` enforcement; #18 PII logging redaction; #19 generic upstream error messages; #20 hoist catch-block variables; #21 Google API key in header; #22 tag-wrap user input in LLM prompts; #23 require `req` in `validationErrorResponse`; #24 invite DELETE policy.
