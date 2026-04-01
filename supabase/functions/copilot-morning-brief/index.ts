import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Support manual trigger for single user (QA/testing)
    let forceSingleUser: string | null = null;
    let forceMode = false;
    try {
      const body = await req.json();
      if (body?.user_id && body?.force) {
        forceSingleUser = body.user_id;
        forceMode = true;
      }
    } catch {
      // No body or invalid JSON — run scheduled mode
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    let userIds: string[] = [];

    if (forceMode && forceSingleUser) {
      userIds = [forceSingleUser];
    } else {
      // Active users: onboarding_completed = true, at least 1 paper trade in 30 days
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, last_brief_sent_at")
        .eq("onboarding_completed", true);

      if (!profiles || profiles.length === 0) {
        return new Response(JSON.stringify({ success: true, processed: 0, reason: "no active profiles" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Filter out users already briefed today
      const candidateIds = profiles
        .filter((p: any) => {
          if (!p.last_brief_sent_at) return true;
          return new Date(p.last_brief_sent_at) < todayStart;
        })
        .map((p: any) => p.user_id);

      if (candidateIds.length === 0) {
        return new Response(JSON.stringify({ success: true, processed: 0, reason: "all users already briefed today" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check for at least 1 paper trade in last 30 days
      const { data: tradeUsers } = await supabase
        .from("paper_trades")
        .select("user_id")
        .in("user_id", candidateIds)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1000);

      const activeTraders = new Set((tradeUsers || []).map((t: any) => t.user_id));
      userIds = candidateIds.filter((id: string) => activeTraders.has(id));
    }

    console.log(`[morning-brief] Processing ${userIds.length} users`);

    let briefsSent = 0;

    for (const userId of userIds) {
      try {
        // Get user's trading plan
        const { data: profile } = await supabase
          .from("profiles")
          .select("trading_plan_structured, preferred_language")
          .eq("user_id", userId)
          .maybeSingle();

        const plan = (profile as any)?.trading_plan_structured || {};
        const language = (profile as any)?.preferred_language || "en";
        const patterns = plan.patterns || [];
        const timeframes = plan.timeframes || [];

        // 1. Open positions
        const { data: openPositions } = await supabase
          .from("paper_trades")
          .select("symbol, pattern_type, direction, entry_price, current_price, outcome_r, stop_price, target_price")
          .eq("user_id", userId)
          .eq("status", "open");

        // 2. New confirmed patterns matching user's plan (last 12h)
        let newSetups: any[] = [];
        if (patterns.length > 0) {
          const query = supabase
            .from("live_pattern_occurrences")
            .select("instrument, pattern_type, timeframe, direction, entry_price, target_price, stop_price, rr_ratio")
            .eq("status", "confirmed")
            .gte("created_at", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
            .limit(3);

          // Filter by user's plan patterns if available
          if (patterns.length > 0) {
            query.in("pattern_type", patterns);
          }
          if (timeframes.length > 0) {
            query.in("timeframe", timeframes);
          }

          const { data: setups } = await query;
          newSetups = setups || [];
        }

        // 3. Positions near TP or SL (within 10%)
        const positions = openPositions || [];
        const watchPositions = positions.filter((p: any) => {
          if (!p.current_price || !p.target_price || !p.stop_price || !p.entry_price) return false;
          const tpRange = Math.abs(p.target_price - p.entry_price);
          const slRange = Math.abs(p.entry_price - p.stop_price);
          if (tpRange === 0 || slRange === 0) return false;
          const distanceToTP = Math.abs(p.current_price - p.target_price) / tpRange;
          const distanceToSL = Math.abs(p.current_price - p.stop_price) / slRange;
          return distanceToTP < 0.10 || distanceToSL < 0.10;
        });

        // Skip if nothing to report
        if (positions.length === 0 && newSetups.length === 0 && watchPositions.length === 0) {
          console.log(`[morning-brief] Skipping ${userId} — nothing to report`);
          continue;
        }

        // 4. Generate brief via Gemini
        let briefJson: any = null;

        const fallbackBrief = {
          headline: `You have ${positions.length} open position(s) and ${newSetups.length} new setup(s) today.`,
          positions: positions.map((p: any) => ({
            symbol: p.symbol,
            note: `${p.direction || 'long'} ${p.pattern_type || ''}`.trim(),
            pnl_r: Number(p.outcome_r) || 0,
            status: watchPositions.includes(p) ? "watch" : "ok",
          })),
          setups: newSetups.map((s: any) => ({
            symbol: s.instrument,
            pattern_type: s.pattern_type,
            timeframe: s.timeframe,
            direction: s.direction,
            rr_ratio: Number(s.rr_ratio) || 0,
            note: "",
          })),
          watch: watchPositions.map((p: any) => {
            const nearTP = p.target_price && Math.abs(p.current_price - p.target_price) / Math.abs(p.target_price - p.entry_price) < 0.10;
            return {
              symbol: p.symbol,
              note: nearTP ? "approaching TP" : "approaching SL — review now",
              proximity: nearTP ? "near_tp" : "near_sl",
            };
          }),
        };

        if (geminiKey) {
          try {
            const prompt = `Generate a concise morning trading brief. 3 sections max.
Open positions: ${JSON.stringify(positions)}
New setups matching plan: ${JSON.stringify(newSetups)}
Positions near TP/SL: ${JSON.stringify(watchPositions)}
Language: ${language}
Keep financial terms in English (R:R, TP, SL, pattern names).
Be direct and specific. No filler sentences.
Return JSON only:
{
  "headline": "one sentence summary of the day",
  "positions": [{ "symbol": "", "note": "", "pnl_r": 0, "status": "watch|ok" }],
  "setups": [{ "symbol": "", "pattern_type": "", "timeframe": "", "direction": "", "rr_ratio": 0, "note": "" }],
  "watch": [{ "symbol": "", "note": "", "proximity": "near_tp|near_sl" }]
}`;

            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: { maxOutputTokens: 800, temperature: 0.3, responseMimeType: "application/json" },
                }),
              }
            );

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                briefJson = JSON.parse(text);
              }
            }
          } catch (e) {
            console.warn(`[morning-brief] Gemini failed for ${userId}, using fallback:`, e);
          }
        }

        if (!briefJson) briefJson = fallbackBrief;

        // 5. Insert into copilot_alerts
        const { error: insertError } = await supabase.from("copilot_alerts").insert({
          user_id: userId,
          alert_type: "morning_brief",
          symbol: "PORTFOLIO",
          alert_message: briefJson.headline,
          full_context: briefJson,
          status: "pending",
        });

        if (insertError) {
          console.error(`[morning-brief] Insert error for ${userId}:`, insertError.message);
          continue;
        }

        // 6. Update last_brief_sent_at
        if (!forceMode) {
          await supabase
            .from("profiles")
            .update({ last_brief_sent_at: new Date().toISOString() })
            .eq("user_id", userId);
        }

        briefsSent++;
        console.log(`[morning-brief] Brief sent for ${userId}`);
      } catch (userErr) {
        console.error(`[morning-brief] Error for ${userId}:`, userErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: userIds.length, briefs_sent: briefsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[morning-brief] Fatal error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
