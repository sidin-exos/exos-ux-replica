

# Add Google AI Studio API Key

## Overview

Store your **Google AI Studio API key** securely and update the sentinel-analysis edge function to support routing requests to the Google AI Generative Language API directly (BYOK mode).

---

## Step 1: Store the API Key

I'll request the secret using Lovable's secure secret storage:

| Secret Name | Purpose |
|-------------|---------|
| `GOOGLE_AI_STUDIO_KEY` | Your Google AI Studio API key for direct Gemini API access |

You'll be prompted to enter your API key from [Google AI Studio](https://aistudio.google.com/apikey).

---

## Step 2: Update Edge Function

**File:** `supabase/functions/sentinel-analysis/index.ts`

Add support for routing to Google AI Studio when a flag is set:

### Changes Summary

1. **Add new request parameters:**
   - `useGoogleAIStudio?: boolean` - Flag to use your BYOK key
   - `googleModel?: string` - Model name (e.g., `gemini-1.5-flash`, `gemini-1.5-pro`)

2. **Add Google AI Studio routing logic:**
   - Check for `GOOGLE_AI_STUDIO_KEY` secret
   - Call Google's Generative Language API directly
   - Parse response in Google's format

3. **API Endpoint:**
   ```
   https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
   ```

### Model Selection

| Edge Function Request | Routes To |
|-----------------------|-----------|
| Default (no flags) | Lovable AI Gateway (free tier) |
| `useGoogleAIStudio: true` | Your Google AI Studio key |
| `useLocalModel: true` | Future Mistral endpoint |

---

## Step 3: Update Client Hook

**File:** `src/hooks/useSentinel.ts`

Add optional parameter to use Google AI Studio:

```typescript
analyze(
  scenarioType,
  scenarioData,
  industry,
  category,
  config,
  model,
  useGoogleAIStudio // NEW: boolean flag
)
```

---

## Files to Modify

| File | Changes |
|------|---------|
| (Secret) | Add `GOOGLE_AI_STUDIO_KEY` via secure prompt |
| `supabase/functions/sentinel-analysis/index.ts` | Add Google AI Studio routing |
| `src/hooks/useSentinel.ts` | Add `useGoogleAIStudio` parameter |

---

## Usage After Implementation

```typescript
// Use Lovable AI (default - no cost to you)
await analyze(scenarioType, scenarioData, industry, category);

// Use your Google AI Studio key (BYOK)
await analyze(scenarioType, scenarioData, industry, category, config, "gemini-1.5-pro", true);
```

---

## Security Notes

- API key stored as encrypted Supabase secret
- Never exposed to client-side code
- Edge function validates key exists before attempting call
- Falls back to Lovable AI if key not configured

