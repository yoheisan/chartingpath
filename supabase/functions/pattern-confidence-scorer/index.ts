/**
 * Pattern Confidence Scorer
 * 
 * ML-style prediction engine that calculates win probability for new patterns
 * based on historical outcome data from the closed-loop feedback system.
 * 
 * Features:
 * - Bayesian-adjusted win rate (accounts for sample size uncertainty)
 * - Multi-factor confidence scoring
 * - Optimal R:R recommendation based on historical performance
 * - Time-to-outcome estimation
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PatternInput {
  pattern_name: string;
  timeframe: string;
  instrument: string;
  quality_grade?: string;
  trend_alignment?: string;
  direction?: string;
}

interface ConfidenceResult {
  win_probability: number;
  confidence_level: 'high' | 'medium' | 'low' | 'insufficient_data';
  optimal_rr_target: number;
  expected_r_multiple: number;
  time_to_outcome_bars: number | null;
  sample_size: number;
  evidence: {
    exact_match: boolean;
    pattern_matches: number;
    timeframe_matches: number;
    instrument_matches: number;
  };
  recommendations: string[];
  grade_calibration?: {
    expected_win_rate: number;
    actual_win_rate: number;
    is_overperforming: boolean;
    deviation_percent: number;
  };
}

// Expected win rates by grade for calibration
const GRADE_EXPECTATIONS: Record<string, number> = {
  'A': 65,
  'B': 55,
  'C': 45,
  'D': 35,
  'F': 25,
};

// Bayesian prior: assume 50% win rate with "virtual" sample of 10
const PRIOR_WIN_RATE = 0.5;
const PRIOR_SAMPLE_SIZE = 10;

function bayesianWinRate(wins: number, total: number): number {
  // Bayesian adjustment: (wins + prior_wins) / (total + prior_total)
  const priorWins = PRIOR_WIN_RATE * PRIOR_SAMPLE_SIZE;
  return (wins + priorWins) / (total + PRIOR_SAMPLE_SIZE);
}

function calculateConfidenceLevel(sampleSize: number, winRate: number): 'high' | 'medium' | 'low' | 'insufficient_data' {
  if (sampleSize < 5) return 'insufficient_data';
  if (sampleSize < 15) return 'low';
  if (sampleSize < 30) return 'medium';
  // High confidence requires good sample AND not borderline win rate
  if (winRate > 55 || winRate < 40) return 'high';
  return 'medium';
}

function calculateOptimalRR(avgR: number, winRate: number): number {
  // Kelly-inspired: if win rate is high, can target higher RR
  // If win rate is low, stick to lower RR for faster exits
  if (winRate >= 60) return 3;
  if (winRate >= 50) return 2.5;
  if (winRate >= 40) return 2;
  return 1.5; // Conservative for low win rate patterns
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const patterns: PatternInput[] = Array.isArray(body.patterns) ? body.patterns : [body];

    console.log(`[pattern-confidence-scorer] Scoring ${patterns.length} patterns`);

    const results: ConfidenceResult[] = [];

    for (const input of patterns) {
      // Step 1: Try exact match (pattern + timeframe + instrument)
      const { data: exactMatch } = await supabase
        .from('outcome_analytics_cache')
        .select('*')
        .eq('pattern_name', input.pattern_name)
        .eq('timeframe', input.timeframe)
        .eq('instrument', input.instrument)
        .single();

      // Step 2: Get pattern-level stats (across all instruments)
      const { data: patternMatches } = await supabase
        .from('outcome_analytics_cache')
        .select('*')
        .eq('pattern_name', input.pattern_name);

      // Step 3: Get instrument-level stats (across all patterns)
      const { data: instrumentMatches } = await supabase
        .from('outcome_analytics_cache')
        .select('*')
        .eq('instrument', input.instrument);

      // Step 4: Get timeframe-level stats
      const { data: timeframeMatches } = await supabase
        .from('outcome_analytics_cache')
        .select('*')
        .eq('timeframe', input.timeframe);

      // Aggregate stats with weighted blending
      let totalWins = 0;
      let totalSignals = 0;
      let totalR = 0;
      let weightedCount = 0;

      // Exact match gets highest weight (3x)
      if (exactMatch && exactMatch.total_signals > 0) {
        totalWins += exactMatch.wins * 3;
        totalSignals += exactMatch.total_signals * 3;
        totalR += (exactMatch.avg_r_multiple || 0) * exactMatch.total_signals * 3;
        weightedCount += exactMatch.total_signals * 3;
      }

      // Pattern matches get 2x weight
      for (const match of patternMatches || []) {
        if (match.instrument === input.instrument) continue; // Already counted
        totalWins += match.wins * 2;
        totalSignals += match.total_signals * 2;
        totalR += (match.avg_r_multiple || 0) * match.total_signals * 2;
        weightedCount += match.total_signals * 2;
      }

      // Instrument matches get 1x weight
      for (const match of instrumentMatches || []) {
        if (match.pattern_name === input.pattern_name) continue; // Already counted
        totalWins += match.wins;
        totalSignals += match.total_signals;
        totalR += (match.avg_r_multiple || 0) * match.total_signals;
        weightedCount += match.total_signals;
      }

      const rawSampleSize = exactMatch?.total_signals || 0;
      const blendedSampleSize = Math.round(weightedCount / 2); // Normalize weight

      // Calculate Bayesian-adjusted win probability
      const winProbability = totalSignals > 0 
        ? bayesianWinRate(totalWins, totalSignals) * 100
        : 50; // Default to 50% with no data

      const avgR = weightedCount > 0 ? totalR / weightedCount : 0;
      const confidenceLevel = calculateConfidenceLevel(blendedSampleSize, winProbability);
      const optimalRR = calculateOptimalRR(avgR, winProbability);

      // Build recommendations
      const recommendations: string[] = [];

      if (confidenceLevel === 'insufficient_data') {
        recommendations.push('Limited historical data - use conservative position sizing');
      }

      if (winProbability >= 60) {
        recommendations.push('Strong historical performance - consider larger position');
      } else if (winProbability < 40) {
        recommendations.push('Below-average win rate - wait for higher-grade setups');
      }

      if (avgR < 0) {
        recommendations.push('⚠️ Negative expectancy historically - consider skipping');
      }

      if (input.trend_alignment === 'counter') {
        recommendations.push('Counter-trend setup - tighten stops');
      }

      // Grade calibration (if grade provided)
      let gradeCalibration = undefined;
      if (input.quality_grade && exactMatch) {
        const expectedWinRate = GRADE_EXPECTATIONS[input.quality_grade] || 50;
        const actualWinRate = exactMatch.win_rate || 50;
        const deviation = actualWinRate - expectedWinRate;

        gradeCalibration = {
          expected_win_rate: expectedWinRate,
          actual_win_rate: actualWinRate,
          is_overperforming: deviation > 0,
          deviation_percent: Math.abs(deviation),
        };

        if (deviation < -10) {
          recommendations.push(`Grade ${input.quality_grade} underperforming by ${Math.abs(deviation).toFixed(0)}% - scoring may need recalibration`);
        }
      }

      results.push({
        win_probability: Math.round(winProbability * 10) / 10,
        confidence_level: confidenceLevel,
        optimal_rr_target: optimalRR,
        expected_r_multiple: Math.round(avgR * 100) / 100,
        time_to_outcome_bars: null, // TODO: Calculate from alerts_log time data
        sample_size: blendedSampleSize,
        evidence: {
          exact_match: !!exactMatch,
          pattern_matches: patternMatches?.length || 0,
          timeframe_matches: timeframeMatches?.length || 0,
          instrument_matches: instrumentMatches?.length || 0,
        },
        recommendations,
        grade_calibration: gradeCalibration,
      });
    }

    console.log(`[pattern-confidence-scorer] Scored ${results.length} patterns`);

    return new Response(JSON.stringify({
      success: true,
      predictions: results.length === 1 ? results[0] : results,
      model_version: '1.0.0',
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[pattern-confidence-scorer] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
