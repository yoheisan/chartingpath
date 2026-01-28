import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  calculateMACD,
  calculateRSI,
  calculateADX,
  getLastEMA,
  type TrendIndicators,
  type TrendAlignment,
  type OHLCBar
} from "../_shared/trendIndicators.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Simplified trend analysis that works with limited bars (35+ minimum).
 * Uses MACD, RSI, and ADX - but skips 200 EMA which requires 200 bars.
 * Returns a trend alignment based on available indicators.
 */
function analyzeWithLimitedBars(
  bars: OHLCBar[],
  direction: 'long' | 'short' | 'bullish' | 'bearish'
): { alignment: TrendAlignment; indicators: TrendIndicators } | null {
  // Minimum: 35 bars for MACD (26 slow + 9 signal)
  if (bars.length < 35) return null;
  
  const closes = bars.map(b => b.close);
  const currentPrice = closes[closes.length - 1];
  
  // Calculate available indicators
  const macd = calculateMACD(closes);
  const rsi = calculateRSI(closes);
  const adx = calculateADX(bars);
  
  // Try EMA if we have enough bars
  const ema50 = bars.length >= 50 ? getLastEMA(closes, 50) : null;
  const ema200 = bars.length >= 200 ? getLastEMA(closes, 200) : null;
  
  // Determine EMA trend (only if we have both)
  let emaTrend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (ema50 && ema200) {
    if (currentPrice > ema50 && ema50 > ema200) {
      emaTrend = 'bullish';
    } else if (currentPrice < ema50 && ema50 < ema200) {
      emaTrend = 'bearish';
    }
  } else if (ema50) {
    // If only 50 EMA available, use price position relative to it
    if (currentPrice > ema50 * 1.02) emaTrend = 'bullish';
    else if (currentPrice < ema50 * 0.98) emaTrend = 'bearish';
  }
  
  const indicators: TrendIndicators = {
    macd_signal: macd?.signal || 'neutral',
    ema_trend: emaTrend,
    rsi_zone: rsi?.zone || 'neutral',
    adx_strength: adx?.strength || 'weak',
    macd_value: macd?.macdLine,
    macd_signal_line: macd?.signalLine,
    macd_histogram: macd?.histogram,
    ema_50: ema50 || undefined,
    ema_200: ema200 || undefined,
    rsi_value: rsi?.value,
    adx_value: adx?.value
  };
  
  // Determine alignment using available signals
  const isLong = direction === 'long' || direction === 'bullish';
  
  let bullishCount = 0;
  let bearishCount = 0;
  
  // MACD signal (weight: 1.5 since we may not have EMA trend)
  if (indicators.macd_signal === 'bullish') bullishCount += 1.5;
  else if (indicators.macd_signal === 'bearish') bearishCount += 1.5;
  
  // EMA trend (weight: 1 if available, otherwise skip)
  if (indicators.ema_trend === 'bullish') bullishCount += 1;
  else if (indicators.ema_trend === 'bearish') bearishCount += 1;
  
  // RSI zone (weight: 0.5)
  if (indicators.rsi_zone === 'oversold') bullishCount += 0.5;
  else if (indicators.rsi_zone === 'overbought') bearishCount += 0.5;
  
  // ADX strength modifier
  const trendStrengthMod = indicators.adx_strength === 'weak' ? 0.5 : 1;
  bullishCount *= trendStrengthMod;
  bearishCount *= trendStrengthMod;
  
  // Determine alignment
  const marketBias = bullishCount > bearishCount ? 'bullish' : 
                     bearishCount > bullishCount ? 'bearish' : 'neutral';
  
  let alignment: TrendAlignment = 'neutral';
  if (marketBias !== 'neutral') {
    if ((isLong && marketBias === 'bullish') || (!isLong && marketBias === 'bearish')) {
      alignment = 'with_trend';
    } else {
      alignment = 'counter_trend';
    }
  }
  
  return { alignment, indicators };
}

/**
 * Backfill trend_alignment for historical_pattern_occurrences records
 * that have NULL trend_alignment values.
 * 
 * Uses the embedded 'bars' column from each record for analysis.
 * Falls back to simplified analysis if less than 200 bars available.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const {
      batchSize = 100,
      dryRun = false,
      symbolFilter = null,
      assetTypeFilter = null,
      limit = 1000
    } = body;

    console.log(`Starting trend alignment backfill: batch=${batchSize}, limit=${limit}, dryRun=${dryRun}`);

    // Query records with NULL trend_alignment, including embedded bars
    let query = supabase
      .from('historical_pattern_occurrences')
      .select('id, symbol, asset_type, detected_at, direction, bars')
      .is('trend_alignment', null)
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (symbolFilter) {
      query = query.eq('symbol', symbolFilter);
    }
    if (assetTypeFilter) {
      query = query.eq('asset_type', assetTypeFilter);
    }

    const { data: records, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch records: ${fetchError.message}`);
    }

    if (!records || records.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No records with NULL trend_alignment found',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${records.length} records to process`);

    let updated = 0;
    let skipped = 0;
    let errors: string[] = [];
    const updates: { id: string; alignment: TrendAlignment; indicators: TrendIndicators }[] = [];

    // Process each record using its embedded bars
    for (const record of records) {
      try {
        // Parse embedded bars from the record
        const embeddedBars: OHLCBar[] = Array.isArray(record.bars) 
          ? record.bars.map((b: any) => ({
              date: b.date,
              open: Number(b.open),
              high: Number(b.high),
              low: Number(b.low),
              close: Number(b.close),
              volume: b.volume ? Number(b.volume) : undefined
            }))
          : [];
        
        if (embeddedBars.length < 35) {
          // Need at least 35 bars for MACD
          skipped++;
          continue;
        }

        // Map direction from DB format to analysis format
        const direction = record.direction === 'bullish' ? 'long' : 
                         record.direction === 'bearish' ? 'short' : 
                         record.direction;

        // Use simplified analysis with available bars
        const trendResult = analyzeWithLimitedBars(embeddedBars, direction as 'long' | 'short');

        if (!trendResult) {
          skipped++;
          continue;
        }

        updates.push({
          id: record.id,
          alignment: trendResult.alignment,
          indicators: trendResult.indicators
        });

      } catch (recordError) {
        errors.push(`Record ${record.id}: ${recordError instanceof Error ? recordError.message : 'Unknown error'}`);
        skipped++;
      }
    }

    console.log(`Prepared ${updates.length} updates, skipped ${skipped}`);

    // Count by alignment type
    const alignmentCounts = {
      with_trend: updates.filter(u => u.alignment === 'with_trend').length,
      counter_trend: updates.filter(u => u.alignment === 'counter_trend').length,
      neutral: updates.filter(u => u.alignment === 'neutral').length
    };

    if (dryRun) {
      return new Response(JSON.stringify({
        dryRun: true,
        wouldUpdate: updates.length,
        skipped,
        alignmentCounts,
        sampleUpdates: updates.slice(0, 10).map(u => ({
          id: u.id,
          alignment: u.alignment,
          macd: u.indicators.macd_signal,
          ema: u.indicators.ema_trend,
          rsi: u.indicators.rsi_zone,
          adx: u.indicators.adx_strength
        })),
        errors: errors.slice(0, 20)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Execute updates in batches
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      const updatePromises = batch.map(u => 
        supabase
          .from('historical_pattern_occurrences')
          .update({
            trend_alignment: u.alignment,
            trend_indicators: u.indicators
          })
          .eq('id', u.id)
      );

      const results = await Promise.all(updatePromises);
      
      const batchErrors = results.filter(r => r.error);
      if (batchErrors.length > 0) {
        errors.push(...batchErrors.map(r => r.error?.message || 'Update failed'));
      }
      
      updated += batch.length - batchErrors.length;
      
      console.log(`Updated batch ${Math.floor(i / batchSize) + 1}: ${batch.length - batchErrors.length} records`);
    }

    // Check remaining NULL count
    const { count: remainingNull } = await supabase
      .from('historical_pattern_occurrences')
      .select('id', { count: 'exact', head: true })
      .is('trend_alignment', null);

    return new Response(JSON.stringify({
      success: true,
      updated,
      skipped,
      alignmentCounts,
      remainingNull: remainingNull || 0,
      errors: errors.slice(0, 20)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
