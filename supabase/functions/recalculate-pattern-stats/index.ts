/**
 * Recalculate Pattern Stats
 * 
 * Closed-loop feedback system that:
 * 1. Aggregates auto-captured outcomes from alerts_log
 * 2. Updates outcome_analytics_cache with verified performance metrics
 * 3. Flags underperforming patterns for review
 * 4. Syncs verified stats back to live_pattern_detections for real-time display
 * 
 * This creates a data flywheel where:
 * - More alerts → More outcomes → Better stats → Better quality grades → Better signals
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PatternStats {
  pattern_name: string;
  timeframe: string;
  instrument: string | null;
  total_signals: number;
  wins: number;
  losses: number;
  timeouts: number;
  win_rate: number;
  avg_r_multiple: number;
  avg_pnl_percent: number;
}

interface HealthIssue {
  pattern_name: string;
  timeframe: string;
  instrument: string | null;
  issue_type: 'low_win_rate' | 'negative_expectancy' | 'high_timeout_rate' | 'sample_degradation';
  severity: 'warning' | 'critical';
  current_value: number;
  threshold: number;
  sample_size: number;
  recommendation: string;
}

// Performance thresholds for health monitoring
const THRESHOLDS = {
  MIN_WIN_RATE: 35,           // Flag if win rate drops below 35%
  MIN_EXPECTANCY: -0.5,       // Flag if avg R < -0.5
  MAX_TIMEOUT_RATE: 40,       // Flag if >40% timeout
  MIN_SAMPLE_SIZE: 10,        // Minimum samples for reliable stats
  CRITICAL_WIN_RATE: 25,      // Critical: below 25% win rate
  CRITICAL_EXPECTANCY: -1.0,  // Critical: avg R below -1.0
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[recalculate-pattern-stats] Starting closed-loop stats aggregation...');

    // Step 1: Fetch all completed outcomes from alerts_log
    const { data: outcomes, error: outcomesError } = await supabase
      .from('alerts_log')
      .select(`
        id,
        outcome_status,
        outcome_pnl_percent,
        outcome_r_multiple,
        is_auto_captured,
        alerts!inner(symbol, pattern, timeframe)
      `)
      .in('outcome_status', ['hit_tp', 'hit_sl', 'timeout'])
      .order('outcome_at', { ascending: false });

    if (outcomesError) {
      throw new Error(`Failed to fetch outcomes: ${outcomesError.message}`);
    }

    console.log(`[recalculate-pattern-stats] Processing ${outcomes?.length || 0} completed outcomes`);

    // Step 2: Aggregate by pattern + timeframe + instrument
    const statsMap = new Map<string, PatternStats>();
    
    for (const outcome of outcomes || []) {
      const key = `${outcome.alerts.pattern}|${outcome.alerts.timeframe}|${outcome.alerts.symbol}`;
      
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          pattern_name: outcome.alerts.pattern,
          timeframe: outcome.alerts.timeframe,
          instrument: outcome.alerts.symbol,
          total_signals: 0,
          wins: 0,
          losses: 0,
          timeouts: 0,
          win_rate: 0,
          avg_r_multiple: 0,
          avg_pnl_percent: 0,
        });
      }
      
      const stats = statsMap.get(key)!;
      stats.total_signals++;
      
      if (outcome.outcome_status === 'hit_tp') {
        stats.wins++;
      } else if (outcome.outcome_status === 'hit_sl') {
        stats.losses++;
      } else if (outcome.outcome_status === 'timeout') {
        stats.timeouts++;
      }
      
      // Accumulate for averages
      stats.avg_r_multiple += outcome.outcome_r_multiple || 0;
      stats.avg_pnl_percent += outcome.outcome_pnl_percent || 0;
    }

    // Calculate final averages
    for (const stats of statsMap.values()) {
      if (stats.total_signals > 0) {
        stats.win_rate = (stats.wins / stats.total_signals) * 100;
        stats.avg_r_multiple = stats.avg_r_multiple / stats.total_signals;
        stats.avg_pnl_percent = stats.avg_pnl_percent / stats.total_signals;
      }
    }

    // Step 3: Upsert to outcome_analytics_cache
    const statsArray = Array.from(statsMap.values());
    let upsertedCount = 0;

    for (const stats of statsArray) {
      const { error: upsertError } = await supabase
        .from('outcome_analytics_cache')
        .upsert({
          pattern_name: stats.pattern_name,
          timeframe: stats.timeframe,
          instrument: stats.instrument,
          total_signals: stats.total_signals,
          wins: stats.wins,
          losses: stats.losses,
          timeouts: stats.timeouts,
          win_rate: stats.win_rate,
          avg_r_multiple: stats.avg_r_multiple,
          avg_pnl_percent: stats.avg_pnl_percent,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'pattern_name,timeframe,instrument',
        });

      if (!upsertError) upsertedCount++;
    }

    console.log(`[recalculate-pattern-stats] Upserted ${upsertedCount} pattern stats`);

    // Step 4: Detect health issues (underperformers)
    const healthIssues: HealthIssue[] = [];

    for (const stats of statsArray) {
      if (stats.total_signals < THRESHOLDS.MIN_SAMPLE_SIZE) continue;

      // Check win rate
      if (stats.win_rate < THRESHOLDS.CRITICAL_WIN_RATE) {
        healthIssues.push({
          pattern_name: stats.pattern_name,
          timeframe: stats.timeframe,
          instrument: stats.instrument,
          issue_type: 'low_win_rate',
          severity: 'critical',
          current_value: stats.win_rate,
          threshold: THRESHOLDS.CRITICAL_WIN_RATE,
          sample_size: stats.total_signals,
          recommendation: 'Consider disabling this pattern or reviewing detection parameters',
        });
      } else if (stats.win_rate < THRESHOLDS.MIN_WIN_RATE) {
        healthIssues.push({
          pattern_name: stats.pattern_name,
          timeframe: stats.timeframe,
          instrument: stats.instrument,
          issue_type: 'low_win_rate',
          severity: 'warning',
          current_value: stats.win_rate,
          threshold: THRESHOLDS.MIN_WIN_RATE,
          sample_size: stats.total_signals,
          recommendation: 'Review pattern parameters for this instrument/timeframe',
        });
      }

      // Check expectancy
      if (stats.avg_r_multiple < THRESHOLDS.CRITICAL_EXPECTANCY) {
        healthIssues.push({
          pattern_name: stats.pattern_name,
          timeframe: stats.timeframe,
          instrument: stats.instrument,
          issue_type: 'negative_expectancy',
          severity: 'critical',
          current_value: stats.avg_r_multiple,
          threshold: THRESHOLDS.CRITICAL_EXPECTANCY,
          sample_size: stats.total_signals,
          recommendation: 'This pattern is losing money on average - review or disable',
        });
      } else if (stats.avg_r_multiple < THRESHOLDS.MIN_EXPECTANCY) {
        healthIssues.push({
          pattern_name: stats.pattern_name,
          timeframe: stats.timeframe,
          instrument: stats.instrument,
          issue_type: 'negative_expectancy',
          severity: 'warning',
          current_value: stats.avg_r_multiple,
          threshold: THRESHOLDS.MIN_EXPECTANCY,
          sample_size: stats.total_signals,
          recommendation: 'Expectancy is negative - consider adjusting SL/TP levels',
        });
      }

      // Check timeout rate
      const timeoutRate = (stats.timeouts / stats.total_signals) * 100;
      if (timeoutRate > THRESHOLDS.MAX_TIMEOUT_RATE) {
        healthIssues.push({
          pattern_name: stats.pattern_name,
          timeframe: stats.timeframe,
          instrument: stats.instrument,
          issue_type: 'high_timeout_rate',
          severity: 'warning',
          current_value: timeoutRate,
          threshold: THRESHOLDS.MAX_TIMEOUT_RATE,
          sample_size: stats.total_signals,
          recommendation: 'Many trades timing out - consider extending time stops or adjusting targets',
        });
      }
    }

    console.log(`[recalculate-pattern-stats] Detected ${healthIssues.length} health issues`);

    // Step 5: Sync verified stats back to live_pattern_detections for real-time display
    // This closes the loop: outcomes → stats → screener display
    let syncedCount = 0;
    
    for (const stats of statsArray) {
      if (stats.total_signals < THRESHOLDS.MIN_SAMPLE_SIZE) continue;
      
      const historicalPerformance = {
        winRate: stats.win_rate,
        avgRMultiple: stats.avg_r_multiple,
        sampleSize: stats.total_signals,
        source: 'verified_outcomes', // Mark as coming from auto-captured data
        lastUpdated: new Date().toISOString(),
      };

      // Update all matching active patterns with verified stats
      const { error: updateError } = await supabase
        .from('live_pattern_detections')
        .update({
          historical_performance: historicalPerformance,
          updated_at: new Date().toISOString(),
        })
        .eq('pattern_name', stats.pattern_name)
        .eq('timeframe', stats.timeframe)
        .eq('instrument', stats.instrument)
        .eq('status', 'active');

      if (!updateError) syncedCount++;
    }

    console.log(`[recalculate-pattern-stats] Synced verified stats to ${syncedCount} live patterns`);

    return new Response(JSON.stringify({
      success: true,
      stats: {
        outcomesProcessed: outcomes?.length || 0,
        patternsUpdated: upsertedCount,
        healthIssues: healthIssues.length,
        livePatternsSync: syncedCount,
      },
      healthIssues: healthIssues.filter(h => h.severity === 'critical'), // Only return critical
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[recalculate-pattern-stats] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
