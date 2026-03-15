

# Plan: Implement Advanced Test Data Engine (Multi-Block & Quality Tiers)

## Problem
The "Draft Test Case" button only populates Block 1. Blocks 2 and 3 remain empty due to:
1. `maxOutputTokens: 2048` — truncates after Block 1
2. Prompts list bare field names with no per-block guidance
3. `dataQuality` parameter is drafted but never shapes generation
4. No deviation type awareness

## Changes

### 1. Create `supabase/functions/generate-test-data/block-guidance.ts` (new file, ~800 lines)

Exports:

**`BlockGuidance` interface** with `fieldId`, `label`, `guidance`, `subPrompts[]` (each with `label`, `isCritical?`, `dataType`, `realisticRange?`), `isRequired`, `expectedDataType`.

**`SCENARIO_BLOCK_GUIDANCE: Record<string, BlockGuidance[]>`** — all 29 scenarios derived from `scenarios.ts` `requiredFields`. Each entry provides:
- Block labels from Field Methodology
- Content guidance with EU context (EUR, metric, EU regulatory references)
- Sub-prompt structures for Type 1/1H scenarios with realistic value ranges
- Critical field markers for Type 1H (WACC, tax rate, KPI%, legal entity name)
- Document-length rules for Type 2 (spend tables 10+ rows, SOW 500+ words, licence summaries)

**`QUALITY_TIER_INSTRUCTIONS: Record<QualityTier, string>`** — four tier instruction blocks per spec §5.3:
- OPTIMAL: All blocks populated, all sub-prompts with concrete values, domain terms, internally consistent financials
- MINIMUM: Brief Block 1 (30-40 words), Block 2 minimum viable, Block 3 mostly empty
- DEGRADED: Generic Block 1, qualitative-only Block 2 (no numbers), Block 3 empty. For Type 1H: critical fields absent
- GIBBERISH: Random chars Block 1, lorem/single word Block 2, empty Block 3

Each tier includes the GDPR guardrail: "ALL data 100% synthetic. No real EU citizen data, no real company names. Use fictional entity names with correct legal suffixes (GmbH, Ltd, S.A.), role-based references, Labour Rate Bands."

**`DEVIATION_TYPE_RULES: Record<string, string>`** — Type 0/1/1H/2 generation approach instructions from spec §7.

**`mapDataQualityToTier(dataQuality: string): QualityTier`** — excellent/good → OPTIMAL, partial → MINIMUM, poor → DEGRADED.

### 2. Modify `supabase/functions/generate-test-data/index.ts`

**`callAI()`** (line 1091): Change `maxOutputTokens: 2048` → `8192`.

**`handleDraftMode()`** (line 730): After parsing parameters, compute `qualityTier` via `mapDataQualityToTier(parsed.dataQuality)` and attach to returned object.

**`handleGenerateMode()`** (line 812):
- Import and look up `SCENARIO_BLOCK_GUIDANCE[scenarioType]`
- Compute `qualityTier` from `parameters.dataQuality`
- Replace the bare field listing in system/user prompts with structured per-block instructions: for each block, inject label, guidance, sub-prompts with ranges
- For Type 1H + DEGRADED: list critical fields to deliberately omit
- Append `QUALITY_TIER_INSTRUCTIONS[tier]` and `DEVIATION_TYPE_RULES`
- Add `qualityTier` to metadata
- Import LangSmithTracer and pass `qualityTier` + deviation type into tags/metadata

**`buildGenerationPrompt()`** (line 1101): Same block guidance injection, default to OPTIMAL tier.

**`handleMessyMode()`** (line 999): Force GIBBERISH tier instructions.

### 3. Modify `src/lib/drafted-parameters.ts`

- Add `qualityTier?: 'OPTIMAL' | 'MINIMUM' | 'DEGRADED' | 'GIBBERISH'` to `DraftedParameters` interface
- Add `qualityTier` labels to `PARAMETER_LABELS`

### No UI changes
`GenericScenarioWizard.tsx` already passes full `DraftedParameters` to `generateWithParameters()`.

## Scope
- **Create**: `supabase/functions/generate-test-data/block-guidance.ts`
- **Modify**: `supabase/functions/generate-test-data/index.ts`
- **Modify**: `src/lib/drafted-parameters.ts`
- No DB changes, no UI changes

