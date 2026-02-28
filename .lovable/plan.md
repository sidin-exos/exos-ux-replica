

## Plan: Collapsible Data Requirements Advisory for `make-vs-buy`

### 1. `src/lib/scenarios.ts` — Extend interface + add data

**Interface change** (after line 63, before closing `}`):
```typescript
dataRequirements?: {
  title: string;
  sections: { heading: string; description: string }[];
};
```

**Add `dataRequirements` to `make-vs-buy` scenario** (after `strategySelector` on line 75):
- Title: "What data prevents Value Leakage in Make vs. Buy decisions?"
- 4 sections: Internal Cost Benchmarks, External Quotes & Market Data, Strategic & Capability Factors, Timeline & Risk Constraints — each with a short description of what to prepare and why it matters.

### 2. `src/components/scenarios/GenericScenarioWizard.tsx` — Render collapsible

**Imports** — add:
```typescript
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
```

**Insert between `ScenarioTutorial` (line 494) and the "Enter Your Data" header (line 496)**:

Conditionally render when `scenario.dataRequirements` exists:
- `<Collapsible defaultOpen={false}>` with local `open` state for chevron rotation
- Trigger: ghost/outline button bar — `"💡 What data do I need to prepare?"` + animated chevron
- Content: bordered card with `scenario.dataRequirements.title` as a small heading, then map `sections` into `heading` (font-medium) + `description` (text-muted-foreground text-sm) pairs
- Styled with existing Tailwind (`border rounded-lg p-4 bg-muted/30`)

### What stays untouched
- All 3-Block textareas, form logic, other scenarios unchanged
- Only `make-vs-buy` gets `dataRequirements` as proof of concept

