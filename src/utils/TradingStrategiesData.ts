export interface Strategy {
  id: number;
  name: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  indicators: string[];
  timeframes: string[];
  description: string;
  entry: string;
  exit: string;
  riskReward: string;
  successRate: string;
  pack: string;
  hidden?: boolean;
  internalJsonSchema?: {
    name: string;
    inputs: Record<string, any>;
    indicators: string[];
    signals: string[];
    filters: Record<string, any>;
    exits: Record<string, any>;
    timeframe: { signal: string; confirm?: string };
    alerts: Record<string, any>;
  };
}

export const STRATEGY_PACKS = {
  "MACD Strategy Pack": "A",
  "Bollinger Bands Strategy Pack": "B", 
  "RSI Strategy Pack": "C",
  "Moving Averages & Trend Pack": "D",
  "Stochastic & Oscillators Pack": "E",
  "Volume & Volume-Price Pack": "F",
  "Levels & Patterns Pack": "G",
  "Market Structure & Profile Pack": "H",
  "Advanced Confirmation Pack": "I",
  "Trading Styles Pack": "J"
} as const;

export const tradingStrategies: Strategy[] = [
  // MACD Strategy Pack (A)
  {
    id: 1,
    name: "MACD Golden Cross Momentum",
    category: "MACD",
    difficulty: "Beginner",
    indicators: ["MACD", "Signal Line", "Volume"],
    timeframes: ["1H", "4H", "1D"],
    description: "Enter long when MACD crosses above signal line with increasing volume",
    entry: "MACD line crosses above signal line + volume spike",
    exit: "MACD crosses below signal line or 2% stop loss",
    riskReward: "1:2",
    successRate: "65%",
    pack: "MACD Strategy Pack",
    internalJsonSchema: {
      name: "MACD Golden Cross Momentum",
      inputs: { "macdFast": 12, "macdSlow": 26, "signal": 9, "riskPercent": 1.0 },
      indicators: ["MACD", "Signal Line", "Volume"],
      signals: ["crossUp"],
      filters: { "volumeSpike": true },
      exits: { "oppositeSignal": true, "stopLoss": 2.0 },
      timeframe: { "signal": "1H" },
      alerts: { "onCloseOnly": true, "message": "MACD Golden Cross signal triggered" }
    }
  },
  {
    id: 2,
    name: "MACD Divergence Reversal",
    category: "MACD",
    difficulty: "Advanced",
    indicators: ["MACD", "Price Action", "RSI"],
    timeframes: ["4H", "1D"],
    description: "Identify divergence between price and MACD for reversal signals",
    entry: "Bearish divergence + MACD histogram declining",
    exit: "Target previous support/resistance levels",
    riskReward: "1:3",
    successRate: "72%",
    pack: "MACD Strategy Pack"
  },
  {
    id: 3,
    name: "MACD Zero Line Bounce",
    category: "MACD",
    difficulty: "Intermediate",
    indicators: ["MACD", "EMA 20", "Volume"],
    timeframes: ["1H", "4H"],
    description: "Trade bounces off MACD zero line in trending markets",
    entry: "MACD touches zero line and bounces + price above EMA 20",
    exit: "MACD histogram peaks or price breaks EMA 20",
    riskReward: "1:2.5",
    successRate: "68%",
    pack: "MACD Strategy Pack"
  },
  {
    id: 4,
    name: "MACD Histogram Strategy",
    category: "MACD",
    difficulty: "Expert",
    indicators: ["MACD Histogram", "Volume Profile", "ATR"],
    timeframes: ["15M", "1H"],
    description: "Use MACD histogram for precise entry timing",
    entry: "Histogram turning positive + volume above average",
    exit: "Histogram peaks or ATR-based stop loss",
    riskReward: "1:2",
    successRate: "70%",
    pack: "MACD Strategy Pack"
  },
  {
    id: 5,
    name: "MACD Triple Screen",
    category: "MACD",
    difficulty: "Expert",
    indicators: ["MACD", "Weekly Trend", "Daily MACD", "Hourly Entry"],
    timeframes: ["1W", "1D", "1H"],
    description: "Elder's triple screen method using MACD across timeframes",
    entry: "Weekly uptrend + daily MACD buy + hourly pullback",
    exit: "Daily MACD turns negative",
    riskReward: "1:4",
    successRate: "75%",
    pack: "MACD Strategy Pack"
  },

  // Bollinger Bands Strategy Pack (B)
  {
    id: 6,
    name: "Bollinger Band Squeeze",
    category: "Bollinger Bands",
    difficulty: "Intermediate",
    indicators: ["Bollinger Bands", "Volume", "ATR"],
    timeframes: ["1H", "4H"],
    description: "Trade breakouts after periods of low volatility",
    entry: "Bands squeeze + volume expansion on breakout",
    exit: "Price reaches opposite band or volume dies",
    riskReward: "1:3",
    successRate: "73%",
    pack: "Bollinger Bands Strategy Pack"
  },
  {
    id: 7,
    name: "Bollinger Band Mean Reversion",
    category: "Bollinger Bands",
    difficulty: "Beginner",
    indicators: ["Bollinger Bands", "RSI", "Stochastic"],
    timeframes: ["15M", "1H"],
    description: "Buy oversold at lower band, sell overbought at upper band",
    entry: "Price touches lower band + RSI < 30",
    exit: "Price reaches middle band or upper band",
    riskReward: "1:2",
    successRate: "67%",
    pack: "Bollinger Bands Strategy Pack"
  },
  {
    id: 8,
    name: "Bollinger Band Walk Strategy",
    category: "Bollinger Bands",
    difficulty: "Advanced",
    indicators: ["Bollinger Bands", "Volume", "Momentum"],
    timeframes: ["4H", "1D"],
    description: "Ride strong trends walking along the bands",
    entry: "Price walks along upper band with volume",
    exit: "Price falls below middle band",
    riskReward: "1:5",
    successRate: "78%",
    pack: "Bollinger Bands Strategy Pack"
  },
  {
    id: 9,
    name: "Double Bollinger Band System",
    category: "Bollinger Bands",
    difficulty: "Expert",
    indicators: ["BB (20,2)", "BB (20,1)", "Volume", "MACD"],
    timeframes: ["1H", "4H"],
    description: "Use two sets of Bollinger Bands for refined entries",
    entry: "Price between outer and inner bands + MACD confirmation",
    exit: "Price reaches target zone or stops triggered",
    riskReward: "1:2.5",
    successRate: "71%",
    pack: "Bollinger Bands Strategy Pack"
  },
  {
    id: 10,
    name: "Bollinger Band Reversal Pattern",
    category: "Bollinger Bands",
    difficulty: "Intermediate",
    indicators: ["Bollinger Bands", "Candlestick Patterns", "Volume"],
    timeframes: ["1H", "4H"],
    description: "Combine BB touches with reversal candlestick patterns",
    entry: "Hammer at lower band or shooting star at upper band",
    exit: "Price reaches middle band or pattern fails",
    riskReward: "1:2.5",
    successRate: "69%",
    pack: "Bollinger Bands Strategy Pack"
  },

  // RSI Strategy Pack (C)
  {
    id: 11,
    name: "RSI Divergence Strategy",
    category: "RSI",
    difficulty: "Advanced",
    indicators: ["RSI", "Price Action", "Volume"],
    timeframes: ["1H", "4H"],
    description: "Trade divergences between RSI and price action",
    entry: "Bullish divergence: lower lows in price, higher lows in RSI",
    exit: "RSI reaches overbought or price breaks key resistance",
    riskReward: "1:3",
    successRate: "74%",
    pack: "RSI Strategy Pack"
  },
  {
    id: 12,
    name: "RSI 50 Line Strategy",
    category: "RSI",
    difficulty: "Beginner",
    indicators: ["RSI", "EMA 21", "Volume"],
    timeframes: ["1H", "4H"],
    description: "Use RSI 50 line as trend filter for entries",
    entry: "RSI above 50 + price above EMA 21 + pullback",
    exit: "RSI below 50 or EMA 21 break",
    riskReward: "1:2",
    successRate: "66%",
    pack: "RSI Strategy Pack"
  },
  {
    id: 13,
    name: "RSI Overbought/Oversold Scalp",
    category: "RSI",
    difficulty: "Intermediate",
    indicators: ["RSI", "Stochastic", "Volume"],
    timeframes: ["5M", "15M"],
    description: "Quick scalps using extreme RSI levels",
    entry: "RSI > 80 or < 20 + stochastic confirmation",
    exit: "RSI returns to 50 line or time-based exit",
    riskReward: "1:1.5",
    successRate: "63%",
    pack: "RSI Strategy Pack"
  },
  {
    id: 14,
    name: "RSI Failure Swing",
    category: "RSI",
    difficulty: "Expert",
    indicators: ["RSI", "Support/Resistance", "Volume"],
    timeframes: ["4H", "1D"],
    description: "Trade RSI failure swings at key levels",
    entry: "RSI fails to exceed previous high/low at key S/R",
    exit: "Price breaks significant support/resistance",
    riskReward: "1:4",
    successRate: "76%",
    pack: "RSI Strategy Pack"
  },
  {
    id: 15,
    name: "RSI Cutler's Method",
    category: "RSI",
    difficulty: "Expert",
    indicators: ["RSI Cutler", "Volume Profile", "VWAP"],
    timeframes: ["1H", "4H"],
    description: "Use Cutler's RSI modification for cleaner signals",
    entry: "Cutler RSI crosses threshold + volume confirmation",
    exit: "RSI momentum weakens or VWAP rejection",
    riskReward: "1:2.5",
    successRate: "72%",
    pack: "RSI Strategy Pack"
  },

  // Moving Averages & Trend Pack (D)
  {
    id: 16,
    name: "Golden Cross Strategy",
    category: "Moving Averages",
    difficulty: "Beginner",
    indicators: ["EMA 50", "EMA 200", "Volume"],
    timeframes: ["1D", "1W"],
    description: "Trade when 50 EMA crosses above 200 EMA",
    entry: "50 EMA crosses above 200 EMA + volume spike",
    exit: "50 EMA crosses below 200 EMA",
    riskReward: "1:5",
    successRate: "68%",
    pack: "Moving Averages & Trend Pack"
  },
  {
    id: 17,
    name: "Triple EMA Crossover",
    category: "Moving Averages",
    difficulty: "Intermediate",
    indicators: ["EMA 8", "EMA 13", "EMA 21", "Volume"],
    timeframes: ["1H", "4H"],
    description: "Use three EMAs for trend confirmation and entries",
    entry: "Fast EMA > Medium EMA > Slow EMA alignment",
    exit: "EMA alignment breaks or stop loss hit",
    riskReward: "1:2.5",
    successRate: "71%",
    pack: "Moving Averages & Trend Pack"
  },
  {
    id: 18,
    name: "VWAP Bounce Strategy",
    category: "Moving Averages",
    difficulty: "Intermediate",
    indicators: ["VWAP", "Volume", "ATR"],
    timeframes: ["5M", "15M", "1H"],
    description: "Trade bounces off VWAP in trending markets",
    entry: "Price bounces off VWAP + volume confirmation",
    exit: "Price moves 2x ATR or breaks VWAP decisively",
    riskReward: "1:2",
    successRate: "69%",
    pack: "Moving Averages & Trend Pack"
  },
  {
    id: 19,
    name: "Hull Moving Average Trend",
    category: "Moving Averages",
    difficulty: "Advanced",
    indicators: ["Hull MA", "RSI", "Volume"],
    timeframes: ["1H", "4H"],
    description: "Use Hull MA for reduced lag trend following",
    entry: "Hull MA changes color + RSI confirms trend",
    exit: "Hull MA color changes or RSI divergence",
    riskReward: "1:3",
    successRate: "73%",
    pack: "Moving Averages & Trend Pack"
  },
  {
    id: 20,
    name: "Adaptive Moving Average System",
    category: "Moving Averages",
    difficulty: "Expert",
    indicators: ["KAMA", "Volatility Index", "Volume"],
    timeframes: ["4H", "1D"],
    description: "Use Kaufman's Adaptive MA for volatile markets",
    entry: "KAMA trend change + volatility expansion",
    exit: "KAMA flattens or volatility contracts",
    riskReward: "1:3.5",
    successRate: "75%",
    pack: "Moving Averages & Trend Pack"
  },

  // Stochastic & Oscillators Pack (E)
  {
    id: 21,
    name: "Stochastic %K %D Cross",
    category: "Stochastic",
    difficulty: "Beginner",
    indicators: ["Stochastic %K", "Stochastic %D", "Volume"],
    timeframes: ["1H", "4H"],
    description: "Trade crossovers of %K and %D lines",
    entry: "%K crosses above %D below 20 oversold zone",
    exit: "%K crosses below %D above 80 overbought zone",
    riskReward: "1:2",
    successRate: "64%",
    pack: "Stochastic & Oscillators Pack"
  },
  {
    id: 22,
    name: "Slow Stochastic Divergence",
    category: "Stochastic",
    difficulty: "Advanced",
    indicators: ["Slow Stochastic", "Price Action", "Trend Lines"],
    timeframes: ["4H", "1D"],
    description: "Identify divergences using slow stochastic",
    entry: "Bearish divergence in uptrend + stoch turns down",
    exit: "Price breaks trend line or stoch reaches extreme",
    riskReward: "1:3.5",
    successRate: "77%",
    pack: "Stochastic & Oscillators Pack"
  },
  {
    id: 23,
    name: "Williams %R Overbought/Oversold",
    category: "Williams %R",
    difficulty: "Beginner",
    indicators: ["Williams %R", "Price Action", "Volume"],
    timeframes: ["1H", "4H"],
    description: "Trade extreme readings in Williams %R",
    entry: "%R below -80 (oversold) + bullish price action",
    exit: "%R above -20 (overbought) or stop loss",
    riskReward: "1:2",
    successRate: "65%",
    pack: "Stochastic & Oscillators Pack"
  },
  {
    id: 35,
    name: "CCI Zero Line Cross",
    category: "CCI",
    difficulty: "Beginner",
    indicators: ["CCI", "Volume", "Trend"],
    timeframes: ["1H", "4H"],
    description: "Trade CCI crosses above/below zero line",
    entry: "CCI crosses above 0 + volume confirmation",
    exit: "CCI crosses below 0 or hits +100 level",
    riskReward: "1:2",
    successRate: "66%",
    pack: "Stochastic & Oscillators Pack"
  },
  {
    id: 26,
    name: "Rate of Change Momentum (ROC)",
    category: "Momentum",
    difficulty: "Intermediate",
    indicators: ["ROC", "MA", "Volume"],
    timeframes: ["1H", "4H"],
    description: "Trade momentum using Rate of Change indicator",
    entry: "ROC crosses above zero + MA support",
    exit: "ROC crosses below zero or MA breaks",
    riskReward: "1:2.5",
    successRate: "68%",
    pack: "Stochastic & Oscillators Pack"
  },
  {
    id: 27,
    name: "Price Momentum Oscillator (PMO)",
    category: "Momentum",
    difficulty: "Advanced",
    indicators: ["PMO", "Signal Line", "Trend"],
    timeframes: ["4H", "1D"],
    description: "Use DecisionPoint's PMO for momentum analysis",
    entry: "PMO crosses above signal line + uptrend",
    exit: "PMO crosses below signal or trend breaks",
    riskReward: "1:3",
    successRate: "72%",
    pack: "Stochastic & Oscillators Pack"
  },

  // Volume & Volume-Price Pack (F)
  {
    id: 24,
    name: "On Balance Volume Trend (OBV)",
    category: "Volume",
    difficulty: "Intermediate",
    indicators: ["OBV", "Price Trend", "MA"],
    timeframes: ["1H", "4H"],
    description: "Confirm trends using On Balance Volume",
    entry: "OBV breaks resistance + price follows",
    exit: "OBV diverges from price or MA breaks",
    riskReward: "1:2.5",
    successRate: "69%",
    pack: "Volume & Volume-Price Pack"
  },
  {
    id: 25,
    name: "Volume Price Trend Indicator (VPT)",
    category: "Volume",
    difficulty: "Advanced",
    indicators: ["VPT", "Price Action", "Trend Lines"],
    timeframes: ["4H", "1D"],
    description: "Use VPT for volume-adjusted price analysis",
    entry: "VPT trend line break + price confirmation",
    exit: "VPT momentum fails or reverses",
    riskReward: "1:3.5",
    successRate: "73%",
    pack: "Volume & Volume-Price Pack"
  },
  {
    id: 28,
    name: "ADX Trend Strength Filter",
    category: "ADX/DMI",
    difficulty: "Intermediate",
    indicators: ["ADX", "DI+", "DI-", "EMA"],
    timeframes: ["1H", "4H"],
    description: "Use ADX to filter strong trending moves",
    entry: "ADX > 25 + DI+ > DI- + price above EMA",
    exit: "ADX < 20 or DI crossover reverses",
    riskReward: "1:3",
    successRate: "72%",
    pack: "Volume & Volume-Price Pack"
  },
  {
    id: 29,
    name: "Parabolic SAR Trend Following",
    category: "Parabolic SAR",
    difficulty: "Beginner",
    indicators: ["Parabolic SAR", "EMA", "Volume"],
    timeframes: ["4H", "1D"],
    description: "Follow trends using SAR stop and reverse points",
    entry: "SAR flips below price + EMA alignment",
    exit: "SAR flips above price or volume dies",
    riskReward: "1:3",
    successRate: "69%",
    pack: "Volume & Volume-Price Pack"
  },

  // Levels & Patterns Pack (G)
  {
    id: 30,
    name: "Fibonacci Retracement Bounce",
    category: "Fibonacci",
    difficulty: "Beginner",
    indicators: ["Fibonacci Retracement", "Support/Resistance", "Volume"],
    timeframes: ["1H", "4H"],
    description: "Trade bounces from key Fibonacci levels",
    entry: "Price bounces from 61.8% or 50% retracement",
    exit: "Price reaches 100% extension or fails retest",
    riskReward: "1:2.5",
    successRate: "68%",
    pack: "Levels & Patterns Pack"
  },
  {
    id: 31,
    name: "Ichimoku Cloud Breakout",
    category: "Ichimoku",
    difficulty: "Intermediate",
    indicators: ["Ichimoku Cloud", "Tenkan", "Kijun", "Volume"],
    timeframes: ["4H", "1D"],
    description: "Trade breakouts above/below Ichimoku cloud",
    entry: "Price breaks above cloud + Tenkan > Kijun",
    exit: "Price re-enters cloud or Tenkan < Kijun",
    riskReward: "1:3",
    successRate: "73%",
    pack: "Levels & Patterns Pack"
  },
  {
    id: 32,
    name: "Standard Pivot Point Trading",
    category: "Pivot Points",
    difficulty: "Beginner",
    indicators: ["Pivot Points", "S1/S2/S3", "R1/R2/R3", "Volume"],
    timeframes: ["15M", "1H"],
    description: "Trade bounces and breaks of pivot levels",
    entry: "Price bounces from pivot level + volume",
    exit: "Price reaches next pivot level or fails",
    riskReward: "1:2",
    successRate: "64%",
    pack: "Levels & Patterns Pack"
  },

  // Market Structure & Profile Pack (H)
  {
    id: 33,
    name: "Market Profile Value Area",
    category: "Advanced",
    difficulty: "Expert",
    indicators: ["Market Profile", "Value Area", "POC", "Volume"],
    timeframes: ["30M", "1H"],
    description: "Trade using Market Profile value area concepts",
    entry: "Price at value area extreme + volume confirmation",
    exit: "Price reaches POC or breaks value area",
    riskReward: "1:3",
    successRate: "74%",
    pack: "Market Structure & Profile Pack"
  },

  // Advanced Confirmation Pack (I)
  {
    id: 34,
    name: "Triple Confirmation System",
    category: "Multi-Indicator",
    difficulty: "Advanced",
    indicators: ["MACD", "RSI", "Bollinger Bands", "Volume"],
    timeframes: ["1H", "4H"],
    description: "Require confirmation from three different indicator types",
    entry: "MACD bullish + RSI oversold recovery + BB breakout + volume",
    exit: "Any indicator turns bearish or stops hit",
    riskReward: "1:3",
    successRate: "76%",
    pack: "Advanced Confirmation Pack"
  },
  {
    id: 37,
    name: "Multi-Timeframe Trend Alignment",
    category: "Trend Following",
    difficulty: "Advanced",
    indicators: ["Daily EMA", "4H EMA", "1H Entry", "Volume"],
    timeframes: ["1D", "4H", "1H"],
    description: "Align trends across multiple timeframes for high-probability entries",
    entry: "Daily uptrend + 4H pullback + 1H reversal signal",
    exit: "4H trend changes or daily EMA breaks",
    riskReward: "1:4",
    successRate: "78%",
    pack: "Advanced Confirmation Pack"
  },

  // Trading Styles Pack (J)
  {
    id: 38,
    name: "5-Minute Scalping System",
    category: "Scalping",
    difficulty: "Expert",
    indicators: ["EMA 5", "EMA 10", "RSI", "Volume"],
    timeframes: ["5M", "1M"],
    description: "Quick scalps using fast EMAs and momentum",
    entry: "EMA 5 > EMA 10 + RSI > 50 + volume spike",
    exit: "EMA cross or 10-pip target/5-pip stop",
    riskReward: "1:2",
    successRate: "68%",
    pack: "Trading Styles Pack"
  },
  {
    id: 39,
    name: "Weekly Swing Strategy",
    category: "Swing Trading",
    difficulty: "Intermediate",
    indicators: ["Weekly EMA", "Daily RSI", "Support/Resistance"],
    timeframes: ["1W", "1D"],
    description: "Hold positions for days to weeks based on weekly trends",
    entry: "Weekly EMA support + daily RSI oversold + S/R level",
    exit: "Weekly trend change or major resistance",
    riskReward: "1:5",
    successRate: "72%",
    pack: "Trading Styles Pack"
  },
  {
    id: 40,
    name: "Oversold Bounce Strategy",
    category: "Mean Reversion",
    difficulty: "Beginner",
    indicators: ["RSI", "Bollinger Bands", "Support Levels"],
    timeframes: ["4H", "1D"],
    description: "Buy oversold conditions at support levels",
    entry: "RSI < 25 + price at BB lower band + support level",
    exit: "RSI > 70 or resistance level reached",
    riskReward: "1:2.5",
    successRate: "67%",
    pack: "Trading Styles Pack"
  },

  // Hidden duplicate entry for BB Squeeze Breakout
  {
    id: 36,
    name: "Bollinger Band Squeeze Breakout",
    category: "Breakout",
    difficulty: "Intermediate",
    indicators: ["Bollinger Bands", "Volume", "ATR"],
    timeframes: ["1H", "4H"],
    description: "Trade explosive moves after volatility compression",
    entry: "BB squeeze + volume expansion on breakout direction",
    exit: "Volatility exhaustion or opposite BB touch",
    riskReward: "1:3.5",
    successRate: "71%",
    pack: "Bollinger Bands Strategy Pack",
    hidden: true  // Hide this duplicate in favor of "Bollinger Band Squeeze"
  }
];