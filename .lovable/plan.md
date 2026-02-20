
# Refactor `rfp-generator` Scenario + Fix Serialization Bug

## Summary
Remove 2 redundant fields (`mainFocus`, `documentTypes`) that caused friction and a serialization bug (`[object Object]`), add 2 new contextual textareas for technical specs and incumbent data, and rebuild the test data factory to match.

## Changes

### 1. Update Scenario Schema (`src/lib/scenarios.ts`, lines 449-462)

**Remove:**
- `MAIN_FOCUS_FIELD` (line 451) -- redundant; the raw brief already captures intent
- `documentTypes` select field (lines 453-458) -- AI ignores the select value; causes `[object Object]` serialization

**Keep (5 fields):**
- `industryContext` (textarea, optional)
- `rawBrief` (textarea, required) -- rename label to "Project Brief & Scope"
- `budgetRange` (text, optional) -- confirmed as plain string type
- `evaluationPriorities` (change from `type: "text"` to `type: "textarea"`, optional) -- allows richer input
- `additionalInstructions` (textarea, optional)

**Add (2 new fields):**
- `technicalRequirements` -- textarea, optional. Label: "Technical Specs & Volumes". Placeholder: "E.g., 50 MacBooks (M3, 32GB RAM), 15,000 tons of rebar, or specific SKUs..."
- `incumbentData` -- textarea, optional. Label: "Current Suppliers & Baseline Data". Placeholder: "E.g., Currently using Vendor X, paying $Y per unit, current lead time is 3 weeks..."

**Final field order (7 fields):**
1. `industryContext`
2. `rawBrief` (renamed label)
3. `budgetRange`
4. `evaluationPriorities`
5. `technicalRequirements` (NEW)
6. `incumbentData` (NEW)
7. `additionalInstructions`

### 2. Fix Test Data Factory (`src/lib/test-data-factory.ts`, lines 330-361)

**Remove generators for:** `documentTypes` (was returning a string from `randomChoice` but the select field itself caused the bug upstream)

**Keep & verify as plain strings:** `rawBrief`, `evaluationPriorities`, `budgetRange`, `additionalInstructions` -- all use `randomChoice([...strings...])`, confirmed safe.

**Add generators for:**
- `technicalRequirements` -- randomChoice of realistic specs (e.g., "50 MacBook Pro M3 (32GB RAM, 512GB SSD)..." or "15,000 tons Grade 500 rebar...")
- `incumbentData` -- randomChoice of baseline data (e.g., "Currently using TransEuro GmbH at EUR165k/year. Lead time: 48h...")

### Field Diff

```text
BEFORE (7 fields)              AFTER (7 fields)
-----------------              -----------------
industryContext   [KEEP]       industryContext
mainFocus         [REMOVE]     rawBrief (label renamed)
rawBrief          [KEEP]       budgetRange
documentTypes     [REMOVE]     evaluationPriorities
evaluationPriorities [KEEP]    technicalRequirements  [NEW]
budgetRange       [KEEP]       incumbentData          [NEW]
additionalInstructions [KEEP]  additionalInstructions
```

### Serialization Bug Fix
The `[object Object]` bug was caused by `documentTypes` being a `select` field whose value could be serialized incorrectly when passed through the test data pipeline. Removing it and ensuring all remaining fields are `text`/`textarea` (plain string types) eliminates the root cause.

### Files Modified
- `src/lib/scenarios.ts` -- rfp-generator field definitions
- `src/lib/test-data-factory.ts` -- rfp-generator test data generator

### No Database or Edge Function Changes
All changes are frontend-only schema definitions and test data generators.
