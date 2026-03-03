import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BINANCE_BASE = "https://api.binance.com/api/v3/klines";

/**
 * Map Yahoo-style crypto symbol (BTC-USD) → Binance pair (BTCUSDT).
 * Also handles already-Binance-style symbols like BTCUSDT.
 */
function toBinancePair(symbol: string): string {
  // Already in Binance format
  if (symbol.endsWith("USDT") && !symbol.includes("-")) return symbol;

  // Yahoo-style: BTC-USD → BTCUSDT
  const cleaned = symbol
    .replace(/-USD$/, "USDT")
    .replace(/-USDT$/, "USDT")
    .toUpperCase();

  return cleaned;
}

/**
 * Map our timeframe strings to Binance interval strings.
 */
function toBinanceInterval(tf: string): string {
  const map: Record<string, string> = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "30m": "30m",
    "1h": "1h",
    "2h": "2h",
    "4h": "4h",
    "8h": "8h",
    "1d": "1d",
    "1wk": "1w",
    "1mo": "1M",
  };
  return map[tf] || "1d";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, startDate, endDate, interval, includeOhlc = true } = await req.json();

    if (!symbol) {
      return new Response(JSON.stringify({ error: "symbol is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pair = toBinancePair(symbol);
    const binanceInterval = toBinanceInterval(interval || "1d");

    // Convert dates to timestamps
    const startMs = startDate ? new Date(startDate).getTime() : Date.now() - 365 * 86400000;
    const endMs = endDate ? new Date(endDate).getTime() : Date.now();

    console.log(`[fetch-binance] Fetching ${pair} ${binanceInterval} from ${startDate} to ${endDate}`);

    // Binance allows max 1000 candles per request — paginate if needed
    const allBars: any[] = [];
    let currentStart = startMs;
    const maxPerRequest = 1000;
    let iterations = 0;
    const maxIterations = 10; // Safety cap: 10 * 1000 = 10,000 bars max

    while (currentStart < endMs && iterations < maxIterations) {
      iterations++;
      const url = `${BINANCE_BASE}?symbol=${pair}&interval=${binanceInterval}&startTime=${currentStart}&endTime=${endMs}&limit=${maxPerRequest}`;

      const res = await fetch(url);

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[fetch-binance] API error ${res.status} for ${pair}: ${errText}`);

        // If pair not found, return empty (not an error — let caller fallback)
        if (res.status === 400) {
          return new Response(JSON.stringify({ bars: [], symbol, provider: "binance" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`Binance API ${res.status}: ${errText}`);
      }

      const klines = await res.json();

      if (!Array.isArray(klines) || klines.length === 0) break;

      for (const k of klines) {
        allBars.push({
          t: new Date(k[0]).toISOString(),
          o: parseFloat(k[1]),
          h: parseFloat(k[2]),
          l: parseFloat(k[3]),
          c: parseFloat(k[4]),
          v: parseFloat(k[5]),
        });
      }

      // Move start to after the last candle's open time
      const lastOpenTime = klines[klines.length - 1][0];
      currentStart = lastOpenTime + 1;

      // If we got less than the limit, we've reached the end
      if (klines.length < maxPerRequest) break;
    }

    console.log(`[fetch-binance] ${pair}: ${allBars.length} bars fetched in ${iterations} request(s)`);

    return new Response(
      JSON.stringify({
        bars: includeOhlc ? allBars : [],
        symbol,
        provider: "binance",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[fetch-binance] Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message, bars: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
