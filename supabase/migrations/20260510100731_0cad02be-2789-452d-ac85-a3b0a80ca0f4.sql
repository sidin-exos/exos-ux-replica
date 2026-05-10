update public.industry_contexts
set constraints_v2 = (
  select jsonb_agg(
    case
      when (c->>'tier') = 'CRITICAL' then jsonb_set(c, '{tier}', '"HIGH"'::jsonb, false)
      else c
    end
  )
  from jsonb_array_elements(constraints_v2) c
)
where constraints_v2 is not null
  and exists (
    select 1 from jsonb_array_elements(constraints_v2) c where c->>'tier' = 'CRITICAL'
  );