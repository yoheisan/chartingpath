import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CompressedBar } from '@/types/VisualSpec';
import { toast } from 'sonner';

// Re-export for convenience
export type { ChartContextData } from '@/components/copilot';

export type SelectionMode = 'none' | 'range' | 'visible' | 'pattern';

export interface ChartAnalysisState {
  selectionMode: SelectionMode;
  selectedBars: CompressedBar[];
  isAnalyzing: boolean;
  analysisResult: ChartAnalysisResult | null;
}

export interface ChartAnalysisResult {
  symbol: string;
  timeframe: string;
  barCount: number;
  priceAnalysis: {
    priceChange: number;
    priceChangePercent: number;
    trend: string;
    trendStrength: string;
    support: number;
    resistance: number;
  };
  volumeAnalysis: {
    avgVolume: number;
    lastVolume: number;
    volumeRatio: number;
    volumeTrend: string;
  };
  indicators: {
    rsi: { current: number; interpretation: string; divergence?: string };
    macd: { macd: number; signal: number; histogram: number; interpretation: string; divergence?: string };
    bollingerBands: { upper: number; middle: number; lower: number; position: string };
    atr: { value: number; volatilityLevel: string };
    adx?: { adx: number; plusDI: number; minusDI: number; interpretation: string };
    ema20: number;
    ema50: number;
    sma200?: number;
  };
  confluence?: {
    bullishPct: number;
    bearishPct: number;
    bullishScore: number;
    bearishScore: number;
    totalScore: number;
  };
  divergences?: {
    rsi: string;
    macd: string;
    obv: string;
  };
  patterns: {
    name: string;
    direction: string;
    quality: string;
    entry: number;
    stopLoss: number;
    takeProfit: number;
    rr: number;
    timeframe: string;
  }[];
  tradingScenarios: {
    bullish: { probability: string; entry: number; stopLoss: number; takeProfit: number; riskReward: number };
    bearish: { probability: string; entry: number; stopLoss: number; takeProfit: number; riskReward: number };
    neutral: { description: string };
  };
  riskAssessment: {
    overallRisk: string;
    volatilityRisk: string;
    trendRisk: string;
    keyLevels: { level: number; type: string }[];
  };
  summary: string;
}

interface UseChartAnalysisOptions {
  symbol: string;
  timeframe?: string;
  onAnalysisComplete?: (result: ChartAnalysisResult) => void;
  onSendToCopilot?: (context: string, analysis: ChartAnalysisResult) => void;
}

export function useChartAnalysis({
  symbol,
  timeframe = '1d',
  onAnalysisComplete,
  onSendToCopilot
}: UseChartAnalysisOptions) {
  const [state, setState] = useState<ChartAnalysisState>({
    selectionMode: 'none',
    selectedBars: [],
    isAnalyzing: false,
    analysisResult: null
  });
  
  const barsRef = useRef<CompressedBar[]>([]);

  // Set the available bars for selection
  const setBars = useCallback((bars: CompressedBar[]) => {
    barsRef.current = bars;
  }, []);

  // Start range selection mode
  const startRangeSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectionMode: 'range', selectedBars: [] }));
    toast.info('Click and drag on the chart to select a range');
  }, []);

  // Select visible bars
  const selectVisibleBars = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      selectionMode: 'visible', 
      selectedBars: barsRef.current 
    }));
  }, []);

  // Auto-detect pattern context
  const selectPatternContext = useCallback(() => {
    setState(prev => ({ ...prev, selectionMode: 'pattern' }));
    // Will be populated when pattern is detected
  }, []);

  // Handle range selection complete
  const onRangeSelected = useCallback((startIndex: number, endIndex: number) => {
    const selected = barsRef.current.slice(
      Math.min(startIndex, endIndex),
      Math.max(startIndex, endIndex) + 1
    );
    setState(prev => ({ ...prev, selectedBars: selected }));
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setState({
      selectionMode: 'none',
      selectedBars: [],
      isAnalyzing: false,
      analysisResult: null
    });
  }, []);

  // Run analysis on selected bars with timeout
  const analyzeSelection = useCallback(async (bars?: CompressedBar[]) => {
    const barsToAnalyze = bars || state.selectedBars;
    
    if (barsToAnalyze.length < 10) {
      toast.error('Please select at least 10 bars for meaningful analysis');
      setState(prev => ({ ...prev, isAnalyzing: false }));
      return null;
    }

    setState(prev => ({ ...prev, isAnalyzing: true }));

    // Limit bars sent to the edge function to avoid huge payloads
    // Use the most recent 300 bars max (enough for all indicators including SMA200)
    const maxBars = 300;
    const trimmedBars = barsToAnalyze.length > maxBars 
      ? barsToAnalyze.slice(-maxBars) 
      : barsToAnalyze;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      const invokePromise = supabase.functions.invoke('analyze-chart-context', {
        body: {
          symbol,
          timeframe,
          bars: trimmedBars.map(b => ({
            t: b.t,
            o: b.o,
            h: b.h,
            l: b.l,
            c: b.c,
            v: b.v
          }))
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('ANALYSIS_TIMEOUT'));
        }, 45000);
      });

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as Awaited<typeof invokePromise>;

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Analysis failed');

      const result = data.analysis as ChartAnalysisResult;
      
      setState(prev => ({ ...prev, analysisResult: result }));
      toast.success('Analysis complete');
      onAnalysisComplete?.(result);
      
      return result;
    } catch (err: any) {
      console.error('[useChartAnalysis] Error:', err);
      
      // Better error messages
      if (err.name === 'AbortError' || err.message?.includes('timeout') || err.message === 'ANALYSIS_TIMEOUT') {
        toast.error('Analysis timed out. Please try again.');
      } else if (err.message?.includes('Failed to fetch')) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Analysis failed. Please try again.');
      }
      
      return null;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [state.selectedBars, symbol, timeframe, onAnalysisComplete]);

  // Send analysis to Trading Copilot
  const sendToCopilot = useCallback(async () => {
    let result = state.analysisResult;
    
    // If no analysis yet, run it first
    if (!result && state.selectedBars.length > 0) {
      result = await analyzeSelection();
    }
    
    if (!result) {
      toast.error('No analysis available. Please select bars first.');
      return;
    }

    // Format context for the copilot and pass full analysis
    const contextMessage = formatAnalysisForCopilot(result);
    onSendToCopilot?.(contextMessage, result);
  }, [state.analysisResult, state.selectedBars, analyzeSelection, onSendToCopilot]);

  // Analyze visible chart (quick action)
  const analyzeVisibleChart = useCallback(async () => {
    if (barsRef.current.length < 10) {
      toast.error('Not enough bars to analyze');
      return null;
    }
    
    setState(prev => ({ 
      ...prev, 
      selectionMode: 'visible',
      selectedBars: barsRef.current,
      isAnalyzing: true 
    }));

    return analyzeSelection(barsRef.current);
  }, [analyzeSelection]);

  return {
    ...state,
    setBars,
    startRangeSelection,
    selectVisibleBars,
    selectPatternContext,
    onRangeSelected,
    clearSelection,
    analyzeSelection,
    analyzeVisibleChart,
    sendToCopilot,
    barsCount: barsRef.current.length
  };
}

// Helper to format analysis result for copilot context - now more concise
function formatAnalysisForCopilot(result: ChartAnalysisResult): string {
  const trend = result.priceAnalysis.trend;
  const trendEmoji = trend === 'bullish' ? '📈' : trend === 'bearish' ? '📉' : '➡️';
  const change = result.priceAnalysis.priceChangePercent;
  
  // Build a concise summary for the AI to expand on
  const parts: string[] = [];
  
  parts.push(`${trendEmoji} **${result.symbol}** (${result.timeframe}) - ${trend.toUpperCase()} trend`);
  parts.push('');
  parts.push(`**Quick Stats:** ${change >= 0 ? '+' : ''}${change.toFixed(1)}% | RSI ${result.indicators.rsi.current.toFixed(0)} | ${result.volumeAnalysis.volumeTrend} volume | ${result.riskAssessment.overallRisk} risk`);
  parts.push('');
  parts.push(`**Key Levels:** Support $${result.priceAnalysis.support.toFixed(2)} → Resistance $${result.priceAnalysis.resistance.toFixed(2)}`);
  
  if (result.patterns.length > 0) {
    const patternList = result.patterns.map(p => `${p.name} (${p.quality})`).join(', ');
    parts.push('');
    parts.push(`**Patterns:** ${patternList}`);
  }
  
  parts.push('');
  parts.push('What are the best entry/exit setups and key risks to watch?');
  
  return parts.join('\n');
}
