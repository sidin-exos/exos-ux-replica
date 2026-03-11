

# Fix Dark Mode Visual Artifacts and Hardcoded Colors

## 1. Fix hardcoded purple in `GenericScenarioWizard.tsx` (line 859)
Replace `border-purple-500/50 hover:bg-purple-500/10` with `border-iris/50 hover:bg-iris/10` — the `iris` token is already defined in the design system for this exact purple accent use case.

## 2. Improve glassmorphism for dark mode
Update elements using `bg-card/80 backdrop-blur-sm` to include dark-mode-specific classes:

- **`src/pages/Index.tsx` line 177** (Customer Success card): Add `dark:bg-white/5 dark:border-white/10`
- **`src/pages/DashboardShowcase.tsx` line 54** (sticky header): Add `dark:bg-white/5 dark:border-white/10`
- **`src/components/reports/DashboardContextCard.tsx` line 18**: Add `dark:bg-white/5 dark:border-white/10`

## 3. Enhance hero gradient in dark mode (`src/index.css`)
In the `.dark` selector, increase `--gradient-glow` opacity from `0.1` to `0.18` so the radial glow is visible against the dark background:
```css
--gradient-glow: radial-gradient(ellipse at 50% 0%, hsl(174 35% 48% / 0.18) 0%, transparent 50%);
```

## Files changed
- `src/components/scenarios/GenericScenarioWizard.tsx` — 1 line
- `src/pages/Index.tsx` — 1 line
- `src/pages/DashboardShowcase.tsx` — 1 line
- `src/components/reports/DashboardContextCard.tsx` — 1 line
- `src/index.css` — 1 line

