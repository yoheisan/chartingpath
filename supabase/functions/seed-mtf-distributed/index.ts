import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Distributed Multi-Timeframe Pattern Seeding Scheduler
 * 
 * This function is called by multiple staggered cron jobs throughout the day,
 * each targeting a specific partition of the instrument universe.
 * 
 * Partitions:
 * - stocks_ag: Stocks A-G (~180 symbols)
 * - stocks_ho: Stocks H-O (~180 symbols)
 * - stocks_pz: Stocks P-Z (~180 symbols)
 * - fx: All FX pairs (~100 symbols)
 * - crypto: All cryptocurrencies (~100 symbols)
 * - commodities: All commodities (~50 symbols)
 * - indices: All indices (~30 symbols)
 * - etfs: All ETFs (~100 symbols)
 * 
 * Each partition runs at a different hour to avoid API rate limits.
 */

interface PartitionConfig {
  assetTypes: string[];
  stockLetterFilter?: { start: string; end: string };
  batchSize: number;
}

const PARTITIONS: Record<string, PartitionConfig> = {
  'stocks_ag': {
    assetTypes: ['stocks'],
    stockLetterFilter: { start: 'A', end: 'G' },
    batchSize: 50
  },
  'stocks_ho': {
    assetTypes: ['stocks'],
    stockLetterFilter: { start: 'H', end: 'O' },
    batchSize: 50
  },
  'stocks_pz': {
    assetTypes: ['stocks'],
    stockLetterFilter: { start: 'P', end: 'Z' },
    batchSize: 50
  },
  'fx': {
    assetTypes: ['fx'],
    batchSize: 30
  },
  'crypto': {
    assetTypes: ['crypto'],
    batchSize: 30
  },
  'commodities': {
    assetTypes: ['commodities'],
    batchSize: 25
  },
  'indices': {
    assetTypes: ['indices'],
    batchSize: 25
  },
  'etfs': {
    assetTypes: ['etfs'],
    batchSize: 30
  }
};

const TIMEFRAMES = ['1h', '4h', '1d', '1wk'];

async function runPartitionSeeding(
  supabaseUrl: string,
  supabaseKey: string,
  partition: string,
  config: PartitionConfig,
  timeframe: string
): Promise<{ success: boolean; inserted: number; errors: string[] }> {
  const allErrors: string[] = [];
  let totalInserted = 0;
  let offset = 0;
  let hasMore = true;

  try {
    console.log(`[seed-distributed] Starting ${partition} @ ${timeframe}`);

    while (hasMore) {
      const body: Record<string, unknown> = {
        timeframe,
        assetTypes: config.assetTypes,
        maxInstrumentsPerType: config.batchSize,
        offset,
        dryRun: false,
        incrementalMode: true,
        forceFullBackfill: false
      };

      // Add stock letter filter if applicable
      if (config.stockLetterFilter) {
        body.stockLetterFilter = config.stockLetterFilter;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/seed-historical-patterns-mtf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        allErrors.push(data.error || 'Unknown seeding error');
        break;
      }

      totalInserted += data.summary?.insertedCount || 0;

      if (data.errors?.length) {
        allErrors.push(...data.errors.slice(0, 5));
      }

      hasMore = data.hasMore === true;
      offset = data.nextOffset || 0;

      console.log(`[seed-distributed] ${partition}@${timeframe} batch: +${data.summary?.insertedCount || 0}, total=${totalInserted}, hasMore=${hasMore}`);

      // Rate limit between batches
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    return { success: true, inserted: totalInserted, errors: allErrors };

  } catch (error) {
    console.error(`[seed-distributed] ${partition}@${timeframe} failed:`, error);
    return {
      success: false,
      inserted: totalInserted,
      errors: [error instanceof Error ? error.message : 'Unknown error', ...allErrors]
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request parameters
    let partition = 'all';
    let targetTimeframes = TIMEFRAMES;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.partition) partition = body.partition;
        if (body.timeframes?.length) targetTimeframes = body.timeframes;
      } catch {}
    }

    // Determine which partitions to process
    const partitionsToProcess = partition === 'all' 
      ? Object.keys(PARTITIONS)
      : [partition];

    console.log(`[seed-distributed] Starting distributed seeding`);
    console.log(`[seed-distributed] Partitions: ${partitionsToProcess.join(', ')}`);
    console.log(`[seed-distributed] Timeframes: ${targetTimeframes.join(', ')}`);

    const results: Array<{
      partition: string;
      timeframe: string;
      success: boolean;
      inserted: number;
      errors: string[];
    }> = [];

    // Process each partition
    for (const partitionName of partitionsToProcess) {
      const config = PARTITIONS[partitionName];
      if (!config) {
        console.warn(`[seed-distributed] Unknown partition: ${partitionName}`);
        continue;
      }

      // Process each timeframe for this partition
      for (const timeframe of targetTimeframes) {
        const result = await runPartitionSeeding(
          supabaseUrl,
          supabaseKey,
          partitionName,
          config,
          timeframe
        );

        results.push({
          partition: partitionName,
          timeframe,
          ...result
        });

        // Delay between timeframes
        if (targetTimeframes.indexOf(timeframe) < targetTimeframes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      // Delay between partitions
      if (partitionsToProcess.indexOf(partitionName) < partitionsToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // Calculate summary
    const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const durationMs = Date.now() - startTime;

    console.log(`[seed-distributed] === COMPLETE ===`);
    console.log(`[seed-distributed] Duration: ${(durationMs / 1000 / 60).toFixed(1)} minutes`);
    console.log(`[seed-distributed] Jobs: ${successCount} succeeded, ${failCount} failed`);
    console.log(`[seed-distributed] Total patterns: ${totalInserted}`);

    // Log analytics event
    try {
      await supabase.from('analytics_events').insert({
        event_name: 'distributed_mtf_seeding_complete',
        properties: {
          partition,
          timeframes: targetTimeframes,
          totalInserted,
          successCount,
          failCount,
          durationMs,
          results: results.map(r => ({
            partition: r.partition,
            timeframe: r.timeframe,
            success: r.success,
            inserted: r.inserted
          }))
        }
      });
    } catch (e) {
      console.warn('[seed-distributed] Failed to log analytics:', e);
    }

    return new Response(JSON.stringify({
      success: failCount === 0,
      summary: {
        partition,
        partitionsProcessed: partitionsToProcess.length,
        timeframesProcessed: targetTimeframes.length,
        totalJobsRun: results.length,
        successCount,
        failCount,
        totalInserted,
        durationMinutes: (durationMs / 1000 / 60).toFixed(1)
      },
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[seed-distributed] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
