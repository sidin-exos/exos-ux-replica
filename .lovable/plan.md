

## Upgrade: "RFP Lite Generator" → "RFP Generator (Tender Package)"

### Summary

Transform the current rigid, form-heavy RFP generator into an adaptive, two-phase tender package builder. Phase 1 accepts raw text input and uses AI to extract structured fields. Phase 2 lets the user select which tender documents to generate, with EXOS providing guidance for each. The key shift: fewer mandatory fields, smarter AI extraction, and a document-type selector that educates SMB users about tender package composition.

### Core Design Decisions

**Raw Data Extraction**: Instead of forcing the user to fill 10+ fields manually, the scenario will have a single primary textarea ("Paste your procurement brief / requirements") plus a few lightweight fields. When the user pastes raw text, the AI will auto-extract structured data (procurement subject, location, volume, deadlines) into the form fields during the analysis phase. This happens server-side inside the sentinel-analysis edge function via the scenario-specific system prompt.

**Document Type Selector**: A new multi-select field lets the user choose which tender documents to generate. Each option comes with a short AI-generated description. This replaces the old fixed 3-output model with a flexible package builder.

**Adaptive AI Logic**: The system prompt will instruct the AI to: (a) extract missing fields from raw text, (b) flag truly missing critical info and recommend the user provides it, (c) generate only the selected document types, and (d) keep tone practical for SMB users.

### Changes Across 4 Files

**1. `src/lib/scenarios.ts` -- Replace scenario definition**

Replace lines 398-422 (`rfp-generator` block) with:

```text
id: "rfp-generator"
title: "RFP Generator (Tender Package)"
description: "Paste your procurement brief or requirements and select which tender
  documents to generate. EXOS extracts key details automatically and produces a
  complete, ready-to-send tender package."
icon: FileSpreadsheet (unchanged)
category: "documentation"
status: "available"
strategySelector: "speedVsQuality"

Fields (reduced from 12 to 6):
  - industryContext (text, required: false) -- auto-injected
  - rawBrief (textarea, required: true)
    Label: "Procurement Brief / Raw Requirements"
    Description: "Paste your internal brief, email thread, or requirements doc.
     EXOS will extract procurement subject, location, volume, deadlines, and
     technical specs automatically."
    Placeholder: multi-line example showing a realistic brief

  - documentTypes (select, required: true)
    Label: "Tender Package Documents"
    Description: "Which documents should EXOS generate? Select the core document."
    Options:
      "RFP Document (Request for Proposal)"
      "RFI Document (Request for Information)"
      "RFQ Document (Request for Quotation)"
      "Full Tender Package (RFP + Evaluation Matrix + Cover Letter)"

  - evaluationPriorities (text, required: false)
    Label: "Evaluation Priorities"
    Description: "Optional: Key scoring priorities (e.g., 'Price 40%, Quality 30%,
     Delivery 20%, Sustainability 10%'). If omitted, EXOS suggests balanced weights."

  - budgetRange (text, required: false)
    Label: "Budget Range / Constraints"
    Description: "Optional: Approximate budget or spending limits. Helps EXOS
     calibrate requirements appropriately."

  - additionalInstructions (textarea, required: false)
    Label: "Additional Instructions or Constraints"
    Description: "Anything else EXOS should know: compliance requirements, preferred
     suppliers, formatting preferences, NDA needs, etc."

Outputs (updated to reflect adaptive generation):
  - "Extracted Brief Summary (Auto-parsed from raw input)"
  - "Tender Document(s) (Based on selected package type)"
  - "Evaluation Matrix (Weighted scoring framework)"
  - "Clarifications & Recommendations (Missing data flags + next steps)"
  - "Suggested Attachments & Templates"
```

The key UX improvement: only `rawBrief` and `documentTypes` are required. Everything else is optional. The AI handles extraction from raw text and fills gaps with sensible defaults.

**2. `src/lib/dashboard-mappings.ts` -- Update mapping**

Line 144: keep key as `"rfp-generator"` but update dashboards:
```text
"rfp-generator": ["timeline-roadmap", "decision-matrix", "action-checklist", "data-quality"]
```
Added `data-quality` to surface how complete the extracted data is (ties into the adaptive quality feedback).

**3. `src/lib/test-data-factory.ts` -- Replace generator**

Replace lines 317-344 with a new generator that produces:
- A realistic multi-paragraph raw procurement brief (email-style text containing embedded procurement subject, location, volume, deadlines, and technical requirements -- simulating what a real user would paste)
- Random document type selection
- Optional evaluation priorities text
- Optional budget range
- Optional additional instructions

**4. `supabase/functions/generate-test-data/index.ts` -- Update field list**

Replace lines 180-183:
```text
"rfp-generator": [
  "industryContext", "rawBrief", "documentTypes", "evaluationPriorities",
  "budgetRange", "additionalInstructions"
]
```

### AI Behavior: Adaptive Extraction & Guidance

No structural changes to the sentinel-analysis edge function are needed. The scenario's intelligence comes from the system prompt (built server-side via `buildServerGroundedPrompts`). The existing XML prompt engine will receive the `rawBrief` field as user input and the `documentTypes` selection, and the Chain-of-Experts protocol will:

1. **Extract**: Parse the raw brief to identify procurement subject, location, volume, timeline, technical requirements, and supplier qualifications
2. **Flag Gaps**: If critical details are missing from the raw text AND not provided in optional fields, the AI will explicitly flag them in a "Clarifications & Recommendations" section rather than hallucinating
3. **Generate**: Produce only the document type(s) selected by the user
4. **Guide**: For SMB users, include practical recommendations (e.g., "Consider adding an NDA clause for this type of procurement" or "For this budget range, we recommend requesting 3-5 proposals")

This adaptive behavior is driven entirely by the prompt, not by code changes.

### What This Does NOT Change

- No new edge functions
- No new components
- No database changes
- The scenario ID stays `"rfp-generator"` (no routing changes needed)
- Standard Sentinel pipeline is used (no special routing like market-snapshot)
- Dashboard mappings stay compatible

### Technical Details

```text
Files Modified: 4

1. src/lib/scenarios.ts
   - Replace lines 398-422 (rfp-generator block)
   - Title: "RFP Generator (Tender Package)"
   - Fields reduced: 12 → 6 (2 required, 4 optional)
   - New primary field: rawBrief (textarea, required)
   - New field: documentTypes (select, required)
   - Removed: procurementSubject, volume, technicalRequirements,
     supplierQualifications, location, submissionDeadline,
     priceStructure, evaluationWeights, ndaTerms, responseFormat
   - Added: rawBrief, documentTypes, evaluationPriorities,
     budgetRange, additionalInstructions

2. src/lib/dashboard-mappings.ts
   - Line 144: add data-quality to dashboard list

3. src/lib/test-data-factory.ts
   - Lines 317-344: replace generator with raw brief generator

4. supabase/functions/generate-test-data/index.ts
   - Lines 180-183: update field list
```

