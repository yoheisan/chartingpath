/**
 * Batch Compute Multi-R:R Outcomes
 * 
 * Processes historical pattern occurrences and computes outcomes for 
 * different R:R tiers (3, 4, 5) using the embedded bar data.
 * 
 * Baseline R:R 2 outcomes already exist in the database.
 * This function fills in the rr3, rr4, rr5 columns.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OHLCBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface PatternRecord {
  id: string;
  direction: string;
  entry_price: number;
  stop_loss_price: number;
  bars: OHLCBar[];
}

interface OutcomeResult {
  outcome: 'hit_tp' | 'hit_sl' | 'timeout';
  pnlPercent: number;
  barsToOutcome: number;
}

const RR_TIERS = [3, 4, 5] as const;
const MAX_BARS_IN_TRADE = 100;

/**
 * Simulate outcome for a given R:R tier
 */
function simulateOutcome(
  record: PatternRecord,
  rrTier: number
): OutcomeResult {
  const { direction, entry_price, stop_loss_price, bars } = record;
  const isLong = direction === 'bullish' || direction === 'long';
  
  // Calculate stop distance and new take profit
  const stopDistance = Math.abs(entry_price - stop_loss_price);
  const tpDistance = stopDistance * rrTier;
  
  const takeProfitPrice = isLong 
    ? entry_price + tpDistance 
    : entry_price - tpDistance;
  
  // Find entry bar index (first bar after pattern, typically index 0 of post-pattern bars)
  // The bars array contains bars starting from pattern formation through outcome
  // We simulate from bar 1 onwards (bar 0 is entry)
  
  for (let i = 1; i < Math.min(bars.length, MAX_BARS_IN_TRADE); i++) {
    const bar = bars[i];
    
    if (isLong) {
      // Long: Check if SL hit first (low touches SL), then if TP hit (high touches TP)
      if (bar.low <= stop_loss_price) {
        const pnl = ((stop_loss_price - entry_price) / entry_price) * 100;
        return { outcome: 'hit_sl', pnlPercent: pnl, barsToOutcome: i };
      }
      if (bar.high >= takeProfitPrice) {
        const pnl = ((takeProfitPrice - entry_price) / entry_price) * 100;
        return { outcome: 'hit_tp', pnlPercent: pnl, barsToOutcome: i };
      }
    } else {
      // Short: Check if SL hit first (high touches SL), then if TP hit (low touches TP)
      if (bar.high >= stop_loss_price) {
        const pnl = ((entry_price - stop_loss_price) / entry_price) * 100;
        return { outcome: 'hit_sl', pnlPercent: pnl, barsToOutcome: i };
      }
      if (bar.low <= takeProfitPrice) {
        const pnl = ((entry_price - takeProfitPrice) / entry_price) * 100;
        return { outcome: 'hit_tp', pnlPercent: pnl, barsToOutcome: i };
      }
    }
  }
  
  // Timeout - use last bar's close
  const lastBar = bars[Math.min(bars.length - 1, MAX_BARS_IN_TRADE - 1)];
  const exitPrice = lastBar?.close ?? entry_price;
  const pnl = isLong
    ? ((exitPrice - entry_price) / entry_price) * 100
    : ((entry_price - exitPrice) / entry_price) * 100;
  
  return { 
    outcome: 'timeout', 
    pnlPercent: pnl, 
    barsToOutcome: Math.min(bars.length - 1, MAX_BARS_IN_TRADE) 
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse optional parameters
    const url = new URL(req.url);
    const batchSize = parseInt(url.searchParams.get('batchSize') || '500');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const forceRecompute = url.searchParams.get('force') === 'true';

    console.log(`[compute-multi-rr] Starting batch: offset=${offset}, batchSize=${batchSize}, force=${forceRecompute}`);

    // Fetch records that haven't been computed yet (or all if force)
    let query = supabase
      .from('historical_pattern_occurrences')
      .select('id, direction, entry_price, stop_loss_price, bars')
      .order('created_at', { ascending: true })
      .range(offset, offset + batchSize - 1);
    
    if (!forceRecompute) {
      query = query.is('multi_rr_computed_at', null);
    }

    const { data: records, error: fetchError } = await query;

    if (fetchError) {
      console.error('[compute-multi-rr] Fetch error:', fetchError);
      throw fetchError;
    }

    if (!records || records.length === 0) {
      console.log('[compute-multi-rr] No records to process');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No records to process',
        processed: 0,
        offset 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[compute-multi-rr] Processing ${records.length} records`);

    let processedCount = 0;
    let errorCount = 0;
    const updates: any[] = [];

    for (const record of records) {
      try {
        // Validate record has required data
        if (!record.bars || !Array.isArray(record.bars) || record.bars.length < 2) {
          console.warn(`[compute-multi-rr] Skipping ${record.id}: insufficient bar data`);
          errorCount++;
          continue;
        }

        const updateData: any = {
          multi_rr_computed_at: new Date().toISOString(),
        };

        // Compute outcomes for each R:R tier
        for (const rrTier of RR_TIERS) {
          const result = simulateOutcome(record as PatternRecord, rrTier);
          updateData[`outcome_rr${rrTier}`] = result.outcome;
          updateData[`outcome_pnl_percent_rr${rrTier}`] = result.pnlPercent;
          updateData[`bars_to_outcome_rr${rrTier}`] = result.barsToOutcome;
        }

        updates.push({ id: record.id, ...updateData });
        processedCount++;

      } catch (err) {
        console.error(`[compute-multi-rr] Error processing ${record.id}:`, err);
        errorCount++;
      }
    }

    // Batch update all records
    if (updates.length > 0) {
      // Process in smaller batches to avoid timeout
      const UPDATE_BATCH_SIZE = 100;
      for (let i = 0; i < updates.length; i += UPDATE_BATCH_SIZE) {
        const batch = updates.slice(i, i + UPDATE_BATCH_SIZE);
        
        for (const update of batch) {
          const { id, ...data } = update;
          const { error: updateError } = await supabase
            .from('historical_pattern_occurrences')
            .update(data)
            .eq('id', id);
          
          if (updateError) {
            console.error(`[compute-multi-rr] Update error for ${id}:`, updateError);
            errorCount++;
            processedCount--;
          }
        }
      }
    }

    const response = {
      success: true,
      processed: processedCount,
      errors: errorCount,
      offset,
      nextOffset: offset + batchSize,
      hasMore: records.length === batchSize,
    };

    console.log(`[compute-multi-rr] Completed:`, response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[compute-multi-rr] Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
