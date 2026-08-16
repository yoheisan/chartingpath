WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) AS rn
  FROM public.master_plans
  WHERE is_active = true
)
UPDATE public.master_plans m
   SET is_active = false, updated_at = now()
  FROM ranked r
 WHERE m.id = r.id AND r.rn > 1;