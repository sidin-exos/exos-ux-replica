

# Refactor Pricing Page — Highlight Recommended Tier + Comparison Table

## Changes to `src/pages/Pricing.tsx`

### 1. Data Updates
- Line 44: Change Professional tier `featured: false` to `featured: true`
- Line 75: Change Enterprise CTA from `"Contact Sales"` to `"Book a 15-min Demo"`

### 2. New Imports
- Add `Minus` from `lucide-react`
- Add `Table, TableHeader, TableRow, TableHead, TableBody, TableCell` from `@/components/ui/table`

### 3. Feature Comparison Table
Insert a new section between the pricing cards grid and the FAQ section (~line 200). Includes:
- Centered heading: "Compare Plan Features"
- Responsive table wrapped in `overflow-x-auto` with 4 columns (Feature, SMB, Professional, Enterprise)
- 5 rows: Available Scenarios, Excel/Jira Export, Perplexity Real-Time AI, Dedicated Account Manager, Custom GDPR Guardrails
- `Check` icon (green) for included, `Minus` icon (muted) for excluded

No other files changed. No routing or layout modifications.

