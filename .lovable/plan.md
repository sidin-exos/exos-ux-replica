

# Connect EXOS Chat Copilot to Lovable AI

## Problem

The `chat-copilot` edge function doesn't exist yet, so every chat message returns "I'm having trouble connecting right now."

## Solution

Create the `supabase/functions/chat-copilot/index.ts` edge function powered by Lovable AI (via `LOVABLE_API_KEY`, already configured).

## Changes

### 1. Create `supabase/functions/chat-copilot/index.ts`

- Uses `LOVABLE_API_KEY` to call `https://ai.gateway.lovable.dev/v1/chat/completions`
- Model: `google/gemini-3-flash-preview` (fast, cost-effective for a guide chatbot)
- **Non-streaming** (the client already uses `supabase.functions.invoke`, not SSE)
- System prompt: EXOS procurement copilot persona -- knows the available scenarios, can recommend which to use, and can emit a `NAVIGATE` action via tool calling
- Tool calling: defines a `navigate` tool so the AI can return `{ type: "NAVIGATE", payload: "/path" }` actions when it wants to direct the user to a scenario
- Handles 429 (rate limit) and 402 (payment required) errors with user-friendly messages
- Returns JSON: `{ content: string, action?: { type: "NAVIGATE", payload: string } }`

### 2. Update `supabase/config.toml`

- Add `[functions.chat-copilot]` with `verify_jwt = false` (matches existing function config pattern)

### 3. No client changes needed

The existing `chat-service.ts` and `use-exos-chat.tsx` already handle the expected response shape (`{ content, action? }`), so no frontend changes are required.

## Technical Details

### System Prompt (summary)

The AI will be instructed that it is the "EXOS Guide" -- a procurement strategy assistant. It will know about the available scenario categories (analysis, planning, risk, documentation) and key scenarios like Volume Consolidation, Cost Breakdown, Make-or-Buy, etc. It will recommend scenarios based on the user's described challenge and use the `navigate` tool to direct them there.

### Tool Calling for Navigation

```typescript
tools: [{
  type: "function",
  function: {
    name: "navigate_to_scenario",
    description: "Navigate the user to a specific page",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "The route path" }
      },
      required: ["path"]
    }
  }
}]
```

When the model calls this tool, the edge function extracts the path and returns it as `action: { type: "NAVIGATE", payload: path }`.

### Files

| File | Action |
|------|--------|
| `supabase/functions/chat-copilot/index.ts` | Create |
| `supabase/config.toml` | Add function entry (auto-managed) |

