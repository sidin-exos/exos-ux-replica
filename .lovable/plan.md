


# Soften PDF Color Palette — Warm Neutral (Premium Dark)

## Current vs New Palette

| Token | Current (aggressive) | New (warm neutral) |
|---|---|---|
| background | `#0c1220` (near-black navy) | `#1e1e2e` (warm charcoal) |
| surface | `#111827` | `#262637` |
| surfaceLight | `#1f2937` | `#2f2f42` |
| text | `#f9fafb` (near-white) | `#d4d4dc` (soft cream) |
| textMuted | `#9ca3af` | `#8b8b9e` |
| primary | `#14b8a6` (bright teal) | `#6b9e8a` (desaturated sage) |
| primaryDark | `#0d9488` | `#5a8a76` |
| accent | `#06b6d4` | `#6b9e8a` |
| success | `#22c55e` | `#6bbf8a` (muted green) |
| warning | `#f59e0b` | `#c9a24d` (warm gold) |
| destructive | `#ef4444` | `#c06060` (muted rose) |
| border | `#374151` | `#3a3a4e` |

Contrast ratio text-on-background drops from ~18:1 to ~8:1 — still WCAG AAA compliant but far less harsh.

## Files Changed

| # | File | Action | Summary |
|---|---|---|---|
| 1 | `src/components/reports/pdf/dashboardVisuals/theme.ts` | Edit | Update `colors` object to warm neutral palette |
| 2 | `src/components/reports/pdf/PDFReportDocument.tsx` | Edit | Update local `colors` object + `textSemiTransparent` to match |
| 3 | `src/components/reports/pdf/PDFDashboardVisuals.tsx` | Edit | Update `pageColors` to match new palette |

All three files define their own color constants — all must be updated to stay consistent. No structural changes, just color hex values.

## Round 2: Font +15% & Bright Color Purge

### Font Changes
All font sizes bumped ~15%: 6→7, 7→8, 8→9, 9→10, 10→12, 11→13, 12→14, 14→16, 20→23, 24→28

### Color Replacements
| Old (bright) | New (muted) | Used in |
|---|---|---|
| `#6366f1` (indigo) | `#7a7fa0` (slate blue) | TCO, Decision Matrix, License, Scenario |
| `#8b5cf6` (purple) | `#8a7d9b` (lavender) | TCO, Decision Matrix, License |

Added `option2` and `option3` to theme colors for centralized management.
