# Implement EXOS AI Output Schema v1.0
## Corrected Implementation Plan — April 2026
**Internal Reference — Do Not Distribute Outside Development Team**

---

## Scope

Integrates the EXOS AI Output Schema Architecture v1.0 into the EXOS system. Touches 5 areas:
1. **TypeScript types** — new output schema types in `src/lib/sentinel/types.ts`
2. **Edge Function** — schema injection, prompt contract, defensive JSON parsing, GDPR interception
3. **Scenario metadata** — add `group` and `scenarioCode` to scenario definitions
4. **Dashboard mappings** — update `src/lib/dashboard-mappings.ts` to read from `payload`
5. **Export layer** — update Excel, Jira, and PDF exports to read from structured JSON fields

---

## Step 1: Add Output Schema Types to `src/lib/sentinel/types.ts`

Add the TypeScript types from Section 10 of the schema architecture document:

- `ConfidenceLevel`, `RAGStatus` type aliases
- `ConfidenceFlag`, `DataGap`, `Recommendation`, `ExportMetadata` interfaces
- `ExosOutput` universal envelope interface with all fields as defined in Section 2
- Group-specific payload interfaces (A through E) for reference and export-layer parsing

No changes to any other file in this step.

---

## Step 2: Add `group` and `scenarioCode` to Scenario Definitions

Update `src/lib/scenarios.ts`:

- Add `group: 'A' | 'B' | 'C' | 'D' | 'E'` to the `Scenario` interface
- Add `scenarioCode: string` (e.g. `"S1"`) to the `Scenario` interface
- Populate for all 29 scenarios using the mapping below

**Group-to-scenario mapping:**
- **A** (Analytical Value): `tco-analysis` (S1), `cost-breakdown` (S2), `capex-vs-opex` (S3), `savings-calculation` (S4), `spend-analysis` (S5), `forecasting-budgeting` (S6), `saas-optimization` (S7), `specification-optimizer` (S8)
- **B** (Workflow): `rfp-generator` (S9), `sla-definition` (S10), `tail-spend` (S11), `contract-template` (S12), `requirements-gathering` (S13), `supplier-performance` (S14), `project-planning` (S15)
- **C** (Reliability): `sow-critic` (S16), `risk-assessment` (S17), `risk-matrix` (S18), `licensing-audit` (S19), `category-risk` (S20)
- **D** (Strategic): `negotiation-prep` (S21), `category-strategy` (S22), `make-vs-buy` (S23), `volume-consolidation` (S24), `supplier-relationship` (S25), `total-value` (S26), `maturity-assessment` (S27)
- **E** (Real-Time): `market-intelligence` (S28), `supplier-audit` (S29)

---

## Step 3: Update `sentinel-analysis/index.ts`

This is the core change. Five sub-steps, each described in full.

### 3a — Add Group Schema Strings

Define a `GROUP_SCHEMAS` constant at the top of the file mapping `'A' | 'B' | 'C' | 'D' | 'E'` to the JSON schema template strings from Sections 3–7 of the schema architecture document, including the group-level AI instruction prefix for each group.

### 3b — Add AI Prompt Contract Fragment

Define an `AI_PROMPT_CONTRACT` constant containing the full "CRITICAL OUTPUT INSTRUCTION" block from Section 8.1 of the schema architecture document.

### 3c — Derive Scenario Group Server-Side

> ⚠️ **SECURITY CORRECTION vs. original plan:**
> The scenario `group` field MUST be derived inside the Edge Function from the `scenarioId` in the request body — looked up against a server-side scenario registry. It must NEVER be accepted as a client-supplied parameter.
>
> **Reason:** `scenarioGroup` is a trust boundary. Accepting it from the client allows a malicious actor to misclassify a scenario and receive a different schema-constrained output, potentially bypassing group-level AI instructions (e.g., receiving a Group E intelligence schema for a Group A financial calculation). The client can only supply `scenarioId`. The Edge Function resolves group internally.

Implement a `SCENARIO_GROUP_REGISTRY` constant in the Edge Function:

```typescript
const SCENARIO_GROUP_REGISTRY: Record<string, 'A' | 'B' | 'C' | 'D' | 'E'> = {
  'tco-analysis': 'A',
  'cost-breakdown': 'A',
  'capex-vs-opex': 'A',
  'savings-calculation': 'A',
  'spend-analysis': 'A',
  'forecasting-budgeting': 'A',
  'saas-optimization': 'A',
  'specification-optimizer': 'A',
  'rfp-generator': 'B',
  'sla-definition': 'B',
  'tail-spend': 'B',
  'contract-template': 'B',
  'requirements-gathering': 'B',
  'supplier-performance': 'B',
  'project-planning': 'B',
  'sow-critic': 'C',
  'risk-assessment': 'C',
  'risk-matrix': 'C',
  'licensing-audit': 'C',
  'category-risk': 'C',
  'negotiation-prep': 'D',
  'category-strategy': 'D',
  'make-vs-buy': 'D',
  'volume-consolidation': 'D',
  'supplier-relationship': 'D',
  'total-value': 'D',
  'maturity-assessment': 'D',
  'market-intelligence': 'E',
  'supplier-audit': 'E',
};
```

If `scenarioId` is not found in the registry, return HTTP 400 and do not proceed.

### 3d — Inject Schema into System Prompt

In the prompt assembly logic (the function currently building the grounded system prompt), after assembling the existing grounding XML:

1. Look up `scenarioGroup = SCENARIO_GROUP_REGISTRY[scenarioId]`
2. Look up `groupSchema = GROUP_SCHEMAS[scenarioGroup]`
3. Append `AI_PROMPT_CONTRACT + '\n\nGroup Schema:\n' + groupSchema` to the system prompt

This replaces the `<dashboard-data>` XML output format entirely. See Section 3e for transition policy.

### 3e — Hard Cutover from `<dashboard-data>` XML Format

> ⚠️ **CORRECTION vs. original plan:**
> The original plan states "both formats will be supported during transition." This is rejected. Running a permanent dual-format parser creates silent ambiguity, breaks LangSmith consistency (confidence_level metadata won't be available for pre-cutover reports), and is untestable as a regression surface.
>
> **Policy:** This is a hard cutover. The `<dashboard-data>` XML format is deprecated at the moment this Edge Function is deployed. The export layer and `dashboard-mappings.ts` read from the Universal Envelope JSON exclusively after this deployment.
>
> **Backward compatibility for stored reports:** Reports stored in the `shared_reports` table before this deployment will render using the legacy export path. Implement a `schema_version` check in the export layer: if `schema_version` field is absent, route to a clearly marked `legacyExport()` function. This legacy path is explicitly marked `@deprecated` in code and will be removed in the next major release.

### 3f — Add `parseAIResponse()` Defensive Parser

Implement the 3-attempt parsing strategy from Section 8.3 of the schema architecture document:

```typescript
function parseAIResponse(raw: string): ExosOutput | null {
  // Attempt 1: direct JSON parse
  try {
    return JSON.parse(raw);
  } catch (_) {}

  // Attempt 2: extract JSON block if AI added prose or code fences despite instructions
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }

  // Attempt 3: log to LangSmith and return null — triggers existing retry chain
  console.error('[EXOS] AI response failed JSON parsing — triggering retry');
  return null;
}
```

If all 3 attempts fail after the existing retry chain is exhausted, return HTTP 422 with a structured error:
```json
{ "error": "AI_PARSE_FAILURE", "message": "Analysis could not be structured. Please try again." }
```
Do not surface raw AI output to the client under any circumstances.

### 3g — GDPR Flag Interception

> ⚠️ **CORRECTION vs. original plan:**
> The original plan says "abort before writing to DB if `gdpr_flags` is non-empty" but does not define the user-facing behaviour. A hard abort that returns an error to the user is wrong — it surfaces a GDPR detection event that the user can then use to probe the system. The correct behaviour is silent field masking.

After `parseAIResponse()` succeeds, check `parsed.gdpr_flags`:

- If `gdpr_flags` is **empty**: proceed normally — write to DB, return to client.
- If `gdpr_flags` is **non-empty**:
  1. The flagged fields were already set to `null` by the AI (per the prompt contract instruction).
  2. Log the full `gdpr_flags` array to LangSmith as a `gdpr_interception` span event (server-side only — never returned to client).
  3. Write the masked output (with null fields) to DB normally.
  4. Return the masked output to the client — **include** the `gdpr_flags` array in the response so the UI can display a contextual privacy advisory banner. Do NOT expose which specific fields were nulled — only surface the GDPR reminder text.
  5. Do NOT return an error code. The user receives a valid (masked) analysis.

### 3h — Enhance LangSmith Tracing

> ⚠️ **ADDITION vs. original plan (missing step):**
> The original plan does not update LangSmith tracing. This step is required per the schema architecture Implementation Checklist (item 10).

In the existing LangSmith span for the `ai-inference` child run, add the following metadata after parsing:

```typescript
// Add to existing LangSmith metadata object
{
  confidence_level: parsed.confidence_level,
  data_gaps_count: parsed.data_gaps?.length ?? 0,
  low_confidence_watermark: parsed.low_confidence_watermark,
  gdpr_flags_count: parsed.gdpr_flags?.length ?? 0,
  schema_version: parsed.schema_version,
}
```

This enables LangSmith filtering by confidence level in production monitoring.

---

## Step 4: Update `src/lib/dashboard-mappings.ts`

> ⚠️ **CRITICAL ADDITION vs. original plan (entirely missing step):**
> `dashboard-mappings.ts` is the layer that maps AI output to the 14+ report dashboard types and their visualisation data. It currently reads from the AI prose / XML format. If this file is not updated, all scenario dashboards will silently render empty or with stale data after the schema cutover. This is the highest-risk silent failure in the entire plan.

Update `dashboard-mappings.ts` to:
1. Accept an `ExosOutput` object (the Universal Envelope) as its primary input instead of raw prose
2. Read financial charts from `payload.financial_model.cost_breakdown[]`
3. Read confidence badge data from `confidence_level` and `low_confidence_watermark`
4. Read RAG indicators from group-specific fields (e.g. `payload.scenario_specific.overall_rag` for Group C)
5. Read recommendations for the dashboard sidebar from `recommendations[]`
6. For Group E (S28/S29), read source citations from `sources_consulted[]`
7. Maintain the existing output interface shape so all 14+ dashboard components receive data in their expected format without changes

Add a `schema_version` guard at the entry of the mapping function: if the input is not a valid `ExosOutput` (i.e., `schema_version` field is absent), delegate to `legacyDashboardMapping()` — the existing logic, marked `@deprecated`.

---

## Step 5: Update Export Layer

### 5a — `src/lib/report-export-excel.ts`

Add a `schema_version` check at entry. When `schema_version` is present (new format):
- `summary` → "Executive Summary" sheet, cell A1
- `executive_bullets` → bulleted list below summary
- `confidence_level` → column header suffix on all data sheets: ` [MEDIUM CONFIDENCE]`
- `low_confidence_watermark` → if `true`, insert row 1 across all sheets: `"⚠ LOW CONFIDENCE — KEY DATA MISSING. This report should not be used for executive decision-making without providing the missing data listed in the Data Gaps sheet."`
- `data_gaps[]` → "Data Gaps" sheet: column A = field, column B = impact, column C = resolution
- `recommendations[]` → "Recommendations" sheet: priority, action, financial_impact, next_scenario
- `payload.financial_model.cost_breakdown` (Group A) → "Cost Breakdown" sheet, tabular
- `export_metadata` → hidden sheet `"_meta"` — schema_version, generated_at, model_used, langsmith_trace_id
- `gdpr_flags` → **never exported** — omit entirely from all sheets

When `schema_version` is absent: delegate to `@deprecated legacyExcelExport()`.

### 5b — `src/lib/report-export-jira.ts`

Add a `schema_version` check. When present:
- `summary` → Jira ticket description field (first paragraph)
- `executive_bullets` → bulleted list in description
- `confidence_level` → Jira label: `CONFIDENCE_HIGH`, `CONFIDENCE_MEDIUM`, or `CONFIDENCE_LOW`
- `low_confidence_watermark` → if `true`, prepend description with: `⚠ LOW CONFIDENCE — KEY DATA MISSING`
- `data_gaps[]` → each gap becomes a `[DATA GAP]` label with impact text as a comment
- `recommendations[]` → each recommendation becomes a Jira sub-task: `[Priority] Action text`
- `sources_consulted` (Group E only) → Jira "Links" block
- `gdpr_flags` → **never exported** — omit entirely

When `schema_version` absent: delegate to `@deprecated legacyJiraExport()`.

### 5c — PDF Export (`src/components/reports/pdf/PDFReportDocument.tsx`)

When `schema_version` is present:
- Add `low_confidence_watermark` diagonal watermark on every page if `true`
- Add confidence badge in PDF header: coloured pill (GREEN/AMBER/RED) with `confidence_level` text
- Add "Data Gaps" sidebar section when `data_gaps[]` is non-empty
- Add `generated_at` from `export_metadata` to PDF footer
- `gdpr_flags` → **never rendered** — omit entirely

When `schema_version` absent: existing PDF rendering logic applies without changes.

---

## Step 6: Store Schema Reference Document

> ⚠️ **SECURITY CORRECTION vs. original plan:**
> The original plan specifies copying the schema document to `public/docs/`. This is rejected.
>
> **Reason:** The `public/` directory is served as static assets and is publicly accessible without authentication. The schema document is marked "Internal Reference — Do Not Distribute Outside Development Team." It contains AI instruction patterns, GDPR interception logic, and field-level system design details that must not be publicly discoverable.
>
> **Correct path:** Copy `EXOS_AI_Output_Schema_v1.md` to `docs/schema/EXOS_AI_Output_Schema_v1.md` (the root `docs/` directory, not `public/docs/`). This is consistent with how existing internal documents like `docs/AI_WORKFLOW.md` and `docs/ORG_CHART.md` are stored.

---

## Step 7: Deploy Edge Function

After all code changes are committed and reviewed:

1. Deploy the updated `sentinel-analysis` edge function via Supabase CLI
2. Verify with a test call to one Group A scenario (e.g., `tco-analysis`) and confirm:
   - Response is valid JSON with Universal Envelope structure
   - `schema_version: "1.0"` is present
   - `confidence_level` is one of `HIGH | MEDIUM | LOW`
   - `payload` contains Group A `financial_model` structure
   - LangSmith shows new metadata fields: `confidence_level`, `data_gaps_count`
3. Verify one Group E scenario (`supplier-audit`) to confirm entity name validation and `entity_verified` field
4. Verify Excel export renders "Data Gaps" sheet and confidence header suffix
5. Verify PDF export shows confidence badge in header

---

## Correction Summary

| Item | Original Plan | Corrected Plan |
|---|---|---|
| Scenario group source | Accepted from client request body | Derived server-side from `SCENARIO_GROUP_REGISTRY` |
| Schema doc location | `public/docs/` (publicly accessible) | `docs/schema/` (internal only) |
| `dashboard-mappings.ts` | Not mentioned | Added as Step 4 — critical missing update |
| Dual-format transition | "Both formats supported" (open-ended) | Hard cutover with `@deprecated legacyExport()` for stored reports only |
| GDPR flag interception | "Abort before DB write" (user-facing error) | Silent field masking — write null fields, return masked output, log to LangSmith |
| LangSmith enhancement | Not mentioned | Added in Step 3h — confidence_level, data_gaps_count, gdpr_flags_count as span metadata |

---

*EXOS — Procurement Exoskeleton · Schema Implementation Plan v1.0 · April 2026*
*Internal Reference — Do Not Distribute Outside Development Team*
