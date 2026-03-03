

## Scenario Data Collection Chatbot — Implementation Plan

### What We're Building

A conversational data-entry assistant that opens inline within the scenario wizard. It walks users through required fields, explains each field's purpose, sanitizes PII server-side before LLM contact, and returns structured field extractions via tool calling.

### Files to Create (4)

**1. `supabase/functions/_shared/anonymizer.ts`** — Lightweight PII sanitizer for Deno

Port regex patterns from `src/lib/sentinel/anonymizer.ts` for: emails, phone numbers, IBANs, credit cards, tax IDs, company names with legal suffixes. Export a single `sanitizeMessages(messages)` function that replaces PII in `content` strings with generic tokens like `[EMAIL]`, `[PHONE]`, `[IBAN]`. No entity map or restoration — one-way masking only since the LLM response goes back to the user as-is.

**2. `supabase/functions/scenario-chat-assistant/index.ts`** — Edge Function

- **Auth**: `authenticateRequest` from `_shared/auth.ts` — reject 401
- **Tracing**: `LangSmithTracer` with `feature: "scenario-chat-assistant"`
- **Validation** via `_shared/validate.ts`: `messages` (max 30), `scenarioId` (string), `scenarioFields[]` (max 30 items), `dataRequirements` (string, max 10000), `extractedSoFar` (optional object)
- **Sanitization**: Call `sanitizeMessages(messages)` before building the LLM payload
- **System prompt**: Procurement data-gathering assistant role. Receives field metadata (id, label, description, required, type, placeholder) and dataRequirements text. Instructions: walk through unfilled fields conversationally, explain purpose, suggest data sources (ERP, finance, contracts), note GDPR considerations, never fabricate values
- **Tool**: `update_fields` function tool with `properties` schema built dynamically from `scenarioFields[].id` — each property is `{ type: "string", description: field.label }`. Use `tool_choice: { type: "function", function: { name: "update_fields" } }` is NOT forced — let the model decide when to extract
- **LLM call**: `google/gemini-3-flash-preview` via Lovable gateway, temperature 0.2
- **Response parsing**: Extract `extractedFields` from tool calls, return `{ content, extractedFields? }`
- **Error handling**: 429/402 friendly messages, same pattern as chat-copilot

Config: Do NOT add to `config.toml` — rely on default JWT verification at the API gateway level.

**3. `src/lib/scenario-chat-service.ts`** — Frontend service

```typescript
export interface ScenarioChatMessage { role: 'user' | 'assistant'; content: string }
export interface ScenarioChatResponse { content: string; extractedFields?: Record<string, string> }

export async function getScenarioChatResponse(
  messages: ScenarioChatMessage[],
  scenarioId: string,
  scenarioFields: { id: string; label: string; description: string; required: boolean; type: string; placeholder?: string }[],
  dataRequirements: string,
  extractedSoFar: Record<string, string>
): Promise<ScenarioChatResponse>
```

Uses `supabase.functions.invoke('scenario-chat-assistant', { body })` — JWT automatic.

**4. `src/hooks/useScenarioChatAssistant.ts`** — React hook

State: `messages: ScenarioChatMessage[]`, `extractedFields: Record<string, string>`, `isTyping: boolean`

Methods:
- `sendMessage(content)` — append user msg, call service, append assistant response, merge any new `extractedFields`
- `applyToForm()` → returns current `extractedFields`
- `resetSession()` — clear all state

**5. `src/components/scenarios/ScenarioChatAssistant.tsx`** — Chat panel UI

Inline Card component (not modal) with:
- ScrollArea for message history (bot icon for assistant, user icon for user)
- Input + Send button footer
- **Field progress tracker**: Row of Badges showing each required field — green check if extracted, gray circle if pending. Shows count like "3/7 fields collected"
- **"Apply to Form" button**: Enabled when `Object.keys(extractedFields).length > 0`. Calls `onApply(extractedFields)` prop
- Close button to collapse

Props: `scenarioId`, `requiredFields`, `dataRequirements`, `onApply(fields)`, `onClose()`

### File to Edit (1)

**`src/components/scenarios/GenericScenarioWizard.tsx`**

- Add `showChatAssistant` boolean state (line ~110 area)
- After `DataRequirementsCollapsible` (line 524-525), add:
  ```tsx
  <Button variant="outline" size="sm" onClick={() => setShowChatAssistant(!showChatAssistant)} className="gap-2">
    <MessageSquare className="w-4 h-4" />
    Use chatbot to enter data
  </Button>
  ```
- Conditionally render `<ScenarioChatAssistant>` inline below the button when toggled
- Pass `scenario.requiredFields`, `scenario.dataRequirements` (serialized), `scenario.id`
- `onApply` handler: `setFormData(prev => ({ ...prev, ...fields }))`, then `setShowChatAssistant(false)` and `toast.success("Fields populated from chat")`
- Import `MessageSquare` from lucide-react, import `ScenarioChatAssistant`

### Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Separate edge function from chat-copilot | Different system prompt, tool schema, and purpose — keeps both maintainable |
| One-way PII masking (no restoration) | LLM response is conversational guidance, not data — no need to de-anonymize |
| No `config.toml` entry | Default JWT verification at gateway level; auth.ts validates inside the function |
| Tool calling not forced | LLM should only extract when user provides data, not on every exchange |
| Temperature 0.2 | Precision over creativity — this is data extraction, not creative writing |
| Client-side session only | Per constraints — no DB persistence yet |

