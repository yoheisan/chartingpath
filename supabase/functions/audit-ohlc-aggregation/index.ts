import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // One instrument per asset class
  const TEST_INSTRUMENTS = [
    { symbol: "EUR/USD", label: "Forex" },
    { symbol: "BTC-USD", label: "Crypto" },
    { symbol: "AAPL",    label: "Stock" },
    { symbol: "GC=F",    label: "Commodity" },
    { symbol: "^GSPC",   label: "Index" },
  ];

  const auditResults: any[] = [];

  for (const { symbol, label } of TEST_INSTRUMENTS) {
    // ── 4H audit ──
    const audit4H = await auditTimeframe(supabase, symbol, label, "4h", 4);
    auditResults.push(audit4H);

    // ── 8H audit ──
    const audit8H = await auditTimeframe(supabase, symbol, label, "8h", 8);
    auditResults.push(audit8H);
  }

  const anyIncorrect = auditResults.some((r) => r.status === "incorrect");
  const recommendation = anyIncorrect
    ? "RESEED_REQUIRED: 4H/8H OHLC aggregation has errors. Full 4H/8H reseed needed."
    : "NO_RESEED_NEEDED: 4H/8H OHLC aggregation is correct. Skip L4 reseed phase.";

  return new Response(
    JSON.stringify({ recommendation, auditResults }, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// ─── Helpers ───────────────────────────────────────────────────

async function auditTimeframe(
  supabase: any,
  symbol: string,
  assetLabel: string,
  targetTF: "4h" | "8h",
  period: number
) {
  // Fetch stored bars at the target timeframe
  const { data: storedBars, error: storedErr } = await supabase
    .from("historical_prices")
    .select("open, high, low, close, volume, date")
    .eq("symbol", symbol)
    .eq("timeframe", targetTF)
    .order("date", { ascending: false })
    .limit(5);

  if (storedErr || !storedBars?.length) {
    return {
      instrument: symbol,
      assetClass: assetLabel,
      timeframe: targetTF,
      status: "no_stored_data",
      message: `No stored ${targetTF} bars found for ${symbol}`,
    };
  }

  // Pick the most recent stored bar and find its boundary
  const latestStored = storedBars[0];
  const boundaryDate = new Date(latestStored.date);

  // Determine the 1H window that should form this bar
  const windowEnd = new Date(boundaryDate);
  windowEnd.setUTCHours(windowEnd.getUTCHours() + period);
  const windowStart = boundaryDate;

  // Fetch 1H bars that fall inside this boundary
  const { data: hourlyBars, error: hourlyErr } = await supabase
    .from("historical_prices")
    .select("open, high, low, close, volume, date")
    .eq("symbol", symbol)
    .eq("timeframe", "1h")
    .gte("date", windowStart.toISOString())
    .lt("date", windowEnd.toISOString())
    .order("date", { ascending: true });

  if (hourlyErr || !hourlyBars?.length) {
    return {
      instrument: symbol,
      assetClass: assetLabel,
      timeframe: targetTF,
      status: "insufficient_1h_data",
      message: `No corresponding 1H bars found for ${symbol} at boundary ${windowStart.toISOString()}`,
      storedBar: latestStored,
    };
  }

  if (hourlyBars.length < period) {
    return {
      instrument: symbol,
      assetClass: assetLabel,
      timeframe: targetTF,
      status: "partial_1h_data",
      message: `Only ${hourlyBars.length}/${period} 1H bars found — cannot verify`,
      storedBar: latestStored,
      hourlyCount: hourlyBars.length,
    };
  }

  // Compute expected OHLCV from 1H bars
  const chunk = hourlyBars.slice(0, period);
  const expected = {
    open:   chunk[0].open,
    high:   Math.max(...chunk.map((b: any) => b.high)),
    low:    Math.min(...chunk.map((b: any) => b.low)),
    close:  chunk[chunk.length - 1].close,
    volume: chunk.reduce((s: number, b: any) => s + (b.volume ?? 0), 0),
  };

  const tolerance = 0.0001; // 0.01%
  const check = (actual: number, exp: number) =>
    exp === 0 ? actual === 0 : Math.abs(actual - exp) / Math.abs(exp) < tolerance;

  const openOk   = check(latestStored.open,  expected.open);
  const highOk   = check(latestStored.high,  expected.high);
  const lowOk    = check(latestStored.low,   expected.low);
  const closeOk  = check(latestStored.close, expected.close);
  const isCorrect = openOk && highOk && lowOk && closeOk;

  const issues: string[] = [];
  if (!openOk)  issues.push(`Open mismatch: expected ${expected.open}, got ${latestStored.open}`);
  if (!highOk)  issues.push(`High mismatch: expected ${expected.high}, got ${latestStored.high}`);
  if (!lowOk)   issues.push(`Low mismatch: expected ${expected.low}, got ${latestStored.low}`);
  if (!closeOk) issues.push(`Close mismatch: expected ${expected.close}, got ${latestStored.close}`);

  return {
    instrument: symbol,
    assetClass: assetLabel,
    timeframe: targetTF,
    status: isCorrect ? "correct" : "incorrect",
    boundary: windowStart.toISOString(),
    hourlyBarsUsed: chunk.length,
    expected,
    actual: {
      open:  latestStored.open,
      high:  latestStored.high,
      low:   latestStored.low,
      close: latestStored.close,
    },
    issues,
  };
}
