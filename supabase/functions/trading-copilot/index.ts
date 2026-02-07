import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tool definitions for the AI agent
const tools = [
  {
    type: "function",
    function: {
      name: "search_patterns",
      description: "Search for active chart patterns on specific instruments or across the market. Returns real-time pattern detections with entry, stop-loss, and take-profit levels.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Instrument symbol like AAPL, BTCUSD, EURUSD. Leave empty for market-wide scan." },
          pattern_type: { type: "string", description: "Pattern name like 'Bull Flag', 'Head and Shoulders'. Leave empty for all patterns." },
          timeframe: { type: "string", enum: ["1h", "4h", "8h", "1d", "1wk"], description: "Timeframe to search. Default is 1d (daily)." },
          direction: { type: "string", enum: ["bullish", "bearish", "any"], description: "Filter by trade direction." },
          min_quality: { type: "string", enum: ["A", "B", "C"], description: "Minimum quality score (A is highest)." },
          limit: { type: "number", description: "Maximum results to return. Default 5." }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_pattern_stats",
      description: "Get historical win rate and performance statistics for a specific pattern type.",
      parameters: {
        type: "object",
        properties: {
          pattern_name: { type: "string", description: "Pattern name like 'Bull Flag', 'Ascending Triangle'." },
          symbol: { type: "string", description: "Instrument symbol. Leave empty for market-wide stats." },
          timeframe: { type: "string", enum: ["1h", "4h", "8h", "1d", "1wk"], description: "Timeframe filter." }
        },
        required: ["pattern_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "explain_pattern",
      description: "Provide educational explanation of a chart pattern including how to identify it and trading approach.",
      parameters: {
        type: "object",
        properties: {
          pattern_name: { type: "string", description: "Pattern name to explain" }
        },
        required: ["pattern_name"]
      }
    }
  }
];

const systemPrompt = `You are ChartingPath Copilot, an AI trading research assistant specialized in chart pattern analysis.

Your capabilities:
- Search for active chart patterns across 8,500+ instruments using the search_patterns tool
- Provide historical win rates and performance statistics using get_pattern_stats
- Explain pattern psychology and trading approaches using explain_pattern

Core principles:
1. ALWAYS use tools to fetch real data - never make up pattern detections or statistics
2. Be concise but informative - traders value efficiency
3. Include actionable next steps after providing information
4. Remind users that all analysis is for educational purposes, not financial advice

When presenting pattern data:
- Format prices clearly with appropriate decimal places
- Show quality scores prominently (A=Excellent, B=Good, C=Fair)
- Include R:R ratios and direction

Format responses with:
📊 for statistics | 🎯 for trade setups | ⚠️ for warnings | 💡 for tips`;

// Tool execution functions
async function executeSearchPatterns(supabase: any, args: any) {
  let query = supabase
    .from('live_pattern_detections')
    .select('instrument, pattern_name, direction, timeframe, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, trend_alignment, current_price, change_percent, first_detected_at')
    .eq('status', 'active')
    .order('first_detected_at', { ascending: false })
    .limit(args.limit || 5);

  if (args.symbol) {
    query = query.ilike('instrument', `%${args.symbol}%`);
  }
  if (args.pattern_type) {
    query = query.ilike('pattern_name', `%${args.pattern_type}%`);
  }
  if (args.timeframe) {
    query = query.eq('timeframe', args.timeframe);
  }
  if (args.direction && args.direction !== 'any') {
    query = query.eq('direction', args.direction);
  }
  if (args.min_quality) {
    const qualityOrder = ['A', 'B', 'C'];
    const minIndex = qualityOrder.indexOf(args.min_quality);
    if (minIndex >= 0) {
      query = query.in('quality_score', qualityOrder.slice(0, minIndex + 1));
    }
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Pattern search error:', error);
    return { error: 'Failed to search patterns', patterns: [] };
  }

  return {
    count: data?.length || 0,
    patterns: data?.map((p: any) => ({
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
      detectedAt: p.first_detected_at
    })) || []
  };
}

async function executeGetPatternStats(supabase: any, args: any) {
  let query = supabase
    .from('outcome_analytics_cache')
    .select('*');

  if (args.pattern_name) {
    query = query.ilike('pattern_name', `%${args.pattern_name}%`);
  }
  if (args.symbol) {
    query = query.eq('instrument', args.symbol);
  }
  if (args.timeframe) {
    query = query.eq('timeframe', args.timeframe);
  }

  const { data, error } = await query.limit(10);

  if (error || !data?.length) {
    // Fallback to pattern_hit_rates
    const { data: hitRates } = await supabase
      .from('pattern_hit_rates')
      .select('*')
      .ilike('pattern_name', `%${args.pattern_name}%`)
      .limit(5);

    if (hitRates?.length) {
      return {
        stats: hitRates.map((h: any) => ({
          pattern: h.pattern_name,
          timeframe: h.timeframe,
          winRate: h.win_rate,
          totalSignals: h.total_signals,
          avgRMultiple: h.avg_r_multiple
        }))
      };
    }
    
    return { message: 'No statistics found for this pattern. Try a more common pattern name.' };
  }

  return {
    stats: data.map((s: any) => ({
      pattern: s.pattern_name,
      timeframe: s.timeframe,
      instrument: s.instrument,
      winRate: s.win_rate,
      totalSignals: s.total_signals,
      wins: s.wins,
      losses: s.losses,
      avgPnlPercent: s.avg_pnl_percent,
      avgRMultiple: s.avg_r_multiple
    }))
  };
}

function executeExplainPattern(args: any) {
  const patterns: Record<string, any> = {
    'bull flag': {
      name: 'Bull Flag',
      type: 'Continuation',
      direction: 'Bullish',
      description: 'A sharp price rise (pole) followed by a consolidation period with parallel downward-sloping support and resistance lines (flag).',
      psychology: 'Represents profit-taking after a strong move up, before buyers regain control.',
      entry: 'Enter on breakout above the upper flag boundary with volume confirmation.',
      stopLoss: 'Place stop below the flag low.',
      target: 'Measure the pole height and project from breakout point.'
    },
    'head and shoulders': {
      name: 'Head and Shoulders',
      type: 'Reversal',
      direction: 'Bearish (after uptrend)',
      description: 'Three peaks with the middle peak (head) higher than the two shoulders, connected by a neckline.',
      psychology: 'Shows weakening buying pressure and increasing selling interest.',
      entry: 'Enter short on neckline break with volume confirmation.',
      stopLoss: 'Place stop above the right shoulder.',
      target: 'Measure head-to-neckline distance and project from breakout.'
    },
    'double bottom': {
      name: 'Double Bottom',
      type: 'Reversal',
      direction: 'Bullish',
      description: 'Two roughly equal lows with a moderate peak between them, forming a "W" shape.',
      psychology: 'Shows strong support where buyers step in twice at the same level.',
      entry: 'Enter on break above the middle peak (neckline).',
      stopLoss: 'Place stop below the double bottom.',
      target: 'Measure bottom-to-neckline distance and project upward.'
    },
    'ascending triangle': {
      name: 'Ascending Triangle',
      type: 'Continuation (usually)',
      direction: 'Bullish',
      description: 'Flat resistance line with rising support line, showing higher lows.',
      psychology: 'Buyers becoming more aggressive, willing to pay higher prices.',
      entry: 'Enter on breakout above flat resistance.',
      stopLoss: 'Place stop below the ascending trendline.',
      target: 'Measure triangle height and project from breakout.'
    }
  };

  const key = args.pattern_name?.toLowerCase();
  const pattern = Object.entries(patterns).find(([k]) => key?.includes(k))?.[1];

  if (pattern) return pattern;
  
  return {
    message: `Pattern "${args.pattern_name}" explanation not found in database. Common patterns include: Bull Flag, Head and Shoulders, Double Bottom/Top, Ascending/Descending Triangle, Cup and Handle, Wedge patterns.`
  };
}

async function executeTool(toolName: string, args: any, supabase: any) {
  console.log(`[trading-copilot] Executing tool: ${toolName}`, args);
  
  switch (toolName) {
    case 'search_patterns':
      return await executeSearchPatterns(supabase, args);
    case 'get_pattern_stats':
      return await executeGetPatternStats(supabase, args);
    case 'explain_pattern':
      return executeExplainPattern(args);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First request - may return tool calls
    const aiMessages = [{ role: "system", content: systemPrompt }, ...messages];
    
    console.log("[trading-copilot] Sending initial request");
    
    let response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        tools: tools,
        tool_choice: "auto",
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Parse response - handle both JSON and SSE formats
    const responseText = await response.text();
    let assistantMessage: any = null;
    
    // Try to parse as JSON first
    try {
      const result = JSON.parse(responseText);
      assistantMessage = result.choices?.[0]?.message;
    } catch {
      // Parse SSE format
      const lines = responseText.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices?.[0]?.delta?.tool_calls || data.choices?.[0]?.message?.tool_calls) {
              assistantMessage = data.choices[0].delta || data.choices[0].message;
              // Merge tool_calls from delta
              if (data.choices[0].delta?.tool_calls) {
                assistantMessage = {
                  role: "assistant",
                  content: null,
                  tool_calls: data.choices[0].delta.tool_calls
                };
              }
              break;
            }
          } catch { /* skip unparseable lines */ }
        }
      }
    }
    
    console.log("[trading-copilot] Parsed assistant message:", JSON.stringify(assistantMessage));
    
    // Check for tool calls and execute them
    if (assistantMessage?.tool_calls?.length) {
      console.log("[trading-copilot] Tool calls detected:", assistantMessage.tool_calls.length);
      
      // Execute all tools
      const toolResults = await Promise.all(
        assistantMessage.tool_calls.map(async (tc: any) => {
          const args = JSON.parse(tc.function.arguments || "{}");
          const result = await executeTool(tc.function.name, args, supabase);
          return {
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result)
          };
        })
      );

      // Send follow-up request with tool results
      const followUpMessages = [
        ...aiMessages,
        assistantMessage,
        ...toolResults
      ];

      console.log("[trading-copilot] Sending follow-up with tool results");
      
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: followUpMessages,
          stream: true,
        }),
      });

      if (!response.ok) throw new Error(`Follow-up AI error: ${response.status}`);

      return new Response(response.body, {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache"
        },
      });
    }

    // No tool calls - return direct response as SSE stream
    const content = assistantMessage?.content || "I couldn't process that request.";
    const sseData = `data: {"choices":[{"delta":{"content":${JSON.stringify(content)}}}]}\n\ndata: [DONE]\n\n`;
    
    return new Response(sseData, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache"
      },
    });

  } catch (error) {
    console.error("[trading-copilot] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
