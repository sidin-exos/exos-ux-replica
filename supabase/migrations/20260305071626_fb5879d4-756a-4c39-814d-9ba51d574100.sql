
CREATE TABLE public.enterprise_trackers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tracker_type text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'setup',
  parameters jsonb NOT NULL DEFAULT '{}',
  file_references jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_trackers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own trackers" ON public.enterprise_trackers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trackers" ON public.enterprise_trackers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trackers" ON public.enterprise_trackers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trackers" ON public.enterprise_trackers
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all trackers" ON public.enterprise_trackers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public) VALUES ('tracker-files', 'tracker-files', false);

CREATE POLICY "Users can upload own tracker files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tracker-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can read own tracker files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'tracker-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own tracker files" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'tracker-files' AND (storage.foldername(name))[1] = auth.uid()::text);
