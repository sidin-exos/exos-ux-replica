/**
 * Block Guidance — Types, Structural Constants & Helpers
 *
 * Per-scenario content (SCENARIO_BLOCK_GUIDANCE) has moved to the
 * scenario_field_config database table.
 *
 * This file retains:
 * - Type definitions
 * - QUALITY_TIER_INSTRUCTIONS (structural — how to generate)
 * - DEVIATION_TYPE_RULES (structural — generation behavior rules)
 * - Helper functions that accept DB rows
 *
 * GDPR: All tiers enforce 100% synthetic data generation.
 */

// =============================================
// TYPES
// =============================================

export interface SubPrompt {
  label: string;
  isCritical?: boolean;
  dataType: string;
  realisticRange?: string;
}

export interface BlockGuidance {
  fieldId: string;
  label: string;
  guidance: string;
  subPrompts: SubPrompt[];
  isRequired: boolean;
  expectedDataType: 'narrative' | 'numeric' | 'structured' | 'document';
}

export type QualityTier = 'OPTIMAL' | 'MINIMUM' | 'DEGRADED' | 'GIBBERISH';

/** Row shape from scenario_field_config table */
export interface ScenarioFieldConfigRow {
  block_id: string;
  block_label: string;
  is_required: boolean;
  expected_data_type: string;
  sub_prompts: { label: string; is_critical: boolean; data_type: string; realistic_range?: string }[] | null;
  deviation_type: string;
  block_guidance: string | null;
}

// =============================================
// GDPR GUARDRAIL (injected into every tier)
// =============================================

const GDPR_GUARDRAIL = `MANDATORY GDPR GUARDRAIL: ALL generated data must be 100% synthetic. No real EU citizen data, no real company names, no PII. Use fictional entity names with correct legal suffixes (GmbH, Ltd, S.A., B.V., S.r.l.). Use role-based references (e.g. 'Operations Lead', 'CPO') instead of personal names. Use Labour Rate Bands (A/B/C) instead of exact salaries. All financial figures must be fictional but realistic.`;

// =============================================
// QUALITY TIER INSTRUCTIONS
// =============================================

export const QUALITY_TIER_INSTRUCTIONS: Record<QualityTier, string> = {
  OPTIMAL: `DATA QUALITY TIER: OPTIMAL (Senior CPO Input)
${GDPR_GUARDRAIL}

INSTRUCTIONS:
- ALL blocks must be fully populated with specific, concrete values
- Every sub-prompt must be addressed with exact figures (not ranges)
- Use precise domain terminology and industry-specific KPIs
- Financial figures must be internally consistent (totals match line items)
- Include realistic EU regulatory references (GDPR, REACH, TUPE, IFRS 16)
- Block 1 (Context): 80-120 words, specific company profile with sector, size, geography
- Block 2 (Core Data): All sub-prompts filled with concrete EUR values and percentages
- Block 3 (Parameters): Detailed strategic context with measurable targets
- Expected Input Evaluator result: READY`,

  MINIMUM: `DATA QUALITY TIER: MINIMUM (Busy Buyer)
${GDPR_GUARDRAIL}

INSTRUCTIONS:
- Block 1 (Context): Brief, 30-40 words, mentions industry and category but lacks specifics
- Block 2 (Core Data): Minimum viable data — some sub-prompts filled with ranges instead of exact values, some left as "TBC" or "approximately"
- Block 3 (Parameters): Mostly empty or single-line responses
- Use casual language, abbreviations acceptable
- Some numbers given as ranges ("€40-60k") instead of exact values
- Missing some supporting details but core request is clear
- Expected Input Evaluator result: IMPROVABLE`,

  DEGRADED: `DATA QUALITY TIER: DEGRADED (Missing Critical Data)
${GDPR_GUARDRAIL}

INSTRUCTIONS:
- Block 1 (Context): Generic, 15-25 words, could apply to any industry
- Block 2 (Core Data): Qualitative descriptions only — NO specific numbers, percentages, or EUR values. Use phrases like "significant amount", "competitive rate", "industry standard"
- Block 3 (Parameters): Empty string ""
- For Type 1H scenarios: DELIBERATELY OMIT all fields marked as isCritical (e.g. WACC, tax rate, KPI percentages, legal entity specifics)
- Overall tone: vague, non-committal, uses filler phrases
- Expected Input Evaluator result: INSUFFICIENT`,

  GIBBERISH: `DATA QUALITY TIER: GIBBERISH (Invalid Input)
${GDPR_GUARDRAIL}

INSTRUCTIONS:
- Block 1 (Context): Random characters, keyboard mash, or completely irrelevant content (e.g. "asdf jkl; what is the weather in London?" or "hjkl 1234 test test")
- Block 2 (Core Data): Lorem ipsum, single repeated word, or copy-paste of unrelated text. May contain a real-looking number but in wrong context
- Block 3 (Parameters): Empty string ""
- The data should trigger UNIVERSAL_GIBBERISH detection in the Input Evaluator
- Do NOT make it subtly wrong — make it obviously garbage input
- Expected Input Evaluator result: INSUFFICIENT with gibberish flags`,
};

// =============================================
// DEVIATION TYPE RULES
// =============================================

export const DEVIATION_TYPE_RULES: Record<string, string> = {
  "0": `DEVIATION TYPE 0 — NARRATIVE INPUT
All blocks accept free-form narrative text. No structured sub-prompts required.
Generate natural-language descriptions appropriate to the persona.
Block lengths should feel organic — not every block needs equal weight.`,

  "1": `DEVIATION TYPE 1 — STRUCTURED WITH SUB-PROMPTS
Blocks contain structured sub-prompts (bullet points with specific data types).
Each sub-prompt should be addressed individually with the appropriate data type.
Numeric sub-prompts need specific values (not "see above" or "as discussed").
Text sub-prompts should be 1-3 sentences each.`,

  "1H": `DEVIATION TYPE 1H — HIGH-STAKES STRUCTURED
Same as Type 1, but contains CRITICAL fields marked with isCritical=true.
These fields (WACC, tax rate, KPI percentages, legal entity details) are essential for accurate financial modelling.
In OPTIMAL/MINIMUM tiers: these MUST be present with specific values.
In DEGRADED tier: these must be DELIBERATELY OMITTED to test the system's ability to detect missing critical inputs.`,

  "2": `DEVIATION TYPE 2 — DOCUMENT INPUT
At least one block expects a document-length input (SOW text, spend data table, licence agreement).
Document blocks should be 300-800 words of realistic synthetic content.
Spend data blocks should contain 10+ rows in tabular format.
SOW blocks should include numbered clauses, deliverables, and acceptance criteria.
Licence blocks should include metric definitions, true-up clauses, and pricing tiers.`,
};

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Map UI dataQuality values to QualityTier
 */
export function mapDataQualityToTier(dataQuality: string): QualityTier {
  switch (dataQuality) {
    case 'excellent':
    case 'good':
      return 'OPTIMAL';
    case 'partial':
      return 'MINIMUM';
    case 'poor':
      return 'DEGRADED';
    default:
      return 'OPTIMAL';
  }
}

/**
 * Extract field groups from DB rows (replaces getScenarioFieldGroups)
 */
export function getFieldGroups(fieldConfigs: ScenarioFieldConfigRow[]): {
  required: string[];
  optional: string[];
  all: string[];
} {
  if (fieldConfigs.length === 0) {
    return {
      required: ["industryContext"],
      optional: [],
      all: ["industryContext"],
    };
  }

  const required = fieldConfigs.filter((b) => b.is_required).map((b) => b.block_id);
  const optional = fieldConfigs.filter((b) => !b.is_required).map((b) => b.block_id);

  return {
    required,
    optional,
    all: [...required, ...optional],
  };
}

/**
 * Build per-block generation instructions from DB rows
 */
export function buildBlockInstructions(
  fieldConfigs: ScenarioFieldConfigRow[],
  qualityTier: QualityTier
): string {
  if (fieldConfigs.length === 0) {
    return "Generate realistic content for all fields.";
  }

  const deviationType = fieldConfigs[0].deviation_type || "0";
  const isDegraded = qualityTier === 'DEGRADED';
  const is1H = deviationType === '1H';

  let instructions = `\nBLOCK-BY-BLOCK GENERATION INSTRUCTIONS:\n`;

  fieldConfigs.forEach((block, idx) => {
    instructions += `\n--- BLOCK ${idx + 1}: "${block.block_label}" (field: "${block.block_id}") ---\n`;
    instructions += `Data Type: ${block.expected_data_type}\n`;
    instructions += `Required: ${block.is_required ? 'YES' : 'NO'}\n`;
    instructions += `Guidance: ${block.block_guidance || ''}\n`;

    const subPrompts = block.sub_prompts || [];
    if (subPrompts.length > 0) {
      instructions += `Sub-prompts to address:\n`;
      subPrompts.forEach(sp => {
        const criticalNote = sp.is_critical ? ' [CRITICAL]' : '';
        const rangeNote = sp.realistic_range ? ` (realistic range: ${sp.realistic_range})` : '';

        if (isDegraded && is1H && sp.is_critical) {
          instructions += `  • ${sp.label}${criticalNote}: DELIBERATELY OMIT THIS FIELD\n`;
        } else {
          instructions += `  • ${sp.label}${criticalNote} [${sp.data_type}]${rangeNote}\n`;
        }
      });
    }
  });

  instructions += `\n${DEVIATION_TYPE_RULES[deviationType] || DEVIATION_TYPE_RULES["0"]}\n`;
  instructions += `\n${QUALITY_TIER_INSTRUCTIONS[qualityTier]}\n`;

  return instructions;
}
