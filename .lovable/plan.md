

## New Scenario: Contract Template Generator

### Summary

Add a new "Contract Template Generator" scenario that fits into the existing GenericScenarioWizard and Sentinel pipeline. No new components, no new edge functions. The tier system influences prompt depth via a simple select field. Post-generation refinement uses the existing EXOS Guide chat.

### Design Decisions

**Reuse Sentinel pipeline**: This scenario flows through the standard sentinel-analysis edge function like RFP Generator and 20+ other scenarios. The AI behavior (rolling wave structure, anti-hallucination, country-specific clauses) is driven entirely by the system prompt, not by new code.

**Tiers as prompt depth lever**: The 3 tiers ("Quick Draft", "Standard", "Thorough") are a select field. The value is passed to the AI as part of scenarioData, and the system prompt interprets it to control output depth:
- Quick: High-level clause structure, minimal commentary (~3 sections)
- Standard: Full clause drafting with explanations (~5-6 sections)  
- Thorough: Detailed clauses + risk flags + alternative language + country-specific annotations (~7+ sections)

**EU-only (27 countries)**: Country select restricted to EU member states. The AI prompt enforces country-specific legal conventions.

**Anti-hallucination**: Handled via existing Sentinel pipeline settings (temperature 0.2) plus scenario-specific prompt instructions: no fabricated legal citations, mandatory `[REVIEW WITH LEGAL COUNSEL]` flags on uncertain clauses, prominent disclaimer in outputs.

**No new edge function**: Standard Sentinel pipeline handles everything. The scenario's intelligence comes from the prompt template built server-side.

### Changes: 4 Files Modified

**1. `src/lib/scenarios.ts` -- Add scenario definition**

Add `ScrollText` to lucide imports. Add new scenario object before the closing bracket:

```text
id: "contract-template"
title: "Contract Template Generator"
description: "Generate country-specific contract templates for EU procurement.
  Select your time investment tier and EXOS produces a structured template
  with clause-by-clause guidance. Not legal advice — a professional starting point."
icon: ScrollText
category: "documentation"
status: "available"
strategySelector: undefined (no strategy selector)

Fields:
  - industryContext (textarea, required: false) -- auto-injected
  - mainFocus (shared MAIN_FOCUS_FIELD)
  - country (select, required: true)
    Label: "Applicable Country (EU)"
    Options: Austria, Belgium, Bulgaria, Croatia, Cyprus, Czech Republic,
      Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Ireland,
      Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland,
      Portugal, Romania, Slovakia, Slovenia, Spain, Sweden
  - timeTier (select, required: true)
    Label: "Time Investment / Detail Level"
    Description: "How much detail do you need? Quick = high-level structure
      (~15 min review). Standard = full clauses with guidance (~30-45 min).
      Thorough = detailed clauses + risk flags + alternative wording (~1h+)."
    Options:
      "Quick Draft (3 feedback sections, ~15 min review)"
      "Standard (5-6 feedback sections, ~30-45 min review)"
      "Thorough (7+ feedback sections, ~1 hour+ review)"
  - contractBrief (textarea, required: true)
    Label: "Contract Brief"
    Description: "Describe the contract you need. Include parties, subject,
      approximate value, duration, and any special terms. Paste raw notes
      or an email — EXOS will extract structure automatically."
    Placeholder: realistic example
  - contractType (select, required: true)
    Label: "Contract Type"
    Options:
      "Service Agreement"
      "Supply / Purchase Agreement"
      "Framework Agreement"
      "Non-Disclosure Agreement (NDA)"
      "Consulting / Professional Services"
      "Maintenance & Support Agreement"
  - contractValue (text, required: false)
    Label: "Approximate Contract Value"
    Description: "Optional. Helps calibrate clause complexity and risk provisions."
  - specialRequirements (textarea, required: false)
    Label: "Special Requirements or Constraints"
    Description: "E.g., GDPR data processing clauses, sustainability provisions,
      specific payment milestones, IP ownership terms."

Outputs:
  - "Legal Disclaimer & Scope Statement"
  - "Contract Structure Overview (Clause Map)"
  - "Drafted Contract Template (Country-Specific)"
  - "Clause-by-Clause Guidance & Risk Flags [REVIEW WITH LEGAL COUNSEL]"
  - "Recommended Next Steps & Legal Review Checklist"
```

**2. `src/lib/dashboard-mappings.ts` -- Add mapping**

```text
"contract-template": ["action-checklist", "timeline-roadmap", "data-quality"]
```

- Action checklist: legal review tasks and next steps
- Timeline roadmap: contract lifecycle milestones
- Data quality: completeness of input vs. generated clauses

**3. `src/lib/test-data-factory.ts` -- Add generator**

New generator producing:
- Random EU country
- Random tier selection
- Realistic contract brief (service agreement for IT support, supply agreement for packaging materials, etc.)
- Random contract type
- Optional contract value
- Optional special requirements

**4. `supabase/functions/generate-test-data/index.ts` -- Add field list**

```text
"contract-template": [
  "industryContext", "mainFocus", "country", "timeTier",
  "contractBrief", "contractType", "contractValue", "specialRequirements"
]
```

### AI Behavior (Prompt-Driven, No Code Changes)

The Sentinel pipeline's server-side prompt builder will receive the scenario data and construct the system prompt. The key behavioral instructions embedded in the scenario fields and outputs:

1. **Country enforcement**: "Generate a {contractType} template compliant with {country} commercial law. Reference well-known statutes (e.g., BGB for Germany, Code Civil for France). Do NOT fabricate legal citations."

2. **Tier-based depth**: The `timeTier` value controls how many sections and how much detail the AI produces. Quick = structure + key clauses only. Thorough = every clause + risk commentary + alternative language.

3. **Anti-hallucination**: 
   - Temperature 0.2 (existing Sentinel config)
   - Mandatory `[REVIEW WITH LEGAL COUNSEL]` markers on uncertain clauses
   - Output begins with legal disclaimer
   - No invented statutes or case law references

4. **Raw brief extraction**: Same pattern as RFP Generator — AI parses the `contractBrief` textarea to extract parties, subject, value, duration, and special terms.

5. **SMB-friendly tone**: Practical language, explains legal concepts in plain terms, flags what's truly critical vs. nice-to-have.

### What This Does NOT Include

- No new edge function (uses Sentinel pipeline)
- No new component (uses GenericScenarioWizard)
- No database changes
- No multi-turn conversation (future iteration via EXOS Guide chat)
- No non-EU countries (first edition)
- No PDF contract export (uses existing report infrastructure)

### Technical Details

```text
Files Modified: 4

1. src/lib/scenarios.ts
   - Add ScrollText import
   - Add contract-template scenario object
   - Fields: 8 (3 required + mainFocus + 4 optional)

2. src/lib/dashboard-mappings.ts
   - Add "contract-template" mapping

3. src/lib/test-data-factory.ts
   - Add contract-template generator function

4. supabase/functions/generate-test-data/index.ts
   - Add contract-template field list

No new files created.
No routing changes needed (GenericScenarioWizard handles all scenarios).
Standard Sentinel pipeline used.
```

