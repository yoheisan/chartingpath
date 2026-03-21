import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Cheap model for classification, confirmation, override summaries
const FAST_MODEL = "google/gemini-2.5-flash-lite";
// Stronger model for mandate JSON parsing
const PARSE_MODEL = "google/gemini-3-flash-preview";

async function callAI(apiKey: string, model: string, systemPrompt: string, userMessage: string, maxTokens: number) {
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: maxTokens,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    console.error(`AI ${model} error:`, resp.status, t);
    if (resp.status === 429) throw { status: 429, message: "Rate limited, please try again later." };
    if (resp.status === 402) throw { status: 402, message: "Credits exhausted. Add funds in Settings." };
    throw new Error(`AI call failed (${resp.status})`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const { action, text, mandate } = await req.json();

    // ═══ CLASSIFY — Gemini Flash Lite (cheapest) ═══
    if (action === "classify") {
      const result = await callAI(
        LOVABLE_API_KEY,
        FAST_MODEL,
        "Classify this trading input as exactly one word: new_mandate, override, or question.\nnew_mandate = sets trading rules\noverride = temporary session change\nquestion = asks about a trade or result\nReply with one word only.",
        text,
        10
      );
      const classification = result.toLowerCase().replace(/[^a-z_]/g, "") || "question";
      return new Response(JSON.stringify({ classification }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══ PARSE — Stronger model for JSON extraction ═══
    if (action === "parse") {
      const systemPrompt = `You are a trading mandate parser for ChartingPath.
Extract structured rules from natural language and return ONLY valid JSON. No preamble, no markdown — raw JSON only.
Return exactly:
{
  "max_position_pct": number or null,
  "max_open_positions": number or null,
  "trading_window_start": "HH:MM" 24hr or null,
  "trading_window_end": "HH:MM" 24hr or null,
  "stop_loss_rule": string like "2R" or null,
  "excluded_conditions": string array or [],
  "preferred_patterns": string array or [],
  "sector_filters": string array or [],
  "trend_direction": "long_only" or "short_only" or "both" or null,
  "min_market_cap": string or null,
  "raw_nl_input": original input verbatim
}
Never invent values not stated. Null missing fields.`;

      let parsed: any = null;
      let attempts = 0;

      while (attempts < 2) {
        attempts++;
        try {
          let content = await callAI(LOVABLE_API_KEY, PARSE_MODEL, systemPrompt, text, 1000);
          content = content.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
          parsed = JSON.parse(content);
          break;
        } catch (e: any) {
          if (e.status === 429 || e.status === 402) {
            return new Response(JSON.stringify({ error: e.message }), {
              status: e.status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          console.error("Parse attempt", attempts, "failed:", e.message);
          if (attempts >= 2) {
            return new Response(
              JSON.stringify({ error: "Couldn't parse that — try: Max 3% per trade, breakouts only, 9:30-11:30am, 2R stop" }),
              { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }

      if (parsed) parsed.raw_nl_input = text;

      return new Response(JSON.stringify({ parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══ CONFIRM — Gemini Flash Lite (cheap) ═══
    if (action === "confirm") {
      const confirmation = await callAI(
        LOVABLE_API_KEY,
        FAST_MODEL,
        "The user set a trading mandate. Confirm it back as 2-4 plain bullet points using their exact values. End with: Is this right? Plain text only. No markdown. No extra commentary. Only include what they specified.",
        JSON.stringify(mandate),
        300
      );
      return new Response(JSON.stringify({ confirmation }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══ SAVE ═══
    if (action === "save") {
      await supabase
        .from("master_plans")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);

      const { data: newPlan, error: insertErr } = await supabase
        .from("master_plans")
        .insert({
          user_id: userId,
          is_active: true,
          raw_nl_input: mandate.raw_nl_input,
          max_position_pct: mandate.max_position_pct,
          max_open_positions: mandate.max_open_positions,
          trading_window_start: mandate.trading_window_start,
          trading_window_end: mandate.trading_window_end,
          stop_loss_rule: mandate.stop_loss_rule,
          excluded_conditions: mandate.excluded_conditions || [],
          preferred_patterns: mandate.preferred_patterns || [],
          sector_filters: mandate.sector_filters || [],
          trend_direction: mandate.trend_direction,
          min_market_cap: mandate.min_market_cap,
        })
        .select()
        .single();

      if (insertErr) {
        console.error("Save error:", insertErr);
        throw new Error("Failed to save master plan");
      }

      return new Response(JSON.stringify({ saved: true, plan: newPlan }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══ OVERRIDE — Gemini Flash Lite (cheap) ═══
    if (action === "override") {
      let summary = text;
      try {
        summary = await callAI(
          LOVABLE_API_KEY,
          FAST_MODEL,
          "Summarise this trading override in 6 words or less. Plain text only.",
          text,
          20
        );
      } catch { /* fallback to raw text */ }

      const { error: overrideErr } = await supabase
        .from("session_overrides")
        .insert({
          user_id: userId,
          session_id: new Date().toISOString().split("T")[0],
          override_text: text,
        });

      if (overrideErr) console.error("Override save error:", overrideErr);

      return new Response(JSON.stringify({ summary }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("copilot-mandate error:", e);
    const status = e.status || 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : e.message || "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
