

# Integrate EnterpriseLayout into Enterprise Pages

## Changes

### 1. `src/pages/enterprise/RiskPlatform.tsx`
- Import `EnterpriseLayout`
- Wrap the outer `<div>` with `<EnterpriseLayout>` so the Telemetry Bar renders above the Header

### 2. `src/pages/enterprise/InflationPlatform.tsx`
- Same change — wrap with `<EnterpriseLayout>`

Both pages already have `min-h-screen bg-background` on their root div, which `EnterpriseLayout` also provides, so the inner div's `min-h-screen bg-background` will be removed to avoid duplication.

No other files affected.

