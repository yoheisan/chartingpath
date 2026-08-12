GRANT EXECUTE ON FUNCTION public.recompute_outcomes_at_rr(numeric, integer, date, uuid[]) TO postgres;
GRANT EXECUTE ON FUNCTION public.recompute_outcomes_atr(numeric, integer, date, uuid[]) TO postgres;
GRANT EXECUTE ON FUNCTION public.recompute_multi_rr_batch(integer, date, boolean) TO postgres;