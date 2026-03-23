

## Replace Welcome Page Pillars with 3 Meta Types

### Summary
Replace the 4 feature pillars on `/welcome` with 3 meta product types that map to the platform's actual product lines. Each pillar gets a CTA button navigating to the relevant section.

### New Pillars

1. **Analytical Scenarios** (icon: `BarChart3`)
   - Description: AI-powered scenario analysis covering cost optimization, supplier evaluation, risk assessment, negotiation prep, and more. Select from 20+ scenario types, provide your business context, and receive actionable dashboards with data-driven recommendations.
   - Impact: "Run complex procurement analyses in minutes instead of weeks — with AI that explains the 'why' behind every recommendation."
   - CTA: "Explore Scenarios" → navigates to `/`

2. **Market Intelligence** (icon: `Radar`)
   - Description: Real-time market intelligence feeds powered by AI. Query global supply chain data, commodity pricing, geopolitical risks, and industry trends. Build custom intelligence reports and schedule automated monitoring.
   - Impact: "Stay ahead of market shifts with AI-curated intelligence that benchmarks your strategy against real-time industry data."
   - CTA: "Open Intelligence Hub" → navigates to `/market-intelligence`

3. **Enterprise Platforms** (icon: `Building2`)
   - Description: Persistent monitoring platforms for enterprise teams. The Risk Assessment Platform provides continuous supply-chain risk scoring with automated alerts. The Inflation Analysis Platform tracks cost drivers and pricing trends across your categories.
   - Impact: "Move from periodic reviews to always-on monitoring — with automated early-warning systems for risk and inflation."
   - CTA: "View Platforms" → could link to `/enterprise/risk` or show both options

### Technical Changes
- **File**: `src/pages/Welcome.tsx`
- Replace the `pillars` array (4 items → 3 items) with new content
- Add a CTA `Button` inside each pillar's text column (below the impact card)
- Update icon imports (add `Radar`, keep `BarChart3`, `Building2`; remove `Network`, `ShieldAlert`, `FileText`)
- Adjust numbering to 01, 02, 03

