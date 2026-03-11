

# Fix Text Contrast for WCAG 2.1 AA

## CSS Variable Updates (`src/index.css`)

**Light mode** (`:root`): Change `--muted-foreground` from `215 12% 48%` to `215 12% 40%` — brings contrast ratio from ~4.0:1 to ~5.5:1 on white, passing AA for all text sizes.

**Dark mode** (`.dark`): Change `--muted-foreground` from `215 15% 55%` to `215 15% 65%` — improves contrast against the dark background (~8% lightness) from ~3.8:1 to ~5.8:1.

## Small Text (`text-xs`) Class Updates

Update the most critical `text-xs text-muted-foreground` instances to `text-xs text-foreground/70` for stricter AA compliance on small fonts (requires 4.5:1 minimum). Key files:

- `src/components/dashboard/ScenarioCard.tsx` — badge text (`text-[10px]`)
- `src/components/scenarios/ScenarioPreviewPanel.tsx` — output list items and hint text
- `src/components/intelligence/EnterpriseTriggerGate.tsx` — feature descriptions
- `src/components/intelligence/IntelScenarioSelector.tsx` — scenario descriptions

Only typography/color changes. No layout or logic modifications.

