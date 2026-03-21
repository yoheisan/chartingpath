import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { action, text, mandate } = await req.json();

    // ACTION: classify
    if (action === "classify") {
      const resp = await fetch(AI_URL, {
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
              content: `Classify this input as exactly one of these three words: new_mandate, override, or question.
new_mandate: sets multiple new trading rules
override: a temporary session adjustment such as pause entries or skip momentum today
question: asking about a trade or past result
Return only the classification word. Nothing else.`,
            },
            { role: "user", content: text },
          ],
          max_tokens: 20,
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        console.error("AI classify error:", resp.status, t);
        throw new Error("AI classification failed");
      }

      const data = await resp.json();
      const classification = data.choices?.[0]?.message?.content?.trim().toLowerCase() || "question";

      return new Response(JSON.stringify({ classification }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: parse
    if (action === "parse") {
      const systemPrompt = `You are a trading mandate parser for ChartingPath.
Extract structured trading rules from natural language and return ONLY a valid JSON object. No preamble, no explanation, no markdown — raw JSON only.
Return this exact structure:
{
  "max_position_pct": number or null,
  "max_open_positions": number or null,
  "trading_window_start": "HH:MM" 24hr or null,
  "trading_window_end": "HH:MM" 24hr or null,
  "stop_loss_rule": string or null,
  "excluded_conditions": string array,
  "preferred_patterns": string array,
  "sector_filters": string array,
  "trend_direction": "long_only" or "short_only" or "both" or null,
  "min_market_cap": string or null,
  "raw_nl_input": string the original input verbatim
}
If a field is not mentioned set it to null or empty array.
Never invent values not stated in the input.`;

      let parsed: any = null;
      let attempts = 0;

      while (attempts < 2) {
        attempts++;
        const resp = await fetch(AI_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: text },
            ],
            max_tokens: 1000,
          }),
        });

        if (!resp.ok) {
          if (resp.status === 429) {
            return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (resp.status === 402) {
            return new Response(JSON.stringify({ error: "Credits exhausted. Add funds in Settings." }), {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          const t = await resp.text();
          console.error("AI parse error:", resp.status, t);
          if (attempts >= 2) throw new Error("AI parse failed");
          continue;
        }

        const data = await resp.json();
        let content = data.choices?.[0]?.message?.content?.trim() || "";

        // Strip markdown fencing if present
        content = content.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "");

        try {
          parsed = JSON.parse(content);
          break;
        } catch {
          console.error("JSON parse failed, attempt", attempts, content);
          if (attempts >= 2) {
            return new Response(
              JSON.stringify({ error: "Couldn't parse that — try being more specific.\nExample: Max 3% per trade, breakouts only, 9:30-11:30am" }),
              { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }

      // Ensure raw_nl_input is set
      if (parsed) {
        parsed.raw_nl_input = text;
      }

      return new Response(JSON.stringify({ parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: confirm
    if (action === "confirm") {
      const resp = await fetch(AI_URL, {
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
              content: `You are Copilot, a trading assistant. The user has set a trading mandate. Confirm it back in 2-4 plain language bullet points. Be direct and specific. Use their exact values. End with: Is this right? No markdown headers. Do not add anything they did not specify.`,
            },
            { role: "user", content: JSON.stringify(mandate) },
          ],
          max_tokens: 300,
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        console.error("AI confirm error:", resp.status, t);
        throw new Error("AI confirmation failed");
      }

      const data = await resp.json();
      const confirmation = data.choices?.[0]?.message?.content?.trim() || "";

      return new Response(JSON.stringify({ confirmation }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: save
    if (action === "save") {
      // Deactivate existing plans
      await supabase
        .from("master_plans")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);

      // Insert new plan
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

    // ACTION: override
    if (action === "override") {
      // Get a plain-language summary
      const resp = await fetch(AI_URL, {
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
              content: "Summarize this session override in one short sentence (under 15 words). No quotes.",
            },
            { role: "user", content: text },
          ],
          max_tokens: 50,
        }),
      });

      let summary = text;
      if (resp.ok) {
        const data = await resp.json();
        summary = data.choices?.[0]?.message?.content?.trim() || text;
      }

      const { error: overrideErr } = await supabase
        .from("session_overrides")
        .insert({
          user_id: userId,
          session_id: new Date().toISOString().split("T")[0],
          override_text: text,
        });

      if (overrideErr) {
        console.error("Override save error:", overrideErr);
      }

      return new Response(JSON.stringify({ summary }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("copilot-mandate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
