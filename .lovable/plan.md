
# Drafter-Validator Workflow for AI Test Data

## Problem

The current test data generation is slow because it:
1. Runs 3 MCTS iterations (3 generation + 3 validation AI calls)
2. Then runs 1 enhancement AI call
3. Total: **7 AI calls** for one test case

You want a faster, simpler approach where:
- AI drafts a random but consistent parameter set
- You review and approve with one click
- Then a single fast generation happens

---

## Proposed Solution: Two-Phase Drafter-Validator

### Phase 1: Draft Parameters (Fast - 1 AI call)
AI proposes a complete parameter set in one call:

```text
+--------------------------------------------------+
| Proposed Test Case                    [Refresh]  |
+--------------------------------------------------+
| Industry:     Healthcare                         |
| Category:     Medical Devices                    |
| Company:      Mid-Market (500-2K employees)      |
| Complexity:   Standard                           |
| Financial:    Moderate budget pressure           |
| Priority:     Quality Excellence                 |
| Market:       Stable                             |
+--------------------------------------------------+
| [Approve & Generate]              [Edit & Tweak] |
+--------------------------------------------------+
```

### Phase 2: Generate Case (Fast - 1 AI call)
Single generation call with approved parameters. No validation loop needed since parameters are pre-approved.

**Total: 2 AI calls instead of 7**

---

## Workflow Details

### Button States

**Initial State:**
```text
[Draft Test Case] [Static Data]
```

**After Draft:**
```text
+-- Proposed Parameters Card --+
| Industry: Healthcare         |
| Category: Medical Devices    |
| Size: Mid-Market             |
| ...                          |
+-- [Approve] [Redraft] [Edit] +
```

**After Approve:**
```text
Generating... → Data filled in form
Score: 78/100 (from single generation)
```

---

## Technical Changes

### 1. New Edge Function Mode: `draft-parameters`

Add a new endpoint mode that only generates parameters (not full test data):

```typescript
// Request
{ mode: "draft", scenarioType: "supplier-review" }

// Response
{
  parameters: {
    industry: "healthcare",
    category: "medical-devices",
    companySize: "mid-market",
    complexity: "standard",
    financialPressure: "moderate",
    strategicPriority: "quality",
    marketConditions: "stable",
    dataQuality: "good"
  },
  reasoning: "Healthcare mid-market company evaluating medical device suppliers..."
}
```

### 2. Simplified Generation Mode

When parameters are approved, run single generation call:

```typescript
// Request
{ 
  mode: "generate",
  scenarioType: "supplier-review",
  parameters: { industry: "healthcare", ... },
  skipValidation: true  // No MCTS loop
}

// Response
{
  success: true,
  data: { ... generated fields ... },
  metadata: { score: 78 }  // Single-pass score
}
```

### 3. UI Component: `DraftedParametersCard`

New component showing proposed parameters with approve/reject/edit actions.

---

## Files to Modify

**1. `supabase/functions/generate-test-data/index.ts`**
- Add `mode` parameter: `"draft"` | `"generate"` | `"full"` (legacy)
- Draft mode: Single AI call to propose parameters
- Generate mode: Single AI call with given parameters, skip MCTS loop
- Lower default MCTS iterations to 1 for "full" mode

**2. `src/lib/ai-test-data-generator.ts`**
- Add `draftParameters()` function
- Add `generateWithParameters()` function
- Add parameter type definitions

**3. `src/components/scenarios/DraftedParametersCard.tsx`** (New)
- Display proposed parameters in readable format
- Approve / Redraft / Edit actions
- Collapsible "Edit" panel for manual tweaks

**4. `src/components/scenarios/GenericScenarioWizard.tsx`**
- Replace current AI Test Data button with two-phase flow
- State for drafted parameters
- Conditional rendering of DraftedParametersCard

---

## Parameter Schema

```typescript
interface DraftedParameters {
  // Core context
  industry: string;
  category: string;
  
  // Business context
  companySize: "startup" | "smb" | "mid-market" | "enterprise" | "large-enterprise";
  complexity: "simple" | "standard" | "complex" | "edge-case";
  financialPressure: "comfortable" | "moderate" | "tight" | "crisis";
  strategicPriority: "cost" | "risk" | "speed" | "quality" | "innovation" | "sustainability";
  
  // Environment
  marketConditions: "stable" | "growing" | "volatile" | "disrupted";
  dataQuality: "excellent" | "good" | "partial" | "poor";
  
  // AI reasoning
  reasoning: string;  // One sentence explaining the combination
}
```

---

## Speed Comparison

| Mode | AI Calls | Est. Time |
|------|----------|-----------|
| Current (MCTS=3) | 7 | 15-20 sec |
| New Drafter-Validator | 2 | 4-6 sec |
| Static fallback | 0 | instant |

---

## UI Flow

```text
User clicks [Draft Test Case]
        ↓
AI proposes parameters (1 call, ~2 sec)
        ↓
User sees parameter card
        ↓
    ┌───────────────────────────────────┐
    │ [Approve]  [Redraft]  [Edit ▼]    │
    └───────────────────────────────────┘
        ↓ (Approve)
AI generates test data (1 call, ~2 sec)
        ↓
Form populated with data
Score badge shown
```

---

## Summary

- **Drafter proposes** random but internally-consistent parameters
- **You approve** with one click (or redraft/edit)
- **Generator runs** single fast pass with approved constraints
- **2 AI calls** instead of 7, roughly 3x faster
- **Parameters are tracked** in metadata for reproducibility
