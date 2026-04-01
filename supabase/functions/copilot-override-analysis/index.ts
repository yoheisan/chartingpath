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

    // Get all users with at least 5 closed trades in last 7 days
    const { data: activeUsers, error: usersError } = await supabase
      .from("paper_trades")
      .select("user_id")
      .eq("status", "closed")
      .gte("closed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1000);

    if (usersError) {
      console.error("Error fetching active users:", usersError);
      return new Response(JSON.stringify({ error: usersError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduplicate user IDs and count trades per user
    const userTradeCounts = new Map<string, number>();
    for (const row of activeUsers || []) {
      userTradeCounts.set(row.user_id, (userTradeCounts.get(row.user_id) || 0) + 1);
    }

    const eligibleUsers = Array.from(userTradeCounts.entries())
      .filter(([_, count]) => count >= 5)
      .map(([userId]) => userId);

    console.log(`[override-analysis] ${eligibleUsers.length} eligible users with 5+ trades`);

    let alertsInserted = 0;

    for (const userId of eligibleUsers) {
      try {
        // Call the RPC function
        const { data: stats, error: rpcError } = await supabase
          .rpc("get_override_comparison", { p_user_id: userId, p_days: 7 });

        if (rpcError || !stats || stats.length === 0) {
          console.log(`[override-analysis] No stats for ${userId}:`, rpcError?.message);
          continue;
        }

        const s = Array.isArray(stats) ? stats[0] : stats;

        // Check threshold: override underperforms copilot by > 2R AND at least 3 override trades
        const gap = Number(s.gap) || 0;
        const overrideTrades = Number(s.override_trades) || 0;
        const copilotTrades = Number(s.copilot_trades) || 0;
        const copilotR = Number(s.copilot_r) || 0;
        const overrideR = Number(s.override_r) || 0;

        if (gap <= 2 || overrideTrades < 3) {
          continue;
        }

        // Check if we already sent an intervention in the last 3 days
        const { data: recentAlerts } = await supabase
          .from("copilot_alerts")
          .select("id")
          .eq("user_id", userId)
          .eq("alert_type", "intervention")
          .gte("created_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (recentAlerts && recentAlerts.length > 0) {
          console.log(`[override-analysis] Skipping ${userId} — recent intervention exists`);
          continue;
        }

        // Get user language preference
        const { data: langPref } = await supabase
          .from("user_language_preferences")
          .select("language_code")
          .eq("user_id", userId)
          .maybeSingle();
        const language = langPref?.language_code || "en";

        // Generate intervention message via Gemini
        let alertMessage = `Your overrides underperformed Copilot by ${gap.toFixed(1)}R this week. Copilot: ${copilotTrades} trades, +${copilotR.toFixed(1)}R. Overrides: ${overrideTrades} trades, ${overrideR.toFixed(1)}R. Want to see the full breakdown?`;

        if (geminiKey) {
          try {
            const prompt = `You are a trading coach. Generate a direct, non-judgmental 2-sentence intervention message for a trader whose manual overrides are underperforming the AI by ${gap.toFixed(1)}R this week.
Copilot trades: ${copilotTrades} trades, ${copilotR.toFixed(1)}R total.
Override trades: ${overrideTrades} trades, ${overrideR.toFixed(1)}R total.
Worst override: ${s.worst_override_symbol || 'unknown'} ${s.worst_override_pattern || 'unknown'} ${(Number(s.worst_override_r) || 0).toFixed(1)}R.
End with: "Want to see the full breakdown?"
Language: ${language}
Keep financial terms in English.`;

            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
                }),
              }
            );

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              const generated = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (generated && generated.trim().length > 10) {
                alertMessage = generated.trim();
              }
            }
          } catch (e) {
            console.warn("[override-analysis] Gemini call failed, using fallback:", e);
          }
        }

        // Insert copilot_alerts row
        const { error: insertError } = await supabase.from("copilot_alerts").insert({
          user_id: userId,
          alert_type: "intervention",
          symbol: s.worst_override_symbol || "PORTFOLIO",
          alert_message: alertMessage,
          full_context: {
            copilot_trades: copilotTrades,
            copilot_r: copilotR,
            override_trades: overrideTrades,
            override_r: overrideR,
            gap,
            worst_override_symbol: s.worst_override_symbol,
            worst_override_pattern: s.worst_override_pattern,
            worst_override_r: Number(s.worst_override_r) || 0,
          },
          status: "pending",
        });

        if (insertError) {
          console.error(`[override-analysis] Insert error for ${userId}:`, insertError.message);
        } else {
          alertsInserted++;
          console.log(`[override-analysis] Intervention alert for ${userId}: gap=${gap.toFixed(1)}R`);
        }
      } catch (userErr) {
        console.error(`[override-analysis] Error processing ${userId}:`, userErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        eligible_users: eligibleUsers.length,
        alerts_inserted: alertsInserted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[override-analysis] Fatal error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
