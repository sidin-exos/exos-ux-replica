

## Refactor and Secure EXOS Chatbot — Implementation Plan

### 1. Database Migration: Secure `chat_feedback` table

Add a `user_id` UUID column to `chat_feedback` and replace the permissive anonymous INSERT policy with an authenticated-only policy scoped to the user's own rows.

```sql
ALTER TABLE public.chat_feedback ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY "Anyone can submit chat feedback" ON public.chat_feedback;
CREATE POLICY "Authenticated users can insert own feedback"
  ON public.chat_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### 2. Edge Function: `supabase/functions/chat-copilot/index.ts`

**Auth:** Import `authenticateRequest` from `_shared/auth.ts`. Reject unauthenticated requests with 401.

**LangSmith:** Import `LangSmithTracer` from `_shared/langsmith.ts`. Create a parent run before the LLM call, patch it after with outputs/error.

**Dynamic prompt:** Remove the hardcoded 8-scenario list. Accept a `scenarios` array from the request body (`{id, title, description}[]`). Validate with `requireArray` (max 50 items). Inject into the system prompt as a formatted list grouped by category.

**Fix stale routes:** Replace `### FAQ (/faq)` with `### Pricing & FAQ (/pricing)` and note that FAQ is at `/pricing#faq` and contact at `/pricing#contact`.

**Payload validation:** Add `requireArray(body.scenarios, "scenarios", { optional: true, maxLength: 50 })` — optional so existing clients don't break, but the prompt will note "no scenarios provided" if missing.

### 3. Frontend: `src/lib/chat-service.ts`

Import `scenarios` from `@/lib/scenarios.ts`. Map to a lightweight array: `scenarios.filter(s => s.status === 'available').map(({ id, title, description }) => ({ id, title, description }))`. Include this as `scenarios` in the POST body alongside `messages` and `currentPath`.

The `supabase.functions.invoke` call already passes the authenticated user's JWT automatically via the Supabase client — no change needed there.

### 4. Frontend: `src/components/chat/ChatMessage.tsx`

Update the `handleFeedback` function to include `user_id` when inserting into `chat_feedback`. Get the current user via `supabase.auth.getUser()` or pass it as a prop. If the user is not authenticated, disable or hide the feedback buttons.

### 5. Frontend: `src/hooks/use-exos-chat.tsx`

No changes needed — it already delegates to `chat-service.ts` and the Supabase client handles auth headers.

---

### Files to edit
| File | Change |
|------|--------|
| Migration SQL | Add `user_id` to `chat_feedback`, replace INSERT policy |
| `supabase/functions/chat-copilot/index.ts` | Auth gate, LangSmith tracing, dynamic scenarios, fix routes |
| `src/lib/chat-service.ts` | Send scenarios array in payload |
| `src/components/chat/ChatMessage.tsx` | Pass `user_id` on feedback insert, gate on auth |

### Constraints respected
- No SSE/streaming
- No conversation persistence table
- Output signature `{ content, action? }` unchanged
- `ChatWidget.tsx` untouched

