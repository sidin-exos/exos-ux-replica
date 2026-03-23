

## Add "Leave Feedback" Button & Dialog

### Changes to `src/components/scenarios/GenericScenarioWizard.tsx`

**1. New imports**
- Add `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription` from `@/components/ui/dialog`
- `MessageSquare` is already imported (line 5)
- `Star` from `lucide-react` for rating display

**2. New state variables** (after existing state ~line 140)
- `feedbackDialogOpen: boolean` (default `false`)
- `feedbackRating: number` (default `0`)
- `feedbackText: string` (default `""`)
- `isSubmittingFeedback: boolean` (default `false`)

**3. Submission handler**
```typescript
const handleFeedbackSubmit = async () => {
  setIsSubmittingFeedback(true);
  const { error } = await supabase.from('scenario_feedback').insert({
    scenario_id: scenario.id,
    rating: feedbackRating,
    feedback_text: feedbackText || null
  });
  setIsSubmittingFeedback(false);
  if (error) {
    toast.error("Failed to submit feedback");
  } else {
    toast.success("Thank you for your feedback!");
    setFeedbackDialogOpen(false);
    setFeedbackRating(0);
    setFeedbackText("");
  }
};
```

**4. Button layout** (line 873)
Wrap existing "Review Data" button in a flex container and add the feedback button:
```tsx
<div className="flex items-center justify-end gap-3">
  <Button variant="outline" size="default" onClick={() => setFeedbackDialogOpen(true)}>
    <MessageSquare className="w-4 h-4 mr-2" />
    Leave Feedback
  </Button>
  <Button variant="hero" size="lg" onClick={() => setStep("review")} className="gap-2">
    Review Data <ArrowRight className="w-4 h-4" />
  </Button>
</div>
```

**5. Dialog** (at bottom of component, before closing tags)
- 1-10 rating scale: row of 10 numbered square buttons, highlighted when selected (same pattern as `OutputFeedback.tsx` line ~120)
- Optional textarea for comments
- Submit button disabled when `feedbackRating === 0` or `isSubmittingFeedback`
- On success: toast, close dialog, reset state

### No database changes needed
The `scenario_feedback` table already has `scenario_id` (text), `rating` (integer), `feedback_text` (text) columns with an `anyone_can_submit` INSERT policy.

### Technical details
- Rating scale is 1-10 to match existing Analytics Dashboard satisfaction calculation (ratings >= 7)
- `scenario.id` is a string matching the table's `scenario_id text` column
- The button uses `variant="outline"` + `size="default"` for lower visual priority vs the hero "Review Data" button

