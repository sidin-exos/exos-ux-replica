# SEO + Homepage Copy Update

Scope: exactly 5 files. No new dependencies. No build config or backend changes.

Note on existing build error: the reported errors are pre-existing in unrelated edge functions (`generate-test-data`, `generate-market-insights`, `create-checkout-session`, `create-portal-session`) and are not caused by — and will not be touched by — this task. They concern the Supabase types regeneration done in the prior category-YAML task. They do not affect frontend compilation. Out of scope here per the hard constraint "Modify ONLY the 5 files listed".

## File 1 — `index.html`
Four string replacements only. CSP, og:image, og:url, og:locale, og:site_name, twitter:*, fonts, GA, viewport: untouched.

- `<title>` → `EXOS — Agentic AI Procurement Platform | No Implementation`
- `<meta name="description">` content → `Agentic AI procurement platform — negotiation preparation, supplier risk monitoring, TCO analysis, and inflation tracking. 29 expert scenarios. No implementation needed.` (154 chars)
- `<meta property="og:title">` content → same as new title
- `<meta property="og:description">` content → same as new description

## File 2 — `src/pages/Welcome.tsx`
1. Add `import { Helmet } from "react-helmet-async";` at top.
2. Insert `<Helmet>` block as first child inside the outer wrapper, before `<Header />` (around line 90):
   - title, meta description (same string), `<link rel="canonical" href="https://exosproc.com/" />`, `<meta name="robots" content="index, follow" />`.
3. Badge (line 101): replace text with `✦ Agentic AI procurement — works alongside Zip, Coupa, and SAP Ariba`. Preserve all classes.
4. H1 (lines 103–108): replace two-line H1 with single line. Keep existing `font-display ...` classes on `<h1>`. Apply existing italic primary span styling to "No Implementation. No Wait.":
   ```tsx
   <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-foreground leading-[1.1] tracking-tight">
     Agentic AI Procurement Analysis.{" "}
     <span className="italic" style={{ color: "hsl(var(--primary))" }}>
       No Implementation. No Wait.
     </span>
   </h1>
   ```
5. Hero paragraph (lines 109–118): collapse the existing two `<p>` tags into the wrapper div with one `<p>` containing the new copy. Keep wrapper `<div className="text-muted-foreground text-base leading-relaxed space-y-3">` and `<p className="text-base leading-relaxed text-muted-foreground">` classes intact.
6. Do NOT touch CTAs, ROI line, stats row, or right-hand pipeline diagram.

## File 3 — `src/pages/Index.tsx`
Update Helmet fallback strings only (lines 140–159). Per-scenario `currentMeta?.title` / `currentMeta?.description` override logic preserved. Add `<meta name="robots" content="index, follow" />` to match spec.

- Title fallback → `'EXOS — Agentic AI Procurement Platform | No Implementation'`
- Description fallback → new 154-char string
- Canonical: keep existing scenario-aware logic
- Add `<meta name="robots" content="index, follow" />`

## File 4 — `src/pages/Features.tsx`
1. Add `import { Helmet } from "react-helmet-async";` at top (after existing imports).
2. Insert `<Helmet>` as first child of the JSX returned (line 292, just inside the outer `<div className="min-h-screen gradient-hero">`):
   ```tsx
   <Helmet>
     <title>29 AI Procurement Scenarios — Risk, TCO & Negotiation | EXOS</title>
     <link rel="canonical" href="https://exosproc.com/features" />
   </Helmet>
   ```
3. No description meta added (per spec — supplied by prerender).

## File 5 — `scripts/postbuild-seo.mjs`
Update exactly two route entries; all other 9 routes untouched.

- `/welcome` entry:
  - `title` → `EXOS — Agentic AI Procurement Platform | No Implementation`
  - `description` → new 154-char string
  - `h1` → `Agentic AI Procurement Analysis. No Implementation. No Wait.`
- `/features` entry:
  - `title` → `29 AI Procurement Scenarios — Risk, TCO & Negotiation | EXOS`
  - description and h1 unchanged

## Verification
- 5 files modified, no others
- index.html unchanged outside the 4 specified tags
- Welcome.tsx: Helmet present, badge/H1/paragraph updated, all surrounding hero structure preserved
- Index.tsx: only fallback strings + robots meta changed; per-scenario override intact
- Features.tsx: minimal Helmet (title + canonical only)
- postbuild-seo.mjs: only `/welcome` and `/features` entries changed
- Zero new TS errors introduced by this change
