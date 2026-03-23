

## Condense Pillar Spacing & Add Richer Content

### Changes to `src/pages/Welcome.tsx`

**1. Reduce spacing between pillars**
- Section padding: `py-12 md:py-16` → `py-8 md:py-10`
- "Architectural Intelligence" heading section: `py-16 md:py-20` → `py-10 md:py-12`
- Inner gap: `gap-10 lg:gap-16` → `gap-8 lg:gap-12`
- Text column gap: `gap-5` → `gap-3`

**2. Add more descriptive text to each pillar**
- Add a `details` field (2-3 bullet points) rendered as a compact `ul` list below the description paragraph, giving concrete feature highlights:
  - **Analytical Scenarios**: Cost optimization, supplier consolidation, negotiation prep, SOW analysis, TCO comparison, risk scoring
  - **Market Intelligence**: Commodity price tracking, geopolitical risk feeds, supplier benchmarking, scheduled PDF reports
  - **Enterprise Platforms**: Risk Assessment Platform with automated alerts, Inflation Analysis Platform with category-level trend tracking, cross-portfolio dashboards

**3. Shrink visual placeholder**
- Reduce `aspect-[4/3]` → `aspect-[16/10]` and icon container size to reclaim vertical space

