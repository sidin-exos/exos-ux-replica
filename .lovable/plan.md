

# Implement EXOS AI Output Schema v1.0

## Overview
Standardize all 29 analytical scenarios to return structured JSON via a Universal Envelope, replacing the current prose + `<dashboard-data>` XML approach. This touches client types, scenario metadata, two edge functions, the dashboard parser, and all three export formats.

## Step 1: Add Output Schema Types
**File:** `src/lib/sentinel/types.ts` — append at end

Add `ConfidenceLevel`, `RAGStatus`, `ConfidenceFlag`, `DataGap`, `Recommendation`, `ExportMetadata`, and `ExosOutput` interfaces exactly as specified in the user instruction.

## Step 2: Add `group` and `scenario_id` to Scenarios
**File:** `src/lib/scenarios.ts`

- Extend `Scenario` interface with `scenario_id: string` and `group: 'A' | 'B' | 'C' | 'D' | 'E'`
- Add both fields to all 29 scenario objects following the A(S1-S8), B(S9-S15), C(S16-S20), D(S21-S27), E(S28-S29) mapping

## Step 3: Create Shared Output Schema Module
**New file:** `supabase/functions/_shared/output-schemas.ts`

Contains:
- `SCENARIO_GROUP_REGISTRY` — maps all 29 scenario IDs to groups A-E
- `GROUP_AI_INSTRUCTIONS` — per-group AI persona instructions
- `GROUP_SCHEMAS` — full JSON schema templates from the schema document (Sections 3-7), properly stringified for prompt injection
- `AI_PROMPT_CONTRACT` — the "CRITICAL OUTPUT INSTRUCTION" block
- `parseAIResponse()` — 3-attempt defensive JSON parser

The full group schemas will be extracted from the parsed schema document and formatted as template strings.

## Step 4: Update `sentinel-analysis/index.ts`

**4a** — Import from `../_shared/output-schemas.ts`

**4b** — Server-side group derivation using `SCENARIO_GROUP_REGISTRY[scenarioType]`

**4c** — In `buildServerGroundedPrompts()`: replace the `<dashboard-data>` XML instructions (lines 469-488) with the schema injection (`AI_PROMPT_CONTRACT + GROUP_AI_INSTRUCTIONS[group] + GROUP_SCHEMAS[group]`). Keep grounding XML, shadow log instruction, and all other prompt logic unchanged.

**4d** — Also update the legacy path (line 786) and synthesizer prompt to remove `<dashboard-data>` references.

**4e** — After AI response, apply `parseAIResponse()`. If null after extraction, return 422.

**4f** — Add GDPR flag logging (console.warn only, no DB write block).

**4g** — Add `schema_version` check — reject if not `"1.0"`.

**4h** — Enrich LangSmith metadata with `scenario_id`, `confidence_level`, `data_gaps_count`, `gdpr_flags_count`, `schema_version`.

**Key consideration:** The multi-cycle Chain-of-Experts path (lines 853-923) needs the schema injection in the Analyst Draft system prompt and in the Synthesizer prompt. The Auditor prompt stays unchanged (it critiques the draft, not the schema).

**Backward compatibility:** The response shape changes from `{ content: string }` to include both the raw structured JSON and a rendered markdown summary. The client currently expects `content` as a string — we'll set `content` to `parsed.summary + rendered bullets` for backward compat, and add a new `structured` field containing the full `ExosOutput` object. This way existing UI rendering works while exports can read structured data.

## Step 5: Update `market-intelligence/index.ts`

Same pattern as Step 4 but simpler — group is always `'E'`. Key changes:
- Import shared module
- Append schema injection to Perplexity system prompt (line 150)
- Apply `parseAIResponse()` to Perplexity response
- Add GDPR flag logging and schema version check
- Enrich LangSmith metadata
- Return both `summary` (for backward compat) and `structured` field

## Step 6: Update Dashboard Data Parser
**File:** `src/lib/dashboard-data-parser.ts`

- Add `isStructuredOutput(raw: string): boolean` — checks for `schema_version: "1.0"` in parsed JSON
- Add `extractFromEnvelope(parsed: ExosOutput): DashboardData | null` — maps payload fields to existing `DashboardData` interface (e.g., `payload.financial_model.cost_breakdown` → `costWaterfall`, etc.)
- Mark existing `extractDashboardData()` with `@deprecated` JSDoc
- Entry point logic: try structured first, fall back to legacy XML

## Step 7: Update Export Layer

**7a — `src/lib/report-export-excel.ts`**
- Add `isStructuredOutput()` check at entry
- When structured: create "Executive Summary", "Recommendations", "Data Gaps" sheets from envelope fields; confidence suffix in title; watermark row if LOW; hidden `_meta` sheet; `gdpr_flags` never exported
- When not structured: existing logic (marked `@deprecated`)

**7b — `src/lib/report-export-jira.ts`**
- Add `isStructuredOutput()` check
- When structured: format using `summary`, `executive_bullets`, `confidence_level`, `data_gaps`, `recommendations`; `gdpr_flags` never in output
- When not structured: existing `formatReportForJira()` (marked `@deprecated`)

**7c — `src/components/reports/pdf/PDFReportDocument.tsx`**
- When structured: confidence badge in header, diagonal watermark if `low_confidence_watermark`, data gaps sidebar, footer with `generated_at`
- When not structured: unchanged rendering
- `gdpr_flags` never rendered

## Step 8: Store Reference Documents
Copy both uploaded documents to `docs/schema/` (NOT `public/docs/`):
- `docs/schema/EXOS_AI_Output_Schema_v1.md`
- `docs/schema/EXOS_Schema_Implementation_Plan_v2.md`

## Step 9: Deploy Both Edge Functions
Deploy `sentinel-analysis` and `market-intelligence` simultaneously. Test with `supabase--curl_edge_functions` before considering done.

## Files Modified

| File | Change |
|---|---|
| `src/lib/sentinel/types.ts` | Add ExosOutput types |
| `src/lib/scenarios.ts` | Add `group` + `scenario_id` to interface and all 29 scenarios |
| `supabase/functions/_shared/output-schemas.ts` | New shared module |
| `supabase/functions/sentinel-analysis/index.ts` | Schema injection, remove dashboard-data XML, defensive parser, GDPR log, schema check, LangSmith metadata |
| `supabase/functions/market-intelligence/index.ts` | Same changes for Group E |
| `src/lib/dashboard-data-parser.ts` | Envelope parser with legacy fallback |
| `src/lib/report-export-excel.ts` | Structured export with legacy fallback |
| `src/lib/report-export-jira.ts` | Structured export with legacy fallback |
| `src/components/reports/pdf/PDFReportDocument.tsx` | Confidence badge, watermark, data gaps, footer |
| `docs/schema/` | Store reference documents |

## Risk Notes

- **Backward compatibility**: Response includes both `content` (string for existing UI) and `structured` (ExosOutput for exports). Pre-schema reports in `shared_reports` use legacy XML path.
- **Security**: Scenario group derived server-side only from `SCENARIO_GROUP_REGISTRY` — never accepted from client.
- **GDPR**: Flags logged to console/LangSmith only. No DB write block at this stage per instruction.
- **Multi-cycle**: Schema injection goes into Analyst Draft and Synthesizer prompts only. Auditor prompt unchanged.

