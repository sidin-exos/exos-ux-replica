
## Align Buyer Personas to Kebab-Case (3 Files)

Straightforward find-and-replace across 3 files. No new files, no DB changes, no edge function changes.

### 1. `src/lib/testing/types.ts`
Update the `BuyerPersona` union type from the old 3 snake_case values to the 4 kebab-case values matching the edge function:

```typescript
// Before
export type BuyerPersona =
  | 'executive_sponsor'
  | 'solo_procurement_hero'
  | 'tactical_category_manager';

// After
export type BuyerPersona =
  | 'rushed-junior'
  | 'methodical-manager'
  | 'cfo-finance'
  | 'frustrated-stakeholder';
```

### 2. `src/components/testing/LaunchTestBatch.tsx`
- Update `PERSONAS` array to 4 entries with kebab-case values, strategic labels, and short descriptions:
  - `rushed-junior` -- "Rushed Junior Buyer" (Minimal context, informal language)
  - `methodical-manager` -- "Methodical Category Manager" (Highly detailed, structured input)
  - `cfo-finance` -- "CFO / Finance Leader" (Financial precision, high-level summaries)
  - `frustrated-stakeholder` -- "Frustrated Stakeholder" (Messy narratives, ad-hoc usage)
- Update the dropdown to show the description as secondary text
- Change default state from `"solo_procurement_hero"` to `"rushed-junior"`

### 3. `src/components/testing/RefactoringBacklog.tsx`
- The `persona_source` display uses `.replace(/_/g, " ")` for formatting -- update to `.replace(/-/g, " ")` to handle kebab-case correctly

### No other changes needed
- The edge function already uses these exact kebab-case IDs
- The `generateAITestData` call passes the persona value straight through -- no mapping layer needed
