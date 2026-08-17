DO $$
DECLARE a record; b record;
BEGIN
  SELECT * INTO a FROM public.run_cell_validation(12,'2024-01-01',100,NULL,'next_open');
  SELECT * INTO b FROM public.run_cell_validation(12,'2024-01-01',100,NULL,'close');
  RAISE NOTICE 'next_open %, close %', a, b;
END $$;