
-- ============================================================
-- WORKER COORDINATION INFRASTRUCTURE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.worker_runs (
  worker_name         TEXT PRIMARY KEY,
  status              TEXT NOT NULL DEFAULT 'idle',
  last_watermark      TIMESTAMPTZ,
  last_run_at         TIMESTAMPTZ,
  last_success_at     TIMESTAMPTZ,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  circuit_open_until  TIMESTAMPTZ,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT worker_runs_status_check CHECK (status IN ('idle', 'running', 'failed', 'circuit_open'))
);

INSERT INTO public.worker_runs (worker_name)
VALUES ('backfill-validation')
ON CONFLICT (worker_name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.update_worker_runs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_worker_runs_updated_at ON public.worker_runs;
CREATE TRIGGER trg_worker_runs_updated_at
  BEFORE UPDATE ON public.worker_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_worker_runs_updated_at();

ALTER TABLE public.worker_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "worker_runs_service_only" ON public.worker_runs;
CREATE POLICY "worker_runs_service_only"
  ON public.worker_runs
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

CREATE OR REPLACE FUNCTION public.worker_lock_key(p_worker_name TEXT)
RETURNS BIGINT LANGUAGE sql IMMUTABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT abs(hashtext(p_worker_name))::BIGINT
$$;

CREATE OR REPLACE FUNCTION public.acquire_worker_lock(p_worker_name TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN pg_try_advisory_lock(public.worker_lock_key(p_worker_name));
END;
$$;

CREATE OR REPLACE FUNCTION public.release_worker_lock(p_worker_name TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM pg_advisory_unlock(public.worker_lock_key(p_worker_name));
END;
$$;

CREATE OR REPLACE FUNCTION public.check_worker_can_run(
  p_worker_name         TEXT,
  p_seeding_start_utc   INT DEFAULT 5,
  p_seeding_end_utc     INT DEFAULT 12
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row      public.worker_runs%ROWTYPE;
  v_hour_utc INT;
BEGIN
  SELECT * INTO v_row FROM public.worker_runs WHERE worker_name = p_worker_name;

  IF NOT FOUND THEN
    INSERT INTO public.worker_runs (worker_name) VALUES (p_worker_name);
    RETURN jsonb_build_object('can_run', true, 'reason', 'new_worker');
  END IF;

  IF v_row.status = 'running' AND v_row.last_run_at > now() - INTERVAL '5 minutes' THEN
    RETURN jsonb_build_object(
      'can_run', false, 'reason', 'already_running',
      'last_run_at', v_row.last_run_at
    );
  END IF;

  IF v_row.circuit_open_until IS NOT NULL AND v_row.circuit_open_until > now() THEN
    RETURN jsonb_build_object(
      'can_run', false, 'reason', 'circuit_open',
      'circuit_open_until', v_row.circuit_open_until,
      'consecutive_failures', v_row.consecutive_failures,
      'retry_after_seconds', EXTRACT(EPOCH FROM (v_row.circuit_open_until - now()))::INT
    );
  END IF;

  v_hour_utc := EXTRACT(HOUR FROM now() AT TIME ZONE 'UTC')::INT;
  IF v_hour_utc >= p_seeding_start_utc AND v_hour_utc < p_seeding_end_utc THEN
    RETURN jsonb_build_object(
      'can_run', false, 'reason', 'seeding_window',
      'utc_hour', v_hour_utc,
      'message', format('Seeding runs %s:00-%s:00 UTC. Validation paused.', p_seeding_start_utc, p_seeding_end_utc)
    );
  END IF;

  RETURN jsonb_build_object(
    'can_run', true, 'reason', 'ok',
    'last_watermark', v_row.last_watermark,
    'consecutive_failures', v_row.consecutive_failures
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_worker_running(p_worker_name TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.worker_runs (worker_name, status, last_run_at)
  VALUES (p_worker_name, 'running', now())
  ON CONFLICT (worker_name) DO UPDATE SET
    status      = 'running',
    last_run_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.record_worker_success(
  p_worker_name    TEXT,
  p_new_watermark  TIMESTAMPTZ DEFAULT NULL,
  p_metadata       JSONB       DEFAULT '{}'::jsonb
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.worker_runs SET
    status               = 'idle',
    consecutive_failures = 0,
    circuit_open_until   = NULL,
    last_success_at      = now(),
    last_watermark       = COALESCE(p_new_watermark, last_watermark),
    metadata             = metadata || p_metadata
  WHERE worker_name = p_worker_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_worker_failure(
  p_worker_name        TEXT,
  p_error              TEXT DEFAULT 'unknown',
  p_circuit_threshold  INT  DEFAULT 3,
  p_circuit_open_mins  INT  DEFAULT 30
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_failures   INT;
  v_open_until TIMESTAMPTZ;
BEGIN
  UPDATE public.worker_runs SET
    consecutive_failures = consecutive_failures + 1,
    status = CASE
      WHEN consecutive_failures + 1 >= p_circuit_threshold THEN 'circuit_open'
      ELSE 'failed'
    END,
    circuit_open_until = CASE
      WHEN consecutive_failures + 1 >= p_circuit_threshold
        THEN now() + (p_circuit_open_mins || ' minutes')::INTERVAL
      ELSE circuit_open_until
    END,
    metadata = metadata || jsonb_build_object(
      'last_error', p_error,
      'last_error_at', now()
    )
  WHERE worker_name = p_worker_name
  RETURNING consecutive_failures, circuit_open_until
    INTO v_failures, v_open_until;

  RETURN jsonb_build_object(
    'consecutive_failures', v_failures,
    'circuit_open', v_open_until IS NOT NULL AND v_open_until > now(),
    'circuit_open_until', v_open_until
  );
END;
$$;
