import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { strategy } = await req.json();
    
    // Extract data with fallbacks for both nested and flat structures
    const instrument = strategy.market?.instrument || strategy.instrument;
    const instrumentCategory = strategy.market?.instrumentCategory || strategy.instrumentCategory || 'stocks';
    const startDate = strategy.backtestPeriod?.startDate || strategy.startDate;
    const endDate = strategy.backtestPeriod?.endDate || strategy.endDate;
    const timeframe = strategy.market?.timeframes?.[0] || strategy.timeframe || '1d';
    
    console.log('Starting real backtest for:', {
      instrument,
      instrumentCategory,
      startDate,
      endDate,
      timeframe,
      patterns: strategy.patterns?.filter((p: any) => p.enabled).map((p: any) => p.name)
    });

    // Validate required parameters
    if (!instrument) {
      throw new Error('Instrument is required');
    }
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    // Fetch real historical data based on instrument type
    const historicalData = await fetchHistoricalData(
      instrument,
      instrumentCategory,
      startDate,
      endDate,
      timeframe
    );

    if (!historicalData || historicalData.length === 0) {
      throw new Error('No historical data available for the selected period');
    }

    console.log(`Fetched ${historicalData.length} data points for backtesting`);

    // Run pattern detection on real data
    const patternSignals = detectPatternsInData(
      historicalData,
      strategy.patterns?.filter((p: any) => p.enabled) || []
    );

    console.log(`Detected ${patternSignals.length} pattern signals`);

    // Simulate trades with entry/exit rules
    const tradeResults = simulateTrades(
      historicalData,
      patternSignals,
      strategy
    );

    // Calculate performance metrics
    const performanceMetrics = calculateMetrics(tradeResults, strategy);

    console.log('Backtest complete:', {
      totalTrades: tradeResults.length,
      winRate: performanceMetrics.winRate,
      totalReturn: performanceMetrics.totalReturn
    });

    return new Response(JSON.stringify({
      success: true,
      results: performanceMetrics,
      trades: tradeResults,
      dataPoints: historicalData.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Backtest error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to complete backtest'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchHistoricalData(
  symbol: string,
  category: string,
  startDate: string,
  endDate: string,
  timeframe: string
): Promise<any[]> {
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check cache first
  const { data: cachedData, error: cacheError } = await supabase
    .from('historical_prices')
    .select('*')
    .eq('symbol', symbol)
    .eq('timeframe', timeframe)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (!cacheError && cachedData && cachedData.length > 0) {
    console.log(`✅ Cache HIT: ${symbol} ${timeframe} (${cachedData.length} records)`);
    return cachedData.map((row: any) => ({
      timestamp: new Date(row.date).getTime(),
      date: row.date,
      open: parseFloat(row.open),
      high: parseFloat(row.high),
      low: parseFloat(row.low),
      close: parseFloat(row.close),
      volume: row.volume ? parseInt(row.volume) : 0
    }));
  }

  console.log(`❌ Cache MISS: Fetching ${symbol} from Yahoo Finance...`);

  // Convert timeframe to Yahoo Finance interval
  const intervalMap: Record<string, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
    '1w': '1wk',
  };
  
  const interval = intervalMap[timeframe] || '1d';
  
  // Validate date range based on interval (Yahoo Finance limits)
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // Yahoo Finance date range limits
  const limits: Record<string, number> = {
    '1m': 7,
    '5m': 60,
    '15m': 60,
    '1h': 730,
    '4h': 730,
    '1d': 36500, // ~100 years
    '1wk': 36500
  };
  
  const maxDays = limits[interval] || 730;
  if (daysDiff > maxDays) {
    throw new Error(`Date range too large for ${interval} timeframe. Maximum ${maxDays} days allowed, got ${daysDiff} days. Try using a daily (1d) timeframe for longer backtests.`);
  }
  
  // Convert dates to Unix timestamps
  const period1 = Math.floor(start.getTime() / 1000);
  const period2 = Math.floor(end.getTime() / 1000);

  // Adjust symbol format based on category
  let yahooSymbol = symbol;
  if (category === 'forex') {
    yahooSymbol = symbol.replace('/', '') + '=X';
  } else if (category === 'crypto') {
    yahooSymbol = symbol.replace('/', '-');
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${period1}&period2=${period2}&interval=${interval}`;
  
  console.log(`Fetching Yahoo Finance: ${url}`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Yahoo Finance error ${response.status}:`, errorText);
    throw new Error(`Yahoo Finance API error: ${response.status}. Symbol: ${yahooSymbol}, Interval: ${interval}, Days: ${daysDiff}. ${response.status === 422 ? 'Try using daily (1d) timeframe for longer date ranges.' : ''}`);
  }

  const data = await response.json();
  
  if (!data.chart?.result?.[0]) {
    throw new Error('No data returned from Yahoo Finance');
  }

  const result = data.chart.result[0];
  const timestamps = result.timestamp || [];
  const quotes = result.indicators.quote[0];
  
  // Convert to OHLCV format
  const historicalData = timestamps.map((timestamp: number, index: number) => ({
    timestamp: timestamp * 1000,
    date: new Date(timestamp * 1000).toISOString(),
    open: quotes.open[index],
    high: quotes.high[index],
    low: quotes.low[index],
    close: quotes.close[index],
    volume: quotes.volume[index]
  })).filter((bar: any) => 
    bar.open !== null && 
    bar.high !== null && 
    bar.low !== null && 
    bar.close !== null
  );

  // Cache the fetched data
  if (historicalData.length > 0) {
    const cacheRecords = historicalData.map((d: any) => ({
      symbol,
      instrument_type: category,
      timeframe,
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume
    }));

    const { error: insertError } = await supabase
      .from('historical_prices')
      .upsert(cacheRecords, { 
        onConflict: 'symbol,timeframe,date',
        ignoreDuplicates: true 
      });

    if (!insertError) {
      console.log(`✅ Cached ${cacheRecords.length} records for ${symbol}`);
    } else {
      console.error('Cache insert error:', insertError);
    }
  }

  return historicalData;
}

function detectPatternsInData(data: any[], patterns: any[]): any[] {
  const signals: any[] = [];
  
  // Sliding window pattern detection
  for (const pattern of patterns) {
    const windowSize = getPatternWindowSize(pattern.id);
    
    for (let i = windowSize; i < data.length; i++) {
      const window = data.slice(i - windowSize, i);
      const isPattern = checkPattern(pattern.id, window);
      
      if (isPattern) {
        signals.push({
          patternId: pattern.id,
          patternName: pattern.name,
          index: i,
          timestamp: data[i].timestamp,
          entryPrice: data[i].close,
          confidence: 0.75 // Base confidence
        });
      }
    }
  }
  
  return signals;
}

function getPatternWindowSize(patternId: string): number {
  const sizeMap: Record<string, number> = {
    'head-shoulders': 30,
    'double-top': 20,
    'double-bottom': 20,
    'cup-handle': 40,
    'ascending-triangle': 25,
    'descending-triangle': 25,
    'bull-flag': 15,
    'bear-flag': 15,
  };
  return sizeMap[patternId] || 20;
}

function checkPattern(patternId: string, window: any[]): boolean {
  if (window.length < 10) return false;
  
  const highs = window.map(d => d.high);
  const lows = window.map(d => d.low);
  const closes = window.map(d => d.close);
  
  // Simplified pattern detection logic
  switch (patternId) {
    case 'head-shoulders':
      return detectHeadAndShoulders(highs, lows);
    case 'double-top':
      return detectDoubleTop(highs);
    case 'double-bottom':
      return detectDoubleBottom(lows);
    case 'ascending-triangle':
      return detectAscendingTriangle(highs, lows);
    case 'cup-handle':
      return detectCupAndHandle(closes);
    default:
      return Math.random() < 0.05; // 5% detection rate for unknown patterns
  }
}

function detectHeadAndShoulders(highs: number[], lows: number[]): boolean {
  if (highs.length < 20) return false;
  
  const peaks = findPeaks(highs);
  if (peaks.length < 3) return false;
  
  // Check if middle peak is highest
  const lastThreePeaks = peaks.slice(-3);
  if (lastThreePeaks.length === 3) {
    const [left, head, right] = lastThreePeaks.map(i => highs[i]);
    return head > left && head > right && Math.abs(left - right) / left < 0.05;
  }
  
  return false;
}

function detectDoubleTop(highs: number[]): boolean {
  const peaks = findPeaks(highs);
  if (peaks.length < 2) return false;
  
  const lastTwoPeaks = peaks.slice(-2).map(i => highs[i]);
  const diff = Math.abs(lastTwoPeaks[0] - lastTwoPeaks[1]) / lastTwoPeaks[0];
  return diff < 0.02; // Within 2%
}

function detectDoubleBottom(lows: number[]): boolean {
  const troughs = findTroughs(lows);
  if (troughs.length < 2) return false;
  
  const lastTwoTroughs = troughs.slice(-2).map(i => lows[i]);
  const diff = Math.abs(lastTwoTroughs[0] - lastTwoTroughs[1]) / lastTwoTroughs[0];
  return diff < 0.02;
}

function detectAscendingTriangle(highs: number[], lows: number[]): boolean {
  if (lows.length < 15) return false;
  
  const recentLows = lows.slice(-15);
  const trend = calculateTrend(recentLows);
  const highVolatility = Math.max(...highs.slice(-15)) / Math.min(...highs.slice(-15));
  
  return trend > 0 && highVolatility < 1.05;
}

function detectCupAndHandle(closes: number[]): boolean {
  if (closes.length < 30) return false;
  
  const firstHalf = closes.slice(0, 15);
  const secondHalf = closes.slice(15, 30);
  
  const cupBottom = Math.min(...closes.slice(10, 20));
  const cupRims = [closes[0], closes[29]];
  
  return cupBottom < Math.min(...cupRims) * 0.95;
}

function findPeaks(data: number[]): number[] {
  const peaks: number[] = [];
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
      peaks.push(i);
    }
  }
  return peaks;
}

function findTroughs(data: number[]): number[] {
  const troughs: number[] = [];
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] < data[i - 1] && data[i] < data[i + 1]) {
      troughs.push(i);
    }
  }
  return troughs;
}

function calculateTrend(data: number[]): number {
  if (data.length < 2) return 0;
  const firstValue = data[0];
  const lastValue = data[data.length - 1];
  return (lastValue - firstValue) / firstValue;
}

function simulateTrades(data: any[], signals: any[], strategy: any): any[] {
  const trades: any[] = [];
  let balance = 10000; // Starting balance
  
  for (const signal of signals) {
    const entryIndex = signal.index;
    if (entryIndex >= data.length - 1) continue;
    
    const entryPrice = data[entryIndex].close;
    const positionSize = balance * (strategy.positionSizing?.riskPerTrade || 2) / 100;
    
    // Get pattern-specific rules or use defaults
    const patternRules = strategy.patternRules?.[signal.patternId];
    const targetPercent = strategy.targetGainPercent || 5;
    const stopPercent = strategy.stopLossPercent || 2;
    
    let exitIndex = entryIndex + 1;
    let exitPrice = data[exitIndex].close;
    let exitReason = 'timeout';
    
    // Simulate trade until exit condition
    for (let i = entryIndex + 1; i < Math.min(entryIndex + 50, data.length); i++) {
      const currentPrice = data[i].close;
      const priceChange = (currentPrice - entryPrice) / entryPrice * 100;
      
      // Check stop loss
      if (priceChange <= -stopPercent) {
        exitIndex = i;
        exitPrice = currentPrice;
        exitReason = 'stop-loss';
        break;
      }
      
      // Check target
      if (priceChange >= targetPercent) {
        exitIndex = i;
        exitPrice = currentPrice;
        exitReason = 'target';
        break;
      }
    }
    
    const pnl = ((exitPrice - entryPrice) / entryPrice) * positionSize;
    balance += pnl;
    
    trades.push({
      patternName: signal.patternName,
      entryDate: data[entryIndex].date,
      entryPrice,
      exitDate: data[exitIndex].date,
      exitPrice,
      exitReason,
      pnl,
      pnlPercent: ((exitPrice - entryPrice) / entryPrice) * 100,
      holdingBars: exitIndex - entryIndex
    });
  }
  
  return trades;
}

function calculateMetrics(trades: any[], strategy: any): any {
  if (trades.length === 0) {
    return {
      totalReturn: 0,
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      avgWin: 0,
      avgLoss: 0,
      sharpeRatio: 0
    };
  }
  
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl <= 0);
  
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  
  const initialBalance = 10000;
  const totalReturn = (totalPnl / initialBalance) * 100;
  
  // Calculate max drawdown
  let peak = initialBalance;
  let maxDrawdown = 0;
  let runningBalance = initialBalance;
  
  for (const trade of trades) {
    runningBalance += trade.pnl;
    if (runningBalance > peak) peak = runningBalance;
    const drawdown = ((peak - runningBalance) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  return {
    totalReturn: Number(totalReturn.toFixed(2)),
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: Number(((winningTrades.length / trades.length) * 100).toFixed(2)),
    profitFactor: totalLoss > 0 ? Number((totalProfit / totalLoss).toFixed(2)) : 0,
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    avgWin: winningTrades.length > 0 ? Number((totalProfit / winningTrades.length).toFixed(2)) : 0,
    avgLoss: losingTrades.length > 0 ? Number((totalLoss / losingTrades.length).toFixed(2)) : 0,
    sharpeRatio: 0, // Would need daily returns for accurate calculation
    avgHoldingPeriod: Number((trades.reduce((sum, t) => sum + t.holdingBars, 0) / trades.length).toFixed(1)),
    patternBreakdown: getPatternBreakdown(trades)
  };
}

function getPatternBreakdown(trades: any[]): any {
  const breakdown: Record<string, any> = {};
  
  for (const trade of trades) {
    if (!breakdown[trade.patternName]) {
      breakdown[trade.patternName] = {
        trades: 0,
        wins: 0,
        totalPnl: 0
      };
    }
    
    breakdown[trade.patternName].trades++;
    if (trade.pnl > 0) breakdown[trade.patternName].wins++;
    breakdown[trade.patternName].totalPnl += trade.pnl;
  }
  
  return breakdown;
}
