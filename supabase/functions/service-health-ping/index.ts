import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all active services
    const { data: services, error: svcErr } = await supabase
      .from("service_registry")
      .select("*")
      .eq("is_active", true);

    if (svcErr) throw svcErr;

    const results = [];

    // Ping each service in parallel
    const checks = (services || []).map(async (svc) => {
      if (!svc.health_endpoint) return null;

      const start = Date.now();
      let status = "up";
      let statusCode: number | null = null;
      let errorMessage: string | null = null;
      let latencyMs: number | null = null;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        // Use OPTIONS/HEAD for lightweight health check (avoids auth issues)
        const res = await fetch(svc.health_endpoint, {
          method: "OPTIONS",
          signal: controller.signal,
        });
        clearTimeout(timeout);

        latencyMs = Date.now() - start;
        statusCode = res.status;

        if (statusCode >= 500) {
          status = "down";
          errorMessage = `HTTP ${statusCode}`;
        } else if (latencyMs > 5000) {
          status = "degraded";
          errorMessage = `High latency: ${latencyMs}ms`;
        }
      } catch (err) {
        latencyMs = Date.now() - start;
        if (err instanceof DOMException && err.name === "AbortError") {
          status = "timeout";
          errorMessage = "Request timed out after 10s";
        } else {
          status = "down";
          errorMessage = err.message || "Unknown error";
        }
      }

      return {
        service_name: svc.service_name,
        status,
        latency_ms: latencyMs,
        status_code: statusCode,
        error_message: errorMessage,
        checked_at: new Date().toISOString(),
      };
    });

    const checkResults = (await Promise.all(checks)).filter(Boolean);

    // Insert all results
    if (checkResults.length > 0) {
      const { error: insertErr } = await supabase
        .from("service_health_checks")
        .insert(checkResults);
      if (insertErr) console.error("Insert error:", insertErr);
    }

    // Also check data seeding health
    await checkDataSeedingHealth(supabase);

    // Cleanup old records (keep 7 days)
    await supabase.rpc("cleanup_old_health_checks");

    return new Response(
      JSON.stringify({
        ok: true,
        checked: checkResults.length,
        results: checkResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Health ping error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function checkDataSeedingHealth(supabase: any) {
  try {
    // Check historical prices coverage by asset class
    const assetClasses = [
      { class: "stocks", patterns: ["US_%", "AAPL%"] },
      { class: "fx", patterns: ["EUR%", "GBP%", "USD%"] },
      { class: "crypto", patterns: ["BTC%", "ETH%"] },
      { class: "indices", patterns: ["%GSPC%", "%DJI%"] },
    ];

    for (const ac of assetClasses) {
      // Count tickers with recent data (last 3 days)
      const { count: recentCount } = await supabase
        .from("historical_prices")
        .select("symbol", { count: "exact", head: true })
        .gte("timestamp", new Date(Date.now() - 3 * 86400000).toISOString());

      // Count total distinct tickers
      const { count: totalCount } = await supabase
        .from("live_pattern_detections")
        .select("instrument", { count: "exact", head: true })
        .eq("status", "active");

      await supabase.from("data_seeding_status").upsert(
        {
          source: "eodhd",
          asset_class: ac.class,
          total_tickers: totalCount || 0,
          seeded_tickers: recentCount || 0,
          failed_tickers: 0,
          last_seed_at: new Date().toISOString(),
          checked_at: new Date().toISOString(),
        },
        { onConflict: "source,asset_class", ignoreDuplicates: false }
      );
    }
  } catch (err) {
    console.error("Seeding health check error:", err);
  }
}
