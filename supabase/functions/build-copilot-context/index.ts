/**
 * build-copilot-context
 * 
 * Pre-computes a "platform knowledge snapshot" every 6 hours so the Trading Copilot
 * knows what data exists, what's fresh, and what markets are open.
 * 
 * Stores results in copilot_platform_context table for fast retrieval.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Market session definitions (hours in UTC)
const MARKET_SESSIONS = {
  US: { name: "US (NYSE/NASDAQ)", open: 14, close: 21, days: [1, 2, 3, 4, 5] },
  EU: { name: "Europe (LSE/Euronext)", open: 8, close: 16.5, days: [1, 2, 3, 4, 5] },
  APAC: { name: "Asia-Pacific (TSE/HKEX)", open: 0, close: 8, days: [1, 2, 3, 4, 5] },
  CRYPTO: { name: "Crypto", open: 0, close: 24, days: [0, 1, 2, 3, 4, 5, 6] },
};

function computeMarketSessions(): Record<string, any> {
  const now = new Date();
  const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;
  const utcDay = now.getUTCDay(); // 0=Sun, 6=Sat

  const sessions: Record<string, any> = {};

  for (const [key, session] of Object.entries(MARKET_SESSIONS)) {
    const isTradeDay = session.days.includes(utcDay);
    const isOpen = isTradeDay && utcHour >= session.open && utcHour < session.close;

    sessions[key] = {
      name: session.name,
      status: isOpen ? "open" : "closed",
      isWeekend: utcDay === 0 || utcDay === 6,
      currentUtcHour: Math.floor(utcHour),
    };
  }

  return sessions;
}

function getNextTradingDay(now: Date): string {
  const day = now.getUTCDay();
  let daysToAdd = 1;
  if (day === 5) daysToAdd = 3; // Friday -> Monday
  if (day === 6) daysToAdd = 2; // Saturday -> Monday
  
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + daysToAdd);
  return next.toISOString().split("T")[0];
}

function getLastTradingDay(now: Date): string {
  const day = now.getUTCDay();
  let daysToSubtract = 1;
  if (day === 0) daysToSubtract = 2; // Sunday -> Friday
  if (day === 1) daysToSubtract = 3; // Monday -> Friday (for "last" session)
  if (day === 6) daysToSubtract = 1; // Saturday -> Friday
  
  const last = new Date(now);
  last.setUTCDate(last.getUTCDate() - daysToSubtract);
  return last.toISOString().split("T")[0];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("[build-copilot-context] Starting platform snapshot build...");

    const now = new Date();

    // Run all queries in parallel
    const [
      activePatterns,
      historicalCount,
      latestReport,
      topSymbols,
      instrumentCount,
      lastScan,
    ] = await Promise.all([
      // 1. Active patterns by asset type and timeframe
      supabase
        .from("live_pattern_detections")
        .select("asset_type, timeframe", { count: "exact" })
        .eq("status", "active"),

      // 2. Total historical pattern occurrences
      supabase
        .from("historical_pattern_occurrences")
        .select("id", { count: "exact", head: true }),

      // 3. Latest cached market report
      supabase
        .from("cached_market_reports")
        .select("generated_at")
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      // 4. Top queried symbols from copilot_feedback (last 7 days)
      supabase
        .from("copilot_feedback")
        .select("topics")
        .gte("created_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .not("topics", "is", null)
        .limit(100),

      // 5. Distinct instruments in historical data
      supabase
        .from("historical_prices")
        .select("symbol", { count: "exact", head: true }),

      // 6. Last pattern scan timestamp
      supabase
        .from("live_pattern_detections")
        .select("last_confirmed_at")
        .order("last_confirmed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // Process active patterns by asset_type
    const patternsByAsset: Record<string, number> = {};
    const patternsByTimeframe: Record<string, number> = {};
    if (activePatterns.data) {
      for (const row of activePatterns.data) {
        patternsByAsset[row.asset_type] = (patternsByAsset[row.asset_type] || 0) + 1;
        patternsByTimeframe[row.timeframe] = (patternsByTimeframe[row.timeframe] || 0) + 1;
      }
    }

    // Extract top queried symbols from topics
    const symbolFreq: Record<string, number> = {};
    if (topSymbols.data) {
      for (const row of topSymbols.data) {
        if (Array.isArray(row.topics)) {
          for (const topic of row.topics) {
            const upper = String(topic).toUpperCase();
            // Only count things that look like ticker symbols
            if (/^[A-Z]{2,6}(USD|USDT|BTC|ETH)?$/.test(upper)) {
              symbolFreq[upper] = (symbolFreq[upper] || 0) + 1;
            }
          }
        }
      }
    }
    const topQueriedSymbols = Object.entries(symbolFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([symbol, count]) => ({ symbol, queries: count }));

    // Compute market sessions
    const marketSessions = computeMarketSessions();

    // Build the snapshot
    const snapshot = {
      timestamp: now.toISOString(),
      active_patterns: {
        total: activePatterns.data?.length || 0,
        by_asset: patternsByAsset,
        by_timeframe: patternsByTimeframe,
      },
      historical_data: {
        total_pattern_occurrences: historicalCount.count || 0,
        total_instruments: instrumentCount.count || 0,
      },
      data_freshness: {
        last_pattern_scan: lastScan.data?.last_confirmed_at || null,
        last_market_report: latestReport.data?.generated_at || null,
      },
      market_sessions: marketSessions,
      temporal: {
        is_weekend: now.getUTCDay() === 0 || now.getUTCDay() === 6,
        last_trading_day: getLastTradingDay(now),
        next_trading_day: getNextTradingDay(now),
        utc_day_name: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getUTCDay()],
      },
      top_queried_symbols: topQueriedSymbols,
    };

    console.log("[build-copilot-context] Snapshot built:", JSON.stringify({
      activePatterns: snapshot.active_patterns.total,
      historicalTrades: snapshot.historical_data.total_pattern_occurrences,
      instruments: snapshot.historical_data.total_instruments,
      isWeekend: snapshot.temporal.is_weekend,
    }));

    // Upsert into copilot_platform_context
    const expiresAt = new Date(now.getTime() + 7 * 60 * 60 * 1000); // 7 hours

    const { error: upsertError } = await supabase
      .from("copilot_platform_context")
      .upsert(
        {
          context_type: "platform_snapshot",
          context_data: snapshot,
          computed_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: "context_type" }
      );

    if (upsertError) {
      console.error("[build-copilot-context] Upsert error:", upsertError);
      throw upsertError;
    }

    console.log("[build-copilot-context] Snapshot saved successfully.");

    return new Response(
      JSON.stringify({
        success: true,
        snapshot_summary: {
          active_patterns: snapshot.active_patterns.total,
          historical_trades: snapshot.historical_data.total_pattern_occurrences,
          instruments: snapshot.historical_data.total_instruments,
          is_weekend: snapshot.temporal.is_weekend,
          top_symbols: topQueriedSymbols.slice(0, 5).map((s) => s.symbol),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[build-copilot-context] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
