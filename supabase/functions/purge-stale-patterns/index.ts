import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for mode
    let purgeAll = false;
    try {
      const body = await req.json();
      purgeAll = body.purgeAll === true;
    } catch {}

    const results: Record<string, number> = {};

    if (purgeAll) {
      // Full purge via database function (bypasses PostgREST statement timeout)
      console.log('[purge] FULL PURGE MODE - calling purge_all_historical_patterns()');
      
      const { data, error } = await supabase.rpc('purge_all_historical_patterns');
      
      if (error) {
        console.error('[purge] RPC error:', error);
        throw new Error(`Purge RPC failed: ${error.message}`);
      }
      
      console.log('[purge] RPC result:', data);
      
      return new Response(JSON.stringify({ 
        success: true, 
        totalPurged: data?.deleted_patterns || 0,
        method: 'rpc_purge_all'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      // Legacy mode: only purge specific stale patterns
      const patternsToDelete = [
        'Donchian Breakout (Long)',
        'Donchian Breakout (Short)',
        'Ascending Triangle',
        'Descending Triangle',
        'Bull Flag',
        'Bear Flag',
        'Cup & Handle',
      ];

      for (const pattern of patternsToDelete) {
        console.log(`[purge] Deleting pattern: ${pattern}`);
        let totalDeleted = 0;
        let batchDeleted = 0;
        do {
          const { data, error } = await supabase
            .from('historical_pattern_occurrences')
            .delete()
            .eq('pattern_name', pattern)
            .limit(500)
            .select('id');
          if (error) { console.error(`[purge] Error deleting ${pattern}:`, error); break; }
          batchDeleted = data?.length || 0;
          totalDeleted += batchDeleted;
          if (batchDeleted > 0) console.log(`[purge] ${pattern}: +${batchDeleted} (total: ${totalDeleted})`);
        } while (batchDeleted === 500);
        results[pattern] = totalDeleted;
      }

      const { error: cacheError } = await supabase
        .from('outcome_analytics_cache')
        .delete()
        .in('pattern_name', patternsToDelete);
      if (cacheError) console.error('[purge] Cache clear error:', cacheError);
    }

    const totalPurged = Object.values(results).reduce((a, b) => a + b, 0);
    console.log(`[purge] Complete. Total purged: ${totalPurged}`);

    return new Response(JSON.stringify({ 
      success: true, 
      totalPurged,
      byPattern: results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[purge] Fatal error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
