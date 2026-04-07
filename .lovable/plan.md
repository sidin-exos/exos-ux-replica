

# Task 3 — Rebuild Generation Prompt for All 3 Blocks

## Summary

Replace the system and user prompts in `handleGenerateMode` (lines 608-665) with the new layered prompt structure. Also update the output format to expect `block1`/`block2`/`block3`/`testNotes`/`expectedEvaluatorScore` keys, and adjust `parseGeneratedData` to map these block keys back to the scenario field IDs.

## Changes — Single File

**`supabase/functions/generate-test-data/index.ts`**

### 1. Replace system prompt (lines 608-650)

New system prompt is a static string covering:
- Procurement data specialist role
- GDPR rules (fictional entities, no PII, role-based references, EUR ranges, region-level addresses)
- Strict OUTPUT FORMAT requiring `{ block1, block2, block3, testNotes, expectedEvaluatorScore }`

### 2. Replace user prompt (lines 652-665)

Build dynamically with 6 layers in exact order:
- **Layer 1**: Scenario context (name, ID, group, deviation type, quality tier, persona)
- **Layer 2**: Field structure from `fieldConfigs` — iterate blocks showing label, data type, sub-prompts, critical flags, tier-specific guidance
- **Layer 3**: Methodology grounding from DB context (`categoryCtx` and `industryCtx`) — only non-null fields, skip entirely if both null
- **Layer 4**: Parameter constraints (industry, category, company size with financial scale reference table, complexity, financial context, market conditions, priority)
- **Layer 5**: Trick injection (if trick present) — type, instruction, target block, subtlety
- **Layer 6**: Generation instruction — tier-specific rules (OPTIMAL=full, MINIMUM=bare minimum, DEGRADED=deliberate failures, GIBBERISH=garbage) + persona style instruction

### 3. Update `parseGeneratedData` call site (line 689)

After parsing, map `block1`/`block2`/`block3` keys back to actual field IDs from `fieldConfigs`:
- `block1` → first field config block_id (typically `industryContext`)
- `block2` → second field config block_id
- `block3` → third field config block_id
- Also preserve `testNotes` and `expectedEvaluatorScore` in metadata

### 4. Add persona style instructions map

Add a `PERSONA_STYLE_INSTRUCTIONS` record mapping persona IDs to writing style descriptions (rushed-junior, methodical-manager, cfo-finance, frustrated-stakeholder, lost-user).

### 5. Add company size financial scale reference

Add `COMPANY_SIZE_SCALES` record with SME/Mid-Market/Large Enterprise ranges for contract values and WACC.

## Deployment
- Deploy `generate-test-data` after changes

## Not Changed
- `handleDraftMode`, `handleMessyMode`, `buildGenerationPrompt` (full mode) — untouched
- `parseGeneratedData` function itself — unchanged (already preserves all keys)
- No other files

