-- =========================================================
-- Add text extraction columns to user_files
-- Supports upload-time content extraction for AI analysis
-- =========================================================

ALTER TABLE public.user_files
  ADD COLUMN extracted_text     TEXT,
  ADD COLUMN extraction_status  TEXT NOT NULL DEFAULT 'pending'
    CHECK (extraction_status IN ('pending', 'processing', 'done', 'failed')),
  ADD COLUMN extraction_error   TEXT,
  ADD COLUMN extracted_at       TIMESTAMPTZ,
  ADD COLUMN token_estimate     INTEGER;

COMMENT ON COLUMN public.user_files.extracted_text IS
  'Raw text extracted from the uploaded file. Anonymization applied at analysis time.';
COMMENT ON COLUMN public.user_files.extraction_status IS
  'pending → processing → done | failed. Drives UI state.';
COMMENT ON COLUMN public.user_files.token_estimate IS
  'Approximate token count: ceil(length(extracted_text) / 4). Used for budget checks.';

CREATE INDEX idx_user_files_extraction_status
  ON public.user_files (extraction_status)
  WHERE extraction_status IN ('pending', 'processing');
