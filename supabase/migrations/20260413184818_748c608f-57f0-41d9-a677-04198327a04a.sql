
-- Table
CREATE TABLE public.scenario_drafts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id  text NOT NULL,
  blocks       jsonb NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scenario_drafts_user_scenario_unique
    UNIQUE (user_id, scenario_id)
);

-- Index for fast lookup on load
CREATE INDEX scenario_drafts_user_scenario_idx
  ON public.scenario_drafts (user_id, scenario_id);

-- Auto-update updated_at on upsert
CREATE OR REPLACE FUNCTION update_scenario_drafts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER scenario_drafts_updated_at
  BEFORE UPDATE ON public.scenario_drafts
  FOR EACH ROW EXECUTE FUNCTION update_scenario_drafts_updated_at();

-- Enable RLS
ALTER TABLE public.scenario_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: users can only access their own drafts
CREATE POLICY "Users can manage their own drafts"
  ON public.scenario_drafts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Size guard: prevent payload abuse
ALTER TABLE public.scenario_drafts
  ADD CONSTRAINT scenario_drafts_blocks_size_check
  CHECK (octet_length(blocks::text) < 51200);
