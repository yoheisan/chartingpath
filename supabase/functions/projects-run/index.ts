import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { computeBracketLevels, BRACKET_LEVELS_VERSION, ROUNDING_CONFIG } from "../_shared/bracketLevels.ts";
import { 
  estimateCredits as calculateCredits, 
  getTierCaps, 
  validateProjectInputs,
  PLANS_CONFIG,
  type PlanTier,
  type EstimateCreditsInput,
  type ProjectType
} from "../_shared/plans.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= PREDEFINED UNIVERSES =============
const PREDEFINED_UNIVERSES: Record<string, Record<string, string[]>> = {
  crypto: {
    top10: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'AVAX-USD', 'DOGE-USD', 'LINK-USD', 'MATIC-USD'],
    top25: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'AVAX-USD', 'DOGE-USD', 'LINK-USD', 'MATIC-USD',
            'DOT-USD', 'LTC-USD', 'UNI-USD', 'ATOM-USD', 'NEAR-USD', 'APT-USD', 'ARB-USD', 'OP-USD', 'FIL-USD', 'VET-USD',
            'INJ-USD', 'IMX-USD', 'SUI-USD', 'SEI-USD', 'TIA-USD'],
  },
  fx: {
    majors: ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X', 'USDCAD=X', 'NZDUSD=X', 'EURJPY=X'],
    majors_crosses: ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X', 'USDCAD=X', 'NZDUSD=X',
                     'EURGBP=X', 'EURJPY=X', 'GBPJPY=X', 'AUDJPY=X', 'EURCHF=X', 'GBPCHF=X', 'EURAUD=X',
                     'AUDCAD=X', 'NZDJPY=X', 'CADJPY=X', 'AUDNZD=X', 'EURNZD=X', 'GBPAUD=X'],
  },
  stocks: {
    sp500_leaders: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B', 'UNH', 'JNJ',
                    'V', 'PG', 'JPM', 'HD', 'MA', 'CVX', 'MRK', 'ABBV', 'LLY', 'PEP', 'KO', 'AVGO', 'COST', 'WMT', 'MCD'],
    sp500_50: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B', 'UNH', 'JNJ',
               'V', 'PG', 'JPM', 'HD', 'MA', 'CVX', 'MRK', 'ABBV', 'LLY', 'PEP', 
               'KO', 'AVGO', 'COST', 'WMT', 'MCD', 'CSCO', 'TMO', 'ACN', 'ABT', 'DHR',
               'ADBE', 'CRM', 'AMD', 'TXN', 'NKE', 'ORCL', 'PFE', 'COP', 'QCOM', 'NFLX',
               'INTC', 'INTU', 'HON', 'IBM', 'AMGN', 'UPS', 'LOW', 'GE', 'BA', 'CAT'],
  },
};

// Pattern registry with detection logic
const WEDGE_PATTERN_REGISTRY: Record<string, { direction: 'long' | 'short'; displayName: string; detector: (w: any[]) => boolean }> = {
  'donchian-breakout-long': {
    direction: 'long',
    detector: (window) => {
      if (window.length < 10) return false;
      const highs = window.map(d => d.high);
      const closes = window.map(d => d.close);
      const recentHigh = Math.max(...highs.slice(-10, -1));
      const currentClose = closes[closes.length - 1];
      return currentClose > recentHigh * 1.005;
    },
    displayName: 'Donchian Breakout (Long)'
  },
  'donchian-breakout-short': {
    direction: 'short',
    detector: (window) => {
      if (window.length < 10) return false;
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      const recentLow = Math.min(...lows.slice(-10, -1));
      const currentClose = closes[closes.length - 1];
      return currentClose < recentLow * 0.995;
    },
    displayName: 'Donchian Breakout (Short)'
  },
  'double-top': {
    direction: 'short',
    detector: (window) => {
      if (window.length < 15) return false;
      const highs = window.map(d => d.high);
      const peaks = findPeaks(highs);
      if (peaks.length < 2) return false;
      const lastTwo = peaks.slice(-2).map(i => highs[i]);
      return Math.abs(lastTwo[0] - lastTwo[1]) / lastTwo[0] < 0.02;
    },
    displayName: 'Double Top (Short)'
  },
  'double-bottom': {
    direction: 'long',
    detector: (window) => {
      if (window.length < 15) return false;
      const lows = window.map(d => d.low);
      const troughs = findTroughs(lows);
      if (troughs.length < 2) return false;
      const lastTwo = troughs.slice(-2).map(i => lows[i]);
      return Math.abs(lastTwo[0] - lastTwo[1]) / lastTwo[0] < 0.02;
    },
    displayName: 'Double Bottom (Long)'
  },
  'ascending-triangle': {
    direction: 'long',
    detector: (window) => {
      if (window.length < 15) return false;
      const lows = window.map(d => d.low);
      const highs = window.map(d => d.high);
      const trend = calculateTrend(lows.slice(-15));
      const highVol = Math.max(...highs.slice(-15)) / Math.min(...highs.slice(-15));
      return trend > 0 && highVol < 1.05;
    },
    displayName: 'Ascending Triangle (Long)'
  },
  'descending-triangle': {
    direction: 'short',
    detector: (window) => {
      if (window.length < 15) return false;
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const highTrend = calculateTrend(highs.slice(-15));
      const lowFlat = Math.max(...lows.slice(-15)) / Math.min(...lows.slice(-15));
      return highTrend < -0.01 && lowFlat < 1.03;
    },
    displayName: 'Descending Triangle (Short)'
  }
};

// ============= HELPER FUNCTIONS =============
function findPeaks(arr: number[]): number[] {
  const peaks: number[] = [];
  for (let i = 2; i < arr.length - 2; i++) {
    if (arr[i] > arr[i-1] && arr[i] > arr[i-2] && arr[i] > arr[i+1] && arr[i] > arr[i+2]) {
      peaks.push(i);
    }
  }
  return peaks;
}

function findTroughs(arr: number[]): number[] {
  const troughs: number[] = [];
  for (let i = 2; i < arr.length - 2; i++) {
    if (arr[i] < arr[i-1] && arr[i] < arr[i-2] && arr[i] < arr[i+1] && arr[i] < arr[i+2]) {
      troughs.push(i);
    }
  }
  return troughs;
}

function calculateTrend(arr: number[]): number {
  if (arr.length < 2) return 0;
  const n = arr.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += arr[i];
    sumXY += i * arr[i];
    sumX2 += i * i;
  }
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

function calculateATR(data: any[], period = 14): number {
  if (data.length < period + 1) return 0;
  let atrSum = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1]?.close || data[i].open;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    atrSum += tr;
  }
  return atrSum / period;
}

function calculateVolatility(data: any[], period = 20): number {
  if (data.length < period) return 0;
  const returns: number[] = [];
  for (let i = data.length - period; i < data.length; i++) {
    const prevClose = data[i - 1]?.close || data[i].open;
    returns.push((data[i].close - prevClose) / prevClose);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252); // Annualized
}

function classifyRegime(data: any[]): { trend: 'UP' | 'DOWN' | 'SIDEWAYS'; volatility: 'HIGH' | 'LOW' | 'MED' } {
  const sma20 = data.slice(-20).reduce((sum, d) => sum + d.close, 0) / 20;
  const sma50 = data.slice(-50).reduce((sum, d) => sum + d.close, 0) / Math.min(50, data.length);
  const currentPrice = data[data.length - 1].close;
  
  let trend: 'UP' | 'DOWN' | 'SIDEWAYS';
  if (currentPrice > sma20 * 1.02 && sma20 > sma50) trend = 'UP';
  else if (currentPrice < sma20 * 0.98 && sma20 < sma50) trend = 'DOWN';
  else trend = 'SIDEWAYS';
  
  const vol = calculateVolatility(data);
  let volatility: 'HIGH' | 'LOW' | 'MED';
  if (vol > 0.30) volatility = 'HIGH';
  else if (vol < 0.15) volatility = 'LOW';
  else volatility = 'MED';
  
  return { trend, volatility };
}

function mapDbTierToPlanTier(dbTier: string | null): PlanTier {
  if (!dbTier) return 'FREE';
  const tierMap: Record<string, PlanTier> = {
    'free': 'FREE',
    'plus': 'PLUS', 
    'pro': 'PRO',
    'team': 'TEAM',
    'starter': 'FREE',
  };
  return tierMap[dbTier.toLowerCase()] || 'FREE';
}

async function estimateCacheHitRatio(
  supabase: any,
  instruments: string[],
  timeframe: string,
  lookbackYears: number
): Promise<number> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - lookbackYears);
    
    const { count } = await supabase
      .from('historical_prices')
      .select('symbol', { count: 'exact', head: true })
      .in('symbol', instruments)
      .eq('timeframe', timeframe)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());
    
    const cachedCount = count || 0;
    return Math.min(cachedCount / instruments.length, 1.0);
  } catch {
    return 0;
  }
}

async function fetchYahooData(symbol: string, startDate: string, endDate: string, interval: string) {
  const period1 = Math.floor(new Date(startDate).getTime() / 1000);
  const period2 = Math.floor(new Date(endDate).getTime() / 1000);
  const yahooInterval = interval === '4h' ? '1h' : interval === '1d' ? '1d' : '1h';
  
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=${yahooInterval}&events=history`;
  
  const response = await fetch(yahooUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  
  if (!response.ok) return [];
  
  const data = await response.json();
  if (!data.chart?.result?.[0]) return [];
  
  const result = data.chart.result[0];
  const timestamps = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0] || {};
  
  const bars = timestamps.map((ts: number, idx: number) => ({
    timestamp: ts * 1000,
    date: new Date(ts * 1000).toISOString(),
    open: quotes.open?.[idx] || 0,
    high: quotes.high?.[idx] || 0,
    low: quotes.low?.[idx] || 0,
    close: quotes.close?.[idx] || 0,
    volume: quotes.volume?.[idx] || 0,
  })).filter((b: any) => b.close > 0);
  
  if (interval === '4h' && bars.length > 0) {
    const aggregated: any[] = [];
    for (let i = 0; i < bars.length; i += 4) {
      const chunk = bars.slice(i, i + 4);
      if (chunk.length === 0) continue;
      aggregated.push({
        timestamp: chunk[0].timestamp,
        date: chunk[0].date,
        open: chunk[0].open,
        high: Math.max(...chunk.map((c: any) => c.high)),
        low: Math.min(...chunk.map((c: any) => c.low)),
        close: chunk[chunk.length - 1].close,
        volume: chunk.reduce((sum: number, c: any) => sum + c.volume, 0),
      });
    }
    return aggregated;
  }
  
  return bars;
}

// ============= BACKTEST ENGINE =============
interface BacktestTrade {
  entryDate: string;
  exitDate: string;
  instrument: string;
  patternId: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  rMultiple: number;
  isWin: boolean;
  regime: string;
  exitReason: 'tp' | 'sl' | 'time_stop';
}

function runPatternBacktest(
  bars: any[],
  patternId: string,
  pattern: { direction: 'long' | 'short'; displayName: string; detector: (w: any[]) => boolean },
  instrument: string
): BacktestTrade[] {
  const trades: BacktestTrade[] = [];
  const lookback = 20;
  const maxBarsInTrade = 50;
  
  for (let i = lookback; i < bars.length - maxBarsInTrade; i++) {
    const window = bars.slice(i - lookback, i + 1);
    const detected = pattern.detector(window);
    
    if (!detected) continue;
    
    const entryBar = bars[i];
    const entryPrice = entryBar.close;
    const atr = calculateATR(bars.slice(0, i + 1), 14);
    
    const stopDistance = atr * 2;
    const tpDistance = atr * 4; // 2:1 R
    
    const isLong = pattern.direction === 'long';
    const stopLoss = isLong ? entryPrice - stopDistance : entryPrice + stopDistance;
    const takeProfit = isLong ? entryPrice + tpDistance : entryPrice - tpDistance;
    
    // Simulate trade
    let exitDate = entryBar.date;
    let exitPrice = entryPrice;
    let exitReason: 'tp' | 'sl' | 'time_stop' = 'time_stop';
    
    for (let j = i + 1; j < Math.min(i + maxBarsInTrade, bars.length); j++) {
      const bar = bars[j];
      
      if (isLong) {
        if (bar.low <= stopLoss) {
          exitPrice = stopLoss;
          exitDate = bar.date;
          exitReason = 'sl';
          break;
        }
        if (bar.high >= takeProfit) {
          exitPrice = takeProfit;
          exitDate = bar.date;
          exitReason = 'tp';
          break;
        }
      } else {
        if (bar.high >= stopLoss) {
          exitPrice = stopLoss;
          exitDate = bar.date;
          exitReason = 'sl';
          break;
        }
        if (bar.low <= takeProfit) {
          exitPrice = takeProfit;
          exitDate = bar.date;
          exitReason = 'tp';
          break;
        }
      }
      
      if (j === Math.min(i + maxBarsInTrade, bars.length) - 1) {
        exitPrice = bar.close;
        exitDate = bar.date;
        exitReason = 'time_stop';
      }
    }
    
    const pnl = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;
    const rMultiple = stopDistance > 0 ? pnl / stopDistance : 0;
    
    const regime = classifyRegime(bars.slice(0, i + 1));
    
    trades.push({
      entryDate: entryBar.date,
      exitDate,
      instrument,
      patternId,
      direction: pattern.direction,
      entryPrice,
      exitPrice,
      rMultiple,
      isWin: pnl > 0,
      regime: `${regime.trend}_${regime.volatility}`,
      exitReason
    });
    
    // Skip ahead to avoid overlapping trades
    i += 5;
  }
  
  return trades;
}

// ============= PORTFOLIO SIMULATION ENGINE =============
interface PortfolioBar {
  date: string;
  value: number;
  drawdown: number;
  weights: Record<string, number>;
}

function runPortfolioSimulation(
  holdings: { symbol: string; bars: any[]; weight: number }[],
  config: { 
    initialValue: number; 
    rebalanceFrequency: 'monthly' | 'quarterly' | 'yearly' | 'never';
    dcaAmount?: number;
    dcaFrequency?: 'monthly' | 'weekly';
  }
): { equity: PortfolioBar[]; metrics: any } {
  const { initialValue, rebalanceFrequency, dcaAmount = 0, dcaFrequency } = config;
  const equity: PortfolioBar[] = [];
  
  // Get aligned dates
  const allDates = new Set<string>();
  holdings.forEach(h => h.bars.forEach(b => allDates.add(b.date.split('T')[0])));
  const dates = Array.from(allDates).sort();
  
  if (dates.length === 0) return { equity: [], metrics: {} };
  
  // Initialize positions
  let cash = initialValue;
  const positions: Record<string, { shares: number; avgCost: number }> = {};
  let totalContributions = initialValue;
  let peakValue = initialValue;
  
  // Initial allocation
  holdings.forEach(h => {
    const firstBar = h.bars.find(b => b.date.split('T')[0] === dates[0]);
    if (firstBar && h.weight > 0) {
      const allocation = initialValue * h.weight;
      const shares = allocation / firstBar.close;
      positions[h.symbol] = { shares, avgCost: firstBar.close };
      cash -= allocation;
    }
  });
  
  let lastRebalanceMonth = -1;
  let lastDCAWeek = -1;
  
  for (const date of dates) {
    const d = new Date(date);
    const month = d.getMonth();
    const week = Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
    
    // DCA
    if (dcaAmount > 0 && dcaFrequency) {
      const shouldDCA = dcaFrequency === 'monthly' ? month !== lastRebalanceMonth : week !== lastDCAWeek;
      if (shouldDCA) {
        cash += dcaAmount;
        totalContributions += dcaAmount;
        
        // Allocate DCA
        holdings.forEach(h => {
          const bar = h.bars.find(b => b.date.split('T')[0] === date);
          if (bar && h.weight > 0) {
            const allocation = dcaAmount * h.weight;
            const shares = allocation / bar.close;
            if (!positions[h.symbol]) {
              positions[h.symbol] = { shares: 0, avgCost: bar.close };
            }
            const pos = positions[h.symbol];
            const totalShares = pos.shares + shares;
            pos.avgCost = (pos.avgCost * pos.shares + bar.close * shares) / totalShares;
            pos.shares = totalShares;
            cash -= allocation;
          }
        });
        
        if (dcaFrequency === 'monthly') lastRebalanceMonth = month;
        if (dcaFrequency === 'weekly') lastDCAWeek = week;
      }
    }
    
    // Rebalance check
    const shouldRebalance = 
      rebalanceFrequency === 'monthly' && month !== lastRebalanceMonth ||
      rebalanceFrequency === 'quarterly' && month % 3 === 0 && month !== lastRebalanceMonth ||
      rebalanceFrequency === 'yearly' && month === 0 && month !== lastRebalanceMonth;
    
    if (shouldRebalance && rebalanceFrequency !== 'never') {
      // Calculate current value
      let currentValue = cash;
      holdings.forEach(h => {
        const bar = h.bars.find(b => b.date.split('T')[0] === date);
        if (bar && positions[h.symbol]) {
          currentValue += positions[h.symbol].shares * bar.close;
        }
      });
      
      // Rebalance
      holdings.forEach(h => {
        const bar = h.bars.find(b => b.date.split('T')[0] === date);
        if (bar) {
          const targetValue = currentValue * h.weight;
          const currentShares = positions[h.symbol]?.shares || 0;
          const currentVal = currentShares * bar.close;
          const diff = targetValue - currentVal;
          const shareDiff = diff / bar.close;
          
          if (!positions[h.symbol]) {
            positions[h.symbol] = { shares: 0, avgCost: bar.close };
          }
          positions[h.symbol].shares += shareDiff;
        }
      });
      
      lastRebalanceMonth = month;
    }
    
    // Calculate portfolio value
    let portfolioValue = cash;
    const weights: Record<string, number> = {};
    
    holdings.forEach(h => {
      const bar = h.bars.find(b => b.date.split('T')[0] === date);
      if (bar && positions[h.symbol]) {
        const value = positions[h.symbol].shares * bar.close;
        portfolioValue += value;
      }
    });
    
    holdings.forEach(h => {
      const bar = h.bars.find(b => b.date.split('T')[0] === date);
      if (bar && positions[h.symbol]) {
        weights[h.symbol] = (positions[h.symbol].shares * bar.close) / portfolioValue;
      }
    });
    
    peakValue = Math.max(peakValue, portfolioValue);
    const drawdown = (peakValue - portfolioValue) / peakValue;
    
    equity.push({ date, value: portfolioValue, drawdown, weights });
  }
  
  // Calculate metrics
  const finalValue = equity[equity.length - 1]?.value || initialValue;
  const totalReturn = (finalValue - totalContributions) / totalContributions;
  const years = dates.length / 252;
  const cagr = Math.pow(finalValue / initialValue, 1 / years) - 1;
  const maxDD = Math.max(...equity.map(e => e.drawdown));
  
  return {
    equity,
    metrics: {
      totalReturn,
      cagr,
      maxDrawdown: maxDD,
      totalContributions,
      finalValue,
      sharpeRatio: cagr / (calculateVolatility(holdings[0]?.bars || []) || 0.15)
    }
  };
}

// ============= MAIN HANDLER =============
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // ============= ESTIMATE ENDPOINT =============
    if (path === 'estimate' && req.method === 'POST') {
      const body = await req.json();
      const { 
        projectType = 'setup_finder', 
        assetClass, 
        universe, 
        patterns = [], 
        timeframe = '1d', 
        lookbackYears = 1, 
        instruments: directInstruments,
        holdings = [],
        rebalancePerYear = 4
      } = body;
      
      // Resolve instruments - check for direct instruments first, then holdings, then predefined universes
      let instruments: string[] = [];
      if (directInstruments && directInstruments.length > 0) {
        instruments = directInstruments;
      } else if (holdings && holdings.length > 0) {
        instruments = holdings.map((h: any) => h.symbol).filter(Boolean);
      } else if (assetClass && universe && PREDEFINED_UNIVERSES[assetClass]?.[universe]) {
        instruments = PREDEFINED_UNIVERSES[assetClass][universe];
      }
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const cacheHitRatio = await estimateCacheHitRatio(supabase, instruments, timeframe, lookbackYears);
      
      const estimateInput: EstimateCreditsInput = {
        projectType: projectType as ProjectType,
        instrumentCount: instruments.length,
        patternCount: patterns.length || 1,
        lookbackYears,
        timeframe,
        cacheHitRatio,
        rebalancePerYear
      };
      const creditResult = calculateCredits(estimateInput);
      
      // Auth check
      const authHeader = req.headers.get('Authorization');
      let capInfo = { 
        allowed: true, 
        reason: null as string | null, 
        errors: [] as string[],
        creditsBalance: 25, 
        dailyRuns: 0,
        dailyRunCap: 1,
        tier: 'FREE' as PlanTier
      };
      
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          // Get or create usage_credits for user
          let { data: credits } = await supabase
            .from('usage_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          // If no credits record exists, create one with FREE tier defaults
          if (!credits) {
            console.log(`Creating usage_credits for user ${user.id}`);
            const { data: newCredits, error: createError } = await supabase
              .from('usage_credits')
              .insert({
                user_id: user.id,
                plan_tier: 'free',
                credits_balance: 25, // FREE tier monthly credits
              })
              .select()
              .single();
            
            if (createError) {
              console.error('Failed to create usage_credits:', createError);
            } else {
              credits = newCredits;
            }
          }
          
          if (credits) {
            const tier = mapDbTierToPlanTier(credits.plan_tier);
            const tierCaps = getTierCaps(tier);
            capInfo.tier = tier;
            capInfo.creditsBalance = credits.credits_balance;
            capInfo.dailyRunCap = tierCaps.dailyRunCap;
            
            if (credits.credits_balance < creditResult.creditsEstimated) {
              capInfo.allowed = false;
              capInfo.reason = 'insufficient_credits';
              capInfo.errors.push(`Need ${creditResult.creditsEstimated} credits, have ${credits.credits_balance}`);
            }
            
            const validation = validateProjectInputs(tier, projectType as ProjectType, {
              instrumentCount: instruments.length,
              lookbackYears,
              patternCount: patterns.length,
              timeframe
            });
            
            if (!validation.valid) {
              capInfo.allowed = false;
              capInfo.reason = 'tier_cap_exceeded';
              capInfo.errors.push(...validation.errors);
            }
            
            const today = new Date().toISOString().split('T')[0];
            const { count: dailyRunCount } = await supabase
              .from('project_runs')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'succeeded')
              .gte('created_at', `${today}T00:00:00Z`)
              .lte('created_at', `${today}T23:59:59Z`);
            
            capInfo.dailyRuns = dailyRunCount || 0;
            if ((dailyRunCount || 0) >= tierCaps.dailyRunCap) {
              capInfo.allowed = false;
              capInfo.reason = 'daily_cap_reached';
              capInfo.errors.push(`Daily run limit (${tierCaps.dailyRunCap}) reached`);
            }
          }
        }
      }
      
      return new Response(JSON.stringify({
        creditsEstimated: creditResult.creditsEstimated,
        breakdown: creditResult.breakdown,
        cacheHitRatio: creditResult.cacheHitRatio,
        instrumentCount: instruments.length,
        patternCount: patterns.length,
        instruments,
        ...capInfo,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // ============= RUN ENDPOINT =============
    if (path === 'run' && req.method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const body = await req.json();
      const { projectType, inputs } = body;
      
      console.log(`Starting ${projectType} run for user ${user.id}`);
      
      // Validate project type
      const validTypes: ProjectType[] = ['setup_finder', 'pattern_lab', 'portfolio_checkup', 'portfolio_sim'];
      if (!validTypes.includes(projectType)) {
        return new Response(JSON.stringify({ error: 'Unsupported project type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Extract inputs
      const { 
        assetClass, 
        universe, 
        patterns = [], 
        timeframe = '1d', 
        lookbackYears = 1,
        riskPerTrade = 1,
        instruments: directInstruments,
        holdings = [],
        rebalanceFrequency = 'quarterly',
        dcaAmount = 0,
        dcaFrequency = 'monthly',
        initialValue = 10000
      } = inputs || {};
      
      const instruments = directInstruments || holdings.map((h: any) => h.symbol) || PREDEFINED_UNIVERSES[assetClass]?.[universe] || [];
      
      // Calculate credits
      const creditResult = calculateCredits({
        projectType,
        instrumentCount: instruments.length,
        patternCount: patterns.length || 1,
        lookbackYears,
        timeframe,
        cacheHitRatio: 0,
        rebalancePerYear: rebalanceFrequency === 'monthly' ? 12 : rebalanceFrequency === 'quarterly' ? 4 : 1
      });
      const creditsEstimated = creditResult.creditsEstimated;
      
      // Get or create usage_credits
      let { data: credits } = await supabase
        .from('usage_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      // If no credits record exists, create one with FREE tier defaults
      if (!credits) {
        console.log(`Creating usage_credits for user ${user.id} during run`);
        const { data: newCredits, error: createError } = await supabase
          .from('usage_credits')
          .insert({
            user_id: user.id,
            plan_tier: 'free',
            credits_balance: 25,
          })
          .select()
          .single();
        
        if (!createError && newCredits) {
          credits = newCredits;
        }
      }
      
      if (credits && credits.credits_balance < creditsEstimated) {
        return new Response(JSON.stringify({ 
          error: 'Insufficient credits',
          creditsBalance: credits.credits_balance,
          creditsNeeded: creditsEstimated,
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Create project
      const projectName = projectType === 'setup_finder' ? `Setup Finder - ${assetClass || 'Custom'} ${universe || ''}` :
                          projectType === 'pattern_lab' ? `Pattern Lab - ${patterns.join(', ').slice(0, 30)}` :
                          projectType === 'portfolio_checkup' ? `Portfolio Checkup - ${instruments.length} holdings` :
                          `Portfolio Simulator - ${instruments.length} holdings`;
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          type: projectType,
          name: projectName,
        })
        .select()
        .single();
      
      if (projectError) {
        console.error('Project creation error:', projectError);
        return new Response(JSON.stringify({ error: 'Failed to create project' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Create project inputs
      await supabase
        .from('project_inputs')
        .insert({
          project_id: project.id,
          version: 1,
          input_json: inputs,
        });
      
      // Create project run
      const { data: run, error: runError } = await supabase
        .from('project_runs')
        .insert({
          project_id: project.id,
          status: 'queued',
          credits_estimated: creditsEstimated,
        })
        .select()
        .single();
      
      if (runError) {
        console.error('Run creation error:', runError);
        return new Response(JSON.stringify({ error: 'Failed to create run' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Update to running
      await supabase
        .from('project_runs')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', run.id);
      
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - lookbackYears);
        
        let artifactJson: any = null;
        let artifactType = 'setup_list';
        
        // ============= SETUP FINDER EXECUTION =============
        if (projectType === 'setup_finder') {
          const setups: any[] = [];
          const lookbackDays = timeframe === '4h' ? 60 : 180;
          const sfEndDate = new Date();
          const sfStartDate = new Date();
          sfStartDate.setDate(sfStartDate.getDate() - lookbackDays);
          
          for (const instrument of instruments) {
            console.log(`[SetupFinder] Processing ${instrument}...`);
            
            const bars = await fetchYahooData(
              instrument,
              sfStartDate.toISOString().split('T')[0],
              sfEndDate.toISOString().split('T')[0],
              timeframe
            );
            
            if (bars.length < 20) continue;
            
            for (const patternId of patterns) {
              const pattern = WEDGE_PATTERN_REGISTRY[patternId];
              if (!pattern) continue;
              
              const window = bars.slice(-20);
              const detected = pattern.detector(window);
              
              if (detected) {
                const lastBar = bars[bars.length - 1];
                const signalTs = lastBar.date;
                const atr = calculateATR(bars, 14);
                
                const bracketLevels = computeBracketLevels({
                  direction: pattern.direction,
                  entryPrice: lastBar.close,
                  stopPercent: (atr / lastBar.close) * 100 * 2,
                  targetPercent: (atr / lastBar.close) * 100 * 4,
                  atr,
                  atrMultiplier: 2.0,
                  stopLossMethod: 'atr',
                  takeProfitMethod: 'ratio',
                });
                
                const entryPrice = lastBar.close;
                
                // Visual spec
                const lookbackBarsForVisual = 120;
                const forwardBarsForVisual = 30;
                const signalBarIndex = bars.length - 1;
                const visualStartIdx = Math.max(0, signalBarIndex - lookbackBarsForVisual);
                const visualEndIdx = Math.min(bars.length - 1, signalBarIndex + forwardBarsForVisual);
                
                let visualBars = bars.slice(visualStartIdx, visualEndIdx + 1);
                if (visualBars.length > 200) visualBars = visualBars.slice(-200);
                
                const compressedBars = visualBars.map(b => ({
                  t: b.date,
                  o: Number(b.open.toFixed(6)),
                  h: Number(b.high.toFixed(6)),
                  l: Number(b.low.toFixed(6)),
                  c: Number(b.close.toFixed(6)),
                  v: b.volume || 0,
                }));
                
                const allLows = visualBars.map(b => b.low);
                const allHighs = visualBars.map(b => b.high);
                const minPrice = Math.min(...allLows, bracketLevels.stopLossPrice, bracketLevels.takeProfitPrice, entryPrice);
                const maxPrice = Math.max(...allHighs, bracketLevels.stopLossPrice, bracketLevels.takeProfitPrice, entryPrice);
                
                const visualSpec = {
                  version: '1.0.0',
                  symbol: instrument,
                  timeframe,
                  patternId,
                  signalTs,
                  window: { startTs: visualBars[0]?.date || signalTs, endTs: visualBars[visualBars.length - 1]?.date || signalTs },
                  yDomain: { min: minPrice * 0.97, max: maxPrice * 1.03 },
                  overlays: [
                    { type: 'hline', id: 'entry', price: entryPrice, label: 'Entry', style: 'primary' },
                    { type: 'hline', id: 'sl', price: bracketLevels.stopLossPrice, label: 'Stop', style: 'destructive' },
                    { type: 'hline', id: 'tp', price: bracketLevels.takeProfitPrice, label: 'Target', style: 'positive' },
                  ],
                };
                
                setups.push({
                  instrument,
                  patternId,
                  patternName: pattern.displayName,
                  direction: pattern.direction,
                  signalTs,
                  quality: { score: atr > 0 ? 'B' : 'C', reasons: ['Pattern detected on latest bar'] },
                  tradePlan: {
                    entryType: 'bar_close',
                    entry: entryPrice,
                    stopLoss: bracketLevels.stopLossPrice,
                    takeProfit: bracketLevels.takeProfitPrice,
                    rr: bracketLevels.riskRewardRatio,
                    stopDistance: bracketLevels.stopDistance,
                    tpDistance: bracketLevels.tpDistance,
                    timeStopBars: 100,
                    bracketLevelsVersion: BRACKET_LEVELS_VERSION,
                    priceRounding: ROUNDING_CONFIG,
                  },
                  bars: compressedBars,
                  visualSpec,
                });
              }
            }
          }
          
          setups.sort((a, b) => {
            const scoreOrder = { A: 0, B: 1, C: 2 };
            return (scoreOrder[a.quality.score as keyof typeof scoreOrder] || 3) - 
                   (scoreOrder[b.quality.score as keyof typeof scoreOrder] || 3);
          });
          
          artifactJson = {
            projectType: 'setup_finder',
            timeframe,
            generatedAt: new Date().toISOString(),
            executionAssumptions: { bracketLevelsVersion: BRACKET_LEVELS_VERSION, priceRounding: ROUNDING_CONFIG },
            setups,
          };
          artifactType = 'setup_list';
        }
        
        // ============= PATTERN LAB EXECUTION =============
        else if (projectType === 'pattern_lab') {
          console.log(`[PatternLab] Starting backtest for ${instruments.length} instruments, ${patterns.length} patterns, ${lookbackYears} years`);
          
          const allTrades: BacktestTrade[] = [];
          const patternResults: any[] = [];
          const equity: { date: string; value: number; drawdown: number }[] = [];
          
          // Fetch data and run backtests
          for (const instrument of instruments) {
            console.log(`[PatternLab] Processing ${instrument}...`);
            
            const bars = await fetchYahooData(
              instrument,
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0],
              timeframe
            );
            
            if (bars.length < 50) {
              console.log(`[PatternLab] Insufficient data for ${instrument}: ${bars.length} bars`);
              continue;
            }
            
            for (const patternId of patterns) {
              const pattern = WEDGE_PATTERN_REGISTRY[patternId];
              if (!pattern) continue;
              
              const trades = runPatternBacktest(bars, patternId, pattern, instrument);
              allTrades.push(...trades);
            }
          }
          
          console.log(`[PatternLab] Total trades: ${allTrades.length}`);
          
          // Calculate pattern-level stats
          for (const patternId of patterns) {
            const pattern = WEDGE_PATTERN_REGISTRY[patternId];
            if (!pattern) continue;
            
            const patternTrades = allTrades.filter(t => t.patternId === patternId);
            const wins = patternTrades.filter(t => t.isWin);
            const losses = patternTrades.filter(t => !t.isWin);
            
            const winRate = patternTrades.length > 0 ? wins.length / patternTrades.length : 0;
            const avgR = patternTrades.length > 0 ? patternTrades.reduce((s, t) => s + t.rMultiple, 0) / patternTrades.length : 0;
            const expectancy = winRate * (wins.length > 0 ? wins.reduce((s, t) => s + t.rMultiple, 0) / wins.length : 0) - 
                              (1 - winRate) * (losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.rMultiple, 0) / losses.length) : 1);
            
            const grossProfit = wins.reduce((s, t) => s + t.rMultiple, 0);
            const grossLoss = Math.abs(losses.reduce((s, t) => s + t.rMultiple, 0));
            const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
            
            // Regime breakdown
            const regimes = ['UP_HIGH', 'UP_MED', 'UP_LOW', 'DOWN_HIGH', 'DOWN_MED', 'DOWN_LOW', 'SIDEWAYS_HIGH', 'SIDEWAYS_MED', 'SIDEWAYS_LOW'];
            const regimeBreakdown = regimes.map(regimeKey => {
              const regimeTrades = patternTrades.filter(t => t.regime === regimeKey);
              const regimeWins = regimeTrades.filter(t => t.isWin);
              const regimeAvgR = regimeTrades.length > 0 ? regimeTrades.reduce((s, t) => s + t.rMultiple, 0) / regimeTrades.length : 0;
              
              return {
                regimeKey,
                n: regimeTrades.length,
                winRate: regimeTrades.length > 0 ? regimeWins.length / regimeTrades.length : 0,
                avgR: regimeAvgR,
                isReliable: regimeTrades.length >= 10,
                recommendation: regimeAvgR >= 0.3 ? 'trade' : regimeAvgR >= 0 ? 'caution' : 'avoid'
              };
            }).filter(r => r.n > 0);
            
            // Do-not-trade rules
            const doNotTradeRules: string[] = [];
            regimeBreakdown.forEach(r => {
              if (r.avgR < -0.5 && r.n >= 5) {
                const [trend, vol] = r.regimeKey.split('_');
                doNotTradeRules.push(`Avoid in ${trend.toLowerCase()} trend with ${vol.toLowerCase()} volatility (${r.n} trades, ${(r.avgR).toFixed(2)}R avg)`);
              }
            });
            
            // Drawdown calculation
            let runningR = 0;
            let peakR = 0;
            let maxDD = 0;
            for (const trade of patternTrades.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())) {
              runningR += trade.rMultiple;
              peakR = Math.max(peakR, runningR);
              maxDD = Math.max(maxDD, (peakR - runningR));
            }
            
            patternResults.push({
              patternId,
              patternName: pattern.displayName,
              direction: pattern.direction,
              totalTrades: patternTrades.length,
              winRate,
              avgRMultiple: avgR,
              expectancy,
              profitFactor,
              maxDrawdown: maxDD,
              sharpeRatio: avgR / (Math.sqrt(patternTrades.map(t => t.rMultiple).reduce((s, r) => s + r * r, 0) / patternTrades.length - avgR * avgR) || 1),
              regimeBreakdown,
              doNotTradeRules
            });
          }
          
          // Build equity curve
          let cumulativeR = 0;
          let peakValue = 10000;
          const sortedTrades = [...allTrades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
          
          for (const trade of sortedTrades) {
            cumulativeR += trade.rMultiple;
            const value = 10000 * (1 + cumulativeR * 0.01);
            peakValue = Math.max(peakValue, value);
            equity.push({
              date: trade.exitDate,
              value,
              drawdown: (peakValue - value) / peakValue
            });
          }
          
          // Summary
          const overallWinRate = allTrades.length > 0 ? allTrades.filter(t => t.isWin).length / allTrades.length : 0;
          const overallExpectancy = allTrades.length > 0 ? allTrades.reduce((s, t) => s + t.rMultiple, 0) / allTrades.length : 0;
          const bestPattern = patternResults.reduce((best, p) => p.expectancy > best.expectancy ? p : best, patternResults[0] || { id: '', name: '', expectancy: 0 });
          const worstPattern = patternResults.reduce((worst, p) => p.expectancy < worst.expectancy ? p : worst, patternResults[0] || { id: '', name: '', expectancy: 0 });
          
          artifactJson = {
            projectType: 'pattern_lab',
            timeframe,
            lookbackYears,
            generatedAt: new Date().toISOString(),
            executionAssumptions: {
              bracketLevelsVersion: BRACKET_LEVELS_VERSION,
              priceRounding: ROUNDING_CONFIG,
            },
            summary: {
              totalPatterns: patternResults.length,
              totalTrades: allTrades.length,
              overallWinRate,
              overallExpectancy,
              bestPattern: { id: bestPattern?.patternId || '', name: bestPattern?.patternName || '', expectancy: bestPattern?.expectancy || 0 },
              worstPattern: { id: worstPattern?.patternId || '', name: worstPattern?.patternName || '', expectancy: worstPattern?.expectancy || 0 },
            },
            patterns: patternResults,
            trades: allTrades.slice(0, 500), // Cap for size
            equity,
          };
          artifactType = 'backtest_report';
        }
        
        // ============= PORTFOLIO CHECKUP EXECUTION =============
        else if (projectType === 'portfolio_checkup') {
          console.log(`[PortfolioCheckup] Analyzing ${instruments.length} holdings`);
          
          const holdingsAnalysis: any[] = [];
          const overallRiskMetrics: any = { totalCorrelation: 0, concentrationRisk: 0, sectorExposure: {} };
          const alertSuggestions: any[] = [];
          
          for (const symbol of instruments) {
            console.log(`[PortfolioCheckup] Processing ${symbol}...`);
            
            const bars = await fetchYahooData(
              symbol,
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0],
              timeframe
            );
            
            if (bars.length < 20) continue;
            
            const regime = classifyRegime(bars);
            const atr = calculateATR(bars, 14);
            const volatility = calculateVolatility(bars);
            const lastPrice = bars[bars.length - 1].close;
            
            // Pattern detection for current state
            let currentPattern = 'None Detected';
            let patternSignal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
            
            for (const [patternId, pattern] of Object.entries(WEDGE_PATTERN_REGISTRY)) {
              const window = bars.slice(-20);
              if (pattern.detector(window)) {
                currentPattern = pattern.displayName;
                patternSignal = pattern.direction === 'long' ? 'bullish' : 'bearish';
                
                // Suggest alert if pattern detected
                alertSuggestions.push({
                  symbol,
                  patternId,
                  patternName: pattern.displayName,
                  direction: pattern.direction,
                  reason: `${pattern.displayName} detected on ${symbol}`,
                  priority: volatility > 0.25 ? 'high' : 'medium'
                });
                break;
              }
            }
            
            // Risk level
            let riskLevel: 'low' | 'medium' | 'high' = 'medium';
            if (volatility > 0.35 || regime.trend === 'DOWN') riskLevel = 'high';
            else if (volatility < 0.15 && regime.trend === 'UP') riskLevel = 'low';
            
            holdingsAnalysis.push({
              symbol,
              lastPrice,
              regime: `${regime.trend} trend, ${regime.volatility} volatility`,
              regimeKey: `${regime.trend}_${regime.volatility}`,
              currentPattern,
              patternSignal,
              volatility,
              atr,
              riskLevel,
              recommendation: patternSignal === 'bearish' ? 'watch' : patternSignal === 'bullish' ? 'hold' : 'neutral'
            });
          }
          
          // Calculate concentration risk
          const highRiskCount = holdingsAnalysis.filter(h => h.riskLevel === 'high').length;
          overallRiskMetrics.concentrationRisk = highRiskCount / instruments.length;
          overallRiskMetrics.highRiskHoldings = highRiskCount;
          overallRiskMetrics.averageVolatility = holdingsAnalysis.reduce((s, h) => s + h.volatility, 0) / holdingsAnalysis.length;
          
          artifactJson = {
            projectType: 'portfolio_checkup',
            timeframe,
            lookbackYears,
            generatedAt: new Date().toISOString(),
            summary: {
              totalHoldings: holdingsAnalysis.length,
              highRiskCount,
              averageVolatility: overallRiskMetrics.averageVolatility,
              alertSuggestionsCount: alertSuggestions.length
            },
            holdings: holdingsAnalysis,
            riskMetrics: overallRiskMetrics,
            alertSuggestions: alertSuggestions.slice(0, 10)
          };
          artifactType = 'portfolio_checkup';
        }
        
        // ============= PORTFOLIO SIMULATOR EXECUTION =============
        else if (projectType === 'portfolio_sim') {
          console.log(`[PortfolioSim] Simulating ${instruments.length} holdings over ${lookbackYears} years`);
          
          // Fetch data for all holdings
          const holdingsData: { symbol: string; bars: any[]; weight: number }[] = [];
          const targetWeight = 1 / instruments.length;
          
          for (const symbol of instruments) {
            console.log(`[PortfolioSim] Fetching ${symbol}...`);
            
            const bars = await fetchYahooData(
              symbol,
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0],
              timeframe
            );
            
            if (bars.length > 20) {
              holdingsData.push({
                symbol,
                bars,
                weight: holdings.find((h: any) => h.symbol === symbol)?.weight || targetWeight
              });
            }
          }
          
          // Run simulation
          const simResult = runPortfolioSimulation(holdingsData, {
            initialValue,
            rebalanceFrequency: rebalanceFrequency as 'monthly' | 'quarterly' | 'yearly' | 'never',
            dcaAmount,
            dcaFrequency: dcaFrequency as 'monthly' | 'weekly'
          });
          
          // Also run a "no rebalance" comparison
          const buyHoldResult = runPortfolioSimulation(holdingsData, {
            initialValue,
            rebalanceFrequency: 'never',
            dcaAmount: 0
          });
          
          artifactJson = {
            projectType: 'portfolio_sim',
            timeframe,
            lookbackYears,
            generatedAt: new Date().toISOString(),
            config: {
              initialValue,
              rebalanceFrequency,
              dcaAmount,
              dcaFrequency,
              holdings: holdingsData.map(h => ({ symbol: h.symbol, weight: h.weight }))
            },
            summary: {
              finalValue: simResult.metrics.finalValue,
              totalReturn: simResult.metrics.totalReturn,
              cagr: simResult.metrics.cagr,
              maxDrawdown: simResult.metrics.maxDrawdown,
              totalContributions: simResult.metrics.totalContributions,
              sharpeRatio: simResult.metrics.sharpeRatio
            },
            comparison: {
              withRebalancing: simResult.metrics,
              buyAndHold: buyHoldResult.metrics,
              rebalancingBenefit: simResult.metrics.totalReturn - buyHoldResult.metrics.totalReturn
            },
            equity: simResult.equity.filter((_, i) => i % Math.max(1, Math.floor(simResult.equity.length / 200)) === 0), // Downsample
          };
          artifactType = 'portfolio_sim';
        }
        
        // Save artifact
        if (artifactJson) {
          const { error: artifactError } = await supabase
            .from('artifacts')
            .insert({
              project_run_id: run.id,
              type: artifactType,
              artifact_json: artifactJson,
            });
          
          if (artifactError) {
            console.error('Artifact creation error:', artifactError);
          }
        }
        
        // Deduct credits
        if (credits) {
          await supabase
            .from('usage_credits')
            .update({ credits_balance: credits.credits_balance - creditsEstimated })
            .eq('user_id', user.id);
        }
        
        // Update run status
        await supabase
          .from('project_runs')
          .update({
            status: 'succeeded',
            finished_at: new Date().toISOString(),
            credits_used: creditsEstimated,
          })
          .eq('id', run.id);
        
        console.log(`[${projectType}] Completed successfully`);
        
        return new Response(JSON.stringify({
          runId: run.id,
          projectId: project.id,
          status: 'succeeded',
          setupsFound: artifactJson?.setups?.length || artifactJson?.trades?.length || artifactJson?.holdings?.length || 0,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      } catch (execError: any) {
        console.error('Execution error:', execError);
        
        await supabase
          .from('project_runs')
          .update({
            status: 'failed',
            finished_at: new Date().toISOString(),
            error_message: execError.message,
          })
          .eq('id', run.id);
        
        return new Response(JSON.stringify({
          runId: run.id,
          status: 'failed',
          error: execError.message,
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // ============= RESULT ENDPOINT =============
    if (path === 'result' && req.method === 'GET') {
      const runId = url.searchParams.get('runId');
      if (!runId) {
        return new Response(JSON.stringify({ error: 'Missing runId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const authHeader = req.headers.get('Authorization');
      const supabase = createClient(supabaseUrl, authHeader ? supabaseAnonKey : supabaseServiceKey);
      
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        await supabase.auth.setSession({ access_token: token, refresh_token: '' });
      }
      
      const { data: run, error: runError } = await supabase
        .from('project_runs')
        .select('*, projects(*)')
        .eq('id', runId)
        .single();
      
      if (runError || !run) {
        return new Response(JSON.stringify({ error: 'Run not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      let artifact = null;
      if (run.status === 'succeeded') {
        const { data: artifactData } = await supabase
          .from('artifacts')
          .select('*')
          .eq('project_run_id', runId)
          .single();
        artifact = artifactData;
      }
      
      return new Response(JSON.stringify({
        run: {
          id: run.id,
          status: run.status,
          creditsEstimated: run.credits_estimated,
          creditsUsed: run.credits_used,
          errorMessage: run.error_message,
          startedAt: run.started_at,
          finishedAt: run.finished_at,
        },
        project: run.projects,
        artifact: artifact?.artifact_json || null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
