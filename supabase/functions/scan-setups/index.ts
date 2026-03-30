import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Forex helpers ──
function isForexSymbol(symbol: string): boolean {
  return symbol.endsWith("=X");
}

/**
 * Get pip value for a forex pair.
 * JPY pairs: pip = 0.01; all others: pip = 0.0001
 * pip_value = pip / price * lot_size_units
 * For micro lot (0.01 = 1,000 units): pip_value ≈ $0.10 for majors
 */
function getForexPipValue(symbol: string, price: number, lotSize = 0.01): number {
  const isJpy = symbol.toUpperCase().includes("JPY");
  const pipSize = isJpy ? 0.01 : 0.0001;
  const lotUnits = lotSize * 100_000; // 0.01 lot = 1,000 units
  return pipSize * lotUnits; // pip value in quote currency
}

function priceToPips(symbol: string, priceMove: number): number {
  const isJpy = symbol.toUpperCase().includes("JPY");
  const pipSize = isJpy ? 0.01 : 0.0001;
  return priceMove / pipSize;
}

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
      .select("*, timezone")
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
      const tz = plan.timezone || "America/New_York";
      const nowInTz = new Date().toLocaleString("en-US", { timeZone: tz });
      const localDate = new Date(nowInTz);
      const hhmm = `${String(localDate.getHours()).padStart(2, "0")}:${String(localDate.getMinutes()).padStart(2, "0")}`;
      const dayOfWeek = localDate.getDay();
      console.log(`[scan-setups] Processing plan "${plan.name}" for user ${userId} | local=${hhmm} ${tz} day=${dayOfWeek}`);

      const schedules = (plan.trading_schedules as Record<string, any>) || {};
      const isAssetTradable = (assetType: string | null): boolean => {
        if (!assetType) {
          if (plan.trading_window_start && plan.trading_window_end) {
            return hhmm >= plan.trading_window_start && hhmm <= plan.trading_window_end;
          }
          return true;
        }
        const assetTypeMap: Record<string, string> = {
          stock: "stocks", equity: "stocks", fx: "forex", forex: "forex",
          crypto: "crypto", commodity: "commodities", index: "indices", etf: "etfs",
        };
        const mapped = assetTypeMap[assetType.toLowerCase()] || assetType.toLowerCase();
        const sched = schedules[mapped];
        if (sched) {
          if (sched.is_247) return true;
          if (sched.days && !sched.days.includes(dayOfWeek)) return false;
          if (sched.start && sched.end) return hhmm >= sched.start && hhmm <= sched.end;
          return true;
        }
        if (plan.trading_window_start && plan.trading_window_end) {
          return hhmm >= plan.trading_window_start && hhmm <= plan.trading_window_end;
        }
        return true;
      };

      if (Object.keys(schedules).length === 0 && plan.trading_window_start && plan.trading_window_end) {
        if (hhmm < plan.trading_window_start || hhmm > plan.trading_window_end) {
          continue;
        }
      }

      const maxOpen = plan.max_open_positions ?? 6;
      const { count: openCount } = await supabase
        .from("paper_trades")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "open");

      if ((openCount ?? 0) >= maxOpen) continue;

      const planAssetClasses = (plan.asset_classes as string[] | null) ?? [];
      const reverseAssetMap: Record<string, string> = {
        stocks: "stocks", forex: "fx", crypto: "crypto",
        commodities: "commodities", indices: "indices", etfs: "etfs",
      };

      const tradableAssetTypes = planAssetClasses
        .filter(c => {
          const detType = reverseAssetMap[c] || c;
          return isAssetTradable(detType);
        })
        .map(c => reverseAssetMap[c] || c);

      if (tradableAssetTypes.length === 0) {
        console.log(`[scan-setups] No tradable asset classes right now for plan ${plan.name} (local=${hhmm})`);
        continue;
      }

      const allDetections: any[] = [];
      for (const assetType of tradableAssetTypes) {
        const { data: dets, error: detErr } = await supabase
          .from("live_pattern_detections")
          .select("id, instrument, pattern_id, pattern_name, timeframe, direction, current_price, asset_type")
          .eq("status", "active")
          .eq("asset_type", assetType)
          .order("first_detected_at", { ascending: false })
          .limit(10);

        if (detErr) {
          console.error(`[scan-setups] Detection query error for ${assetType}:`, detErr);
          continue;
        }
        if (dets?.length) {
          allDetections.push(...dets);
        }
      }

      const detections = allDetections;
      if (!detections.length) {
        console.log(`[scan-setups] No active detections for plan ${plan.name} (tradable: ${tradableAssetTypes.join(",")})`);
        continue;
      }
      console.log(`[scan-setups] Found ${detections.length} detections for plan ${plan.name} across ${tradableAssetTypes.join(",")}`);

      const { data: portfolio } = await supabase
        .from("paper_portfolios")
        .select("id, current_balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (!portfolio) {
        console.log(`[scan-setups] No portfolio for user ${userId}, skipping`);
        continue;
      }

      for (const det of detections) {
        totalScanned++;

        if (!isAssetTradable(det.asset_type)) {
          console.log(`[scan-setups] ${det.instrument} (${det.asset_type}) outside trading window, skipping`);
          continue;
        }

        const { data: existing } = await supabase
          .from("paper_trades")
          .select("id")
          .eq("user_id", userId)
          .eq("symbol", det.instrument)
          .eq("status", "open")
          .limit(1)
          .maybeSingle();

        if (existing) continue;

        const { count: currentOpen } = await supabase
          .from("paper_trades")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "open");

        if ((currentOpen ?? 0) >= maxOpen) break;

        // Gate evaluation
        let gateResult = "partial";
        let gateReason = "";
        let agentVerdict = "WATCH";
        let agentScore: number | null = null;

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
          agentScore = Math.round(composite * 10000) / 100;

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

        const reasons: string[] = [];

        const planAssetClasses2 = (plan.asset_classes as string[] | null) ?? [];
        if (planAssetClasses2.length > 0 && det.asset_type) {
          const assetTypeMap: Record<string, string> = {
            stock: "stocks", equity: "stocks", fx: "forex", forex: "forex",
            crypto: "crypto", commodity: "commodities", index: "indices", etf: "etfs",
          };
          const mappedType = assetTypeMap[det.asset_type.toLowerCase()] || det.asset_type.toLowerCase();
          if (!planAssetClasses2.includes(mappedType)) {
            gateResult = "conflict";
            reasons.push(`${det.asset_type} outside instrument universe`);
          }
        }
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

        if (gateResult === "aligned" || gateResult === "partial") {
          const entryPrice = Number(det.current_price) || 100;
          const positionPct = plan.max_position_pct ?? 3;
          const isLong = det.direction !== "short";

          // ── Detect instrument type ──
          const instrumentType = isForexSymbol(det.instrument) ? "forex" : (det.asset_type || null);
          const isForex = instrumentType === "forex";
          const forexLotSize = isForex ? 0.01 : null; // micro lot default

          let stopPrice: number;
          let targetPrice: number;
          let quantity: number;
          let metadata: Record<string, any> | null = null;

          if (isForex) {
            // Forex: use pip-based sizing
            const pipValue = getForexPipValue(det.instrument, entryPrice, 0.01);
            const isJpy = det.instrument.toUpperCase().includes("JPY");
            const pipSize = isJpy ? 0.01 : 0.0001;

            // Risk budget in dollars
            const riskBudget = portfolio.current_balance * (positionPct / 100);
            // SL distance: 50 pips for majors, 100 pips for exotics
            const slPips = 50;
            const tpPips = slPips * 1.5; // 1.5:1 RR for forex

            stopPrice = isLong
              ? entryPrice - slPips * pipSize
              : entryPrice + slPips * pipSize;
            targetPrice = isLong
              ? entryPrice + tpPips * pipSize
              : entryPrice - tpPips * pipSize;

            // Calculate lots from risk: riskBudget = slPips * pipValue * lots / 0.01
            // lots = riskBudget / (slPips * pipValue / lotSize)
            const pipValuePerLot = getForexPipValue(det.instrument, entryPrice, 1.0);
            const lots = riskBudget / (slPips * pipValuePerLot);
            quantity = Math.max(0.01, Number(lots.toFixed(2))); // minimum micro lot

            metadata = {
              pip_value: pipValue,
              pip_size: pipSize,
              sl_pips: slPips,
              tp_pips: tpPips,
              lot_size: forexLotSize,
              is_jpy_pair: isJpy,
            };

            console.log(`[scan-setups] Forex trade: ${det.instrument} pipValue=${pipValue} lots=${quantity} SL=${slPips}pips`);
          } else {
            // Standard equity/crypto sizing
            const rUnit = entryPrice * (positionPct / 100);
            stopPrice = isLong ? entryPrice - 2 * rUnit : entryPrice + 2 * rUnit;
            targetPrice = isLong ? entryPrice + 3 * rUnit : entryPrice - 3 * rUnit;
            quantity = (portfolio.current_balance * positionPct / 100) / entryPrice;
          }

          // Generate copilot reasoning
          let reasoning = `Automated entry: ${det.pattern_name || "pattern"} on ${det.instrument} (${det.timeframe}). Risk: ${positionPct}% of portfolio.`;
          try {
            const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
            if (anthropicKey) {
              const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                  "x-api-key": anthropicKey,
                  "anthropic-version": "2023-06-01",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "claude-sonnet-4-20250514",
                  max_tokens: 200,
                  system: "Generate a 2-sentence entry rationale for a paper trade. Be specific about the setup type and risk. Plain text only. No markdown.",
                  messages: [
                    {
                      role: "user",
                      content: JSON.stringify({
                        ticker: det.instrument,
                        pattern: det.pattern_name,
                        direction: det.direction,
                        timeframe: det.timeframe,
                        entry_price: entryPrice,
                        stop: stopPrice,
                        target: targetPrice,
                        instrument_type: instrumentType,
                      }),
                    },
                  ],
                }),
              });
              if (aiRes.ok) {
                const aiData = await aiRes.json();
                reasoning = aiData.content?.[0]?.text || reasoning;
              }
            }
          } catch (e) {
            console.error("[scan-setups] AI reasoning error:", e);
          }

          const insertData: Record<string, any> = {
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
            attribution: gateResult === "aligned" ? "ai_approved" : "ai_partial",
            outcome: "open",
            notes: `[auto-scan] ${det.pattern_name || "pattern"} on ${det.timeframe || "unknown"}`,
            instrument_type: instrumentType,
          };

          if (isForex) {
            insertData.forex_lot_size = forexLotSize;
            insertData.metadata = metadata;
          }

          const { error: tradeErr } = await supabase
            .from("paper_trades")
            .insert(insertData);

          if (tradeErr) {
            console.error(`[scan-setups] Trade insert error for ${det.instrument}:`, tradeErr);
          } else {
            totalTradesOpened++;
            console.log(`[scan-setups] Opened paper trade: ${det.instrument} ${det.direction} (${instrumentType || "standard"})`);
          }
        } else {
          console.log(`[scan-setups] Conflict skipped: ${det.instrument} — ${gateReason}`);
        }
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
