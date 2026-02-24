
-- Fix #10: Pipeline IQ — View + RPC for real aggregation from test_reports

-- 1. View: pipeline_iq_stats
-- Aggregates test_reports by date for the accuracy trend chart
CREATE OR REPLACE VIEW public.pipeline_iq_stats AS
SELECT 
  DATE(created_at) AS batch_date,
  COUNT(*) AS total_runs,
  ROUND(COUNT(CASE WHEN success THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS accuracy,
  ROUND(AVG(processing_time_ms)) AS avg_processing_time_ms
FROM public.test_reports
GROUP BY DATE(created_at)
ORDER BY batch_date ASC;

-- Grant read access to authenticated users (view inherits RLS from test_reports via SECURITY INVOKER default)
GRANT SELECT ON public.pipeline_iq_stats TO authenticated;

-- 2. RPC: get_evolutionary_directives
-- Extracts redundant_fields from shadow_log JSONB, counts occurrences, returns top N
CREATE OR REPLACE FUNCTION public.get_evolutionary_directives(limit_num INT DEFAULT 3)
RETURNS TABLE (
  target_scenario TEXT,
  directive_text TEXT,
  source_field_action TEXT,
  occurrence_count INT
) LANGUAGE sql SECURITY DEFINER SET search_path = 'public' AS $$
  WITH extracted_redundant AS (
    SELECT 
      jsonb_array_elements_text(shadow_log->'redundant_fields') AS field_name
    FROM public.test_reports 
    WHERE shadow_log IS NOT NULL
      AND shadow_log ? 'redundant_fields'
  ),
  redundant_counts AS (
    SELECT 
      'Global'::TEXT AS target_scenario,
      ('Consider removing field: [' || field_name || '] — it consistently provides no analytical value.')::TEXT AS directive_text,
      'REDUNDANT_HIDE'::TEXT AS source_field_action,
      COUNT(*)::INT AS occurrence_count
    FROM extracted_redundant
    GROUP BY field_name
  )
  SELECT * FROM redundant_counts
  ORDER BY occurrence_count DESC
  LIMIT limit_num;
$$;
