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
          exchange: { type: "string", description: "Filter by exchange. Examples: NYSE, NASDAQ, HKEX, SGX, SET, CRYPTO, FOREX, COMEX, US_ETF." },
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
      description: "Get current market breadth data including advance/decline ratios, VIX (fear gauge), Put/Call ratio, and composite Fear & Greed sentiment estimate. Use when users ask about market sentiment, overall market health, fear and greed, market internals, or broad market conditions.",
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
  },
  {
    type: "function",
    function: {
      name: "query_edge_atlas",
      description: "Query the Edge Atlas rankings to find the best-performing pattern/timeframe combinations based on historical backtested data (320,000+ trades). Use this when users ask about annualized returns, best patterns, highest win rates, most profitable setups, edge rankings, or performance filtering across asset classes. Annualized returns are in percentage terms (assuming 1% risk per trade). Typical top values range 1%-15%. If 0 results return, AUTOMATICALLY retry with relaxed filters before telling the user nothing was found.",
      parameters: {
        type: "object",
        properties: {
          asset_type: { type: "string", enum: ["stocks", "crypto", "fx", "indices", "commodities"], description: "Asset class to filter. E.g. 'fx' for forex, 'stocks' for equities." },
          timeframe: { type: "string", enum: ["1h", "4h", "8h", "1d", "1wk"], description: "Timeframe filter." },
          pattern_name: { type: "string", description: "Pattern name filter (partial match). E.g. 'flag', 'triangle'." },
          direction: { type: "string", enum: ["long", "short"], description: "Trade direction filter." },
          min_trades: { type: "number", description: "Minimum sample size. Default 30." },
          min_win_rate: { type: "number", description: "Minimum win rate percentage. E.g. 55 for 55%." },
          min_annualized_pct: { type: "number", description: "Minimum estimated annualized return in %. Typical range: 1-15. Values above 50 are unrealistically high." },
          min_expectancy: { type: "number", description: "Minimum expectancy per trade in R. E.g. 0.3." },
          fx_segment: { type: "string", enum: ["majors", "crosses"], description: "For FX only: filter by majors or crosses." },
          sort_by: { type: "string", enum: ["annualized", "win_rate", "expectancy", "trades"], description: "Sort order. Default 'annualized'." },
          limit: { type: "number", description: "Max results. Default 10." }
        },
        required: []
      }
    }
  },
  // ===== ENHANCED INTELLIGENCE TOOLS =====
  {
    type: "function",
    function: {
      name: "get_instrument_stats",
      description: "Get instrument-specific pattern performance statistics from the materialized view. Shows how each pattern performs ON THIS SPECIFIC TICKER (not just overall averages). Use when users ask about a specific symbol's pattern history, e.g. 'How do bull flags perform on AAPL?'",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Instrument symbol like AAPL, BTCUSD, EURUSD." },
          pattern_name: { type: "string", description: "Optional pattern name filter." },
          min_trades: { type: "number", description: "Minimum sample size. Default 10." }
        },
        required: ["symbol"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "compare_pattern_performance",
      description: "Compare a pattern's performance on a specific instrument vs the overall market average. Shows whether the pattern works BETTER or WORSE on this ticker compared to all instruments. Use when users ask 'How does X compare?' or 'Is this pattern good for AAPL?'",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Instrument symbol to compare." },
          pattern_name: { type: "string", description: "Pattern name like 'Bull Flag'." },
          timeframe: { type: "string", enum: ["1h", "4h", "8h", "1d", "1wk"], description: "Timeframe. Default '1d'." }
        },
        required: ["symbol", "pattern_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_decision_confidence",
      description: "Calculate a composite Decision Confidence Score (0-100) for a potential trade setup. Combines pattern quality grade, trend alignment, historical hit rate, sample size, and current market conditions into a single actionable score. Use when users ask 'Should I take this trade?', 'How confident is this setup?', or 'Is this a good entry?'",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Instrument symbol." },
          pattern_name: { type: "string", description: "Pattern name detected." },
          timeframe: { type: "string", description: "Timeframe of the pattern." },
          quality_grade: { type: "string", enum: ["A", "B", "C"], description: "Quality grade of the detection." },
          direction: { type: "string", enum: ["long", "short"], description: "Trade direction." },
          trend_alignment: { type: "string", enum: ["with_trend", "counter_trend", "neutral"], description: "Whether the pattern aligns with the broader trend." }
        },
        required: ["symbol", "pattern_name"]
      }
    }
  },
  // ===== DATA INTEGRATION TOOLS =====
  {
    type: "function",
    function: {
      name: "get_economic_events",
      description: "Get upcoming and recent economic calendar events (GDP, CPI, NFP, interest rates, etc.). Use when users ask about economic data, macro events, news impact, or when assessing risk for a trade near major announcements.",
      parameters: {
        type: "object",
        properties: {
          region: { type: "string", description: "Filter by region/country: US, EU, GB, JP, CN, AU, CA, CH. Leave empty for all." },
          importance: { type: "string", enum: ["high", "medium", "low"], description: "Minimum impact level. Default 'high'." },
          days_ahead: { type: "number", description: "Number of days ahead to look. Default 3." },
          days_back: { type: "number", description: "Number of days back to include. Default 1." }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_market_report",
      description: "Get the latest AI-generated daily market report covering stocks, forex, crypto, and commodities. Use when users ask 'what happened in the market today', 'market summary', or 'daily recap'.",
      parameters: {
        type: "object",
        properties: {
          timezone: { type: "string", description: "User timezone like 'America/New_York'. Auto-detected if omitted." }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_price_data",
      description: "Get recent OHLC price data for any symbol. Use when users ask about current price, recent price action, percentage moves, or when you need actual price levels to support analysis. Supports stocks, forex, crypto, indices, and commodities.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Instrument symbol like AAPL, BTCUSD, EURUSD, ^GSPC, GC=F." },
          interval: { type: "string", enum: ["1h", "4h", "1d", "1wk"], description: "Bar interval. Default '1d'." },
          days: { type: "number", description: "Number of days of data. Default 30. Max 365." }
        },
        required: ["symbol"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_user_backtests",
      description: "Get the authenticated user's recent backtest results. Use when users ask about their backtests, strategy performance, or want to compare their results with Edge Atlas data. Requires login.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Filter by instrument symbol." },
          pattern: { type: "string", description: "Filter by strategy/pattern name." },
          limit: { type: "number", description: "Max results. Default 5." }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_user_alerts",
      description: "Get the authenticated user's pattern alerts. Use when users ask about their alerts, what they're monitoring, or want to review their active watchlist alerts. Requires login.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["active", "triggered", "all"], description: "Alert status filter. Default 'active'." },
          limit: { type: "number", description: "Max results. Default 10." }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_paper_portfolio",
      description: "Get the authenticated user's paper trading portfolio including balance, P&L, and recent trades. Use when users ask about their portfolio, paper trades, or want portfolio-aware recommendations. Requires login.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  // ===== AGENT SCORING ADJUSTMENT TOOLS =====
  {
    type: "function",
    function: {
      name: "get_agent_scoring_settings",
      description: "Get the authenticated user's current Agent Scoring settings including weights (Analyst, Risk, Timing, Portfolio), verdict cutoffs (TAKE/WATCH thresholds), asset class filter, timeframe filter, and sub-filters. Use when users ask about their current scoring settings or before making adjustments. Requires login.",
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
      name: "adjust_agent_scoring",
      description: "Adjust the user's Agent Scoring settings based on their natural language request. Can modify agent weights (Analyst 0-100, Risk 0-100, Timing 0-100, Portfolio 0-100 — they auto-normalize to sum=100), TAKE cutoff (0-100, higher = stricter), WATCH cutoff (0-100), asset class filter, timeframe filter, and sub-filters. Use when users say things like 'increase take rate', 'reduce risk', 'make scoring more aggressive', 'only show forex', etc. Requires login. IMPORTANT: Always call get_agent_scoring_settings first to see current values before adjusting.",
      parameters: {
        type: "object",
        properties: {
          preset_name: { type: "string", description: "Name for the new or updated preset. If omitted, updates the user's default preset." },
          analyst_weight: { type: "number", description: "New Analyst agent weight (0-100). Controls pattern quality analysis influence." },
          risk_weight: { type: "number", description: "New Risk agent weight (0-100). Controls ATR-based risk assessment influence." },
          timing_weight: { type: "number", description: "New Timing agent weight (0-100). Controls trend alignment and economic calendar influence." },
          portfolio_weight: { type: "number", description: "New Portfolio agent weight (0-100). Controls diversification analysis influence." },
          take_cutoff: { type: "number", description: "TAKE verdict threshold (0-100). Signals scoring >= this get TAKE. Higher = stricter/fewer TAKE signals." },
          watch_cutoff: { type: "number", description: "WATCH verdict threshold (0-100). Signals scoring >= this but < take_cutoff get WATCH. Must be < take_cutoff." },
          asset_class_filter: { type: "string", enum: ["all", "fx", "crypto", "stocks", "indices", "commodities"], description: "Filter scoring to specific asset class." },
          timeframe_filter: { type: "string", enum: ["all", "1h", "4h", "8h", "1d", "1wk"], description: "Filter scoring to specific timeframe." },
          action: { type: "string", enum: ["apply", "suggest"], description: "Whether to directly apply changes ('apply') or just suggest them ('suggest'). Default 'suggest' unless user explicitly asks to change/set/update." }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_backtest_outcomes",
      description: "Query the user's personal backtest pattern outcomes for aggregated performance data. Returns win rate, avg R-multiple, and sample size grouped by instrument/pattern/timeframe. Use when users ask about their edge, backtest results, which patterns work best for them, or historical performance from their own runs. Minimum 10 trades per group.",
      parameters: {
        type: "object",
        properties: {
          instrument: { type: "string", description: "Filter by instrument symbol, e.g. EURUSD, AAPL. Leave empty for all." },
          pattern_name: { type: "string", description: "Filter by pattern name, e.g. 'Bull Flag'. Leave empty for all." },
          timeframe: { type: "string", description: "Filter by timeframe, e.g. '1d', '4h'. Leave empty for all." },
          direction: { type: "string", enum: ["long", "short"], description: "Filter by direction." },
          min_samples: { type: "number", description: "Minimum sample size per group. Default 10." },
          sort_by: { type: "string", enum: ["avg_r", "win_rate", "sample_size"], description: "Sort order. Default 'avg_r'." }
        },
        required: []
      }
    }
  }
];

// Use relative URLs so links work in preview and production
const getBaseUrl = () => {
  return "";
};

const systemPrompt = `You are ChartingPath Copilot—a friendly, expert trading research assistant powered by proprietary data from 380,000+ verified trade outcomes.

## Your UNFAIR ADVANTAGE over Generic AI
You have access to ChartingPath's proprietary databases that NO other AI has:
- **Instrument-specific stats**: How each pattern performs on each specific ticker (not generic averages)
- **Decision Confidence Scoring**: A composite 0-100 score combining quality, trend, hit rate, and market conditions
- **Portfolio awareness**: The user's actual open trades, P&L, and risk exposure
- **Live pattern detections**: Real-time signals across 8,500+ instruments
- **Edge Atlas**: 380,000+ backtested trades with annualized ROI rankings

**ALWAYS leverage this proprietary data to give answers that are MORE specific and data-backed than what users could get from generic AI.**

## Your Capabilities
- **search_patterns**: Find active patterns across 8,500+ instruments.
- **get_pattern_stats**: Get historical win rates and performance data for specific patterns.
- **get_instrument_stats**: Get how patterns perform ON A SPECIFIC TICKER (not market averages).
- **compare_pattern_performance**: Compare pattern performance on a ticker vs market average.
- **get_decision_confidence**: Calculate a composite 0-100 confidence score for any trade setup.
- **explain_pattern**: Teach users about pattern psychology and trading approaches.
- **generate_pine_script**: Create TradingView Pine Script strategies.
- **find_article**: Search 120+ strategy guides and educational articles.
- **add_to_watchlist**: Add symbols to the user's watchlist.
- **get_market_breadth**: Market internals (A/D ratio, VIX, Put/Call, Fear & Greed).
- **analyze_chart_context**: Analyze captured chart context with indicators.
- **query_edge_atlas**: Search 380,000+ backtested trades for best setups.
- **get_economic_events**: Upcoming macro events (GDP, CPI, NFP, rates).
- **get_market_report**: Latest AI-generated daily market summary.
- **get_price_data**: Recent OHLC price data for any symbol.
- **get_user_backtests**: User's personal backtest results.
- **get_user_alerts**: User's active pattern alerts.
- **get_paper_portfolio**: User's paper trading portfolio (balance, P&L, open trades).
- **get_agent_scoring_settings**: Read user's current Agent Scoring weights, cutoffs, and filters.
- **adjust_agent_scoring**: Modify Agent Scoring settings (weights, cutoffs, filters) via natural language.

## ENHANCED Analysis Strategy — Always Combine Tools
When answering, PROACTIVELY combine multiple tools for insights NO generic AI can provide:

**"Is AAPL a good buy?" / "Should I trade X?":**
→ Call get_instrument_stats(AAPL) + search_patterns(AAPL) + get_decision_confidence(AAPL, pattern, ...) + get_price_data(AAPL) + get_economic_events
→ Compare instrument-specific win rate vs market average. Calculate decision confidence. Reference user's portfolio exposure if logged in.

**"What does the market look like today?" / "Market overview":**
→ Call get_market_report + get_market_breadth + get_economic_events together

**"What is the current sentiment?" / "Fear and greed" / "Market breadth":**
→ Call get_market_breadth. ALWAYS start by stating the "dataAsOf" timestamp from the response so the user knows exactly when the data is from (e.g., "As of 2026-03-04 20:15 UTC, NYSE:" or "Based on the last trading session close on 2026-03-01, NYSE. Markets are currently closed for the weekend."). Present with 🟢🟡🔴 indicators and markdown tables.

**"What should I trade?" / "Best setups right now":**
→ Call search_patterns (min_quality B — "quality" means A and B only, never C or below) + query_edge_atlas (top setups) + get_economic_events + get_market_breadth
→ Results are automatically sorted from highest quality to lowest. If user is authenticated, cross-reference with their portfolio to avoid over-concentration.

**"How does this pattern perform on X?" / "Compare performance":**
→ Call compare_pattern_performance + get_instrument_stats to show ticker-specific vs market-wide stats.

**"Should I take this trade?" / "How confident is this setup?":**
→ Call get_decision_confidence to compute the composite score. Present the score breakdown.

**"Show my portfolio" / "How's my portfolio doing?":**
→ Call get_paper_portfolio + search_patterns (for symbols in portfolio) + get_economic_events
→ Warn about correlated positions or macro risk to open trades.

**"Increase my take rate" / "Make scoring less strict" / "Reduce risk weight" / "Only show forex":**
→ ALWAYS call get_agent_scoring_settings FIRST to see current values.
→ Then call adjust_agent_scoring with the appropriate changes.
→ For "increase take rate by 5% without increasing risk": Lower the take_cutoff by ~3-5 points (more signals qualify as TAKE) while keeping risk_weight the same or increasing it.
→ For "make it more aggressive": Lower take_cutoff and watch_cutoff.
→ For "be more conservative": Raise take_cutoff and increase risk_weight.
→ For "only show forex/crypto/stocks": Set asset_class_filter accordingly.
→ Default to 'suggest' mode — only 'apply' when the user explicitly says "change", "set", "update", or "apply".
→ Present changes as a clear before/after comparison table.

**When user is authenticated**, PROACTIVELY:
1. Reference their open trades when discussing related symbols
2. Warn about over-concentration (multiple positions in same direction/sector)
3. Factor portfolio P&L into risk recommendations

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

**CRITICAL — Pattern Results MUST Use Markdown Tables:**
When presenting multiple pattern results, ALWAYS format them as a markdown table for rich rendering. The UI renders tables with color-coded metrics, direction badges, and clickable links automatically.

**Pattern Table Format (REQUIRED for 2+ patterns):**

| Symbol | Pattern | Quality | Direction | R:R | Entry | Stop | Target |
|--------|---------|---------|-----------|-----|-------|------|--------|
| [AAPL](/study/AAPL) | [Bull Flag](/patterns/live?pattern=bull-flag) | A | Long | 2.5:1 | $185.50 | $182.00 | $194.25 |
| [MSFT](/study/MSFT) | [Ascending Triangle](/patterns/live?pattern=ascending-triangle) | B | Long | 2.0:1 | $425.50 | $422.00 | $434.25 |

For a single pattern, you may use this inline format:
### 🎯 [AAPL](/study/AAPL) - Bull Flag
- **Quality:** A | **Direction:** Bullish | **R:R:** 2.5:1
- **Entry:** $185.50 | **Stop:** $182.00 | **Target:** $194.25

## Quality Definition
"Quality patterns" = A and B grades ONLY (higher than C). When users ask for "quality patterns", "best setups", or "top signals", ALWAYS use min_quality=B.
Present results sorted from highest quality (A) to lowest. Show as many as available — don't limit artificially.

## When No A/B-Quality Patterns Exist
Don't apologize! Instead say something like:
"No high-quality (A/B) patterns are active right now, but here are the strongest setups forming..."
If the fallbackApplied flag is true in pattern results, acknowledge it naturally and present the C-grade alternatives.

## Pine Script Generation
When users ask for **alerts** specifically:
- Generate an **indicator** with alertcondition() calls, NOT a strategy
- When users ask for a **strategy** or **backtest**, generate a strategy
- ALWAYS include the full code — never truncate

## Education & Beginner Questions
When users ask "Where should I start?" or "Which pattern to learn first?":
- Recommend **Bull Flag** as the #1 beginner pattern (simple structure, clear rules)
- Follow up with **Double Bottom** and **Head and Shoulders** 
- Explain WHY each is good for beginners (visual clarity, clear entry/stop/target rules)
- Link to relevant articles using find_article
- Always include: stop loss placement, take profit calculation (measured move), and the inverse variant if applicable

## Quality Grades Explained
When users ask about quality grades (A/B/C):
- **A (High Confluence)**: Pattern + trend alignment + volume confirmation + multi-timeframe support. Rare (~5% of detections)
- **B (Standard Detection)**: Pattern confirmed with trend alignment. Most common high-quality signal (~25%)
- **C (Early Detection)**: Pattern identified but lacking full confluence. Good for watchlist building (~70%)
- Explain that B and C grades have statistically similar performance, and sample size matters more than grade

## Market Close / "How did the market end?"
When users ask about market close or end-of-day performance:
→ Call get_market_report + get_market_breadth together to provide a synthesis
→ Include key index moves, breadth data, and notable sector shifts

## Exotic / Illiquid Instruments (USDARS, USDTRY, etc.)
When analyzing exotic FX pairs or illiquid instruments:
- Warn about wide spreads and potential gaps
- Note that standard technical stop-losses may be unreliable
- Mention that some pairs may have controlled/managed exchange rates
- Suggest wider stops or reduced position sizing

## Response Completeness (CRITICAL)
- NEVER cut off mid-sentence. If approaching length limits, wrap up with a concise summary.
- For multi-scenario analyses, use bullet points instead of long paragraphs to fit more content.
- If listing items (top 10, etc.), always complete the full list. Use compact table format to save space.
- Avoid duplicate entries in pattern lists — deduplicate by symbol+pattern.

## Formatting Icons
📊 statistics | 🎯 trade setups | ⚠️ warnings | 💡 tips | 🔍 searching | 📈 bullish | 📉 bearish | 📅 economic events | 📰 market report | 💼 portfolio

## Edge Atlas Results Format

**CRITICAL — Units Consistency:**
- **Per-trade expectancy** → always display with R suffix (e.g., "0.45R") — this is risk-units gained per trade
- **Annualized return** → always display with % suffix (e.g., "15.2%") — this is estimated annual return assuming 1% risk per trade
- NEVER show annualized return as R. It MUST be %.
- The annualizedReturn field from query_edge_atlas is already in % terms (assuming 1% risk/trade).
- Top FX patterns typically yield 1-5% annualized; stocks may reach 5-15%
- When users ask for "30% return", that IS a reasonable % target — use it directly as min_annualized_pct
- NEVER pass values above 50 as min_annualized_pct — those are unrealistically high

**Auto-Fallback Strategy for Edge Atlas Queries:**
1. First query with user's exact intent
2. If 0 results: AUTOMATICALLY retry without min_annualized_pct and min_win_rate filters
3. If still 0: Remove timeframe filter too
4. ALWAYS show whatever data exists — never tell the user "nothing found" multiple times
5. Explain what the data means in practical terms (e.g., "At 1% risk per trade, this pattern yields ~3.7% annually")

When query_edge_atlas returns data, present results in a markdown table with actionable links:

| # | Pattern | TF | Dir | Win Rate | Exp (R) | Ann. Return | Trades |
|---|---------|-----|-----|----------|---------|-------------|--------|
| 1 | [Bull Flag](/edge-atlas/bull-flag) | 1h | Long | 58.2% | 0.45R | 4.2% | 312 |

IMPORTANT: Pattern links MUST use the patternId (kebab-case) from the data, e.g. /edge-atlas/bull-flag, NOT the display name.

After the table:
- Summarize the key insight (e.g. "Falling Wedge on 8H delivers the highest annualized return in FX at 3.7%")
- Link to [Edge Atlas](/edge-atlas) for full exploration
- Link to [Live Setups](/patterns/live) to find currently active instances
- Mention sample size and statistical confidence

## Economic Events Format
When presenting economic events, use a table:

| Time (UTC) | Event | Country | Impact | Forecast | Previous | Actual |
|-----------|-------|---------|--------|----------|----------|--------|
| 14:30 | Non-Farm Payrolls | 🇺🇸 US | 🔴 High | 180K | 175K | — |

Highlight events that could impact the user's current or prospective trades.

⚠️ Always end with: "This is for educational purposes only—not financial advice."`;

// ============================================
// TOOL EXECUTION FUNCTIONS
// ============================================

async function executeSearchPatterns(supabase: any, args: any) {
  let query = supabase
    .from('live_pattern_detections')
    .select('id, instrument, pattern_name, direction, timeframe, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, trend_alignment, current_price, change_percent, first_detected_at, exchange')
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

  // Always sort by quality (A first, then B, then C) to show best patterns first
  // Note: We re-sort in JS after fetch since Supabase doesn't support custom enum ordering
  if (args.exchange) {
    query = query.eq('exchange', args.exchange.toUpperCase());
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Pattern search error:', error);
    return { error: 'Failed to search patterns', patterns: [] };
  }

  // Auto-fallback: if no results and quality filter was A or B, broaden progressively
  if ((!data || data.length === 0) && (args.min_quality === 'A' || args.min_quality === 'B')) {
    const fallbackGrades = args.min_quality === 'A' ? ['B'] : ['C'];
    const fallbackLabel = args.min_quality === 'A' ? 'B-quality' : 'C-quality';
    console.log(`[trading-copilot] No ${args.min_quality}-quality results, falling back to ${fallbackLabel}`);
    let fallbackQuery = supabase
      .from('live_pattern_detections')
      .select('id, instrument, pattern_name, direction, timeframe, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, trend_alignment, current_price, change_percent, first_detected_at')
      .eq('status', 'active')
      .in('quality_score', fallbackGrades)
      .order('first_detected_at', { ascending: false })
      .limit(args.limit || 10);

    if (args.symbol) fallbackQuery = fallbackQuery.ilike('instrument', `%${args.symbol}%`);
    if (args.pattern_type) fallbackQuery = fallbackQuery.ilike('pattern_name', `%${args.pattern_type}%`);
    if (args.timeframe) fallbackQuery = fallbackQuery.eq('timeframe', args.timeframe);
    if (args.direction && args.direction !== 'any') fallbackQuery = fallbackQuery.eq('direction', args.direction);

    const { data: fallbackData } = await fallbackQuery;
    
    return {
      count: fallbackData?.length || 0,
      fallbackApplied: true,
      fallbackReason: `No ${args.min_quality}-quality patterns found. Showing best available ${fallbackLabel} setups instead.`,
      patterns: formatPatterns(fallbackData)
    };
  }

  // Auto-fallback: if no results at all, try without symbol/timeframe filters
  if ((!data || data.length === 0) && (args.symbol || args.timeframe)) {
    console.log('[trading-copilot] No results with filters, trying broader search');
    let broadQuery = supabase
      .from('live_pattern_detections')
      .select('id, instrument, pattern_name, direction, timeframe, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, trend_alignment, current_price, change_percent, first_detected_at')
      .eq('status', 'active')
      .order('first_detected_at', { ascending: false })
      .limit(args.limit || 10);

    if (args.pattern_type) broadQuery = broadQuery.ilike('pattern_name', `%${args.pattern_type}%`);
    if (args.direction && args.direction !== 'any') broadQuery = broadQuery.eq('direction', args.direction);

    const { data: broadData } = await broadQuery;
    
    if (broadData?.length) {
      return {
        count: broadData.length,
        fallbackApplied: true,
        fallbackReason: `No patterns found for the exact criteria. Here are the best available setups across the market.`,
        patterns: formatPatterns(broadData)
      };
    }
  }

  // Sort by quality grade (A → B → C) then by detection time (newest first)
  const qualityRank: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2 };
  const sorted = (data || []).sort((a: any, b: any) => {
    const qA = qualityRank[a.quality_score] ?? 9;
    const qB = qualityRank[b.quality_score] ?? 9;
    if (qA !== qB) return qA - qB;
    return new Date(b.first_detected_at).getTime() - new Date(a.first_detected_at).getTime();
  });

  return {
    count: sorted.length,
    patterns: formatPatterns(sorted)
  };
}

function formatPatterns(data: any[]) {
  return (data || []).map((p: any) => ({
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
    studyUrl: `/study/${encodeURIComponent(p.instrument)}`,
    patternsListUrl: `/patterns/live`
  }));
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
  
  const patternKey = patternName.toLowerCase();
  
  let detectionLogic = "";
  let patternDescription = "";
  
  if (patternKey.includes("ascending triangle")) {
    patternDescription = "Ascending Triangle";
    detectionLogic = `// Ascending Triangle Detection
resistanceLevel = ta.highest(high, lookback)
isFlat = math.abs(resistanceLevel - resistanceLevel[5]) / resistanceLevel < 0.01
higherLows = low > low[5] and low[5] > low[10]
ascTriangle = isFlat and higherLows and close > ta.sma(close, 20)`;
  } else if (patternKey.includes("bull flag")) {
    patternDescription = "Bull Flag";
    detectionLogic = `// Bull Flag Detection
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
alertcondition(longCondition, title="${patternDescription} Long Entry", message="${patternDescription} Long on ${symbol}")
alertcondition(shortCondition, title="${patternDescription} Short Entry", message="${patternDescription} Short on ${symbol}")
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

  if (category) {
    dbQuery = dbQuery.ilike('category', `%${category}%`);
  }

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,tags.cs.{${query}}`);
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error('[trading-copilot] Article search error:', error);
    return { error: 'Failed to search articles', articles: [] };
  }

  if (!data?.length) {
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

    const result = await response.json();
    const breadth = result?.data || {};
    const meta = result?.meta || {};
    const sentiment = result?.sentiment || {};
    
    return {
      advanceDecline: {
        advancing: breadth.advances || 0,
        declining: breadth.declines || 0,
        unchanged: breadth.unchanged || 0,
        ratio: breadth.advanceDeclineRatio || 0,
        adLine: breadth.advanceDeclineLine || 0,
        exchange: breadth.exchange || 'NYSE'
      },
      sentimentIndicators: {
        vix: sentiment.vix,
        vixLevel: sentiment.vixLevel || 'unknown',
        putCallRatio: sentiment.putCallRatio,
        putCallSignal: sentiment.putCallSignal || 'unknown',
        fearGreedEstimate: sentiment.fearGreedEstimate || 'Unknown',
        fearGreedScore: sentiment.fearGreedScore ?? null,
      },
      breadthSentiment: meta.sentiment || 'unknown',
      advancePercent: meta.advancePercent || 0,
      declinePercent: meta.declinePercent || 0,
      timestamp: breadth.timestamp || new Date().toISOString(),
      dataAsOf: (() => {
        const ts = breadth.timestamp ? new Date(breadth.timestamp) : new Date();
        const exchange = breadth.exchange || 'NYSE';
        const dayOfWeek = ts.getUTCDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const formattedDate = ts.toISOString().split('T')[0];
        const formattedTime = ts.toISOString().split('T')[1]?.slice(0, 5) + ' UTC';
        if (isWeekend) {
          return `As of last trading session close (${formattedDate}), ${exchange}. Markets are currently closed for the weekend.`;
        }
        return `As of ${formattedDate} ${formattedTime}, ${exchange}.`;
      })(),
      description: meta.sentiment === 'bullish'
        ? 'More stocks are advancing than declining, indicating positive market breadth and broad-based buying.'
        : meta.sentiment === 'bearish'
        ? 'More stocks are declining than advancing, indicating negative market breadth and broad-based selling pressure.'
        : meta.sentiment === 'neutral-bullish'
        ? 'Slightly more stocks advancing than declining — mildly positive breadth.'
        : 'Market breadth is relatively balanced between advancers and decliners.',
      interpretation: `A/D Ratio of ${breadth.advanceDeclineRatio || 0}: ${
        (breadth.advanceDeclineRatio || 0) >= 2.0 ? 'Very strong buying pressure across the market.' :
        (breadth.advanceDeclineRatio || 0) >= 1.5 ? 'Healthy breadth — rally is broad-based.' :
        (breadth.advanceDeclineRatio || 0) >= 1.0 ? 'Breadth is neutral to slightly positive.' :
        (breadth.advanceDeclineRatio || 0) >= 0.67 ? 'Breadth is weakening — fewer stocks participating in any rally.' :
        'Broad-based selling — majority of stocks declining.'
      }`,
      vixInterpretation: sentiment.vix != null 
        ? `VIX at ${sentiment.vix}: ${
            sentiment.vix >= 30 ? 'Extreme fear — high volatility expected. Consider defensive positioning.' :
            sentiment.vix >= 20 ? 'Elevated fear — market participants are hedging. Increased caution warranted.' :
            sentiment.vix >= 15 ? 'Normal volatility — no extreme fear or complacency.' :
            'Low fear / complacency — markets calm, but watch for potential reversal.'
          }`
        : 'VIX data unavailable.',
      putCallInterpretation: sentiment.putCallRatio != null
        ? `Put/Call Ratio at ${sentiment.putCallRatio}: ${
            sentiment.putCallRatio >= 1.2 ? 'Heavy put buying — extreme bearish hedging. Contrarian bullish signal.' :
            sentiment.putCallRatio >= 0.9 ? 'Elevated put buying — market participants are cautious.' :
            sentiment.putCallRatio >= 0.7 ? 'Balanced options flow — no extreme positioning.' :
            'Low put buying — complacency or strong bullish conviction.'
          }`
        : 'Put/Call ratio data unavailable.',
      presentationHint: 'CRITICAL: Always start your market breadth response by stating the "dataAsOf" timestamp so users know exactly when this data is from. Then present in a structured format: 1) Market Breadth (A/D ratio with visual bar), 2) Sentiment Indicators (VIX + Put/Call), 3) Overall Fear & Greed assessment with the score. Use emoji indicators (🟢🟡🔴) for quick visual cues.'
    };
  } catch (error) {
    console.error('[trading-copilot] Market breadth error:', error);
    return {
      error: 'Unable to fetch market breadth data at this time.',
      suggestion: 'You can view market breadth directly on the Dashboard.'
    };
  }
}

function executeAnalyzeChartContext(args: any, messages: any[]) {
  const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || '';
  
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

// FX segment symbol lists
const FX_MAJORS = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'];
const FX_CROSSES = [
  'EURGBP', 'EURJPY', 'EURCHF', 'EURAUD', 'EURCAD', 'EURNZD',
  'GBPJPY', 'GBPCHF', 'GBPAUD', 'GBPCAD', 'GBPNZD',
  'AUDJPY', 'AUDCHF', 'AUDCAD', 'AUDNZD',
  'NZDJPY', 'NZDCHF', 'NZDCAD',
  'CADJPY', 'CADCHF', 'CHFJPY'
];

async function executeQueryEdgeAtlas(supabase: any, args: any) {
  console.log('[trading-copilot] Querying Edge Atlas with filters:', args);
  
  let fxSymbols: string[] | null = null;
  if (args.asset_type === 'fx' && args.fx_segment) {
    fxSymbols = args.fx_segment === 'majors' ? FX_MAJORS : FX_CROSSES;
  }

  const { data, error } = await supabase.rpc('get_edge_atlas_rankings_filtered', {
    p_asset_type: args.asset_type || null,
    p_timeframe: args.timeframe || null,
    p_pattern_name: args.pattern_name || null,
    p_direction: args.direction || null,
    p_min_trades: args.min_trades || 30,
    p_min_win_rate: args.min_win_rate || null,
    p_min_annualized_pct: args.min_annualized_pct || null,
    p_min_expectancy: args.min_expectancy || null,
    p_fx_symbols: fxSymbols,
    p_sort_by: args.sort_by || 'annualized',
    p_limit: args.limit || 10,
  });

  if (error) {
    console.error('[trading-copilot] Edge Atlas query error:', error);
    return { error: 'Failed to query Edge Atlas rankings', results: [] };
  }

  if (!data?.length) {
    return {
      message: 'No patterns matched your filters. Try relaxing criteria (lower min trades, remove timeframe filter, or broaden asset type).',
      results: [],
      filters_used: args
    };
  }

  return {
    count: data.length,
    results: data.map((r: any) => ({
      patternId: r.pattern_id,
      patternName: r.pattern_name,
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
      edgeAtlasUrl: `/edge-atlas/${encodeURIComponent(r.pattern_id)}`,
      liveSetupsUrl: `/patterns/live?pattern=${encodeURIComponent(r.pattern_name)}`
    })),
    filters_used: args
  };
}

// ===== ENHANCED INTELLIGENCE TOOL FUNCTIONS =====

async function executeGetInstrumentStats(supabase: any, args: any) {
  console.log('[trading-copilot] Fetching instrument stats for:', args.symbol);
  const minTrades = args.min_trades || 10;

  // Query the materialized view for this specific instrument
  let query = supabase
    .from('instrument_pattern_stats_mv')
    .select('*')
    .ilike('symbol', `%${args.symbol}%`)
    .gte('total_trades', minTrades)
    .order('total_trades', { ascending: false })
    .limit(20);

  if (args.pattern_name) {
    query = query.ilike('pattern_name', `%${args.pattern_name}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[trading-copilot] Instrument stats error:', error);
    // Fallback to historical_pattern_occurrences aggregation
    const { data: fallbackData } = await supabase
      .from('historical_pattern_occurrences')
      .select('pattern_name, timeframe, outcome, risk_reward_ratio, bars_to_outcome')
      .ilike('symbol', `%${args.symbol}%`)
      .in('outcome', ['hit_tp', 'hit_sl'])
      .limit(500);

    if (!fallbackData?.length) {
      return { error: `No historical data found for ${args.symbol}. Try a major instrument.`, stats: [] };
    }

    // Manual aggregation
    const grouped: Record<string, any> = {};
    for (const row of fallbackData) {
      const key = `${row.pattern_name}|${row.timeframe}`;
      if (!grouped[key]) {
        grouped[key] = { pattern: row.pattern_name, timeframe: row.timeframe, wins: 0, losses: 0, total: 0, rrSum: 0 };
      }
      grouped[key].total++;
      if (row.outcome === 'hit_tp') grouped[key].wins++;
      else grouped[key].losses++;
      grouped[key].rrSum += row.risk_reward_ratio || 2;
    }

    const stats = Object.values(grouped)
      .filter((g: any) => g.total >= minTrades)
      .map((g: any) => ({
        symbol: args.symbol,
        pattern: g.pattern,
        timeframe: g.timeframe,
        totalTrades: g.total,
        winRate: Math.round((g.wins / g.total) * 1000) / 10,
        avgRR: Math.round((g.rrSum / g.total) * 100) / 100,
        expectancy: Math.round(((g.wins / g.total) * (g.rrSum / g.total) - (g.losses / g.total)) * 1000) / 1000,
      }))
      .sort((a: any, b: any) => b.totalTrades - a.totalTrades);

    return { count: stats.length, stats, source: 'historical_aggregation' };
  }

  return {
    count: data?.length || 0,
    stats: (data || []).map((s: any) => ({
      symbol: s.symbol,
      pattern: s.pattern_name,
      timeframe: s.timeframe,
      totalTrades: s.total_trades,
      winRate: s.win_rate_pct,
      expectancy: s.expectancy_r,
      avgRR: s.avg_rr,
      avgBars: s.avg_bars,
    })),
    source: 'materialized_view',
    instrumentStatsUrl: `/patterns/${encodeURIComponent(args.symbol)}/statistics`
  };
}

async function executeComparePatternPerformance(supabase: any, args: any) {
  console.log('[trading-copilot] Comparing pattern performance:', args);
  const timeframe = args.timeframe || '1d';

  // Fetch instrument-specific stats
  const { data: instrumentData } = await supabase
    .from('historical_pattern_occurrences')
    .select('outcome, risk_reward_ratio, bars_to_outcome')
    .ilike('symbol', `%${args.symbol}%`)
    .ilike('pattern_name', `%${args.pattern_name}%`)
    .eq('timeframe', timeframe)
    .in('outcome', ['hit_tp', 'hit_sl']);

  // Fetch market-wide stats for same pattern+timeframe
  const { data: marketData } = await supabase
    .from('historical_pattern_occurrences')
    .select('outcome, risk_reward_ratio, bars_to_outcome')
    .ilike('pattern_name', `%${args.pattern_name}%`)
    .eq('timeframe', timeframe)
    .in('outcome', ['hit_tp', 'hit_sl']);

  const calcStats = (rows: any[]) => {
    if (!rows?.length) return null;
    const wins = rows.filter(r => r.outcome === 'hit_tp').length;
    const total = rows.length;
    const avgRR = rows.reduce((s, r) => s + (r.risk_reward_ratio || 2), 0) / total;
    const winRate = Math.round((wins / total) * 1000) / 10;
    const expectancy = Math.round(((wins / total) * avgRR - ((total - wins) / total)) * 1000) / 1000;
    const avgBars = Math.round(rows.reduce((s, r) => s + (r.bars_to_outcome || 0), 0) / total);
    return { totalTrades: total, winRate, expectancy, avgRR: Math.round(avgRR * 100) / 100, avgBars };
  };

  const instrumentStats = calcStats(instrumentData);
  const marketStats = calcStats(marketData);

  if (!instrumentStats && !marketStats) {
    return { error: `No data found for ${args.pattern_name} on ${args.symbol} (${timeframe}).` };
  }

  const comparison: any = {
    symbol: args.symbol,
    pattern: args.pattern_name,
    timeframe,
    instrumentSpecific: instrumentStats || { message: 'No instrument-specific data available' },
    marketAverage: marketStats || { message: 'No market average data available' },
  };

  if (instrumentStats && marketStats) {
    const winRateDiff = instrumentStats.winRate - marketStats.winRate;
    const expectancyDiff = instrumentStats.expectancy - marketStats.expectancy;
    comparison.verdict = {
      winRateDelta: Math.round(winRateDiff * 10) / 10,
      expectancyDelta: Math.round(expectancyDiff * 1000) / 1000,
      assessment: winRateDiff > 3 ? 'OUTPERFORMS' : winRateDiff < -3 ? 'UNDERPERFORMS' : 'IN LINE',
      summary: winRateDiff > 3
        ? `${args.pattern_name} performs ${Math.abs(winRateDiff).toFixed(1)}% BETTER on ${args.symbol} than the market average.`
        : winRateDiff < -3
        ? `${args.pattern_name} performs ${Math.abs(winRateDiff).toFixed(1)}% WORSE on ${args.symbol} than the market average.`
        : `${args.pattern_name} performs similarly on ${args.symbol} as the market average.`,
      sampleSizeWarning: instrumentStats.totalTrades < 30
        ? `⚠️ Low sample size (${instrumentStats.totalTrades} trades). Results may not be statistically reliable.`
        : null,
    };
  }

  return comparison;
}

async function executeGetDecisionConfidence(supabase: any, args: any) {
  console.log('[trading-copilot] Calculating decision confidence:', args);

  const scores: Record<string, { score: number, max: number, detail: string }> = {};

  // 1. Quality Grade Score (0-25)
  const qualityScores: Record<string, number> = { 'A': 25, 'B': 18, 'C': 10 };
  const qualityGrade = args.quality_grade || 'C';
  scores.patternQuality = {
    score: qualityScores[qualityGrade] || 10,
    max: 25,
    detail: `Quality ${qualityGrade}: ${qualityGrade === 'A' ? 'High confluence (trend+volume+MTF)' : qualityGrade === 'B' ? 'Standard detection with trend alignment' : 'Early detection, lacks full confluence'}`
  };

  // 2. Trend Alignment Score (0-20)
  const trendMap: Record<string, number> = { 'with_trend': 20, 'neutral': 10, 'counter_trend': 5 };
  const trend = args.trend_alignment || 'neutral';
  scores.trendAlignment = {
    score: trendMap[trend] || 10,
    max: 20,
    detail: `${trend === 'with_trend' ? 'Pattern aligns with broader trend ✅' : trend === 'counter_trend' ? 'Counter-trend setup — higher risk ⚠️' : 'No clear trend alignment'}`
  };

  // 3. Historical Hit Rate Score (0-30) — from actual data
  let hitRateScore = 15; // default if no data
  let hitRateDetail = 'No historical data available for this combination';
  try {
    const { data: hitData } = await supabase
      .from('historical_pattern_occurrences')
      .select('outcome')
      .ilike('symbol', `%${args.symbol}%`)
      .ilike('pattern_name', `%${args.pattern_name}%`)
      .in('outcome', ['hit_tp', 'hit_sl'])
      .limit(200);

    if (hitData?.length >= 10) {
      const wins = hitData.filter((r: any) => r.outcome === 'hit_tp').length;
      const winRate = wins / hitData.length;
      hitRateScore = Math.round(winRate * 30);
      hitRateDetail = `${args.symbol}-specific win rate: ${(winRate * 100).toFixed(1)}% (n=${hitData.length})`;
    } else {
      // Fallback to pattern-wide stats
      const { data: patternData } = await supabase
        .from('pattern_hit_rates')
        .select('win_rate, total_signals')
        .ilike('pattern_name', `%${args.pattern_name}%`)
        .limit(5);

      if (patternData?.length) {
        const avgWinRate = patternData.reduce((s: number, p: any) => s + (p.win_rate || 0), 0) / patternData.length;
        hitRateScore = Math.round(avgWinRate * 30);
        hitRateDetail = `Market-wide win rate: ${(avgWinRate * 100).toFixed(1)}% (instrument-specific data insufficient)`;
      }
    }
  } catch (e) {
    console.error('[trading-copilot] Hit rate lookup error:', e);
  }
  scores.historicalHitRate = { score: hitRateScore, max: 30, detail: hitRateDetail };

  // 4. Sample Size Confidence (0-15)
  let sampleScore = 5;
  let sampleDetail = 'Unknown sample size';
  try {
    const { count } = await supabase
      .from('historical_pattern_occurrences')
      .select('id', { count: 'exact', head: true })
      .ilike('symbol', `%${args.symbol}%`)
      .ilike('pattern_name', `%${args.pattern_name}%`)
      .in('outcome', ['hit_tp', 'hit_sl']);

    if (count !== null) {
      if (count >= 100) { sampleScore = 15; sampleDetail = `Very high confidence: ${count} historical trades`; }
      else if (count >= 50) { sampleScore = 12; sampleDetail = `High confidence: ${count} historical trades`; }
      else if (count >= 20) { sampleScore = 8; sampleDetail = `Medium confidence: ${count} trades (more data needed)`; }
      else if (count >= 10) { sampleScore = 5; sampleDetail = `Low confidence: only ${count} trades. Treat with caution.`; }
      else { sampleScore = 2; sampleDetail = `Very low confidence: ${count} trades. Insufficient data.`; }
    }
  } catch {}
  scores.sampleSize = { score: sampleScore, max: 15, detail: sampleDetail };

  // 5. Risk Environment (0-10)
  let riskScore = 5;
  let riskDetail = 'Standard risk environment';
  // Simple heuristic based on timeframe
  const tf = args.timeframe || '1d';
  if (tf === '1d' || tf === '1wk') { riskScore = 8; riskDetail = 'Higher timeframe = more reliable signals'; }
  else if (tf === '4h' || tf === '8h') { riskScore = 6; riskDetail = 'Medium timeframe — decent reliability'; }
  else { riskScore = 4; riskDetail = 'Lower timeframe — more noise, faster invalidation'; }
  scores.riskEnvironment = { score: riskScore, max: 10, detail: riskDetail };

  // Composite score
  const totalScore = Object.values(scores).reduce((s, v) => s + v.score, 0);
  const maxScore = Object.values(scores).reduce((s, v) => s + v.max, 0);
  const confidencePercent = Math.round((totalScore / maxScore) * 100);

  const rating = confidencePercent >= 75 ? '🟢 HIGH CONFIDENCE'
    : confidencePercent >= 50 ? '🟡 MODERATE CONFIDENCE'
    : '🔴 LOW CONFIDENCE';

  return {
    symbol: args.symbol,
    pattern: args.pattern_name,
    timeframe: tf,
    confidenceScore: confidencePercent,
    rating,
    breakdown: scores,
    recommendation: confidencePercent >= 75
      ? 'This setup shows strong confluence. Consider standard position sizing.'
      : confidencePercent >= 50
      ? 'Setup has moderate backing. Consider reduced position size or wait for additional confirmation.'
      : 'Setup lacks sufficient backing. Consider passing or using minimal size as a speculative trade.',
    disclaimer: 'This score is algorithmic and for educational purposes only — not financial advice.'
  };
}

// ===== ORIGINAL TOOL EXECUTION FUNCTIONS =====


async function executeGetEconomicEvents(supabase: any, args: any) {
  console.log('[trading-copilot] Fetching economic events:', args);

  const now = new Date();
  const daysBack = args.days_back ?? 1;
  const daysAhead = args.days_ahead ?? 3;

  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - daysBack);
  const toDate = new Date(now);
  toDate.setDate(toDate.getDate() + daysAhead);

  let query = supabase
    .from('economic_events')
    .select('id, event_name, country_code, region, impact_level, indicator_type, scheduled_time, forecast_value, previous_value, actual_value, released, market_impact')
    .gte('scheduled_time', fromDate.toISOString())
    .lte('scheduled_time', toDate.toISOString())
    .order('scheduled_time', { ascending: true })
    .limit(30);

  if (args.region) {
    query = query.ilike('country_code', args.region);
  }
  if (args.importance) {
    query = query.eq('impact_level', args.importance);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[trading-copilot] Economic events error:', error);
    return { error: 'Failed to fetch economic events', events: [] };
  }

  return {
    count: data?.length || 0,
    events: (data || []).map((e: any) => ({
      name: e.event_name,
      country: e.country_code,
      region: e.region,
      impact: e.impact_level,
      type: e.indicator_type,
      scheduledTime: e.scheduled_time,
      forecast: e.forecast_value,
      previous: e.previous_value,
      actual: e.actual_value,
      released: e.released,
      marketImpact: e.market_impact,
    })),
    calendarUrl: '/economic-calendar'
  };
}

async function executeGetMarketReport(supabase: any, args: any) {
  console.log('[trading-copilot] Fetching market report');

  const { data, error } = await supabase
    .from('cached_market_reports')
    .select('report, generated_at, markets, time_span, timezone')
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error('[trading-copilot] Market report error:', error);
    return {
      error: 'No market report available at this time.',
      suggestion: 'You can view the market report on the Dashboard.',
      dashboardUrl: '/dashboard'
    };
  }

  return {
    report: data.report,
    generatedAt: data.generated_at,
    markets: data.markets,
    timeSpan: data.time_span,
    timezone: data.timezone,
    dashboardUrl: '/dashboard'
  };
}

async function executeGetPriceData(args: any) {
  console.log('[trading-copilot] Fetching price data for:', args.symbol);

  const symbol = args.symbol;
  const interval = args.interval || '1d';
  const days = Math.min(args.days || 30, 365);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Try EODHD first, then Yahoo fallback
  let bars: any[] = [];

  try {
    const eodhResp = await fetch(`${supabaseUrl}/functions/v1/fetch-eodhd`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symbol,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        interval,
        includeOhlc: true,
      })
    });

    if (eodhResp.ok) {
      const eodhData = await eodhResp.json();
      if (eodhData?.bars?.length > 0) {
        bars = eodhData.bars;
        console.log(`[trading-copilot] EODHD returned ${bars.length} bars for ${symbol}`);
      }
    }
  } catch (e) {
    console.warn('[trading-copilot] EODHD price fetch failed:', e);
  }

  // Fallback to Yahoo
  if (bars.length === 0) {
    try {
      const yahooResp = await fetch(`${supabaseUrl}/functions/v1/fetch-yahoo-finance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          interval,
          includeOhlc: true,
        })
      });

      if (yahooResp.ok) {
        const yahooData = await yahooResp.json();
        if (yahooData?.bars?.length > 0) {
          bars = yahooData.bars;
          console.log(`[trading-copilot] Yahoo returned ${bars.length} bars for ${symbol}`);
        }
      }
    } catch (e) {
      console.warn('[trading-copilot] Yahoo price fetch failed:', e);
    }
  }

  if (bars.length === 0) {
    return { error: `No price data available for ${symbol}.`, bars: [] };
  }

  // Compute summary stats
  const latest = bars[bars.length - 1];
  const first = bars[0];
  const high = Math.max(...bars.map((b: any) => b.h));
  const low = Math.min(...bars.map((b: any) => b.l));
  const changePercent = ((latest.c - first.o) / first.o * 100);

  return {
    symbol,
    interval,
    barCount: bars.length,
    latestBar: {
      date: latest.t,
      open: latest.o,
      high: latest.h,
      low: latest.l,
      close: latest.c,
      volume: latest.v,
    },
    periodSummary: {
      periodHigh: high,
      periodLow: low,
      changePercent: Math.round(changePercent * 100) / 100,
      startPrice: first.o,
      endPrice: latest.c,
    },
    // Include last 10 bars for detailed analysis
    recentBars: bars.slice(-10).map((b: any) => ({
      date: b.t?.split('T')[0] || b.t,
      o: b.o,
      h: b.h,
      l: b.l,
      c: b.c,
      v: b.v,
    })),
    studyUrl: `/study/${encodeURIComponent(symbol)}`
  };
}

async function executeGetUserBacktests(supabase: any, args: any, userId: string | null) {
  if (!userId) {
    return {
      error: 'You need to be logged in to view your backtests.',
      suggestion: 'Log in to access your personal backtest results.',
      backtests: []
    };
  }

  console.log('[trading-copilot] Fetching user backtests for:', userId);

  let query = supabase
    .from('backtest_runs')
    .select('id, strategy_name, instrument, timeframe, from_date, to_date, total_trades, win_rate, net_pnl, max_drawdown, sharpe_ratio, profit_factor, expectancy, avg_rr, status, created_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(args.limit || 5);

  if (args.symbol) {
    query = query.ilike('instrument', `%${args.symbol}%`);
  }
  if (args.pattern) {
    query = query.ilike('strategy_name', `%${args.pattern}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[trading-copilot] User backtests error:', error);
    return { error: 'Failed to fetch backtests', backtests: [] };
  }

  return {
    count: data?.length || 0,
    backtests: (data || []).map((bt: any) => ({
      id: bt.id,
      strategy: bt.strategy_name,
      instrument: bt.instrument,
      timeframe: bt.timeframe,
      period: `${bt.from_date} to ${bt.to_date}`,
      totalTrades: bt.total_trades,
      winRate: bt.win_rate,
      netPnl: bt.net_pnl,
      maxDrawdown: bt.max_drawdown,
      sharpeRatio: bt.sharpe_ratio,
      profitFactor: bt.profit_factor,
      expectancy: bt.expectancy,
      avgRR: bt.avg_rr,
      createdAt: bt.created_at,
    })),
    backtestUrl: '/pattern-lab'
  };
}

async function executeGetUserAlerts(supabase: any, args: any, userId: string | null) {
  if (!userId) {
    return {
      error: 'You need to be logged in to view your alerts.',
      suggestion: 'Log in to access your pattern alerts.',
      alerts: []
    };
  }

  console.log('[trading-copilot] Fetching user alerts for:', userId);

  let query = supabase
    .from('alerts')
    .select('id, symbol, pattern, timeframe, status, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(args.limit || 10);

  if (args.status && args.status !== 'all') {
    query = query.eq('status', args.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[trading-copilot] User alerts error:', error);
    return { error: 'Failed to fetch alerts', alerts: [] };
  }

  // Also get recent triggered alerts from alerts_log
  const { data: recentTriggers } = await supabase
    .from('alerts_log')
    .select('alert_id, triggered_at, entry_price, pattern_data')
    .in('alert_id', (data || []).map((a: any) => a.id))
    .order('triggered_at', { ascending: false })
    .limit(5);

  return {
    count: data?.length || 0,
    alerts: (data || []).map((a: any) => {
      const trigger = recentTriggers?.find((t: any) => t.alert_id === a.id);
      return {
        id: a.id,
        symbol: a.symbol,
        pattern: a.pattern,
        timeframe: a.timeframe,
        status: a.status,
        createdAt: a.created_at,
        lastTriggered: trigger?.triggered_at || null,
        entryPrice: trigger?.entry_price || null,
        studyUrl: `/study/${encodeURIComponent(a.symbol)}`,
      };
    }),
    alertsUrl: '/dashboard'
  };
}

async function executeGetPaperPortfolio(supabase: any, userId: string | null) {
  if (!userId) {
    return {
      error: 'You need to be logged in to view your portfolio.',
      suggestion: 'Log in to access your paper trading portfolio.',
    };
  }

  console.log('[trading-copilot] Fetching paper portfolio for:', userId);

  // Get portfolio summary
  const { data: portfolio, error: portfolioError } = await supabase
    .from('paper_portfolios')
    .select('initial_balance, current_balance, total_pnl, updated_at')
    .eq('user_id', userId)
    .single();

  // Get recent trades
  const { data: trades, error: tradesError } = await supabase
    .from('paper_trades')
    .select('id, symbol, direction, entry_price, exit_price, quantity, pnl, status, pattern_name, timeframe, opened_at, closed_at')
    .eq('user_id', userId)
    .order('opened_at', { ascending: false })
    .limit(10);

  if (portfolioError && tradesError) {
    return {
      error: 'No paper portfolio found. Start paper trading to see your portfolio here.',
      portfolioUrl: '/paper-trading'
    };
  }

  const openTrades = (trades || []).filter((t: any) => t.status === 'open');
  const closedTrades = (trades || []).filter((t: any) => t.status === 'closed');

  return {
    portfolio: portfolio ? {
      initialBalance: portfolio.initial_balance,
      currentBalance: portfolio.current_balance,
      totalPnl: portfolio.total_pnl,
      returnPercent: portfolio.initial_balance > 0
        ? Math.round(((portfolio.current_balance - portfolio.initial_balance) / portfolio.initial_balance) * 10000) / 100
        : 0,
      lastUpdated: portfolio.updated_at,
    } : null,
    openTrades: openTrades.map((t: any) => ({
      symbol: t.symbol,
      direction: t.direction,
      entryPrice: t.entry_price,
      quantity: t.quantity,
      pattern: t.pattern_name,
      timeframe: t.timeframe,
      openedAt: t.opened_at,
      studyUrl: `/study/${encodeURIComponent(t.symbol)}`,
    })),
    recentClosedTrades: closedTrades.slice(0, 5).map((t: any) => ({
      symbol: t.symbol,
      direction: t.direction,
      entryPrice: t.entry_price,
      exitPrice: t.exit_price,
      pnl: t.pnl,
      pattern: t.pattern_name,
      closedAt: t.closed_at,
    })),
    portfolioUrl: '/paper-trading'
  };
}

// ============================================
// AGENT SCORING SETTINGS TOOLS
// ============================================

async function executeGetAgentScoringSettings(supabase: any, userId: string | null) {
  if (!userId) {
    return {
      error: 'You need to be logged in to view your Agent Scoring settings.',
      suggestion: 'Log in first, then I can read and adjust your scoring preferences.',
      settingsUrl: '/tools/agent-scoring'
    };
  }

  const { data, error } = await supabase
    .from('agent_scoring_settings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[trading-copilot] Agent scoring settings error:', error);
    return { error: 'Failed to fetch settings' };
  }

  if (!data?.length) {
    return {
      message: 'No saved Agent Scoring presets found. Using defaults.',
      defaults: {
        weights: { analyst: 30, risk: 25, timing: 20, portfolio: 25 },
        takeCutoff: 70,
        watchCutoff: 50,
        assetClassFilter: 'all',
        timeframeFilter: 'all',
        subFilters: {}
      },
      settingsUrl: '/tools/agent-scoring'
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
    settingsUrl: '/tools/agent-scoring'
  };
}

async function executeAdjustAgentScoring(supabase: any, args: any, userId: string | null) {
  if (!userId) {
    return {
      error: 'You need to be logged in to adjust Agent Scoring settings.',
      suggestion: 'Log in first, then I can modify your scoring preferences.',
      settingsUrl: '/tools/agent-scoring'
    };
  }

  const action = args.action || 'suggest';

  // Get current settings
  const { data: existing } = await supabase
    .from('agent_scoring_settings')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
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
  const newAssetClass = args.asset_class_filter ?? current?.asset_class_filter ?? 'all';
  const newTimeframe = args.timeframe_filter ?? current?.timeframe_filter ?? 'all';

  // Validation
  if (newWatch >= newTake) {
    return {
      error: `WATCH cutoff (${newWatch}) must be lower than TAKE cutoff (${newTake}). Adjust the values.`,
      currentSettings: { weights: currentWeights, takeCutoff: currentTake, watchCutoff: currentWatch }
    };
  }

  const changes: string[] = [];
  if (args.analyst_weight != null || args.risk_weight != null || args.timing_weight != null || args.portfolio_weight != null) {
    changes.push(`Weights: Analyst ${currentWeights.analyst}→${newWeights.analyst}, Risk ${currentWeights.risk}→${newWeights.risk}, Timing ${currentWeights.timing}→${newWeights.timing}, Portfolio ${currentWeights.portfolio}→${newWeights.portfolio}`);
  }
  if (args.take_cutoff != null) changes.push(`TAKE cutoff: ${currentTake}→${newTake}`);
  if (args.watch_cutoff != null) changes.push(`WATCH cutoff: ${currentWatch}→${newWatch}`);
  if (args.asset_class_filter) changes.push(`Asset class: ${current?.asset_class_filter || 'all'}→${newAssetClass}`);
  if (args.timeframe_filter) changes.push(`Timeframe: ${current?.timeframe_filter || 'all'}→${newTimeframe}`);

  if (action === 'suggest') {
    return {
      mode: 'suggestion',
      message: 'Here are the recommended changes. Ask me to "apply" them if you agree.',
      changes,
      proposed: {
        weights: newWeights,
        takeCutoff: newTake,
        watchCutoff: newWatch,
        assetClassFilter: newAssetClass,
        timeframeFilter: newTimeframe,
      },
      current: {
        weights: currentWeights,
        takeCutoff: currentTake,
        watchCutoff: currentWatch,
        assetClassFilter: current?.asset_class_filter || 'all',
        timeframeFilter: current?.timeframe_filter || 'all',
      },
      settingsUrl: '/tools/agent-scoring'
    };
  }

  // Apply the changes
  const presetName = args.preset_name || current?.name || 'Copilot Adjusted';
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
    const { error } = await supabase
      .from('agent_scoring_settings')
      .update(row)
      .eq('id', current.id);
    if (error) {
      console.error('[trading-copilot] Update scoring settings error:', error);
      return { error: 'Failed to update settings. Please try via the Agent Scoring page.' };
    }
    resultId = current.id;
  } else {
    const { data: inserted, error } = await supabase
      .from('agent_scoring_settings')
      .insert({ ...row, user_id: userId })
      .select('id')
      .single();
    if (error) {
      console.error('[trading-copilot] Insert scoring settings error:', error);
      return { error: 'Failed to save settings. Please try via the Agent Scoring page.' };
    }
    resultId = inserted.id;
  }

  return {
    mode: 'applied',
    message: `Settings updated successfully! Preset: "${presetName}"`,
    changes,
    applied: {
      id: resultId,
      name: presetName,
      weights: newWeights,
      takeCutoff: newTake,
      watchCutoff: newWatch,
      assetClassFilter: newAssetClass,
      timeframeFilter: newTimeframe,
    },
    settingsUrl: '/tools/agent-scoring',
    tip: 'Open Agent Scoring to see the updated results. You may need to refresh the page.'
  };
}

// ============================================
// DYNAMIC PROMPT PATCHING — Self-Improvement Layer
// ============================================

async function fetchLearnedRules(supabase: any): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('copilot_learned_rules')
      .select('id, rule_type, trigger_pattern, rule_content')
      .eq('is_active', true)
      .order('confidence', { ascending: false })
      .limit(20);

    if (error || !data?.length) return '';

    const ids = data.map((r: any) => r.id);
    try { supabase.rpc('increment_learned_rule_usage', { rule_ids: ids }); } catch {}

    const rulesByType: Record<string, string[]> = {};
    for (const rule of data) {
      if (!rulesByType[rule.rule_type]) rulesByType[rule.rule_type] = [];
      rulesByType[rule.rule_type].push(`• [${rule.trigger_pattern}] ${rule.rule_content}`);
    }

    const sections = Object.entries(rulesByType).map(([type, rules]) => 
      `### ${type.toUpperCase()} RULES\n${rules.join('\n')}`
    );

    return `\n\n## LEARNED RULES (Auto-Generated from Feedback Loop)\nThese rules were extracted from past interactions. Follow them precisely.\n\n${sections.join('\n\n')}`;
  } catch (err) {
    console.error('[LearnedRules] Failed to fetch:', err);
    return '';
  }
}

// ============================================
// CONTEXT LAYER 1: Temporal Awareness
// ============================================

function computeTemporalContext(): string {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcDay = now.getUTCDay();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const isWeekend = utcDay === 0 || utcDay === 6;

  // Market session status
  const sessions: string[] = [];
  
  // US Markets (NYSE/NASDAQ): Mon-Fri 14:30-21:00 UTC
  const usOpen = utcDay >= 1 && utcDay <= 5 && utcHour >= 14 && utcHour < 21;
  sessions.push(`US (NYSE/NASDAQ): ${usOpen ? '🟢 OPEN' : '🔴 CLOSED'}`);
  
  // EU Markets: Mon-Fri 08:00-16:30 UTC
  const euOpen = utcDay >= 1 && utcDay <= 5 && utcHour >= 8 && utcHour < 17;
  sessions.push(`Europe (LSE/Euronext): ${euOpen ? '🟢 OPEN' : '🔴 CLOSED'}`);
  
  // APAC Markets: Mon-Fri 00:00-08:00 UTC
  const apacOpen = utcDay >= 1 && utcDay <= 5 && utcHour >= 0 && utcHour < 8;
  sessions.push(`Asia-Pacific: ${apacOpen ? '🟢 OPEN' : '🔴 CLOSED'}`);
  
  sessions.push(`Crypto: 🟢 24/7`);

  // Calculate last/next trading day
  let lastTradingDay = new Date(now);
  if (utcDay === 0) lastTradingDay.setUTCDate(lastTradingDay.getUTCDate() - 2);
  else if (utcDay === 6) lastTradingDay.setUTCDate(lastTradingDay.getUTCDate() - 1);
  else if (utcDay === 1) lastTradingDay.setUTCDate(lastTradingDay.getUTCDate() - 3);
  else lastTradingDay.setUTCDate(lastTradingDay.getUTCDate() - 1);

  let nextTradingDay = new Date(now);
  if (utcDay === 5) nextTradingDay.setUTCDate(nextTradingDay.getUTCDate() + 3);
  else if (utcDay === 6) nextTradingDay.setUTCDate(nextTradingDay.getUTCDate() + 2);
  else if (utcDay === 0) nextTradingDay.setUTCDate(nextTradingDay.getUTCDate() + 1);
  else nextTradingDay.setUTCDate(nextTradingDay.getUTCDate() + 1);

  return `## Temporal Context
Current time: ${now.toISOString()} (${dayNames[utcDay]})
${isWeekend ? '⚠️ WEEKEND — Traditional markets are closed. Use Friday\'s data for "how did the market end" questions.' : ''}
Market Sessions:
${sessions.map(s => `  • ${s}`).join('\n')}
Last trading session: ${lastTradingDay.toISOString().split('T')[0]}
Next trading session: ${nextTradingDay.toISOString().split('T')[0]}

**Temporal Rules:**
- "How did the market end?" → Use the latest market report (which reflects the most recent trading session)
- Price queries when markets are closed → Show last close price and note the market is currently closed
- Weekend pattern searches → Show patterns detected on Friday, note they may have evolved by Monday open`;
}

// ============================================
// CONTEXT LAYER 2: Platform Knowledge Snapshot
// ============================================

async function fetchPlatformContext(supabase: any): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('copilot_platform_context')
      .select('context_data, computed_at')
      .eq('context_type', 'platform_snapshot')
      .maybeSingle();

    if (error || !data) {
      console.log('[PlatformContext] No snapshot available');
      return '';
    }

    const snapshot = data.context_data;
    const computedAt = new Date(data.computed_at);
    const hoursAgo = Math.round((Date.now() - computedAt.getTime()) / (1000 * 60 * 60));

    const assetBreakdown = Object.entries(snapshot.active_patterns?.by_asset || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    return `## Platform Data Awareness (snapshot ${hoursAgo}h ago)
Active live patterns: ${snapshot.active_patterns?.total || 0} (${assetBreakdown || 'none'})
Historical database: ${(snapshot.historical_data?.total_pattern_occurrences || 0).toLocaleString()} pattern occurrences across ${(snapshot.historical_data?.total_instruments || 0).toLocaleString()} instruments
Last pattern scan: ${snapshot.data_freshness?.last_pattern_scan ? new Date(snapshot.data_freshness.last_pattern_scan).toISOString() : 'unknown'}
Last market report: ${snapshot.data_freshness?.last_market_report ? new Date(snapshot.data_freshness.last_market_report).toISOString() : 'unknown'}
${snapshot.top_queried_symbols?.length > 0 ? `Trending symbols (user queries): ${snapshot.top_queried_symbols.map((s: any) => s.symbol).join(', ')}` : ''}

**Data Awareness Rules:**
- If a user asks about an instrument, our database likely has data for it (${(snapshot.historical_data?.total_instruments || 0).toLocaleString()} instruments covered)
- If search returns empty, try broader filters before saying "no data"
- Reference the total historical sample size when discussing statistical confidence`;
  } catch (err) {
    console.error('[PlatformContext] Failed to fetch:', err);
    return '';
  }
}

// ============================================
// CONTEXT LAYER 3: User Behavioral + Portfolio Context
// ============================================

async function fetchUserBehavior(supabase: any, userId: string | null): Promise<string> {
  if (!userId) return '';

  try {
    // Fetch behavior, watchlist, and portfolio in parallel
    const [feedbackResult, watchlistResult, portfolioResult, alertsResult] = await Promise.all([
      supabase
        .from('copilot_feedback')
        .select('question, topics, intent_category')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('user_watchlist')
        .select('symbol')
        .eq('user_id', userId)
        .limit(20),
      supabase
        .from('paper_portfolios')
        .select('initial_balance, current_balance, total_pnl')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('paper_trades')
        .select('symbol, trade_type, entry_price, quantity, status, stop_loss, take_profit')
        .eq('user_id', userId)
        .eq('status', 'open')
        .limit(10),
    ]);

    const sections: string[] = [];

    // Behavioral patterns
    const data = feedbackResult.data;
    if (data?.length) {
      const symbolFreq: Record<string, number> = {};
      const intentFreq: Record<string, number> = {};

      for (const row of data) {
        if (Array.isArray(row.topics)) {
          for (const topic of row.topics) {
            const upper = String(topic).toUpperCase();
            if (/^[A-Z]{2,6}(USD|USDT|BTC|ETH)?$/.test(upper)) {
              symbolFreq[upper] = (symbolFreq[upper] || 0) + 1;
            }
          }
        }
        if (row.intent_category) {
          intentFreq[row.intent_category] = (intentFreq[row.intent_category] || 0) + 1;
        }
      }

      const topSymbols = Object.entries(symbolFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s]) => s);
      const topIntents = Object.entries(intentFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([i]) => i);

      if (topSymbols.length > 0 || topIntents.length > 0) {
        sections.push(`**Preferred instruments:** ${topSymbols.join(', ') || 'N/A'}`);
        sections.push(`**Common query types:** ${topIntents.join(', ') || 'N/A'}`);
      }
    }

    // Watchlist context
    const watchlist = watchlistResult.data;
    if (watchlist?.length) {
      const symbols = watchlist.map((w: any) => w.symbol);
      sections.push(`**Watchlist (${symbols.length} symbols):** ${symbols.join(', ')}`);

      // Pre-fetch active patterns on watchlist symbols
      const { data: watchlistPatterns } = await supabase
        .from('live_pattern_detections')
        .select('instrument, pattern_name, direction, quality_score, risk_reward_ratio, timeframe')
        .eq('status', 'active')
        .in('instrument', symbols)
        .limit(10);

      if (watchlistPatterns?.length) {
        const patternsText = watchlistPatterns.map((p: any) =>
          `  • ${p.instrument}: ${p.pattern_name} (${p.direction}, ${p.quality_score}, R:R ${p.risk_reward_ratio?.toFixed(1) || '?'})`
        ).join('\n');
        sections.push(`**Active patterns on watchlist:**\n${patternsText}`);
      }
    }

    // Portfolio context
    const portfolio = portfolioResult.data;
    const openTrades = alertsResult.data;
    if (portfolio || openTrades?.length) {
      if (portfolio) {
        const returnPct = portfolio.initial_balance > 0
          ? ((portfolio.current_balance - portfolio.initial_balance) / portfolio.initial_balance * 100).toFixed(1)
          : '0';
        sections.push(`**Paper Portfolio:** $${portfolio.current_balance?.toFixed(0) || 0} (${Number(returnPct) >= 0 ? '+' : ''}${returnPct}% P&L)`);
      }
      if (openTrades?.length) {
        const tradesText = openTrades.map((t: any) =>
          `  • ${t.symbol} ${t.trade_type} @ $${t.entry_price} (SL: $${t.stop_loss || '?'}, TP: $${t.take_profit || '?'})`
        ).join('\n');
        sections.push(`**Open positions (${openTrades.length}):**\n${tradesText}`);

        // Detect concentration risk
        const symbolCounts: Record<string, number> = {};
        const directionCounts = { long: 0, short: 0 };
        for (const t of openTrades) {
          symbolCounts[t.symbol] = (symbolCounts[t.symbol] || 0) + 1;
          if (t.trade_type === 'long') directionCounts.long++;
          else directionCounts.short++;
        }
        const duplicates = Object.entries(symbolCounts).filter(([, c]) => c > 1);
        if (duplicates.length > 0) {
          sections.push(`⚠️ **Concentration risk:** Multiple positions on ${duplicates.map(([s, c]) => `${s}(${c}x)`).join(', ')}`);
        }
        if (directionCounts.long >= 3 && directionCounts.short === 0) {
          sections.push(`⚠️ **Directional risk:** All ${directionCounts.long} positions are LONG. No hedging.`);
        }
      }
    }

    if (sections.length === 0) return '';

    return `## User Context (Personalization & Portfolio Awareness)
${sections.join('\n')}

**Portfolio-Aware Rules:**
- When discussing a symbol the user holds, ALWAYS mention their existing exposure
- Warn about adding to concentrated positions
- Factor open P&L into risk recommendations (if deep in loss, suggest caution; if profitable, discuss trailing stops)
- When recommending new trades, prioritize symbols NOT already in portfolio for diversification`;
  } catch (err) {
    console.error('[UserBehavior] Failed to fetch:', err);
    return '';
  }
}

// ============================================
// CONTEXT LAYER 4: Per-Page DB Context
// ============================================

async function fetchPageDbContext(
  supabase: any,
  userId: string | null,
  pageType: string | null,
  liveContext: string | null
): Promise<string> {
  if (!pageType || pageType === 'other') return '';

  try {
    const sections: string[] = [];

    switch (pageType) {
      case 'edge-atlas': {
        // Top patterns by annualized return for quick reference
        const { data } = await supabase.rpc('get_edge_atlas_rankings_filtered', {
          p_min_trades: 50,
          p_sort_by: 'annualized',
          p_limit: 5,
        });
        if (data?.length) {
          const rows = data.map((r: any) =>
            `  • ${r.pattern_name} (${r.timeframe}, ${r.direction}) — Win: ${r.win_rate_pct}%, Exp: ${r.expectancy_r}R, Ann: ${r.est_annualized_pct}%, n=${r.total_trades}`
          ).join('\n');
          sections.push(`**Top Edge Atlas Rankings (live):**\n${rows}`);
        }
        sections.push('The user is exploring pattern performance rankings. Help them understand which patterns have the best historical edge and why. Offer to drill into specific asset classes, timeframes, or patterns.');
        break;
      }

      case 'screener': {
        // Active pattern count and breakdown
        const { data: patterns } = await supabase
          .from('live_pattern_detections')
          .select('quality_score, direction, asset_type')
          .eq('status', 'active');
        if (patterns?.length) {
          const total = patterns.length;
          const aCount = patterns.filter((p: any) => p.quality_score === 'A').length;
          const bCount = patterns.filter((p: any) => p.quality_score === 'B').length;
          const bullish = patterns.filter((p: any) => p.direction === 'bullish').length;
          sections.push(`**Live Screener Snapshot:** ${total} active patterns (${aCount} A-grade, ${bCount} B-grade, ${bullish} bullish / ${total - bullish} bearish)`);
        }
        sections.push('Help the user filter and find the best setups. Suggest filters based on their trading plan if available.');
        break;
      }

      case 'paper-trading': {
        if (!userId) break;
        const [portfolioRes, tradesRes] = await Promise.all([
          supabase.from('paper_portfolios')
            .select('initial_balance, current_balance, total_pnl')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase.from('paper_trades')
            .select('symbol, trade_type, entry_price, pnl, status, r_multiple')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10),
        ]);
        if (portfolioRes.data) {
          const p = portfolioRes.data;
          sections.push(`**Portfolio:** $${p.current_balance?.toFixed(0)} (P&L: $${p.total_pnl?.toFixed(0)})`);
        }
        const open = tradesRes.data?.filter((t: any) => t.status === 'open') || [];
        const closed = tradesRes.data?.filter((t: any) => t.status === 'closed') || [];
        if (open.length) sections.push(`**Open trades:** ${open.map((t: any) => `${t.symbol} ${t.trade_type}`).join(', ')}`);
        if (closed.length) {
          const totalR = closed.reduce((sum: number, t: any) => sum + (t.r_multiple || 0), 0);
          sections.push(`**Recent closed (${closed.length}):** Net ${totalR >= 0 ? '+' : ''}${totalR.toFixed(1)}R`);
        }
        sections.push('The user is managing paper trades. Help with position sizing, trade management, and performance review.');
        break;
      }

      case 'alerts': {
        if (!userId) break;
        const { data: alerts } = await supabase
          .from('alerts')
          .select('symbol, pattern, timeframe, status')
          .eq('user_id', userId)
          .limit(20);
        if (alerts?.length) {
          const active = alerts.filter((a: any) => a.status === 'active');
          sections.push(`**Alerts:** ${alerts.length} total, ${active.length} active`);
          if (active.length) {
            sections.push(`Active: ${active.map((a: any) => `${a.symbol} (${a.pattern}, ${a.timeframe})`).join(', ')}`);
          }
        }
        sections.push('Help the user manage their alerts — suggest new ones, review coverage gaps, or explain alert types.');
        break;
      }

      case 'pattern-lab':
      case 'backtest-results': {
        if (!userId) break;
        const { data: runs } = await supabase
          .from('backtest_runs')
          .select('strategy_name, instrument, timeframe, win_rate, expectancy, total_trades, profit_factor, max_drawdown, status')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);
        if (runs?.length) {
          const rows = runs.map((r: any) =>
            `  • ${r.strategy_name} on ${r.instrument} (${r.timeframe}) — WR: ${r.win_rate ? (r.win_rate * 100).toFixed(0) + '%' : '?'}, PF: ${r.profit_factor?.toFixed(1) || '?'}, n=${r.total_trades || 0}`
          ).join('\n');
          sections.push(`**Recent Backtests:**\n${rows}`);
        }
        // Check daily limit
        const limitCheck = await supabase.rpc('check_backtest_limit', { p_user_id: userId });
        if (limitCheck.data) {
          sections.push(`**Usage:** ${limitCheck.data.current_usage}/${limitCheck.data.max_daily_runs} runs today (${limitCheck.data.plan} plan)`);
        }
        sections.push('Help the user interpret backtest results, suggest parameter improvements, or compare strategies.');
        break;
      }

      case 'pricing': {
        if (userId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_plan')
            .eq('user_id', userId)
            .maybeSingle();
          if (profile) {
            sections.push(`**Current plan:** ${profile.subscription_plan || 'starter'}`);
          }
        }
        sections.push('The user is viewing pricing. Help them understand plan differences and which plan fits their trading style. Do NOT pressure — inform factually.');
        break;
      }

      case 'dashboard': {
        if (!userId) break;
        const [portfolioRes, recentPatternsRes] = await Promise.all([
          supabase.from('paper_portfolios')
            .select('current_balance, total_pnl')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase.from('live_pattern_detections')
            .select('instrument, pattern_name, direction, quality_score')
            .eq('status', 'active')
            .in('quality_score', ['A', 'B'])
            .order('first_detected_at', { ascending: false })
            .limit(3),
        ]);
        if (portfolioRes.data) {
          sections.push(`**Portfolio:** $${portfolioRes.data.current_balance?.toFixed(0)} (P&L: $${portfolioRes.data.total_pnl?.toFixed(0)})`);
        }
        if (recentPatternsRes.data?.length) {
          sections.push(`**Fresh A/B patterns:** ${recentPatternsRes.data.map((p: any) => `${p.instrument} ${p.pattern_name}`).join(', ')}`);
        }
        sections.push('User is on the dashboard overview. Proactively highlight actionable items: new patterns, open trade updates, upcoming economic events.');
        break;
      }

      case 'blog-article':
      case 'learn': {
        // No heavy DB queries needed — the articleSlug is already in liveContext
        sections.push('The user is reading educational content. Help them understand concepts, relate to their trading, and suggest actionable next steps (e.g., backtest the pattern, look for live examples).');
        break;
      }

      case 'agent-scoring': {
        if (!userId) break;
        const { data: settings } = await supabase
          .from('agent_scoring_settings')
          .select('weights, take_cutoff, watch_cutoff, asset_class_filter, timeframe_filter')
          .eq('user_id', userId)
          .eq('is_default', true)
          .maybeSingle();
        if (settings) {
          sections.push(`**Current Scoring Config:** Take≥${settings.take_cutoff}, Watch≥${settings.watch_cutoff}, Asset: ${settings.asset_class_filter}, TF: ${settings.timeframe_filter}`);
          const w = settings.weights as any;
          if (w) sections.push(`Weights: Analyst=${w.analyst || '?'}, Risk=${w.risk || '?'}, Timing=${w.timing || '?'}, Portfolio=${w.portfolio || '?'}`);
        }
        sections.push('Help the user tune their agent scoring weights and cutoffs. Explain the impact of each weight on signal quality.');
        break;
      }

      case 'pattern-library': {
        sections.push('The user is browsing the pattern library. Help them learn about specific patterns, compare patterns, or find which patterns work best for their preferred asset class/timeframe.');
        break;
      }

      case 'settings': {
        sections.push('The user is in account settings. Help with account management questions, plan details, or feature explanations.');
        break;
      }

      case 'community': {
        sections.push('The user is in the community feed. Help them engage with discussions, share strategies, or ask trading questions.');
        break;
      }

      case 'faq':
      case 'support': {
        sections.push('The user is looking for help. Be extra helpful and guide them to the right resources. Answer support questions directly when possible.');
        break;
      }

      case 'quiz': {
        sections.push('The user is taking a trading knowledge quiz. Help them learn from their answers and explain concepts they may have gotten wrong.');
        break;
      }

      case 'market-report': {
        // Fetch latest report freshness
        const { data: report } = await supabase
          .from('cached_market_reports')
          .select('generated_at, markets, time_span')
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (report) {
          const hoursAgo = Math.round((Date.now() - new Date(report.generated_at).getTime()) / (1000 * 60 * 60));
          sections.push(`**Latest report:** Generated ${hoursAgo}h ago covering ${report.markets?.join(', ') || 'all markets'}`);
        }
        sections.push('Help the user understand the market report and relate it to their trading plan or open positions.');
        break;
      }

      case 'portfolio': {
        if (!userId) break;
        // Same as paper-trading context
        const { data: portfolio } = await supabase
          .from('paper_portfolios')
          .select('initial_balance, current_balance, total_pnl')
          .eq('user_id', userId)
          .maybeSingle();
        if (portfolio) {
          const returnPct = portfolio.initial_balance > 0
            ? ((portfolio.current_balance - portfolio.initial_balance) / portfolio.initial_balance * 100).toFixed(1)
            : '0';
          sections.push(`**Portfolio:** $${portfolio.current_balance?.toFixed(0)} (${Number(returnPct) >= 0 ? '+' : ''}${returnPct}%)`);
        }
        sections.push('Help the user review their portfolio performance, risk exposure, and suggest optimizations.');
        break;
      }

      case 'calculator': {
        sections.push('The user is using the trading calculator. Help with position sizing, risk calculations, or R-multiple explanations.');
        break;
      }

      case 'scripts': {
        sections.push('The user is viewing or generating trading scripts (Pine Script). Help them create, modify, or understand scripts.');
        break;
      }

      default:
        break;
    }

    if (sections.length === 0) return '';

    return `## Page-Specific Intelligence (${pageType})\n${sections.join('\n')}`;
  } catch (err) {
    console.error('[PageDbContext] Failed:', err);
    return '';
  }
}

// ============================================
// RLVR TRAINING PAIR LOGGER
// ============================================

async function logTrainingPair(
  supabase: any,
  userId: string | null,
  sessionId: string | null,
  prompt: string,
  response: string,
  toolCalls: any[],
  toolResults: any[]
) {
  try {
    const hasResults = toolResults.some((r: any) => {
      try {
        const parsed = JSON.parse(r.content || '{}');
        return (parsed.count > 0 || parsed.results?.length > 0 || parsed.patterns?.length > 0);
      } catch { return false; }
    });

    const outcomeSignals = {
      tool_returned_data: hasResults,
      tool_call_count: toolCalls.length,
      response_length: response.length,
      has_markdown_table: response.includes('|---'),
      has_links: response.includes('](/'),
      timestamp: new Date().toISOString(),
    };

    const rewardScore = (hasResults ? 0.5 : -0.5) + 
      (response.length > 200 ? 0.3 : 0) + 
      (response.includes('](/') ? 0.2 : 0);

    await supabase.from('copilot_training_pairs').insert({
      user_id: userId,
      session_id: sessionId,
      prompt: prompt.substring(0, 5000),
      response: response.substring(0, 8000),
      tool_calls: toolCalls.map((tc: any) => ({ name: tc.function?.name, args: tc.function?.arguments })),
      tool_results: toolResults.map((tr: any) => {
        try { return { content: JSON.parse(tr.content || '{}') }; } 
        catch { return { content: tr.content?.substring(0, 500) }; }
      }),
      outcome_signals: outcomeSignals,
      reward_score: rewardScore,
      dpo_eligible: Math.abs(rewardScore) > 0.5,
    });
  } catch (err) {
    console.error('[RLVR] Failed to log training pair:', err);
  }
}

// ============================================
// RAG CONTEXT RETRIEVAL
// ============================================

interface RAGContext {
  relevantPatternStats: any[];
  activePatterns: any[];
  relevantArticles: any[];
  marketContext: string | null;
}

function extractQueryKeywords(messages: any[]): { symbols: string[], patterns: string[], topics: string[] } {
  const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || '';
  const text = lastUserMessage.toLowerCase();
  
  const patternKeywords = [
    'bull flag', 'bear flag', 'head and shoulders', 'inverse head and shoulders',
    'double top', 'double bottom', 'triple top', 'triple bottom',
    'ascending triangle', 'descending triangle', 'symmetrical triangle',
    'cup and handle', 'wedge', 'falling wedge', 'rising wedge',
    'channel', 'rectangle', 'pennant', 'flag'
  ];
  
  const topicKeywords = [
    'entry', 'exit', 'stop loss', 'take profit', 'risk', 'reward',
    'win rate', 'statistics', 'backtest', 'strategy', 'trend',
    'breakout', 'reversal', 'continuation', 'momentum', 'volume'
  ];
  
  const symbolRegex = /\b([A-Z]{2,5}(?:USD|USDT|BTC|ETH)?)\b/g;
  const symbols = [...new Set((lastUserMessage.match(symbolRegex) || []))];
  
  const patterns = patternKeywords.filter(p => text.includes(p));
  const topics = topicKeywords.filter(t => text.includes(t));
  
  return { symbols, patterns, topics };
}

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
    const fetchPromises: Promise<void>[] = [];
    
    if (keywords.patterns.length > 0 || keywords.symbols.length > 0) {
      fetchPromises.push((async () => {
        let query = supabase
          .from('pattern_hit_rates')
          .select('pattern_name, timeframe, win_rate, total_signals, avg_r_multiple, expectancy, profit_factor, direction')
          .limit(10);
        
        if (keywords.patterns.length > 0) {
          const patternFilter = keywords.patterns.map(p => `pattern_name.ilike.%${p}%`).join(',');
          query = query.or(patternFilter);
        }
        
        const { data } = await query;
        if (data?.length) {
          context.relevantPatternStats = data;
        }
      })());
    }
    
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
        }
      })());
    }
    
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
        }
      })());
    }
    
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
        }
      })());
    }
    
    await Promise.all(fetchPromises);
    
  } catch (error) {
    console.error('[RAG] Error fetching context:', error);
  }
  
  return context;
}

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
// TOOL EXECUTION DISPATCHER
// ============================================

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
    case 'query_edge_atlas':
      return await executeQueryEdgeAtlas(supabase, args);
    // ===== ENHANCED INTELLIGENCE TOOLS =====
    case 'get_instrument_stats':
      return await executeGetInstrumentStats(supabase, args);
    case 'compare_pattern_performance':
      return await executeComparePatternPerformance(supabase, args);
    case 'get_decision_confidence':
      return await executeGetDecisionConfidence(supabase, args);
    // ===== DATA INTEGRATION TOOLS =====
    case 'get_economic_events':
      return await executeGetEconomicEvents(supabase, args);
    case 'get_market_report':
      return await executeGetMarketReport(supabase, args);
    case 'get_price_data':
      return await executeGetPriceData(args);
    case 'get_user_backtests':
      return await executeGetUserBacktests(supabase, args, userId);
    case 'get_user_alerts':
      return await executeGetUserAlerts(supabase, args, userId);
    case 'get_paper_portfolio':
      return await executeGetPaperPortfolio(supabase, userId);
    // ===== AGENT SCORING ADJUSTMENT TOOLS =====
    case 'get_agent_scoring_settings':
      return await executeGetAgentScoringSettings(supabase, userId);
    case 'adjust_agent_scoring':
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

  // Import streaming utilities
  const { createSSEStream, getStatusMessage, streamFinalResponse, STREAM_CORS_HEADERS, HARD_TIMEOUT_MS } = await import("../_shared/streaming.ts");

  const { readable, writer } = createSSEStream();

  // Start the async processing in the background
  const processAsync = async () => {
    let timeoutId: number | undefined;
    try {
      // Hard timeout safety net
      timeoutId = setTimeout(() => {
        writer.sendError("This is taking longer than expected. Please try again.");
        writer.close();
      }, HARD_TIMEOUT_MS);

      const { messages, language, context, viewContext, chartContext } = await req.json();
      
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
      // PHASE 1: Fetch all context layers in parallel
      // ============================================
      writer.sendStatus("Preparing context…");
      console.log('[trading-copilot] Fetching all context layers...');
      const pageType = viewContext?.pageType || null;
      const liveContextRaw = viewContext?.liveContext || null;
      const [learnedRulesPrompt, ragContext, platformContext, userBehavior, pageDbContext] = await Promise.all([
        fetchLearnedRules(supabase),
        fetchRAGContext(supabase, messages),
        fetchPlatformContext(supabase),
        fetchUserBehavior(supabase, userId),
        fetchPageDbContext(supabase, userId, pageType, liveContextRaw),
      ]);
      const temporalContext = computeTemporalContext();
      const langCode = (language || "en").toLowerCase();
      console.log(`[trading-copilot] Language requested: ${langCode}`);
      const langInstruction = langCode !== "en"
        ? `\n\n## Language\nIMPORTANT: You MUST respond entirely in the language with code "${langCode}". All explanations, analysis, headings, and commentary must be in that language. Keep ticker symbols, pattern names (e.g. "Bull Flag"), and technical terms like RSI, MACD, ATR in English. Translate everything else.\n`
        : "";
      
      // Build view context layer
      let viewContextLayer = '';
      if (viewContext && typeof viewContext === 'object') {
        const pageName = viewContext.pageName || viewContext.page || null;
        const pageRoute = viewContext.pageRoute || null;
        const parts: string[] = [];

        if (pageName) {
          parts.push(`The user is currently on the **${pageName}** page.`);
          parts.push(`Adjust your responses and suggested actions to be relevant to what they can do on this page. Page context: ${pageRoute || pageName}`);
        }
        if (viewContext.instrument) parts.push(`They are focused on **${viewContext.instrument}**.`);
        if (viewContext.patternName) parts.push(`Pattern: **${viewContext.patternName}**.`);
        if (viewContext.timeframe) parts.push(`Timeframe: **${viewContext.timeframe}**.`);
        if (viewContext.direction) parts.push(`Direction: **${viewContext.direction}**.`);
        if (viewContext.grade) parts.push(`Quality grade: **${viewContext.grade}**.`);
        if (viewContext.verdict) parts.push(`Agent verdict: **${viewContext.verdict}** (score: ${viewContext.compositeScore ?? 'N/A'}).`);
        if (viewContext.detectionId) parts.push(`Detection ID: ${viewContext.detectionId}.`);
        if (parts.length > 0) {
          viewContextLayer = `## User's Current View\n${parts.join(' ')}\n\nWhen the user says "this pattern", "this setup", "score this", or asks vague questions, ALWAYS assume they are referring to the above context. Use the instrument, pattern, and timeframe from their current view without asking them to specify. If they ask to "score this trade", use the search_patterns tool with the instrument and pattern from their view.`;
        }
        console.log(`[trading-copilot] View context: page=${pageName || 'none'}, route=${pageRoute || 'none'}, pageType=${pageType || 'none'}, instrument=${viewContext.instrument || 'none'}, pattern=${viewContext.patternName || 'none'}`);
      }

      // Inject the live context prompt from the client-side Zustand store
      let liveContextLayer = '';
      if (liveContextRaw && typeof liveContextRaw === 'string' && liveContextRaw.length > 0) {
        liveContextLayer = `## Live Page Context (Real-Time)\n${liveContextRaw}`;
        console.log(`[trading-copilot] Live context injected (${liveContextRaw.length} chars)`);
      }

      // Inject chart context if provided (from useCopilotContext on chart page)
      let chartContextLayer = '';
      if (chartContext && typeof chartContext === 'string' && chartContext.length > 0) {
        chartContextLayer = `## Live Chart Context (Injected)\n${chartContext}`;
        console.log(`[trading-copilot] Chart context injected (${chartContext.length} chars)`);
      }

      // Assemble enhanced system prompt with all context layers
      const contextLayers = [temporalContext, platformContext, userBehavior, pageDbContext, viewContextLayer, liveContextLayer, chartContextLayer].filter(Boolean).join('\n\n');
      const enhancedSystemPrompt = buildEnhancedSystemPrompt(systemPrompt, ragContext) 
        + (contextLayers ? '\n\n' + contextLayers : '')
        + langInstruction 
        + learnedRulesPrompt;
      console.log(`[trading-copilot] RAG context: ${ragContext.relevantPatternStats.length} stats, ${ragContext.activePatterns.length} patterns, ${ragContext.relevantArticles.length} articles`);
      console.log(`[trading-copilot] Context layers: temporal=yes, platform=${platformContext ? 'yes' : 'no'}, user=${userBehavior ? 'yes' : 'no'}, pageDb=${pageDbContext ? 'yes' : 'no'}, liveCtx=${liveContextRaw ? 'yes' : 'no'}, learned_rules=${learnedRulesPrompt.length > 0 ? 'yes' : 'no'}`);

      // Track tool calls/results for RLVR logging
      const allToolCalls: any[] = [];
      const allToolResults: any[] = [];

      let convo: any[] = [{ role: "system", content: enhancedSystemPrompt }, ...messages];

      const MAX_TOOL_ROUNDS = 5;
      const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      const geminiHeaders = {
        "Authorization": `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      };
      const baseBody = {
        model: "gemini-2.0-flash",
        tools,
        tool_choice: "auto",
        max_tokens: 8192,
      };

      for (let round = 1; round <= MAX_TOOL_ROUNDS; round++) {
        console.log(`[trading-copilot] AI round ${round}`);
        writer.sendStatus(getStatusMessage(round));

        let aiResp: Response | null = null;
        const MAX_RETRY_ATTEMPTS = 2;
        
        for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
          aiResp = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: geminiHeaders,
            body: JSON.stringify({
              ...baseBody,
              messages: convo,
              stream: false,
            }),
          });

          if (aiResp.status === 429 && attempt < MAX_RETRY_ATTEMPTS) {
            console.log(`[trading-copilot] Rate limited, retrying in 3s (attempt ${attempt}/${MAX_RETRY_ATTEMPTS})`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
          break;
        }

        if (!aiResp || !aiResp.ok) {
          if (aiResp?.status === 429) {
            writer.sendError("AI service is busy. Please try again in a moment.");
            writer.close();
            return;
          }
          const t = await aiResp?.text().catch(() => "");
          console.error("[trading-copilot] AI gateway error:", aiResp?.status, t);
          writer.sendError("Failed to get a response. Please try again.");
          writer.close();
          return;
        }

        const responseText = await aiResp.text();
        let assistantMessage: any = null;

        try {
          const result = JSON.parse(responseText);
          assistantMessage = result.choices?.[0]?.message;
        } catch {
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

          allToolCalls.push(...assistantMessage.tool_calls);
          allToolResults.push(...toolResults);

          convo = [...convo, assistantMessage, ...toolResults];
          continue;
        }

        // No tool calls — this is the final response.
        // If we got content directly (non-streaming round), send it as tokens
        const directContent = assistantMessage?.content;
        if (directContent) {
          // Send the already-received content as a single token burst
          writer.sendToken(directContent);
          writer.sendDone();

          // RLVR: Log training pair
          const userPrompt = messages.filter((m: any) => m.role === 'user').pop()?.content || '';
          logTrainingPair(supabase, userId, null, userPrompt, directContent, allToolCalls, allToolResults);

          writer.close();
          return;
        }

        // Fallback if no content
        writer.sendToken("I couldn't process that request.");
        writer.sendDone();
        writer.close();
        return;
      }

      // Fallback after max tool rounds
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
      writer.sendToken(fallback);
      writer.sendDone();
      writer.close();
    } catch (error) {
      console.error("[trading-copilot] Error:", error);
      writer.sendError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      writer.close();
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  };

  // Fire and forget — the readable stream will be returned immediately
  processAsync();

  return new Response(readable, {
    headers: STREAM_CORS_HEADERS,
  });
});
