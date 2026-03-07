import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

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
];

const systemPrompt = `You are a scoring specialist for ChartingPath's Agent Scoring system. Help the user configure their agent scoring weights, cutoffs, take rates, watch rates, and filters.

## Your Capabilities
- **get_agent_scoring_settings**: Read the user's current weights (Analyst, Risk, Timing, Portfolio), verdict cutoffs (TAKE/WATCH thresholds), asset class filter, timeframe filter, and sub-filters.
- **adjust_agent_scoring**: Modify any of the above. Weights auto-normalize to sum=100. WATCH cutoff must be < TAKE cutoff.

## Workflow
1. ALWAYS call get_agent_scoring_settings FIRST before making any adjustments.
2. Present current settings clearly in a table.
3. When asked to change settings, default to 'suggest' mode — show a before/after comparison.
4. Only use 'apply' mode when the user explicitly says "change", "set", "update", or "apply".

## Interpretation Guide
- "Increase take rate" → Lower the TAKE cutoff (more signals qualify as TAKE)
- "Be more conservative" → Raise TAKE cutoff + increase Risk weight
- "Be more aggressive" → Lower TAKE cutoff + lower Watch cutoff
- "Reduce risk" → Increase Risk agent weight
- "Only show forex/crypto/stocks" → Set asset_class_filter
- "Focus on daily" → Set timeframe_filter to 1d

## Response Format
- Use markdown tables for before/after comparisons
- Use 📊 for settings display, ✅ for applied changes, 💡 for suggestions
- Keep responses concise and actionable
- Link to [Agent Scoring](/tools/agent-scoring) for manual configuration

⚠️ This is for educational purposes only — not financial advice.`;

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

async function executeAdjustAgentScoring(supabase: any, args: any, userId: string | null) {
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
      message: 'Here are the recommended changes. Ask me to "apply" them if you agree.',
      changes,
      proposed: { weights: newWeights, takeCutoff: newTake, watchCutoff: newWatch, assetClassFilter: newAssetClass, timeframeFilter: newTimeframe },
      current: { weights: currentWeights, takeCutoff: currentTake, watchCutoff: currentWatch, assetClassFilter: current?.asset_class_filter || "all", timeframeFilter: current?.timeframe_filter || "all" },
      settingsUrl: "/tools/agent-scoring",
    };
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
    settingsUrl: "/tools/agent-scoring",
    tip: "Open Agent Scoring to see the updated results. You may need to refresh the page.",
  };
}

// ============================================
// TOOL DISPATCHER
// ============================================

async function executeTool(toolName: string, args: any, supabase: any, userId: string | null) {
  console.log(`[copilot-scoring] Executing tool: ${toolName}`, args);
  switch (toolName) {
    case "get_agent_scoring_settings":
      return await executeGetAgentScoringSettings(supabase, userId);
    case "adjust_agent_scoring":
      return await executeAdjustAgentScoring(supabase, args, userId);
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
    const { messages, language } = await req.json();

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

    for (let round = 1; round <= MAX_TOOL_ROUNDS; round++) {
      console.log(`[copilot-scoring] AI round ${round}`);

      const aiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/chat/completions?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: convoMessages,
          tools,
          tool_choice: "auto",
          stream: false,
          max_tokens: 4096,
        }),
      });

      if (!aiResp.ok) {
        const errText = await aiResp.text().catch(() => "");
        console.error("[copilot-scoring] AI error:", aiResp.status, errText);
        throw new Error(`AI gateway error: ${aiResp.status}`);
      }

      const result = await aiResp.json();
      const assistantMessage = result.choices?.[0]?.message;

      if (assistantMessage?.tool_calls?.length) {
        const toolResults = await Promise.all(
          assistantMessage.tool_calls.map(async (tc: any) => {
            let args: any = {};
            try { args = JSON.parse(tc.function.arguments || "{}"); } catch { args = {}; }
            const toolResult = await executeTool(tc.function.name, args, supabase, userId);
            return { role: "tool", tool_call_id: tc.id, content: JSON.stringify(toolResult) };
          })
        );

        convoMessages.push(assistantMessage, ...toolResults);
        continue;
      }

      // Final text response — stream as SSE
      const content = assistantMessage?.content || "I couldn't process that request.";
      const sseData = `data: {"choices":[{"delta":{"content":${JSON.stringify(content)}}}]}\n\ndata: [DONE]\n\n`;

      return new Response(sseData, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // Fallback after max rounds
    const fallback = "I wasn't able to complete the scoring adjustment. Please try again or visit [Agent Scoring](/tools/agent-scoring) directly.";
    const sseData = `data: {"choices":[{"delta":{"content":${JSON.stringify(fallback)}}}]}\n\ndata: [DONE]\n\n`;
    return new Response(sseData, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (error) {
    console.error("[copilot-scoring] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
