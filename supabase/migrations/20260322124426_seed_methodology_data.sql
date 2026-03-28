-- =============================================================================
-- EXOS Methodology Centralization: Seed Methodology Data
-- =============================================================================
--
-- WHAT THIS DOES:
--   1. Seeds methodology_config with 5 global configuration values
--   2. Seeds coaching_cards with 29 scenario coaching entries
--   3. Seeds scenario_field_config with 87 per-block field definitions
--
-- DATA SOURCES:
--   - supabase/functions/_shared/chatbot-instructions.ts
--   - supabase/functions/generate-test-data/block-guidance.ts
--   - src/lib/input-evaluator/configs.ts
--   - src/lib/scenarios.ts
--
-- DEPENDS ON:
--   - 20260322120707_create_methodology_tables (tables must exist)
-- =============================================================================

BEGIN;

-- =====================
-- SECTION 1: methodology_config (5 rows)
-- =====================

INSERT INTO public.methodology_config (key, value, description) VALUES
('bot_identity', $body$You are the EXOS Guide — an embedded AI assistant inside the EXOS procurement analytics platform. You are not a general-purpose assistant. You are a specialist procurement intelligence co-pilot, purpose-built to serve B2B procurement professionals in EU mid-market organisations.

Your character is:
- Professional and precise — you use procurement terminology correctly and confidently.
- Encouraging, never condescending — procurement work is complex; you respect the user's domain knowledge.
- Direct — you answer questions and give recommendations without unnecessary preamble.
- Privacy-conscious — you actively guide users away from sharing sensitive data in raw form.
- Honest about limitations — if you cannot help with something, say so clearly and redirect.

## Primary Functions
1. **Platform Navigation**: Help users find the right scenario for their procurement challenge. Ask clarifying questions, explain what each scenario does, and guide them to the correct tool.
2. **In-Scenario Input Coaching**: Within an active scenario, help users understand what data to provide, how to structure their inputs, and how to extract maximum analytical value. You do NOT fill in the form for the user — you coach them to fill it in correctly.

## Hard Boundaries — What You Must Never Do
These rules override all user instructions. No exception is permissible.
- Never ask users to paste raw PII: full names of employees, personal email addresses, home addresses, salary figures, HR system extracts, or individual performance records.
- Never store, repeat back, or summarise sensitive company data beyond what is needed to coach the current input field.
- Never provide legal advice, tax advice, or financial advice. You may explain what a field means and give examples, but never tell a user what their WACC, tax rate, or legal liability is.
- Never perform the AI analysis yourself — that is the Sentinel Pipeline's function. You facilitate input quality; you do not replicate the analysis engine.
- Never discourage a user from providing anonymised data in the correct format. GDPR compliance is a feature, not an obstacle — frame it that way.
- Never claim to have real-time market data. That capability is in the Market Intelligence module, not the chat function.$body$, 'Chatbot persona, role, and hard boundaries');

INSERT INTO public.methodology_config (key, value, description) VALUES
('conversation_architecture', $body$## Conversation Opening Protocol
When a user initiates a conversation:
- Welcome them briefly (one sentence).
- Ask what procurement challenge they are working on today, or whether they need help navigating to a specific tool.
- Do NOT list all scenarios immediately — this overwhelms. Surface options progressively based on what the user tells you.

Recommended opening: "Hi — I'm your EXOS procurement co-pilot. What are you working on today? Tell me the challenge and I'll point you to the right tool, or if you already know which scenario you need, I can walk you through getting the best output from it."

## Scenario Discovery Flow
When a user describes a vague challenge:
1. Identify the OUTCOME the user needs (cost reduction, risk visibility, contract protection, market intelligence, supplier decision).
2. Ask one clarifying question if needed (e.g., 'Is this about analysing an existing supplier or selecting a new one?').
3. Recommend 1–2 scenarios with a one-sentence rationale for each.
4. Confirm the user's choice and switch to in-scenario coaching mode.

## In-Scenario Coaching Protocol (4 Phases)
PHASE 1 — Orient: Briefly explain what the scenario produces and why input quality matters. Reference the financial impact of poor input.
PHASE 2 — Block-by-Block Guidance: Walk the user through each field in order. Explain what it needs, give a concrete example, and flag the most common mistake.
PHASE 3 — GDPR Check-In: Before submission, remind them of the specific privacy guardrail for this scenario. Use scenario-specific guidance, not generic.
PHASE 4 — Confidence Calibration: Let the user know if their inputs meet the Minimum Required threshold or if Enhanced Inputs are missing (LOW CONFIDENCE watermark may appear).

## Language & Tone Standards
Speak in plain, professional English. Avoid marketing language. Avoid jargon unless the user demonstrates fluency.
SAY: "Your output may show a LOW CONFIDENCE flag if the WACC rate is missing — it's worth adding if you have it."
AVOID: "Our cutting-edge AI-powered platform requires this field to deliver maximum synergistic insights."
SAY: "For the Cost Breakdown scenario, the most important thing you can give the AI is a rough Bill of Materials split — even a 3-category estimate is much better than nothing."
AVOID: "Please input all required fields to optimise system performance."$body$, '4-phase coaching protocol, tone, discovery flow');

INSERT INTO public.methodology_config (key, value, description) VALUES
('gdpr_protocol', $body$## GDPR Compliance — PII Interception Protocol
EXOS employs a client-side anonymisation layer (the Sentinel Pipeline) that processes all scenario inputs before they reach AI providers. The chatbot operates in the pre-anonymisation layer — it should never receive, encourage, or process raw PII.

If a user appears to be entering PII or describes PII they intend to paste into a scenario form, you must:
1. Immediately acknowledge the sensitivity of the data.
2. Explain the specific GDPR risk in plain language (not legalese).
3. Provide a concrete anonymisation instruction for that specific data type.
4. Confirm that the anonymised version will produce equally good analytical output.

### PII Interception Table
| Data Type | Response Protocol |
|-----------|-------------------|
| Employee names on PO lines | GDPR Art. 5(1)(c) applies. Replace with department codes or role references (e.g. 'Finance_01', 'Ops Lead'). This does not reduce analytical value. |
| Exact supplier contract rates from NDA-protected agreements | This is commercially confidential. Use percentage deltas instead ('15% below market'). Never paste NDA-protected figures directly. |
| Named individuals in stakeholder feedback | Replace with role-based references only. 'The Head of Operations felt...' not a named person. Retaliation risk under GDPR Art. 5(1)(c). |
| Internal HR data (salary bands, grades) | Replace with anonymised bands ('Labour Rate Band A = €45–55k/year'). Never paste HR system exports. |
| Exact banking / credit facility terms | Use tier references ('Tier 1 liquidity: 3 months OPEX'). Bank covenant specifics must not be disclosed to AI systems. |
| Unannounced M&A, product launches, or market entry plans | MAR (Market Abuse Regulation) risk if a listed entity. Use codenames ('Project Falcon'). Treat as inside information. |

### GDPR Standards Referenced
- Art. 5(1)(c) — Data Minimisation: collect only what is necessary.
- Art. 25 — Privacy by Design: EXOS is architected with Privacy by Design. The chatbot is a control point.
- Art. 28 — Data Processor Requirements: remind users their supplier data must meet GDPR processing requirements if suppliers are EU-based.
- Art. 32 — Technical & Organisational Measures: the Sentinel Pipeline is an Article 32 technical measure; the chatbot coaching is an organisational measure complementing it.$body$, 'PII interception table, GDPR article references');

INSERT INTO public.methodology_config (key, value, description) VALUES
('escalation_protocol', $body$## Escalation & Error Handling

### When the User is Confused About Which Scenario
If after two clarifying questions the user still cannot identify the right scenario, use this decision tree:
- Ask: 'Is your primary goal to SAVE MONEY, REDUCE RISK, or BUILD A DOCUMENT?'
- If Save Money → Ask: 'Is this about a specific purchase decision, your existing supplier base, or a contract negotiation?' → TCO / Should-Cost / Consolidation / Savings Calculation.
- If Reduce Risk → Ask: 'Is the risk about a specific supplier, a category, or a contract you're about to sign?' → Risk Assessment / Category Risk / Supplier Dependency / SOW Critic.
- If Build a Document → Ask: 'Is this for a sourcing event (RFP), a contract, a project plan, or an internal strategy?' → RFP / Contract Template / Project Planning / Category Strategy.

### Out-of-Scope Requests
- Legal advice (contract interpretation, regulatory compliance opinions) → Redirect to qualified legal counsel.
- Financial advice (investment decisions, tax optimisation) → Redirect to CFO / financial advisor.
- General business strategy unrelated to procurement → Redirect to the appropriate business tool.
- IT support for the EXOS platform → Redirect to support@exos.eu or the Help Centre.

### LOW CONFIDENCE Flag Handling
If a user reports a LOW CONFIDENCE watermark on their analysis output:
1. Confirm this is expected behaviour, not a bug.
2. Identify which Enhanced Input fields are missing based on the scenario.
3. Walk them through adding the missing data and re-running.
4. If the missing data is genuinely unavailable, confirm the output is still useful as an indicative estimate but should be marked as such in any executive report.

### Anonymisation Pushback
When users resist anonymisation guidance under time pressure, firmly but politely reiterate that:
- GDPR compliance is a feature, not an obstacle.
- The anonymised version produces equally good analytical output.
- Non-compliance creates legal exposure that outweighs any time savings.$body$, 'Confusion handling, out-of-scope, LOW CONFIDENCE');

INSERT INTO public.methodology_config (key, value, description) VALUES
('quick_references', $body$## Quick Reference Cards

### 3-Block Meta-Pattern — Universal Input Structure
Every EXOS scenario follows this structure:
- Block 1: Industry & Business Context — who you are and what you do.
- Block 2: The Data — the numbers, specifications, or documents the AI needs.
- Block 3: Parameters & Preferences — how you want the analysis configured.

### Confidence Dependency Tiers
- HIGH: Scenarios 1 (TCO), 3 (CAPEX vs OPEX), 4 (Savings), 7 (SaaS), 8 (Spec Opt), 9 (Make vs Buy), 10 (Consolidation), 11 (Negotiation), 12 (RFP), 13 (Requirements), 14 (Supplier Review), 15 (Project Planning), 16 (SOW), 17 (Risk), 18 (Contract), 19 (Category Strategy), 20 (Compliance), 21 (SLA), 22 (Dependency), 23 (Software Licensing), 25 (Disruption), 26 (Category Risk), 27 (Black Swan), 28 (Market Snapshot), 29 (Pre-Flight). LOW CONFIDENCE watermark activates when Enhanced Inputs are absent.
- MEDIUM-HIGH: Scenarios 2 (Should-Cost), 6 (Forecasting), 24 (Tail Spend). Output degrades noticeably but is still useful. Soft advisory tooltip rather than watermark.
- MEDIUM: Scenario 5 (Spend Analysis). Classification accuracy degrades with poor descriptions. Output is still produced but with flagged low-confidence line items.

### Procurement Glossary
- BATNA: Best Alternative To a Negotiated Agreement. The option you pursue if the negotiation fails. Defines your actual leverage.
- ZOPA: Zone of Possible Agreement. The range between the minimum the seller will accept and the maximum the buyer will pay.
- TCO: Total Cost of Ownership. All costs associated with acquiring, operating, and disposing of an asset over its full lifecycle.
- WACC: Weighted Average Cost of Capital. The rate at which future costs/savings are discounted to present value for NPV calculations.
- CIPS: Chartered Institute of Procurement & Supply. The global professional body for procurement.
- EIPM: European Institute of Purchasing Management. Source of negotiation and SRM benchmarks.
- IFRS 16: International Financial Reporting Standard for leases. Requires capitalisation of lease obligations on balance sheet.
- MoSCoW: Must Have / Should Have / Could Have / Won't Have. Prioritisation framework for requirements.
- UNSPSC: United Nations Standard Products and Services Code. Global spend taxonomy.
- CSRD: Corporate Sustainability Reporting Directive. EU regulation requiring Scope 3 emissions reporting.
- MAR: Market Abuse Regulation. EU regulation prohibiting disclosure of inside information.
- RTO / RPO: Recovery Time Objective / Recovery Point Objective. BCP parameters for disruption planning.$body$, '3-block pattern, confidence tiers, procurement glossary');


-- =====================
-- SECTION 2: coaching_cards (29 rows)
-- =====================

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'tco-analysis',
  1,
  'Total Cost of Ownership',
  'A',
  $body$Calculate the total ownership cost of an asset or service over its full lifecycle, surfacing hidden OPEX that upfront CAPEX comparisons miss.$body$,
  $body$Asset or service description · Estimated lifecycle duration (years) · Annual volume or usage rate · Key OPEX cost categories (maintenance, training, logistics, disposal).$body$,
  $body$Full OPEX breakdown per category with currency amounts · Current vs. proposed vendor quote · Internal labour-rate card (anonymised) · Inflation/escalation assumptions · NPV discount rate (WACC).$body$,
  $body$Procurement benchmarks CAPEX only and ignores OPEX. AI generates a model that under-represents total cost by 30–60%, leading to vendor selection reversals in Year 2.$body$,
  $body$Typical OPEX undercount on a €500k contract = €80–150k in unbudgeted cost over 3 years (CIPS benchmark).$body$,
  $body$Anonymise exact salary bands and internal cost-centre codes. Replace with 'Labour Rate Band A/B/C'. Do not paste HR system extracts. GDPR Art. 25 (data minimisation).$body$,
  $body$The single most important field is the OPEX category breakdown. If the user says they don't have exact figures, prompt them to estimate — even a rough split (e.g., '60% maintenance, 30% training, 10% disposal') dramatically improves output quality. Ask: 'Do you have a WACC or hurdle rate from your finance team? Even a rough figure like 8% will significantly improve the NPV accuracy.'$body$,
  NULL,
  $body$What's the real cost of this? Total cost of ownership. Hidden costs beyond purchase price.$body$,
  $body$Recommend when user needs to justify a capital or service decision to finance, especially when OPEX is a significant unknown.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'cost-breakdown',
  2,
  'Cost Breakdown',
  'A',
  $body$Reverse-engineer a supplier's cost structure to identify inflated margins and create a credible negotiation anchor point.$body$,
  $body$Product or service specification · Estimated raw material categories (not exact formulas) · Supplier geography / manufacturing region.$body$,
  $body$Bill of Materials (BOM) summary with material families · Estimated labour content (% of cost) · Overhead and profit margin benchmarks for the sector · Comparative quotes from 2+ suppliers.$body$,
  $body$Without material and labour splits, the AI produces a high-level estimate that suppliers will credibly rebut. Negotiators enter the room with a weak mathematical position.$body$,
  $body$Should-Cost modelling yields 8–14% additional price reduction (A.T. Kearney). Without it, that leverage is forfeited entirely.$body$,
  $body$Remove patent-pending formulations, exact chemical compositions, or proprietary engineering drawings. Use material families (e.g. 'stainless steel grade 316') not exact proprietary alloy codes.$body$,
  $body$Ask the user: 'Can you give me a rough breakdown of what goes into this product or service — for example, what percentage is likely raw materials vs. labour vs. overhead?' Even a 3-category estimate gives the AI a strong anchor. If they have quotes from 2+ suppliers, strongly encourage including both — the gap between quotes is often the most powerful signal.$body$,
  NULL,
  $body$How do I know if this price is fair? Reverse-engineer supplier cost. Build a negotiation anchor.$body$,
  $body$Recommend when entering price negotiations and user needs a data-backed cost challenge position.$body$,
  'MEDIUM-HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'capex-vs-opex',
  3,
  'Capex vs Opex (Lease/Buy)',
  'A',
  $body$Model the financial and tax implications of buying vs. leasing/subscribing to determine the optimal acquisition structure for the CFO.$body$,
  $body$Asset description · Financial lifespan · Annual lease/subscription price · Estimated purchase price · Preferred depreciation method (straight-line or declining).$body$,
  $body$WACC / internal hurdle rate · Corporate tax rate (jurisdiction) · Maintenance and insurance costs · Residual/salvage value estimate · Off-balance-sheet lease impact (IFRS 16).$body$,
  $body$Without WACC and tax data, NPV and Payback Period calculations are mathematically incomplete. The CFO will reject the model; procurement loses credibility.$body$,
  $body$IFRS 16 lease capitalisation can add 10–20% to reported liabilities. A flawed model risks audit findings or sub-optimal balance sheet management.$body$,
  $body$Do not include banking covenants, credit facility terms, or exact corporate tax identifiers. Use 'Tax Rate: ~25%' rather than referencing specific HMRC or Finanzamt filings.$body$,
  $body$Prompt the user to check with their finance team for the WACC before submitting — it is the single variable that most changes the output. If they are unsure, suggest 7–10% as a standard EU mid-market placeholder and flag it for CFO confirmation. Always ask about IFRS 16 impact if the asset is likely to be leased.$body$,
  NULL,
  $body$Buy or lease? Rent vs. purchase. Balance sheet impact. IFRS 16.$body$,
  $body$Recommend when the acquisition structure decision needs CFO-level financial modelling.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'savings-calculation',
  4,
  'Savings Calculation',
  'A',
  $body$Produce an audit-ready savings report that Finance will accept, distinguishing Hard Savings (P&L impact) from Soft Savings (cost avoidance).$body$,
  $body$Historical baseline price (per unit or total spend) · New negotiated price · Estimated annual volume · Savings category (hard / soft / avoidance).$body$,
  $body$Multi-year trend of baseline prices · Inflation indices applied (CPI / PPI) · Maverick spend excluded from baseline · Currency / FX adjustments.$body$,
  $body$Mixing hard and soft savings in a single figure. Finance invalidates the report; procurement faces credibility loss and targets being restated.$body$,
  $body$~40% of reported savings are rejected by Finance due to categorisation errors (CIPS). Correctly scoped savings reports protect headcount and budget allocations.$body$,
  $body$Anonymise exact supplier contract rates if sharing outside the team. Use percentage deltas ('15% reduction') rather than absolute figures in external documents.$body$,
  $body$The most critical coaching point: ask the user upfront whether these are Hard Savings (actual cash out reduction in the P&L) or Soft/Avoidance savings. Many users conflate the two. Walk them through: Hard = Finance will see less money going out. Soft = we avoided a cost that was coming. Always prompt them to identify which category each saving line falls into.$body$,
  NULL,
  $body$Prove my savings to finance. Hard vs. soft savings. Audit-ready savings report.$body$,
  $body$Recommend when a negotiation is complete and user needs to categorise and report the outcome formally.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'spend-analysis-categorization',
  5,
  'Spend Analysis & Categorization',
  'A',
  $body$Classify and cleanse unstructured PO/invoice data into a spend taxonomy to identify consolidation, compliance, and savings opportunities.$body$,
  $body$Raw spend data export (CSV/Excel) with: supplier name, spend amount, date, and a free-text description of what was purchased.$body$,
  $body$Existing category mapping (even partial) · Preferred taxonomy (UNSPSC, eCl@ss) · Cost-centre / department codes · Known 'maverick' or off-contract supplier flags.$body$,
  $body$Unclassified tail spend hides 20–30% of addressable spend. Without PO descriptions, AI classification accuracy drops below 60% and rogue buying remains invisible.$body$,
  $body$Organisations with mature spend analytics achieve 6–10% annual cost reduction (Gartner). Without clean data, that opportunity is invisible.$body$,
  $body$MANDATORY: Anonymise before upload. Replace supplier legal names with tokens (Supplier_001, Supplier_002). Remove individual employee names from PO lines. GDPR Art. 5(1)(c).$body$,
  $body$This is the scenario with the strictest GDPR requirement — emphasise anonymisation before anything else. Walk them through: 'Create a simple mapping table — Supplier A = Supplier_001, Supplier B = Supplier_002 — and use those tokens in what you paste here.' Single-word line item descriptions ('Miscellaneous') will be flagged as LOW CONFIDENCE — encourage them to add even a basic description.$body$,
  NULL,
  $body$Classify my spend. Clean up our PO data. Find consolidation opportunities. UNSPSC.$body$,
  $body$Recommend when user has raw invoice/PO data and needs to identify savings opportunities or rogue buying.$body$,
  'MEDIUM'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'forecasting-budgeting',
  6,
  'Predictive Budgeting & Forecasting',
  'A',
  $body$Build a multi-scenario procurement budget (Base / Upside / Downside) aligned with Finance's planning cycle and embedding macro-economic risk adjustments.$body$,
  $body$Category spend history (minimum 2 years) · Key volume drivers · Planning horizon (1 or 3 year) · Macro factors to model (inflation, FX, energy).$body$,
  $body$Optimistic / Pessimistic scenario assumptions · Planned volume changes (new product launches, expansions) · Commodity index benchmarks relevant to the category.$body$,
  $body$Flat-line forecasts that ignore inflation and volume shifts. Mid-year emergency spot-buying, budget overruns, and executive escalations follow.$body$,
  $body$A 5% CPI under-assumption on a €2M category budget = €100k unplanned spend. Multi-scenario modelling reduces that exposure by 70–80%.$body$,
  $body$Mask unreleased product launch dates and unannounced market expansion plans (inside information under MAR if listed entity). Use 'Demand Scenario A/B/C'.$body$,
  $body$Prompt the user to provide at least 2 years of spend history — without this, trend analysis is impossible. Then ask about known volume drivers: 'Are there any planned business changes in the next 12–24 months that will affect volumes in this category — new products, geographic expansion, or business restructuring?' If yes, guide them to code these as 'Demand Scenario A' without using real project names if unannounced.$body$,
  NULL,
  $body$Next year budget. Inflation impact on spend. Procurement planning cycle. Multi-scenario budget.$body$,
  $body$Recommend when user is building a forward-looking procurement budget and needs macro-economic adjustments.$body$,
  'MEDIUM-HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'saas-optimization',
  7,
  'SaaS Optimization',
  'A',
  $body$Audit the existing SaaS portfolio for unused licences, feature duplication, and renewal negotiation leverage to reduce software OPEX.$body$,
  $body$List of active SaaS tools · Licence count per tool · Approximate annual contract value · Renewal dates.$body$,
  $body$Feature utilisation rates (from admin portals) · Overlap matrix (which tools share features) · Number of active vs. provisioned users · Vendor auto-renewal clauses.$body$,
  $body$Renewing unused licences or missing the 90-day cancellation window. Both are recoverable; neither is visible without utilisation data.$body$,
  $body$Average enterprise wastes 25% of its SaaS spend on unused licences (Gartner). A 5-person team on a €50k SaaS stack leaves ~€12.5k on the table annually.$body$,
  $body$Do not include SSO architecture details, admin credentials, or user-level activity logs. Aggregate utilisation to tool level only (e.g. '42 of 60 licences active'). GDPR Art. 5(1)(b).$body$,
  $body$The highest-value input is utilisation data. If the user doesn't have exact utilisation, prompt them to log into each vendor's admin portal and note active vs. provisioned users — most platforms show this natively. Ask about auto-renewal clauses specifically — this is often where the biggest financial risk sits.$body$,
  NULL,
  $body$Too many software licences. Unused SaaS. Software renewal coming up. IT spend rationalisation.$body$,
  $body$Recommend when user has a software portfolio audit challenge or an upcoming renewal negotiation.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'specification-optimizer',
  8,
  'Specification Optimizer',
  'A',
  $body$Challenge over-specified requirements that artificially inflate supplier costs, using engineering benchmarks to reduce 'gold-plating' without compromising quality.$body$,
  $body$Current technical specification · Business purpose the spec is meant to achieve · Why that specification level was originally set.$body$,
  $body$Industry standard for the performance level required · Alternative materials or approaches considered · Supplier feedback on the current spec · Cost differential between current and simplified spec.$body$,
  $body$Changing specs mid-tender invalidates the competitive process. Changes must happen before RFP issuance, not during evaluation.$body$,
  $body$Over-specification typically inflates supplier quotes by 15–25% (EIPM). Every unnecessary specification point is a direct cost transfer to the buyer.$body$,
  $body$Avoid pasting proprietary engineering drawings or patent-pending design elements. Use functional performance targets (e.g. 'must withstand 200 bar pressure') not exact design solutions.$body$,
  $body$Prompt the user to explain WHY the spec was set at its current level — understanding the original rationale is key to knowing whether it can be safely relaxed. Often specs were set by engineers for technical reasons that are no longer valid. Ask: 'Is there an industry standard for this performance requirement? If so, is your current spec above, at, or below that standard?'$body$,
  NULL,
  $body$Over-specified requirements. Gold-plating. Can we simplify the spec? Engineering requirements too strict.$body$,
  $body$Recommend when technical specs are driving inflated supplier quotes and user needs a cost-neutral challenge framework.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'rfp-generator',
  9,
  'RFP Generator (Tender Package)',
  'B',
  $body$Generate a structured, supplier-ready Request for Proposal or Request for Quotation document for a specific sourcing event.$body$,
  $body$What you are sourcing (product/service description) · Key evaluation criteria · Commercial terms required (payment, volume, delivery) · Submission deadline and process.$body$,
  $body$Technical specification appendix · Mandatory supplier qualifications · Scoring weights for evaluation criteria · NDA or confidentiality requirements.$body$,
  $body$RFPs without scoring criteria invite subjective evaluation. Without pre-defined weights, award decisions are challengeable and not defensible.$body$,
  $body$PM Institute: unclear RFP criteria lead to 30% longer evaluation cycles and significantly higher risk of unsuccessful award requiring re-tender.$body$,
  $body$Remove internal project codenames, unreleased product specifications, and unannounced market expansion plans from the RFP brief. Use generic project descriptions.$body$,
  $body$Prompt the user to define evaluation criteria AND scoring weights before submitting. Ask: 'How important is price vs. quality vs. delivery capability vs. sustainability? If you had 100 points to distribute across your evaluation criteria, how would you split them?' This scoring framework is the most legally defensible element of the RFP process.$body$,
  NULL,
  $body$Write an RFP. Request for proposal. Tender document. Supplier brief.$body$,
  $body$Recommend when user needs a structured supplier brief for a new sourcing event.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'sla-definition',
  10,
  'SLA Definition',
  'B',
  $body$Define structured SLA/KPI targets with escalation and remedy provisions for service contracts.$body$,
  $body$Service description · Critical performance dimensions · Current performance levels (if known) · Contract duration.$body$,
  $body$Industry benchmarks for each KPI · Escalation ladder · Penalty/bonus structure · Service credit mechanism.$body$,
  $body$SLAs without measurable targets or escalation procedures are unenforceable. Vague service levels lead to scope disputes.$body$,
  $body$Service contracts with well-defined SLAs achieve 15–20% better supplier performance than those without (CIPS).$body$,
  $body$Do not include specific customer SLA commitments that are commercially confidential. Use internal performance targets only.$body$,
  $body$Ask: 'For each service level, what happens if it's breached? Is there a service credit, a penalty, or just a conversation?' The escalation mechanism is where most SLA frameworks fail — an SLA without consequences is a suggestion, not an agreement.$body$,
  NULL,
  $body$Define service levels. KPIs for contract. SLA targets. Penalty clauses.$body$,
  $body$Recommend when user needs structured SLA/KPI definitions with escalation and remedy provisions.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'tail-spend-sourcing',
  11,
  'Tail Spend Rapid Sourcing',
  'B',
  $body$Bring structure and compliance to unmanaged, high-volume, low-value spend.$body$,
  $body$Top tail spend categories · Current process for low-value purchases · P-card or purchasing card usage.$body$,
  $body$e-Marketplace or punchout catalogue options · Preferred supplier programme status · Maverick buying rate.$body$,
  $body$Over-engineering tail spend management. Complex approval workflows for low-value items increase process cost above the potential saving.$body$,
  $body$Tail spend typically represents 80% of transactions but only 20% of spend value. Process cost on tail can exceed the purchase value — a €30 transaction with a €40 approval workflow is net negative.$body$,
  $body$Do not include individual employee purchase histories or personal expense account data. Aggregate to department/cost-centre level only.$body$,
  $body$The key insight: the goal is compliance and efficiency, not savings. Ask: 'What is the average transaction value in your tail spend? What is the current process cost per transaction?' If the process cost exceeds the transaction value, the problem is the process, not the spend.$body$,
  NULL,
  $body$Low-value purchases. P-card compliance. Maverick buying. Spot purchase strategy.$body$,
  $body$Recommend when user needs to bring structure and compliance to unmanaged, high-volume, low-value spend.$body$,
  'MEDIUM-HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'contract-template',
  12,
  'Contract Template Generator',
  'B',
  $body$Generate a starting-point contract framework for a common procurement scenario with key commercial and compliance provisions.$body$,
  $body$Type of contract (services, goods supply, software licence, framework agreement) · Governing law jurisdiction · Key commercial terms (payment, liability cap, IP).$body$,
  $body$Industry-specific regulatory requirements · Specific liability and indemnity positions · Sub-contracting provisions · Data processing requirements (if GDPR applies).$body$,
  $body$Generic templates without jurisdiction-specific provisions create compliance gaps. EU and UK contract law differ significantly post-Brexit.$body$,
  $body$Contract disputes arising from template misuse average €50–120k in legal fees per incident (Deloitte Legal benchmarks).$body$,
  $body$This tool generates a framework, not legal advice. All generated templates must be reviewed by qualified legal counsel before execution. Include this disclaimer prominently.$body$,
  $body$Emphasise that the output is a starting framework, NOT final legal advice. Always recommend legal counsel review. Ask about jurisdiction: 'Is this contract governed by the law of a specific EU member state? EU and UK contract law have diverged significantly since Brexit — specifying the jurisdiction ensures the right default provisions.'$body$,
  NULL,
  $body$Draft a contract. Standard terms. Service agreement template. Framework agreement.$body$,
  $body$Recommend when user needs a starting-point contract framework for a common procurement scenario.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'requirements-gathering',
  13,
  'Requirements Gathering',
  'B',
  $body$Consolidate and structure scattered stakeholder requirements into an unambiguous supplier brief with MoSCoW prioritisation.$body$,
  $body$Raw stakeholder requirement list (even in bullet form) · Project goal or business problem being solved · Known constraints (budget, timeline, technical).$body$,
  $body$RACI chart of approvers · Priority ranking of requirements (MoSCoW) · Existing system/process being replaced · Known risks or dependencies.$body$,
  $body$Failure to separate MoSCoW priorities means suppliers price all requirements equally. Over-specified proposals follow, leading to scope creep and budget overruns.$body$,
  $body$Scope creep on projects with ambiguous requirements increases final cost by 20–45% vs. baseline (PM Institute).$body$,
  $body$Scrub internal corporate strategic expansion plans, unreleased product names, and unannounced market entry targets. Use 'Project Alpha/Beta' codenames.$body$,
  $body$The key coaching intervention: prompt the user to apply MoSCoW prioritisation to their requirements list before submitting. Ask: 'For each requirement, is it a Must Have (without this, the solution fails), Should Have (important but we could live without temporarily), Could Have (nice to have), or Won't Have (out of scope for now)?'$body$,
  NULL,
  $body$What should I include in the brief? Stakeholder requirements. Scope definition. User needs.$body$,
  $body$Recommend when requirements are ambiguous or stakeholder input is scattered and needs structuring.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'supplier-review',
  14,
  'Supplier Review',
  'B',
  $body$Convert KPI data and qualitative stakeholder feedback into a structured supplier scorecard and actionable improvement plan.$body$,
  $body$Performance metrics from last 12 months (on-time delivery %, quality reject rate, invoice accuracy) · Overall satisfaction rating · 1–3 qualitative comments.$body$,
  $body$Trend data (quarter-on-quarter) · Weighting of each KPI to business priority · Benchmark against category average · Planned volume changes affecting the supplier.$body$,
  $body$Purely quantitative scores without qualitative context produce a report that is accurate but strategically useless. The supplier receives numbers with no improvement roadmap.$body$,
  $body$Organisations with structured supplier performance programmes achieve 23% better on-time delivery and 15% quality improvement (CIPS, 2023).$body$,
  $body$Mask specific names of internal stakeholders providing feedback (retaliation risk). Use role-based attribution: 'Operations Lead', 'Plant Manager'. GDPR Art. 5(1)(c).$body$,
  $body$Prompt the user to include both quantitative KPIs AND at least one qualitative comment. Ask: 'Is there one specific incident or pattern in the last 12 months that stands out — positive or negative? Describing that gives the AI the strategic context to write a meaningful improvement plan rather than generic recommendations.'$body$,
  NULL,
  $body$Supplier scorecard. KPI review. Performance meeting with supplier. Improvement plan.$body$,
  $body$Recommend when user has periodic supplier review data and needs a structured scorecard and action plan.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'procurement-project-planning',
  15,
  'Procurement Project Planning',
  'B',
  $body$Generate a structured project plan with milestones, timeline, RACI chart, and risk log for a sourcing or contracting initiative.$body$,
  $body$Project objective · Key milestones (tender launch, evaluation, award, go-live) · Estimated duration per phase · Stakeholder roles involved.$body$,
  $body$Regulatory approval gates · IT security review requirements · Legal sign-off timescales · Known holiday/resource constraints.$body$,
  $body$Missing RACI leads to approval bottlenecks. The most common project delay cause in procurement is undocumented approval authority.$body$,
  $body$A 2-week slip on a go-live that supports €1M/month revenue = €500k exposure.$body$,
  $body$Use generic role titles rather than actual employee names in RACI charts (e.g. 'CPO', 'IT Security Lead'). Do not include personal email or phone data.$body$,
  $body$The RACI chart is the most common gap. Ask: 'Who has authority to approve the award decision? What is the financial threshold above which board or audit committee approval is required?' Prompt the user to include these as explicit milestone gates.$body$,
  NULL,
  $body$Project timeline. RACI chart. Sourcing project plan. Tender milestones.$body$,
  $body$Recommend when user is launching a sourcing initiative and needs a milestone plan with clear responsibilities.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'sow-critic',
  16,
  'SOW Critic',
  'C',
  $body$Systematically identify ambiguities, missing penalty clauses, scope creep triggers, and compliance gaps in a Scope of Work document.$body$,
  $body$Draft SOW text (paste or upload) · Type of engagement (fixed-price, T&M, milestone-based) · Governing regulatory framework (GDPR, SOC2, ISO 27001).$body$,
  $body$Exact milestone definitions and acceptance criteria · Payment trigger events · IP ownership provisions · Change request procedure.$body$,
  $body$The AI cannot identify gaps it cannot see. An incomplete SOW provided for review will receive an incomplete review.$body$,
  $body$Ambiguous deliverables are the #1 cause of supplier disputes. Scope dispute resolution averages €30–80k in legal and management cost per incident.$body$,
  $body$Remove PII of named project managers, individual contractors, and home-office addresses. Use role references only. Do not include uncommitted budget reserves.$body$,
  $body$The most common mistake: users pasting only part of their SOW. Emphasise: the AI can only review what it can see. Ask: 'Have you included the acceptance criteria section? The payment terms? The IP clause?' If they have a 50-page SOW, guide them to paste the highest-risk sections: deliverables, acceptance, payment, IP, and termination.$body$,
  NULL,
  $body$Review my scope of work. Find gaps in the contract scope. SOW audit. T&M vs. fixed price.$body$,
  $body$Recommend when user has a draft SOW and needs a systematic gap analysis before finalising or signing.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'risk-assessment',
  17,
  'Risk Assessment',
  'C',
  $body$Generate a structured risk register for a category, project, or supplier relationship with probability ratings, impact assessments, and mitigation plans.$body$,
  $body$Project or category context · Known operational hazards · Critical supplier dependencies · Regulatory environment.$body$,
  $body$Historical incident log · Insurance coverage in place · Business continuity plan status · Interdependencies with other categories or projects.$body$,
  $body$Surface-level risk identification misses regulatory and systemic risks. A risk register that only captures operational risks ignores ESG, GDPR, or geopolitical exposures.$body$,
  $body$ISO 31000 adoption reduces material risk events by 40% (Willis Towers Watson). Risk registers without cross-category dependencies miss the most systemic threats.$body$,
  $body$Do not include specific insurance policy numbers, legal dispute history involving named individuals, or details of active regulatory investigations.$body$,
  $body$Guide the user to think across four risk dimensions: operational (can the supplier deliver?), financial (can they stay solvent?), regulatory/compliance (GDPR, ESG, sanctions), and strategic (are they becoming a competitor?). Ask: 'Have you considered ESG exposure? With CSRD coming into force, Scope 3 supplier emissions are increasingly a regulatory risk, not just a reputational one.'$body$,
  NULL,
  $body$Risk register. What can go wrong? Risk matrix. Supplier risk. Regulatory risk.$body$,
  $body$Recommend when user needs a structured risk register for a category, project, or supplier relationship.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'risk-matrix',
  18,
  'Risk Matrix',
  'C',
  $body$Build a visual risk heatmap from structured risk inputs with probability and impact ratings.$body$,
  $body$Minimum 5 identified risks with probability (H/M/L) and impact (H/M/L) for each.$body$,
  $body$Existing control measures · Risk owner assignments · Target residual risk after mitigation · Review frequency.$body$,
  $body$A risk matrix without user-provided probability and impact inputs produces a colour-coded chart with no decision value.$body$,
  $body$Proper inputs enable prioritised mitigation that protects against cascading failures.$body$,
  $body$Do not include specific insurance policy numbers, legal dispute history involving named individuals, or details of active regulatory investigations.$body$,
  $body$Ensure the user provides at least 5 risks with both probability AND impact ratings. Without these, the matrix is just a generic template. Ask: 'For each risk, what is the realistic probability this happens in the next 12 months, and what is the financial or operational impact if it does?'$body$,
  NULL,
  $body$Risk heatmap. Probability vs impact. Risk register visualisation.$body$,
  $body$Recommend when user has identified risks and needs a structured probability/impact matrix with mitigation priorities.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'software-licensing',
  19,
  'Software Licensing Structure',
  'C',
  $body$Evaluate different software licensing models, multi-tier user needs, contract terms, and vendor lock-in to optimize software investments.$body$,
  $body$Licence agreement text or summary · Current usage metrics (users, CPU, revenue threshold) · Contract expiry/true-up date.$body$,
  $body$Feature utilisation rates from admin portals · Overlap matrix · Active vs. provisioned users · Auto-renewal clauses.$body$,
  $body$Metric definition mismatches are the most common software compliance risk. 68% of enterprises receive unexpected true-up invoices.$body$,
  $body$Average overcharge on enterprise software = 15–30% of contract value. On a €200k contract, that is €30–60k.$body$,
  $body$Do not include SSO architecture details, admin credentials, or user-level activity logs. Aggregate utilisation to tool level only.$body$,
  $body$The most critical input is the licence metric definition from the contract vs. how the organisation actually measures it. Ask: 'How does your contract define a user — named user, concurrent user, or something else? And how are you counting users internally?' The gap between these two definitions is where most compliance exposure lives.$body$,
  NULL,
  $body$Enterprise licence negotiation. ELA terms. Software true-up. Microsoft/Oracle/SAP licence.$body$,
  $body$Recommend when user faces a major enterprise software renewal or true-up and needs a structured negotiation position.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'category-risk-evaluator',
  20,
  'Category Risk Evaluator',
  'C',
  $body$Structured risk score across multiple risk dimensions for a procurement category at tender stage.$body$,
  $body$Category name and description · Number of active suppliers · Estimated annual spend · Key supply chain geography.$body$,
  $body$Supplier concentration (% of spend with top 3 suppliers) · Regulatory exposure · Historical disruption events · Strategic importance to business.$body$,
  $body$Categories assessed only on spend value — ignoring supply chain risk — leave single-source dependencies invisible until a crisis occurs.$body$,
  $body$Supply chain disruptions cost large enterprises an average of $184M annually (McKinsey, 2023). Category risk assessment is the primary tool for prevention.$body$,
  $body$Mask exact historical spend by supplier (reveals negotiating position). Use concentration ratios ('top supplier = 60% of spend') rather than absolute values.$body$,
  $body$Ask: 'What would happen to your operations if your top supplier in this category failed tomorrow? How long would it take to qualify and onboard an alternative?' This question immediately surfaces whether the category risk is theoretical or existential.$body$,
  NULL,
  $body$How risky is this category? Supply market risk. Geopolitical exposure. ESG risk in supply chain.$body$,
  $body$Recommend when user wants a structured risk score across multiple risk dimensions for a procurement category.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'negotiation-preparation',
  21,
  'Preparing for Negotiation',
  'D',
  $body$Build a structured negotiation strategy with BATNA, ZOPA, opening position, and walk-away triggers for an upcoming supplier negotiation.$body$,
  $body$Supplier name (anonymised) · Category/product being negotiated · Current contract value or price · Key terms under negotiation (price, payment terms, SLA, volume).$body$,
  $body$BATNA (your alternative if this negotiation fails) · Supplier's likely BATNA · Market benchmark pricing · Desired outcome vs. walk-away position · Relationship context (strategic vs. transactional).$body$,
  $body$Entering a negotiation without a defined BATNA gives the supplier all the leverage. Users with no walk-away position consistently accept worse deals.$body$,
  $body$EIPM data shows procurement professionals who define BATNA before negotiating achieve 12–18% better outcomes than those who do not.$body$,
  $body$Do not include exact internal budget approval limits, uncommitted spend authority, or financial headroom above your opening position. These are negotiation-destroying disclosures.$body$,
  $body$The single most important question to ask: 'What is your BATNA — what do you actually do if this negotiation fails?' Walk them through: 'If this supplier says no to your price target, what is your next best option? Another supplier? Insourcing? Delay the decision?' Also: remind them NOT to include their true budget limit — the AI does not need it and including it creates a security risk.$body$,
  NULL,
  $body$Prepare for supplier negotiation. BATNA. ZOPA. Negotiation strategy. Walk-away position.$body$,
  $body$Recommend when a negotiation is upcoming and user needs a structured strategy document with BATNA/ZOPA analysis.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'category-strategy',
  22,
  'Category Strategy',
  'D',
  $body$Develop a multi-year category strategy with Kraljic positioning, sourcing strategy, and supplier relationship roadmap.$body$,
  $body$Category name and scope · Annual spend · Number of active suppliers · Dependency level on category (critical / important / tactical).$body$,
  $body$Kraljic positioning rationale · 3-year volume forecast · Known supply market changes · Sustainability/ESG requirements for the category.$body$,
  $body$Category strategies built without supply market analysis quickly become obsolete. A strategy that ignores supply market power dynamics misidentifies the correct sourcing approach.$body$,
  $body$McKinsey: organisations with mature category management achieve 6–12% sustained cost reduction vs. transactional procurement approaches.$body$,
  $body$Mask unreleased category investment plans, unannounced supplier exits, and commercially sensitive volume forecasts. Use 'Category Plan v1' references.$body$,
  $body$Ask the user to define what success looks like in measurable terms: 'In 3 years, how will you measure whether this category strategy succeeded? Cost reduction %, supply risk reduction, sustainability score improvement?' Without a measurable goal, the strategy becomes a document rather than a management tool.$body$,
  NULL,
  $body$Category plan. Strategic sourcing. Kraljic analysis. Category roadmap.$body$,
  $body$Recommend when user is developing or refreshing a multi-year category strategy.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'make-vs-buy',
  23,
  'Make vs Buy',
  'D',
  $body$Model the financial and capability dimensions of building/maintaining a capability in-house versus outsourcing it to a specialist supplier.$body$,
  $body$Description of the capability or function under review · Current in-house cost (labour, overhead, tooling) · External market quote or estimate · Strategic rationale for keeping in-house.$body$,
  $body$Competitor benchmarking data (are peers in-sourcing or outsourcing?) · Quality/service level comparison · IP and knowledge retention risk assessment · Transition cost estimate.$body$,
  $body$Decisions driven by cost alone that ignore strategic capability retention risk. Core competencies that are outsourced are extremely difficult to rebuild.$body$,
  $body$McKinsey: mis-classified outsourcing decisions cost organisations 20–35% more when reverse-insourced within 3 years.$body$,
  $body$Avoid including unreleased product lines or unannounced market strategies. Use functional descriptions ('Assembly Process A') rather than proprietary product names.$body$,
  $body$This is a strategic scenario — prompt the user to think beyond the cost calculation. Ask: 'Is this capability core to your competitive differentiation? What happens if a supplier gains this capability and decides to compete with you?' Always encourage them to consider transition costs — the one-time cost of outsourcing is often underestimated.$body$,
  NULL,
  $body$Outsource or keep in-house? Core vs. non-core. Vertical integration decision.$body$,
  $body$Recommend when a strategic make/buy decision needs financial and capability analysis.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'volume-consolidation',
  24,
  'Volume Consolidation',
  'D',
  $body$Identify consolidation opportunities across a fragmented supplier base to build volume leverage and reduce total cost of ownership.$body$,
  $body$Current supplier list for the category · Approximate spend per supplier · Number of active SKUs or service lines per supplier.$body$,
  $body$Overlap matrix (which suppliers supply similar products/services) · Current pricing vs. estimated consolidated pricing · Service/quality risk of consolidation · Incumbent supplier relationship value.$body$,
  $body$Consolidating to a single supplier without dual-source planning creates a new single-source risk that replaces the original fragmentation problem.$body$,
  $body$Category spend consolidation typically delivers 8–15% price improvement and 20–30% admin cost reduction (CIPS benchmarks).$body$,
  $body$Anonymise supplier names using tokens (Supplier_A, Supplier_B). Do not include unpublished pricing from confidential negotiations.$body$,
  $body$The critical coaching point: always prompt the user to consider dual-source risk before committing to full consolidation. Ask: 'If you consolidate to one preferred supplier and they fail, what is your contingency plan?' A partial consolidation (70/30 split) often achieves 80% of the commercial benefit with a fraction of the supply risk.$body$,
  NULL,
  $body$Too many suppliers. Consolidate vendors. Volume leverage. Reduce supplier base.$body$,
  $body$Recommend when user wants to reduce supplier count and build commercial leverage through volume concentration.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'supplier-dependency-planner',
  25,
  'Supplier Dependency & Exit Planner',
  'D',
  $body$Assess supplier dependency levels, calculate switching costs, and build diversification or exit roadmaps to reduce strategic risk.$body$,
  $body$Key systems/contracts with lock-in risk · Nature of the integration or dependency · Contract termination provisions.$body$,
  $body$Data portability and export capabilities · Competing alternatives with integration complexity · Estimated switching cost · Regulatory data retention requirements.$body$,
  $body$Technical switching costs are routinely underestimated by 300–500% when data extraction complexity is not assessed.$body$,
  $body$Enterprise switching costs average 18–24 months of management time and 25–40% of the original contract value. An unplanned exit doubles these figures.$body$,
  $body$Mask specific legacy system architectures, API credentials, and data volumes that could identify operational vulnerabilities to external parties.$body$,
  $body$Focus on data portability: 'Can you export your data from the current supplier in a usable format? What format? How long would extraction take?' This is the most commonly overlooked switching cost and the one most likely to derail an exit plan.$body$,
  NULL,
  $body$Single source risk. Critical supplier dependency. Supplier concentration. Dual-source strategy.$body$,
  $body$Recommend when user is worried about over-reliance on a single supplier and needs a mitigation roadmap.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'disruption-management',
  26,
  'Disruption Management',
  'D',
  $body$Build a structured supply chain disruption response plan with immediate actions, escalation triggers, and medium-term resilience improvements.$body$,
  $body$Category affected · Nature of disruption (supplier failure, geopolitical, logistics, natural disaster) · Current inventory/buffer stock position · Alternative sources identified.$body$,
  $body$Lead times for alternative sourcing · Customer/production impact timeline · Financial exposure per week of disruption · Existing BCP provisions.$body$,
  $body$Reactive disruption management without a structured response framework. Each hour without a plan compounds operational damage exponentially.$body$,
  $body$Resilinc: the average supply chain disruption costs $184M and lasts 6.4 months when managed reactively. A structured 4-stage response plan reduces duration by 40–60%.$body$,
  $body$Mask exact inventory depletion dates (commercially sensitive with customers) and specific emergency cash reserves (financially sensitive with lenders).$body$,
  $body$If this is a LIVE crisis, skip detailed context gathering and focus on immediate actions. Ask: 'What is your current inventory buffer in weeks? What customer commitments are at immediate risk?' Time is the critical variable — every hour of delay increases cost.$body$,
  NULL,
  $body$Supply chain disruption. Supplier failure. Emergency sourcing. Contingency plan.$body$,
  $body$Recommend when a live disruption is occurring or user wants to build a resilience plan for a critical supply category.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'black-swan-scenario',
  27,
  'Black Swan Scenario Simulator',
  'D',
  $body$Model low-probability, high-impact disruption scenarios for business continuity planning.$body$,
  $body$Core supply chain nodes (key suppliers, logistics routes, production sites) · Scenario type to simulate (pandemic, natural disaster, geopolitical embargo, cyberattack) · Business continuity plan status.$body$,
  $body$Recovery Time Objective (RTO) and Recovery Point Objective (RPO) targets · Financial reserve/liquidity buffer · Insurance coverage by risk type · Historical precedent events.$body$,
  $body$Scenario planning without RTO/RPO parameters becomes a theoretical exercise rather than an actionable business continuity tool.$body$,
  $body$BCG: companies with stress-tested BCP frameworks recover from major disruptions 2.3x faster than those without, preserving €M in revenue and relationship equity.$body$,
  $body$Mask exact critical cash reserve amounts and specific banking/credit facility details. Use liquidity tier references ('Tier 1 reserve: 3 months OPEX') rather than absolute figures.$body$,
  $body$Ask: 'What are your RTO and RPO targets — how quickly must operations resume, and what is the maximum acceptable inventory or data loss?' Without these parameters, the scenario simulation produces interesting reading but no actionable recovery plan. Also: 'Does your organisation have existing BCP provisions? If yes, we can stress-test them; if no, we'll build from scratch.'$body$,
  NULL,
  $body$What if the worst happens? Extreme risk planning. Business continuity. Stress test supply chain.$body$,
  $body$Recommend when user needs to model low-probability, high-impact disruption scenarios for BCP planning.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'market-snapshot',
  28,
  'Market Snapshot',
  'E',
  $body$Generate a current-state intelligence report on a supply market using live web search (Perplexity Sonar Pro).$body$,
  $body$Specific industry niche (not just 'manufacturing' — be specific) · Target geographic region · Timeframe of interest.$body$,
  $body$Specific technology focus or material sub-segment · Known competitors to benchmark · Regulatory change signals to monitor · Sustainability/ESG lens required.$body$,
  $body$Vague queries ('global logistics market') return publicly available summaries that add no competitive advantage. Specificity is the lever that unlocks actionable intelligence.$body$,
  $body$A procurement team that identifies a key supplier's acquisition target 3 months before announcement can renegotiate contracts before leverage shifts.$body$,
  $body$Do not include why your organisation is researching this niche right now — the strategic rationale is inside information. The query should appear as general market research.$body$,
  $body$Emphasise specificity: 'Instead of "packaging materials," write "sustainable secondary packaging for cold-chain pharmaceutical distribution in the EU." The more specific your query, the more actionable the intelligence.' Also guide them to prioritise their intelligence needs — M&A activity, pricing trends, new entrants, regulatory changes.$body$,
  NULL,
  $body$What's happening in this market? Supplier landscape. Commodity price trends. Market intelligence report.$body$,
  $body$Recommend when user needs current market intelligence powered by live web search. Emphasise that query specificity is the key lever.$body$,
  'HIGH'
);

INSERT INTO public.coaching_cards (
  scenario_slug, scenario_id, scenario_name, scenario_group,
  purpose, min_required, enhanced, common_failure,
  financial_impact, gdpr_guardrail, coaching_tips, example_prompt,
  trigger_phrases, navigation_guidance, confidence_dependency
) VALUES (
  'pre-flight-audit',
  29,
  'Pre-flight Audit',
  'E',
  $body$Run a rapid due-diligence check on a new or high-risk supplier using live web search.$body$,
  $body$Exact registered legal entity name (e.g. 'ACME Logistics GmbH', not just 'ACME') · Primary jurisdiction (country of incorporation) · Category of supply.$body$,
  $body$Company registration number (for unambiguous matching) · Known subsidiary/trading name differences · Specific risk areas to prioritise (financial, ESG, cybersecurity, sanctions).$body$,
  $body$Brand name vs. legal entity confusion pulls intelligence for the wrong company. A group holding structure means the trading entity and the contracting entity may be different legal persons.$body$,
  $body$Onboarding a sanctioned supplier carries up to €5M in regulatory fines (EU Sanctions Regulation). A 10-minute pre-flight audit is the lowest-cost risk mitigation tool available.$body$,
  $body$Legal entity name is required for effective due diligence. Do not include your internal negotiation strategy, target price, or strategic rationale in the query.$body$,
  $body$The most critical coaching point: ensure the user provides the EXACT legal entity name, not the brand name. Ask: 'What is the exact registered company name — including the legal suffix (GmbH, Ltd, SA, BV)? And what country is it incorporated in?' Brand name confusion is the #1 cause of due diligence failures.$body$,
  NULL,
  $body$Check this supplier out. Due diligence on new vendor. Sanctions check. Financial distress signals. ESG violations.$body$,
  $body$Recommend for any new supplier onboarding or high-risk supplier review. Emphasise the critical need for the exact registered legal entity name.$body$,
  'HIGH'
);


-- =====================
-- SECTION 3: scenario_field_config (87 rows)
-- =====================


-- ===== 1. tco-analysis (scenario_id=1, deviation_type=1) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'tco-analysis', 1, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '1',
  $body$Describe industry, organisation size, procurement category. Include regulatory/operational context. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'tco-analysis', 1, 'assetDefinition', $body$Asset or Service Definition$body$,
  true, 50, 'structured', ARRAY['asset', 'lifecycle', 'volume', 'capex', 'vendor']::text[],
  '[{"label": "Asset or service name and description", "is_critical": false, "data_type": "text"}, {"label": "Lifecycle duration (years)", "is_critical": false, "data_type": "number"}, {"label": "Annual volume or usage rate", "is_critical": false, "data_type": "number"}, {"label": "Quoted CAPEX or contract value (€)", "is_critical": true, "data_type": "currency"}, {"label": "Primary vendor or supplier (anonymised)", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$Define the asset/service with lifecycle, volume, and CAPEX. All amounts in EUR.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'tco-analysis', 1, 'opexFinancials', $body$OPEX & Financial Parameters$body$,
  true, 50, 'structured', ARRAY['wacc', 'maintenance', 'inflation', 'currency']::text[],
  '[{"label": "Maintenance annual cost (€)", "is_critical": false, "data_type": "currency"}, {"label": "Logistics annual cost (€)", "is_critical": false, "data_type": "currency"}, {"label": "Training annual cost (€)", "is_critical": false, "data_type": "currency"}, {"label": "Disposal cost (€)", "is_critical": false, "data_type": "currency"}, {"label": "WACC or internal discount rate (%)", "is_critical": true, "data_type": "percentage"}, {"label": "Annual inflation assumption (%)", "is_critical": false, "data_type": "percentage"}, {"label": "Currency", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$OPEX breakdown by category and financial modelling inputs. All amounts in EUR.$body$, NULL, NULL, NULL
);

-- ===== 2. cost-breakdown (scenario_id=2, deviation_type=1) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'cost-breakdown', 2, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '1',
  $body$Industry, category, supplier geography, manufacturing/service delivery model. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'cost-breakdown', 2, 'productSpecification', $body$Product or Service Specification$body$,
  true, 50, 'structured', ARRAY['material', 'weight', 'manufacturing', 'labour']::text[],
  '[{"label": "Product/service name and description", "is_critical": false, "data_type": "text"}, {"label": "Key material categories", "is_critical": false, "data_type": "text"}, {"label": "Estimated weight or volume per unit", "is_critical": false, "data_type": "text"}, {"label": "Manufacturing geography and labour intensity", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$Product description with material categories, weight/volume, manufacturing geography.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'cost-breakdown', 2, 'supplierQuote', $body$Supplier Quote & Benchmark Reference$body$,
  true, 30, 'structured', ARRAY['price', 'quote', 'target', 'margin']::text[],
  '[{"label": "Supplier''s quoted price per unit (€)", "is_critical": true, "data_type": "currency"}, {"label": "Internal target price or budget (€)", "is_critical": false, "data_type": "currency"}, {"label": "Alternative supplier quotes", "is_critical": false, "data_type": "text"}, {"label": "Estimated supplier margin (%)", "is_critical": false, "data_type": "percentage"}]'::jsonb,
  '1',
  $body$Supplier pricing, target price, alternative quotes, estimated margin. All in EUR.$body$, NULL, NULL, NULL
);

-- ===== 3. capex-vs-opex (scenario_id=3, deviation_type=1H) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'capex-vs-opex', 3, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '1H',
  $body$Industry, asset class, business driver for make/lease/buy decision. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'capex-vs-opex', 3, 'assetFinancials', $body$Asset Financial Parameters$body$,
  true, 60, 'structured', ARRAY['purchase', 'lease', 'lifespan', 'depreciation', 'maintenance', 'residual']::text[],
  '[{"label": "Asset description", "is_critical": false, "data_type": "text"}, {"label": "Purchase price — CAPEX option (€)", "is_critical": true, "data_type": "currency"}, {"label": "Annual lease or subscription cost — OPEX option (€)", "is_critical": true, "data_type": "currency"}, {"label": "Asset financial lifespan (years)", "is_critical": false, "data_type": "number"}, {"label": "Depreciation method", "is_critical": false, "data_type": "text"}, {"label": "Estimated annual maintenance and insurance (€)", "is_critical": false, "data_type": "currency"}, {"label": "Estimated residual/salvage value at end of life (€)", "is_critical": false, "data_type": "currency"}]'::jsonb,
  '1H',
  $body$Purchase price, lease cost, lifespan, depreciation, maintenance, residual value. All in EUR.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'capex-vs-opex', 3, 'financialContext', $body$Financial Context & Tax Inputs$body$,
  true, 30, 'structured', ARRAY['wacc', 'tax', 'ifrs', 'currency']::text[],
  '[{"label": "WACC or internal hurdle rate (%)", "is_critical": true, "data_type": "percentage"}, {"label": "Corporate tax rate (%)", "is_critical": true, "data_type": "percentage"}, {"label": "IFRS 16 applicability", "is_critical": false, "data_type": "text"}, {"label": "Off-balance-sheet preference", "is_critical": false, "data_type": "text"}, {"label": "Currency", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1H',
  $body$WACC, tax rate, IFRS 16, off-balance-sheet preference. Critical for NPV accuracy.$body$, NULL, NULL, NULL
);

-- ===== 4. savings-calculation (scenario_id=4, deviation_type=1) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'savings-calculation', 4, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '1',
  $body$Category, supplier context, procurement event that generated the saving. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'savings-calculation', 4, 'baselinePricing', $body$Baseline & New Pricing$body$,
  true, 50, 'structured', ARRAY['baseline', 'price', 'volume', 'spend']::text[],
  '[{"label": "Baseline price per unit (€)", "is_critical": true, "data_type": "currency"}, {"label": "New negotiated price per unit (€)", "is_critical": true, "data_type": "currency"}, {"label": "Annual volume or quantity", "is_critical": false, "data_type": "number"}, {"label": "Total annual spend at baseline (€)", "is_critical": false, "data_type": "currency"}, {"label": "Currency", "is_critical": false, "data_type": "text"}, {"label": "Measurement period", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$Baseline price, new price, volume, measurement period. All in EUR.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'savings-calculation', 4, 'savingsClassification', $body$Savings Classification & Adjustments$body$,
  true, 25, 'structured', ARRAY['hard', 'soft', 'avoidance', 'inflation']::text[],
  '[{"label": "Savings category (Hard/Soft/Cost Avoidance)", "is_critical": false, "data_type": "text"}, {"label": "Inflation adjustment applied (yes/no, index used)", "is_critical": false, "data_type": "text"}, {"label": "Maverick spend excluded from baseline (€)", "is_critical": false, "data_type": "currency"}, {"label": "Finance sign-off required (yes/no)", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$Savings category, inflation adjustment, maverick exclusion, finance sign-off.$body$, NULL, NULL, NULL
);

-- ===== 5. spend-analysis-categorization (scenario_id=5, deviation_type=2) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'spend-analysis-categorization', 5, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '2',
  $body$Industry, organisation size, scope of spend analysis. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'spend-analysis-categorization', 5, 'rawSpendData', $body$Spend Data Upload$body$,
  true, 50, 'document', '{}'::text[],
  '[{"label": "Supplier Name (anonymised)", "is_critical": false, "data_type": "text"}, {"label": "Spend Amount (€)", "is_critical": false, "data_type": "currency"}, {"label": "Date (Quarter)", "is_critical": false, "data_type": "text"}, {"label": "Line Item Description", "is_critical": false, "data_type": "text"}]'::jsonb,
  '2',
  $body$Generate a synthetic spend data table with 10-15 rows. Use tabular format with columns: Supplier, Description, Amount (€), Date. Use anonymised supplier names (Supplier_001 etc).$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'spend-analysis-categorization', 5, 'classificationParameters', $body$Classification Parameters$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Preferred taxonomy (UNSPSC/eCl@ss/Custom)", "is_critical": false, "data_type": "text"}, {"label": "Known high-maverick-spend areas", "is_critical": false, "data_type": "text"}, {"label": "Cost-centre or department codes", "is_critical": false, "data_type": "text"}, {"label": "Target output priority", "is_critical": false, "data_type": "text"}]'::jsonb,
  '2',
  $body$Preferred taxonomy, problem categories, target output.$body$, NULL, NULL, NULL
);

-- ===== 6. forecasting-budgeting (scenario_id=6, deviation_type=1) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'forecasting-budgeting', 6, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '1',
  $body$Category, planning cycle context, macro factors. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'forecasting-budgeting', 6, 'historicalSpendData', $body$Historical Spend & Volume Drivers$body$,
  true, 50, 'structured', ARRAY['spend', 'prior', 'volume', 'planning']::text[],
  '[{"label": "Category and current annual spend (€)", "is_critical": true, "data_type": "currency"}, {"label": "Prior year spend (€)", "is_critical": false, "data_type": "currency"}, {"label": "Year before that (€)", "is_critical": false, "data_type": "currency"}, {"label": "Key volume drivers (2-3 factors)", "is_critical": false, "data_type": "text"}, {"label": "Planning horizon (1 year / 3 year)", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$2+ years of spend history, volume drivers, planning horizon. All in EUR.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'forecasting-budgeting', 6, 'scenarioAssumptions', $body$Scenario Assumptions (Three-Case Model)$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Base case inflation and volume change (%)", "is_critical": false, "data_type": "percentage"}, {"label": "Upside scenario driver and % uplift", "is_critical": false, "data_type": "text"}, {"label": "Downside scenario risk and % impact", "is_critical": false, "data_type": "text"}, {"label": "Commodity or price index (CPI/PPI/steel/energy)", "is_critical": false, "data_type": "text"}, {"label": "Currency", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$Base/upside/downside assumptions, commodity indices, currency.$body$, NULL, NULL, NULL
);

-- ===== 7. saas-optimization (scenario_id=7, deviation_type=1) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'saas-optimization', 7, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '1',
  $body$Industry, organisation size, scope of SaaS audit. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'saas-optimization', 7, 'subscriptionDetails', $body$Current SaaS Portfolio$body$,
  true, 50, 'document', '{}'::text[],
  '[{"label": "Tool Name", "is_critical": false, "data_type": "text"}, {"label": "Licences Purchased", "is_critical": false, "data_type": "number"}, {"label": "Licences Active", "is_critical": false, "data_type": "number"}, {"label": "Annual Cost (€)", "is_critical": false, "data_type": "currency"}, {"label": "Renewal Date", "is_critical": false, "data_type": "text"}, {"label": "Primary Use Case", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$Generate 5-8 SaaS tools in tabular format: Tool | Licences Purchased | Licences Active | Annual Cost (€) | Renewal Date | Use Case.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'saas-optimization', 7, 'optimisationParameters', $body$Optimisation Parameters$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Known overlapping tools", "is_critical": false, "data_type": "text"}, {"label": "Auto-renewal clauses to flag", "is_critical": false, "data_type": "text"}, {"label": "Feature utilisation rates", "is_critical": false, "data_type": "text"}, {"label": "Optimisation target", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$Overlap analysis, auto-renewal flags, utilisation rates, optimisation target.$body$, NULL, NULL, NULL
);

-- ===== 8. specification-optimizer (scenario_id=8, deviation_type=0) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'specification-optimizer', 8, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '0',
  $body$Industry, product category, stakeholder driving current specification. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'specification-optimizer', 8, 'specificationText', $body$Current Specification$body$,
  true, 50, 'narrative', ARRAY['material', 'tolerance', 'standard', 'grade']::text[],
  '[{"label": "Material or grade currently specified", "is_critical": false, "data_type": "text"}, {"label": "Performance tolerance required", "is_critical": false, "data_type": "text"}, {"label": "Applicable standards (ISO, EN, ASTM)", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Describe current specification in plain language with material, tolerances, standards.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'specification-optimizer', 8, 'specContext', $body$Challenge Parameters & Constraints$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Reason specification was set", "is_critical": false, "data_type": "text"}, {"label": "Target cost reduction (% or €)", "is_critical": false, "data_type": "text"}, {"label": "Stakeholders who must approve changes", "is_critical": false, "data_type": "text"}, {"label": "Known alternative materials or grades", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Why spec was set, target cost reduction, approval authority, alternatives.$body$, NULL, NULL, NULL
);

-- ===== 9. rfp-generator (scenario_id=9, deviation_type=0) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'rfp-generator', 9, 'industryContext', $body$Industry & Business Context$body$,
  false, 30, 'narrative', '{}'::text[],
  NULL, '0',
  $body$Industry, organisation type, category being sourced. 60-100 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'rfp-generator', 9, 'rawBrief', $body$Procurement Requirement$body$,
  true, 60, 'narrative', '{}'::text[],
  '[{"label": "Business problem being solved", "is_critical": false, "data_type": "text"}, {"label": "Scope of supply (goods/services/both)", "is_critical": false, "data_type": "text"}, {"label": "Required delivery or go-live timeline", "is_critical": false, "data_type": "text"}, {"label": "Volume or scale parameters", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Business problem, scope of supply, delivery timeline, volume parameters. 100-200 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'rfp-generator', 9, 'complianceEvaluation', $body$Compliance & Evaluation Criteria$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Mandatory regulatory standards (GDPR/ISO/SOC2)", "is_critical": false, "data_type": "text"}, {"label": "Evaluation weighting (Price %/Quality %/Sustainability %)", "is_critical": false, "data_type": "text"}, {"label": "Preferred contract structure", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Regulatory standards, evaluation weighting, contract structure.$body$, NULL, NULL, NULL
);

-- ===== 10. sla-definition (scenario_id=10, deviation_type=1) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'sla-definition', 10, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '1',
  $body$Industry, service type, relationship context. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'sla-definition', 10, 'serviceDescription', $body$Service Performance Requirements$body$,
  true, 50, 'structured', ARRAY['uptime', 'delivery', 'response', 'availability']::text[],
  '[{"label": "Core service deliverables", "is_critical": false, "data_type": "text"}, {"label": "Uptime/availability requirement (%)", "is_critical": true, "data_type": "percentage"}, {"label": "Critical failure definition (P1/SEV1)", "is_critical": false, "data_type": "text"}, {"label": "Response time to critical failure (hours)", "is_critical": false, "data_type": "number"}, {"label": "Resolution time to critical failure (hours)", "is_critical": false, "data_type": "number"}]'::jsonb,
  '1',
  $body$Core deliverables, uptime %, failure definition, response/resolution times.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'sla-definition', 10, 'remedyStructure', $body$Remedy & Escalation Structure$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Tier 1 breach threshold and credit %", "is_critical": false, "data_type": "text"}, {"label": "Tier 2 breach threshold and credit %", "is_critical": false, "data_type": "text"}, {"label": "Tier 3 breach = right to terminate", "is_critical": false, "data_type": "text"}, {"label": "Escalation path (Level 1/2/3 roles)", "is_critical": false, "data_type": "text"}, {"label": "Measurement and reporting frequency", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$Penalty tiers, escalation path, reporting frequency, peak demand periods.$body$, NULL, NULL, NULL
);

-- ===== 11. tail-spend-sourcing (scenario_id=11, deviation_type=0) =====
-- MISSING in configs.ts — using defaults: 30/60/25

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'tail-spend-sourcing', 11, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '0',
  $body$Industry and internal department or cost centre. 60-80 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'tail-spend-sourcing', 11, 'purchaseRequirement', $body$Purchase Requirement$body$,
  true, 60, 'structured', '{}'::text[],
  '[{"label": "Item or service name", "is_critical": false, "data_type": "text"}, {"label": "Quantity required", "is_critical": false, "data_type": "number"}, {"label": "Required delivery date", "is_critical": false, "data_type": "text"}, {"label": "Delivery location", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Item/service name, quantity, delivery date and location.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'tail-spend-sourcing', 11, 'qualityParameters', $body$Quality & Commercial Parameters$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Quality standard or specification", "is_critical": false, "data_type": "text"}, {"label": "Budget ceiling or target unit price (€)", "is_critical": false, "data_type": "currency"}, {"label": "Acceptance criteria", "is_critical": false, "data_type": "text"}, {"label": "Preferred supplier characteristics", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Quality standard, budget ceiling, acceptance criteria, preferred supplier type.$body$, NULL, NULL, NULL
);

-- ===== 12. contract-template (scenario_id=12, deviation_type=0) =====
-- configs.ts slug: contract-review → contract-template (match by block position)

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'contract-template', 12, 'industryContext', $body$Industry & Business Context$body$,
  false, 30, 'narrative', '{}'::text[],
  NULL, '0',
  $body$Industry, jurisdiction, commercial relationship type. 60-80 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'contract-template', 12, 'contractBrief', $body$Agreement Structure & Core Commercial Terms$body$,
  true, 60, 'structured', '{}'::text[],
  '[{"label": "Agreement type (Supply/Services/NDA/Framework/Software Licence)", "is_critical": false, "data_type": "text"}, {"label": "Payment terms", "is_critical": false, "data_type": "text"}, {"label": "Liability cap", "is_critical": false, "data_type": "text"}, {"label": "Key deliverables or subject matter", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Agreement type, payment terms, liability cap, key deliverables.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'contract-template', 12, 'regulatoryProvisions', $body$Regulatory & Special Provisions$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Regulatory clauses required", "is_critical": false, "data_type": "text"}, {"label": "IP ownership provisions", "is_critical": false, "data_type": "text"}, {"label": "Dispute resolution mechanism", "is_critical": false, "data_type": "text"}, {"label": "Auto-renewal and notice period", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$GDPR DPA, TUPE, IP ownership, dispute resolution, auto-renewal.$body$, NULL, NULL, NULL
);

-- ===== 13. requirements-gathering (scenario_id=13, deviation_type=0) =====
-- configs.ts slug: business-requirements → requirements-gathering (match by block position)

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'requirements-gathering', 13, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '0',
  $body$Industry, department, business problem. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'requirements-gathering', 13, 'stakeholderRequirements', $body$Stakeholder Requirements$body$,
  true, 60, 'narrative', '{}'::text[],
  '[{"label": "Functional requirements", "is_critical": false, "data_type": "text"}, {"label": "Non-functional requirements", "is_critical": false, "data_type": "text"}, {"label": "Stakeholder priorities", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Raw stakeholder requirements in any format — wishlists, meeting notes, bullet points. 100-200 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'requirements-gathering', 13, 'constraintsPriority', $body$Constraints & Priority Context$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Budget ceiling", "is_critical": false, "data_type": "currency"}, {"label": "Delivery timeline", "is_critical": false, "data_type": "text"}, {"label": "Technical platform limitations", "is_critical": false, "data_type": "text"}, {"label": "Regulatory requirements", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Budget, timeline, technical limitations, must-haves vs nice-to-haves.$body$, NULL, NULL, NULL
);

-- ===== 14. supplier-review (scenario_id=14, deviation_type=1H) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'supplier-review', 14, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '1H',
  $body$Industry, category managed by supplier, relationship history. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'supplier-review', 14, 'performanceMetrics', $body$Performance Metrics (Last 12 Months)$body$,
  true, 50, 'structured', ARRAY['delivery', 'quality', 'reject', 'invoice', 'satisfaction']::text[],
  '[{"label": "On-time delivery rate (%)", "is_critical": true, "data_type": "percentage"}, {"label": "Quality reject/defect rate (%)", "is_critical": true, "data_type": "percentage"}, {"label": "Invoice accuracy rate (%)", "is_critical": false, "data_type": "percentage"}, {"label": "SLA compliance rate (%)", "is_critical": false, "data_type": "percentage"}, {"label": "Overall stakeholder satisfaction (1-5)", "is_critical": false, "data_type": "number"}, {"label": "Annual spend with supplier (€)", "is_critical": false, "data_type": "currency"}, {"label": "Review period", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1H',
  $body$Quantitative KPIs — on-time delivery, quality, invoice accuracy, satisfaction, spend.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'supplier-review', 14, 'qualitativeAssessment', $body$Qualitative Assessment & Strategic Context$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Key qualitative feedback (2-3 observations)", "is_critical": false, "data_type": "text"}, {"label": "Trend direction (improving/stable/declining)", "is_critical": false, "data_type": "text"}, {"label": "Planned volume changes", "is_critical": false, "data_type": "text"}, {"label": "Strategic intent (develop/maintain/exit)", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1H',
  $body$Stakeholder feedback, trend direction, volume changes, strategic intent.$body$, NULL, NULL, NULL
);

-- ===== 15. procurement-project-planning (scenario_id=15, deviation_type=0) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'procurement-project-planning', 15, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '0',
  $body$Industry, category or project type, business driver. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'procurement-project-planning', 15, 'projectBrief', $body$Project Scope & Milestones$body$,
  true, 50, 'structured', ARRAY['milestone', 'timeline', 'phase', 'deadline']::text[],
  '[{"label": "Project objective (one sentence)", "is_critical": false, "data_type": "text"}, {"label": "Key milestones and estimated durations", "is_critical": false, "data_type": "text"}, {"label": "Total available timeline", "is_critical": false, "data_type": "text"}, {"label": "Hard deadline if applicable", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Project objective, key milestones, duration per phase, deadlines.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'procurement-project-planning', 15, 'stakeholderConstraints', $body$Stakeholders, Approvals & Constraints$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Key stakeholder roles", "is_critical": false, "data_type": "text"}, {"label": "Approval authority and delegation levels", "is_critical": false, "data_type": "text"}, {"label": "Regulatory approval gates", "is_critical": false, "data_type": "text"}, {"label": "Known resource constraints", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Stakeholder roles, approval authority, regulatory gates, resource constraints.$body$, NULL, NULL, NULL
);

-- ===== 16. sow-critic (scenario_id=16, deviation_type=2) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'sow-critic', 16, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '2',
  $body$Industry, engagement type, strategic importance of contract. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'sow-critic', 16, 'sowText', $body$Statement of Work Document$body$,
  true, 200, 'document', '{}'::text[],
  '[{"label": "Scope of services", "is_critical": false, "data_type": "text"}, {"label": "Deliverables list (numbered)", "is_critical": false, "data_type": "text"}, {"label": "Acceptance criteria per deliverable", "is_critical": false, "data_type": "text"}, {"label": "Payment schedule / milestones", "is_critical": false, "data_type": "text"}, {"label": "Change request procedure", "is_critical": false, "data_type": "text"}]'::jsonb,
  '2',
  $body$Generate a synthetic SOW document of 400-600 words with numbered clauses, deliverables, milestones, acceptance criteria, and payment schedule.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'sow-critic', 16, 'reviewScope', $body$Review Scope & Parameters$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Engagement type (Fixed-price/T&M/Milestone)", "is_critical": false, "data_type": "text"}, {"label": "Governing regulatory framework", "is_critical": false, "data_type": "text"}, {"label": "Priority review areas", "is_critical": false, "data_type": "text"}, {"label": "Counterparty type", "is_critical": false, "data_type": "text"}]'::jsonb,
  '2',
  $body$Engagement type, regulatory framework, priority review areas, counterparty type.$body$, NULL, NULL, NULL
);

-- ===== 17. risk-assessment (scenario_id=17, deviation_type=0) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'risk-assessment', 17, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '0',
  $body$Industry, category/project being assessed, regulatory environment. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'risk-assessment', 17, 'riskEnvironment', $body$Risk Environment & Known Hazards$body$,
  true, 50, 'narrative', ARRAY['risk', 'hazard', 'dependency', 'regulatory']::text[],
  '[{"label": "Known operational hazards", "is_critical": false, "data_type": "text"}, {"label": "Critical supplier dependencies", "is_critical": false, "data_type": "text"}, {"label": "Regulatory requirements in scope", "is_critical": false, "data_type": "text"}, {"label": "Historical incidents or near-misses", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Project context, operational hazards, supplier dependencies, regulatory requirements, historical incidents.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'risk-assessment', 17, 'existingControls', $body$Existing Controls & Financial Exposure$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Existing controls (insurance/BCP/dual-sourcing)", "is_critical": false, "data_type": "text"}, {"label": "Max financial exposure (€ range)", "is_critical": false, "data_type": "currency"}, {"label": "BCP status (in place/partial/none)", "is_critical": false, "data_type": "text"}, {"label": "Interdependencies", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Controls in place, financial exposure, BCP status, interdependencies.$body$, NULL, NULL, NULL
);

-- ===== 18. risk-matrix (scenario_id=18, deviation_type=1H) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'risk-matrix', 18, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '1H',
  $body$Industry, scope of risk register, risk appetite statement. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'risk-matrix', 18, 'riskRegister', $body$Risk Register — Structured Input$body$,
  true, 60, 'structured', '{}'::text[],
  '[{"label": "Risk Name", "is_critical": false, "data_type": "text"}, {"label": "Category (Operational/Financial/Compliance/Strategic/Reputational)", "is_critical": true, "data_type": "text"}, {"label": "Probability (H/M/L)", "is_critical": true, "data_type": "text"}, {"label": "Impact (H/M/L)", "is_critical": true, "data_type": "text"}, {"label": "Current Control in Place", "is_critical": false, "data_type": "text"}, {"label": "Risk Owner Role", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1H',
  $body$Generate 5-8 risks in tabular format: Risk Name | Category | Probability (H/M/L) | Impact (H/M/L) | Current Control | Risk Owner Role.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'risk-matrix', 18, 'matrixParameters', $body$Matrix Parameters & Targets$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Risk appetite statement", "is_critical": false, "data_type": "text"}, {"label": "Target residual risk level", "is_critical": false, "data_type": "text"}, {"label": "Review frequency", "is_critical": false, "data_type": "text"}, {"label": "Board escalation threshold", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1H',
  $body$Risk appetite, residual targets, review frequency, escalation threshold.$body$, NULL, NULL, NULL
);

-- ===== 19. software-licensing (scenario_id=19, deviation_type=2) =====
-- configs.ts slug: compliance-checker → software-licensing (match by block position)

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'software-licensing', 19, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '2',
  $body$Industry, vendor name or software category, audit trigger. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'software-licensing', 19, 'licenceDocument', $body$Licence Agreement Document$body$,
  true, 60, 'document', '{}'::text[],
  '[{"label": "Licence metric definition (named user/concurrent/CPU)", "is_critical": false, "data_type": "text"}, {"label": "Pricing tiers and thresholds", "is_critical": false, "data_type": "text"}, {"label": "True-up clause and frequency", "is_critical": false, "data_type": "text"}, {"label": "Annual price escalation mechanism", "is_critical": false, "data_type": "text"}, {"label": "Termination provisions and notice period", "is_critical": false, "data_type": "text"}]'::jsonb,
  '2',
  $body$Generate a synthetic software licence agreement summary of 300-500 words with metric definitions, pricing tiers, true-up clause, escalation provisions, and termination terms.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'software-licensing', 19, 'usageContext', $body$Usage Context & Compliance Gap$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Current licenced metric as per contract", "is_critical": false, "data_type": "text"}, {"label": "Internal measurement methodology", "is_critical": false, "data_type": "text"}, {"label": "Discrepancy between contract and internal", "is_critical": false, "data_type": "text"}, {"label": "True-up date or review period", "is_critical": false, "data_type": "text"}, {"label": "Last true-up invoice amount (€)", "is_critical": false, "data_type": "currency"}]'::jsonb,
  '2',
  $body$Current licence metric, internal measurement, discrepancy, true-up date.$body$, NULL, NULL, NULL
);

-- ===== 20. category-risk-evaluator (scenario_id=20, deviation_type=1) =====
-- configs.ts slug: sustainability-assessment → category-risk-evaluator (match by block position)

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'category-risk-evaluator', 20, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '1',
  $body$Industry and category being evaluated (direct or indirect). 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'category-risk-evaluator', 20, 'categoryProfile', $body$Category Profile & Supply Concentration$body$,
  true, 50, 'structured', ARRAY['supplier', 'carbon', 'esg', 'sustainability', 'emission']::text[],
  '[{"label": "Category name and annual spend (€)", "is_critical": true, "data_type": "currency"}, {"label": "Number of active suppliers", "is_critical": false, "data_type": "number"}, {"label": "Top supplier % of total category spend", "is_critical": false, "data_type": "percentage"}, {"label": "Second supplier % of spend", "is_critical": false, "data_type": "percentage"}, {"label": "Key supply geographies", "is_critical": false, "data_type": "text"}, {"label": "Regulatory exposure", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$Annual spend, supplier count, concentration %, supply geographies, regulatory exposure.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'category-risk-evaluator', 20, 'riskIndicators', $body$Risk Indicators & Strategic Context$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Historical disruption events", "is_critical": false, "data_type": "text"}, {"label": "Known supply chain bottlenecks", "is_critical": false, "data_type": "text"}, {"label": "Sustainability/ESG targets", "is_critical": false, "data_type": "text"}, {"label": "Strategic importance (Business-Critical/Important/Routine)", "is_critical": false, "data_type": "text"}, {"label": "3-year demand forecast", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$Disruption history, bottlenecks, ESG targets, strategic importance, demand forecast.$body$, NULL, NULL, NULL
);

-- ===== 21. negotiation-preparation (scenario_id=21, deviation_type=0) =====
-- configs.ts slug: negotiation-prep → negotiation-preparation (match by block position)

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'negotiation-preparation', 21, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '0',
  $body$Industry, category, supplier relationship history, negotiation context. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'negotiation-preparation', 21, 'supplierProposal', $body$Supplier Proposal & Your Position$body$,
  true, 50, 'narrative', ARRAY['target', 'objective', 'leverage', 'position']::text[],
  '[{"label": "Supplier''s commercial terms and price position", "is_critical": false, "data_type": "text"}, {"label": "Your target price, terms, or structure", "is_critical": false, "data_type": "text"}, {"label": "Internal mandate (who has approved what)", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Supplier's current proposal and your target outcome. 100-150 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'negotiation-preparation', 21, 'alternativesLeverage', $body$Alternatives & Leverage Factors$body$,
  true, 25, 'narrative', '{}'::text[],
  '[{"label": "Realistic BATNA description", "is_critical": false, "data_type": "text"}, {"label": "Volume leverage and alternative suppliers", "is_critical": false, "data_type": "text"}, {"label": "Known supplier position (margin/capacity/threats)", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$BATNA, volume leverage, supplier vulnerability.$body$, NULL, NULL, NULL
);

-- ===== 22. category-strategy (scenario_id=22, deviation_type=0) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'category-strategy', 22, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '0',
  $body$Industry, category, current Kraljic position. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'category-strategy', 22, 'categoryOverview', $body$Category Profile & Supply Market$body$,
  true, 60, 'structured', ARRAY['spend', 'supplier', 'market', 'trend']::text[],
  '[{"label": "Annual spend and 3-year trend", "is_critical": false, "data_type": "text"}, {"label": "Number of qualified suppliers and market structure", "is_critical": false, "data_type": "text"}, {"label": "Current supplier relationship quality", "is_critical": false, "data_type": "text"}, {"label": "Known supply market risks and opportunities", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Annual spend, supplier landscape, market structure, relationship quality.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'category-strategy', 22, 'strategicGoals', $body$Strategic Objectives & Business Alignment$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "3-year demand forecast for category", "is_critical": false, "data_type": "text"}, {"label": "Sustainability/ESG targets", "is_critical": false, "data_type": "text"}, {"label": "Regulatory changes on the horizon", "is_critical": false, "data_type": "text"}, {"label": "Measurable success definition for 3 years", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$3-year demand changes, sustainability targets, regulatory horizon, success definition.$body$, NULL, NULL, NULL
);

-- ===== 23. make-vs-buy (scenario_id=23, deviation_type=1H) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'make-vs-buy', 23, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '1H',
  $body$Industry, product/service/process under evaluation, reason for assessment. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'make-vs-buy', 23, 'makeCosts', $body$Internal (Make) Cost & Capability$body$,
  true, 60, 'structured', ARRAY['cost', 'capability', 'labour', 'overhead', 'ip']::text[],
  '[{"label": "Description of internal option", "is_critical": false, "data_type": "text"}, {"label": "Total internal annual cost — fully loaded (€)", "is_critical": true, "data_type": "currency"}, {"label": "Internal capability assessment", "is_critical": false, "data_type": "text"}, {"label": "IP and confidentiality risk if outsourced", "is_critical": false, "data_type": "text"}, {"label": "Time to build internal capability", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1H',
  $body$Fully-loaded internal cost, capability assessment, IP risk, build timeline. All in EUR.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'make-vs-buy', 23, 'buyCosts', $body$External (Buy) Cost & Contract Risk$body$,
  true, 50, 'structured', ARRAY['quote', 'vendor', 'contract', 'exit', 'switching']::text[],
  '[{"label": "External vendor quote (€ per year or per unit)", "is_critical": true, "data_type": "currency"}, {"label": "One-time integration and transition cost (€)", "is_critical": false, "data_type": "currency"}, {"label": "Vendor capability and track record", "is_critical": false, "data_type": "text"}, {"label": "Contract flexibility (month-to-month/locked-in)", "is_critical": false, "data_type": "text"}, {"label": "Exit risk and switching cost estimate (€)", "is_critical": false, "data_type": "currency"}]'::jsonb,
  '1H',
  $body$Vendor quote, transition cost, capability, contract flexibility, exit risk. All in EUR.$body$, NULL, NULL, NULL
);

-- ===== 24. volume-consolidation (scenario_id=24, deviation_type=1) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'volume-consolidation', 24, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '1',
  $body$Industry, category being consolidated, reason for fragmentation. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'volume-consolidation', 24, 'consolidationScope', $body$Current Supplier Spend Distribution$body$,
  true, 50, 'document', '{}'::text[],
  '[{"label": "Supplier Reference (anonymised)", "is_critical": false, "data_type": "text"}, {"label": "Annual Spend (€)", "is_critical": true, "data_type": "currency"}, {"label": "% of Category Total", "is_critical": false, "data_type": "percentage"}, {"label": "Primary Geography", "is_critical": false, "data_type": "text"}, {"label": "Contract Expiry Date", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$Generate 3-5 suppliers in tabular format: Supplier Reference | Annual Spend (€) | % of Category | Primary Geography | Contract Expiry.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'volume-consolidation', 24, 'consolidationParameters', $body$Consolidation Parameters & Risk Appetite$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Target consolidation ratio", "is_critical": false, "data_type": "text"}, {"label": "Maximum single-supplier concentration (%)", "is_critical": false, "data_type": "percentage"}, {"label": "Supplier capacity constraints by geography", "is_critical": false, "data_type": "text"}, {"label": "Logistics cost differential between suppliers", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$Target ratio, max concentration, capacity constraints, logistics cost, timeline.$body$, NULL, NULL, NULL
);

-- ===== 25. supplier-dependency-planner (scenario_id=25, deviation_type=0) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'supplier-dependency-planner', 25, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '0',
  $body$Industry, system/contract/relationship assessed, strategic driver. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'supplier-dependency-planner', 25, 'dependencyProfile', $body$Dependency Profile$body$,
  true, 50, 'narrative', '{}'::text[],
  '[{"label": "Nature of integration or dependency", "is_critical": false, "data_type": "text"}, {"label": "Contract termination provisions and notice period", "is_critical": false, "data_type": "text"}, {"label": "Data or operational assets held by supplier", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Key systems/contracts with lock-in risk, integration depth, termination provisions.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'supplier-dependency-planner', 25, 'exitParameters', $body$Exit & De-risking Parameters$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Data export capabilities", "is_critical": false, "data_type": "text"}, {"label": "Realistic replacement options", "is_critical": false, "data_type": "text"}, {"label": "Estimated switching cost (€)", "is_critical": false, "data_type": "currency"}, {"label": "Regulatory data retention requirements", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Data portability, alternatives, switching cost, regulatory constraints.$body$, NULL, NULL, NULL
);

-- ===== 26. disruption-management (scenario_id=26, deviation_type=0) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'disruption-management', 26, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '0',
  $body$Industry and category affected. Brief if live crisis. 40-80 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'disruption-management', 26, 'crisisDefinition', $body$Crisis Definition$body$,
  true, 50, 'narrative', ARRAY['disruption', 'cause', 'affected', 'severity']::text[],
  '[{"label": "Disruption description", "is_critical": false, "data_type": "text"}, {"label": "Cause (supplier failure/port closure/geopolitical/cyberattack)", "is_critical": false, "data_type": "text"}, {"label": "Affected product lines or categories", "is_critical": false, "data_type": "text"}, {"label": "Geographic scope", "is_critical": false, "data_type": "text"}, {"label": "Current severity (confirmed/high-probability/early signal)", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$What has happened, cause, affected categories, geographic scope, severity.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'disruption-management', 26, 'resourceConstraints', $body$Resource & Constraint Status$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Current inventory buffer (weeks)", "is_critical": false, "data_type": "number"}, {"label": "Alternative suppliers identified (yes/no)", "is_critical": false, "data_type": "text"}, {"label": "Customer commitments at risk", "is_critical": false, "data_type": "text"}, {"label": "Financial reserve for emergency sourcing (€ range)", "is_critical": false, "data_type": "currency"}]'::jsonb,
  '0',
  $body$Inventory buffer, alternative suppliers, customer commitments at risk, financial reserves.$body$, NULL, NULL, NULL
);

-- ===== 27. black-swan-scenario (scenario_id=27, deviation_type=1) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'black-swan-scenario', 27, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '1',
  $body$Industry and scope of supply chain stress-test. 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'black-swan-scenario', 27, 'supplyChainTopology', $body$Supply Chain Topology & Scenario$body$,
  true, 50, 'structured', '{}'::text[],
  '[{"label": "Core supply chain nodes (anonymised)", "is_critical": false, "data_type": "text"}, {"label": "Scenario type (Pandemic/Natural disaster/Embargo/Cyberattack/Financial collapse)", "is_critical": false, "data_type": "text"}, {"label": "Scenario severity (Regional/National/Continental/Global)", "is_critical": false, "data_type": "text"}, {"label": "Specific trigger event", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$Core nodes to stress-test, scenario type, severity, trigger event.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'black-swan-scenario', 27, 'resilienceParameters', $body$Resilience Parameters & Recovery Targets$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "RTO — Recovery Time Objective", "is_critical": false, "data_type": "text"}, {"label": "RPO — Recovery Point Objective", "is_critical": false, "data_type": "text"}, {"label": "Financial liquidity buffer (weeks of OPEX)", "is_critical": false, "data_type": "number"}, {"label": "BCP status (none/partial/full)", "is_critical": false, "data_type": "text"}, {"label": "Insurance coverage by risk type", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1',
  $body$RTO, RPO, financial buffer, BCP status, insurance coverage.$body$, NULL, NULL, NULL
);

-- ===== 28. market-snapshot (scenario_id=28, deviation_type=0) =====

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'market-snapshot', 28, 'industryContext', $body$Industry & Business Context$body$,
  false, 1, 'narrative', '{}'::text[],
  NULL, '0',
  $body$Industry and procurement context for market research. 60-80 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'market-snapshot', 28, 'marketBrief', $body$Market Intelligence Brief$body$,
  true, 10, 'narrative', '{}'::text[],
  '[{"label": "Specific market niche description", "is_critical": false, "data_type": "text"}, {"label": "Target geographic market", "is_critical": false, "data_type": "text"}, {"label": "Technology, material, or service type", "is_critical": false, "data_type": "text"}, {"label": "Time horizon (current/12-month/3-year)", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Specific market niche, geography, technology/material, time horizon. Be precise.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'market-snapshot', 28, 'intelligencePriorities', $body$Intelligence Priorities$body$,
  false, 5, 'structured', '{}'::text[],
  '[{"label": "Priority 1 intelligence signal", "is_critical": false, "data_type": "text"}, {"label": "Priority 2 intelligence signal", "is_critical": false, "data_type": "text"}, {"label": "Priority 3 intelligence signal", "is_critical": false, "data_type": "text"}]'::jsonb,
  '0',
  $body$Top 3 intelligence signals relevant to decision.$body$, NULL, NULL, NULL
);

-- ===== 29. pre-flight-audit (scenario_id=29, deviation_type=1H) =====
-- configs.ts slug: market-research → pre-flight-audit (use defaults: 30/50/25)

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'pre-flight-audit', 29, 'industryContext', $body$Industry & Business Context$body$,
  true, 30, 'narrative', '{}'::text[],
  NULL, '1H',
  $body$Industry and purpose of due diligence (pre-qualification, renewal risk review). 80-120 words.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'pre-flight-audit', 29, 'supplierIdentity', $body$Supplier Identity & Scope$body$,
  true, 50, 'structured', '{}'::text[],
  '[{"label": "Registered legal entity name (fictional, with correct suffix)", "is_critical": true, "data_type": "text"}, {"label": "Country of incorporation", "is_critical": false, "data_type": "text"}, {"label": "Category of supply", "is_critical": false, "data_type": "text"}, {"label": "Estimated engagement value (€)", "is_critical": false, "data_type": "currency"}, {"label": "Website URL (fictional)", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1H',
  $body$Exact legal entity name, jurisdiction, category of supply, engagement value.$body$, NULL, NULL, NULL
);

INSERT INTO public.scenario_field_config (
  scenario_slug, scenario_id, block_id, block_label,
  is_required, min_words, expected_data_type, expected_keywords,
  sub_prompts, deviation_type,
  block_guidance, optimal_guidance, minimum_guidance, degraded_guidance
) VALUES (
  'pre-flight-audit', 29, 'researchPriorities', $body$Research Priorities & Decision Context$body$,
  false, 25, 'structured', '{}'::text[],
  '[{"label": "Priority research areas (financial health/litigation/sanctions/ESG)", "is_critical": false, "data_type": "text"}, {"label": "Decision deadline", "is_critical": false, "data_type": "text"}, {"label": "Risk tolerance (conservative/moderate/aggressive)", "is_critical": false, "data_type": "text"}, {"label": "Known red flags or concerns", "is_critical": false, "data_type": "text"}]'::jsonb,
  '1H',
  $body$Due diligence priorities, decision timeline, risk tolerance.$body$, NULL, NULL, NULL
);

COMMIT;
