-- Drop the problematic unique constraint that doesn't work well with active/inactive states
ALTER TABLE public.market_insights DROP CONSTRAINT IF EXISTS unique_active_insight;

-- Create a partial unique index instead - only enforces uniqueness for active records
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_insight 
ON public.market_insights(industry_slug, category_slug) 
WHERE is_active = true;