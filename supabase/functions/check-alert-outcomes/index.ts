/**
 * Check Alert Outcomes
 * 
 * Scheduled function that checks pending alerts to see if SL/TP was hit.
 * Auto-captures outcomes using price feed data.
 * Tracks MFE (Max Favorable Excursion) and MAE (Max Adverse Excursion) in R-multiples.
 * 
 * Run via cron: every 15 minutes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PendingAlert {
  id: string;
  alert_id: string;
  triggered_at: string;
  price_data: {
    symbol: string;
    timeframe: string;
    current_price: number;
  } | null;
  pattern_data: {
    pattern: string;
  } | null;
  entry_price: number | null;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  check_count: number;
  mfe_r: number | null;
  mae_r: number | null;
}

interface Alert {
  symbol: string;
  timeframe: string;
  pattern: string;
}

const MAX_CHECK_COUNT = 100; // Stop checking after 100 attempts (~25 hours at 15min intervals)
const TIMEOUT_HOURS = 168; // 7 days timeout

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[check-alert-outcomes] Starting outcome check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const finnhubKey = Deno.env.get('FINNHUB_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all pending alerts that need checking
    const { data: pendingAlerts, error: fetchError } = await supabase
      .from('alerts_log')
      .select(`
        id,
        alert_id,
        triggered_at,
        price_data,
        pattern_data,
        entry_price,
        stop_loss_price,
        take_profit_price,
        check_count,
        mfe_r,
        mae_r
      `)
      .eq('outcome_status', 'pending')
      .lt('check_count', MAX_CHECK_COUNT)
      .order('triggered_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('[check-alert-outcomes] Fetch error:', fetchError);
      throw fetchError;
    }

    if (!pendingAlerts || pendingAlerts.length === 0) {
      console.log('[check-alert-outcomes] No pending alerts to check');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pending alerts',
        checked: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[check-alert-outcomes] Checking ${pendingAlerts.length} pending alerts`);

    // Get unique symbols to fetch prices for
    const symbolsToCheck = new Set<string>();
    const alertSymbolMap = new Map<string, string>();

    for (const alert of pendingAlerts) {
      // Get the parent alert to know the symbol
      const { data: parentAlert } = await supabase
        .from('alerts')
        .select('symbol, timeframe, pattern')
        .eq('id', alert.alert_id)
        .single();

      if (parentAlert) {
        symbolsToCheck.add(parentAlert.symbol);
        alertSymbolMap.set(alert.id, parentAlert.symbol);
      }
    }

    // Fetch current prices for all symbols
    const currentPrices = new Map<string, number>();
    
    if (finnhubKey) {
      for (const symbol of symbolsToCheck) {
        try {
          const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`;
          const response = await fetch(quoteUrl);
          const data = await response.json();
          
          if (data.c && data.c > 0) {
            currentPrices.set(symbol, data.c);
            console.log(`[check-alert-outcomes] ${symbol} current price: ${data.c}`);
          }
        } catch (err) {
          console.error(`[check-alert-outcomes] Failed to fetch price for ${symbol}:`, err);
        }
      }
    }

    let updatedCount = 0;
    let timeoutCount = 0;
    let hitTpCount = 0;
    let hitSlCount = 0;

    for (const alert of pendingAlerts as PendingAlert[]) {
      const symbol = alertSymbolMap.get(alert.id);
      if (!symbol) continue;

      const currentPrice = currentPrices.get(symbol);
      const entryPrice = alert.entry_price || alert.price_data?.current_price;
      const slPrice = alert.stop_loss_price;
      const tpPrice = alert.take_profit_price;

      // Check for timeout (7 days since trigger)
      const triggeredAt = new Date(alert.triggered_at);
      const hoursSinceTrigger = (Date.now() - triggeredAt.getTime()) / (1000 * 60 * 60);

      // Calculate current R-multiple for MFE/MAE tracking
      let currentMfeR = alert.mfe_r || 0;
      let currentMaeR = alert.mae_r || 0;

      if (currentPrice && entryPrice && slPrice) {
        const isLong = tpPrice ? tpPrice > entryPrice : slPrice < entryPrice;
        const stopDistance = Math.abs(entryPrice - slPrice);
        
        if (stopDistance > 0) {
          const currentR = isLong
            ? (currentPrice - entryPrice) / stopDistance
            : (entryPrice - currentPrice) / stopDistance;
          
          currentMfeR = Math.max(currentMfeR, currentR);
          currentMaeR = Math.min(currentMaeR, currentR);
        }
      }

      if (hoursSinceTrigger > TIMEOUT_HOURS) {
        // Timeout - calculate exit at current price or last known price
        const exitPrice = currentPrice || entryPrice;
        const pnlPercent = entryPrice ? ((exitPrice! - entryPrice) / entryPrice) * 100 : 0;
        const rMultiple = entryPrice && slPrice 
          ? (exitPrice! - entryPrice) / Math.abs(entryPrice - slPrice)
          : 0;

        await supabase
          .from('alerts_log')
          .update({
            outcome_status: 'timeout',
            outcome_price: exitPrice,
            outcome_at: new Date().toISOString(),
            outcome_pnl_percent: pnlPercent,
            outcome_r_multiple: rMultiple,
            is_auto_captured: true,
            capture_method: 'price_feed',
            checked_at: new Date().toISOString(),
            check_count: (alert.check_count || 0) + 1,
            mfe_r: Number(currentMfeR.toFixed(3)),
            mae_r: Number(currentMaeR.toFixed(3)),
          })
          .eq('id', alert.id);

        timeoutCount++;
        updatedCount++;
        console.log(`[check-alert-outcomes] ${symbol} timeout | MFE: ${currentMfeR.toFixed(2)}R | MAE: ${currentMaeR.toFixed(2)}R`);
        continue;
      }

      if (!currentPrice || !entryPrice || !slPrice || !tpPrice) {
        // Update check count and excursions but skip outcome check
        await supabase
          .from('alerts_log')
          .update({
            checked_at: new Date().toISOString(),
            check_count: (alert.check_count || 0) + 1,
            mfe_r: Number(currentMfeR.toFixed(3)),
            mae_r: Number(currentMaeR.toFixed(3)),
          })
          .eq('id', alert.id);
        continue;
      }

      // Determine if this is a long or short trade based on SL/TP positions
      const isLong = tpPrice > entryPrice;

      let outcomeStatus: 'hit_tp' | 'hit_sl' | null = null;
      let outcomePrice: number | null = null;

      if (isLong) {
        // Long trade: TP is above entry, SL is below
        if (currentPrice >= tpPrice) {
          outcomeStatus = 'hit_tp';
          outcomePrice = tpPrice;
          hitTpCount++;
        } else if (currentPrice <= slPrice) {
          outcomeStatus = 'hit_sl';
          outcomePrice = slPrice;
          hitSlCount++;
        }
      } else {
        // Short trade: TP is below entry, SL is above
        if (currentPrice <= tpPrice) {
          outcomeStatus = 'hit_tp';
          outcomePrice = tpPrice;
          hitTpCount++;
        } else if (currentPrice >= slPrice) {
          outcomeStatus = 'hit_sl';
          outcomePrice = slPrice;
          hitSlCount++;
        }
      }

      if (outcomeStatus) {
        const pnlPercent = ((outcomePrice! - entryPrice) / entryPrice) * 100;
        const stopDistance = Math.abs(entryPrice - slPrice);
        const rMultiple = (outcomePrice! - entryPrice) / (isLong ? stopDistance : -stopDistance);

        await supabase
          .from('alerts_log')
          .update({
            outcome_status: outcomeStatus,
            outcome_price: outcomePrice,
            outcome_at: new Date().toISOString(),
            outcome_pnl_percent: pnlPercent,
            outcome_r_multiple: rMultiple,
            is_auto_captured: true,
            capture_method: 'price_feed',
            checked_at: new Date().toISOString(),
            check_count: (alert.check_count || 0) + 1,
            mfe_r: Number(currentMfeR.toFixed(3)),
            mae_r: Number(currentMaeR.toFixed(3)),
          })
          .eq('id', alert.id);

        updatedCount++;
        console.log(`[check-alert-outcomes] ${symbol} ${outcomeStatus} at ${outcomePrice} (${rMultiple.toFixed(2)}R) | MFE: ${currentMfeR.toFixed(2)}R | MAE: ${currentMaeR.toFixed(2)}R`);
      } else {
        // Just update the check count and excursions
        await supabase
          .from('alerts_log')
          .update({
            checked_at: new Date().toISOString(),
            check_count: (alert.check_count || 0) + 1,
            mfe_r: Number(currentMfeR.toFixed(3)),
            mae_r: Number(currentMaeR.toFixed(3)),
          })
          .eq('id', alert.id);
      }
    }

    // Update aggregate stats
    if (updatedCount > 0) {
      await updateAggregateStats(supabase);
    }

    const response = {
      success: true,
      checked: pendingAlerts.length,
      updated: updatedCount,
      outcomes: {
        hit_tp: hitTpCount,
        hit_sl: hitSlCount,
        timeout: timeoutCount,
      },
    };

    console.log('[check-alert-outcomes] Completed:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[check-alert-outcomes] Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function updateAggregateStats(supabase: any) {
  try {
    // Get all completed outcomes with pattern info
    const { data: outcomes, error } = await supabase
      .from('alerts_log')
      .select(`
        pattern_data,
        price_data,
        outcome_status,
        outcome_r_multiple,
        outcome_pnl_percent,
        alerts!inner(pattern, timeframe, symbol)
      `)
      .in('outcome_status', ['hit_tp', 'hit_sl', 'timeout']);

    if (error || !outcomes) {
      console.error('[check-alert-outcomes] Failed to fetch outcomes for stats:', error);
      return;
    }

    // Group by pattern + timeframe + instrument
    const statsMap = new Map<string, {
      pattern_name: string;
      timeframe: string;
      instrument: string;
      total: number;
      wins: number;
      losses: number;
      timeouts: number;
      totalR: number;
      totalPnl: number;
    }>();

    for (const outcome of outcomes) {
      const key = `${outcome.alerts.pattern}|${outcome.alerts.timeframe}|${outcome.alerts.symbol}`;
      
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          pattern_name: outcome.alerts.pattern,
          timeframe: outcome.alerts.timeframe,
          instrument: outcome.alerts.symbol,
          total: 0,
          wins: 0,
          losses: 0,
          timeouts: 0,
          totalR: 0,
          totalPnl: 0,
        });
      }

      const stats = statsMap.get(key)!;
      stats.total++;
      stats.totalR += outcome.outcome_r_multiple || 0;
      stats.totalPnl += outcome.outcome_pnl_percent || 0;

      if (outcome.outcome_status === 'hit_tp') stats.wins++;
      else if (outcome.outcome_status === 'hit_sl') stats.losses++;
      else if (outcome.outcome_status === 'timeout') stats.timeouts++;
    }

    // Upsert aggregated stats
    for (const [, stats] of statsMap) {
      const winRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
      const avgR = stats.total > 0 ? stats.totalR / stats.total : 0;
      const avgPnl = stats.total > 0 ? stats.totalPnl / stats.total : 0;

      await supabase
        .from('outcome_analytics_cache')
        .upsert({
          pattern_name: stats.pattern_name,
          timeframe: stats.timeframe,
          instrument: stats.instrument,
          total_signals: stats.total,
          wins: stats.wins,
          losses: stats.losses,
          timeouts: stats.timeouts,
          win_rate: winRate,
          avg_r_multiple: avgR,
          avg_pnl_percent: avgPnl,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'pattern_name,timeframe,instrument',
        });
    }

    console.log(`[check-alert-outcomes] Updated ${statsMap.size} aggregate stat entries`);
  } catch (err) {
    console.error('[check-alert-outcomes] Error updating aggregate stats:', err);
  }
}
