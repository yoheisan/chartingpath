import { supabase } from '@/integrations/supabase/client';

export interface OHLCBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface PatternDetectionResult {
  detected: boolean;
  confidence: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  patternStartIndex?: number;
  patternEndIndex?: number;
  keyLevels?: {
    neckline?: number;
    leftShoulder?: number;
    head?: number;
    rightShoulder?: number;
    support?: number;
    resistance?: number;
    fibonacciLevels?: {
      [key: string]: number;
    };
  };
  volumeConfirmed?: boolean;
  notes?: string;
}

export interface PatternAlgorithm {
  pineScript: string;
  mt4: string;
  mt5: string;
}

export interface DetectionResponse {
  success: boolean;
  pattern: PatternDetectionResult;
  algorithm: PatternAlgorithm;
}

export const detectChartPattern = async (
  patternType: string,
  ohlcData: OHLCBar[],
  config: {
    tolerance?: number;
    minBars?: number;
    volumeConfirmation?: boolean;
  } = {}
): Promise<DetectionResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('detect-chart-patterns', {
      body: {
        patternType,
        ohlcData,
        patternConfig: {
          tolerance: config.tolerance || 2.0,
          minBars: config.minBars || 5,
          volumeConfirmation: config.volumeConfirmation || false
        }
      }
    });

    if (error) throw error;

    return data as DetectionResponse;
  } catch (error) {
    console.error('Pattern detection failed:', error);
    throw error;
  }
};

// Generate mock OHLC data for testing/backtesting
export const generateMockOHLCData = (
  startPrice: number,
  bars: number,
  volatility: number = 0.02
): OHLCBar[] => {
  const data: OHLCBar[] = [];
  let currentPrice = startPrice;
  const startTime = Date.now() - (bars * 3600000); // Hourly bars

  for (let i = 0; i < bars; i++) {
    const open = currentPrice;
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5 * currentPrice;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5 * currentPrice;
    const volume = Math.floor(Math.random() * 10000) + 1000;

    data.push({
      timestamp: startTime + (i * 3600000),
      open: parseFloat(open.toFixed(5)),
      high: parseFloat(high.toFixed(5)),
      low: parseFloat(low.toFixed(5)),
      close: parseFloat(close.toFixed(5)),
      volume
    });

    currentPrice = close;
  }

  return data;
};
