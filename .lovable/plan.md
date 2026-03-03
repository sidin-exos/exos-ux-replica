

## Implement EXOS Chatbot System Instructions v1.0

### What This Document Covers

The uploaded document is a 38-page system prompt reference for both EXOS chatbots. It defines:

1. **Bot Identity & Persona** — Professional procurement co-pilot, not a general assistant
2. **Hard Boundaries** — Never ask for raw PII, never give legal/tax/financial advice, never fabricate data, never replicate the Sentinel analysis engine
3. **Conversation Architecture** — Opening protocol, scenario discovery flow (progressive, not listing all 29), 4-phase in-scenario coaching (Orient → Block-by-Block → GDPR Check-In → Confidence Calibration)
4. **Scenario Navigation Table** — All 29 scenarios with trigger phrases and navigation guidance
5. **Per-Scenario Coaching Cards** (Section 4) — For each scenario: Purpose, Min Required Inputs, Enhanced Inputs, Common Failure Mode, Financial Impact of Gap, GDPR Guardrail, and specific Coaching Tips with example prompts
6. **GDPR Compliance Protocol** (Section 5) — PII interception protocol with specific response patterns for different data types (employee names, NDA-protected rates, HR data, banking terms, M&A plans)
7. **Escalation & Error Handling** (Section 6) — Decision tree for confused users, out-of-scope redirects, LOW CONFIDENCE handling, anonymisation pushback responses, feedback collection
8. **Quick References** (Section 7) — 3-Block Meta-Pattern, Confidence Dependency tiers, Procurement glossary (BATNA, ZOPA, TCO, WACC, etc.)

### Implementation Approach

The document's intelligence needs to be injected into the **system prompts** of both edge functions. The per-scenario coaching cards should be stored as a structured data file and injected dynamically based on context.

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/_shared/chatbot-instructions.ts` | Central module exporting the full system prompt text, scenario coaching cards, GDPR protocol, and escalation logic as structured constants. Both `chat-copilot` and `scenario-chat-assistant` import from here. |

### Files to Edit

| File | Change |
|------|--------|
| `supabase/functions/chat-copilot/index.ts` | Replace the current `SYSTEM_PROMPT_BASE` with the full Section 1-3 identity, boundaries, conversation architecture, tone standards, scenario discovery flow, escalation protocol, and GDPR interception rules from the shared module. Inject per-scenario navigation guidance (trigger phrases + recommendations) alongside the dynamic scenario catalog. |
| `supabase/functions/scenario-chat-assistant/index.ts` | Enhance `buildSystemPrompt` to inject the relevant scenario's coaching card (purpose, common failure mode, financial impact, GDPR guardrail, coaching tips) from the shared module. Add the 4-phase coaching protocol (Orient → Block-by-Block → GDPR Check-In → Confidence Calibration) and PII interception rules. |

### Technical Details

#### `_shared/chatbot-instructions.ts` Structure

```typescript
// Section 1: Identity, role, hard boundaries
export const BOT_IDENTITY: string;

// Section 2: Conversation architecture (opening, discovery flow, coaching protocol, tone)
export const CONVERSATION_ARCHITECTURE: string;

// Section 3: Scenario navigation table — keyed by scenario ID
export const SCENARIO_NAV_GUIDANCE: Record<string, {
  triggerPhrases: string;
  navigationGuidance: string;
}>;

// Section 4: Per-scenario coaching cards — keyed by scenario ID
export const SCENARIO_COACHING_CARDS: Record<string, {
  purpose: string;
  minRequired: string;
  enhanced: string;
  commonFailure: string;
  financialImpact: string;
  gdprGuardrail: string;
  coachingTips: string;
}>;

// Section 5: GDPR compliance protocol
export const GDPR_PROTOCOL: string;

// Section 6: Escalation & error handling
export const ESCALATION_PROTOCOL: string;

// Section 7: Quick references (3-Block pattern, confidence tiers, glossary)
export const QUICK_REFERENCES: string;
```

#### `chat-copilot` Changes

The current system prompt is ~45 lines. It will be replaced with:
- `BOT_IDENTITY` + `CONVERSATION_ARCHITECTURE` + `GDPR_PROTOCOL` + `ESCALATION_PROTOCOL` as the base prompt
- Dynamic scenario block now includes `SCENARIO_NAV_GUIDANCE[id].triggerPhrases` and `navigationGuidance` alongside the existing `title`/`description`
- `QUICK_REFERENCES` appended for glossary context

#### `scenario-chat-assistant` Changes

The current `buildSystemPrompt` generically describes all fields. It will be enhanced to:
- Look up `SCENARIO_COACHING_CARDS[scenarioId]` and inject the full card (purpose, failure mode, financial impact, GDPR guardrail, coaching tips)
- Prepend the 4-phase coaching protocol from `CONVERSATION_ARCHITECTURE`
- Add the PII interception table from `GDPR_PROTOCOL`
- Add confidence calibration guidance based on scenario tier from `QUICK_REFERENCES`

#### Prompt Size Consideration

The full document is ~15,000 words. We will NOT inject everything into every prompt. Instead:
- `chat-copilot` gets: identity + conversation architecture + GDPR protocol + escalation + scenario nav table (condensed) — approximately 3,000 tokens
- `scenario-chat-assistant` gets: identity (abbreviated) + coaching protocol + the ONE relevant scenario card + GDPR interception rules — approximately 1,500 tokens

This keeps prompts focused and within reasonable token budgets.

