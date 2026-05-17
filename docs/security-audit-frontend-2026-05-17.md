# EXOS Frontend Security Audit — 2026-05-17

**Scope:** React/Vite frontend at `/home/user/exos-ux-replica` (branch `claude/security-audit-exos-MbGgs`, HEAD after PR #34 merge).
**Method:** Two parallel sub-audits — (A) application code, (B) infrastructure / build / supply chain.
**Stage 2:** A backend audit (Supabase Edge Functions, RLS, migrations) will follow separately.

---

## Critical / High

### 1. Internal architecture doc served publicly
**File:** `public/docs/EXOS_PROJECT_CONTEXT_2026-04-08.md` (316 lines)
**Public URL:** `https://exosproc.com/docs/EXOS_PROJECT_CONTEXT_2026-04-08.md`

Enumerates every route (including super-admin), all 18 edge function names, every DB table, every **secret name** (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `GOOGLE_AI_STUDIO_KEY`, `PERPLEXITY_API_KEY`, `LANGCHAIN_API_KEY`), and the Supabase project ref. `.gitignore` was tightened later but this file was committed first and is still tracked + deployed.

**Fix:** `git rm public/docs/EXOS_PROJECT_CONTEXT_2026-04-08.md`, redeploy. Add `public/docs/` to `.gitignore`.

### 2. Inline `onload=` handler breaks CSP (and silently breaks font loading in prod)
**File:** `index.html:35`
```html
<link rel="stylesheet" href="…fonts…" media="print" onload="this.media='all'" />
```
Inline event handlers count as inline scripts. The new CSP (`script-src 'self' 'sha256-…' 'wasm-unsafe-eval' …`) has no `'unsafe-inline'` and no matching hash, so the swap to `media='all'` is blocked. Inter/Space Grotesk only load if the `<noscript>` fallback runs (it won't).

**Fix:** Ship the stylesheet `media="all"` directly (the preload above already warms it), or move the swap into a small file under `public/` referenced via `<script src=...>`. Do **not** add `'unsafe-inline'` back.

### 3. Unvalidated Stripe redirect — `data.url` trusted blindly
**Files:** `src/components/account/UpgradePlansCard.tsx:78`, `src/components/account/BillingSubscriptionCard.tsx:79`, `src/pages/Pricing.tsx:171`, `src/pages/Account.tsx:120`.

After `supabase.functions.invoke("create-checkout-session" / "create-portal-session")` the URL is assigned to `window.location.href` with no hostname allowlist. If the function is ever compromised, mis-configured, or returns a `javascript:`/`data:` URL, the page navigates to attacker-controlled content — high-value phishing surface for a paid SaaS.

**Fix:**
```ts
const u = new URL(data.url);
if (!/(^|\.)stripe\.com$/.test(u.hostname) || u.protocol !== "https:") {
  throw new Error("Invalid checkout URL");
}
window.location.href = u.toString();
```

### 4. `javascript:` URI XSS via LLM-supplied citation URLs
**Files:** `src/components/intelligence/IntelResults.tsx:113-120`, `src/components/enterprise/MonitorDetailView.tsx:244-254`.

Citations come from Perplexity / LLM API, stored in `intel_queries` / `monitor_reports`, and flow straight into `<a href={citation.url}>`. A prompt-injected or compromised model response of `javascript:alert(document.cookie)` becomes a clickable XSS in the authenticated origin (`rel="noopener"` doesn't help against `javascript:`).

**Fix:** Wrap rendering in a scheme check (`new URL(url); ["http:","https:"].includes(u.protocol)`); render nothing or strip to text if it fails.

### 5. localStorage business context / drafts not cleared on sign-out
**Files:** `src/hooks/useSavedBusinessContexts.ts:11,31`, `src/hooks/useScenarioDraft.ts:22-30`, `src/contexts/ModelConfigContext.tsx:43-78`, `src/components/testing/TestPlanOrchestrator.tsx:56,215`.
Sign-out paths: `Header.tsx:469-472, 540-543`, `Account.tsx:97`, `ResetPassword.tsx:46`.

`supabase.auth.signOut()` doesn't touch these. On shared machines or admin-impersonation flows, the next user sees the previous user's supplier names, pricing notes, drafts.

**Fix:** Central `clearUserScopedStorage()` helper invoked from every signOut path and from `onAuthStateChange("SIGNED_OUT")`.

### 6. `package-lock.json` out of sync with `package.json`
`@nivo/core`/`@nivo/sankey` are in `package.json` and resolved in `bun.lock` (9 refs), but `package-lock.json` has zero hits. `src/components/reports/SupplierConcentrationMapDashboard.tsx:3` imports `@nivo/sankey` at runtime. `npm ci` on Vercel will fail or resolve different transitive versions than `bun install` did locally — supply-chain drift.

**Fix:** Pick one package manager. Regenerate `package-lock.json` and delete `bun.lock` (or vice-versa). Add CI guard against stale/dual lockfiles.

---

## Medium

### 7. `ProtectedRoute` passes client-controlled `_user_id` to RPCs
**File:** `src/components/ProtectedRoute.tsx:27-28` — calls `supabase.rpc("is_super_admin", { _user_id: session.user.id })` and `get_user_org_role({ _user_id: ... })`. If the SQL trusts the parameter rather than `auth.uid()` server-side, an authenticated user could submit another user's ID.

**Fix:** Make the RPCs take **no** user-id argument and use `auth.uid()` internally. Drop the client argument. **Verify in backend audit.**

### 8. `useTeamMembers.updateRole` directly mutates `profiles.role`
**File:** `src/hooks/useTeamMembers.ts:33-40` — `supabase.from("profiles").update({ role }).eq("id", memberId)`. No client check on org match or caller role. Pure RLS reliance; if the policy allows self-mutation, any user can promote themselves to `admin`.

**Fix:** Move to a SECURITY DEFINER RPC enforcing (a) same org, (b) caller is admin, (c) allowed role transition. **Verify in backend audit.**

### 9. `Sentry.setUser({ email })` ships PII
**File:** `src/components/SentryUserSync.tsx:10`. Every error tagged with the real email; conflicts with the product's "GDPR-native" positioning.

**Fix:** `Sentry.setUser({ id: user.id })`. If correlating to email is needed, hash it (`sha256(email).slice(0,16)`).

### 10. PDF preview iframes lack `sandbox`
**Files:** `src/components/files/UserFilesManager.tsx:501-505`, `src/components/scenarios/ScenarioFileAttachment.tsx:217-221`. PDFs can execute scripts in some browsers.

**Fix:** Add `sandbox="allow-scripts allow-same-origin allow-popups"` and `referrerpolicy="no-referrer"`.

### 11. Anonymous public-form inserts have no captcha / rate limit
**Files:** `ContactForm.tsx:37`, `SiteFeedbackButton.tsx:38`, `GenericScenarioWizard.tsx:215,578`. Anon `INSERT` writes rely solely on RLS. An attacker can flood these tables, trigger Plain/Resend notifications, exhaust quotas, pollute analytics.

**Fix:** Route public inserts through an edge function with rate-limiting **plus** a Turnstile/hCaptcha token verified server-side.

### 12. `FileUploadZone` does no validation
**File:** `src/components/enterprise/FileUploadZone.tsx:23-37`. `onDrop` and `handleFileInput` accept anything; `accept=".pdf,.xlsx,.docx"` is advisory only. `useUserFiles.uploadFile` validates correctly, but other consumers of this component may not.

**Fix:** Call `validateFile` (extension + MIME + magic bytes + size) inside `FileUploadZone` itself before propagating up.

### 13. CSP missing `worker-src` / `manifest-src` / `child-src`
**File:** `vercel.json:25`. Fall back to `default-src 'self'` (acceptable today), but `@react-pdf/renderer`, `pdfjs-dist`, and `mermaid` all spawn workers — future changes will silently fail or quietly relax. Some browsers still consult `child-src` before `worker-src`.

**Fix:** Add `worker-src 'self' blob:; manifest-src 'self'; media-src 'self'; child-src 'self' blob:`.

### 14. Missing COOP / CORP / X-Frame-Options
**File:** `vercel.json:6-26`. `frame-ancestors 'none'` covers modern browsers; legacy ones still honour `XFO`. Without `COOP: same-origin`, popups can reach `window.opener`.

**Fix:** Add:
```json
{ "key": "X-Frame-Options", "value": "DENY" },
{ "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
{ "key": "Cross-Origin-Resource-Policy", "value": "same-origin" }
```
Skip `COEP: require-corp` (would break Google Fonts + Supabase iframe).

### 15. Weak password minimum (6 chars) on reset
**File:** `src/pages/ResetPassword.tsx:17` — `z.string().min(6, ...)`. Below NIST baseline.

**Fix:** Raise to 10–12; mirror whatever `SignUpForm` enforces. Enable HIBP check in Supabase Auth.

### 16. SharedReport emits `shareId` in canonical link
**File:** `src/pages/SharedReport.tsx:280-282` — `<link rel="canonical" href={`https://exosproc.com/report/${shareId}`} />`. Despite `noindex,nofollow`, the canonical leaks into shared previews, history exports, analytics referrers, some crawlers.

**Fix:** Drop the canonical link on shared-report pages, or only emit after explicit consent.

---

## Low / Info

| # | Item | File |
|---|---|---|
| 17 | `target="_blank"` without `rel="noopener noreferrer"` | `src/components/auth/ConsentBlock.tsx:38,42` |
| 18 | `style-src 'unsafe-inline'` in CSP — needed today by `chart.tsx` and stray inline `style={…}`; chart input is sanitized so not currently exploitable | `vercel.json:25`, `src/components/ui/chart.tsx:94` |
| 19 | No `Cache-Control: no-store` on auth-sensitive routes (`/auth`, `/reset-password`, `/account`, `/admin/*`) | `vercel.json` |
| 20 | `Permissions-Policy` could disable more features (`payment, usb, serial, bluetooth, accelerometer, gyroscope, magnetometer, autoplay, display-capture, idle-detection, screen-wake-lock, browsing-topics`) | `vercel.json:21` |
| 21 | esbuild 0.21.5 (via Vite 5.4) carries GHSA-67mh-4wv8-2f99 — dev-server CORS `*`. Dev-only risk. Force `esbuild ≥ 0.25` via `overrides` or upgrade to Vite 6 | `package-lock.json` |
| 22 | jsdom 20.0.3 in devDependencies — current is 27+. Test-only impact | `package.json:98` |
| 23 | Sitemap publishes 50+ `/analyse/` and `/reports/` routes; `robots.txt` disallows some of them — reconcile | `public/sitemap.xml`, `public/robots.txt` |
| 24 | Anon-JWT literal and env-name inconsistency (`VITE_SUPABASE_ANON_KEY` vs `VITE_SUPABASE_PUBLISHABLE_KEY`); centralize on the export from `client.ts` | `src/hooks/useMarketInsights.ts:160`, `src/components/reports/ReportExportButtons.tsx:49` |
| 25 | `console.error` of full error objects — strip payloads / no-op in production | `useUserFiles.ts:184`, `chat-service.ts:30`, `lib/ai/graph.ts:156-161`, `useShareableReport.ts:58,71,93,115` |
| 26 | `.lovable/plan.md` committed — recon if repo is public | `.lovable/plan.md` |
| 27 | `docs/security-audit-2026-05-12.md` and `docs/RLS_POLICIES_*.md` — attack roadmap if repo is public | `docs/` |
| 28 | Manually verify `public/samples/EXOS_Specification_Optimizer_2026-02-28.pdf` contains no real customer/supplier data | `public/samples/` |

---

## Verified clean (reviewed, no issue)

- **JSON-LD CSP hash** (`sha256-W8RD8VPefoxt6dZXgT9j0f3RIQ8Vr2zmvYDRgacSKec=`) recomputes byte-for-byte against `index.html:44-66`.
- **HSTS** (2y / preload), **X-Content-Type-Options: nosniff**, **Referrer-Policy: strict-origin-when-cross-origin**, **frame-ancestors 'none'**, **object-src 'none'**, **base-uri 'self'**, **form-action 'self'** — all correctly set.
- **script-src** has no `*`, no `data:`, no `https:`, no `'unsafe-eval'`, no `'unsafe-inline'`. `'wasm-unsafe-eval'` correctly scoped for `@react-pdf/renderer` / `pdfjs-dist`.
- **`window.supabase`** is DEV-gated (`src/integrations/supabase/client.ts:19`).
- **No source maps** ship to production (`vite.config.ts:34` deletes `dist/**/*.map` post-Sentry-upload).
- **`vite.config.ts:13-17`** `'process.env': '{}'` blanket-replaces stray `process.env.*` references — server env can't leak.
- **Client env keys** limited to `VITE_SENTRY_DSN`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_(ANON|PUBLISHABLE)_KEY`, `import.meta.env.{DEV,MODE}`. No service-role or third-party secret in the bundle.
- **No** `eval`, `new Function`, `document.write`, raw `innerHTML` assignment anywhere in `src/`. The single `dangerouslySetInnerHTML` (`chart.tsx`) is sanitized by `SAFE_COLOR_REGEX` / `SAFE_KEY_REGEX`.
- **`MarkdownRenderer`** uses `react-markdown` without `rehype-raw` — markdown HTML is escaped.
- **No `window.addEventListener('message', …)`** — no postMessage surface.
- **`useUserFiles.uploadFile`** validates extension + MIME + magic bytes + size + path-traversal.
- **Admin routes** wrapped in `<ProtectedRoute requireSuperAdmin>`; sensitive admin reads route through SECURITY DEFINER RPCs (`get_methodology_configs`, `get_founder_metrics`, `get_methodology_change_log`).
- **`scripts/postbuild-seo.mjs`** doesn't introduce inline scripts/event handlers and preserves the JSON-LD block byte-for-byte (hash stays valid).
- **Dependencies** all resolve from `registry.npmjs.org`; no git URLs, GitHub tarballs, or `file:` deps; no `postinstall`/`preinstall`; no obvious typo-squats.
- **No `.env*`, `.pem`, `.key` files** at repo root.

---

## Severity summary

| Severity | Count |
|---|---|
| Critical / High | 6 |
| Medium | 10 |
| Low / Info | 12 |

---

## Recommended fix order

1. **Today (one-line / one-commit wins):** #1 delete architecture doc, #2 remove inline `onload=`, #6 reconcile lockfiles.
2. **This week:** #3 Stripe-hostname allowlist (4 call sites), #4 scheme check on LLM citations, #5 centralised storage-clear on sign-out, #9 drop email from Sentry, #11 captcha on public forms.
3. **Backend-audit (Stage 2) follow-ups:** verify `is_super_admin(_user_id)` / `get_user_org_role(_user_id)` ignore the client arg (#7); verify `profiles.role` RLS prevents self-promotion (#8); confirm RLS + edge-function rate limits cover anonymous-insert tables (#11).
4. **Then:** CSP / header completeness (#13–14, 18–20), esbuild override (#21), sitemap/robots reconciliation (#23), env-var unification (#24), logging hygiene (#25), repo metadata (#26–27).
