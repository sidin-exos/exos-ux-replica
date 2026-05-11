# Link Preview for Telegram & Other Messengers

## How it works today

Messengers (Telegram, WhatsApp, Slack, iMessage, Discord, LinkedIn, X, Facebook) all read **Open Graph** (`og:*`) and **Twitter Card** (`twitter:*`) meta tags from the page `<head>`. The current screenshot you shared is exactly that pipeline — Telegram fetched our tags from `index.html` and rendered the dark "EXOS" image.

Current setup in `index.html` is correct:
- `og:title`, `og:description`, `og:type`, `og:url`, `og:site_name`, `og:locale`
- `og:image` = `https://exosproc.com/og-image.png` (1200×630, declared)
- `twitter:card = summary_large_image` + `twitter:image`

## Issues to fix

1. **Bland preview image.** `public/og-image.png` is a 7 KB rasterised SVG with just the wordmark on a dark slab — that's why your Telegram preview looks empty. We can ship a polished 1200×630 hero (logo + value prop + product glimpse + brand gradient).
2. **307 redirect on the OG URL.** `https://exosproc.com/og-image.png` → `https://www.exosproc.com/og-image.png`. Some scrapers (LinkedIn especially) refuse to follow redirects on `og:image`. We should point `og:image` directly at the canonical host (`www.exosproc.com` or whichever you treat as primary) and align `og:url` + `<link rel="canonical">` with the same host.
3. **One image for the whole site.** Each public route (`/features`, `/pricing`, `/reports/:slug`, blog posts) currently inherits the same root meta. The postbuild SEO script (`scripts/postbuild-seo.mjs`) already injects per-page metadata for static routes — we'll extend it so each page gets its own `og:image` + `og:title` + `og:description`. Scenario landing pages can reuse the scenario hero; blog posts can use their cover image.
4. **Cache busting.** Telegram caches previews aggressively per-URL. After we publish, we'll bump the image filename (e.g. `og-image-v2.png`) so re-shared links pick up the new artwork. Also document the `@WebpageBot` Telegram refresh trick.

## Plan

### 1. Design & generate a new OG hero (1200×630)
- Brand gradient background (Teal/Blue per the design system).
- EXOS wordmark + tagline "Agentic AI Procurement Platform".
- Three pill badges: "Negotiation Prep · Supplier Risk · TCO".
- Subtle product mock (dashboard fragment) on the right.
- Export as `public/og-image-v2.png` (and a matching `.jpg` fallback for WhatsApp, which prefers JPEG <300 KB).

### 2. Update `index.html` meta
- Point `og:image` and `twitter:image` at the canonical host with no redirect.
- Add `og:image:alt`, `og:image:type`, and a square `og:image` variant (600×600) — Telegram and WhatsApp pick the square one for compact previews.
- Add `<link rel="canonical">`.

### 3. Per-page metadata via `postbuild-seo.mjs`
- Extend the existing static-generation script to write route-specific `og:title`, `og:description`, `og:image` into each generated `index.html` (Welcome, Features, Pricing, Blog list, BlogPost, scenario `/reports/:slug` pages).
- Reuse scenario hero images already in `src/assets` where available; otherwise fall back to the master OG hero.

### 4. Validate
After deploy, test with:
- Telegram: send link to `@WebpageBot` (or any chat) — if cached, send `/refresh <url>` to that bot.
- Facebook/WhatsApp: https://developers.facebook.com/tools/debug/ → "Scrape Again".
- LinkedIn: https://www.linkedin.com/post-inspector/.
- X/Twitter: https://cards-dev.twitter.com/validator (or post in a draft).
- Slack: unfurl in any DM.

## Technical notes

- Image specs: 1200×630 PNG/JPG, <1 MB (Telegram caps around 5 MB but renders faster <300 KB), aspect ratio 1.91:1 for `summary_large_image`.
- Add a square `og:image` second tag (600×600) for compact previews — messengers pick the best fit.
- Keep `og:url` absolute and matching `<link rel="canonical">` exactly (same host, same protocol, no trailing slash mismatch).
- Telegram caches by URL for ~weeks; the v2 filename is the fastest way to force a refresh across all already-shared links.
- CSP already allows the image (`img-src 'self' data: blob: ...`) — no CSP change needed.

## Out of scope (ask if you want them)

- Dynamic OG images per scenario generated on-the-fly (Edge Function + satori). Nice-to-have but a separate project.
- Localised previews (`og:locale:alternate`).
