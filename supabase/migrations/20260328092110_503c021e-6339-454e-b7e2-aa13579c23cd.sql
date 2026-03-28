ALTER TABLE public.market_insights
  ADD COLUMN country_slug text NOT NULL DEFAULT 'eu',
  ADD COLUMN country_name text NOT NULL DEFAULT 'European Union';