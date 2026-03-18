

# Onboarding Landing Page

## Overview
Create a new `/welcome` page that serves as a product onboarding experience. The EXOS logo in the Header will link to `/welcome` instead of `/`. The page will introduce EXOS with three video placeholder sections, feature highlights, and a CTA to get started.

## Page Structure

```text
┌─────────────────────────────────────────┐
│  Header (existing)                      │
├─────────────────────────────────────────┤
│  HERO                                   │
│  Headline + Subtext + CTA buttons       │
│  [▶ Promo Video Placeholder]            │
├─────────────────────────────────────────┤
│  HOW IT WORKS (3-step)                  │
│  1. Define  2. Analyze  3. Act          │
├─────────────────────────────────────────┤
│  SCENARIOS SECTION                      │
│  Description + [▶ Scenarios Video]      │
├─────────────────────────────────────────┤
│  MARKET INTELLIGENCE SECTION            │
│  Description + [▶ Intel Video]          │
├─────────────────────────────────────────┤
│  SOCIAL PROOF (reuse success stories)   │
├─────────────────────────────────────────┤
│  CTA BANNER — "Start your first        │
│  scenario" → links to /                 │
├─────────────────────────────────────────┤
│  Footer (existing)                      │
└─────────────────────────────────────────┘
```

## Changes

### 1. New file: `src/pages/Welcome.tsx`
- Hero section with tagline, subtitle, and two CTAs ("Get Started" → `/`, "Watch Demo" → scrolls to promo video)
- Promo video placeholder: 16:9 aspect ratio card with play icon overlay and "General Overview" label
- "How it Works" 3-step horizontal cards (Define Context → AI Analysis → Actionable Output)
- Scenarios feature section: left text + right video placeholder card
- Market Intelligence feature section: right text + left video placeholder (alternating layout)
- Success stories carousel (reuse data from Index.tsx or import)
- Bottom CTA banner

Video placeholders will be `Card` components with `AspectRatio` (16:9), a muted background, centered Play icon, and a label — ready for future `<iframe>` or `<video>` embedding.

### 2. Update `src/App.tsx`
- Import `Welcome` page
- Add route: `<Route path="/welcome" element={<Welcome />} />`

### 3. Update `src/components/layout/Header.tsx`
- Change logo `NavLink` `to` prop from `"/"` to `"/welcome"`

### 4. Update `src/components/layout/MobileBottomNav.tsx`
- If it has a home link pointing to `/`, update to `/welcome`

## Design
- Follows existing design system: `gradient-hero`, `glass-effect`, `font-display`, themed colors
- Responsive: single column on mobile, two-column alternating on desktop for feature sections
- All video placeholders are clearly marked with aspect ratio containers and descriptive labels

