UPDATE public.coaching_cards
SET
  scenario_name = 'Supplier Snapshot',
  financial_impact = 'Onboarding a sanctioned supplier carries up to €5M in regulatory fines (EU Sanctions Regulation). A 10-minute supplier snapshot is the lowest-cost risk mitigation tool available.'
WHERE scenario_slug = 'pre-flight-audit';