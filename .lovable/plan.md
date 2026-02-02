

# Training Trick Embedding for AI Test Data Generation

## Overview

Enhance the test data generation system to embed a **logical "trick"** or **trap** in each generated scenario. These tricks are designed to test whether the AI analysis engine can detect subtle but impactful procurement issues - not formatting errors or typos, but substantive business/contractual problems.

## What is a Training Trick?

A training trick is a deliberate, realistic flaw embedded in the test case that the AI analysis should identify and flag. Examples:

| Scenario Type | Trick Category | Example |
|---------------|----------------|---------|
| supplier-review | Hidden Poor Performance | High communication score but pattern of missed deliveries hidden in context |
| software-licensing | Contract Trap | 3-year commitment with "auto-renewal" clause but no termination rights |
| tco-analysis | Cost Obfuscation | Low purchase price but extreme maintenance costs hidden in optional fields |
| negotiation-prep | Leverage Blindspot | Single-source dependency but user thinks they have alternatives |
| risk-assessment | Risk Understatement | "Strong" supplier financial health but context mentions recent layoffs |
| sow-critic | Scope Ambiguity | Deliverables defined vaguely with acceptance criteria at "supplier discretion" |
| disruption-management | False Security | Alternative suppliers listed but all in same geographic risk zone |
| make-vs-buy | Hidden Costs | Low agency fee but high "onboarding speed" hiding recurring setup costs |

## Trick Categories by Scenario Type

Each scenario type will have a curated set of applicable trick categories:

```text
SCENARIO-SPECIFIC TRICK LIBRARY

supplier-review:
  - performance-masking: Good scores but poor underlying metrics
  - financial-warning-signs: Subtle indicators of supplier distress
  - dependency-trap: Over-reliance hidden in positive language
  - esg-greenwashing: Claimed compliance without substance

software-licensing:
  - lock-in-trap: High switching costs hidden in contract terms
  - escalation-clause: Aggressive price increases buried in details
  - user-tier-mismatch: License structure doesn't match actual usage
  - exit-penalty: Termination penalties hidden in boilerplate

tco-analysis:
  - iceberg-costs: Low acquisition but extreme operational costs
  - obsolescence-trap: Technology at end of life
  - vendor-dependency: Proprietary parts with no alternatives
  - decommissioning-surprise: High hidden exit costs

negotiation-prep:
  - leverage-illusion: Perceived alternatives that aren't viable
  - relationship-complacency: Long tenure hiding poor value
  - contract-auto-renewal: Missing renewal deadlines
  - benchmark-gap: Pricing far above market without awareness

risk-assessment:
  - hidden-concentration: Single point of failure in supply chain
  - false-diversification: Multiple suppliers in same risk zone
  - contract-gap: Missing protections for identified risks
  - near-miss-ignored: Recent incidents downplayed

make-vs-buy:
  - capability-overestimate: In-house skills not actually available
  - hidden-management-cost: Underestimated oversight burden
  - knowledge-loss-downplayed: IP risks not fully considered
  - scale-mismatch: Volume doesn't justify approach

disruption-management:
  - alternatives-mirage: Listed alternatives not truly viable
  - lead-time-underestimate: Recovery time optimistically low
  - cost-of-inaction-hidden: Revenue impact buried in details
  - single-point-failure: All options share same dependency
```

## Implementation Approach

### Phase 1: Draft Mode Enhancement

The draft phase will now also select a random trick from the applicable pool:

**Request:**
```typescript
{ mode: "draft", scenarioType: "supplier-review" }
```

**Response (enhanced):**
```typescript
{
  parameters: {
    industry: "healthcare",
    category: "medical-devices",
    companySize: "mid-market",
    complexity: "complex",
    financialPressure: "moderate",
    strategicPriority: "quality",
    marketConditions: "stable",
    dataQuality: "good",
    reasoning: "Healthcare mid-market company evaluating medical device supplier..."
  },
  trick: {
    category: "performance-masking",
    description: "Supplier shows high communication and innovation scores, but delivery reliability is quietly declining over recent months with excuses buried in context",
    targetField: "industryContext",
    expectedDetection: "AI should flag the delivery trend concern despite positive headline metrics"
  }
}
```

### Phase 2: Generate Mode Enhancement

When generating test data, the trick is woven into the content:

**Request:**
```typescript
{
  mode: "generate",
  scenarioType: "supplier-review",
  parameters: { ... },
  trick: {
    category: "performance-masking",
    description: "High scores but declining delivery pattern",
    targetField: "industryContext"
  }
}
```

**Generated Output:**
The `industryContext` field will include the trick embedded naturally - e.g., mentioning "while Q4 saw 3 delayed shipments attributed to logistics partner issues..." buried in otherwise positive narrative.

### Phase 3: Trick Validation

After generation, a validation step ensures the trick was properly embedded:

1. Check if target field mentions the trick topic
2. Verify trick isn't too obvious (shouldn't use warning words like "risk", "concern")
3. Score the subtlety (good tricks are hidden in neutral language)

## Schema Changes

### DraftedParameters Extension

```typescript
interface TrickDefinition {
  category: string;           // e.g., "performance-masking"
  description: string;        // Human-readable explanation
  targetField: string;        // Primary field where trick is embedded
  expectedDetection: string;  // What the AI should flag
  subtlety: "obvious" | "moderate" | "subtle" | "expert-level";
}

interface DraftedParameters {
  // Existing fields...
  industry: string;
  category: string;
  companySize: CompanySize;
  // ...
  
  // NEW: Trick embedding
  trick: TrickDefinition;
}
```

### Client-Side Display

The DraftedParametersCard will show the trick (admin-only):

```text
+--------------------------------------------------+
| Proposed Test Case                    [Refresh]  |
+--------------------------------------------------+
| Industry:     Healthcare                         |
| Category:     Medical Devices                    |
| Company:      Mid-Market                         |
| ...                                              |
| ----------------------------------------         |
| Training Focus:                                  |
| [performance-masking] Hidden declining           |
| delivery pattern in positive supplier narrative  |
| Target: industryContext                          |
+--------------------------------------------------+
```

## Files to Modify

### 1. `supabase/functions/generate-test-data/index.ts`

- Add `TRICK_LIBRARY` constant mapping scenario types to applicable tricks
- Modify `handleDraftMode()` to randomly select and include a trick
- Modify `handleGenerateMode()` to inject trick instructions into AI prompt
- Add trick subtlety validation in response parsing

### 2. `src/lib/drafted-parameters.ts`

- Add `TrickDefinition` interface
- Update `DraftedParameters` to include optional `trick` field
- Add trick category labels for display

### 3. `src/components/scenarios/DraftedParametersCard.tsx`

- Add trick display section (admin-only visibility)
- Allow editing trick category (advanced mode)
- Show expected detection hint

### 4. `src/components/scenarios/GenericScenarioWizard.tsx`

- Pass trick through the generation flow
- Store trick metadata for later analysis

---

## Technical Details

### Trick Library Structure

```typescript
const TRICK_LIBRARY: Record<string, TrickCategory[]> = {
  "supplier-review": [
    {
      category: "performance-masking",
      templates: [
        "High communication and innovation scores, but recent delivery reliability declining with explanations buried in context",
        "Excellent quality metrics from samples, but production batch consistency issues mentioned casually",
        "Strong financial rating from agency, but context reveals recent credit line reduction"
      ],
      targetFields: ["industryContext", "crisisSupport"],
      subtlety: "moderate"
    },
    {
      category: "financial-warning-signs",
      templates: [
        "Supplier appears stable but recently lost major customer representing 30% of their revenue",
        "Good payment terms offered, but context mentions extended payment requests to their suppliers"
      ],
      targetFields: ["industryContext", "financialStability"],
      subtlety: "subtle"
    }
  ],
  "software-licensing": [
    {
      category: "lock-in-trap",
      templates: [
        "Generous discount for 3-year term, but data export only available in proprietary format",
        "Low per-user cost, but API access requires separate enterprise license"
      ],
      targetFields: ["industryContext", "dataExportability"],
      subtlety: "moderate"
    }
  ]
  // ... more scenarios
};
```

### Prompt Engineering for Trick Embedding

The generate mode prompt will include:

```text
CRITICAL TRAINING INSTRUCTION:
You must embed a specific challenge in this test case.

TRICK TO EMBED:
- Category: {trick.category}
- Description: {trick.description}
- Target Field: {trick.targetField}
- Subtlety Level: {trick.subtlety}

EMBEDDING RULES:
1. The trick must be LOGICALLY embedded - it should be a realistic business situation
2. Do NOT use obvious warning words like "risk", "concern", "warning", "issue"
3. Bury the concerning detail in otherwise neutral or positive language
4. The trick should require careful reading to detect
5. An experienced procurement professional should be able to spot it
```

### Validation Scoring

After generation, validate trick embedding:

```typescript
function scoreTrickEmbedding(data: Record<string, string>, trick: TrickDefinition): {
  embedded: boolean;
  subtletyScore: number;
  feedback: string;
} {
  const targetContent = data[trick.targetField] || "";
  
  // Check if trick topic is mentioned
  const embedded = checkTrickPresence(targetContent, trick);
  
  // Check for obvious warning words (bad)
  const hasWarningWords = /risk|concern|warning|issue|problem|fail/i.test(targetContent);
  
  // Score subtlety
  const subtletyScore = hasWarningWords ? 30 : embedded ? 80 : 0;
  
  return { embedded, subtletyScore, feedback: "..." };
}
```

## Example Workflow

1. **User clicks "Draft Test Case"** for supplier-review scenario

2. **AI proposes:**
   - Industry: Healthcare / Medical Devices
   - Parameters: Mid-market, Complex, Quality-focused
   - Trick: "performance-masking" - High scores but declining delivery trend

3. **User approves** (can see trick in admin mode)

4. **AI generates test data** with trick embedded:
   ```
   industryContext: "MedTech Solutions is a mid-market medical device
   distributor serving 200+ hospitals. They've maintained an excellent
   communication score and recently introduced an innovative inventory
   management portal. While Q4 logistics challenges from their 
   carrier partner resulted in 3 delayed shipments, MedTech has been
   responsive in providing status updates..."
   ```

5. **Trick validation:** Embedded = Yes, Subtlety = 75/100

6. **When this case is used for training:**
   The AI analysis should flag: "Despite positive communication metrics, 
   there's a concerning pattern of delivery delays attributed to 
   third-party issues - recommend deeper investigation into supply 
   chain reliability."

## Summary

- Each generated test case includes a **logical procurement trap**
- Tricks are **scenario-appropriate** (contract traps for licensing, cost traps for TCO, etc.)
- Tricks are **subtle** - no obvious warning words, buried in positive context
- The system **validates** trick embedding and scores subtlety
- **Admin view** shows what trick is embedded and what detection is expected
- This creates **high-quality adversarial training data** for the AI analysis engine

