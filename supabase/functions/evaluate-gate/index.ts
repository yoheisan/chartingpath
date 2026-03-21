import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VERDICT_TO_GATE: Record<string, string> = {
  TAKE: "aligned",
  WATCH: "partial",
  SKIP: "conflict",
};

const GATE_SEVERITY: Record<string, number> = {
  aligned: 0,
  partial: 1,
  conflict: 2,
};

function stricterGate(a: string, b: string): string {
  return (GATE_SEVERITY[b] ?? 0) > (GATE_SEVERITY[a] ?? 0) ? b : a;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabaseUser.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { ticker, setup_type, timeframe, direction, source } = await req.json();
    if (!ticker) {
      return new Response(JSON.stringify({ error: "ticker is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch active master plan
    const { data: planData } = await supabaseUser
      .from("master_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Fetch agent score if available
    let agentScore: number | null = null;
    let agentVerdict = "WATCH"; // default if no agent score

    const { data: scoreData } = await supabaseAdmin
      .from("agent_scores")
      .select("*")
      .eq("instrument", ticker)
      .order("scored_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (scoreData) {
      // Compute composite: analyst_raw + risk_raw + timing_raw + portfolio_raw
      const composite =
        (scoreData.analyst_raw || 0) * 0.35 +
        (scoreData.risk_raw || 0) * 0.25 +
        (scoreData.timing_raw || 0) * 0.2 +
        (scoreData.portfolio_raw || 0) * 0.2;
      agentScore = Math.round(composite * 100) / 100;

      // Fetch user's scoring settings for cutoffs
      const { data: settings } = await supabaseUser
        .from("agent_scoring_settings")
        .select("take_cutoff, watch_cutoff")
        .eq("user_id", userId)
        .eq("is_default", true)
        .maybeSingle();

      const takeCutoff = settings?.take_cutoff ?? 70;
      const watchCutoff = settings?.watch_cutoff ?? 40;

      if (agentScore >= takeCutoff) {
        agentVerdict = "TAKE";
      } else if (agentScore >= watchCutoff) {
        agentVerdict = "WATCH";
      } else {
        agentVerdict = "SKIP";
      }
    }

    // 3. Map verdict to gate result
    let gateResult = VERDICT_TO_GATE[agentVerdict] || "partial";
    const reasons: string[] = [];

    // 4. Check Master Plan rule violations
    if (planData) {
      // Direction conflict
      if (
        planData.trend_direction &&
        planData.trend_direction !== "both" &&
        direction
      ) {
        const planDir = planData.trend_direction.replace("_", " ");
        const setupDir = direction.toLowerCase();
        if (
          (planDir === "long only" && setupDir === "short") ||
          (planDir === "short only" && setupDir === "long")
        ) {
          gateResult = stricterGate(gateResult, "conflict");
          reasons.push(
            `${direction} direction conflicts with your ${planDir} mandate`
          );
        }
      }

      // Preferred patterns check
      const preferredPatterns = planData.preferred_patterns as string[] | null;
      if (
        preferredPatterns &&
        preferredPatterns.length > 0 &&
        setup_type
      ) {
        const setupLower = setup_type.toLowerCase();
        const isPreferred = preferredPatterns.some(
          (p: string) => setupLower.includes(p.toLowerCase()) || p.toLowerCase().includes(setupLower)
        );
        if (!isPreferred) {
          gateResult = stricterGate(gateResult, "partial");
          reasons.push(
            `${setup_type} setup is not in your preferred patterns`
          );
        }
      }

      // Sector filter exclusions
      const sectorFilters = planData.sector_filters as string[] | null;
      if (sectorFilters && sectorFilters.length > 0) {
        // We don't have sector info for the ticker readily, so skip for now
        // This would require instrument metadata lookup
      }

      // Trading window check
      if (planData.trading_window_start && planData.trading_window_end) {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const start = planData.trading_window_start as string;
        const end = planData.trading_window_end as string;
        if (currentTime < start || currentTime > end) {
          gateResult = stricterGate(gateResult, "partial");
          reasons.push(
            `Current time is outside your trading window (${start}–${end})`
          );
        }
      }
    }

    // 5. Generate gate reason
    let gateReason: string;
    if (reasons.length > 0) {
      gateReason = reasons.join(". ");
    } else if (gateResult === "aligned") {
      gateReason = `${ticker} aligns with your Master Plan`;
    } else if (gateResult === "partial") {
      gateReason = `${ticker} partially matches — review before adding`;
    } else {
      gateReason = `${ticker} conflicts with your current mandate`;
    }

    // 6. Save evaluation
    const { data: evalRow, error: evalErr } = await supabaseUser
      .from("gate_evaluations")
      .insert({
        user_id: userId,
        ticker,
        setup_type: setup_type || null,
        timeframe: timeframe || null,
        direction: direction || null,
        agent_score: agentScore,
        agent_verdict: agentVerdict,
        gate_result: gateResult,
        gate_reason: gateReason,
        master_plan_id: planData?.id || null,
        source: source || "ai_scan",
      })
      .select("id")
      .single();

    if (evalErr) {
      console.error("Failed to save gate evaluation:", evalErr);
    }

    return new Response(
      JSON.stringify({
        gate_result: gateResult,
        gate_reason: gateReason,
        agent_score: agentScore,
        verdict: agentVerdict,
        evaluation_id: evalRow?.id || null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("evaluate-gate error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
