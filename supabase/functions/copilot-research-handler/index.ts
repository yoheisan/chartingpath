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
// FX SEGMENT LISTS
// ============================================

const FX_MAJORS = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD"];
const FX_CROSSES = [
  "EURGBP", "EURJPY", "EURCHF", "EURAUD", "EURCAD", "EURNZD",
  "GBPJPY", "GBPCHF", "GBPAUD", "GBPCAD", "GBPNZD",
  "AUDJPY", "AUDCHF", "AUDCAD", "AUDNZD",
  "NZDJPY", "NZDCHF", "NZDCAD",
  "CADJPY", "CADCHF", "CHFJPY",
];

const BACKTEST_SESSION_LIMIT = 3;

// ============================================
// TOOL DEFINITIONS
// ============================================

const tools = [
  {
    type: "function",
    function: {
      name: "query_edge_atlas",
      description:
        "Query the Edge Atlas rankings filtered by symbol to research instrument-specific pattern performance. Returns annualized returns, win rates, expectancy from 380,000+ backtested trades.",
      parameters: {
        type: "object",
        properties: {
          asset_type: { type: "string", enum: ["stocks", "crypto", "fx", "indices", "commodities"], description: "Asset class filter." },
          timeframe: { type: "string", enum: ["1h", "4h", "8h", "1d", "1wk"], description: "Timeframe filter." },
          pattern_name: { type: "string", description: "Pattern name filter (partial match)." },
          direction: { type: "string", enum: ["long", "short"], description: "Trade direction filter." },
          min_trades: { type: "number", description: "Minimum sample size. Default 30." },
          min_win_rate: { type: "number", description: "Minimum win rate percentage." },
          min_expectancy: { type: "number", description: "Minimum expectancy per trade in R." },
          fx_segment: { type: "string", enum: ["majors", "crosses"], description: "For FX only." },
          sort_by: { type: "string", enum: ["annualized", "win_rate", "expectancy", "trades"], description: "Sort order. Default 'annualized'." },
          limit: { type: "number", description: "Max results. Default 10." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_backtest",
      description:
        "Run a backtest on a specific instrument and pattern using the Pattern Lab engine. Hard limit: maximum 3 backtest calls per session. Before calling this, ALWAYS call check_backtest_quota first to verify the user has remaining quota. If quota is exhausted, inform the user.",
      parameters: {
        type: "object",
        properties: {
          instrument: { type: "string", description: "Instrument symbol like AAPL, BTCUSD, EURUSD." },
          pattern_name: { type: "string", description: "Pattern name like 'Bull Flag', 'Ascending Triangle'." },
          timeframe: { type: "string", enum: ["1h", "4h", "8h", "1d", "1wk"], description: "Timeframe. Default '1d'." },
          lookback_years: { type: "number", description: "Years of historical data. Default 2. Max 5." },
          risk_reward: { type: "number", description: "Target risk:reward ratio. Default 2." },
        },
        required: ["instrument", "pattern_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_backtest_quota",
      description:
        "Check the user's remaining backtester V2 daily quota before running a backtest. Always call this BEFORE run_backtest to surface remaining credits to the user.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

const systemPrompt = `You are a research specialist for ChartingPath. Help users research specific instruments, analyze pattern performance, and run backtests.

## Your Capabilities
- **query_edge_atlas**: Search 380,000+ backtested trades filtered by symbol, pattern, asset class.
- **run_backtest**: Run a Pattern Lab backtest on a specific instrument+pattern. HARD LIMIT: 3 backtests per session.
- **check_backtest_quota**: Check user's remaining daily backtest credits.

## CRITICAL RULES
1. Before ANY backtest, ALWAYS call check_backtest_quota first and tell the user their remaining credits.
2. Maximum 3 sequential backtest calls per session. After 3, respond: "You have reached the 3-backtest limit for this session. Please review the results so far."
3. If quota is exhausted (0 remaining), do NOT call run_backtest — inform the user to upgrade or wait.

## Research Workflow
1. User asks about an instrument → query_edge_atlas filtered by symbol/pattern
2. If user wants to backtest → check_backtest_quota → show credits → run_backtest
3. Present results with win rate, expectancy, sample size context
4. Suggest follow-up research angles

## Response Format
- Use markdown tables for results
- Link to [Edge Atlas](/edge-atlas) and [Pattern Lab](/pattern-lab)
- Ticker links: [SYMBOL](/study/SYMBOL)
- Show sample size confidence: ≥100 trades = high, 50-99 = medium, <50 = low

⚠️ This is for educational purposes only — not financial advice.`;

// ============================================
// TOOL HANDLERS
// ============================================

async function executeQueryEdgeAtlas(supabase: any, args: any) {
  console.log("[copilot-research] Querying Edge Atlas:", args);

  let fxSymbols: string[] | null = null;
  if (args.asset_type === "fx" && args.fx_segment) {
    fxSymbols = args.fx_segment === "majors" ? FX_MAJORS : FX_CROSSES;
  }

  const { data, error } = await supabase.rpc("get_edge_atlas_rankings_filtered", {
    p_asset_type: args.asset_type || null,
    p_timeframe: args.timeframe || null,
    p_pattern_name: args.pattern_name || null,
    p_direction: args.direction || null,
    p_min_trades: args.min_trades || 30,
    p_min_win_rate: args.min_win_rate || null,
    p_min_annualized_pct: null,
    p_min_expectancy: args.min_expectancy || null,
    p_fx_symbols: fxSymbols,
    p_sort_by: args.sort_by || "annualized",
    p_limit: args.limit || 10,
  });

  if (error) {
    console.error("[copilot-research] Edge Atlas error:", error);
    return { error: "Failed to query Edge Atlas", results: [] };
  }

  if (!data?.length) {
    // Retry relaxed
    const { data: relaxedData } = await supabase.rpc("get_edge_atlas_rankings_filtered", {
      p_asset_type: args.asset_type || null,
      p_timeframe: null,
      p_pattern_name: args.pattern_name || null,
      p_direction: null,
      p_min_trades: 20,
      p_min_win_rate: null,
      p_min_annualized_pct: null,
      p_min_expectancy: null,
      p_fx_symbols: fxSymbols,
      p_sort_by: args.sort_by || "annualized",
      p_limit: args.limit || 10,
    });

    return {
      count: relaxedData?.length || 0,
      filtersRelaxed: true,
      results: formatEdgeAtlasResults(relaxedData),
      edgeAtlasUrl: "/edge-atlas",
    };
  }

  return {
    count: data.length,
    results: formatEdgeAtlasResults(data),
    edgeAtlasUrl: "/edge-atlas",
  };
}

function formatEdgeAtlasResults(data: any[]) {
  return (data || []).map((r: any) => ({
    patternId: r.pattern_id,
    pattern: r.pattern_name,
    timeframe: r.timeframe,
    assetType: r.asset_type,
    direction: r.direction,
    totalTrades: Number(r.total_trades),
    winRate: Number(r.win_rate_pct),
    expectancy: Number(r.expectancy_r),
    tradesPerYear: Number(r.trades_per_year),
    annualizedReturn: Number(r.est_annualized_pct),
    avgBars: Number(r.avg_bars),
    avgRR: Number(r.avg_rr),
  }));
}

async function executeCheckBacktestQuota(supabase: any, userId: string | null) {
  if (!userId) {
    return {
      error: "You need to be logged in to run backtests.",
      suggestion: "Log in to access Pattern Lab backtesting.",
    };
  }

  try {
    const { data, error } = await supabase.rpc("check_backtest_limit", { p_user_id: userId });
    if (error) throw error;

    return {
      allowed: data?.allowed ?? false,
      currentUsage: data?.current_usage ?? 0,
      maxDaily: data?.max_daily_runs ?? 3,
      remaining: data?.remaining ?? 0,
      plan: data?.plan ?? "starter",
      message: data?.allowed
        ? `You have ${data.remaining} backtest run${data.remaining === 1 ? "" : "s"} remaining today (${data.plan} plan).`
        : `You've reached your daily backtest limit (${data.max_daily_runs}/${data.max_daily_runs}). Upgrade for more runs.`,
    };
  } catch (err: any) {
    console.error("[copilot-research] Quota check error:", err);
    return { error: "Failed to check quota", allowed: false };
  }
}

async function executeRunBacktest(
  supabase: any,
  args: any,
  userId: string | null,
): Promise<any> {
  if (!userId) {
    return {
      error: "You need to be logged in to run backtests.",
      suggestion: "Log in to access Pattern Lab backtesting.",
    };
  }

  // Check daily backtest limit from DB
  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase
    .from('copilot_training_pairs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('domain', 'research')
    .like('intent_classification', '%backtest%')
    .gte('created_at', today);

  if ((count ?? 0) >= BACKTEST_SESSION_LIMIT) {
    return {
      error: 'session_limit_reached',
      message: 'You have reached the 3-backtest limit for today. Please review the results so far.',
    };
  }

  const instrument = args.instrument?.toUpperCase();
  const patternName = args.pattern_name;
  const timeframe = args.timeframe || "1d";
  const lookbackYears = Math.min(args.lookback_years || 2, 5);
  const riskReward = args.risk_reward || 2;

  if (!instrument || !patternName) {
    return { error: "Both instrument and pattern_name are required." };
  }

  // Build date range
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setFullYear(fromDate.getFullYear() - lookbackYears);

  console.log(`[copilot-research] Running backtest: ${instrument} / ${patternName} / ${timeframe} / ${lookbackYears}y`);

  try {
    // Invoke the projects-run edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/projects-run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        projectType: "pattern_lab",
        instruments: [instrument],
        patterns: [patternName],
        timeframe,
        fromDate: fromDate.toISOString().split("T")[0],
        toDate: toDate.toISOString().split("T")[0],
        parameters: {
          riskReward,
          positionSize: 2,
          stopLossType: "atr",
          atrMultiplier: 1.5,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error("[copilot-research] Backtest run error:", response.status, errBody);
      return { error: `Backtest failed (${response.status}). Try again or use [Pattern Lab](/pattern-lab) directly.` };
    }

    const result = await response.json();

    const used = (count ?? 0) + 1;
    const remaining = BACKTEST_SESSION_LIMIT - used;

    return {
      success: true,
      instrument,
      pattern: patternName,
      timeframe,
      lookbackYears,
      results: {
        totalTrades: result.total_trades ?? result.totalTrades,
        winRate: result.win_rate ?? result.winRate,
        netPnl: result.net_pnl ?? result.netPnl,
        maxDrawdown: result.max_drawdown ?? result.maxDrawdown,
        sharpeRatio: result.sharpe_ratio ?? result.sharpeRatio,
        profitFactor: result.profit_factor ?? result.profitFactor,
        expectancy: result.expectancy,
        avgRR: result.avg_rr ?? result.avgRR,
      },
      backtestsUsedToday: used,
      backtestsRemainingToday: remaining,
      message: remaining > 0
        ? `Backtest complete. You have ${remaining} backtest${remaining === 1 ? "" : "s"} remaining today.`
        : "Backtest complete. You have reached the 3-backtest limit for today.",
      patternLabUrl: "/pattern-lab",
    };
  } catch (err: any) {
    console.error("[copilot-research] Backtest execution error:", err);
    return { error: `Backtest execution failed: ${err.message}` };
  }
}

// ============================================
// TOOL DISPATCHER
// ============================================

async function executeTool(
  toolName: string,
  args: any,
  supabase: any,
  userId: string | null,
) {
  console.log(`[copilot-research] Executing tool: ${toolName}`, args);
  switch (toolName) {
    case "query_edge_atlas":
      return await executeQueryEdgeAtlas(supabase, args);
    case "run_backtest":
      return await executeRunBacktest(supabase, args, userId);
    case "check_backtest_quota":
      return await executeCheckBacktestQuota(supabase, userId);
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

    // Extract user ID
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
        userId = user?.id || null;
      } catch {}
    }


    const langCode = (language || "en").toLowerCase();
    const langInstruction = langCode !== "en"
      ? `\n\nIMPORTANT: Respond entirely in the language with code "${langCode}". Keep ticker symbols and pattern names in English.`
      : "";

    const convoMessages: any[] = [
      { role: "system", content: systemPrompt + langInstruction },
      ...messages,
    ];

    const MAX_TOOL_ROUNDS = 6;

    const { createSSEStream, getStatusMessage, STREAM_CORS_HEADERS, HARD_TIMEOUT_MS } = await import("../_shared/streaming.ts");
    const { readable, writer } = createSSEStream();

    const processAsync = async () => {
      const timeoutId = setTimeout(() => {
        writer.sendError("This is taking longer than expected. Please try again.");
        writer.close();
      }, HARD_TIMEOUT_MS);

      try {
        for (let round = 1; round <= MAX_TOOL_ROUNDS; round++) {
          console.log(`[copilot-research] AI round ${round}`);
          writer.sendStatus(getStatusMessage(round));

          const aiResp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${GEMINI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gemini-2.0-flash",
              messages: convoMessages,
              tools,
              tool_choice: "auto",
              stream: false,
              max_tokens: 8192,
            }),
          });

          if (!aiResp.ok) {
            const errText = await aiResp.text().catch(() => "");
            console.error("[copilot-research] AI error:", aiResp.status, errText);
            writer.sendError("Failed to get a response. Please try again.");
            writer.close();
            return;
          }

          const result = await aiResp.json();
          const assistantMessage = result.choices?.[0]?.message;

          if (assistantMessage?.tool_calls?.length) {
            const toolResults = await Promise.all(
              assistantMessage.tool_calls.map(async (tc: any) => {
                let toolArgs: any = {};
                try { toolArgs = JSON.parse(tc.function.arguments || "{}"); } catch { toolArgs = {}; }
                const toolResult = await executeTool(tc.function.name, toolArgs, supabase, userId);
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

        const fallback = "I wasn't able to complete the research. Please try again or visit [Pattern Lab](/pattern-lab) directly.";
        writer.sendToken(fallback);
        writer.sendDone();
        writer.close();
      } catch (error) {
        console.error("[copilot-research] Error:", error);
        writer.sendError(error instanceof Error ? error.message : "Internal error");
        writer.close();
      } finally {
        clearTimeout(timeoutId);
      }
    };

    processAsync();

    return new Response(readable, { headers: STREAM_CORS_HEADERS });
  } catch (error) {
    console.error("[copilot-research] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
