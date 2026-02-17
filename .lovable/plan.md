

## Four Targeted Updates

### 1. Reorder Scenarios: Move "Cost Breakdown" and "Spend Analysis" Up

In `src/lib/scenarios.ts`, move the `cost-breakdown` and `spend-analysis-categorization` scenario objects to appear right after `make-vs-buy` in the array. This makes them the 2nd and 3rd items shown in the "Analysis & Optimization" category on the homepage.

New display order for Analysis category:
1. Make vs Buy
2. Cost Breakdown (moved from position ~6)
3. Spend Analysis & Categorization (moved from position ~last)
4. Supplier Review
5. TCO Analysis
6. ...rest unchanged

### 2. Update Scenario Count on Technology Page

In `src/pages/Features.tsx`, change `"21+ Procurement Scenarios"` to `"29 Procurement Scenarios"` (the actual count from the scenarios array).

### 3. Rewrite "Enterprise-Grade Risk Assessment" Card

Replace the third value proposition card in `src/pages/Features.tsx` with a "Commercial Data Safety" card focused on the anonymization architecture:

- **Title:** "Commercial Data Safety"
- **Icon:** Lock (replacing Shield)
- **Description:** Emphasizes semantic anonymization masking sensitive commercial data (supplier names, pricing, contract terms) before it reaches external APIs, then restoring context on the way back.
- **Highlights:**
  - Semantic anonymization of commercial data
  - PII and financial identifier masking
  - Enterprise InfoSec Gate for traffic audit
  - Full data restoration after AI processing

### 4. Add Architecture Link to the New Card

Add a "Know more about EXOS architecture and data flow" link below the highlights list in the Commercial Data Safety card, linking to `/architecture`. This will be a NavLink styled consistently with the page.

### Technical Details

```text
Files Modified: 2

1. src/lib/scenarios.ts
   - Cut cost-breakdown object (~26 lines) from line 582
   - Cut spend-analysis-categorization object (~22 lines) from line 937
   - Paste both after make-vs-buy (after line 92)

2. src/pages/Features.tsx
   - Import Lock icon (add to existing import line)
   - Import NavLink component
   - Update "21+" to "29" in scenario count title
   - Replace 3rd valuePropositions entry (Risk Assessment -> Commercial Data Safety)
   - Add NavLink to /architecture after highlights in 3rd card
     (requires small JSX change in the card render loop to conditionally render the link)
```
