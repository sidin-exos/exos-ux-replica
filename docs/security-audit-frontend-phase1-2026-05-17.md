# Frontend Security Audit — Phase 1 (Infrastructure & Build) — Verification

**Date:** 2026-05-17
**Mode:** READ-ONLY verification of the 2026-05-17 frontend audit findings.
**Scope:** `vercel.json`, `vite.config.ts`, `package.json`, `package-lock.json`, `bun.lock`, `bun.lockb`, `index.html`, `public/**`, `.gitignore`.

---

## Task 1 — Public Directory Secret Leakage

### 1.1 `public/docs/EXOS_PROJECT_CONTEXT_2026-04-08.md` — STILL EXPOSED

| Check | Result |
|---|---|
| File present on disk | YES (`public/docs/EXOS_PROJECT_CONTEXT_2026-04-08.md`, 15,846 bytes) |
| Tracked in git | YES (`git ls-files` confirms) |
| Deployed by Vercel | YES — anything under `public/` is served verbatim |
| Public URL | `https://exosproc.com/docs/EXOS_PROJECT_CONTEXT_2026-04-08.md` |
| Contains literal secret values | NO — only secret **names**, not their values |
| Contains structural disclosures | YES — see below |

What it discloses:
- **Supabase project ref:** `qczblwoaiuxgesjzxjvu` (line 8) — directly identifies the production backend.
- **All 13 secret env-var names** (lines 219–233): `GOOGLE_AI_STUDIO_KEY`, `PERPLEXITY_API_KEY`, `LANGCHAIN_API_KEY`, `LANGCHAIN_ENDPOINT`, `LANGCHAIN_PROJECT`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SENTRY_DSN`, `RESEND_API_KEY`.
- **Full route table** including super-admin-only paths: `/admin/dashboard`, `/admin/analytics`, `/admin/methodology/*`, `/pdf-test`, `/dashboards`, `/architecture`, `/dev-workflow`, `/testing-pipeline`, `/org-chart` (lines 53–64).
- **Every edge function** with purpose (lines 75–92).
- **All 30 database tables** and their semantics (lines 96–134).
- **All 5 database views**, **5 storage bucket**, **13 database functions** (lines 134–166).
- **Security model details** (Section 5, lines 204–213): RLS strategy, role enum values, signed-URL TTLs, super-admin flag location.

Net effect: a single anonymous GET reproduces the architecture chapter of the security audit report. F1 from 2026-05-17 — **NOT remediated**.

### 1.2 `.gitignore` for `public/docs/`

Lines 33–39 add ignore patterns for `*PROJECT_CONTEXT*.md` (good for future files), **but `git rm --cached public/docs/EXOS_PROJECT_CONTEXT_2026-04-08.md` was not run**. The file remains tracked and is therefore still shipped on every deploy.

### 1.3 Full sweep of `public/` for other leaks

| File | Verdict |
|---|---|
| `public/favicon.svg`, `og-*.png/jpg/svg`, `placeholder.svg` | Clean — graphics |
| `public/og-options/*.png` (8 files) | Clean — A/B test OG variants. Could be pruned if unused. |
| `public/gtag-init.js` | Clean — GA bootstrap with public `G-NVGRVHZCWE` ID |
| `public/robots.txt` | OK — disallows admin / internal routes |
| `public/sitemap.xml` | **Conflict with `robots.txt`** — see 1.4 |
| `public/docs/EXOS_PROJECT_CONTEXT_2026-04-08.md` | **CRITICAL — see 1.1** |
| `public/samples/EXOS_Specification_Optimizer_2026-02-28.pdf` | **NEEDS HUMAN PDF REVIEW** — text scan can't verify binary content |

A grep for `SERVICE_ROLE`, `SECRET`, `API_KEY`, `sk_(live|test)_`, `password`, `bearer`, `token=` across all text-ish files in `public/` returned **only the documentation references inside `EXOS_PROJECT_CONTEXT_2026-04-08.md`** — no literal secret material elsewhere.

### 1.4 New finding — `sitemap.xml` advertises auth-gated routes

`public/sitemap.xml` lists every `/analyse/<scenario>` route (lines 250–423). Per the architecture doc, `/scenarios/*` are public marketing pages but `/analyse/*` are auth-gated app pages. Publishing them hands crawlers the full app-route inventory and conflicts with `robots.txt`'s `Disallow:` list. F13 from 2026-05-17 — still open.

### 1.5 New finding — OG images hosted on third-party domain

`index.html` lines 27–28, 33, 41 reference `https://ex-dev.lovable.app/og-image-v2.png` and `https://ex-dev.lovable.app/og-image-square.png`. Production social cards depend on the Lovable preview environment, leaking its existence and creating an availability dependency outside `exosproc.com`. The actual files exist locally at `public/og-image-v2.png` and `public/og-image-square.png` — they could be served same-origin.

---

## Task 2 — `index.html` CSP Violations

### 2.1 Inline `onload=` handler — STILL PRESENT (line 49)

```html
<link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:..."
      media="print"
      onload="this.media='all'" />
```

CSP `script-src` in `vercel.json` line 25 has no `'unsafe-inline'` and no matching hash for the `onload` handler. Browsers treat inline event handlers as inline scripts and will block this one in production. The `media='print' → 'all'` swap never fires; Inter and Space Grotesk never load as `all`-media stylesheets (the `<noscript>` fallback on line 50 won't run because JS is enabled). F2 from 2026-05-17 — **bytewise unchanged**.

### 2.2 No other inline JS in `index.html`

All other `<script>` tags use `src=`:
- Line 55: `<script async src="https://www.googletagmanager.com/gtag/js?id=G-NVGRVHZCWE">` — external, allowlisted.
- Line 56: `<script src="/gtag-init.js">` — same-origin, covered by `'self'`.
- Line 85: `<script type="module" src="/src/main.tsx">` — Vite entry.
- Line 58–80: `<script type="application/ld+json">` — **JSON-LD hash recomputes `sha256-W8RD8VPefoxt6dZXgT9j0f3RIQ8Vr2zmvYDRgacSKec=` and matches CSP exactly.**

No other inline event handlers anywhere in the file.

---

## Task 3 — Package Manager / Supply-Chain Drift

### 3.1 Lockfile inventory

| File | Size | Last modified | Manager |
|---|---|---|---|
| `package.json` | 3,452 B | 2026-05-12 | source of truth |
| `package-lock.json` | 491,126 B | **2026-05-17 14:23** | npm |
| `bun.lock` | 254,058 B | 2026-05-12 | Bun (text) |
| `bun.lockb` | 245,395 B | 2026-05-12 | Bun (binary) |

Three lockfiles for two managers.

### 3.2 `@nivo/*` drift — PARTIALLY REMEDIATED

| Source | `@nivo/core` | `@nivo/sankey` | Transitive (theming, tooltip, colors, legends, text) |
|---|---|---|---|
| `package.json` | ✓ declared `^0.99.0` | ✓ declared `^0.99.0` | n/a |
| `bun.lock` | ✓ | ✓ | ✓ all present (9 entries) |
| `package-lock.json` | ✓ | ✓ | ✓ all present (44 entries — transitives included) |

`package-lock.json` was regenerated at 14:23 on 2026-05-17 and **now contains the full `@nivo/*` tree**. The May 17 audit finding F3 — "package-lock.json missing @nivo references" — **no longer applies**.

### 3.3 New finding — Different upstream registries between Bun and npm lockfiles

| Lockfile | Resolved-from URL pattern |
|---|---|
| `bun.lock` | `https://europe-west4-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache/...` (private GCP Artifact Registry mirror) |
| `package-lock.json` | `https://registry.npmjs.org/...` (public npmjs.org) |

Two-registry supply chain. Integrity hashes (`sha512-...`) should be byte-identical for the same versions (registries are content-addressed), but provenance paths differ. Worth confirming hashes match for sentinel packages before relying on either chain.

### 3.4 Net status of the drift finding

- Specific dependency that triggered F3 (`@nivo/*` missing) — **fixed**.
- Structural cause (two lockfiles, two managers, two registries) — **remains**. A future package change can re-introduce drift the moment one developer forgets to regenerate both lockfiles.

---

## Task 4 — `vercel.json` Headers & CSP

### 4.1 Headers present (intact)

| Header | Value | Status |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | OK |
| `X-Content-Type-Options` | `nosniff` | OK |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | OK |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | Sparse — see 4.3 |
| `Content-Security-Policy` | see 4.2 | Several gaps |

Scope: `source: "/(.*)"` — applies to every route and asset. No bypass.

### 4.2 CSP analysis

| Directive | Status | Notes |
|---|---|---|
| `default-src 'self'` | OK | |
| `script-src` | `'unsafe-inline'` absent ✓, hash matches JSON-LD ✓ | But the `onload=` handler in index.html is currently blocked (Task 2) |
| `style-src` | **`'unsafe-inline'` PRESENT** | F6 from 2026-05-17 — still open. Required by `src/components/ui/chart.tsx` (out of Phase 1 scope) |
| `font-src` | OK | |
| `img-src` | OK | Note: `ex-dev.lovable.app` is NOT in this list; if rendered on-page, OG images from that host would be blocked |
| `connect-src` | OK | Stripe via top-level redirect, no CSP entry needed |
| `frame-src` | OK — only Supabase | |
| `frame-ancestors 'none'` | OK | |
| `object-src 'none'` | OK | |
| `base-uri 'self'` | OK | |
| `form-action 'self'` | OK | |
| **`worker-src`** | **MISSING** | Falls back to `default-src 'self'`. F5 from 2026-05-17 — still open. |
| **`manifest-src`** | **MISSING** | Same — F5. |
| **`child-src`** | **MISSING** | Some browsers consult before `worker-src`/`frame-src`. F5. |
| **`media-src`** | **MISSING** | Falls back. |
| **`report-uri` / `report-to`** | **MISSING** | No visibility into CSP violations in production. |

### 4.3 Missing security headers within `vercel.json` scope

| Header | Status | Impact |
|---|---|---|
| `X-Frame-Options` | **MISSING** | Modern browsers honour `frame-ancestors`, legacy ones don't. F7 — still open. |
| `Cross-Origin-Opener-Policy` (COOP) | **MISSING** | Popups can reach `window.opener`. F7. |
| `Cross-Origin-Resource-Policy` (CORP) | **MISSING** | F7. |
| `Cross-Origin-Embedder-Policy` (COEP) | MISSING (deliberately — would break Google Fonts + Supabase iframe) | Skip per recommendation. |
| `Cache-Control` on auth routes | **MISSING** | No per-route override for `/auth`, `/reset-password`, `/account`, `/admin/*`. F8 — still open. |
| `Permissions-Policy` coverage | INCOMPLETE | Missing: `payment, usb, serial, bluetooth, accelerometer, gyroscope, magnetometer, autoplay, display-capture, idle-detection, screen-wake-lock, browsing-topics`. F9 — still open. |

---

## Status Matrix

### Every May-17 finding within Phase 1 scope

| ID | Finding | Status |
|---|---|---|
| F1 | `public/docs/EXOS_PROJECT_CONTEXT_2026-04-08.md` deployed publicly | **STILL OPEN** — file still tracked |
| F2 | Inline `onload="this.media='all'"` in `index.html` violates CSP | **STILL OPEN** — bytewise unchanged |
| F3 | `package-lock.json` missing `@nivo/*` entries | **RESOLVED** as of 2026-05-17 14:23; structural drift remains |
| F5 | CSP missing `worker-src`, `manifest-src`, `child-src` | **STILL OPEN** |
| F6 | `style-src 'unsafe-inline'` | **STILL OPEN** (depends on chart.tsx — out of Phase 1) |
| F7 | Missing X-Frame-Options / COOP / CORP | **STILL OPEN** |
| F8 | No Cache-Control on auth-sensitive routes | **STILL OPEN** |
| F9 | `Permissions-Policy` could disable more features | **STILL OPEN** |
| F11 | esbuild 0.21.x dev-server CVE | Not re-verified at lockfile layer this round |
| F13 | sitemap publishes auth-gated routes | **STILL OPEN** |
| F16 | `public/samples/EXOS_Specification_Optimizer_2026-02-28.pdf` content | **NEEDS HUMAN PDF REVIEW** |

### New observations within Phase 1 scope

| ID | Finding | Severity |
|---|---|---|
| P1-N1 | `sitemap.xml` advertises `/analyse/<scenario>` (auth-gated) — conflicts with `robots.txt` | Low |
| P1-N2 | OG image meta tags hard-code `https://ex-dev.lovable.app/...` (Lovable preview) for production | Low — availability + recon |
| P1-N3 | `bun.lock` resolves through Lovable's private GCP mirror while `package-lock.json` uses public npmjs — two-registry supply chain | Info |
| P1-N4 | No CSP `report-uri` / `report-to` — production CSP violations go unobserved | Info |

### Deferred to later phases

- Application-code XSS / open redirects / state cleanup / Sentry PII / direct Supabase queries (Phase 2 / 3).
- `chart.tsx` `<style>` injection (drives `style-src 'unsafe-inline'`).
- `.lovable/`, `docs/`, repo metadata, `scripts/postbuild-seo.mjs`, Sentry / Vite plugin runtime.
- esbuild / jsdom dev-only CVEs.
