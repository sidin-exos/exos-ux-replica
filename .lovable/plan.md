

## Connect Gemini API to Inflation Wizard

### 1. Update Edge Function — `supabase/functions/im-driver-propose/index.ts`

- Import `callGoogleAI` from `../_shared/google-ai.ts`
- Replace the hardcoded `mockDrivers` array with a Gemini call using tool calling
- System prompt: procurement inflation analyst for EU mid-market, propose exactly N drivers
- Tool schema: `propose_drivers` with `drivers: [{name: STRING, rationale: STRING}]`
- Parse `functionCall.args.drivers` from the response
- Fallback: if AI call fails, return the old hardcoded drivers with `source: "fallback"` flag
- Keep existing CORS, JWT auth, input validation unchanged

### 2. Update Frontend — `src/components/enterprise/InflationSetupWizard.tsx`

- Remove the `MOCK_DRIVERS` constant
- Make `handleGoodsNext` async — call `supabase.functions.invoke('im-driver-propose', { body: { goods_definition, driver_count_target: 5 } })`
- Add `isAnalyzing` loading state with spinner and "Analyzing price drivers..." text
- Handle errors: show toast, allow retry
- Map response `drivers` array into `WizardDriver[]` objects
- Add `supabase` import from `@/integrations/supabase/client`

### 3. Deploy & Test

- Deploy the updated edge function
- Verify with a test invocation

### Technical Notes
- Uses existing `GOOGLE_AI_STUDIO_KEY` secret (already configured)
- Uses the shared `callGoogleAI` helper which defaults to `gemini-3.1-pro-preview`
- No database changes needed

