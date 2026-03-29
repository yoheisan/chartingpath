import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Database Maintenance Edge Function
 * 
 * Runs automated cleanup jobs to keep database size under control:
 * 1. pattern_pipeline_results — batch-delete rows older than 7 days (10k per loop)
 * 2. net._http_response — purge logs older than 24 hours
 * 3. historical_prices — remove duplicate rows
 * 
 * Each cleanup runs independently — one failure won't block others.
 * Safe to call repeatedly; the next run picks up where the last left off.
 * 
 * Designed to be called by pg_cron daily at 03:00 UTC (before seeding window).
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[db-maintenance] Starting database maintenance...');

    // Run the master cleanup function (each sub-task is error-isolated)
    const { data, error } = await supabase.rpc('run_database_maintenance');

    if (error) {
      console.error('[db-maintenance] RPC error:', error);
      throw new Error(`Maintenance RPC failed: ${error.message}`);
    }

    console.log('[db-maintenance] Results:', JSON.stringify(data));

    // Log the event for monitoring
    await supabase.from('analytics_events').insert({
      event_name: 'db_maintenance_completed',
      properties: data,
    });

    return new Response(JSON.stringify({
      success: true,
      ...data,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[db-maintenance] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
