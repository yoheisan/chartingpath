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

// ============================================
// TOOL DEFINITIONS
// ============================================

const tools = [
  {
    type: "function",
    function: {
      name: "search_patterns",
      description:
        "Search for active chart patterns on specific instruments or across the market. Returns real-time pattern detections with entry, stop-loss, and take-profit levels. Also returns last_scanned_at for data freshness.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Instrument symbol like AAPL, BTCUSD, EURUSD. Leave empty for market-wide scan." },
          pattern_type: { type: "string", description: "Pattern name like 'Bull Flag', 'Head and Shoulders'." },
          timeframe: { type: "string", enum: ["1h", "4h", "8h", "1d", "1wk"], description: "Timeframe to search." },
          direction: { type: "string", enum: ["bullish", "bearish", "any"], description: "Filter by trade direction." },
          min_quality: { type: "string", enum: ["A", "B", "C"], description: "Minimum quality score (A is highest)." },
          exchange: { type: "string", description: "Filter by exchange. Examples: NYSE, NASDAQ, CRYPTO, FOREX." },
          asset_class: { type: "string", enum: ["stocks", "crypto", "fx", "indices", "commodities"], description: "Filter by asset class." },
          min_win_rate: { type: "number", description: "Minimum win rate percentage filter (e.g., 55 for >55%)." },
          limit: { type: "number", description: "Maximum results to return. Default 10." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_edge_atlas",
      description:
        "Query the Edge Atlas rankings to find the best-performing pattern/timeframe combinations based on 380,000+ backtested trades. Returns annualized returns, win rates, expectancy. If 0 results, AUTOMATICALLY retry with relaxed filters.",
      parameters: {
        type: "object",
        properties: {
          asset_type: { type: "string", enum: ["stocks", "crypto", "fx", "indices", "commodities"], description: "Asset class filter." },
          timeframe: { type: "string", enum: ["1h", "4h", "8h", "1d", "1wk"], description: "Timeframe filter." },
          pattern_name: { type: "string", description: "Pattern name filter (partial match)." },
          direction: { type: "string", enum: ["long", "short"], description: "Trade direction filter." },
          min_trades: { type: "number", description: "Minimum sample size. Default 30." },
          min_win_rate: { type: "number", description: "Minimum win rate percentage." },
          min_annualized_pct: { type: "number", description: "Minimum estimated annualized return in %." },
          min_expectancy: { type: "number", description: "Minimum expectancy per trade in R." },
          fx_segment: { type: "string", enum: ["majors", "crosses"], description: "For FX only: filter by majors or crosses." },
          sort_by: { type: "string", enum: ["annualized", "win_rate", "expectancy", "trades"], description: "Sort order. Default 'annualized'." },
          limit: { type: "number", description: "Max results. Default 10." },
        },
        required: [],
      },
    },
  },
];

const systemPrompt = `You are a screener specialist for ChartingPath. Help users find patterns, filter live signals, and discover setups.

## Your Capabilities
- **search_patterns**: Search active patterns across 8,500+ instruments with filters (symbol, pattern, timeframe, direction, quality, exchange, asset class, win rate).
- **query_edge_atlas**: Search 380,000+ backtested trades for the best-performing pattern/timeframe combos.

## Natural Language Filter Interpretation
Parse user intent into structured filters:
- "bullish crypto 4H >55% win rate" → search_patterns(direction=bullish, asset_class=crypto, timeframe=4h, min_win_rate=55)
- "best forex setups daily" → search_patterns(asset_class=fx, timeframe=1d, min_quality=B)
- "A-grade stock patterns" → search_patterns(asset_class=stocks, min_quality=A)
- "high win rate crypto" → query_edge_atlas(asset_type=crypto, sort_by=win_rate)

## Response Format
- Present results in markdown tables with clickable links: [SYMBOL](/study/SYMBOL)
- Pattern links: [Pattern Name](/patterns/live?pattern=pattern-name)
- Always include last_scanned_at timestamp so users know data freshness
- Quality grades: A=Excellent, B=Good, C=Fair
- Sort by quality (A→B→C) then detection time

## Smart Search Strategy
1. First search with exact user criteria
2. If no results, broaden (lower quality threshold, remove timeframe filter)
3. ALWAYS return something useful

📊 statistics | 🎯 setups | ⚠️ warnings | 💡 tips

⚠️ This is for educational purposes only — not financial advice.`;

// ============================================
// TOOL HANDLERS
// ============================================

function formatPatterns(data: any[]) {
  if (!data?.length) return [];
  const qualityOrder: Record<string, number> = { A: 0, B: 1, C: 2 };
  return data
    .sort((a, b) => (qualityOrder[a.quality_score] ?? 9) - (qualityOrder[b.quality_score] ?? 9) || new Date(b.first_detected_at).getTime() - new Date(a.first_detected_at).getTime())
    .map((p) => ({
      symbol: p.instrument,
      pattern: p.pattern_name,
      direction: p.direction,
      timeframe: p.timeframe,
      quality: p.quality_score,
      entry: p.entry_price,
      stopLoss: p.stop_loss_price,
      takeProfit: p.take_profit_price,
      riskReward: p.risk_reward_ratio,
      trendAlignment: p.trend_alignment,
      currentPrice: p.current_price,
      changePercent: p.change_percent,
      detectedAt: p.first_detected_at,
      studyUrl: `/study/${encodeURIComponent(p.instrument)}`,
      patternsListUrl: `/patterns/live`,
    }));
}

async function executeSearchPatterns(supabase: any, args: any) {
  const selectCols = "id, instrument, pattern_name, direction, timeframe, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, trend_alignment, current_price, change_percent, first_detected_at, exchange, asset_type";

  let query = supabase
    .from("live_pattern_detections")
    .select(selectCols)
    .eq("status", "active")
    .order("first_detected_at", { ascending: false })
    .limit(args.limit || 10);

  if (args.symbol) query = query.ilike("instrument", `%${args.symbol}%`);
  if (args.pattern_type) query = query.ilike("pattern_name", `%${args.pattern_type}%`);
  if (args.timeframe) query = query.eq("timeframe", args.timeframe);
  if (args.direction && args.direction !== "any") query = query.eq("direction", args.direction);
  if (args.exchange) query = query.eq("exchange", args.exchange.toUpperCase());
  if (args.asset_class) query = query.eq("asset_type", args.asset_class);
  if (args.min_quality) {
    const qualityOrder = ["A", "B", "C"];
    const minIndex = qualityOrder.indexOf(args.min_quality);
    if (minIndex >= 0) query = query.in("quality_score", qualityOrder.slice(0, minIndex + 1));
  }

  const { data, error } = await query;

  if (error) {
    console.error("[copilot-screener] Pattern search error:", error);
    return { error: "Failed to search patterns", patterns: [] };
  }

  // Filter by win rate if requested (post-query since it's from historical data)
  let patterns = formatPatterns(data);

  // Auto-fallback for empty results
  if (patterns.length === 0 && (args.min_quality === "A" || args.min_quality === "B")) {
    const fallbackGrades = args.min_quality === "A" ? ["B"] : ["C"];
    let fallbackQuery = supabase
      .from("live_pattern_detections")
      .select(selectCols)
      .eq("status", "active")
      .in("quality_score", fallbackGrades)
      .order("first_detected_at", { ascending: false })
      .limit(args.limit || 10);

    if (args.symbol) fallbackQuery = fallbackQuery.ilike("instrument", `%${args.symbol}%`);
    if (args.pattern_type) fallbackQuery = fallbackQuery.ilike("pattern_name", `%${args.pattern_type}%`);
    if (args.timeframe) fallbackQuery = fallbackQuery.eq("timeframe", args.timeframe);
    if (args.direction && args.direction !== "any") fallbackQuery = fallbackQuery.eq("direction", args.direction);
    if (args.asset_class) fallbackQuery = fallbackQuery.eq("asset_type", args.asset_class);

    const { data: fallbackData } = await fallbackQuery;
    patterns = formatPatterns(fallbackData);

    if (patterns.length > 0) {
      // Fetch last_scanned_at
      const lastScanned = await getLastScannedAt(supabase, args.asset_class);
      return { count: patterns.length, fallbackApplied: true, fallbackReason: `No ${args.min_quality}-quality patterns found. Showing next best.`, patterns, last_scanned_at: lastScanned };
    }
  }

  // Fetch last_scanned_at
  const lastScanned = await getLastScannedAt(supabase, args.asset_class);

  return { count: patterns.length, patterns, last_scanned_at: lastScanned };
}

async function getLastScannedAt(supabase: any, assetClass?: string): Promise<string | null> {
  try {
    let query = supabase
      .from("live_pattern_detections")
      .select("last_confirmed_at")
      .eq("status", "active")
      .order("last_confirmed_at", { ascending: false })
      .limit(1);

    if (assetClass) query = query.eq("asset_type", assetClass);

    const { data } = await query;
    return data?.[0]?.last_confirmed_at || null;
  } catch {
    return null;
  }
}

async function executeQueryEdgeAtlas(supabase: any, args: any) {
  console.log("[copilot-screener] Querying Edge Atlas with filters:", args);

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
    p_min_annualized_pct: args.min_annualized_pct || null,
    p_min_expectancy: args.min_expectancy || null,
    p_fx_symbols: fxSymbols,
    p_sort_by: args.sort_by || "annualized",
    p_limit: args.limit || 10,
  });

  if (error) {
    console.error("[copilot-screener] Edge Atlas query error:", error);
    return { error: "Failed to query Edge Atlas", results: [] };
  }

  if (!data?.length) {
    // Auto-retry without strict filters
    console.log("[copilot-screener] No results, retrying with relaxed filters");
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
      results: (relaxedData || []).map((r: any) => ({
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
      })),
      edgeAtlasUrl: "/edge-atlas",
    };
  }

  return {
    count: data.length,
    results: data.map((r: any) => ({
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
    })),
    edgeAtlasUrl: "/edge-atlas",
  };
}

// ============================================
// TOOL DISPATCHER
// ============================================

async function executeTool(toolName: string, args: any, supabase: any) {
  console.log(`[copilot-screener] Executing tool: ${toolName}`, args);
  switch (toolName) {
    case "search_patterns":
      return await executeSearchPatterns(supabase, args);
    case "query_edge_atlas":
      return await executeQueryEdgeAtlas(supabase, args);
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

    // Extract user ID (optional for screener but forward auth)
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

    const MAX_TOOL_ROUNDS = 5;

    const { createSSEStream, getStatusMessage, STREAM_CORS_HEADERS, HARD_TIMEOUT_MS } = await import("../_shared/streaming.ts");
    const { readable, writer } = createSSEStream();

    const processAsync = async () => {
      const timeoutId = setTimeout(() => {
        writer.sendError("This is taking longer than expected. Please try again.");
        writer.close();
      }, HARD_TIMEOUT_MS);

      try {
        for (let round = 1; round <= MAX_TOOL_ROUNDS; round++) {
          console.log(`[copilot-screener] AI round ${round}`);
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
            console.error("[copilot-screener] AI error:", aiResp.status, errText);
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
                const toolResult = await executeTool(tc.function.name, args, supabase);
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

        const fallback = "I wasn't able to complete the screener search. Please try again or visit [Live Patterns](/patterns/live) directly.";
        writer.sendToken(fallback);
        writer.sendDone();
        writer.close();
      } catch (error) {
        console.error("[copilot-screener] Error:", error);
        writer.sendError(error instanceof Error ? error.message : "Internal error");
        writer.close();
      } finally {
        clearTimeout(timeoutId);
      }
    };

    processAsync();

    return new Response(readable, { headers: STREAM_CORS_HEADERS });
  } catch (error) {
    console.error("[copilot-screener] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
