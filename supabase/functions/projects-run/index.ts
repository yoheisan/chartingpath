import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { computeBracketLevels, BRACKET_LEVELS_VERSION, ROUNDING_CONFIG } from "../_shared/bracketLevels.ts";
import { 
  estimateCredits as calculateCredits, 
  getTierCaps, 
  validateProjectInputs,
  PLANS_CONFIG,
  type PlanTier,
  type EstimateCreditsInput
} from "../_shared/plans.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= PREDEFINED UNIVERSES =============
const PREDEFINED_UNIVERSES: Record<string, Record<string, string[]>> = {
  crypto: {
    top10: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT', 'LINKUSDT', 'MATICUSDT'],
    top20: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT', 'LINKUSDT', 'MATICUSDT',
            'DOTUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT', 'NEARUSDT', 'APTUSDT', 'ARBUSDT', 'OPUSDT', 'FILUSDT', 'VETUSDT'],
  },
  fx: {
    majors: ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X', 'USDCAD=X'],
    crosses: ['EURGBP=X', 'EURJPY=X', 'GBPJPY=X', 'AUDJPY=X', 'NZDUSD=X', 'EURCHF=X'],
  },
  stocks: {
    sp500_leaders: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B', 'UNH', 'JNJ'],
    tech_30: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'INTC', 'CRM',
              'ORCL', 'ADBE', 'CSCO', 'IBM', 'QCOM', 'TXN', 'AVGO', 'MU', 'NOW', 'SNOW',
              'PANW', 'CRWD', 'ZS', 'NET', 'DDOG', 'TEAM', 'OKTA', 'ZM', 'SHOP', 'SQ'],
  },
};

// Pattern registry
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

// Map tier from DB to plan tier
function mapDbTierToPlanTier(dbTier: string | null): PlanTier {
  if (!dbTier) return 'FREE';
  const tierMap: Record<string, PlanTier> = {
    'free': 'FREE',
    'plus': 'PLUS', 
    'pro': 'PRO',
    'team': 'TEAM',
    'starter': 'FREE', // Map legacy starter to FREE
  };
  return tierMap[dbTier.toLowerCase()] || 'FREE';
}

// Estimate cache hit ratio by checking existing data coverage
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
    
    // Check how many instruments have cached data
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
    return 0; // Assume no cache on error
  }
}

async function fetchYahooData(symbol: string, startDate: string, endDate: string, interval: string) {
  const period1 = Math.floor(new Date(startDate).getTime() / 1000);
  const period2 = Math.floor(new Date(endDate).getTime() / 1000);
  
  // Map interval format
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
  
  // Aggregate to 4h if needed
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
      const { assetClass, universe, patterns, timeframe, lookbackYears = 1 } = body;
      
      const instruments = PREDEFINED_UNIVERSES[assetClass]?.[universe] || [];
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Estimate cache hit ratio
      const cacheHitRatio = await estimateCacheHitRatio(supabase, instruments, timeframe, lookbackYears);
      
      // Calculate credits using deterministic formula
      const estimateInput: EstimateCreditsInput = {
        projectType: 'setup_finder',
        instrumentCount: instruments.length,
        patternCount: patterns.length,
        lookbackYears,
        timeframe,
        cacheHitRatio
      };
      const creditResult = calculateCredits(estimateInput);
      
      // Get user for cap check (optional - can estimate without auth)
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
          const { data: credits } = await supabase
            .from('usage_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (credits) {
            const tier = mapDbTierToPlanTier(credits.plan_tier);
            const tierCaps = getTierCaps(tier);
            capInfo.tier = tier;
            capInfo.creditsBalance = credits.credits_balance;
            capInfo.dailyRunCap = tierCaps.dailyRunCap;
            
            // Check credits
            if (credits.credits_balance < creditResult.creditsEstimated) {
              capInfo.allowed = false;
              capInfo.reason = 'insufficient_credits';
              capInfo.errors.push(`Need ${creditResult.creditsEstimated} credits, have ${credits.credits_balance}`);
            }
            
            // Validate against tier caps
            const validation = validateProjectInputs(tier, 'setup_finder', {
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
            
            // Check daily run count
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
      
      if (projectType !== 'setup_finder') {
        return new Response(JSON.stringify({ error: 'Unsupported project type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const { assetClass, universe, patterns, timeframe, riskPerTrade = 1 } = inputs;
      const instruments = PREDEFINED_UNIVERSES[assetClass]?.[universe] || [];
      const creditsEstimated = estimateCredits({ assetClass, universe, patterns, timeframe });
      
      // Validate caps
      const { data: credits } = await supabase
        .from('usage_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
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
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          type: 'setup_finder',
          name: `Setup Finder - ${assetClass} ${universe}`,
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
          input_json: { assetClass, universe, patterns, timeframe, riskPerTrade },
        });
      
      // Create project run (queued)
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
      
      // Emit analytics event
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event_name: 'project_run_started',
        properties: {
          projectType: 'setup_finder',
          timeframe,
          instrumentCount: instruments.length,
          patternCount: patterns.length,
          creditsEstimated,
        },
      });
      
      // ============= SYNCHRONOUS EXECUTION (MVP) =============
      // For small universes (<= 50), execute synchronously
      console.log(`Starting Setup Finder execution for ${instruments.length} instruments`);
      
      // Update status to running
      await supabase
        .from('project_runs')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', run.id);
      
      try {
        const setups: any[] = [];
        const lookbackDays = timeframe === '4h' ? 60 : 180;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - lookbackDays);
        
        for (const instrument of instruments) {
          console.log(`Processing ${instrument}...`);
          
          // Fetch data
          const bars = await fetchYahooData(
            instrument,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            timeframe
          );
          
          if (bars.length < 20) {
            console.log(`Insufficient data for ${instrument}: ${bars.length} bars`);
            continue;
          }
          
          // Check each pattern
          for (const patternId of patterns) {
            const pattern = WEDGE_PATTERN_REGISTRY[patternId];
            if (!pattern) {
              console.log(`Unknown pattern: ${patternId}`);
              continue;
            }
            
            // Check if pattern detected on recent window
            const window = bars.slice(-20);
            const detected = pattern.detector(window);
            
            if (detected) {
              const lastBar = bars[bars.length - 1];
              const atr = calculateATR(bars, 14);
              
              // Compute bracket levels
              const bracketLevels = computeBracketLevels({
                direction: pattern.direction,
                entryPrice: lastBar.close,
                stopPercent: (atr / lastBar.close) * 100 * 2, // 2x ATR
                targetPercent: (atr / lastBar.close) * 100 * 4, // 4x ATR (2:1 RR)
                atr,
                atrMultiplier: 2.0,
                stopLossMethod: 'atr',
                takeProfitMethod: 'ratio',
              });
              
              setups.push({
                instrument,
                patternId,
                patternName: pattern.displayName,
                direction: pattern.direction,
                signalTs: lastBar.date,
                quality: {
                  score: atr > 0 ? 'B' : 'C',
                  reasons: ['Pattern detected on latest bar'],
                },
                tradePlan: {
                  entryType: 'bar_close',
                  entry: bracketLevels.stopLossPrice < lastBar.close 
                    ? lastBar.close 
                    : bracketLevels.takeProfitPrice,
                  stopLoss: bracketLevels.stopLossPrice,
                  takeProfit: bracketLevels.takeProfitPrice,
                  rr: bracketLevels.riskRewardRatio,
                  stopDistance: bracketLevels.stopDistance,
                  tpDistance: bracketLevels.tpDistance,
                  timeStopBars: 100,
                  bracketLevelsVersion: BRACKET_LEVELS_VERSION,
                  priceRounding: ROUNDING_CONFIG,
                },
                visualSpec: null,
              });
              
              console.log(`Found ${patternId} on ${instrument}`);
            }
          }
        }
        
        // Sort by quality
        setups.sort((a, b) => {
          const scoreOrder = { A: 0, B: 1, C: 2 };
          return (scoreOrder[a.quality.score as keyof typeof scoreOrder] || 3) - 
                 (scoreOrder[b.quality.score as keyof typeof scoreOrder] || 3);
        });
        
        // Create artifact
        const artifactJson = {
          projectType: 'setup_finder',
          timeframe,
          generatedAt: new Date().toISOString(),
          executionAssumptions: {
            bracketLevelsVersion: BRACKET_LEVELS_VERSION,
            priceRounding: ROUNDING_CONFIG,
            patternRegistry: Object.keys(WEDGE_PATTERN_REGISTRY),
          },
          setups,
        };
        
        const { error: artifactError } = await supabase
          .from('artifacts')
          .insert({
            project_run_id: run.id,
            type: 'setup_list',
            artifact_json: artifactJson,
          });
        
        if (artifactError) {
          console.error('Artifact creation error:', artifactError);
        }
        
        // Also create trade_plans rows
        for (const setup of setups) {
          await supabase.from('trade_plans').insert({
            project_run_id: run.id,
            instrument: setup.instrument,
            direction: setup.direction,
            entry_price: setup.tradePlan.entry,
            stop_loss: setup.tradePlan.stopLoss,
            take_profit: setup.tradePlan.takeProfit,
            rr_ratio: setup.tradePlan.rr,
            time_stop_bars: setup.tradePlan.timeStopBars,
            bracket_levels_version: BRACKET_LEVELS_VERSION,
            metadata: {
              patternId: setup.patternId,
              patternName: setup.patternName,
              quality: setup.quality,
            },
          });
        }
        
        // Deduct credits
        const creditsUsed = creditsEstimated;
        if (credits) {
          await supabase
            .from('usage_credits')
            .update({ credits_balance: credits.credits_balance - creditsUsed })
            .eq('user_id', user.id);
        }
        
        // Update run status to succeeded
        await supabase
          .from('project_runs')
          .update({
            status: 'succeeded',
            finished_at: new Date().toISOString(),
            credits_used: creditsUsed,
          })
          .eq('id', run.id);
        
        // Emit success analytics
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event_name: 'project_run_succeeded',
          properties: {
            projectType: 'setup_finder',
            timeframe,
            instrumentCount: instruments.length,
            patternCount: patterns.length,
            setupsFound: setups.length,
            creditsUsed,
          },
        });
        
        console.log(`Setup Finder completed: ${setups.length} setups found`);
        
        return new Response(JSON.stringify({
          runId: run.id,
          projectId: project.id,
          status: 'succeeded',
          setupsFound: setups.length,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      } catch (execError) {
        console.error('Execution error:', execError);
        
        // Update run status to failed
        await supabase
          .from('project_runs')
          .update({
            status: 'failed',
            finished_at: new Date().toISOString(),
            error_message: execError.message,
          })
          .eq('id', run.id);
        
        // Emit failure analytics
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event_name: 'project_run_failed',
          properties: {
            projectType: 'setup_finder',
            error: execError.message,
          },
        });
        
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
      
      // Get run
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
      
      // Get artifact if exists
      let artifact = null;
      if (run.status === 'succeeded') {
        const { data: artifactData } = await supabase
          .from('artifacts')
          .select('*')
          .eq('project_run_id', runId)
          .eq('type', 'setup_list')
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
    
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
