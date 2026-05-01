UPDATE public.scenario_field_config
SET
  block_guidance = 'Output a pipe-delimited table only. Header row exactly: "Risk Name | Category | Probability (H/M/L) | Impact (H/M/L) | Current Control | Risk Owner Role". Then ≥5 risk rows, one per line, same column order. Category must be one of Operational/Financial/Compliance/Strategic/Reputational. Probability and Impact must be the single letters H, M or L. No prose, no bullets, no headings.',
  optimal_guidance = 'Generate 6–8 distinct, realistic risks spanning at least 4 different categories. Use specific, named controls (e.g. "SOC2 Type 2", "EcoVadis rating", "DPA + SCCs", "6-month forward cover", "dual-source RFP"). Owners must be role titles (CISO, DPO, Category Lead, CFO Office, Quality Manager) — never personal names. Probability/Impact must be a realistic mix (not all H, not all L).',
  minimum_guidance = 'Generate exactly 5 risks across at least 3 categories. Controls can be brief (1 short clause). Probability/Impact letters must still be present for every row.',
  degraded_guidance = 'Generate 3–4 risks; some rows may be missing the Control or Owner column (leave the cell empty between pipes). Probability/Impact letters still required.'
WHERE scenario_slug = 'risk-matrix' AND block_id = 'riskRegister';

UPDATE public.scenario_field_config
SET
  block_guidance = 'Output exactly 4 bullet lines, each starting with "• ". Lines in this order: (1) Risk appetite statement, (2) Target residual risk level, (3) Review frequency, (4) Board escalation threshold. No headings, no extra prose.',
  optimal_guidance = 'Each bullet must include a concrete threshold or numeric value (e.g. "treat anything ≥ Medium×Medium", "residual Low only for Compliance", "quarterly + monthly for High-rated", "escalate at residual exposure > €2M"). Tie thresholds to the categories used in the risk register.',
  minimum_guidance = 'Provide all 4 bullets but allow shorter, qualitative thresholds (e.g. "conservative", "Medium acceptable", "annual review", "any High×High to board").',
  degraded_guidance = 'Provide 2–3 of the 4 bullets only. Vague language acceptable.'
WHERE scenario_slug = 'risk-matrix' AND block_id = 'matrixParameters';

UPDATE public.scenario_field_config
SET
  block_guidance = 'Two short paragraphs (60–100 words total). Para 1: industry, sub-sector, company size band, geography. Para 2: scope of the risk register (project / category / supplier / enterprise-wide) and stated risk appetite if known.',
  optimal_guidance = 'Include sector-specific regulators and KPIs (e.g. EBA, MDR, REACH, OTIF, MTBF). Mention concrete spend band in EUR and headcount band.',
  minimum_guidance = 'Cover industry, geography, and scope in 2–3 sentences. Risk appetite optional.',
  degraded_guidance = 'One sentence naming industry and country only.'
WHERE scenario_slug = 'risk-matrix' AND block_id = 'industryContext';