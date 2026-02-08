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
  },
  {
    type: "function",
    function: {
      name: "generate_pine_script",
      description: "Generate a TradingView Pine Script strategy for a specific chart pattern. Use this when user asks for Pine Script, TradingView strategy, or automated trading script.",
      parameters: {
        type: "object",
        properties: {
          pattern_name: { type: "string", description: "Pattern name like 'Bull Flag', 'Ascending Triangle', 'Head and Shoulders'." },
          symbol: { type: "string", description: "Trading instrument symbol like BTCUSD, AAPL, EURUSD." },
          timeframe: { type: "string", description: "Chart timeframe like '1H', '4H', 'D', 'W'." },
          risk_reward: { type: "number", description: "Target risk-reward ratio. Default 2." },
          include_alerts: { type: "boolean", description: "Include TradingView alert conditions. Default true." }
        },
        required: ["pattern_name", "symbol"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "find_article",
      description: "Search the learning center for strategy guides, pattern tutorials, and trading education articles. Use when users ask about trading strategies, how to trade patterns, or want educational content.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query - pattern name, strategy type, or topic like 'trend following', 'reversal strategies', 'risk management'" },
          category: { type: "string", description: "Article category filter: 'Chart Patterns', 'Trend Following', 'Technical Indicators', 'Risk Management', 'Options', 'Algorithmic'" },
          limit: { type: "number", description: "Maximum results. Default 5." }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_to_watchlist",
      description: "Add an instrument symbol to the user's watchlist for pattern monitoring. Use when users want to track or monitor a specific stock, crypto, or forex pair.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Instrument symbol to add, e.g. AAPL, BTCUSD, EURUSD" }
        },
        required: ["symbol"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_market_breadth",
      description: "Get current market breadth data including advance/decline ratios and market sentiment. Use when users ask about overall market health, market internals, or broad market conditions.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_chart_context",
      description: "Analyze chart context that was captured from the user's chart. Use this when the user's message contains embedded chart analysis data (indicators, price levels, patterns). Summarize and provide trading insights based on the context.",
      parameters: {
        type: "object",
        properties: {
          context_summary: { type: "string", description: "Brief summary of what the user is asking about the chart context" }
        },
        required: []
      }
    }
  }
];

// Use relative URLs so links work in preview and production
const getBaseUrl = () => {
  // Will be resolved by the frontend
  return "";
};

const systemPrompt = `You are ChartingPath Copilot—a friendly, expert trading research assistant.

## Your Capabilities
- **search_patterns**: Find active patterns across 8,500+ instruments. Can filter by symbol, pattern type, timeframe, direction, and quality.
- **get_pattern_stats**: Get historical win rates and performance data for specific patterns.
- **explain_pattern**: Teach users about pattern psychology and trading approaches.
- **generate_pine_script**: Create TradingView Pine Script strategies.
- **find_article**: Search 120+ strategy guides and educational articles in the Learning Center.
- **add_to_watchlist**: Add symbols to the user's watchlist for pattern monitoring.
- **get_market_breadth**: Get current market internals (advance/decline ratio, sentiment).
- **analyze_chart_context**: When users send chart context with technical indicators and price data, analyze it and provide trading scenarios.

## Your Personality
- Be warm, helpful, and conversational—not robotic
- Anticipate what traders actually need
- If one search returns empty, try broader searches (different timeframes, lower quality threshold) before giving up
- Always provide value even if exact matches aren't found
- Ask follow-up questions to better understand what the user needs

## Chart Context Analysis
When users share chart context (from the "Analyze Chart" feature), their message will contain embedded technical data including:
- Price trend, support/resistance levels
- Indicators: RSI, MACD, Bollinger Bands, ATR, ADX
- Volume analysis
- Active patterns detected
- Pre-calculated trading scenarios

**Your job is to:**
1. Interpret the technical setup in plain language
2. Identify the highest-probability trading scenarios
3. Highlight key risks and what could invalidate the setup
4. Suggest specific entry, stop-loss, and take-profit levels with reasoning
5. Recommend position sizing based on volatility (ATR)

## Smart Search Strategy
When users ask for patterns:
1. First search with their exact criteria
2. If no results, broaden the search (e.g., B-quality instead of A-only, or multiple timeframes)
3. ALWAYS return something useful—even if it's "Here's what's close to what you asked for"
4. Never say "I couldn't complete that request" if tools returned data

## Response Guidelines
- Format prices with appropriate decimals
- Show quality scores: A=Excellent, B=Good, C=Fair
- Include R:R ratios and trade direction
- ALWAYS include clickable chart links using the ticker link format

**CRITICAL - Link Format:**
- For tickers/symbols: Use [SYMBOL](/study/SYMBOL) format, e.g. [AAPL](/study/AAPL), [BTCUSD](/study/BTCUSD)
- For pattern browsing: Link to [Active Patterns](/patterns/live)
- Never use external URLs like chartingpath.com - use relative paths only

**Pattern Format Example:**
### 🎯 [AAPL](/study/AAPL) - Bull Flag
- **Quality:** A | **Direction:** Bullish | **R:R:** 2.5:1
- **Entry:** $185.50 | **Stop:** $182.00 | **Target:** $194.25
- 📊 [View all AAPL patterns →](/study/AAPL)

## When No A-Quality Patterns Exist
Don't apologize! Instead say something like:
"No A-quality patterns are active right now, but here are the strongest B-quality setups forming..."

## Pine Script Output
When generate_pine_script returns, you MUST:
1. Include the FULL code in a \`\`\`pine code block
2. Add the setup instructions after

## Formatting Icons
📊 statistics | 🎯 trade setups | ⚠️ warnings | 💡 tips | 🔍 searching | 📈 bullish | 📉 bearish

⚠️ Always end with: "This is for educational purposes only—not financial advice."`;

// Tool execution functions
async function executeSearchPatterns(supabase: any, args: any) {
  let query = supabase
    .from('live_pattern_detections')
    .select('id, instrument, pattern_name, direction, timeframe, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, trend_alignment, current_price, change_percent, first_detected_at')
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
      id: p.id,
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
      // Use relative URL that works in-app: /study/:symbol
      studyUrl: `/study/${encodeURIComponent(p.instrument)}`,
      patternsListUrl: `/patterns/live`
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

function executeGeneratePineScript(args: any) {
  const patternName = args.pattern_name || "Pattern";
  const symbol = args.symbol || "BTCUSD";
  const timeframe = args.timeframe || "D";
  const rr = args.risk_reward || 2;
  const includeAlerts = args.include_alerts !== false;
  
  // Generate pattern-specific detection logic
  const patternKey = patternName.toLowerCase();
  
  let detectionLogic = "";
  let patternDescription = "";
  
  if (patternKey.includes("ascending triangle")) {
    patternDescription = "Ascending Triangle";
    detectionLogic = `// Ascending Triangle Detection
// Flat resistance with rising support (higher lows)
resistanceLevel = ta.highest(high, lookback)
isFlat = math.abs(resistanceLevel - resistanceLevel[5]) / resistanceLevel < 0.01
higherLows = low > low[5] and low[5] > low[10]
ascTriangle = isFlat and higherLows and close > ta.sma(close, 20)`;
  } else if (patternKey.includes("bull flag")) {
    patternDescription = "Bull Flag";
    detectionLogic = `// Bull Flag Detection
// Strong pole followed by consolidation
poleHigh = ta.highest(high, 5)[5]
poleLow = ta.lowest(low, 5)[5]
poleSize = (poleHigh - poleLow) / poleLow * 100
flagHigh = ta.highest(high, 5)
flagLow = ta.lowest(low, 5)
flagSize = (flagHigh - flagLow) / flagLow * 100
bullFlag = poleSize > 5 and flagSize < poleSize * 0.5 and close > ta.sma(close, 20)`;
  } else if (patternKey.includes("head and shoulders")) {
    patternDescription = "Head and Shoulders";
    detectionLogic = `// Head and Shoulders Detection (Bearish Reversal)
leftShoulder = ta.highest(high, 10)[20]
head = ta.highest(high, 10)[10]
rightShoulder = ta.highest(high, 10)
neckline = math.min(low[15], low[5])
headAndShoulders = head > leftShoulder and head > rightShoulder and 
     math.abs(leftShoulder - rightShoulder) / leftShoulder < 0.05 and close < neckline`;
  } else if (patternKey.includes("double bottom")) {
    patternDescription = "Double Bottom";
    detectionLogic = `// Double Bottom Detection (Bullish Reversal)
firstBottom = ta.lowest(low, 15)[15]
secondBottom = ta.lowest(low, 15)
neckline = ta.highest(high, 15)[7]
doubleBottom = math.abs(firstBottom - secondBottom) / firstBottom < 0.02 and close > neckline`;
  } else if (patternKey.includes("descending triangle")) {
    patternDescription = "Descending Triangle";
    detectionLogic = `// Descending Triangle Detection
supportLevel = ta.lowest(low, lookback)
isFlat = math.abs(supportLevel - supportLevel[5]) / supportLevel < 0.01
lowerHighs = high < high[5] and high[5] < high[10]
descTriangle = isFlat and lowerHighs and close < ta.sma(close, 20)`;
  } else {
    patternDescription = patternName;
    detectionLogic = `// Generic Pattern Detection
// Customize this logic for ${patternName}
momentum = ta.rsi(close, 14)
trend = ta.sma(close, 20)
patternDetected = close > trend and momentum > 50`;
  }

  const alertCode = includeAlerts ? `
// === ALERTS ===
alertcondition(longCondition, title="Long Entry", message="${patternDescription} Long on ${symbol}")
alertcondition(shortCondition, title="Short Entry", message="${patternDescription} Short on ${symbol}")
alertcondition(strategy.position_size[1] != 0 and strategy.position_size == 0, title="Position Closed", message="Position closed on ${symbol}")` : "";

  const script = `//@version=5
strategy("${patternDescription} Strategy - ${symbol}", overlay=true, default_qty_type=strategy.percent_of_equity, default_qty_value=2, initial_capital=10000)

// === INPUTS ===
lookback = input.int(20, "Lookback Period", minval=5)
atrPeriod = input.int(14, "ATR Period")
atrMultSL = input.float(1.5, "ATR Multiplier for Stop Loss", step=0.1)
atrMultTP = input.float(${rr * 1.5}, "ATR Multiplier for Take Profit", step=0.1)
riskReward = input.float(${rr}, "Risk:Reward Ratio", step=0.1)

// === INDICATORS ===
atr = ta.atr(atrPeriod)
ema20 = ta.ema(close, 20)
ema50 = ta.ema(close, 50)

${detectionLogic}

// === ENTRY CONDITIONS ===
trendUp = ema20 > ema50
trendDown = ema20 < ema50
longCondition = ${patternKey.includes("head and shoulders") ? "false" : (patternKey.includes("descending") ? "false" : `${patternKey.includes("ascending triangle") ? "ascTriangle" : patternKey.includes("bull flag") ? "bullFlag" : patternKey.includes("double bottom") ? "doubleBottom" : "patternDetected"} and trendUp`)}
shortCondition = ${patternKey.includes("double bottom") ? "false" : patternKey.includes("ascending") ? "false" : patternKey.includes("bull flag") ? "false" : patternKey.includes("head and shoulders") ? "headAndShoulders and trendDown" : patternKey.includes("descending") ? "descTriangle and trendDown" : "not patternDetected and trendDown"}

// === EXECUTE TRADES ===
if longCondition and strategy.position_size == 0
    stopLoss = close - (atr * atrMultSL)
    takeProfit = close + (atr * atrMultTP)
    strategy.entry("Long", strategy.long)
    strategy.exit("Long Exit", "Long", stop=stopLoss, limit=takeProfit)

if shortCondition and strategy.position_size == 0
    stopLoss = close + (atr * atrMultSL)
    takeProfit = close - (atr * atrMultTP)
    strategy.entry("Short", strategy.short)
    strategy.exit("Short Exit", "Short", stop=stopLoss, limit=takeProfit)

// === PLOTTING ===
plot(ema20, "EMA 20", color=color.blue)
plot(ema50, "EMA 50", color=color.orange)
plotshape(longCondition, "Long Signal", shape.triangleup, location.belowbar, color.green, size=size.small)
plotshape(shortCondition, "Short Signal", shape.triangledown, location.abovebar, color.red, size=size.small)
${alertCode}

// === PERFORMANCE TABLE ===
var table perfTable = table.new(position.top_right, 2, 4, bgcolor=color.new(color.black, 80))
if barstate.islast
    table.cell(perfTable, 0, 0, "Net Profit", text_color=color.white)
    table.cell(perfTable, 1, 0, str.tostring(strategy.netprofit, "#.##"), text_color=strategy.netprofit > 0 ? color.green : color.red)
    table.cell(perfTable, 0, 1, "Win Rate", text_color=color.white)
    table.cell(perfTable, 1, 1, str.tostring(strategy.wintrades / math.max(strategy.closedtrades, 1) * 100, "#.#") + "%", text_color=color.white)
    table.cell(perfTable, 0, 2, "Trades", text_color=color.white)
    table.cell(perfTable, 1, 2, str.tostring(strategy.closedtrades), text_color=color.white)
    table.cell(perfTable, 0, 3, "Profit Factor", text_color=color.white)
    table.cell(perfTable, 1, 3, str.tostring(strategy.grossprofit / math.max(strategy.grossloss, 1), "#.##"), text_color=color.white)`;

  return {
    pattern: patternDescription,
    symbol: symbol,
    timeframe: timeframe,
    riskReward: rr,
    script: script,
    instructions: [
      "1. Open TradingView and go to Pine Editor",
      "2. Create a new script and paste the code above",
      "3. Click 'Add to Chart' to apply the strategy",
      "4. Adjust inputs in the Settings panel as needed",
      "5. Use Strategy Tester to backtest on historical data",
      "⚠️ Always backtest thoroughly before using with real capital"
    ]
  };
}

// === NEW TOOLS ===

async function executeFindArticle(supabase: any, args: any) {
  const query = args.query?.toLowerCase() || '';
  const category = args.category;
  const limit = args.limit || 5;

  let dbQuery = supabase
    .from('learning_articles')
    .select('id, title, slug, category, subcategory, excerpt, tags, reading_time_minutes')
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(limit);

  // Category filter
  if (category) {
    dbQuery = dbQuery.ilike('category', `%${category}%`);
  }

  // Text search across title, tags, and excerpt
  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,tags.cs.{${query}}`);
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error('[trading-copilot] Article search error:', error);
    return { error: 'Failed to search articles', articles: [] };
  }

  if (!data?.length) {
    // Fallback: try broader search
    const { data: fallbackData } = await supabase
      .from('learning_articles')
      .select('id, title, slug, category, subcategory, excerpt, reading_time_minutes')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(5);

    return {
      message: `No exact matches for "${args.query}", but here are popular articles:`,
      articles: fallbackData?.map((a: any) => ({
        title: a.title,
        category: a.category,
        subcategory: a.subcategory,
        excerpt: a.excerpt,
        readingTime: a.reading_time_minutes,
        url: `/blog/${a.slug}`
      })) || []
    };
  }

  return {
    count: data.length,
    articles: data.map((a: any) => ({
      title: a.title,
      category: a.category,
      subcategory: a.subcategory,
      excerpt: a.excerpt,
      readingTime: a.reading_time_minutes,
      url: `/blog/${a.slug}`
    }))
  };
}

async function executeAddToWatchlist(supabase: any, args: any, userId: string | null) {
  const symbol = args.symbol?.toUpperCase();
  
  if (!symbol) {
    return { success: false, message: 'Please provide a symbol to add.' };
  }

  if (!userId) {
    return { 
      success: false, 
      message: `I can't add ${symbol} to your watchlist because you're not logged in. Please log in first, or you can manually add it from the Dashboard.`,
      suggestedAction: 'login'
    };
  }

  // Check if already in watchlist
  const { data: existing } = await supabase
    .from('user_watchlist')
    .select('id')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .single();

  if (existing) {
    return { 
      success: true, 
      alreadyExists: true,
      message: `${symbol} is already in your watchlist!`,
      symbol
    };
  }

  // Add to watchlist
  const { error } = await supabase
    .from('user_watchlist')
    .insert({ user_id: userId, symbol });

  if (error) {
    console.error('[trading-copilot] Watchlist insert error:', error);
    return { success: false, message: `Failed to add ${symbol} to watchlist. Please try again.` };
  }

  return { 
    success: true, 
    message: `✅ Added ${symbol} to your watchlist! You'll now see pattern alerts for this symbol.`,
    symbol,
    dashboardUrl: '/dashboard'
  };
}

async function executeGetMarketBreadth() {
  // Call the existing market breadth edge function
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/fetch-market-breadth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Market breadth fetch failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      advanceDecline: {
        advancing: data.advancing || 0,
        declining: data.declining || 0,
        ratio: data.adRatio || 0,
        netAdvances: data.netAdvances || 0
      },
      sentiment: data.sentiment || 'Neutral',
      marketStatus: data.marketStatus || 'unknown',
      description: data.sentiment === 'Bullish' 
        ? 'More stocks are advancing than declining, indicating positive market breadth.'
        : data.sentiment === 'Bearish'
        ? 'More stocks are declining than advancing, indicating negative market breadth.'
        : 'Market breadth is relatively balanced.',
      dashboardUrl: '/dashboard'
    };
  } catch (error) {
    console.error('[trading-copilot] Market breadth error:', error);
    return {
      error: 'Unable to fetch market breadth data at this time.',
      suggestion: 'You can view market breadth directly on the Dashboard.'
    };
  }
}

// ============================================
// RAG CONTEXT RETRIEVAL
// Fetches relevant ChartingPath data based on user query
// ============================================

interface RAGContext {
  relevantPatternStats: any[];
  activePatterns: any[];
  relevantArticles: any[];
  marketContext: string | null;
}

// Extract keywords for RAG retrieval
function extractQueryKeywords(messages: any[]): { symbols: string[], patterns: string[], topics: string[] } {
  const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || '';
  const text = lastUserMessage.toLowerCase();
  
  // Common pattern names
  const patternKeywords = [
    'bull flag', 'bear flag', 'head and shoulders', 'inverse head and shoulders',
    'double top', 'double bottom', 'triple top', 'triple bottom',
    'ascending triangle', 'descending triangle', 'symmetrical triangle',
    'cup and handle', 'wedge', 'falling wedge', 'rising wedge',
    'channel', 'rectangle', 'pennant', 'flag'
  ];
  
  // Common trading topics
  const topicKeywords = [
    'entry', 'exit', 'stop loss', 'take profit', 'risk', 'reward',
    'win rate', 'statistics', 'backtest', 'strategy', 'trend',
    'breakout', 'reversal', 'continuation', 'momentum', 'volume'
  ];
  
  // Extract symbols (uppercase 2-5 letter words or common crypto pairs)
  const symbolRegex = /\b([A-Z]{2,5}(?:USD|USDT|BTC|ETH)?)\b/g;
  const symbols = [...new Set((lastUserMessage.match(symbolRegex) || []))];
  
  // Extract patterns mentioned
  const patterns = patternKeywords.filter(p => text.includes(p));
  
  // Extract topics mentioned
  const topics = topicKeywords.filter(t => text.includes(t));
  
  return { symbols, patterns, topics };
}

// Fetch relevant context from ChartingPath database
async function fetchRAGContext(supabase: any, messages: any[]): Promise<RAGContext> {
  const keywords = extractQueryKeywords(messages);
  console.log('[RAG] Extracted keywords:', keywords);
  
  const context: RAGContext = {
    relevantPatternStats: [],
    activePatterns: [],
    relevantArticles: [],
    marketContext: null
  };
  
  try {
    // Parallel fetch for performance
    const fetchPromises: Promise<void>[] = [];
    
    // 1. Fetch relevant pattern statistics
    if (keywords.patterns.length > 0 || keywords.symbols.length > 0) {
      fetchPromises.push((async () => {
        let query = supabase
          .from('pattern_hit_rates')
          .select('pattern_name, timeframe, win_rate, total_signals, avg_r_multiple, expectancy, profit_factor, direction')
          .limit(10);
        
        if (keywords.patterns.length > 0) {
          // Search for any of the mentioned patterns
          const patternFilter = keywords.patterns.map(p => `pattern_name.ilike.%${p}%`).join(',');
          query = query.or(patternFilter);
        }
        
        const { data } = await query;
        if (data?.length) {
          context.relevantPatternStats = data;
          console.log(`[RAG] Found ${data.length} pattern stats`);
        }
      })());
    }
    
    // 2. Fetch active patterns for mentioned symbols
    if (keywords.symbols.length > 0) {
      fetchPromises.push((async () => {
        const { data } = await supabase
          .from('live_pattern_detections')
          .select('instrument, pattern_name, direction, quality_score, entry_price, risk_reward_ratio, timeframe')
          .eq('status', 'active')
          .in('instrument', keywords.symbols)
          .limit(5);
        
        if (data?.length) {
          context.activePatterns = data;
          console.log(`[RAG] Found ${data.length} active patterns for symbols`);
        }
      })());
    }
    
    // 3. Fetch relevant learning articles
    if (keywords.patterns.length > 0 || keywords.topics.length > 0) {
      fetchPromises.push((async () => {
        let query = supabase
          .from('learning_articles')
          .select('title, slug, excerpt, category')
          .eq('status', 'published')
          .limit(3);
        
        const searchTerms = [...keywords.patterns, ...keywords.topics.slice(0, 2)];
        if (searchTerms.length > 0) {
          const searchFilter = searchTerms.map(t => `title.ilike.%${t}%`).join(',');
          query = query.or(searchFilter);
        }
        
        const { data } = await query;
        if (data?.length) {
          context.relevantArticles = data;
          console.log(`[RAG] Found ${data.length} relevant articles`);
        }
      })());
    }
    
    // 4. Fetch recent market overview if asking about market conditions
    const text = messages.filter((m: any) => m.role === 'user').pop()?.content?.toLowerCase() || '';
    if (text.includes('market') || text.includes('today') || text.includes('overview')) {
      fetchPromises.push((async () => {
        const { data } = await supabase
          .from('historical_overview_tactical')
          .select('market_overview, market_drivers')
          .order('asof_date', { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          context.marketContext = `Market Overview: ${data.market_overview?.substring(0, 500) || ''}`;
          console.log('[RAG] Found market context');
        }
      })());
    }
    
    await Promise.all(fetchPromises);
    
  } catch (error) {
    console.error('[RAG] Error fetching context:', error);
    // Continue without RAG context on error
  }
  
  return context;
}

// Build enhanced system prompt with RAG context
function buildEnhancedSystemPrompt(basePrompt: string, ragContext: RAGContext): string {
  const contextSections: string[] = [];
  
  if (ragContext.relevantPatternStats.length > 0) {
    const statsText = ragContext.relevantPatternStats.map(s => 
      `• ${s.pattern_name} (${s.timeframe}): Win Rate ${(s.win_rate * 100).toFixed(1)}%, ` +
      `Expectancy ${s.expectancy?.toFixed(2) || 'N/A'}, Profit Factor ${s.profit_factor?.toFixed(2) || 'N/A'}, ` +
      `Sample: ${s.total_signals} trades`
    ).join('\n');
    
    contextSections.push(`## ChartingPath Pattern Statistics (Real Data)\n${statsText}`);
  }
  
  if (ragContext.activePatterns.length > 0) {
    const patternsText = ragContext.activePatterns.map(p => 
      `• ${p.instrument}: ${p.pattern_name} (${p.direction}, Quality: ${p.quality_score}, R:R ${p.risk_reward_ratio?.toFixed(1) || 'N/A'})`
    ).join('\n');
    
    contextSections.push(`## Active Patterns on Mentioned Symbols\n${patternsText}`);
  }
  
  if (ragContext.relevantArticles.length > 0) {
    const articlesText = ragContext.relevantArticles.map(a => 
      `• "${a.title}" (/learn/${a.slug}) - ${a.excerpt?.substring(0, 100) || a.category}...`
    ).join('\n');
    
    contextSections.push(`## Relevant ChartingPath Articles\nRecommend these to users:\n${articlesText}`);
  }
  
  if (ragContext.marketContext) {
    contextSections.push(`## Current Market Context\n${ragContext.marketContext}`);
  }
  
  if (contextSections.length === 0) {
    return basePrompt;
  }
  
  const ragSection = `
## IMPORTANT: ChartingPath Proprietary Data
Use this real data from our platform to inform your responses. Quote these statistics when relevant - they're based on actual verified trade outcomes.

${contextSections.join('\n\n')}

When answering, prioritize this proprietary data over generic knowledge. Cite specific win rates and statistics from above.
`;
  
  return basePrompt + '\n' + ragSection;
}

// ============================================
// TOOL EXECUTION
// ============================================

// Analyze chart context (when user sends chart data)
function executeAnalyzeChartContext(args: any, messages: any[]) {
  // The chart context is embedded in the user's message
  // Extract and summarize it for the AI to provide insights
  const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || '';
  
  // Parse embedded context if present
  const contextMatch = lastUserMessage.match(/\*\*Price Analysis:\*\*[\s\S]*?(?=Based on this analysis|$)/);
  
  if (contextMatch) {
    return {
      analyzed: true,
      message: "Chart context received. Providing analysis based on the technical data.",
      tip: "The AI will now interpret the indicators, identify trading scenarios, and highlight key risks."
    };
  }
  
  return {
    analyzed: false,
    message: "No embedded chart context found. Ask the user to use the 'Analyze Chart' button on their chart to capture context.",
    suggestion: "You can analyze any chart by clicking the Analyze button in the chart toolbar."
  };
}

async function executeTool(toolName: string, args: any, supabase: any, userId: string | null, messages?: any[]) {
  console.log(`[trading-copilot] Executing tool: ${toolName}`, args);
  
  switch (toolName) {
    case 'search_patterns':
      return await executeSearchPatterns(supabase, args);
    case 'get_pattern_stats':
      return await executeGetPatternStats(supabase, args);
    case 'explain_pattern':
      return executeExplainPattern(args);
    case 'generate_pine_script':
      return executeGeneratePineScript(args);
    case 'find_article':
      return await executeFindArticle(supabase, args);
    case 'add_to_watchlist':
      return await executeAddToWatchlist(supabase, args, userId);
    case 'get_market_breadth':
      return await executeGetMarketBreadth();
    case 'analyze_chart_context':
      return executeAnalyzeChartContext(args, messages || []);
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
    
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract user ID from auth header if available
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      } catch {
        // Auth failed, continue without user context
      }
    }

    // ============================================
    // RAG: Fetch relevant ChartingPath context
    // ============================================
    console.log('[trading-copilot] Fetching RAG context...');
    const ragContext = await fetchRAGContext(supabase, messages);
    const enhancedSystemPrompt = buildEnhancedSystemPrompt(systemPrompt, ragContext);
    console.log(`[trading-copilot] RAG context: ${ragContext.relevantPatternStats.length} stats, ${ragContext.activePatterns.length} patterns, ${ragContext.relevantArticles.length} articles`);

    // Tool-call loop (non-stream) to guarantee we return assistant content.
    // Proxy-streaming can surface tool_calls (with no content) to the client for some providers.
    let convo: any[] = [{ role: "system", content: enhancedSystemPrompt }, ...messages];

    // Increase to 5 rounds to allow broader searches when initial queries return empty
    const MAX_TOOL_ROUNDS = 5;

    for (let round = 1; round <= MAX_TOOL_ROUNDS; round++) {
      console.log(`[trading-copilot] AI round ${round}`);

      // Retry logic with exponential backoff for rate limits (5 attempts, longer delays)
      let aiResp: Response | null = null;
      let lastError: string = '';
      const MAX_RETRY_ATTEMPTS = 5;
      
      for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        aiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GEMINI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gemini-2.0-flash",
            messages: convo,
            tools,
            tool_choice: "auto",
            stream: false,
          }),
        });

        if (aiResp.status === 429 && attempt < MAX_RETRY_ATTEMPTS) {
          // Rate limited - wait with longer exponential backoff (3s, 6s, 12s, 24s)
          const waitTime = Math.pow(2, attempt) * 1500;
          console.log(`[trading-copilot] Rate limited, retrying in ${waitTime}ms (attempt ${attempt}/${MAX_RETRY_ATTEMPTS})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // Break on success or non-retryable error
        break;
      }

      if (!aiResp || !aiResp.ok) {
        if (aiResp?.status === 429) {
          console.error("[trading-copilot] Rate limit exceeded after retries");
          return new Response(JSON.stringify({ error: "AI service is busy. Please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResp?.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits depleted" }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await aiResp?.text().catch(() => "") || lastError;
        console.error("[trading-copilot] AI gateway error:", aiResp?.status, t);
        throw new Error(`AI gateway error: ${aiResp?.status || 'unknown'}`);
      }

      const responseText = await aiResp.text();
      let assistantMessage: any = null;

      // Try JSON first
      try {
        const result = JSON.parse(responseText);
        assistantMessage = result.choices?.[0]?.message;
      } catch {
        // Fallback: parse SSE-ish bodies if returned
        const lines = responseText.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            assistantMessage = data.choices?.[0]?.message ?? data.choices?.[0]?.delta;
            if (assistantMessage) break;
          } catch {
            // ignore
          }
        }
      }

      console.log("[trading-copilot] Assistant message:", JSON.stringify(assistantMessage));

      if (assistantMessage?.tool_calls?.length) {
        console.log("[trading-copilot] Tool calls detected:", assistantMessage.tool_calls.length);

        const toolResults = await Promise.all(
          assistantMessage.tool_calls.map(async (tc: any) => {
            let args: any = {};
            try {
              args = JSON.parse(tc.function.arguments || "{}");
            } catch {
              console.error("[trading-copilot] Failed to parse tool args:", tc.function.arguments);
              args = {};
            }

            const result = await executeTool(tc.function.name, args, supabase, userId);
            return {
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify(result),
            };
          })
        );

        convo = [...convo, assistantMessage, ...toolResults];
        continue;
      }

      const content = assistantMessage?.content || "I couldn't process that request.";
      const sseData = `data: {"choices":[{"delta":{"content":${JSON.stringify(content)}}}]}\n\ndata: [DONE]\n\n`;

      return new Response(sseData, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Provide a helpful fallback instead of a robotic error
    const fallback = `I searched our pattern database but didn't find results matching your exact criteria. Here's what you can try:

🔍 **Broaden your search:**
- Ask for "B-quality patterns" instead of A-only
- Try different timeframes (1h, 4h, daily, weekly)
- Search a specific sector: "Show crypto patterns" or "Find patterns on tech stocks"

💡 **Or ask me to:**
- Explain any chart pattern in detail
- Show win rate statistics for a pattern type
- Generate a Pine Script strategy

What would you like to explore?`;
    const sseData = `data: {"choices":[{"delta":{"content":${JSON.stringify(fallback)}}}]}\n\ndata: [DONE]\n\n`;

    return new Response(sseData, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
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
