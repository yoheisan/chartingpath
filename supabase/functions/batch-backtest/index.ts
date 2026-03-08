import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PROJECTS_RUN_URL = `${SUPABASE_URL}/functions/v1/projects-run/run`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchItem {
  instrument: string;
  pattern_id: string;
  timeframe: string;
  composite_score?: number;
  verdict?: string;
}

interface BatchRequest {
  items?: BatchItem[];
  verdict_filter?: 'TAKE' | 'WATCH';
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await userClient.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const body: BatchRequest = await req.json();

  let items: BatchItem[] = [];

  if (body.items && body.items.length > 0) {
    items = body.items.slice(0, 10);
  } else if (body.verdict_filter) {
    const limit = Math.min(body.limit ?? 5, 10);
    const { data: scores } = await supabase
      .from('agent_scores')
      .select('instrument, pattern_id, timeframe, composite_score, verdict')
      .eq('verdict', body.verdict_filter)
      .order('composite_score', { ascending: false })
      .limit(limit);
    items = (scores ?? []).map((s: any) => ({
      instrument: s.instrument,
      pattern_id: s.pattern_id,
      timeframe: s.timeframe,
      composite_score: s.composite_score,
      verdict: s.verdict,
    }));
  }

  if (items.length === 0) {
    return new Response(JSON.stringify({ error: 'No items to process' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: queueRows, error: insertError } = await supabase
    .from('backtest_queue')
    .insert(
      items.map((item) => ({
        user_id: user.id,
        instrument: item.instrument,
        pattern_id: item.pattern_id,
        timeframe: item.timeframe,
        composite_score: item.composite_score ?? null,
        verdict: item.verdict ?? null,
        status: 'queued',
      }))
    )
    .select('id, instrument, pattern_id, timeframe');

  if (insertError || !queueRows) {
    return new Response(JSON.stringify({ error: 'Failed to insert queue rows', detail: insertError?.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results: Array<{ id: string; instrument: string; status: string; run_id?: string; error?: string }> = [];

  for (const row of queueRows) {
    await supabase
      .from('backtest_queue')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', row.id);

    try {
      const payload = {
        projectType: 'pattern_lab',
        inputs: {
          instruments: [row.instrument],
          patterns: [row.pattern_id],
          instrumentPatternMap: { [row.instrument]: [row.pattern_id] },
          timeframe: row.timeframe,
          lookbackYears: 2,
          gradeFilter: ['A', 'B', 'C'],
          riskPerTrade: 1,
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      const response = await fetch(PROJECTS_RUN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const runId: string = data.runId;

      await supabase
        .from('backtest_queue')
        .update({ run_id: runId })
        .eq('id', row.id);

      results.push({ id: row.id, instrument: row.instrument, status: 'running', run_id: runId });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await supabase
        .from('backtest_queue')
        .update({ status: 'failed', error_message: message, completed_at: new Date().toISOString() })
        .eq('id', row.id);

      results.push({ id: row.id, instrument: row.instrument, status: 'failed', error: message });
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return new Response(
    JSON.stringify({ queued: queueRows.length, results }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
