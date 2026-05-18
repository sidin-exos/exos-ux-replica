## Goal

Audit every URL in `public/sitemap.xml` for issues that could keep Google from indexing them, **before** you wait on the resubmit. Produce a single report showing per-URL status and any blockers.

## What gets checked

For each of the 16 sitemap URLs (homepage, /welcome, /features, /reports, /pricing, /privacy, /terms, /blog, 3 blog posts, 5 scenario landing pages):

| Check | Pass means | Fail flag |
|---|---|---|
| HTTP status | 200 | 3xx → "redirect" (with target); 4xx/5xx → "broken" |
| Final URL after redirects | matches sitemap entry | "canonical mismatch — sitemap says X, server lands on Y" |
| `<meta name="robots">` | absent OR `index,follow` | "noindex blocks indexing" |
| `<link rel="canonical">` | exactly 1, equals page URL | "missing", "duplicate (N tags)", "points elsewhere" |
| `<title>` | present, 10–60 chars, not duplicated across URLs | "missing", "too long", "duplicate of /other" |
| `<meta name="description">` | present, 50–160 chars, not duplicated | "missing", "too long", "duplicate of /other" |
| `<meta property="og:url">` | self-referencing | "points elsewhere" |
| Internal links pointing IN | ≥1 from another sitemap URL | "orphan — no internal links found" |

## How it runs

A one-off Node script `scripts/seo-onpage-audit.ts` (no project code touched, no install):

1. Read `public/sitemap.xml`, extract URLs.
2. For each URL, `fetch()` the live published page (`https://www.exosproc.com/...`), follow redirects manually so the chain is captured.
3. Parse the returned HTML with a lightweight regex/`linkedom` pass (already-installed `cheerio` if present, otherwise regex — no new deps).
4. Build a reverse-link index: for every sitemap page, collect outbound `<a href>` matching another sitemap URL → use that to flag orphans.
5. Write the report to `/mnt/documents/seo-onpage-audit.md` (human-readable table + per-URL detail) and a sibling `seo-onpage-audit.json` for diffs on later runs.
6. Print a one-screen summary in the terminal: counts of pass / warn / fail and the URLs to look at first.

Run with: `bunx tsx scripts/seo-onpage-audit.ts`.

## What you get back

A short markdown report shaped like:

```text
SEO on-page audit · 2026-05-18
==============================
16 URLs · 0 blocked · 2 warnings · 14 clean

BLOCKERS (fix before resubmit)
  (none)

WARNINGS
  /scenarios/black-swan-simulation
    – orphan: no other sitemap page links to it
  /blog/the-noise-problem
    – meta description 198 chars (>160, Google will truncate)

CLEAN  /  /welcome  /features  /reports  /pricing  ...
```

You decide what to fix, then re-run the script. No code in `src/` is changed by this plan — it only adds the script and the report file.

## Scope explicitly excluded

- No new dependencies, no edits to `src/`, no edge functions.
- No Lighthouse / Core Web Vitals (separate finding, separate tool).
- No Google API calls — that's already covered by the Search Console connection.
- Robots.txt rules are already verified; not re-checked here unless you ask.
