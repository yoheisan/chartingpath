import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // 1. Total patterns tracked
    const { count: totalPatterns } = await sb
      .from("historical_pattern_occurrences")
      .select("id", { count: "exact", head: true });

    // 2. Top win rate this month (pattern + timeframe combo, min 20 samples)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
      .toISOString()
      .slice(0, 10);

    const { data: topWinRows } = await sb.rpc("get_top_win_rate_this_month", {
      p_since: thirtyDaysAgo,
      p_min_samples: 20,
    });

    const topWin = topWinRows?.[0] ?? null;

    // 3. Most detected pattern last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
      .toISOString()
      .slice(0, 10);

    const { data: mostDetectedRows } = await sb.rpc(
      "get_most_detected_pattern",
      { p_since: sevenDaysAgo }
    );

    const mostDetected = mostDetectedRows?.[0] ?? null;

    // 4. Instruments covered
    const { data: instrumentCountRows } = await sb.rpc(
      "get_distinct_instrument_count"
    );

    const instrumentCount = instrumentCountRows?.[0]?.cnt ?? 0;

    const payload = {
      total_patterns: totalPatterns ?? 0,
      top_win_rate: topWin
        ? {
            pattern_name: topWin.pattern_name,
            timeframe: topWin.timeframe,
            win_rate: topWin.win_rate,
            sample_count: topWin.sample_count,
          }
        : null,
      most_detected: mostDetected
        ? {
            pattern_name: mostDetected.pattern_name,
            count: mostDetected.cnt,
          }
        : null,
      instruments_covered: instrumentCount,
      cached_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(payload), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("get-outcome-stats error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
