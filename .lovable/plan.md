

## Add Feedback Type Selector to Scenario Feedback Dialog

### Summary
Add a feedback type/category selector to the existing feedback dialog in `GenericScenarioWizard.tsx`. The 7 types (excluding "Documentation Gap" per user request) will be stored in a new `feedback_type` column on the `scenario_feedback` table.

### Feedback Types
1. **Bug Report** -- Something is broken or not working
2. **Feature Suggestion** -- Ideas for new functionality
3. **Usability Issue** -- Confusing layout or poor UX flow
4. **Data Quality** -- Inaccurate results or wrong calculations
5. **Performance** -- Slow loading, timeouts, or lag
6. **Visual/Design** -- Styling, contrast, or layout problems
7. **Other** -- Anything else

### Database Change
Add a nullable `feedback_type text` column to `scenario_feedback`:
```sql
ALTER TABLE scenario_feedback ADD COLUMN feedback_type text;
```
Nullable so existing rows are unaffected.

### UI Changes (`GenericScenarioWizard.tsx`)
1. Add `feedbackType` state variable (default `""`)
2. Insert a feedback type selector between the rating scale and the textarea -- a grid of pill/chip buttons (similar to the rating scale pattern), each showing an icon + label
3. Update `handleFeedbackSubmit` to include `feedback_type: feedbackType || null` in the insert
4. Reset `feedbackType` on dialog close

### Technical Details
- Icons from lucide-react: `Bug`, `Lightbulb`, `MousePointerClick`, `Database`, `Gauge`, `Palette`, `HelpCircle`
- Chips use same styling pattern as rating buttons (outline when unselected, primary when selected)
- Feedback type is optional -- user can submit without selecting one
- Grid layout: `grid grid-cols-2 gap-2` to fit cleanly in the dialog

