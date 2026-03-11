

# Fix Missing OG-Image for Social Sharing

No image was attached, so we'll create an SVG placeholder and update meta tags.

## 1. New File: `public/og-image.svg`
Create a 1200x630 branded SVG with:
- Dark background (`#0f172a` — matches EXOS dark theme)
- "EXOS" in large Space Grotesk-style text, centered
- Subtitle "Your Procurement Exoskeleton" below
- Subtle accent line/border for polish

## 2. Edit: `index.html`
Update meta tags (lines 14, 18) to point to `/og-image.svg` and add missing `og:image:width` and `og:image:height`:

```html
<meta property="og:image" content="/og-image.svg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
...
<meta name="twitter:image" content="/og-image.svg" />
```

No other files changed.

