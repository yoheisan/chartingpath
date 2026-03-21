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

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const { action, messages: chatMessages } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: generate_summary ----
    if (action === "generate_summary") {
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Today's trades
      const { data: todayTrades } = await supabase
        .from("paper_trades")
        .select("*")
        .eq("user_id", userId)
        .gte("entry_time", today)
        .order("entry_time", { ascending: true });

      // Session log
      const { data: sessionLog } = await supabase
        .from("session_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("session_date", today)
        .single();

      // Week trades for weekly totals
      const { data: weekTrades } = await supabase
        .from("paper_trades")
        .select("pnl_r, attribution, outcome")
        .eq("user_id", userId)
        .in("outcome", ["win", "loss"])
        .gte("entry_time", weekAgo);

      const trades = todayTrades || [];
      const closedToday = trades.filter((t: any) => t.outcome === "win" || t.outcome === "loss");

      const aiTodayR = closedToday
        .filter((t: any) => t.attribution === "ai_approved")
        .reduce((s: number, t: any) => s + (t.pnl_r || 0), 0);
      const humanTodayR = closedToday
        .filter((t: any) => t.attribution === "human_overwrite")
        .reduce((s: number, t: any) => s + (t.pnl_r || 0), 0);

      const wk = weekTrades || [];
      const weekAiR = wk
        .filter((t: any) => t.attribution === "ai_approved")
        .reduce((s: number, t: any) => s + (t.pnl_r || 0), 0);
      const weekHumanR = wk
        .filter((t: any) => t.attribution === "human_overwrite")
        .reduce((s: number, t: any) => s + (t.pnl_r || 0), 0);

      const dataObj = {
        total_scanned: sessionLog?.total_scanned || 0,
        trades: trades.map((t: any) => ({
          ticker: t.ticker,
          setup_type: t.setup_type,
          attribution: t.attribution,
          outcome: t.outcome,
          pnl_r: t.pnl_r,
          gate_result: t.gate_result,
          gate_reason: t.gate_reason,
          copilot_reasoning: t.copilot_reasoning,
        })),
        ai_total_r: +aiTodayR.toFixed(1),
        human_total_r: +humanTodayR.toFixed(1),
        week_ai_r: +weekAiR.toFixed(1),
        week_human_r: +weekHumanR.toFixed(1),
      };

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
              content: `You are Copilot a trading desk assistant.
Generate a plain language session recap.
Use this exact format with no markdown:

Here's what happened today:
I scanned [X] candidates and took [Y] trades.

[checkmark or x emoji] TICKER — one sentence about the trade. [pnl]R.

Copilot: [total]R  |  Your overrides: [total]R
This week: Copilot [total]R  |  Overrides [total]R

Use ✅ for wins and ❌ for losses.
Be direct. No filler words. No extra commentary.
If there are no trades say so briefly.`,
            },
            { role: "user", content: JSON.stringify(dataObj) },
          ],
          max_tokens: 500,
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Fallback summary
        const fallback = `Here's what happened today:\nI scanned ${dataObj.total_scanned} candidates and took ${trades.length} trades.\nCopilot: ${aiTodayR.toFixed(1)}R  |  Your overrides: ${humanTodayR.toFixed(1)}R\nThis week: Copilot ${weekAiR.toFixed(1)}R  |  Overrides ${weekHumanR.toFixed(1)}R`;
        return new Response(JSON.stringify({ summary: fallback, tradeData: dataObj }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await aiResponse.json();
      const summary = result.choices?.[0]?.message?.content?.trim() || "No summary available.";

      // Save to session_logs
      if (sessionLog) {
        await supabase
          .from("session_logs")
          .update({ summary_text: summary, ai_pnl_r: aiTodayR, human_pnl_r: humanTodayR })
          .eq("id", sessionLog.id);
      } else {
        await supabase.from("session_logs").insert({
          user_id: userId,
          session_date: today,
          total_scanned: 0,
          trades_taken: trades.length,
          ai_pnl_r: aiTodayR,
          human_pnl_r: humanTodayR,
          summary_text: summary,
        });
      }

      return new Response(JSON.stringify({ summary, tradeData: dataObj }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: chat ----
    if (action === "chat") {
      if (!chatMessages || !Array.isArray(chatMessages)) {
        return new Response(JSON.stringify({ error: "messages required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
      if (!ANTHROPIC_KEY) {
        return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          system: "You are Copilot a trading desk assistant answering questions about today's trading session. Answer based only on the trade data provided. Be direct and specific. Maximum 3 sentences. If the question cannot be answered from the available data say so honestly. Plain text only, no markdown.",
          messages: chatMessages,
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Anthropic API error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await aiResponse.json();
      const reply = result.content?.[0]?.text?.trim() || "I couldn't generate a response.";

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("session-debrief error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
