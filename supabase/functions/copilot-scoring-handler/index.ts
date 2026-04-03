import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// ============================================
// TOOL DEFINITIONS
// ============================================

const tools = [
  {
    type: "function",
    function: {
      name: "get_agent_scoring_settings",
      description: "Get the authenticated user's current Agent Scoring settings including weights (Analyst, Risk, Timing, Portfolio), verdict cutoffs (TAKE/WATCH thresholds), asset class filter, timeframe filter, and sub-filters. Use when users ask about their current scoring settings or before making adjustments. Requires login.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "adjust_agent_scoring",
      description:
        "Adjust the user's Agent Scoring settings based on their natural language request. Can modify agent weights (Analyst 0-100, Risk 0-100, Timing 0-100, Portfolio 0-100 — they auto-normalize to sum=100), TAKE cutoff (0-100, higher = stricter), WATCH cutoff (0-100), asset class filter, timeframe filter, and sub-filters. IMPORTANT: Always call get_agent_scoring_settings first to see current values before adjusting.",
      parameters: {
        type: "object",
        properties: {
          preset_name: { type: "string", description: "Name for the new or updated preset. If omitted, updates the user's default preset." },
          analyst_weight: { type: "number", description: "New Analyst agent weight (0-100)." },
          risk_weight: { type: "number", description: "New Risk agent weight (0-100)." },
          timing_weight: { type: "number", description: "New Timing agent weight (0-100)." },
          portfolio_weight: { type: "number", description: "New Portfolio agent weight (0-100)." },
          take_cutoff: { type: "number", description: "TAKE verdict threshold (0-100)." },
          watch_cutoff: { type: "number", description: "WATCH verdict threshold (0-100). Must be < take_cutoff." },
          asset_class_filter: { type: "string", enum: ["all", "fx", "crypto", "stocks", "indices", "commodities"], description: "Filter scoring to specific asset class." },
          timeframe_filter: { type: "string", enum: ["all", "1h", "4h", "8h", "1d", "1wk"], description: "Filter scoring to specific timeframe." },
          action: { type: "string", enum: ["apply", "suggest"], description: "Whether to directly apply changes ('apply') or just suggest them ('suggest'). Default 'suggest'." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_agent_scoring_preset",
      description: "Save the user's current or proposed Agent Scoring settings as a named preset. Use when the user says 'save this', 'save as', or 'create a preset named X'.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name for the preset." },
          weights: { type: "object", description: "Weights object with analyst, risk, timing, portfolio keys." },
          take_cutoff: { type: "number" },
          watch_cutoff: { type: "number" },
          asset_class_filter: { type: "string" },
          timeframe_filter: { type: "string" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "load_agent_scoring_preset",
      description: "Load a saved preset by name and apply it. Use when the user says 'load X', 'apply X preset', or 'use my X settings'.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name or partial name of the preset to load." },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "undo_agent_scoring",
      description: "Revert to the previous Agent Scoring settings before the last change. Use when the user says 'undo', 'go back', or 'revert'.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_agent_backtest",
      description: "Trigger a backtest run using the current basket selections. Use when the user says 'run backtest', 'test these', or 'backtest now'.",
      parameters: {
        type: "object",
        properties: {
          instruments: {
            type: "array",
            items: { type: "string" },
            description: "Optional list of specific instruments to backtest.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "explain_signal_score",
      description: "Explain why a specific signal scored the way it did by reading its pre-computed agent scores. Use when the user asks 'why did X score Y' or 'explain the score for X'.",
      parameters: {
        type: "object",
        properties: {
          instrument: { type: "string", description: "Instrument ticker e.g. AAPL, BTC-USD" },
          pattern_id: { type: "string", description: "Pattern ID e.g. bull_flag, double_bottom" },
          timeframe: { type: "string", description: "Timeframe e.g. 1d, 4h" },
        },
        required: ["instrument"],
      },
    },
  },
];

const systemPrompt = `You are a scoring specialist for ChartingPath's Agent Scoring system. Help the user configure their agent scoring weights, cutoffs, take rates, watch rates, and filters.

## Your Capabilities
- **get_agent_scoring_settings**: Read current weights, cutoffs, filters
- **adjust_agent_scoring**: Modify weights, cutoffs, filters
- **save_agent_scoring_preset**: Save current settings as a named preset
- **load_agent_scoring_preset**: Load and apply a saved preset by name
- **undo_agent_scoring**: Revert to previous settings (uses change history)
- **run_agent_backtest**: Trigger a backtest (only works if user is on Agent Scoring page)
- **explain_signal_score**: Explain why a signal scored the way it did. IMPORTANT: When you receive a scoreExplanation object in the tool result, you MUST emit it as a fenced JSON block BEFORE your natural language explanation, exactly like this:

` + "```json\n{\"scoreExplanation\": <paste the entire scoreExplanation object from the tool result here>}\n```" + `

Then follow with your natural language summary. Never skip the JSON block when scoreExplanation is present.

## Execution Path Rules
When panelMounted is false AND the request requires UI changes (weights/cutoffs):
- In suggest mode: tell the user they're not on Agent Scoring, offer to navigate or save as preset
- In apply mode: apply to DB (settings persist), include navigateTo in response, ask if they want to go there

When panelMounted is true:
- Apply changes normally — the UI will sync automatically via events

## Workflow
1. ALWAYS call get_agent_scoring_settings FIRST before adjusting.
2. For adjustments, default to action='suggest' unless the user uses imperative language: "change", "set", "update", "apply", "make it", "maximize", "minimize".
3. For complex requests ("maximize take rate without changing risk"), show 2-3 options with tradeoffs before applying.
4. Always show a before/after markdown table for any change.

## Interpretation Guide
- "Increase take rate" → Lower the TAKE cutoff
- "Be more conservative" → Raise TAKE cutoff + increase Risk weight
- "Be more aggressive" → Lower TAKE cutoff + lower Watch cutoff
- "Undo" / "Go back" → call undo_agent_scoring
- "Save this as X" → call save_agent_scoring_preset
- "Load X" / "Use my X preset" → call load_agent_scoring_preset
- "Run backtest" → call run_agent_backtest
- "Why did X score Y?" / "Explain the score for X" → call explain_signal_score immediately using just the instrument name. Do NOT ask the user for pattern_id or timeframe — these are optional. Call the tool right away with only instrument set.

## Response Format
- When adjust_agent_scoring returns mode="applied", you MUST emit the actionMarker object from the tool result as a standalone JSON code block in your response, exactly like this: \`\`\`json\\n{...actionMarker object here...}\\n\`\`\` This is required for the UI to update. Do not skip it.
- Use markdown tables for before/after comparisons
- Use 📊 for settings display, ✅ for applied changes, 💡 for suggestions
- Keep responses concise and actionable

⚠️ Educational purposes only — not financial advice.`;

// ============================================
// TOOL HANDLERS
// ============================================

async function executeGetAgentScoringSettings(supabase: any, userId: string | null) {
  if (!userId) {
    return {
      error: "You need to be logged in to view your Agent Scoring settings.",
      suggestion: "Log in first, then I can read and adjust your scoring preferences.",
      settingsUrl: "/tools/agent-scoring",
    };
  }

  const { data, error } = await supabase
    .from("agent_scoring_settings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[copilot-scoring] Agent scoring settings error:", error);
    return { error: "Failed to fetch settings" };
  }

  if (!data?.length) {
    return {
      message: "No saved Agent Scoring presets found. Using defaults.",
      defaults: {
        weights: { analyst: 30, risk: 25, timing: 20, portfolio: 25 },
        takeCutoff: 70,
        watchCutoff: 50,
        assetClassFilter: "all",
        timeframeFilter: "all",
        subFilters: {},
      },
      settingsUrl: "/tools/agent-scoring",
    };
  }

  return {
    count: data.length,
    settings: data.map((s: any) => ({
      id: s.id,
      name: s.name,
      isDefault: s.is_default,
      weights: s.weights,
      takeCutoff: s.take_cutoff,
      watchCutoff: s.watch_cutoff,
      assetClassFilter: s.asset_class_filter,
      timeframeFilter: s.timeframe_filter,
      subFilters: s.sub_filters,
    })),
    settingsUrl: "/tools/agent-scoring",
  };
}

async function executeAdjustAgentScoring(supabase: any, args: any, userId: string | null, panelMounted: boolean) {
  if (!userId) {
    return {
      error: "You need to be logged in to adjust Agent Scoring settings.",
      suggestion: "Log in first, then I can modify your scoring preferences.",
      settingsUrl: "/tools/agent-scoring",
    };
  }

  const action = args.action || "suggest";

  // Get current settings
  const { data: existing } = await supabase
    .from("agent_scoring_settings")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .limit(1);

  const current = existing?.[0];
  const currentWeights = current?.weights || { analyst: 30, risk: 25, timing: 20, portfolio: 25 };
  const currentTake = current?.take_cutoff ?? 70;
  const currentWatch = current?.watch_cutoff ?? 50;

  // Build new values
  const newWeights = {
    analyst: args.analyst_weight ?? currentWeights.analyst,
    risk: args.risk_weight ?? currentWeights.risk,
    timing: args.timing_weight ?? currentWeights.timing,
    portfolio: args.portfolio_weight ?? currentWeights.portfolio,
  };

  // Normalize weights to sum to 100
  const totalW = newWeights.analyst + newWeights.risk + newWeights.timing + newWeights.portfolio;
  if (totalW > 0 && totalW !== 100) {
    const factor = 100 / totalW;
    newWeights.analyst = Math.round(newWeights.analyst * factor * 10) / 10;
    newWeights.risk = Math.round(newWeights.risk * factor * 10) / 10;
    newWeights.timing = Math.round(newWeights.timing * factor * 10) / 10;
    newWeights.portfolio = Math.round(newWeights.portfolio * factor * 10) / 10;
  }

  const newTake = args.take_cutoff ?? currentTake;
  const newWatch = args.watch_cutoff ?? currentWatch;
  const newAssetClass = args.asset_class_filter ?? current?.asset_class_filter ?? "all";
  const newTimeframe = args.timeframe_filter ?? current?.timeframe_filter ?? "all";

  // Validation
  if (newWatch >= newTake) {
    return {
      error: `WATCH cutoff (${newWatch}) must be lower than TAKE cutoff (${newTake}). Adjust the values.`,
      currentSettings: { weights: currentWeights, takeCutoff: currentTake, watchCutoff: currentWatch },
    };
  }

  const changes: string[] = [];
  if (args.analyst_weight != null || args.risk_weight != null || args.timing_weight != null || args.portfolio_weight != null) {
    changes.push(`Weights: Analyst ${currentWeights.analyst}→${newWeights.analyst}, Risk ${currentWeights.risk}→${newWeights.risk}, Timing ${currentWeights.timing}→${newWeights.timing}, Portfolio ${currentWeights.portfolio}→${newWeights.portfolio}`);
  }
  if (args.take_cutoff != null) changes.push(`TAKE cutoff: ${currentTake}→${newTake}`);
  if (args.watch_cutoff != null) changes.push(`WATCH cutoff: ${currentWatch}→${newWatch}`);
  if (args.asset_class_filter) changes.push(`Asset class: ${current?.asset_class_filter || "all"}→${newAssetClass}`);
  if (args.timeframe_filter) changes.push(`Timeframe: ${current?.timeframe_filter || "all"}→${newTimeframe}`);

  if (action === "suggest") {
    return {
      mode: "suggestion",
      message: panelMounted
        ? 'Here are the recommended changes. Ask me to "apply" them if you agree.'
        : 'Here are the recommended changes. You\'re not on Agent Scoring — say "apply and go there" to navigate and apply, or "save as [name]" to save as a preset.',
      changes,
      proposed: { weights: newWeights, takeCutoff: newTake, watchCutoff: newWatch, assetClassFilter: newAssetClass, timeframeFilter: newTimeframe },
      current: { weights: currentWeights, takeCutoff: currentTake, watchCutoff: currentWatch, assetClassFilter: current?.asset_class_filter || "all", timeframeFilter: current?.timeframe_filter || "all" },
      panelMounted,
      settingsUrl: "/tools/agent-scoring",
    };
  }

  // Snapshot current settings before writing
  if (action === "apply" && current?.id) {
    await supabase.from("agent_scoring_history").insert({
      user_id: userId,
      weights: currentWeights,
      take_cutoff: currentTake,
      watch_cutoff: currentWatch,
      asset_class_filter: current?.asset_class_filter ?? "all",
      timeframe_filter: current?.timeframe_filter ?? "all",
      sub_filters: current?.sub_filters ?? {},
      change_source: "copilot",
      change_description: changes.join("; "),
    });
  }

  // Apply the changes
  const presetName = args.preset_name || current?.name || "Copilot Adjusted";
  const row = {
    name: presetName,
    weights: newWeights,
    take_cutoff: newTake,
    watch_cutoff: newWatch,
    asset_class_filter: newAssetClass,
    timeframe_filter: newTimeframe,
    sub_filters: current?.sub_filters || {},
    is_default: current?.is_default ?? true,
    updated_at: new Date().toISOString(),
  };

  let resultId: string;
  if (current?.id) {
    const { error } = await supabase.from("agent_scoring_settings").update(row).eq("id", current.id);
    if (error) {
      console.error("[copilot-scoring] Update scoring settings error:", error);
      return { error: "Failed to update settings. Please try via the Agent Scoring page." };
    }
    resultId = current.id;
  } else {
    const { data: inserted, error } = await supabase
      .from("agent_scoring_settings")
      .insert({ ...row, user_id: userId })
      .select("id")
      .single();
    if (error) {
      console.error("[copilot-scoring] Insert scoring settings error:", error);
      return { error: "Failed to save settings. Please try via the Agent Scoring page." };
    }
    resultId = inserted.id;
  }

  return {
    mode: "applied",
    message: `Settings updated successfully! Preset: "${presetName}"`,
    changes,
    applied: { id: resultId, name: presetName, weights: newWeights, takeCutoff: newTake, watchCutoff: newWatch, assetClassFilter: newAssetClass, timeframeFilter: newTimeframe },
    uiSync: { weights: newWeights, takeCutoff: newTake, watchCutoff: newWatch, assetClassFilter: newAssetClass, timeframeFilter: newTimeframe },
    diff: {
      weights: {
        analyst: newWeights.analyst !== currentWeights.analyst ? newWeights.analyst : undefined,
        risk: newWeights.risk !== currentWeights.risk ? newWeights.risk : undefined,
        timing: newWeights.timing !== currentWeights.timing ? newWeights.timing : undefined,
        portfolio: newWeights.portfolio !== currentWeights.portfolio ? newWeights.portfolio : undefined,
      },
      cutoffs: {
        take: newTake !== currentTake ? newTake : undefined,
        watch: newWatch !== currentWatch ? newWatch : undefined,
      },
    },
    panelMounted,
    settingsUrl: "/tools/agent-scoring",
    tip: panelMounted ? "Settings applied — your sliders have updated." : "You're not on Agent Scoring. Want me to take you there?",
    actionMarker: {
      uiSync: { weights: newWeights, takeCutoff: newTake, watchCutoff: newWatch, assetClassFilter: newAssetClass, timeframeFilter: newTimeframe },
      diff: {
        weights: {
          analyst: newWeights.analyst !== currentWeights.analyst ? newWeights.analyst : undefined,
          risk: newWeights.risk !== currentWeights.risk ? newWeights.risk : undefined,
          timing: newWeights.timing !== currentWeights.timing ? newWeights.timing : undefined,
          portfolio: newWeights.portfolio !== currentWeights.portfolio ? newWeights.portfolio : undefined,
        },
        cutoffs: {
          take: newTake !== currentTake ? newTake : undefined,
          watch: newWatch !== currentWatch ? newWatch : undefined,
        },
      },
    },
  };
}

// ============================================
// NEW TOOL HANDLERS
// ============================================

async function executeSaveAgentScoringPreset(supabase: any, args: any, userId: string | null) {
  if (!userId) return { error: "Login required to save presets." };
  const { data: current } = await supabase
    .from("agent_scoring_settings")
    .select("*").eq("user_id", userId)
    .order("is_default", { ascending: false }).limit(1);
  const base = current?.[0];
  const row = {
    user_id: userId,
    name: args.name,
    weights: args.weights ?? base?.weights ?? { analyst: 25, risk: 25, timing: 25, portfolio: 25 },
    take_cutoff: args.take_cutoff ?? base?.take_cutoff ?? 70,
    watch_cutoff: args.watch_cutoff ?? base?.watch_cutoff ?? 50,
    asset_class_filter: args.asset_class_filter ?? base?.asset_class_filter ?? "all",
    timeframe_filter: args.timeframe_filter ?? base?.timeframe_filter ?? "all",
    sub_filters: base?.sub_filters ?? {},
    is_default: false,
  };
  const { data: saved, error } = await supabase
    .from("agent_scoring_settings").insert(row).select("id").single();
  if (error) return { error: "Failed to save preset." };
  return { saved: true, presetId: saved.id, presetName: args.name };
}

async function executeLoadAgentScoringPreset(supabase: any, args: any, userId: string | null) {
  if (!userId) return { error: "Login required to load presets." };
  const { data } = await supabase
    .from("agent_scoring_settings")
    .select("*").eq("user_id", userId);
  if (!data?.length) return { error: "No saved presets found." };
  const nameLower = args.name.toLowerCase();
  const ranked = data
    .map((p: any) => ({ ...p, score: p.name.toLowerCase().includes(nameLower) ? 1 : 0 }))
    .filter((p: any) => p.score > 0)
    .sort((a: any, b: any) => b.score - a.score);
  if (!ranked.length) return { error: `No preset matching "${args.name}" found.`, available: data.map((p: any) => p.name) };
  if (ranked.length > 1 && ranked[0].score === ranked[1].score) {
    return { matches: ranked.map((p: any) => p.name), message: "Multiple presets match. Which one did you mean?" };
  }
  const preset = ranked[0];
  return {
    loaded: true,
    preset: { id: preset.id, name: preset.name, weights: preset.weights, takeCutoff: preset.take_cutoff, watchCutoff: preset.watch_cutoff, assetClassFilter: preset.asset_class_filter, timeframeFilter: preset.timeframe_filter },
    uiSync: { weights: preset.weights, takeCutoff: preset.take_cutoff, watchCutoff: preset.watch_cutoff, assetClassFilter: preset.asset_class_filter, timeframeFilter: preset.timeframe_filter, presetId: preset.id, presetName: preset.name },
  };
}

async function executeUndoAgentScoring(supabase: any, userId: string | null) {
  if (!userId) return { error: "Login required." };
  const { data } = await supabase
    .from("agent_scoring_history")
    .select("*").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(1);
  if (!data?.length) return { canUndo: false, message: "No previous settings to revert to." };
  const snapshot = data[0];
  const { data: current } = await supabase
    .from("agent_scoring_settings")
    .select("*").eq("user_id", userId)
    .order("is_default", { ascending: false }).limit(1);
  if (current?.[0]) {
    await supabase.from("agent_scoring_settings").update({
      weights: snapshot.weights,
      take_cutoff: snapshot.take_cutoff,
      watch_cutoff: snapshot.watch_cutoff,
      asset_class_filter: snapshot.asset_class_filter,
      timeframe_filter: snapshot.timeframe_filter,
      sub_filters: snapshot.sub_filters,
      updated_at: new Date().toISOString(),
    }).eq("id", current[0].id);
  }
  return {
    undone: true,
    message: `Reverted to settings from ${new Date(snapshot.created_at).toLocaleTimeString()}`,
    uiSync: { weights: snapshot.weights, takeCutoff: snapshot.take_cutoff, watchCutoff: snapshot.watch_cutoff, assetClassFilter: snapshot.asset_class_filter, timeframeFilter: snapshot.timeframe_filter },
  };
}

async function executeRunAgentBacktest(args: any, panelMounted: boolean) {
  if (!panelMounted) {
    return {
      runBacktest: false,
      reason: "panel_not_mounted",
      message: "You're not on the Agent Scoring page. Navigate there first, then I can trigger the backtest.",
      navigateTo: "/tools/agent-scoring",
    };
  }
  return { runBacktest: true, instruments: args.instruments ?? [] };
}

async function executeExplainSignalScore(supabase: any, args: any) {
  let query = supabase
    .from("agent_scores")
    .select("*")
    .ilike("instrument", args.instrument);
  if (args.pattern_id) query = query.eq("pattern_id", args.pattern_id);
  if (args.timeframe) query = query.eq("timeframe", args.timeframe);
  const { data, error } = await query.limit(1);
  if (error || !data?.length) {
    return { error: `No score found for ${args.instrument}${args.pattern_id ? ` (${args.pattern_id})` : ""}.` };
  }
  const s = data[0];

  const analystRaw = (s.analyst_raw ?? 0) * 100;
  const riskRaw = (s.risk_raw ?? 0) * 100;
  const timingRaw = (s.timing_raw ?? 0) * 100;
  const portfolioRaw = (s.portfolio_raw ?? 0) * 100;
  const composite = (analystRaw + riskRaw + timingRaw + portfolioRaw) / 4;
  const verdict = composite >= 70 ? "TAKE" : composite >= 50 ? "WATCH" : "SKIP";

  const ad = s.analyst_details ?? {};
  const rd = s.risk_details ?? {};
  const td = s.timing_details ?? {};

  const scoreExplanation = {
    instrument: s.instrument,
    pattern: s.pattern_id,
    timeframe: s.timeframe,
    composite: Math.round(composite * 10) / 10,
    verdict,
    analyst: {
      score: Math.round(analystRaw),
      winRate: s.win_rate ?? ad.winRate ?? undefined,
      avgR: ad.avgR ?? ad.expectancy ?? undefined,
      trades: s.sample_size ?? ad.sampleSize ?? undefined,
    },
    risk: {
      score: Math.round(riskRaw),
      rr: rd.rr ?? rd.rewardRisk ?? undefined,
      kelly: rd.kelly ?? undefined,
    },
    timing: {
      score: Math.round(timingRaw),
      trend: td.trend ?? undefined,
      hasEvents: td.hasEvents ?? td.economicEvents ?? undefined,
    },
    portfolio: {
      score: Math.round(portfolioRaw),
      note: portfolioRaw >= 60 ? "Strong basket fit" : portfolioRaw >= 40 ? "Neutral basket position" : "No basket selected — neutral score applied",
    },
  };

  return {
    scoreExplanation,
    raw: {
      instrument: s.instrument,
      pattern_id: s.pattern_id,
      timeframe: s.timeframe,
      is_proven: s.is_proven,
      sample_size: s.sample_size,
      win_rate: s.win_rate,
      scored_at: s.scored_at,
    },
  };
}

// ============================================
// TOOL DISPATCHER
// ============================================

async function executeTool(toolName: string, args: any, supabase: any, userId: string | null, panelMounted: boolean) {
  console.log(`[copilot-scoring] Executing tool: ${toolName}`, args);
  switch (toolName) {
    case "get_agent_scoring_settings":
      return await executeGetAgentScoringSettings(supabase, userId);
    case "adjust_agent_scoring":
      return await executeAdjustAgentScoring(supabase, args, userId, panelMounted);
    case "save_agent_scoring_preset":
      return await executeSaveAgentScoringPreset(supabase, args, userId);
    case "load_agent_scoring_preset":
      return await executeLoadAgentScoringPreset(supabase, args, userId);
    case "undo_agent_scoring":
      return await executeUndoAgentScoring(supabase, userId);
    case "run_agent_backtest":
      return await executeRunAgentBacktest(args, panelMounted);
    case "explain_signal_score":
      return await executeExplainSignalScore(supabase, args);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language, context } = await req.json();
    const panelMounted = context?.panelMounted ?? true;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract user ID from auth header
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
        userId = user?.id || null;
      } catch {
        // Continue without user context
      }
    }

    // Build language instruction
    const langCode = (language || "en").toLowerCase();
    const langInstruction = langCode !== "en"
      ? `\n\nIMPORTANT: Respond entirely in the language with code "${langCode}". Keep technical terms in English.`
      : "";

    const convoMessages: any[] = [
      { role: "system", content: systemPrompt + langInstruction },
      ...messages,
    ];

    const MAX_TOOL_ROUNDS = 4;

    const { createSSEStream, getStatusMessage, STREAM_CORS_HEADERS, HARD_TIMEOUT_MS } = await import("../_shared/streaming.ts");
    const { readable, writer } = createSSEStream();

    const processAsync = async () => {
      const timeoutId = setTimeout(() => {
        writer.sendError("This is taking longer than expected. Please try again.");
        writer.close();
      }, HARD_TIMEOUT_MS);

      try {
        // ═══ MODEL ROUTING ═══
        const lastUserMsg = (messages || []).filter((m: any) => m.role === 'user').pop()?.content?.toLowerCase() || '';
        const HEAVY_PATTERNS = /backtest|multi[\s-]*timeframe|mtf|trading\s*plan|build.*strategy/i;
        const isHeavy = HEAVY_PATTERNS.test(lastUserMsg);
        const scoringModel = isHeavy ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash';
        const scoringMaxTokens = isHeavy ? 8000 : 4096;
        const scoringTimeout = isHeavy ? 60000 : 25000;
        const scoringRequestType = isHeavy
          ? (/backtest/i.test(lastUserMsg) ? 'backtest' : /multi[\s-]*timeframe|mtf/i.test(lastUserMsg) ? 'multi_timeframe_analysis' : 'trading_plan_build')
          : (/quick|scan|signal/i.test(lastUserMsg) ? 'quick_scan' : 'single_pattern_query');
        
        console.log(`[copilot-scoring] Model routing: type=${scoringRequestType} model=${scoringModel} timeout=${scoringTimeout}ms`);
        const scoringStartTime = Date.now();

        for (let round = 1; round <= MAX_TOOL_ROUNDS; round++) {
          console.log(`[copilot-scoring] AI round ${round}`);
          writer.sendStatus(getStatusMessage(round));

          const aiRequestBody = {
            model: scoringModel,
            messages: convoMessages,
            tools,
            tool_choice: "auto",
            stream: false,
            max_tokens: scoringMaxTokens,
          };

          const aiResp = LOVABLE_API_KEY
            ? await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(aiRequestBody),
                signal: AbortSignal.timeout(25000),
              })
            : GEMINI_API_KEY
              ? await fetch("https://generativelanguage.googleapis.com/v1beta/chat/completions", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${GEMINI_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ ...aiRequestBody, model: "gemini-2.5-flash" }),
                  signal: AbortSignal.timeout(25000),
                })
              : (() => {
                  throw new Error("Neither LOVABLE_API_KEY nor GEMINI_API_KEY is configured");
                })();

          if (!aiResp.ok) {
            const errText = await aiResp.text().catch(() => "");
            console.error("[copilot-scoring] AI error:", aiResp.status, errText);
            writer.sendError("Failed to get a response. Please try again.");
            writer.close();
            return;
          }

          const result = await aiResp.json();
          const assistantMessage = result.choices?.[0]?.message;

          if (assistantMessage?.tool_calls?.length) {
            const toolResults = await Promise.all(
              assistantMessage.tool_calls.map(async (tc: any) => {
                let args: any = {};
                try { args = JSON.parse(tc.function.arguments || "{}"); } catch { args = {}; }
                const toolResult = await executeTool(tc.function.name, args, supabase, userId, panelMounted);
                return { role: "tool", tool_call_id: tc.id, content: JSON.stringify(toolResult) };
              })
            );

            convoMessages.push(assistantMessage, ...toolResults);
            continue;
          }

          const content = assistantMessage?.content || "I couldn't process that request.";
          writer.sendToken(content);
          writer.sendDone();
          writer.close();
          return;
        }

        const fallback = "I wasn't able to complete the scoring adjustment. Please try again or visit [Agent Scoring](/tools/agent-scoring) directly.";
        writer.sendToken(fallback);
        writer.sendDone();
        writer.close();
      } catch (error) {
        console.error("[copilot-scoring] Error:", error);
        writer.sendError(error instanceof Error ? error.message : "Internal error");
        writer.close();
      } finally {
        clearTimeout(timeoutId);
      }
    };

    processAsync();

    return new Response(readable, { headers: STREAM_CORS_HEADERS });
  } catch (error) {
    console.error("[copilot-scoring] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
