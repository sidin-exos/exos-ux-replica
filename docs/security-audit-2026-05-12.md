# EXOS Security Audit — Consolidated Report

**Date:** 2026-05-12
**Branch:** `claude/security-audit-exos-MbGgs`
**Scope:** Supabase Edge Functions (27), Postgres migrations / RLS (45), React/Vite frontend (`src/`, `index.html`, `vercel.json`).

Three parallel deep-dive audits ran across the codebase. Findings below are sorted by severity. File paths and remediation are concrete enough to action immediately.

---

## TOP-PRIORITY (fix before next deploy)

### 1. Subscription / billing self-escalation
**File:** `supabase/migrations/20260325135127_security_scanner_findings.sql` (`guard_profile_update` + profiles UPDATE policy), combined with `20260422085725_*.sql` (added `stripe_*`, `subscription_status`, `trial_ends_at`, `current_period_end` to `profiles`).

The hardened self-update WITH CHECK pins only `role` and `is_super_admin`. Stripe/subscription columns are unrestricted.

**Impact:** any authenticated user can run `UPDATE profiles SET subscription_status='active', current_period_end='2099-01-01' WHERE id = auth.uid()` and bypass the paywall; can also rewrite `stripe_customer_id` to point at another customer (refund / billing-confusion fraud).

**Fix:** extend `guard_profile_update` (Block 4) to reject `IS DISTINCT FROM` on every billing column unless caller is super-admin or service_role; mirror the pins in the policy WITH CHECK.

```sql
IF NOT public.is_super_admin(auth.uid()) AND auth.uid() = NEW.id AND (
    NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id OR
    NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id OR
    NEW.subscription_status IS DISTINCT FROM OLD.subscription_status OR
    NEW.subscription_price_id IS DISTINCT FROM OLD.subscription_price_id OR
    NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at OR
    NEW.current_period_end IS DISTINCT FROM OLD.current_period_end
) THEN
    RAISE EXCEPTION 'Billing fields cannot be modified by user';
END IF;
```

### 2. `enqueue_email` is callable by anon/authenticated
**File:** `supabase/migrations/20260324214501_*.sql:61-83`

`SECURITY DEFINER` function with no auth check, no allowlist, no rate limit. By default EXECUTE is granted to PUBLIC, so anyone — including unauthenticated — can `select enqueue_email('x', '{"to":"victim@…","label":"reset_password",…}')` and queue arbitrary outbound mail (spam / phishing via your domain).

**Fix:** `REVOKE EXECUTE … FROM PUBLIC, anon, authenticated;` plus internal `auth.uid() IS NOT NULL` and a label allowlist. Same `REVOKE` treatment needed for `cleanup_rate_limits`, `save_intel_to_knowledge_base`.

### 3. Unauthenticated LLM endpoints (cost-drain)
**Files:** `supabase/functions/draft-scenario-fields/index.ts`, `evaluate-project-coverage/index.ts`

Both have `verify_jwt = false`, no in-code auth, no rate limit, call Gemini 3.1 Pro with up to 4096 output tokens. Anonymous internet callers can drain the AI Studio budget.

**Fix:** wrap with `authenticateRequest` + `checkRateLimit(userId, '<fn>', 30, 60, { failClosed: true })` and length-cap all string inputs.

### 4. `generate-excel` stores `authResult` at module scope — cross-request identity leak
**File:** `supabase/functions/generate-excel/index.ts:29`

`let authResult` is declared outside `serve()`. Deno isolates serve concurrent requests on one event loop, so a second request can overwrite it while the first is still awaiting PDF generation: rate-limit rows, Sentry tags, and audit attribution get applied to the wrong user.

**Fix:** move `let authResult` inside the handler closure. Same anti-pattern (`authResult` / `user` referenced outside its `try`) silently breaks Sentry tagging in `generate-pdf/index.ts:122`, `scenario-chat-assistant/index.ts:299`, `run-monitor-scan/index.ts:211`, `run-inflation-scan/index.ts:270`.

### 5. Stripe webhook: no idempotency / replay protection
**File:** `supabase/functions/stripe-webhook/index.ts`

Signature is verified, but there is no `stripe_events(id PK)` insert before processing. Stripe retries on 5xx, and signature tolerance is 5 minutes — `customer.subscription.deleted` followed by a replayed `updated` can flip status back to active.

**Fix:** add `stripe_events` table; insert `event.id` inside the transaction; short-circuit on unique-constraint conflict.

### 6. `handle-email-unsubscribe` — CSRF + missing rate limit
**File:** `supabase/functions/handle-email-unsubscribe/index.ts:35-57`

The RFC 8058 One-Click branch is inverted (it accepts form bodies only when the header is NOT `One-Click`), so any third-party site can submit a `<form method=POST action="…?token=ABC">` and irreversibly stamp `used_at = now()`. No rate limit either.

**Fix:** require POST with form body containing `List-Unsubscribe=One-Click`; reject mismatches; add an IP rate limit.

### 7. `window.supabase` exposed globally
**File:** `src/integrations/supabase/client.ts:19`

Any XSS instantly becomes account takeover (`window.supabase.auth.updateUser({ password })`, exfiltrate org data, etc.). The Supabase JWT also lives in `localStorage`, so the blast radius is large.

**Fix:** delete the line, or gate it with `if (import.meta.env.DEV)`.

---

## HIGH

### 8. `chatbot_sessions` cross-org insert
**File:** `20260322121114_*.sql`

INSERT/UPDATE policies check only `user_id = auth.uid()`. The `auto_set_organization_id` trigger preserves a caller-supplied `organization_id`, so a user can tag a chat session with another org's UUID and poison its admin analytics.

**Fix:** add `AND organization_id = get_user_org_id(auth.uid())` to WITH CHECK on every per-user INSERT/UPDATE policy. Audit the entire schema for this pattern.

### 9. `getUserOrgId() === null` interpreted as super-admin (IDOR)
**Files:** `supabase/functions/_shared/auth.ts:103-116`, exploited at `sentinel-analysis/index.ts:815`

The shared helper returns `null` if profile lookup fails / user has no org / row missing. `sentinel-analysis` then omits the org filter on `user_files` when `userOrgId` is null — comment claims this is for super-admins, but no super-admin check is performed. Any user without `organization_id` can `fileIds: ['<victim-id>']` and have the analyzer read+inline the file content.

**Fix:** make `getUserOrgId` discriminated (`{ orgId } | { superAdmin: true } | { error }`); never treat `null` as bypass.

### 10. `extract-file-content` lets any user trigger extraction on any file
**File:** `supabase/functions/extract-file-content/index.ts:126-141`

Code comment explicitly says "any authenticated user can trigger extraction". But extraction mutates `extracted_text`, `extraction_status`, `extracted_at` on rows in other orgs — data integrity violation + cost amplification + a chain step with #9 to deanonymize victims' files. Also no size check before parsing — XLSX/DOCX zip-bomb risk.

**Fix:** load row → fetch `organization_id` → require `getUserOrgId(userId) === row.organization_id`; size-cap blob before parse.

### 11. `create-portal-session` Stripe email fallback → cross-account billing
**File:** `supabase/functions/create-portal-session/index.ts:60-63`

If `profiles.stripe_customer_id` is empty, the function falls back to `stripe.customers.list({ email })` and uses whatever first customer comes back. If two Stripe customers share an email (email change, prior account), portal is opened for the wrong customer.

**Fix:** remove the email fallback entirely; return 404 forcing checkout to bind a customer ID.

### 12. CSP allows `'unsafe-inline'`; no response-header CSP / HSTS / frame-ancestors
**Files:** `index.html:6`, `vercel.json` (empty headers)

`script-src 'unsafe-inline'` neuters XSS mitigation; CSP delivered via `<meta>` cannot set `frame-ancestors` (so clickjacking is unrestricted). `vercel.json` ships no HSTS / X-Content-Type-Options / Referrer-Policy / Permissions-Policy.

**Fix:** move CSP to a real HTTP header via `vercel.json` "headers" with `frame-ancestors 'none'`; refactor inline gtag and the `<style>` injection in `src/components/ui/chart.tsx:69-85` (or use a CSP nonce) and drop `'unsafe-inline'`; add HSTS, X-Content-Type-Options, Referrer-Policy.

```json
"headers": [{
  "source": "/(.*)",
  "headers": [
    { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
    { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
    { "key": "Content-Security-Policy", "value": "... frame-ancestors 'none'; ..." }
  ]
}]
```

### 13. Supabase session in `localStorage`
**File:** `src/integrations/supabase/client.ts:13`

Combined with #7 and #12, an XSS yields the JWT trivially.

**Fix:** in conjunction with hardening CSP, shorten access-token TTL in Supabase settings; consider moving to SSR + cookie storage if feasible.

### 14. `route-feedback` rate limit keyed on `x-forwarded-for` (spoofable)
**File:** `supabase/functions/route-feedback/index.ts:62-69`

**Fix:** use `Deno.serve(req, info)` `info.remoteAddr`; add an aggregate global per-form cap (e.g. 200/h) regardless of IP. Add Turnstile/CAPTCHA on the public-facing forms.

### 15. PDF / Excel generation can be hammered (120/hour × 700 KB → OOM)
**Files:** `generate-pdf/index.ts:65-68`, `generate-excel/index.ts:65-68`

**Fix:** reduce to ~30/h with `failClosed: true`; cap input size at ~100 KB.

### 16. Funnel SECURITY DEFINER trigger missing `SET search_path`
**File:** `20260403213936_create_user_funnel_events.sql:29`

`handle_new_user_funnel()` runs as owner with default search_path. Latent privilege-escalation vector.

**Fix:** add `SET search_path = public, pg_catalog`.

### 17. Sensitive admin tables relied on **RLS alone** in the client
**Files:** `src/hooks/useFounderMetrics.ts:18-22`, `src/hooks/useMethodologyAdmin.ts:25-96`, `src/hooks/useAccountData.ts:68-72`

Queries are unfiltered (e.g. `from("founder_metrics").select("*")`). One missing/loose policy and investor financials leak.

**Fix:** add explicit filters in the client AND prefer SECURITY DEFINER RPCs (`get_founder_metrics()` that re-checks `is_super_admin()`).

### 18. Profile UPDATE WITH CHECK self-branch leaves `organization_id` and other PII columns unrestricted
**File:** `20260325135127_*.sql`

`guard_profile_update` only blocks NON-NULL→NON-NULL org transfers. Any historic row with `organization_id IS NULL` (pre-default-org rollout) is exploitable.

**Fix:** Block NULL→any transfer by non-super-admins; pin remaining PII columns in policy WITH CHECK.

---

## MEDIUM

- **M1** Regex-based prompt-injection filter (`_shared/validate.ts:130-143`) is bypassable and not applied to highest-risk surfaces (`sentinel-analysis`, `chat-copilot`, `scenario-chat-assistant`). Treat as best-effort, not a control.
- **M2** Regex anonymizer (`_shared/anonymizer.ts`) is heuristic — names lowercase / single-word companies leak straight to Google/Nebius. Pair with vendor DPA + retention/training disabled; do not log unmapped tokens (currently `console.warn` at `sentinel-analysis:1132`).
- **M3** Wildcard CORS on authed endpoints (`_shared/cors.ts:5`) — narrow to `https://exosproc.com` + preview; drop CORS from `stripe-webhook` and `handle-email-suppression`.
- **M4** `send-team-invite` forwards the caller's JWT to `send-transactional-email` — use an internal service token.
- **M5** Funnel views (`v_funnel_overview` etc.) lack explicit `security_invoker = on` → may bypass RLS on `user_funnel_events`.
- **M6** Weak password policy (`min(6)`) in `src/pages/ResetPassword.tsx:17` — raise to 12 and enable HIBP in Supabase Auth.
- **M7** `dangerouslySetInnerHTML` chart CSS injection (`src/components/ui/chart.tsx:69-85`) — validate `color` against a strict regex.
- **M8** Client-side admin gating in `src/components/ProtectedRoute.tsx` / `useAdminAuth.ts` is UX only — every admin mutation must be RLS-enforced.
- **M9** `im-driver-propose:42-49` uses `getClaims` (local verify) instead of `getUser` — inconsistent with the rest.
- **M10** No org-level aggregate cap on AI endpoints (`chat-copilot`, `scenario-chat-assistant`).
- **M11** `generate-test-data` admin-gated as `requireAdmin` (any org admin) — should be `requireSuperAdmin`.
- **M12** `extract-file-content` accepts arbitrary XLSX/DOCX/PDF with no pre-parse size cap — zip-bomb risk.
- **M13** `send-team-invite` duplicate-pending-invite check is racy; confirm matching unique index `(organization_id, lower(invitee_email)) WHERE status='pending'`.

---

## LOW

- **L1** Email logged unredacted in `handle-email-unsubscribe/index.ts:127`.
- **L2** Anonymous spam vector to internal support inboxes via `send-transactional-email` / `route-feedback`.
- **L3** `target="_blank"` w/o `rel="noopener"` in `src/components/auth/ConsentBlock.tsx:38,42`.
- **L4** Iframes without `sandbox` in `UserFilesManager.tsx:501-505`, `ScenarioFileAttachment.tsx:217-221`.
- **L5** `window.location.href = data.url` after `create-checkout-session` (`UpgradePlansCard.tsx:78`, `BillingSubscriptionCard.tsx:79`, `Pricing.tsx:171`, `Account.tsx:120`) — assert URL hostname matches `stripe.com`.
- **L6** Sentry `setUser({ email })` ships PII (`src/components/SentryUserSync.tsx:11`); `beforeSend` only scrubs auth errors — add explicit scrubbing of breadcrumbs / request bodies.
- **L7** `create-checkout-session` / `create-portal-session` use unvalidated `Origin` header in success/cancel URLs — allowlist preview/prod origins.
- **L8** `org_invitations` has no DELETE policy → rows accumulate; same for `chatbot_sessions`.
- **L9** `handle_new_user` puts unsanitized `display_name` into `organizations.name` — enables phishing in invite emails.
- **L10** `domainFilter` entries in `market-intelligence:140-152` not regex-validated.
- **L11** `methodology_config` SELECT requires super_admin after 20260325135127 — verify legitimate client reads still work (likely needs an edge function).
- **L12** PII in `profiles` (Stripe IDs, email, country, industry) visible to org admins — document in privacy policy.

---

## RLS coverage matrix

| Table | RLS Enabled? | Org-Scoped? | Notes |
|---|---|---|---|
| `industry_contexts` | Yes | No (global) | Public SELECT — reference data. |
| `procurement_categories` | Yes | No (global) | Public SELECT — reference data. |
| `validation_rules` | Yes | No (global) | Public SELECT — system config. |
| `market_insights` | Yes | No (global) | Public SELECT; `save_intel_to_knowledge_base` writes globally. **M3**. |
| `founder_metrics` | Yes | Yes | Admin-only, super_admin bypass. |
| `contact_submissions` | Yes | No (global) | Anon INSERT; any org admin reads. |
| `chat_feedback` | Yes | Yes | Anon/auth INSERT; admin SELECT in-org. |
| `scenario_feedback` | Yes | No | Anon INSERT; any admin reads. |
| `intel_queries` | Yes | Yes | Auth SELECT in-org; writes via service_role. |
| `saved_intel_configs` | Yes | Yes | Owner + admin in-org + super_admin. |
| `shared_reports` | Yes | Tracked | RPC-only via SECURITY DEFINER. |
| `test_prompts` | Yes | Yes | Admin/super_admin only. |
| `test_reports` | Yes | Yes | Admin/super_admin only. |
| `enterprise_trackers` | Yes | Yes | Owner + admin in-org + super_admin. |
| `organizations` | Yes | Yes | Member SELECT own; INSERT only if no org; admin UPDATE. |
| `profiles` | Yes | Yes | **#1/#18**: self-update insufficiently restricted. |
| `rate_limits` | Yes | No (per user) | service_role-only. `cleanup_rate_limits` is public. |
| `user_files` | Yes | Yes | Owner + admin in-org + super_admin. |
| `scenario_file_attachments` | Yes | Yes | Owner + admin in-org + super_admin. |
| `file_access_audit` | Yes | Yes | Admin SELECT; service_role writes (immutable). |
| `coaching_cards` | Yes | No (global) | Auth SELECT; super_admin write. |
| `scenario_field_config` | Yes | No (global) | Auth SELECT; super_admin write. |
| `methodology_config` | Yes | No (global) | super_admin only; no DELETE policy. |
| `methodology_change_log` | Yes | No (global) | super_admin SELECT; written by trigger only. |
| `chatbot_sessions` | Yes | Partial | **#8**: cross-org INSERT possible. |
| `inflation_trackers` | Yes | Yes | Full CRUD in-org. |
| `inflation_drivers` | Yes | Yes | Full CRUD in-org. |
| `inflation_event_scans` | Yes | Yes | SELECT + INSERT in-org. |
| `inflation_alerts` | Yes | Yes | SELECT + UPDATE in-org. |
| `monitor_reports` | Yes | Yes | SELECT in-org; INSERT blocked. |
| `suppressed_emails` | Yes | No | service_role only. |
| `email_unsubscribe_tokens` | Yes | No | service_role only. |
| `email_send_log` | Yes | No | super_admin SELECT only. **#2**. |
| `email_send_state` | Yes | No | super_admin SELECT only. |
| `user_funnel_events` | Yes | No | SELECT own only; writes via trigger. **#16**. |
| `scenario_drafts` | Yes | No (user-scoped) | Per-user; no org column. |
| `org_invitations` | Yes | Yes | Admin/super_admin only; no DELETE. |
| `projects` | Yes | Yes | Full CRUD in-org + super_admin. |
| `project_files` | Yes | Yes | Full CRUD in-org + super_admin. |

---

## What is solid / non-findings

- `stripe-webhook` signature verification is correct (only idempotency missing).
- `file-download` is well-built (org check, fail-closed rate limit, 60s signed URLs, audit log).
- `handle-email-suppression` uses HMAC `verifyWebhookRequest` — clean.
- `_shared/rate-limit.ts`, `_shared/google-ai.ts`, `_shared/resend.ts` are clean.
- Source maps are uploaded to Sentry and deleted from `dist` (`vite.config.ts:33-46`).
- `react-markdown` is used without `rehype-raw` — AI-generated markdown can't inject HTML.
- `connect-src` in CSP is well-scoped.
- Storage path regex (`chk_storage_path_format`) blocks path traversal.
- Dependencies (`react 18.3.1`, `vite 5.4.19`, `@supabase/supabase-js 2.99.0`) are current.

---

## Recommended remediation order

1. **Stop the bleeding (today):** #1 billing-self-edit, #2 `enqueue_email`, #3/#4 unauthed AI endpoints + module-scope `authResult`, #5 Stripe webhook idempotency, #6 unsubscribe CSRF, #7 `window.supabase`.
2. **This week:** #8 cross-org INSERTs, #9 IDOR via null org_id, #10 extract-file ownership, #11 portal email fallback, #12 CSP + headers, #14 IP spoof, #15 generator DoS limits, #16 search_path.
3. **Then:** RLS coverage review, defense-in-depth filters on admin hooks (#17), password policy, prompt-injection structural defenses.

---

## Severity summary

| Severity | Count |
|---|---|
| Critical | 7 |
| High | 11 |
| Medium | 13 |
| Low | 12 |
