

# Add Feedback & Copy Actions to Chat Messages

## Summary

Add two action buttons below each assistant message in the EXOS Guide chat:
1. **Thumbs Up / Thumbs Down** -- collects feedback, stored in a new `chat_feedback` database table for analysis
2. **Copy** -- copies the message text to clipboard with a brief confirmation

## Changes

### 1. Database: Create `chat_feedback` table

```sql
CREATE TABLE public.chat_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text NOT NULL,
  conversation_messages jsonb, -- last few messages for context
  rating text NOT NULL CHECK (rating IN ('helpful', 'not_helpful')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;

-- Public insert (no auth required, chatbot is anonymous)
CREATE POLICY "Anyone can submit chat feedback"
  ON public.chat_feedback FOR INSERT
  WITH CHECK (true);

-- No SELECT/UPDATE/DELETE for public -- admin-only via service role
```

### 2. `src/components/chat/ChatMessage.tsx` -- Add action buttons

Below each **assistant** message bubble (after the timestamp), add a small action row:

- **ThumbsUp** and **ThumbsDown** icons (from lucide-react), small and subtle
- **Copy** icon -- copies `message.content` to clipboard, shows a brief checkmark
- Buttons only appear on assistant messages, not user messages
- Once feedback is submitted, the selected thumb highlights and both become disabled
- Feedback is sent to the `chat_feedback` table via Supabase client

### 3. `src/hooks/use-exos-chat.tsx` -- No changes needed

The existing Message interface already has `id` which we'll use as `message_id` in the feedback table.

## Visual Layout

```text
[Bot icon] [Message bubble                    ]
           10:32 AM
           [thumbs-up] [thumbs-down] [copy]
```

- Icons are 14px, muted color, with hover highlight
- After clicking thumbs-up/down: selected icon gets primary color, toast confirms "Thanks for your feedback!"
- After clicking copy: icon briefly becomes a checkmark, toast confirms "Copied to clipboard"

## Files Modified

| File | Action |
|------|--------|
| Migration SQL | Create `chat_feedback` table |
| `src/components/chat/ChatMessage.tsx` | Add feedback + copy buttons below assistant messages |

