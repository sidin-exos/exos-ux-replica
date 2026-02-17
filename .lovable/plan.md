

## Bug Fixes: Chat Auto-Scroll and Published Version Connection Error

### Bug 1: Auto-Scrolling Prevents Watching Answer Generation

**Root Cause:** The typewriter effect in `ChatMessage.tsx` calls `onTextReveal` (which triggers `scrollToBottom`) on every single character (every 12ms). Since the chat panel is only 420px tall, `isNearBottom()` almost always returns `true`, so every character typed forces a scroll — the user can never scroll up to observe generation happening.

**Fix:** Remove the `onTextReveal` callback from the typewriter loop. Instead, only auto-scroll when a new message is added (already handled by the `useEffect` on `messages.length`). The user will be able to scroll freely during generation, and the scroll will only snap when new messages appear.

**Files changed:**
- `src/components/chat/ChatMessage.tsx` — Remove `onTextReveal?.()` call from the typewriter interval
- `src/components/chat/ChatWidget.tsx` — Remove the `onTextReveal` prop from `ChatMessage` usage

---

### Bug 2: Published Version Returns "Trouble Connecting"

**Root Cause:** The `chat-copilot` edge function calls `authenticateRequest()` which validates a JWT user token. When a user is not logged in, `supabase.functions.invoke()` sends only the anon key as the Bearer token. `getClaims()` fails on this non-user token, returning a 401 error. This causes `supabase.functions.invoke` to surface an error on the client, which triggers the fallback "trouble connecting" message.

This likely works in preview because you happen to be logged in there, but on the published site you (or visitors) are not authenticated.

The EXOS Guide chatbot is a public-facing onboarding tool — it should not require authentication.

**Fix:** Remove the `authenticateRequest` gate from the `chat-copilot` edge function so it works for all visitors. The function already has `verify_jwt = false` in config.toml, confirming the intent for public access.

**Files changed:**
- `supabase/functions/chat-copilot/index.ts` — Remove `authenticateRequest` import and auth check block (lines 2, 85-91)

---

### Technical Details

```text
Files Modified: 3

1. src/components/chat/ChatMessage.tsx
   - Remove onTextReveal?.() call from typewriter setInterval (line ~101)

2. src/components/chat/ChatWidget.tsx
   - Remove onTextReveal={scrollToBottom} prop from ChatMessage (line ~161)

3. supabase/functions/chat-copilot/index.ts
   - Remove authenticateRequest import (line 2)
   - Remove auth validation block (lines 85-91)
```

