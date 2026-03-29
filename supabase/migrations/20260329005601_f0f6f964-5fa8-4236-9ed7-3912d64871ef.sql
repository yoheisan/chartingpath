-- Drop old functions with integer return types
drop function if exists public.cleanup_pattern_pipeline_results(integer);
drop function if exists public.cleanup_stale_historical_prices(integer);
drop function if exists public.run_database_maintenance();

-- Fix 1: Batch delete for cleanup_pattern_pipeline_results (returns jsonb)
create or replace function cleanup_pattern_pipeline_results(keep_days integer default 7)
returns jsonb
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  deleted_count integer := 0;
  batch_size integer := 10000;
  batch_deleted integer;
begin
  loop
    delete from public.pattern_pipeline_results
    where id in (
      select id
      from public.pattern_pipeline_results
      where created_at < now() - (keep_days || ' days')::interval
      limit batch_size
    );

    get diagnostics batch_deleted = row_count;
    deleted_count := deleted_count + batch_deleted;
    exit when batch_deleted = 0;
    perform pg_sleep(0.1);
  end loop;

  return jsonb_build_object(
    'deleted', deleted_count,
    'table', 'pattern_pipeline_results',
    'keep_days', keep_days
  );
end;
$$;

-- Fix 2: Batch delete for cleanup_stale_historical_prices (returns jsonb)
create or replace function cleanup_stale_historical_prices(keep_days integer default 90)
returns jsonb
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  deleted_count integer := 0;
  batch_size integer := 5000;
  batch_deleted integer;
begin
  loop
    delete from public.historical_prices
    where id in (
      select id from (
        select id, row_number() over (
          partition by symbol, timeframe, date
          order by updated_at desc nulls last, created_at desc nulls last
        ) as rn
        from public.historical_prices
      ) dupes
      where rn > 1
      limit batch_size
    );
    get diagnostics batch_deleted = row_count;
    deleted_count := deleted_count + batch_deleted;
    exit when batch_deleted < batch_size;
    perform pg_sleep(0.1);
  end loop;

  return jsonb_build_object(
    'deleted', deleted_count,
    'table', 'historical_prices'
  );
end;
$$;

-- Fix 3: Independent cleanup calls with error isolation
create or replace function run_database_maintenance()
returns jsonb
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  pipeline_result jsonb;
  http_result jsonb;
  prices_result jsonb;
begin
  begin
    select cleanup_http_response_logs(24) into http_result;
    http_result := jsonb_build_object('deleted', http_result);
  exception when others then
    http_result := jsonb_build_object('error', sqlerrm);
  end;

  begin
    select cleanup_pattern_pipeline_results(7) into pipeline_result;
  exception when others then
    pipeline_result := jsonb_build_object('error', sqlerrm, 'note', 'Will retry on next run');
  end;

  begin
    select cleanup_stale_historical_prices(90) into prices_result;
  exception when others then
    prices_result := jsonb_build_object('error', sqlerrm);
  end;

  return jsonb_build_object(
    'http_response', http_result,
    'pipeline_results', pipeline_result,
    'historical_prices', prices_result,
    'ran_at', now()
  );
end;
$$;