/**
 * useRegimeAnalytics Hook
 * 
 * Consumes trade ledger data from backtest results and provides
 * regime-conditioned analytics for the dashboard.
 * 
 * Research-grade infrastructure:
 * - Deterministic computations
 * - Bar-close-only semantics
 * - Explicit reliability warnings
 */

import { useState, useMemo, useCallback } from 'react';
import {
  TradeLedgerEntry,
  BucketStats,
  PatternStrengthScore,
  RegimeLabel,
  SAMPLE_SIZE_THRESHOLDS,
  scoreToGrade,
  getSampleSizeTier,
  getReliabilityWarnings,
  createRegimeKey,
  parseRegimeKey,
  describeRegime,
} from '@/types/RegimeAnalytics';
import {
  computeBucketStats,
  computePatternStrengthScore,
} from '@/utils/RegimeComputation';

interface RegimeAnalyticsState {
  tradeLedger: TradeLedgerEntry[];
  isLoading: boolean;
  error: string | null;
}

interface RegimeAnalyticsResult {
  // Raw data
  tradeLedger: TradeLedgerEntry[];
  
  // Aggregated stats
  baselineStats: BucketStats | null;
  regimeBuckets: Record<string, BucketStats>;
  patternScores: PatternStrengthScore[];
  
  // Helpers
  getPatternStats: (patternId: string) => {
    baseline: BucketStats | null;
    byRegime: Record<string, BucketStats>;
  };
  getRegimeDescription: (regimeKey: string) => string;
  
  // Metadata
  totalTrades: number;
  reliabilityTier: 'insufficient' | 'low' | 'moderate' | 'high' | 'excellent';
  warnings: string[];
  
  // Actions
  loadFromBacktestResult: (backtestResult: any) => void;
  reset: () => void;
}

export function useRegimeAnalytics(): RegimeAnalyticsResult {
  const [state, setState] = useState<RegimeAnalyticsState>({
    tradeLedger: [],
    isLoading: false,
    error: null,
  });

  // Compute baseline stats across all trades
  const baselineStats = useMemo(() => {
    if (state.tradeLedger.length === 0) return null;
    return computeBucketStats(state.tradeLedger, 'baseline', 'all', 'all');
  }, [state.tradeLedger]);

  // Group trades by regime and compute stats
  const regimeBuckets = useMemo(() => {
    const buckets: Record<string, TradeLedgerEntry[]> = {};
    
    for (const trade of state.tradeLedger) {
      const key = trade.regimeAtEntry.key;
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(trade);
    }
    
    const stats: Record<string, BucketStats> = {};
    for (const [regimeKey, trades] of Object.entries(buckets)) {
      stats[regimeKey] = computeBucketStats(trades, regimeKey, 'all', regimeKey);
    }
    
    return stats;
  }, [state.tradeLedger]);

  // Compute pattern strength scores
  const patternScores = useMemo(() => {
    if (state.tradeLedger.length === 0) return [];
    
    // Group by pattern
    const byPattern: Record<string, TradeLedgerEntry[]> = {};
    for (const trade of state.tradeLedger) {
      const pid = trade.patternId;
      if (!byPattern[pid]) byPattern[pid] = [];
      byPattern[pid].push(trade);
    }
    
    const scores: PatternStrengthScore[] = [];
    for (const [patternId, trades] of Object.entries(byPattern)) {
      const patternName = trades[0]?.patternName || patternId;
      const score = computePatternStrengthScore(trades, patternId, patternName);
      scores.push(score);
    }
    
    // Sort by overall score descending
    return scores.sort((a, b) => b.overallScore - a.overallScore);
  }, [state.tradeLedger]);

  // Get stats for a specific pattern
  const getPatternStats = useCallback((patternId: string) => {
    const patternTrades = state.tradeLedger.filter(t => t.patternId === patternId);
    
    if (patternTrades.length === 0) {
      return { baseline: null, byRegime: {} };
    }
    
    const baseline = computeBucketStats(patternTrades, `${patternId}_baseline`, patternId, 'all');
    
    const byRegime: Record<string, TradeLedgerEntry[]> = {};
    for (const trade of patternTrades) {
      const key = trade.regimeAtEntry.key;
      if (!byRegime[key]) byRegime[key] = [];
      byRegime[key].push(trade);
    }
    
    const regimeStats: Record<string, BucketStats> = {};
    for (const [regimeKey, trades] of Object.entries(byRegime)) {
      regimeStats[regimeKey] = computeBucketStats(trades, `${patternId}_${regimeKey}`, patternId, regimeKey);
    }
    
    return { baseline, byRegime: regimeStats };
  }, [state.tradeLedger]);

  // Get human-readable regime description
  const getRegimeDescription = useCallback((regimeKey: string): string => {
    const { trend, volatility } = parseRegimeKey(regimeKey);
    return describeRegime(trend, volatility);
  }, []);

  // Overall reliability tier
  const reliabilityTier = useMemo(() => {
    return getSampleSizeTier(state.tradeLedger.length);
  }, [state.tradeLedger.length]);

  // Aggregate warnings
  const warnings = useMemo(() => {
    const w: string[] = [];
    
    if (state.tradeLedger.length < SAMPLE_SIZE_THRESHOLDS.MINIMUM) {
      w.push(`Insufficient data: ${state.tradeLedger.length} trades (need ${SAMPLE_SIZE_THRESHOLDS.MINIMUM}+)`);
    } else if (state.tradeLedger.length < SAMPLE_SIZE_THRESHOLDS.LOW) {
      w.push(`Low sample size: ${state.tradeLedger.length} trades - interpret with caution`);
    }
    
    // Check for regime imbalance
    const regimeCounts = Object.values(regimeBuckets).map(b => b.n);
    if (regimeCounts.length > 0) {
      const maxCount = Math.max(...regimeCounts);
      const minCount = Math.min(...regimeCounts);
      if (maxCount > minCount * 5) {
        w.push('Regime imbalance: some regimes have 5x+ more trades than others');
      }
    }
    
    return w;
  }, [state.tradeLedger.length, regimeBuckets]);

  // Load from backtest result
  const loadFromBacktestResult = useCallback((backtestResult: any) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Extract trade ledger from backtest result
      let ledger: TradeLedgerEntry[] = [];
      
      if (backtestResult?.tradeLedger && Array.isArray(backtestResult.tradeLedger)) {
        ledger = backtestResult.tradeLedger;
      } else if (backtestResult?.trades && Array.isArray(backtestResult.trades)) {
        // Convert legacy trades format to TradeLedgerEntry
        ledger = backtestResult.trades.map((trade: any, index: number) => ({
          id: trade.id || `trade-${index}`,
          runId: backtestResult.runId || 'unknown',
          symbol: trade.symbol || 'UNKNOWN',
          timeframe: trade.timeframe || '1D',
          patternId: trade.patternId || trade.patternName?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
          patternName: trade.patternName || 'Unknown Pattern',
          patternDirection: trade.patternDirection || 'long',
          entryTime: trade.entryDate || trade.entryTime || new Date().toISOString(),
          exitTime: trade.exitDate || trade.exitTime || new Date().toISOString(),
          entryBarIndex: trade.entryBarIndex || 0,
          exitBarIndex: trade.exitBarIndex || 0,
          holdingBars: trade.holdingBars || 1,
          entryPrice: trade.entryPrice || 0,
          exitPrice: trade.exitPrice || 0,
          stopLossPrice: trade.stopLossPrice || trade.entryPrice * (1 - (trade.stopPercent || 1) / 100),
          takeProfitPrice: trade.takeProfitPrice || trade.entryPrice * (1 + (trade.targetPercent || 2) / 100),
          riskAmount: trade.riskAmount || Math.abs(trade.entryPrice - (trade.stopLossPrice || trade.entryPrice * 0.99)),
          rewardPotential: trade.rewardPotential || Math.abs((trade.takeProfitPrice || trade.entryPrice * 1.02) - trade.entryPrice),
          plannedRR: trade.plannedRR || (trade.targetPercent || 2) / (trade.stopPercent || 1),
          actualRMultiple: trade.actualRMultiple || (trade.pnlPercent / (trade.stopPercent || 1)),
          mfe: trade.mfe || Math.max(0, trade.pnlPercent || 0),
          mae: trade.mae || Math.min(0, trade.pnlPercent || 0),
          mfeRMultiple: trade.mfeRMultiple || (trade.mfe || 0) / (trade.stopPercent || 1),
          maeRMultiple: trade.maeRMultiple || (trade.mae || 0) / (trade.stopPercent || 1),
          exitReason: trade.exitReason || 'timeout',
          pnlPercent: trade.pnlPercent || 0,
          pnlAbsolute: trade.pnl || 0,
          isWin: (trade.pnlPercent || trade.pnl || 0) > 0,
          regimeAtEntry: trade.regimeAtEntry || { trend: 'FLAT', volatility: 'MED', key: 'FLAT_MED' },
          disciplineValidation: trade.disciplineValidation || {
            passed: trade.disciplineApproved ?? true,
            filtersApplied: [],
            rejectionReasons: []
          },
          createdAt: new Date().toISOString()
        }));
      }
      
      setState({
        tradeLedger: ledger,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load analytics'
      }));
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      tradeLedger: [],
      isLoading: false,
      error: null
    });
  }, []);

  return {
    tradeLedger: state.tradeLedger,
    baselineStats,
    regimeBuckets,
    patternScores,
    getPatternStats,
    getRegimeDescription,
    totalTrades: state.tradeLedger.length,
    reliabilityTier,
    warnings,
    loadFromBacktestResult,
    reset
  };
}
