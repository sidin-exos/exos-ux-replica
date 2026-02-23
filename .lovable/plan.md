

# Fix CRITICAL #4 and #5: Persist Feedback + Fix Header Icons

## Issue #4: Persist Scenario Feedback

### Problem
`handleFeedbackSubmit` in `GenericScenarioWizard.tsx` only does `console.log`. No data reaches the database.

### Complication
The existing `chat_feedback` table is designed for chat message ratings (columns: `message_id`, `rating`, `conversation_messages`). It does NOT fit scenario feedback which needs `scenario_id`, a numeric rating, and free-text feedback. Reusing it would require hacking unrelated data into mismatched columns.

### Solution: New `scenario_feedback` table

**Migration SQL:**
```sql
CREATE TABLE public.scenario_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id text NOT NULL,
  rating integer NOT NULL,
  feedback_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scenario_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback (no auth required, same pattern as chat_feedback)
CREATE POLICY "Anyone can submit scenario feedback"
  ON public.scenario_feedback FOR INSERT
  WITH CHECK (true);

-- Only admins can read feedback
CREATE POLICY "Admins can read scenario feedback"
  ON public.scenario_feedback FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
```

**Code change in `GenericScenarioWizard.tsx` (line 346-349):**

Replace the console.log stub with:
```typescript
const handleFeedbackSubmit = async (rating: number, feedback: string) => {
  try {
    const { error } = await supabase.from("scenario_feedback").insert({
      scenario_id: scenario.id,
      rating,
      feedback_text: feedback || null,
    });
    if (error) throw error;
    toast.success("Thank you for your feedback!");
  } catch (err: any) {
    console.error("Feedback save failed:", err);
    toast.error("Could not save feedback. Please try again.");
  }
};
```

`toast` from sonner is already available in this component (used on lines 242, 340).

---

## Issue #5: Fix Dead Header Icons

**File:** `src/components/layout/Header.tsx`

### Changes:
1. **Remove the Bell/Notifications button entirely** -- no notification system exists, the fake red dot is misleading.
2. **Wire the Settings gear icon** to navigate to `/account` using `useNavigate` from react-router-dom.

### Technical Details

- Add `import { useNavigate } from "react-router-dom";`
- Add `const navigate = useNavigate();` inside the component
- Delete the Bell button block (lines 87-90)
- Add `onClick={() => navigate("/account")}` to the Settings button

---

## Summary of Changes

| File | Change |
|---|---|
| Migration (new) | Create `scenario_feedback` table with RLS |
| `GenericScenarioWizard.tsx` | Replace console.log with supabase insert + toasts |
| `Header.tsx` | Remove Bell button, wire Settings to `/account` |

No breaking changes. Both fixes are isolated, zero risk to existing functionality.
