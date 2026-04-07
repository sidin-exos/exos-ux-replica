

# Fix Timeline Roadmap + Other Cross-Group Dashboard Extraction

## Problem

The `extractFromEnvelope` function gates dashboard extractors by group letter (`if (group === 'D')`), but several dashboards are mapped to scenarios in different groups. The timeline roadmap extractor only runs for Group D, yet:

- `procurement-project-planning` (Group B) maps to `timeline-roadmap` — AI produces `phases[]` in `scenario_specific`
- `supplier-review` (Group B) maps to `timeline-roadmap` — AI may produce `phases[]`
- `disruption-management` (Group D) maps to `timeline-roadmap` — uses `three_year_roadmap[]` (already works)

The same pattern applies to other cross-group dashboards:
- `risk-matrix` is mapped to Group B scenarios (`risk-matrix` slug) and Group D (`disruption-management`), but the extractor only runs for Group C
- `scenario-comparison` is mapped to Group A (`tco-analysis`, `capex-vs-opex`) and Group C (`risk-assessment`), but only runs for Group D

## Changes (3 files)

### 1. `supabase/functions/_shared/dashboard-extractor.ts`
Move group-specific extractors so they also run when the data is present regardless of group:

- **timelineRoadmap**: Add a universal fallback after the Group D block. If `result.timelineRoadmap` is not yet set, check `ss.phases[]` (Group B project planning format) and convert to the timeline format.
- **riskMatrix**: Move the risk extraction out of the `if (group === 'C')` gate, or add a fallback that checks `ss.risk_register` / `payload.risk_summary.risks[]` for all groups.
- **scenarioComparison**: Already only useful for Group D negotiation scenarios — keep as-is (the Group A/C mappings use different data shapes that don't map to scenarioComparison).

Concrete change for timelineRoadmap:
```typescript
// After the Group D block, add universal phases[] fallback
if (!result.timelineRoadmap) {
  const phases: any[] = ss.phases ?? [];
  if (phases.length > 0) {
    let cursor = 1;
    result.timelineRoadmap = {
      phases: phases
        .filter((p: any) => p?.name || p?.heading)
        .map((p: any, i: number) => {
          const duration = p.duration_weeks ?? 4;
          const startWeek = cursor;
          const endWeek = cursor + duration - 1;
          cursor = endWeek + 1;
          return {
            name: p.name ?? p.heading ?? `Phase ${i + 1}`,
            startWeek,
            endWeek,
            status: (p.status === 'completed' ? 'completed' :
                     p.status === 'in-progress' ? 'in-progress' : 'upcoming') as any,
            milestones: Array.isArray(p.milestones) ? p.milestones.slice(0, 3) :
                        Array.isArray(p.deliverables) ? p.deliverables.slice(0, 3) : [],
          };
        }),
      totalWeeks: cursor - 1,
    };
  }
}
```

Concrete change for riskMatrix — add universal fallback after Group C block:
```typescript
if (!result.riskMatrix) {
  const riskSource: any[] =
    (ss.risk_register ?? []).length > 0 ? ss.risk_register :
    (ss.risk_items ?? []).length > 0 ? ss.risk_items :
    (payload.risk_summary?.risks ?? []);
  if (riskSource.length > 0) {
    result.riskMatrix = { /* same mapping logic */ };
  }
}
```

### 2. `src/lib/dashboard-data-parser.ts`
Apply identical changes (manual sync copy of the shared extractor).

### 3. Deploy edge functions
Deploy `generate-pdf` and `generate-excel` (they import from the shared module).

## What this fixes
- `procurement-project-planning` timeline roadmap shows real AI data instead of sample data
- `supplier-review` timeline roadmap shows real data when phases are present
- `risk-matrix` dashboard works for any scenario that includes risk data, not just Group C
- PDF/Excel exports automatically inherit the fix via the shared module

## Not changed
- No schema changes needed — the AI already produces `phases[]` for Group B
- No dashboard component changes
- No App.tsx, Supabase, or auth changes

