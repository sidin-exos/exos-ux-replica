

# Fix Social Share Preview Image

## Problem
`og:image` uses a relative URL to an SVG file — both break social previews on LinkedIn, Twitter/X, Slack, WhatsApp.

## Changes

### 1. Generate `public/og-image.png` (1200×630px)
Python script with Pillow:
- Dark background using brand teal `hsl(174, 48%, 30%)` → `rgb(40, 113, 105)`
- "EXOS" large white centered text
- Tagline: "AI Procurement Analysis — Built for EU Mid-Market Teams"
- Subtle border accent

### 2. Update `index.html` meta tags

Replace all OG/Twitter image references:
- `og:image` → `https://exosproc.com/og-image.png`
- `twitter:image` → `https://exosproc.com/og-image.png`

Add missing tags:
- `og:url` → `https://exosproc.com`
- `og:site_name` → `EXOS`
- `og:locale` → `en_GB`
- `twitter:title` → `EXOS – AI Procurement Analysis & Strategy Platform`
- `twitter:description` → `29 AI-powered procurement scenarios. TCO analysis, supplier risk, negotiation prep — GDPR-native, built for EU mid-market teams.`

### No other files touched.

