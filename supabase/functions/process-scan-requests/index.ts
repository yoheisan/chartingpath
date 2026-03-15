import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  calculatePatternQualityScore,
  type OHLCBar,
  type PatternQualityScorerInput,
} from "../_shared/patternQualityScorer.ts";
import {
  analyzePatternTrend,
} from "../_shared/trendIndicators.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PER_RUN = 10; // Max tickers per cron invocation

// ── Pattern Detection (same as seed-historical-patterns) ─────────────────────
interface PatternPivot { index: number; price: number; type: 'high' | 'low'; label: string; timestamp?: string; }
interface PatternDetectionResult { detected: boolean; pivots: PatternPivot[]; patternStartIndex?: number; patternEndIndex?: number; }

// Simplified pattern registry with core patterns
const PATTERN_REGISTRY: Record<string, { direction: 'long' | 'short'; displayName: string; detector: (w: OHLCBar[]) => PatternDetectionResult }> = {
  'double-top': { direction: 'short', displayName: 'Double Top', detector: detectDoubleTop },
  'double-bottom': { direction: 'long', displayName: 'Double Bottom', detector: detectDoubleBottom },
  'bull-flag': { direction: 'long', displayName: 'Bull Flag', detector: detectBullFlag },
  'bear-flag': { direction: 'short', displayName: 'Bear Flag', detector: detectBearFlag },
  'ascending-triangle': { direction: 'long', displayName: 'Ascending Triangle', detector: detectAscTriangle },
  'descending-triangle': { direction: 'short', displayName: 'Descending Triangle', detector: detectDescTriangle },
  'donchian-breakout-long': { direction: 'long', displayName: 'Donchian Breakout (Long)', detector: detectDonchianLong },
  'donchian-breakout-short': { direction: 'short', displayName: 'Donchian Breakout (Short)', detector: detectDonchianShort },
};

// ── Pattern detector stubs (simplified but functional) ───────────────────────
function detectDoubleTop(w: OHLCBar[]): PatternDetectionResult {
  if (w.length < 15) return { detected: false, pivots: [] };
  const highs = w.map(d => d.high), lows = w.map(d => d.low), closes = w.map(d => d.close);
  const hh = Math.max(...highs), ll = Math.min(...lows), range = hh - ll, tol = range * 0.03;
  const prom = hh - range * 0.05;
  let t1 = -1, t2 = -1;
  for (let i = 2; i < w.length - 3; i++) {
    if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
      if (highs[i] < prom) continue;
      if (t1 === -1) t1 = i;
      else if (i - t1 >= 5 && Math.abs(highs[i] - highs[t1]) <= tol) { t2 = i; break; }
    }
  }
  if (t1 === -1 || t2 === -1) return { detected: false, pivots: [] };
  let nl = lows[t1]; for (let i = t1; i <= t2; i++) if (lows[i] < nl) nl = lows[i];
  const detected = closes[closes.length - 1] < nl * 0.998;
  return { detected, patternStartIndex: t1 - 2, patternEndIndex: t2 + 2, pivots: detected ? [{ index: t1, price: highs[t1], type: 'high', label: 'Top 1' }, { index: t2, price: highs[t2], type: 'high', label: 'Top 2' }] : [] };
}

function detectDoubleBottom(w: OHLCBar[]): PatternDetectionResult {
  if (w.length < 15) return { detected: false, pivots: [] };
  const highs = w.map(d => d.high), lows = w.map(d => d.low), closes = w.map(d => d.close);
  const hh = Math.max(...highs), ll = Math.min(...lows), range = hh - ll, tol = range * 0.03;
  const prom = ll + range * 0.05;
  let b1 = -1, b2 = -1;
  for (let i = 2; i < w.length - 3; i++) {
    if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
      if (lows[i] > prom) continue;
      if (b1 === -1) b1 = i;
      else if (i - b1 >= 5 && Math.abs(lows[i] - lows[b1]) <= tol) { b2 = i; break; }
    }
  }
  if (b1 === -1 || b2 === -1) return { detected: false, pivots: [] };
  let nl = highs[b1]; for (let i = b1; i <= b2; i++) if (highs[i] > nl) nl = highs[i];
  const detected = closes[closes.length - 1] > nl * 1.002;
  return { detected, patternStartIndex: b1 - 2, patternEndIndex: b2 + 2, pivots: detected ? [{ index: b1, price: lows[b1], type: 'low', label: 'Bottom 1' }, { index: b2, price: lows[b2], type: 'low', label: 'Bottom 2' }] : [] };
}

function detectBullFlag(w: OHLCBar[]): PatternDetectionResult {
  if (w.length < 10) return { detected: false, pivots: [] };
  const closes = w.map(d => d.close);
  const poleStart = closes[0], poleEnd = closes[Math.floor(w.length * 0.5)];
  if ((poleEnd - poleStart) / poleStart < 0.03) return { detected: false, pivots: [] };
  const flagBars = closes.slice(Math.floor(w.length * 0.5));
  const flagHigh = Math.max(...flagBars), flagLow = Math.min(...flagBars);
  const flagRange = (flagHigh - flagLow) / flagLow;
  const breakout = closes[closes.length - 1] > flagHigh;
  return { detected: flagRange < 0.05 && breakout, patternStartIndex: 0, patternEndIndex: w.length - 1, pivots: breakout ? [{ index: 0, price: poleStart, type: 'low', label: 'Pole Start' }, { index: w.length - 1, price: closes[closes.length - 1], type: 'high', label: 'Breakout' }] : [] };
}

function detectBearFlag(w: OHLCBar[]): PatternDetectionResult {
  if (w.length < 10) return { detected: false, pivots: [] };
  const closes = w.map(d => d.close);
  const poleStart = closes[0], poleEnd = closes[Math.floor(w.length * 0.5)];
  if ((poleStart - poleEnd) / poleStart < 0.03) return { detected: false, pivots: [] };
  const flagBars = closes.slice(Math.floor(w.length * 0.5));
  const flagHigh = Math.max(...flagBars), flagLow = Math.min(...flagBars);
  const flagRange = (flagHigh - flagLow) / flagHigh;
  const breakdown = closes[closes.length - 1] < flagLow;
  return { detected: flagRange < 0.05 && breakdown, patternStartIndex: 0, patternEndIndex: w.length - 1, pivots: breakdown ? [{ index: 0, price: poleStart, type: 'high', label: 'Pole Start' }, { index: w.length - 1, price: closes[closes.length - 1], type: 'low', label: 'Breakdown' }] : [] };
}

function detectAscTriangle(w: OHLCBar[]): PatternDetectionResult {
  if (w.length < 15) return { detected: false, pivots: [] };
  const highs = w.map(d => d.high), closes = w.map(d => d.close);
  const resistance = Math.max(...highs.slice(0, -2));
  const tol = resistance * 0.01;
  const touches = highs.filter(h => Math.abs(h - resistance) <= tol).length;
  const breakout = closes[closes.length - 1] > resistance * 1.002;
  return { detected: touches >= 2 && breakout, patternStartIndex: 0, patternEndIndex: w.length - 1, pivots: breakout ? [{ index: w.length - 1, price: closes[closes.length - 1], type: 'high', label: 'Breakout' }] : [] };
}

function detectDescTriangle(w: OHLCBar[]): PatternDetectionResult {
  if (w.length < 15) return { detected: false, pivots: [] };
  const lows = w.map(d => d.low), closes = w.map(d => d.close);
  const support = Math.min(...lows.slice(0, -2));
  const tol = support * 0.01;
  const touches = lows.filter(l => Math.abs(l - support) <= tol).length;
  const breakdown = closes[closes.length - 1] < support * 0.998;
  return { detected: touches >= 2 && breakdown, patternStartIndex: 0, patternEndIndex: w.length - 1, pivots: breakdown ? [{ index: w.length - 1, price: closes[closes.length - 1], type: 'low', label: 'Breakdown' }] : [] };
}

function detectDonchianLong(w: OHLCBar[]): PatternDetectionResult {
  if (w.length < 10) return { detected: false, pivots: [] };
  const highs = w.map(d => d.high), closes = w.map(d => d.close);
  const lookbackHighs = highs.slice(0, -2);
  const recentHigh = Math.max(...lookbackHighs);
  const currentClose = closes[closes.length - 1];
  const detected = currentClose > recentHigh * 1.001;
  return { detected, patternStartIndex: lookbackHighs.indexOf(recentHigh), patternEndIndex: w.length - 1, pivots: detected ? [{ index: w.length - 1, price: recentHigh, type: 'high', label: 'Breakout Level' }] : [] };
}

function detectDonchianShort(w: OHLCBar[]): PatternDetectionResult {
  if (w.length < 10) return { detected: false, pivots: [] };
  const lows = w.map(d => d.low), closes = w.map(d => d.close);
  const lookbackLows = lows.slice(0, -2);
  const recentLow = Math.min(...lookbackLows);
  const currentClose = closes[closes.length - 1];
  const detected = currentClose < recentLow * 0.999;
  return { detected, patternStartIndex: lookbackLows.indexOf(recentLow), patternEndIndex: w.length - 1, pivots: detected ? [{ index: w.length - 1, price: recentLow, type: 'low', label: 'Breakdown Level' }] : [] };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function calculateATR(bars: OHLCBar[], period = 14): number {
  if (bars.length < period + 1) return 0;
  let sum = 0;
  for (let i = bars.length - period; i < bars.length; i++) {
    const prev = bars[i - 1]?.close || bars[i].open;
    sum += Math.max(bars[i].high - bars[i].low, Math.abs(bars[i].high - prev), Math.abs(bars[i].low - prev));
  }
  return sum / period;
}

function getAssetType(symbol: string): string {
  if (symbol.includes('-USD')) return 'crypto';
  if (symbol.includes('=X')) return 'fx';
  if (['GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F'].some(c => symbol.startsWith(c.split('=')[0]))) return 'commodities';
  return 'stocks';
}

async function fetchYahooData(symbol: string, startDate: string, endDate: string): Promise<OHLCBar[]> {
  const p1 = Math.floor(new Date(startDate).getTime() / 1000);
  const p2 = Math.floor(new Date(endDate).getTime() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${p1}&period2=${p2}&interval=1d&events=history`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) { await res.text(); return []; }
  const data = await res.json();
  if (!data.chart?.result?.[0]) return [];
  const r = data.chart.result[0];
  const ts = r.timestamp || [];
  const q = r.indicators?.quote?.[0] || {};
  return ts.map((t: number, i: number) => ({
    date: new Date(t * 1000).toISOString(),
    open: q.open?.[i] || 0, high: q.high?.[i] || 0, low: q.low?.[i] || 0, close: q.close?.[i] || 0, volume: q.volume?.[i] || 0,
  })).filter((b: OHLCBar) => b.close > 0);
}

function runHistoricalBacktest(
  bars: OHLCBar[], symbol: string, patternId: string,
  pattern: { direction: 'long' | 'short'; displayName: string; detector: (w: OHLCBar[]) => PatternDetectionResult },
  lookback = 25, maxBarsInTrade = 100
) {
  const occurrences: any[] = [];
  const assetType = getAssetType(symbol);
  for (let i = lookback; i < bars.length - maxBarsInTrade; i++) {
    const window = bars.slice(i - lookback, i + 1);
    const det = pattern.detector(window);
    if (!det.detected) continue;
    const entry = bars[i].close;
    const atr = calculateATR(bars.slice(0, i + 1), 14);
    if (atr <= 0) continue;
    const sd = atr * 2, td = atr * 4;
    const isLong = pattern.direction === 'long';
    const sl = isLong ? entry - sd : entry + sd;
    const tp = isLong ? entry + td : entry - td;
    let outcome: string | null = null, op: number | null = null, od: string | null = null, bto: number | null = null;
    for (let j = i + 1; j < Math.min(i + maxBarsInTrade, bars.length); j++) {
      const b = bars[j];
      if (isLong) {
        if (b.low <= sl) { outcome = 'hit_sl'; op = sl; od = b.date; bto = j - i; break; }
        if (b.high >= tp) { outcome = 'hit_tp'; op = tp; od = b.date; bto = j - i; break; }
      } else {
        if (b.high >= sl) { outcome = 'hit_sl'; op = sl; od = b.date; bto = j - i; break; }
        if (b.low <= tp) { outcome = 'hit_tp'; op = tp; od = b.date; bto = j - i; break; }
      }
    }
    let pnl: number | null = null;
    if (outcome && op) { const p = isLong ? op - entry : entry - op; pnl = (p / entry) * 100; }

    const qualityInput: PatternQualityScorerInput = {
      bars: window, patternType: patternId, patternStartIndex: det.patternStartIndex ?? 0,
      patternEndIndex: det.patternEndIndex ?? window.length - 1, direction: pattern.direction,
      entryPrice: entry, stopLoss: sl, takeProfit: tp, atr,
    };
    const qr = calculatePatternQualityScore(qualityInput);
    const startIdx = Math.max(0, i - 30);
    const endIdx = bto ? Math.min(i + bto + 1, bars.length) : Math.min(i + 50, bars.length);

    occurrences.push({
      symbol, asset_type: assetType, pattern_id: patternId, pattern_name: pattern.displayName,
      direction: pattern.direction === 'long' ? 'bullish' : 'bearish', timeframe: '1d',
      detected_at: bars[i].date, pattern_start_date: bars[Math.max(0, i - lookback)]?.date || bars[i].date,
      pattern_end_date: bars[i].date, entry_price: entry, stop_loss_price: sl, take_profit_price: tp,
      risk_reward_ratio: td / sd, bars: bars.slice(startIdx, endIdx),
      visual_spec: { timeframe: '1d', entryPrice: entry, stopLoss: sl, takeProfit: tp, outcome, outcomePrice: op, outcomeDate: od, barsToOutcome: bto, entryBarIndex: i - startIdx },
      quality_score: qr.grade, quality_reasons: qr.factors.filter(f => f.passed).map(f => f.description),
      outcome, outcome_price: op, outcome_date: od, outcome_pnl_percent: pnl, bars_to_outcome: bto,
      validation_status: 'pending', validation_layers_passed: ['bulkowski_engine'],
    });
    i += 5; // skip overlap
  }
  return occurrences;
}

// ── Main Handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const body = await req.json().catch(() => ({}));

    // Allow single on-demand symbol (not from queue)
    if (body.symbol) {
      // Direct invocation for a single symbol
      return await processSingleSymbol(supabase, body.symbol, body.user_id);
    }

    // Cron mode: pick pending requests from queue
    const { data: pending, error: fetchErr } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('requested_at', { ascending: true })
      .limit(MAX_PER_RUN);

    if (fetchErr) throw fetchErr;
    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending scan requests', processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[process-scan-requests] Processing ${pending.length} requests`);
    const results: any[] = [];

    for (const request of pending) {
      // Mark as processing
      await supabase.from('scan_requests').update({ status: 'processing', started_at: new Date().toISOString() }).eq('id', request.id);

      try {
        const symbol = request.symbol;
        console.log(`[process-scan-requests] Processing ${symbol}...`);

        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 5);

        const bars = await fetchYahooData(symbol, startDate.toISOString(), endDate.toISOString());
        if (bars.length < 100) {
          await supabase.from('scan_requests').update({
            status: 'failed', error_message: `Insufficient data: ${bars.length} bars`, completed_at: new Date().toISOString(),
          }).eq('id', request.id);
          results.push({ symbol, status: 'failed', reason: 'insufficient_data' });
          continue;
        }

        // Run all patterns
        const allOccs: any[] = [];
        for (const [pid, pdef] of Object.entries(PATTERN_REGISTRY)) {
          const occs = runHistoricalBacktest(bars, symbol, pid, pdef);
          allOccs.push(...occs);
        }

        // Insert in chunks
        let inserted = 0;
        const CHUNK = 50;
        for (let i = 0; i < allOccs.length; i += CHUNK) {
          const chunk = allOccs.slice(i, i + CHUNK);
          const { error: ie } = await supabase.from('historical_pattern_occurrences').insert(chunk);
          if (ie) console.error(`Insert error for ${symbol}:`, ie.message);
          else inserted += chunk.length;
        }

        // Mark completed
        await supabase.from('scan_requests').update({
          status: 'completed', patterns_found: inserted, completed_at: new Date().toISOString(),
        }).eq('id', request.id);

        results.push({ symbol, status: 'completed', patterns_found: inserted });
        console.log(`[process-scan-requests] ${symbol}: ${inserted} patterns inserted`);

        await new Promise(r => setTimeout(r, 500)); // rate limit
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        await supabase.from('scan_requests').update({
          status: 'failed', error_message: msg, completed_at: new Date().toISOString(),
        }).eq('id', request.id);
        results.push({ symbol: request.symbol, status: 'failed', error: msg });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[process-scan-requests] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processSingleSymbol(supabase: any, symbol: string, userId?: string) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 5);

  const bars = await fetchYahooData(symbol, startDate.toISOString(), endDate.toISOString());
  if (bars.length < 100) {
    return new Response(JSON.stringify({ error: `Insufficient data for ${symbol}: ${bars.length} bars` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const allOccs: any[] = [];
  for (const [pid, pdef] of Object.entries(PATTERN_REGISTRY)) {
    allOccs.push(...runHistoricalBacktest(bars, symbol, pid, pdef));
  }

  let inserted = 0;
  for (let i = 0; i < allOccs.length; i += 50) {
    const chunk = allOccs.slice(i, i + 50);
    const { error } = await supabase.from('historical_pattern_occurrences').insert(chunk);
    if (!error) inserted += chunk.length;
  }

  return new Response(JSON.stringify({ symbol, patterns_found: inserted, bars_analyzed: bars.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
