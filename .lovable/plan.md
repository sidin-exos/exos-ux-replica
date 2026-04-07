

# Merged: Fix Duplicate H1s + Add "ROI from Day One" to /welcome

## Changes (4 files, text-only)

### 1. `src/pages/Welcome.tsx` — line 129-130
Insert ROI block between CTA buttons and stats strip:
```tsx
{/* after closing </div> of buttons */}
<div className="mt-3">
  <p className="text-sm font-semibold text-foreground">
    Get ROI from first day, first user.
  </p>
  <p className="text-xs text-muted-foreground max-w-sm">
    No integrations required. No company-wide approvals. Purchase with a corporate card and get value immediately.
  </p>
</div>
{/* stats strip follows */}
```
H1 on /welcome remains unchanged.

### 2. `src/pages/Features.tsx` — line 240-241
- FROM: `Do More With Less. <span className="text-gradient">Decide With Confidence.</span>`
- TO: `How EXOS <span className="text-gradient">Works</span>`

### 3. `src/pages/Pricing.tsx` — two changes
- **Line 147-149** (H1): change to `Simple, Transparent <span className="text-gradient">Pricing</span> for EU Procurement Teams`
- **Line 294-296** (FAQ subtitle): change to `Everything you need to know about EXOS — AI architecture, data privacy, GDPR compliance, and procurement scenario coverage.`

### 4. `src/pages/enterprise/RiskPlatform.tsx` — lines 107-110
- Change H1 text from `Dynamic Risk Monitoring` to `Supplier Risk Assessment Platform`
- Add subtitle after the H1 div:
```tsx
<p className="text-sm text-muted-foreground max-w-2xl mt-1">
  Continuous monitoring of supplier financial health, geopolitical exposure, and regulatory risk — built for EU procurement teams.
</p>
```

### Not touched
- `Welcome.tsx` H1 (preserved)
- `InflationPlatform.tsx` (already correct)
- No Supabase, auth, layout, or styling changes

