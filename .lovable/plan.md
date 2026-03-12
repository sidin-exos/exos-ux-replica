

# Condense Analysis Parameters to Short Summaries

## Problem
The "Analysis Parameters" section in the PDF currently displays the full verbatim text provided by the user (e.g., entire paragraphs of industry context). It should instead show a condensed summary -- tags and/or a short description, max 30 words per parameter.

## Approach
Add a `summarizeParameter` utility function that truncates long parameter values into a concise summary (max 30 words). For structured data, extract key terms as tag-like chips. Apply this in both the client-side and server-side PDF renderers.

### Summarization logic
- If value is <= 30 words, keep as-is
- If value is > 30 words: extract key noun phrases / numbers / named entities, join as comma-separated tags, capped at 30 words
- Simple heuristic: split on sentences/commas, pick the most information-dense fragments (numbers, proper nouns, technical terms), reassemble

### Rendering change
- Replace the full `value` text with the summarized version
- Style as inline tags/chips (small rounded background blocks) when the result contains comma-separated items

## Files to Change

1. **`src/components/reports/pdf/PDFReportDocument.tsx`** (lines 1028-1037)
   - Add `summarizeParameter()` function
   - Update parameter rendering to use summarized values
   - Add tag-style chip rendering for comma-separated summaries

2. **`supabase/functions/generate-pdf/pdf-document.tsx`** (lines 859-869)
   - Mirror the same summarization logic and rendering

3. **`src/pages/PdfTestPage.tsx`**
   - Update `MOCK_FORM_DATA` to verify the condensed display works with long values

4. **Redeploy** `generate-pdf` edge function after changes

