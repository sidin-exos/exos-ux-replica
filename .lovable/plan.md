

# Static HTML Generation for SEO — Practical Approach

## Problem with the Proposed Tools

`vite-plugin-ssg` is a **Vue-specific** package (by antfu, depends on `vue-router` and `@vueuse/head`). It will not work with React. The fallback `react-snap` requires Puppeteer, which cannot run in Lovable's build environment.

## Recommended Approach: Postbuild Meta Injection Script

A custom Node.js postbuild script that:
1. Copies `dist/index.html` into route-specific directories (e.g., `dist/features/index.html`)
2. Injects route-specific `<title>`, `<meta name="description">`, `<meta property="og:*">`, and a `<noscript>` content block into each copy
3. Runs as a postbuild npm script — no Puppeteer, no Vue, pure Node.js

This gives crawlers (Google, LinkedIn, Twitter) correct per-page metadata in the raw HTML without requiring JS execution.

## Changes

### 1. Create `scripts/postbuild-seo.mjs`

A Node.js script that defines a route map:

```text
Route                                    → Title, Description, OG tags
/welcome                                → EXOS – AI Procurement Analysis...
/features                               → How EXOS Works | EXOS
/pricing                                → Simple, Transparent Pricing...
/faq                                    → FAQ | EXOS
/enterprise/risk                        → Supplier Risk Assessment...
/enterprise/inflation                   → Inflation Monitoring...
/scenarios/tco-analysis                 → Total Cost of Ownership...
/scenarios/supplier-risk-assessment      → AI Supplier Risk Assessment...
/scenarios/negotiation-preparation       → Procurement Negotiation...
/scenarios/make-or-buy-analysis          → Make vs Buy Analysis...
/scenarios/black-swan-simulation         → Black Swan Supply Chain...
```

For each route, the script:
- Creates the directory in `dist/` (e.g., `dist/features/`)
- Copies `dist/index.html`
- Replaces `<title>` with the route-specific title
- Replaces `<meta name="description">` with the route-specific description
- Replaces `og:title`, `og:description`, `og:url`, `twitter:title`, `twitter:description`
- Adds a `<noscript>` block in `<body>` with the H1 and description text (for crawlers that don't execute JS)

### 2. Update `package.json` scripts

```json
"build": "vite build",
"postbuild": "node scripts/postbuild-seo.mjs"
```

The `postbuild` script runs automatically after `build` completes.

### 3. No other files change

- `vite.config.ts` — unchanged
- `src/main.tsx` — unchanged
- No new npm dependencies required
- No page components, Supabase, or auth files touched

## What This Achieves

- LinkedIn/Twitter/Slack/WhatsApp see correct OG title + description + image per page
- Google sees unique `<title>` and `<meta description>` per route in raw HTML
- `<noscript>` block provides basic text content for non-JS crawlers
- Zero build environment dependencies — pure Node.js `fs` operations
- Compatible with Lovable's build pipeline

## What This Does NOT Do

- Full server-side rendering of React components (would require a framework migration to Next.js/Remix)
- For an SPA on Vite, this postbuild meta injection is the standard practical approach used by most production SPAs

