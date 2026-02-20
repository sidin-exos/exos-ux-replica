ALTER TABLE public.test_reports
ADD COLUMN prompt_tokens integer DEFAULT 0,
ADD COLUMN completion_tokens integer DEFAULT 0,
ADD COLUMN total_tokens integer DEFAULT 0;