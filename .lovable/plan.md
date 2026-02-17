

## Display Buyer Persona in Drafted Test Case Card

### Problem
The buyer persona system was added to the edge function's `generate` mode, but:
1. The **draft mode** (`handleDraftMode`) doesn't select or return a persona
2. The `DraftedParameters` **type** has no `persona` field
3. The `DraftedParametersCard` **UI** doesn't display it
4. The persona is only used internally during generation -- the user never sees which persona was selected

### Solution (3 files)

---

#### File 1: `supabase/functions/generate-test-data/index.ts`

**Add persona selection to `handleDraftMode`** (around line 864):

- Call `selectPersona()` at the start of draft mode
- Include `persona` (id) and `personaName` in the returned `parameters` object
- No prompt change needed -- persona is just metadata at draft stage; it gets injected into the AI prompt during the subsequent generate call

```typescript
// In handleDraftMode, after line 872:
const persona = selectPersona(); // random selection

// In the return object (line 934), add persona fields:
parsed.persona = persona.id;
parsed.personaName = persona.name;
```

---

#### File 2: `src/lib/drafted-parameters.ts`

**Add persona fields to the `DraftedParameters` interface**:

```typescript
export interface DraftedParameters {
  // ... existing fields ...
  persona?: string;        // e.g. "rushed-junior"
  personaName?: string;    // e.g. "The Rushed Junior Buyer"
}
```

Add persona labels to `PARAMETER_LABELS`:

```typescript
persona: {
  "rushed-junior": "Rushed Junior Buyer",
  "methodical-manager": "Methodical Category Manager",
  "cfo-finance": "CFO / Finance Leader",
  "frustrated-stakeholder": "Frustrated Stakeholder",
},
```

---

#### File 3: `src/components/scenarios/DraftedParametersCard.tsx`

**Add a "Persona" row** to the parameter grid, displayed between "Data Quality" and the Training Focus section. Show a User icon with the persona name. When in edit mode, allow selecting a different persona from the dropdown.

New row (after the Data Quality row, around line 173):

```
Persona:    The Rushed Junior Buyer
```

Uses the same `ParameterRow` + `ParamSelect` pattern as existing fields.

---

### Impact
- Users will see which buyer persona the AI will simulate when generating test data
- Users can override the persona in edit mode before approving
- The selected persona flows through to the generate call (already handled -- `generateWithParameters` passes `parameters` to the edge function which reads `parameters.persona`)

### No structural/DB changes needed

