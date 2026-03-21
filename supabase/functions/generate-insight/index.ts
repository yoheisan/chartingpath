import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Fetch last 20 closed trades
    const { data: trades } = await supabase
      .from("paper_trades")
      .select("*")
      .eq("user_id", userId)
      .in("outcome", ["win", "loss"])
      .order("exit_time", { ascending: false })
      .limit(20);

    const tradeList = trades || [];

    // Group by attribution
    const aiTrades = tradeList.filter((t: any) => t.attribution === "ai_approved");
    const humanTrades = tradeList.filter((t: any) => t.attribution === "human_overwrite");

    const calcStats = (arr: any[]) => {
      const count = arr.length;
      const wins = arr.filter((t: any) => t.outcome === "win").length;
      const winRate = count > 0 ? Math.round((wins / count) * 100) : 0;
      const totalR = arr.reduce((s: number, t: any) => s + (t.pnl_r || 0), 0);
      const avgR = count > 0 ? +(totalR / count).toFixed(1) : 0;
      return { count, winRate, avgR: avgR, totalR: +totalR.toFixed(1) };
    };

    const aiStats = calcStats(aiTrades);
    const humanStats = calcStats(humanTrades);

    // Most recent closed trade
    const lastTrade = tradeList[0];
    const lastTradeInfo = lastTrade
      ? `Last closed: ${lastTrade.symbol || lastTrade.ticker} ${lastTrade.attribution} ${lastTrade.outcome} ${(lastTrade.pnl_r || lastTrade.outcome_r || 0).toFixed(1)}R gate: ${lastTrade.gate_result || "unknown"} — ${lastTrade.gate_reason || "none"}`
      : "No recent closed trades.";

    const userMessage = `AI trades: ${aiStats.count} trades, ${aiStats.winRate}% wins, avg ${aiStats.avgR}R, total ${aiStats.totalR}R\nHuman overrides: ${humanStats.count} trades, ${humanStats.winRate}% wins, avg ${humanStats.avgR}R, total ${humanStats.totalR}R\n${lastTradeInfo}`;

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback to a simple generated insight
      const fallbackInsight = tradeList.length > 0
        ? `${aiStats.count} AI trades at ${aiStats.winRate}% win rate (${aiStats.totalR}R) vs ${humanStats.count} overrides at ${humanStats.winRate}% (${humanStats.totalR}R).`
        : "No closed trades yet. Copilot is scanning for setups matching your plan.";

      await upsertInsight(supabase, userId, fallbackInsight);
      return new Response(JSON.stringify({ insight: fallbackInsight }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Generate one trading performance insight in 2 sentences. Compare AI-approved trades vs human overrides. Use exact numbers. Be direct. No filler. Focus on the most actionable pattern. Plain text only. No markdown.",
          },
          { role: "user", content: userMessage },
        ],
        max_tokens: 100,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Fallback
      const fallback = `AI: ${aiStats.totalR}R (${aiStats.winRate}% win) vs Overrides: ${humanStats.totalR}R (${humanStats.winRate}% win).`;
      await upsertInsight(supabase, userId, fallback);
      return new Response(JSON.stringify({ insight: fallback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await aiResponse.json();
    const insight = result.choices?.[0]?.message?.content?.trim() ||
      `AI: ${aiStats.totalR}R vs Overrides: ${humanStats.totalR}R.`;

    await upsertInsight(supabase, userId, insight);

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-insight error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function upsertInsight(supabase: any, userId: string, insight: string) {
  // Delete old entries for this user, then insert fresh
  await supabase.from("insight_cache").delete().eq("user_id", userId);
  await supabase.from("insight_cache").insert({ user_id: userId, insight, generated_at: new Date().toISOString() });
}
