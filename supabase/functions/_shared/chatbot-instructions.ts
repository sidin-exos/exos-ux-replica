/**
 * EXOS Chatbot System Instructions — Types & Helpers
 * All methodology content now lives in database tables:
 *   - methodology_config (bot_identity, conversation_architecture, gdpr_protocol, etc.)
 *   - coaching_cards (per-scenario coaching data)
 *   - scenario_field_config (per-block field definitions)
 */

// ─── DB ROW TYPES ───────────────────────────────────────────────────────────

export interface CoachingCardRow {
  scenario_slug: string;
  scenario_name?: string;
  scenario_id?: number;
  scenario_group?: string;
  purpose: string;
  min_required: string;
  enhanced: string;
  common_failure: string;
  financial_impact: string;
  gdpr_guardrail: string;
  coaching_tips: string;
  example_prompt?: string | null;
  trigger_phrases: string;
  navigation_guidance: string;
  confidence_dependency?: string;
}

// ─── HELPER: Build condensed nav table for chat-copilot ─────────────────────

export function buildScenarioNavBlock(
  scenarios: { id: string; title: string; description: string }[],
  coachingCards: CoachingCardRow[]
): string {
  const cardMap = new Map(coachingCards.map((c) => [c.scenario_slug, c]));

  const lines = scenarios.map((s) => {
    const card = cardMap.get(s.id);
    if (card) {
      return `- **${s.title}** (${s.id}): ${s.description}\n  _Triggers_: ${card.trigger_phrases}\n  _Guidance_: ${card.navigation_guidance}`;
    }
    return `- **${s.title}** (${s.id}): ${s.description}`;
  });
  return `## Available Scenarios (${scenarios.length} total)\nAll accessible via /reports:\n${lines.join("\n")}`;
}

// ─── HELPER: Build coaching injection for scenario-chat-assistant ────────────

export function buildCoachingBlock(card: CoachingCardRow | null): string {
  if (!card) return "";

  return `## Scenario Coaching Card
**Purpose**: ${card.purpose}
**Minimum Required Inputs**: ${card.min_required}
**Enhanced Inputs** (improve output quality): ${card.enhanced}
**Common Failure Mode**: ${card.common_failure}
**Financial Impact of Gap**: ${card.financial_impact}
**GDPR Guardrail**: ${card.gdpr_guardrail}

## Coaching Tips for This Scenario
${card.coaching_tips}`;
}
