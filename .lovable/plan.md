

## EXOS Typography Consistency — Fixes 1-4 (Bundled)

### Files Modified (6 total)

**1. `src/index.css`** — Add 3 utility classes in `@layer utilities`:
```css
.exos-page-title {
  @apply text-foreground font-bold;
}
.exos-page-title-hero {
  @apply text-primary font-bold;
}
.exos-label-caps {
  @apply text-[11px] font-medium tracking-[0.07em] uppercase text-muted-foreground;
}
```

---

**2. `src/pages/enterprise/RiskPlatform.tsx` line 117** (Fix 1):
```
Before: className="text-2xl font-display font-semibold text-foreground"
After:  className="text-2xl exos-page-title"
```

---

**3. `src/components/scenarios/GenericScenarioWizard.tsx`** (Fix 1 + Fix 2):

Line 685 — h3 "Analysis Settings":
```
Before: className="font-display text-lg font-semibold mb-1"
After:  className="text-lg exos-page-title mb-1"
```

Line 820 — h4 "Enter Your Data":
```
Before: className="text-sm font-semibold text-foreground/80 uppercase tracking-wider"
After:  className="exos-label-caps"
```

---

**4. `src/pages/Reports.tsx`** (Fix 1 skipped — text-gradient already handles teal; Fix 2 only):

Line 203 — h2 "What are you trying to decide?":
```
Before: className="text-sm font-medium text-foreground/70 uppercase tracking-wide mb-3"
After:  className="exos-label-caps mb-3"
```

Line 238 — SelectLabel (mobile sidebar):
```
Before: className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
After:  className="exos-label-caps"
```

Line 266 — h3 sidebar group headers (desktop):
```
Before: className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
After:  className="exos-label-caps"
```

---

**5. `src/components/reports/DecisionMatrixDashboard.tsx` line 94** (Fix 3):
```
Before: className="font-display text-base"
After:  className="text-base font-semibold text-foreground"
```

---

**6. `src/pages/MarketIntelligence.tsx` lines 117-130** (Fix 4):

Remove the full gradient hero block (lines 117-130) and replace with:
```tsx
<div className="flex items-center gap-3 mb-2">
  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
    <Sparkles className="w-5 h-5 text-primary" />
  </div>
  <h1 className="exos-page-title-hero text-3xl">Market Intelligence</h1>
</div>
<p className="text-muted-foreground text-base mb-6">
  Get real-time analysis of supplier news, commodity trends, regulatory updates, and supply chain risks — powered by AI with grounded web search and source citations. Market Intelligence is a part of the EXOS engine, used as your knowledge base improving analytical scenarios results.
</p>
```

Tab bar and everything below line 132 remains untouched.

---

### Not touched (per spec)
- Reports.tsx h1 line 187 (text-gradient already produces teal)
- Pricing page
- DM chip badges
- Sidebar count badges
- Tab bar colors on MarketIntelligence
- All font-family declarations, layouts, spacing

