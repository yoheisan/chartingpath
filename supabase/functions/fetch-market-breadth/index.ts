import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BreadthData {
  advances: number;
  declines: number;
  unchanged: number;
  advanceDeclineRatio: number;
  advanceDeclineLine: number;
  timestamp: string;
  exchange: string;
}

interface SentimentData {
  vix: number | null;
  vixLevel: string;
  putCallRatio: number | null;
  putCallSignal: string;
  fearGreedEstimate: string;
  fearGreedScore: number;
}

// EODHD quote fetcher (primary source for VIX and standard indices)
async function fetchEODHDQuote(eodhSymbol: string): Promise<number | null> {
  const EODHD_API_KEY = Deno.env.get('EODHD_API_KEY');
  if (!EODHD_API_KEY) return null;
  try {
    const url = `https://eodhd.com/api/real-time/${eodhSymbol}?api_token=${EODHD_API_KEY}&fmt=json`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.close || data.previousClose || null;
  } catch {
    return null;
  }
}

async function fetchVIXFromYahoo(): Promise<number | null> {
  try {
    const url = 'https://query1.finance.yahoo.com'
      + '/v8/finance/chart/%5EVIX'
      + '?interval=1d&range=1d';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const price = data?.chart?.result?.[0]
      ?.meta?.regularMarketPrice;
    return price ? Number(price) : null;
  } catch {
    return null;
  }
}

/**
 * Calculate market breadth from EODHD bulk S&P 500 quotes.
 * Counts symbols with positive change as advances, negative as declines, zero as unchanged.
 */
async function fetchBreadthFromEODHDBulk(): Promise<{ advances: number; declines: number; unchanged: number } | null> {
  const EODHD_API_KEY = Deno.env.get('EODHD_API_KEY');
  if (!EODHD_API_KEY) return null;

  try {
    // Bulk quotes for all US exchange symbols — returns change_p (percent change)
    const url = `https://eodhd.com/api/eod-bulk-last-day/US?api_token=${EODHD_API_KEY}&fmt=json&filter=extended`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[fetch-market-breadth] EODHD bulk API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length < 100) {
      console.warn(`[fetch-market-breadth] EODHD bulk returned only ${data?.length ?? 0} symbols — too few`);
      return null;
    }

    let advances = 0;
    let declines = 0;
    let unchanged = 0;

    for (const item of data) {
      const change = item.change_p ?? item.change ?? 0;
      if (change > 0) advances++;
      else if (change < 0) declines++;
      else unchanged++;
    }

    console.log(`[fetch-market-breadth] EODHD bulk breadth: ${advances} adv / ${declines} dec / ${unchanged} unch (${data.length} total)`);
    return { advances, declines, unchanged };
  } catch (err) {
    console.error("[fetch-market-breadth] EODHD bulk fetch error:", err);
    return null;
  }
}

function computeSentiment(vix: number | null, putCallRatio: number | null, adRatio: number): SentimentData {
  let vixLevel = 'unknown';
  if (vix !== null) {
    if (vix >= 30) vixLevel = 'extreme-fear';
    else if (vix >= 20) vixLevel = 'fear';
    else if (vix >= 15) vixLevel = 'neutral';
    else vixLevel = 'greed';
  }

  let putCallSignal = 'unknown';
  if (putCallRatio !== null) {
    if (putCallRatio >= 1.2) putCallSignal = 'extreme-fear';
    else if (putCallRatio >= 0.9) putCallSignal = 'fear';
    else if (putCallRatio >= 0.7) putCallSignal = 'neutral';
    else putCallSignal = 'greed';
  }

  let score = 50;

  if (vix !== null) {
    if (vix >= 30) score += -25;
    else if (vix >= 20) score += -10;
    else if (vix < 15) score += 15;
  }

  if (putCallRatio !== null) {
    if (putCallRatio >= 1.2) score += -20;
    else if (putCallRatio >= 0.9) score += -10;
    else if (putCallRatio < 0.7) score += 15;
  }

  if (adRatio > 0) {
    if (adRatio >= 2.0) score += 20;
    else if (adRatio >= 1.5) score += 10;
    else if (adRatio < 0.67) score += -15;
    else if (adRatio < 1.0) score += -5;
  }

  score = Math.max(0, Math.min(100, score));

  let fearGreedEstimate: string;
  if (score >= 75) fearGreedEstimate = 'Extreme Greed';
  else if (score >= 55) fearGreedEstimate = 'Greed';
  else if (score >= 45) fearGreedEstimate = 'Neutral';
  else if (score >= 25) fearGreedEstimate = 'Fear';
  else fearGreedEstimate = 'Extreme Fear';

  return {
    vix,
    vixLevel,
    putCallRatio,
    putCallSignal,
    fearGreedEstimate,
    fearGreedScore: score,
  };
}

function getSupabaseServiceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceKey);
}

/** Try to load cached breadth from Supabase (within last 24h) */
async function loadCachedBreadth(): Promise<{
  advances: number;
  declines: number;
  unchanged: number;
  advanceDeclineRatio: number;
  advanceDeclineLine: number;
  exchange: string;
  created_at: string;
} | null> {
  try {
    const sb = getSupabaseServiceClient();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await sb
      .from("market_breadth_cache")
      .select("*")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (error || !data) return null;

    // Reject cached data if it's the old hardcoded fallback
    if (Number(data.advancing) === 1650 && Number(data.declining) === 1350) {
      console.warn("[fetch-market-breadth] Cached data is stale fallback (1650/1350) — ignoring");
      return null;
    }

    return {
      advances: Number(data.advancing),
      declines: Number(data.declining),
      unchanged: Number(data.unchanged),
      advanceDeclineRatio: Number(data.advance_decline_ratio),
      advanceDeclineLine: Number(data.advance_decline_line),
      exchange: data.exchange || "NYSE",
      created_at: data.created_at,
    };
  } catch {
    return null;
  }
}

/** Cache successful breadth fetch — only real data, never fallbacks */
async function cacheBreadth(b: BreadthData) {
  // Guard: never cache the old hardcoded fallback values
  if (b.advances === 1650 && b.declines === 1350) {
    console.warn("[fetch-market-breadth] Breadth fallback detected — skipping cache write");
    return;
  }
  if (b.advances === 1800 && b.declines === 1200) {
    console.warn("[fetch-market-breadth] Finnhub hardcoded fallback detected — skipping cache write");
    return;
  }

  try {
    const sb = getSupabaseServiceClient();
    // Delete old cache rows (keep last 10)
    const { data: old } = await sb
      .from("market_breadth_cache")
      .select("id")
      .order("created_at", { ascending: false })
      .range(10, 1000);
    if (old && old.length > 0) {
      await sb.from("market_breadth_cache").delete().in("id", old.map((r: { id: string }) => r.id));
    }
    // Insert new
    await sb.from("market_breadth_cache").insert({
      advancing: b.advances,
      declining: b.declines,
      unchanged: b.unchanged,
      advance_decline_ratio: b.advanceDeclineRatio,
      advance_decline_line: b.advanceDeclineLine,
      exchange: b.exchange,
    });
  } catch (err) {
    console.error("[fetch-market-breadth] Cache write error:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[fetch-market-breadth] Starting breadth + sentiment data fetch...");

    // Step 1: Try EODHD bulk quotes for real breadth calculation
    const bulkBreadth = await fetchBreadthFromEODHDBulk();

    // Step 2: Fetch VIX from EODHD
    const vixValue = await fetchEODHDQuote("VIX.INDX");

    let advances = 0;
    let declines = 0;
    let unchanged = 0;
    let dataSource: 'eodhd_bulk' | 'cache' | 'unavailable' = 'unavailable';
    let dataAvailable = true;
    let breadthError: string | undefined;

    if (bulkBreadth && (bulkBreadth.advances + bulkBreadth.declines) > 100) {
      // Real data from EODHD bulk
      advances = bulkBreadth.advances;
      declines = bulkBreadth.declines;
      unchanged = bulkBreadth.unchanged;
      dataSource = 'eodhd_bulk';
    } else {
      // EODHD bulk failed — try cache
      console.log("[fetch-market-breadth] EODHD bulk unavailable, trying cached breadth...");
      const cached = await loadCachedBreadth();
      if (cached) {
        advances = cached.advances;
        declines = cached.declines;
        unchanged = cached.unchanged;
        dataSource = 'cache';
        breadthError = 'Live data unavailable — showing cached data';
        console.log(`[fetch-market-breadth] Using cached breadth from ${cached.created_at}`);
      } else {
        // No real data available at all
        dataSource = 'unavailable';
        dataAvailable = false;
        breadthError = 'Market breadth data temporarily unavailable';
        console.log("[fetch-market-breadth] No cached breadth available, returning unavailable");
      }
    }

    const total = advances + declines + unchanged;
    const advanceDeclineRatio = declines > 0 ? Math.round((advances / declines) * 100) / 100 : (dataAvailable ? 1 : 0);
    const advanceDeclineLine = advances - declines;

    const breadthData: BreadthData = {
      advances,
      declines,
      unchanged,
      advanceDeclineRatio,
      advanceDeclineLine,
      timestamp: new Date().toISOString(),
      exchange: "NYSE",
    };

    // Only cache real data (eodhd_bulk)
    if (dataSource === 'eodhd_bulk') {
      cacheBreadth(breadthData); // fire-and-forget
    }

    const sentimentData = computeSentiment(vixValue, null, advanceDeclineRatio);

    console.log("[fetch-market-breadth] Breadth:", breadthData, "source:", dataSource);
    console.log("[fetch-market-breadth] Sentiment:", sentimentData);

    const baseSentiment = !dataAvailable ? "unavailable" :
                          advanceDeclineRatio >= 1.5 ? "bullish" :
                          advanceDeclineRatio >= 1.0 ? "neutral-bullish" :
                          advanceDeclineRatio >= 0.67 ? "neutral-bearish" : "bearish";

    return new Response(
      JSON.stringify({
        success: true,
        data: breadthData,
        sentiment: sentimentData,
        meta: {
          total,
          advancePercent: total > 0 ? Math.round((advances / total) * 100) : 0,
          declinePercent: total > 0 ? Math.round((declines / total) * 100) : 0,
          sentiment: baseSentiment,
        },
        dataAvailable,
        dataSource,
        ...(breadthError ? { breadthError } : {}),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[fetch-market-breadth] Error:", error);

    // Last-resort: try cache even on unhandled errors
    let fallbackResponse = null;
    try {
      const cached = await loadCachedBreadth();
      if (cached) {
        const ratio = cached.advanceDeclineRatio;
        const baseSentiment = ratio >= 1.5 ? "bullish" :
                              ratio >= 1.0 ? "neutral-bullish" :
                              ratio >= 0.67 ? "neutral-bearish" : "bearish";
        const total = cached.advances + cached.declines + cached.unchanged;
        fallbackResponse = {
          success: true,
          data: {
            ...cached,
            timestamp: new Date().toISOString(),
          },
          sentiment: computeSentiment(null, null, ratio),
          meta: {
            total,
            advancePercent: total > 0 ? Math.round((cached.advances / total) * 100) : 0,
            declinePercent: total > 0 ? Math.round((cached.declines / total) * 100) : 0,
            sentiment: baseSentiment,
          },
          dataAvailable: true,
          dataSource: 'cache' as const,
          breadthError: 'Live data unavailable — showing cached data',
        };
      }
    } catch { /* ignore cache errors in catch */ }

    if (fallbackResponse) {
      return new Response(JSON.stringify(fallbackResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to fetch market breadth data",
        dataAvailable: false,
        dataSource: 'unavailable',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
