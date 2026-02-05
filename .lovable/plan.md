
# AI Model Configuration Panel

## Overview

Create an admin settings panel that allows internal users to configure the AI provider used by the Sentinel analysis pipeline. This integrates with the existing BYOK (Bring Your Own Key) Google AI Studio backend support already implemented in `sentinel-analysis`.

---

## Architecture

### State Management: React Context + localStorage

Create a `ModelConfigContext` that:
- Wraps the app and provides `useModelConfig()` hook
- Persists to `localStorage` under key `exos_model_config`
- Syncs automatically on changes
- Provides type-safe access to provider/model settings

### Config Structure

```typescript
interface ModelConfig {
  provider: "lovable" | "google_ai_studio";
  model: string; // e.g., "gemini-2.0-flash"
  lastTested: string | null; // ISO timestamp
}
```

---

## Files to Create

### 1. Model Configuration Context
**File:** `src/contexts/ModelConfigContext.tsx`

| Export | Purpose |
|--------|---------|
| `ModelConfigProvider` | Context provider wrapping app |
| `useModelConfig()` | Hook to read/update config |
| `ModelConfig` type | Type definition for settings |

**Key Functions:**
- `setProvider(provider)` - Switch between lovable/google_ai_studio
- `setModel(model)` - Set the Google AI model variant
- `markTested()` - Record successful connection test

### 2. Settings Panel Component
**File:** `src/components/settings/ModelConfigPanel.tsx`

**UI Layout:**
```text
+------------------------------------------+
|  AI Model Configuration                  |
+------------------------------------------+
|                                          |
|  Provider                                |
|  ( ) Managed (Lovable Gateway)           |
|      Free tier, no setup required        |
|                                          |
|  ( ) Custom (Google AI Studio)           |
|      Uses your BYOK API key              |
|                                          |
|  [Visible when Custom selected:]         |
|  +--------------------------------------+|
|  | Model                                ||
|  | [Gemini 2.0 Flash           v]       ||
|  +--------------------------------------+|
|                                          |
|  [Test Connection]  Status: Not tested   |
|                                          |
+------------------------------------------+
```

**Model Options for Google AI Studio:**
| Value | Label | Description |
|-------|-------|-------------|
| `gemini-1.5-pro` | Gemini 1.5 Pro | Reasoning Powerhouse |
| `gemini-1.5-flash` | Gemini 1.5 Flash | Speed/Cost efficiency |
| `gemini-2.0-flash` | Gemini 2.0 Flash | Latest generation |
| `gemini-2.5-flash` | Gemini 2.5 Flash | Newest experimental |

---

## Files to Modify

### 1. App.tsx
Wrap the app with `ModelConfigProvider` at the top level:

```typescript
import { ModelConfigProvider } from "@/contexts/ModelConfigContext";

const App = () => (
  <ModelConfigProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        ...
      </TooltipProvider>
    </QueryClientProvider>
  </ModelConfigProvider>
);
```

### 2. GenericScenarioWizard.tsx (lines 223-230)

Update `handleAnalyze()` to read from context and pass BYOK flags:

**Current code:**
```typescript
const result = await analyze(
  scenario.id,
  enrichedData,
  industryContext || null,
  categoryContext || null,
  undefined,
  selectedModel
);
```

**Updated code:**
```typescript
const { provider, model: configModel } = useModelConfig();
const useGoogleAIStudio = provider === "google_ai_studio";
const effectiveModel = useGoogleAIStudio ? configModel : selectedModel;

const result = await analyze(
  scenario.id,
  enrichedData,
  industryContext || null,
  categoryContext || null,
  undefined,
  effectiveModel,
  useGoogleAIStudio
);
```

### 3. Account.tsx
Add the `ModelConfigPanel` as a new settings section, visible only to internal users:

```typescript
import { ModelConfigPanel } from "@/components/settings/ModelConfigPanel";
import { useShareableMode } from "@/hooks/useShareableMode";

// Inside component:
const { showTechnicalDetails } = useShareableMode();

// In JSX, after subscription section:
{showTechnicalDetails && (
  <ModelConfigPanel />
)}
```

---

## Test Connection Flow

1. User clicks "Test Connection" button
2. Button shows loading spinner, disables interaction
3. Call `sentinel-analysis` with minimal payload:

```typescript
const { data, error } = await supabase.functions.invoke("sentinel-analysis", {
  body: {
    systemPrompt: "Respond with exactly: OK",
    userPrompt: "Connection test",
    useGoogleAIStudio: true,
    googleModel: selectedModel,
    enableTestLogging: false,
  },
});
```

4. **On success:** 
   - Show success toast with model name
   - Update `lastTested` timestamp in context
   - Display "Last tested: X minutes ago"

5. **On error:**
   - Show error toast with specific message
   - Common errors: "API key not configured", "Invalid model", "Rate limit"
   - Keep button enabled for retry

---

## Integration Summary

| Component | Role |
|-----------|------|
| `ModelConfigContext` | Global state + localStorage persistence |
| `ModelConfigPanel` | Admin UI in Account page |
| `GenericScenarioWizard` | Reads config, passes flags to analyze() |
| `useSentinel` | Already accepts `useGoogleAIStudio` flag |
| `sentinel-analysis` | Already handles BYOK routing logic |

---

## Visibility Rules

The `ModelConfigPanel` will only render when:
- `useShareableMode().showTechnicalDetails === true`

This ensures external users viewing shared links never see admin settings.

---

## Default Behavior

| Setting | Default Value |
|---------|---------------|
| Provider | `"lovable"` (free managed gateway) |
| Model | `"gemini-2.0-flash"` |
| Last Tested | `null` |

When provider is "lovable", the existing `ModelSelector` in GenericScenarioWizard continues to work as before (selecting Lovable AI Gateway models).

---

## localStorage Key

```
exos_model_config
```

Example stored value:
```json
{
  "provider": "google_ai_studio",
  "model": "gemini-2.0-flash",
  "lastTested": "2026-02-05T10:30:00.000Z"
}
```
