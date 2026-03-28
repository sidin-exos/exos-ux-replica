/**
 * XML Template Generator for AI Context Grounding
 * 
 * These templates structure procurement context data into XML format
 * for enhanced AI reasoning. The team can fine-tune these templates
 * to optimize response accuracy.
 */

// ============================================
// V2 ENRICHED TYPES
// ============================================

export interface ConstraintV2 {
  id?: string;
  tier?: string;
  label: string;
  eu_ref?: string;
  procurement_impact?: string;
  blocker?: boolean;
}

export interface KpiV2 {
  id?: string;
  label: string;
  direction?: string;
  exos_lever?: string;
  benchmark_signal?: string;
}

export interface CostDriver {
  driver: string;
  share_pct?: string;
}

export interface ProcurementLever {
  lever: string;
  description?: string;
}

export interface FailureMode {
  mode: string;
  mitigation?: string;
}

// ============================================
// CORE TYPES
// ============================================

export interface IndustryContext {
  id: string;
  name: string;
  slug: string;
  constraints: string[];
  kpis: string[];
  // V2 enriched fields
  constraints_v2?: ConstraintV2[];
  kpis_v2?: KpiV2[];
}

export interface ProcurementCategory {
  id: string;
  name: string;
  slug: string;
  characteristics: string;
  kpis: string[];
  // V2 enriched fields
  category_group?: string | null;
  spend_type?: string | null;
  kraljic_position?: string | null;
  kraljic_rationale?: string | null;
  price_volatility?: string | null;
  market_structure?: string | null;
  supply_concentration?: string | null;
  key_cost_drivers?: CostDriver[];
  procurement_levers?: ProcurementLever[];
  negotiation_dynamics?: string | null;
  should_cost_components?: string | null;
  eu_regulatory_context?: string | null;
  common_failure_modes?: FailureMode[];
  exos_scenarios_primary?: string[];
  exos_scenarios_secondary?: string[];
  kpis_v2?: KpiV2[];
}

// ============================================
// XML GENERATORS
// ============================================

/**
 * Generate XML context block for industry grounding
 */
export function generateIndustryContextXML(industry: IndustryContext): string {
  const hasV2Constraints = industry.constraints_v2 && industry.constraints_v2.length > 0;
  const hasV2Kpis = industry.kpis_v2 && industry.kpis_v2.length > 0;

  const constraintsXML = hasV2Constraints
    ? industry.constraints_v2!.map((c, i) => {
        const attrs = [
          `priority="${i + 1}"`,
          c.tier ? `tier="${escapeXML(c.tier)}"` : '',
          c.blocker ? `blocker="true"` : '',
          c.eu_ref ? `eu-ref="${escapeXML(c.eu_ref)}"` : '',
        ].filter(Boolean).join(' ');
        const impact = c.procurement_impact ? `\n        <procurement-impact>${escapeXML(c.procurement_impact)}</procurement-impact>` : '';
        const blockerComment = c.blocker ? ' <!-- HARD GATE -->' : '';
        return `      <constraint ${attrs}>${escapeXML(c.label)}${impact}\n      </constraint>${blockerComment}`;
      }).join('\n')
    : industry.constraints.map((c, i) => `      <constraint priority="${i + 1}">${escapeXML(c)}</constraint>`).join('\n');

  const kpisXML = hasV2Kpis
    ? industry.kpis_v2!.map((k, i) => {
        const attrs = [
          `index="${i + 1}"`,
          k.direction ? `direction="${escapeXML(k.direction)}"` : '',
          k.exos_lever ? `exos-lever="${escapeXML(k.exos_lever)}"` : '',
          k.benchmark_signal ? `benchmark="${escapeXML(k.benchmark_signal)}"` : '',
        ].filter(Boolean).join(' ');
        return `      <kpi ${attrs}>${escapeXML(k.label)}</kpi>`;
      }).join('\n')
    : industry.kpis.map((k, i) => `      <kpi index="${i + 1}">${escapeXML(k)}</kpi>`).join('\n');

  return `<industry-context>
  <industry-name>${escapeXML(industry.name)}</industry-name>
  <industry-id>${escapeXML(industry.slug)}</industry-id>
  
  <regulatory-constraints>
    <description>The following regulatory and operational constraints are critical for this industry. All recommendations must account for these requirements.</description>
    <constraints>
${constraintsXML}
    </constraints>
  </regulatory-constraints>
  
  <performance-kpis>
    <description>These are the standard performance metrics used in this industry. Recommendations should align with and potentially improve these KPIs.</description>
    <kpis>
${kpisXML}
    </kpis>
  </performance-kpis>
  
  <grounding-instructions>
    <instruction>Consider all regulatory constraints when making recommendations</instruction>
    <instruction>Align savings opportunities with industry-standard KPIs</instruction>
    <instruction>Flag any recommendations that may conflict with industry regulations</instruction>
    <instruction>Use industry-specific terminology in responses</instruction>
    <instruction>If a constraint is flagged as a blocker, treat it as a hard decision gate — never recommend actions that violate it</instruction>
  </grounding-instructions>
</industry-context>`;
}

/**
 * Generate XML context block for procurement category grounding
 */
export function generateCategoryContextXML(category: ProcurementCategory): string {
  const hasV2Kpis = category.kpis_v2 && category.kpis_v2.length > 0;

  const kpisXML = hasV2Kpis
    ? category.kpis_v2!.map((k, i) => {
        const attrs = [
          `index="${i + 1}"`,
          k.direction ? `direction="${escapeXML(k.direction)}"` : '',
          k.exos_lever ? `exos-lever="${escapeXML(k.exos_lever)}"` : '',
          k.benchmark_signal ? `benchmark="${escapeXML(k.benchmark_signal)}"` : '',
        ].filter(Boolean).join(' ');
        return `      <kpi ${attrs}>${escapeXML(k.label)}</kpi>`;
      }).join('\n')
    : category.kpis.map((k, i) => `      <kpi index="${i + 1}">${escapeXML(k)}</kpi>`).join('\n');

  // Build optional enriched sections
  const enrichedParts: string[] = [];

  if (category.kraljic_position) {
    enrichedParts.push(`  <kraljic-position value="${escapeXML(category.kraljic_position)}">
    ${category.kraljic_rationale ? escapeXML(category.kraljic_rationale) : ''}
  </kraljic-position>`);
  }

  if (category.price_volatility || category.market_structure || category.supply_concentration) {
    enrichedParts.push(`  <market-dynamics>
    ${category.price_volatility ? `<price-volatility>${escapeXML(category.price_volatility)}</price-volatility>` : ''}
    ${category.market_structure ? `<market-structure>${escapeXML(category.market_structure)}</market-structure>` : ''}
    ${category.supply_concentration ? `<supply-concentration>${escapeXML(category.supply_concentration)}</supply-concentration>` : ''}
  </market-dynamics>`);
  }

  if (category.key_cost_drivers && category.key_cost_drivers.length > 0) {
    const driversXML = category.key_cost_drivers.map(d => {
      const pct = d.share_pct ? ` share="${escapeXML(d.share_pct)}"` : '';
      return `      <driver${pct}>${escapeXML(d.driver)}</driver>`;
    }).join('\n');
    enrichedParts.push(`  <key-cost-drivers>
${driversXML}
  </key-cost-drivers>`);
  }

  if (category.procurement_levers && category.procurement_levers.length > 0) {
    const leversXML = category.procurement_levers.map(l => {
      const desc = l.description ? ` description="${escapeXML(l.description)}"` : '';
      return `      <lever${desc}>${escapeXML(l.lever)}</lever>`;
    }).join('\n');
    enrichedParts.push(`  <procurement-levers>
${leversXML}
  </procurement-levers>`);
  }

  if (category.negotiation_dynamics) {
    enrichedParts.push(`  <negotiation-dynamics>${escapeXML(category.negotiation_dynamics)}</negotiation-dynamics>`);
  }

  if (category.should_cost_components) {
    enrichedParts.push(`  <should-cost-components>${escapeXML(category.should_cost_components)}</should-cost-components>`);
  }

  if (category.eu_regulatory_context) {
    enrichedParts.push(`  <eu-regulatory-context>${escapeXML(category.eu_regulatory_context)}</eu-regulatory-context>`);
  }

  if (category.common_failure_modes && category.common_failure_modes.length > 0) {
    const modesXML = category.common_failure_modes.map(f => {
      const mit = f.mitigation ? ` mitigation="${escapeXML(f.mitigation)}"` : '';
      return `      <failure-mode${mit}>${escapeXML(f.mode)}</failure-mode>`;
    }).join('\n');
    enrichedParts.push(`  <common-failure-modes>
${modesXML}
  </common-failure-modes>`);
  }

  return `<category-context>
  <category-name>${escapeXML(category.name)}</category-name>
  <category-id>${escapeXML(category.slug)}</category-id>
  ${category.category_group ? `<category-group>${escapeXML(category.category_group)}</category-group>` : ''}
  ${category.spend_type ? `<spend-type>${escapeXML(category.spend_type)}</spend-type>` : ''}
  
  <category-characteristics>
    <description>Key characteristics that define this procurement category and influence sourcing strategies.</description>
    <characteristics>${escapeXML(category.characteristics)}</characteristics>
  </category-characteristics>
  
${enrichedParts.length > 0 ? enrichedParts.join('\n\n') + '\n' : ''}
  <category-kpis>
    <description>Standard performance metrics for this category. Use these for benchmarking and improvement recommendations.</description>
    <kpis>
${kpisXML}
    </kpis>
  </category-kpis>
  
  <grounding-instructions>
    <instruction>Account for category-specific characteristics in all recommendations</instruction>
    <instruction>Benchmark recommendations against category KPIs</instruction>
    <instruction>Consider typical supplier dynamics for this category</instruction>
    <instruction>Suggest category-appropriate negotiation tactics</instruction>
    <instruction>If price volatility is high, treat it as a hard constraint requiring hedging strategies</instruction>
  </grounding-instructions>
</category-context>`;
}

/**
 * Generate combined XML context for full analysis grounding
 */
export function generateFullContextXML(
  industry: IndustryContext | null,
  category: ProcurementCategory | null,
  scenarioData: Record<string, string>,
  scenarioType: string
): string {
  const parts: string[] = [];
  
  parts.push(`<analysis-context scenario-type="${escapeXML(scenarioType)}">`);
  
  if (industry) {
    parts.push(generateIndustryContextXML(industry));
  }
  
  if (category) {
    parts.push(generateCategoryContextXML(category));
  }
  
  // Add user-provided scenario data
  parts.push(`  <user-input>`);
  for (const [key, value] of Object.entries(scenarioData)) {
    if (value && value.trim()) {
      parts.push(`    <field name="${escapeXML(key)}">${escapeXML(value)}</field>`);
    }
  }
  parts.push(`  </user-input>`);
  
  // Add cross-reference instructions
  parts.push(`  <cross-reference-instructions>
    <instruction>Cross-reference user inputs with industry constraints for compliance checks</instruction>
    <instruction>Identify opportunities based on category benchmarks</instruction>
    <instruction>Suggest best practices from analogous categories when applicable</instruction>
    <instruction>Provide quantified recommendations where industry KPIs allow</instruction>
  </cross-reference-instructions>`);
  
  parts.push(`</analysis-context>`);
  
  return parts.join('\n');
}

/**
 * Generate system prompt with context grounding
 */
export function generateGroundedSystemPrompt(
  basePrompt: string,
  industry: IndustryContext | null,
  category: ProcurementCategory | null
): string {
  const contextParts: string[] = [];
  
  if (industry) {
    contextParts.push(generateIndustryContextXML(industry));
  }
  
  if (category) {
    contextParts.push(generateCategoryContextXML(category));
  }
  
  if (contextParts.length === 0) {
    return basePrompt;
  }
  
  return `${basePrompt}

<grounding-context>
${contextParts.join('\n\n')}

<meta-instructions>
  <instruction>Use the provided industry and category context to ground all recommendations</instruction>
  <instruction>Ensure compliance with regulatory constraints before suggesting actions</instruction>
  <instruction>Reference specific KPIs when quantifying potential improvements</instruction>
  <instruction>Draw analogies from best practices in similar industries/categories</instruction>
  <instruction>Provide actionable insights tailored to the specific context</instruction>
</meta-instructions>
</grounding-context>`;
}

/**
 * Escape special XML characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
