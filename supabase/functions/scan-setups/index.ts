import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // 1. Get all users with active master plans
    const { data: plans, error: planErr } = await supabase
      .from("master_plans")
      .select("*")
      .eq("is_active", true);

    if (planErr || !plans?.length) {
      return new Response(
        JSON.stringify({ ok: true, message: "No active plans", scanned: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalScanned = 0;
    let totalTradesOpened = 0;

    for (const plan of plans) {
      const userId = plan.user_id;

      // 2. Check trading window
      if (plan.trading_window_start && plan.trading_window_end) {
        const now = new Date();
        const hhmm = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
        if (hhmm < plan.trading_window_start || hhmm > plan.trading_window_end) {
          continue;
        }
      }

      // 3. Check open position count
      const maxOpen = plan.max_open_positions ?? 6;
      const { count: openCount } = await supabase
        .from("paper_trades")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "open");

      if ((openCount ?? 0) >= maxOpen) continue;

      // 4. Get candidate setups from live detections
      const { data: detections } = await supabase
        .from("live_pattern_detections")
        .select("id, instrument, pattern_id, pattern_name, timeframe, direction, current_price, asset_type")
        .eq("status", "active")
        .order("detected_at", { ascending: false })
        .limit(20);

      if (!detections?.length) continue;

      // 5. Get user's portfolio
      const { data: portfolio } = await supabase
        .from("paper_portfolios")
        .select("id, current_balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (!portfolio) continue;

      for (const det of detections) {
        totalScanned++;

        // Check if already have open trade on this symbol
        const { data: existing } = await supabase
          .from("paper_trades")
          .select("id")
          .eq("user_id", userId)
          .eq("symbol", det.instrument)
          .eq("status", "open")
          .limit(1)
          .maybeSingle();

        if (existing) continue;

        // Re-check open count
        const { count: currentOpen } = await supabase
          .from("paper_trades")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "open");

        if ((currentOpen ?? 0) >= maxOpen) break;

        // Run gate evaluation inline (simplified — mirrors evaluate-gate logic)
        let gateResult = "partial";
        let gateReason = "";
        let agentVerdict = "WATCH";
        let agentScore: number | null = null;

        // Check agent scores
        const { data: scoreData } = await supabase
          .from("agent_scores")
          .select("analyst_raw, risk_raw, timing_raw, portfolio_raw")
          .eq("instrument", det.instrument)
          .order("scored_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (scoreData) {
          const composite =
            (scoreData.analyst_raw || 0) * 0.35 +
            (scoreData.risk_raw || 0) * 0.25 +
            (scoreData.timing_raw || 0) * 0.2 +
            (scoreData.portfolio_raw || 0) * 0.2;
          agentScore = Math.round(composite * 100) / 100;

          const { data: settings } = await supabase
            .from("agent_scoring_settings")
            .select("take_cutoff, watch_cutoff")
            .eq("user_id", userId)
            .eq("is_default", true)
            .maybeSingle();

          const takeCutoff = settings?.take_cutoff ?? 70;
          const watchCutoff = settings?.watch_cutoff ?? 40;

          if (agentScore >= takeCutoff) agentVerdict = "TAKE";
          else if (agentScore >= watchCutoff) agentVerdict = "WATCH";
          else agentVerdict = "SKIP";
        }

        const verdictMap: Record<string, string> = { TAKE: "aligned", WATCH: "partial", SKIP: "conflict" };
        gateResult = verdictMap[agentVerdict] || "partial";

        // Master Plan rule checks
        const reasons: string[] = [];
        if (plan.trend_direction && plan.trend_direction !== "both" && det.direction) {
          const planDir = plan.trend_direction.replace("_", " ");
          const setupDir = det.direction.toLowerCase();
          if (
            (planDir === "long only" && setupDir === "short") ||
            (planDir === "short only" && setupDir === "long")
          ) {
            gateResult = "conflict";
            reasons.push(`${det.direction} conflicts with ${planDir} mandate`);
          }
        }

        const preferred = plan.preferred_patterns as string[] | null;
        if (preferred?.length && det.pattern_name) {
          const setupLower = det.pattern_name.toLowerCase();
          const isPreferred = preferred.some(
            (p: string) => setupLower.includes(p.toLowerCase()) || p.toLowerCase().includes(setupLower)
          );
          if (!isPreferred) {
            if (gateResult !== "conflict") gateResult = "partial";
            reasons.push(`${det.pattern_name} not in preferred patterns`);
          }
        }

        gateReason = reasons.length
          ? reasons.join(". ")
          : gateResult === "aligned"
            ? `${det.instrument} aligns with Master Plan`
            : `${det.instrument} partially matches`;

        // Save gate evaluation
        const { data: evalRow } = await supabase
          .from("gate_evaluations")
          .insert({
            user_id: userId,
            ticker: det.instrument,
            setup_type: det.pattern_name || null,
            timeframe: det.timeframe || null,
            direction: det.direction || null,
            agent_score: agentScore,
            agent_verdict: agentVerdict,
            gate_result: gateResult,
            gate_reason: gateReason,
            master_plan_id: plan.id,
            source: "ai_scan",
          })
          .select("id")
          .single();

        // 5. TAKE action based on gate result
        if (gateResult === "aligned") {
          const entryPrice = Number(det.current_price) || 100;
          const positionPct = plan.max_position_pct ?? 3;
          const rUnit = entryPrice * (positionPct / 100);
          const stopPrice = entryPrice - 2 * rUnit;
          const targetPrice = entryPrice + 3 * rUnit;
          const quantity = (portfolio.current_balance * positionPct / 100) / entryPrice;

          // Generate copilot reasoning via Lovable AI
          let reasoning = `Automated entry: ${det.pattern_name || "pattern"} on ${det.instrument} (${det.timeframe}). Risk: ${positionPct}% of portfolio.`;
          try {
            const aiKey = Deno.env.get("LOVABLE_API_KEY");
            if (aiKey) {
              const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${aiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-3-flash-preview",
                  messages: [
                    {
                      role: "system",
                      content:
                        "Generate a 2-sentence entry rationale for a paper trade. Be specific about the setup type and risk. Plain text only. No markdown.",
                    },
                    {
                      role: "user",
                      content: JSON.stringify({
                        ticker: det.instrument,
                        pattern: det.pattern_name,
                        direction: det.direction,
                        timeframe: det.timeframe,
                        entry_price: entryPrice,
                        r_unit: rUnit,
                        stop: stopPrice,
                        target: targetPrice,
                      }),
                    },
                  ],
                  max_tokens: 150,
                }),
              });
              if (aiRes.ok) {
                const aiData = await aiRes.json();
                reasoning = aiData.choices?.[0]?.message?.content || reasoning;
              }
            }
          } catch (e) {
            console.error("[scan-setups] AI reasoning error:", e);
          }

          const { error: tradeErr } = await supabase
            .from("paper_trades")
            .insert({
              user_id: userId,
              portfolio_id: portfolio.id,
              symbol: det.instrument,
              trade_type: det.direction === "short" ? "short" : "long",
              entry_price: entryPrice,
              quantity: Number(quantity.toFixed(6)),
              stop_loss: stopPrice,
              take_profit: targetPrice,
              status: "open",
              pattern_id: det.pattern_id || null,
              timeframe: det.timeframe || null,
              asset_type: det.asset_type || null,
              gate_evaluation_id: evalRow?.id || null,
              master_plan_id: plan.id,
              position_size_pct: positionPct,
              setup_type: det.pattern_name || null,
              copilot_reasoning: reasoning,
              source: "ai_scan",
              gate_result: gateResult,
              gate_reason: gateReason,
              user_action: "auto",
              attribution: "ai_approved",
              outcome: "open",
              notes: `[auto-scan] ${det.pattern_name || "pattern"} on ${det.timeframe || "unknown"}`,
            });

          if (tradeErr) {
            console.error(`[scan-setups] Trade insert error for ${det.instrument}:`, tradeErr);
          } else {
            totalTradesOpened++;
            console.log(`[scan-setups] Opened paper trade: ${det.instrument} ${det.direction}`);
          }
        } else if (gateResult === "conflict") {
          // Just logged in gate_evaluations — do not trade
          console.log(`[scan-setups] Conflict skipped: ${det.instrument} — ${gateReason}`);
        }
        // partial = logged but no auto-trade, user reviews
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        scanned: totalScanned,
        trades_opened: totalTradesOpened,
        users_processed: plans.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[scan-setups] Fatal:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
