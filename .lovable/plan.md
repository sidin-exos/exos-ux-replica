

# Fix: Anonymized Placeholders in Reports & Missing Dashboard Data

## Root Cause

The `sentinel-analysis` edge function has a deanonymization bug in both the single-pass and multi-cycle code paths:

1. **`structured` envelope is never deanonymized** — `parseAIResponse()` is called on the anonymized `content`, so the returned `structured` JSON still contains `[SUPPLIER_G]`, `[CONTRACT_REF_B]`, etc. The client stores this as `structuredData` and the dashboard parser reads it — but all text fields have anonymization tokens.

2. **Markdown `content` is re-anonymized** — When a valid envelope is found, `responseContent` is overwritten by `buildMarkdownFromEnvelope(parsedEnvelope)` which pulls text from the still-anonymized envelope. This overwrites the correctly deanonymized `singleDeanon.restoredText` / `multiDeanon.restoredText`.

3. **Dashboard shows "Sample data"** — Because the structured envelope has anonymization tokens in field values, the parser may fail to match expected fields or return nulls, causing the fallback banner.

## Fix (1 file)

### `supabase/functions/sentinel-analysis/index.ts`

In both code paths (multi-cycle ~line 939 and single-pass ~line 1048):

**Before:**
```
const parsedEnvelope = parseAIResponse(content);        // anonymized
let responseContent = deanon.restoredText;               // deanonymized
if (parsedEnvelope?.schema_version === '1.0') {
  responseContent = buildMarkdownFromEnvelope(parsedEnvelope);  // overwrites with anonymized!
}
// returns structured: parsedEnvelope (anonymized)
```

**After:**
```
const parsedEnvelope = parseAIResponse(content);         // anonymized
let responseContent = deanon.restoredText;               // deanonymized ✓
if (parsedEnvelope?.schema_version === '1.0') {
  // Deanonymize the envelope itself
  const envelopeStr = JSON.stringify(parsedEnvelope);
  const deanonEnvelope = deanonymizeText(envelopeStr, anonymizationResult.entityMap);
  const deanonParsedEnvelope = JSON.parse(deanonEnvelope.restoredText);
  responseContent = buildMarkdownFromEnvelope(deanonParsedEnvelope);  // deanonymized ✓
  // Use deanonParsedEnvelope as the structured response
}
// returns structured: deanonParsedEnvelope (deanonymized ✓)
```

Apply this fix to both:
- Multi-cycle path (around lines 939-952)
- Single-pass path (around lines 1048-1055)

Then redeploy `sentinel-analysis`.

## What This Fixes

- Report text will no longer show `[SUPPLIER_G]`, `[CONTRACT_REF_B]` etc.
- Dashboard parser will receive real supplier names, enabling proper data extraction
- Negotiation Prep dashboard should populate with real data instead of showing "Sample data"

