

## Plan: Enrich Light Theme with Additional Color Nuances

The current light theme palette is limited to: sage teal (primary), cool gray (secondary), emerald green (highlight), plus status colors. This makes it feel flat and monochromatic. We'll add new complementary color tokens from the same cool-warm spectrum without touching any existing values.

### New color tokens to add

All colors stay within the desaturated, enterprise-grade palette — siblings of the existing sage/teal hues:

| Token | Light mode HSL | Purpose | Usage |
|-------|---------------|---------|-------|
| `--info` | `200 45% 48%` (soft steel blue) | Informational states, secondary CTAs | Badges, info alerts, links |
| `--iris` | `245 30% 58%` (muted lavender) | Tertiary accent, category badges | Category labels, tags, subtle differentiation |
| `--copper` | `22 50% 52%` (warm copper) | Warm contrast point | Feature highlights, icons, data viz |
| `--surface` | `210 16% 93%` | Subtle card/section background layering | Alternating sections, nested cards |
| `--surface-foreground` | same as foreground | Text on surface | — |

Dark mode equivalents will also be added (slightly brighter/desaturated versions).

### Files to modify

1. **`src/index.css`** — Add new CSS variables in both `:root` and `.dark` blocks. Add a new gradient variable `--gradient-accent` using the iris-to-info range.

2. **`tailwind.config.ts`** — Register `info`, `iris`, `copper`, and `surface` in the colors map so they become available as utility classes (`bg-info`, `text-iris`, `border-copper`, etc.).

3. **`src/pages/Index.tsx`** — Apply the new tokens to the dashboard: use `surface` for alternating category section backgrounds, `iris` for category labels, and `copper` for scenario count/icon accents to demonstrate the richer palette immediately.

4. **`src/components/scenarios/ScenarioPreviewPanel.tsx`** — Use `info` and `iris` colors for the category badge and scenario output tags in the preview panel.

5. **`src/components/dashboard/ScenarioCard.tsx`** — Add subtle `copper` or `iris` tints to the icon backgrounds to differentiate scenario categories visually.

### What stays unchanged
All existing color tokens (primary, secondary, accent, highlight, muted, success, warning, destructive) remain identical.

