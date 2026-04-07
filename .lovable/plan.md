

# Scaffold Scenario Landing Pages

## Key Findings
- **No `react-helmet-async`** installed — need to install it and set up `HelmetProvider` in App.tsx
- **No `public/sitemap.xml`** exists — will create it fresh
- Existing patterns: pages use `Header`/`Footer` layout, `Button` variants, `Card` components, `Badge` for pills, `font-display` for headings, `text-gradient` for accent text

## Changes (8 new files, 2 modified files)

### 1. Install `react-helmet-async`
Run `npm install react-helmet-async` and wrap App with `HelmetProvider`.

### 2. Create `src/components/scenarios/ScenarioLandingPage.tsx`
Reusable component with the 7-section layout:
- **Helmet**: `<title>`, `<meta name="description">`, `<link rel="canonical">`
- **Hero**: `Badge` pill for category, H1 with `font-display`, subtitle in muted text, metric card using `Card` with green positive styling, two CTAs (Start Free Trial / See All Scenarios) matching Welcome page button pattern
- **What It Does**: H2 + paragraph + 4-column feature grid (2×2 mobile) using `Card` with Lucide icons loaded dynamically via `icons[name]` from `lucide-react`
- **Who It's For**: H2 + 2-column grid (1-col mobile), role bold + need muted
- **Proof** (conditional): Full-width quote card matching Welcome testimonial section style (`bg-muted/30`, `Quote` icon, blockquote)
- **Related Scenarios**: H2 + 3-column card grid with React Router `Link`, same hover style as Features cards
- **Final CTA**: Full-width banner with `var(--gradient-primary)` background, matching Welcome bottom CTA exactly
- Wrapped in `Header`/`Footer` layout

### 3. Create 5 placeholder pages
Each file exports a simple component returning `<div />`:
- `src/pages/scenarios/TCOAnalysis.tsx`
- `src/pages/scenarios/SupplierRisk.tsx`
- `src/pages/scenarios/NegotiationPrep.tsx`
- `src/pages/scenarios/MakeOrBuy.tsx`
- `src/pages/scenarios/BlackSwan.tsx`

### 4. Register routes in `src/App.tsx`
- Add lazy imports for all 5 scenario pages
- Add 5 public `<Route>` entries before the catch-all:
  - `/scenarios/tco-analysis`
  - `/scenarios/supplier-risk-assessment`
  - `/scenarios/negotiation-preparation`
  - `/scenarios/make-or-buy-analysis`
  - `/scenarios/black-swan-simulation`

### 5. Create `public/sitemap.xml`
New file with all 6 existing public routes + 5 new scenario routes (11 total entries), using `https://exosproc.com` as the base URL.

### Files not touched
- No existing page components modified
- No Supabase, edge functions, or auth changes

