import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PartitionConfig {
  assetTypes: string[];
  stockLetterFilter?: { start: string; end: string };
}

const PARTITION_CONFIG: Record<string, PartitionConfig> = {
  'stocks_ag': {
    assetTypes: ['stocks'],
    stockLetterFilter: { start: 'A', end: 'G' },
  },
  'stocks_ho': {
    assetTypes: ['stocks'],
    stockLetterFilter: { start: 'H', end: 'O' },
  },
  'stocks_pz': {
    assetTypes: ['stocks'],
    stockLetterFilter: { start: 'P', end: 'Z' },
  },
  'fx': { assetTypes: ['fx'] },
  'crypto': { assetTypes: ['crypto'] },
  'commodities': { assetTypes: ['commodities'] },
  'indices': { assetTypes: ['indices'] },
  'etfs': { assetTypes: ['etfs'] },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { partition, offset = 0, timeframes = ['1d', '1wk'], maxOffset = 300 } = await req.json();

    if (!partition) {
      return new Response(JSON.stringify({ error: 'partition is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const config = PARTITION_CONFIG[partition];
    if (!config) {
      return new Response(JSON.stringify({ error: `Unknown partition: ${partition}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const page = Math.floor(offset / 10) + 1;
    const totalPages = Math.floor(maxOffset / 10) + 1;
    console.log(`[backfill-orchestrator] Page ${page} of ${totalPages} — partition=${partition}, offset=${offset}`);

    let totalInserted = 0;
    const errors: string[] = [];

    // Call seed-historical-patterns-mtf DIRECTLY for each timeframe
    for (const timeframe of timeframes) {
      console.log(`[backfill-orchestrator] ${partition}@${timeframe} offset=${offset}`);

      const body: Record<string, unknown> = {
        timeframe,
        assetTypes: config.assetTypes,
        maxInstrumentsPerType: 10,
        offset,
        dryRun: false,
        incrementalMode: false,
        forceFullBackfill: true,
        skipDbCache: true,
      };

      if (config.stockLetterFilter) {
        body.stockLetterFilter = config.stockLetterFilter;
      }

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/seed-historical-patterns-mtf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (data.success) {
          const inserted = data.summary?.insertedCount || 0;
          totalInserted += inserted;
          console.log(`[backfill-orchestrator] ${partition}@${timeframe} offset=${offset} — inserted ${inserted}`);
        } else {
          const err = data.error || 'Unknown error';
          errors.push(`${timeframe}: ${err}`);
          console.error(`[backfill-orchestrator] ${partition}@${timeframe} failed:`, err);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'fetch error';
        errors.push(`${timeframe}: ${msg}`);
        console.error(`[backfill-orchestrator] ${partition}@${timeframe} exception:`, msg);
      }

      // 2s delay between timeframes
      if (timeframes.indexOf(timeframe) < timeframes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`[backfill-orchestrator] Page ${page} of ${totalPages} complete — inserted: ${totalInserted}`);

    // Schedule next page if within bounds
    const nextOffset = offset + 10;
    let scheduled = false;

    if (nextOffset <= maxOffset) {
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8';

      const nextBody = JSON.stringify({
        partition,
        offset: nextOffset,
        timeframes,
        maxOffset,
      });

      // Schedule via pg_net with 2-minute delay
      const { error: scheduleError } = await supabase.rpc('schedule_backfill_page', {
        p_url: `${supabaseUrl}/functions/v1/backfill-orchestrator`,
        p_headers: JSON.stringify({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        }),
        p_body: nextBody,
        p_delay_minutes: 2,
      });

      if (scheduleError) {
        console.warn(`[backfill-orchestrator] pg_net schedule failed, using direct delayed call:`, scheduleError.message);

        // Wait 2 minutes then call directly
        await new Promise(resolve => setTimeout(resolve, 120_000));

        fetch(`${supabaseUrl}/functions/v1/backfill-orchestrator`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: nextBody,
        }).catch(e => console.error('[backfill-orchestrator] Fallback self-call failed:', e));
      }

      scheduled = true;
      console.log(`[backfill-orchestrator] Scheduled next page ${page + 1} of ${totalPages} (offset=${nextOffset})`);
    } else {
      console.log(`[backfill-orchestrator] ✅ Partition ${partition} COMPLETE — all ${totalPages} pages processed`);
    }

    return new Response(JSON.stringify({
      success: true,
      partition,
      page,
      totalPages,
      offset,
      nextOffset: scheduled ? nextOffset : null,
      totalInserted,
      errors: errors.length > 0 ? errors : undefined,
      complete: !scheduled,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[backfill-orchestrator] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
