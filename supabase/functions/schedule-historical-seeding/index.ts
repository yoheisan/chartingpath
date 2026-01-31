import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All timeframes to seed historical patterns for
const TIMEFRAMES = ['1h', '4h', '1d', '1wk'];

// All asset types to process
const ASSET_TYPES = ['fx', 'crypto', 'stocks', 'commodities', 'indices', 'etfs'];

interface SeedResult {
  timeframe: string;
  success: boolean;
  insertedCount: number;
  errors: string[];
  durationMs: number;
}

/**
 * Orchestrates multi-timeframe historical pattern seeding
 * This function triggers seed-historical-patterns-mtf for each timeframe
 * and processes all instruments in batches via pagination
 */
async function seedTimeframe(
  supabaseUrl: string,
  supabaseKey: string,
  timeframe: string,
  assetTypes: string[]
): Promise<SeedResult> {
  const startTime = Date.now();
  let totalInserted = 0;
  const allErrors: string[] = [];
  
  try {
    console.log(`[schedule-historical-seeding] Starting ${timeframe} seeding`);
    
    let offset = 0;
    let hasMore = true;
    
    // Process all instruments in batches (pagination)
    while (hasMore) {
      console.log(`[schedule-historical-seeding] ${timeframe} batch at offset ${offset}`);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/seed-historical-patterns-mtf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          timeframe,
          assetTypes,
          maxInstrumentsPerType: 25,
          offset,
          dryRun: false,
          incrementalMode: true, // Only fetch new data since last seed
          forceFullBackfill: false
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown seeding error');
      }
      
      totalInserted += data.summary?.insertedCount || 0;
      
      if (data.errors?.length) {
        allErrors.push(...data.errors);
      }
      
      hasMore = data.hasMore === true;
      offset = data.nextOffset || 0;
      
      console.log(`[schedule-historical-seeding] ${timeframe} batch done: ${data.summary?.insertedCount || 0} inserted, hasMore=${hasMore}`);
      
      // Delay between batches
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    const durationMs = Date.now() - startTime;
    console.log(`[schedule-historical-seeding] ${timeframe} complete: ${totalInserted} patterns in ${durationMs}ms`);
    
    return {
      timeframe,
      success: true,
      insertedCount: totalInserted,
      errors: allErrors.slice(0, 10),
      durationMs
    };
    
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error(`[schedule-historical-seeding] ${timeframe} failed:`, error.message);
    
    return {
      timeframe,
      success: false,
      insertedCount: totalInserted,
      errors: [error.message, ...allErrors.slice(0, 9)],
      durationMs
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
    
    // Parse optional parameters
    let targetTimeframes = TIMEFRAMES;
    let targetAssetTypes = ASSET_TYPES;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.timeframes?.length) targetTimeframes = body.timeframes;
        if (body.assetTypes?.length) targetAssetTypes = body.assetTypes;
      } catch {}
    }
    
    console.log(`[schedule-historical-seeding] Starting multi-TF seeding`);
    console.log(`[schedule-historical-seeding] Timeframes: ${targetTimeframes.join(', ')}`);
    console.log(`[schedule-historical-seeding] Asset Types: ${targetAssetTypes.join(', ')}`);
    
    const results: SeedResult[] = [];
    
    // Process each timeframe sequentially (too resource-intensive for parallel)
    for (const timeframe of targetTimeframes) {
      console.log(`[schedule-historical-seeding] === Processing ${timeframe} ===`);
      const result = await seedTimeframe(supabaseUrl, supabaseKey, timeframe, targetAssetTypes);
      results.push(result);
      
      // Delay between timeframes
      if (targetTimeframes.indexOf(timeframe) < targetTimeframes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Calculate summary
    const totalInserted = results.reduce((sum, r) => sum + r.insertedCount, 0);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const totalDurationMs = Date.now() - startTime;
    
    console.log(`[schedule-historical-seeding] === ALL COMPLETE ===`);
    console.log(`[schedule-historical-seeding] Duration: ${(totalDurationMs / 1000 / 60).toFixed(1)} minutes`);
    console.log(`[schedule-historical-seeding] Timeframes: ${successCount} succeeded, ${failCount} failed`);
    console.log(`[schedule-historical-seeding] Total patterns: ${totalInserted}`);
    
    // Log to analytics
    try {
      await supabase.from('analytics_events').insert({
        event_name: 'historical_pattern_seeding_complete',
        properties: {
          timeframes: targetTimeframes,
          assetTypes: targetAssetTypes,
          totalInserted,
          successCount,
          failCount,
          durationMs: totalDurationMs,
          resultsByTimeframe: results.map(r => ({
            timeframe: r.timeframe,
            success: r.success,
            inserted: r.insertedCount
          }))
        }
      });
    } catch (e) {
      console.warn('[schedule-historical-seeding] Failed to log analytics:', e);
    }
    
    return new Response(JSON.stringify({
      success: failCount === 0,
      summary: {
        totalTimeframes: results.length,
        successCount,
        failCount,
        totalInserted,
        durationMinutes: (totalDurationMs / 1000 / 60).toFixed(1)
      },
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('[schedule-historical-seeding] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
