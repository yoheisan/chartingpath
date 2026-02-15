import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Target, Clock, BarChart3, Layers, Brain, Shield, Zap, LineChart, Activity, Wallet, Bot, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

// Strategy category data organized for easy navigation
const STRATEGY_CATEGORIES = [
  { id: "time-based", label: "Time-Based Strategies", icon: Clock, count: 4 },
  { id: "trend", label: "Trend Following", icon: TrendingUp, count: 8 },
  { id: "technical", label: "Technical Indicators", icon: BarChart3, count: 16 },
  { id: "patterns", label: "Chart Patterns", icon: Layers, count: 12 },
  { id: "advanced", label: "Advanced Methods", icon: Brain, count: 15 },
  { id: "risk", label: "Risk Management", icon: Shield, count: 6 },
  { id: "options", label: "Options Strategies", icon: Activity, count: 6 },
  { id: "algo", label: "Algorithmic Trading", icon: Bot, count: 10 },
];

const TradingStrategiesGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <Link to="/learn" className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            100 Trading Strategies: The Complete Guide for Every Market
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            From beginner-friendly buy-and-hold approaches to advanced algorithmic systems—discover proven trading strategies used by professional traders worldwide, complete with entry/exit rules and risk management guidelines.
          </p>

          {/* Quick Navigation */}
          <Card className="mb-10 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Quick Navigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {STRATEGY_CATEGORIES.map(cat => (
                  <a 
                    key={cat.id}
                    href={`#${cat.id}`}
                    className="flex items-center gap-2 p-3 rounded-lg bg-background/50 hover:bg-background border border-border/50 transition-colors"
                  >
                    <cat.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{cat.label}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">{cat.count}</Badge>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Introduction */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Why Learn Multiple Trading Strategies?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                Markets are dynamic—what works in a trending bull market may fail in a sideways range. Professional traders maintain a toolkit of strategies, selecting the right approach for current market conditions. This comprehensive guide covers 100 strategies across all major categories, from simple long-term investing to sophisticated algorithmic systems.
              </p>
              <p>
                Each strategy includes its ideal timeframe, execution frequency, and notable traders who have used it successfully. Use this as your reference guide to build a versatile trading approach.
              </p>
            </CardContent>
          </Card>

          {/* ========== SECTION 1: TIME-BASED STRATEGIES ========== */}
          <h2 id="time-based" className="text-2xl font-semibold mt-12 mb-6 flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Time-Based Trading Strategies
          </h2>
          
          <p className="text-muted-foreground mb-6">
            These strategies are defined primarily by how long you hold positions—from decades-long investing to seconds-long scalping. Choose based on your available time, risk tolerance, and personality.
          </p>

          <div className="space-y-4 mb-8">
            {/* Strategy 1: Buy and Hold */}
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">1. Buy and Hold Strategy</h3>
                  <Badge variant="outline" className="bg-green-600/10 text-green-400 border-green-600/30">Beginner</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  A long-term investment approach where assets are purchased and held for an extended period regardless of short-term price fluctuations. This strategy relies on the principle that markets tend to rise over time.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <p className="font-medium">Years to decades</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trade Frequency:</span>
                    <p className="font-medium">1–5 trades/year</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notable Traders:</span>
                    <p className="font-medium">Warren Buffett, Charlie Munger, John Bogle</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2"><strong>Entry:</strong> Buy fundamentally strong assets at fair or undervalued prices. Look for companies with strong moats, consistent earnings, and good management.</p>
                  <p className="text-sm text-muted-foreground"><strong>Exit:</strong> Rarely exit. Only sell when fundamentals deteriorate significantly or better opportunities arise. Rebalance annually.</p>
                </div>
              </CardContent>
            </Card>

            {/* Strategy 2: Swing Trading */}
            <Card className="border-l-4 border-l-accent">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">2. Swing Trading</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  A medium-term strategy that seeks to capture price movements over several days to weeks. Swing traders ride the "swings" within larger trends, profiting from predictable oscillations between <Link to="/learn/support-resistance" className="text-primary hover:underline">support and resistance</Link> levels.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <p className="font-medium">Days to weeks</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trade Frequency:</span>
                    <p className="font-medium">5–20 trades/month</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notable Traders:</span>
                    <p className="font-medium">Paul Tudor Jones (macro swing trader)</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2"><strong>Entry:</strong> Buy at swing lows in uptrends, short at swing highs in downtrends. Use <Link to="/learn/moving-averages" className="text-primary hover:underline">moving averages</Link> and <Link to="/learn/rsi-indicator" className="text-primary hover:underline">RSI</Link> for confirmation.</p>
                  <p className="text-sm text-muted-foreground"><strong>Exit:</strong> Target the opposite end of the swing range. Trail stops as position moves in your favor.</p>
                </div>
              </CardContent>
            </Card>

            {/* Strategy 3: Day Trading */}
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">3. Day Trading</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  A short-term strategy where positions are opened and closed within the same trading day to avoid overnight risk. Day traders focus on intraday price movements and require dedicated screen time during market hours.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <p className="font-medium">Minutes to hours</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trade Frequency:</span>
                    <p className="font-medium">5–100 trades/day</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notable Traders:</span>
                    <p className="font-medium">Ross Cameron, Andrew Aziz</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2"><strong>Entry:</strong> Look for setups in the first 1-2 hours of market open. Trade with the trend using <Link to="/learn/volume-analysis" className="text-primary hover:underline">volume confirmation</Link>.</p>
                  <p className="text-sm text-muted-foreground"><strong>Exit:</strong> All positions closed before market close. Use tight stops (1-2% max) and quick profit targets.</p>
                </div>
              </CardContent>
            </Card>

            {/* Strategy 9: Scalping */}
            <Card className="border-l-4 border-l-accent">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">4. Scalping</h3>
                  <Badge variant="outline" className="bg-red-600/10 text-red-400 border-red-600/30">Expert</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  An ultra-short-term strategy aiming to profit from small price movements within seconds to minutes. Scalpers make many trades per day, accumulating small gains that compound over time.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <p className="font-medium">Seconds to minutes</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trade Frequency:</span>
                    <p className="font-medium">10–200 trades/day</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notable Traders:</span>
                    <p className="font-medium">Dan Zanger (high-frequency trader)</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2"><strong>Entry:</strong> Enter on minor pullbacks using 1-minute charts. Focus on liquid markets with tight spreads. Use level 2 data for order flow.</p>
                  <p className="text-sm text-muted-foreground"><strong>Exit:</strong> Target 0.1%-0.5% per trade. Cut losses immediately if trade goes against you. Speed is critical.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ========== SECTION 2: TREND FOLLOWING STRATEGIES ========== */}
          <h2 id="trend" className="text-2xl font-semibold mt-12 mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Trend Following Strategies
          </h2>
          
          <p className="text-muted-foreground mb-6">
            "The trend is your friend"—these strategies capitalize on established market momentum, riding trends until clear reversal signals appear. Understanding <Link to="/learn/trend-analysis" className="text-primary hover:underline">trend analysis</Link> is essential for these approaches.
          </p>

          <div className="space-y-4 mb-8">
            {/* Strategy 4: Trend Following */}
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">5. Classic Trend Following</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Follow established market trends—bullish or bearish—until a clear reversal signal appears. This systematic approach removes emotion and lets profits run.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <p className="font-medium">Weeks to months</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trade Frequency:</span>
                    <p className="font-medium">5–15 trades/month</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notable Traders:</span>
                    <p className="font-medium">Ed Seykota, Richard Dennis (Turtle Traders)</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2"><strong>Entry:</strong> Enter when price breaks above 20-day high (long) or below 20-day low (short). Confirm with <Link to="/learn/moving-averages" className="text-primary hover:underline">moving average</Link> alignment.</p>
                  <p className="text-sm text-muted-foreground"><strong>Exit:</strong> Trail stop using 10-day low (for longs) or 10-day high (for shorts). Let winners run.</p>
                </div>
              </CardContent>
            </Card>

            {/* Strategy 6: Breakout Trading */}
            <Card className="border-l-4 border-l-accent">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">6. Breakout Trading</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Enter trades when price breaks out of a predefined <Link to="/learn/support-resistance" className="text-primary hover:underline">support or resistance</Link> level, leading to strong momentum. Read our comprehensive <Link to="/learn/breakout-trading" className="text-primary hover:underline">breakout trading guide</Link> for detailed entry/exit rules.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <p className="font-medium">Intraday to multi-day</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trade Frequency:</span>
                    <p className="font-medium">10–30 trades/month</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notable Traders:</span>
                    <p className="font-medium">Jesse Livermore (pioneer of breakout strategies)</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2"><strong>Entry:</strong> Enter on close above resistance with <Link to="/learn/volume-analysis" className="text-primary hover:underline">volume surge</Link> (50%+ above average).</p>
                  <p className="text-sm text-muted-foreground"><strong>Exit:</strong> Target measured move (pattern height projected from breakout). Stop below breakout level.</p>
                </div>
              </CardContent>
            </Card>

            {/* Strategy 11: Momentum Trading */}
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">7. Momentum Trading</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Enter trades when price is moving strongly in one direction, betting that momentum will continue. This strategy requires quick decision-making and strict risk management.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <p className="font-medium">Intraday to multi-day</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trade Frequency:</span>
                    <p className="font-medium">10–50 trades/month</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notable Traders:</span>
                    <p className="font-medium">Stanley Druckenmiller</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2"><strong>Entry:</strong> Buy when <Link to="/learn/rsi-indicator" className="text-primary hover:underline">RSI</Link> breaks above 50 with price above all major MAs. Volume should confirm the move.</p>
                  <p className="text-sm text-muted-foreground"><strong>Exit:</strong> Exit when momentum indicators show divergence or price breaks below short-term MA.</p>
                </div>
              </CardContent>
            </Card>

            {/* Strategy 12: Pullback Trading */}
            <Card className="border-l-4 border-l-accent">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">8. Pullback Trading</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Buy an asset after a temporary pullback within an uptrend, getting better entry prices than chasing breakouts. This combines trend following with patience.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <p className="font-medium">Days to weeks</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trade Frequency:</span>
                    <p className="font-medium">5–20 trades/month</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notable Traders:</span>
                    <p className="font-medium">Linda Raschke (pullback specialist)</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2"><strong>Entry:</strong> Wait for pullback to <Link to="/learn/fibonacci-retracements" className="text-primary hover:underline">Fibonacci 38.2%-61.8%</Link> or 20 EMA, then buy on reversal candle.</p>
                  <p className="text-sm text-muted-foreground"><strong>Exit:</strong> Target previous swing high. Stop below pullback low.</p>
                </div>
              </CardContent>
            </Card>

            {/* More trend strategies */}
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">9. Moving Average Crossovers</h3>
                  <Badge variant="outline" className="bg-green-600/10 text-green-400 border-green-600/30">Beginner</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Use <Link to="/learn/moving-averages" className="text-primary hover:underline">moving average</Link> crossovers (e.g., 50-day crossing 200-day) as trade signals. Simple yet effective for identifying trend changes.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <p className="font-medium">Days to weeks</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trade Frequency:</span>
                    <p className="font-medium">5–10 trades/month</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notable Traders:</span>
                    <p className="font-medium">Richard Donchian (pioneered MAs)</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2"><strong>Entry:</strong> Buy when fast MA (9 or 20) crosses above slow MA (50 or 200). Confirm with price above both.</p>
                  <p className="text-sm text-muted-foreground"><strong>Exit:</strong> Sell when fast MA crosses below slow MA or price closes below slow MA.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">10. Golden Cross / Death Cross</h3>
                  <Badge variant="outline" className="bg-green-600/10 text-green-400 border-green-600/30">Beginner</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  A long-term trend strategy where the 50-day MA crossing the 200-day MA signals bullish (Golden Cross) or bearish (Death Cross) momentum. Used for major trend identification.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <p className="font-medium">Months to years</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trade Frequency:</span>
                    <p className="font-medium">3–10 trades/year</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notable Traders:</span>
                    <p className="font-medium">William O'Neil, institutional investors</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2"><strong>Entry:</strong> Buy on Golden Cross (50 MA crosses above 200 MA). Consider waiting for confirmation close above both.</p>
                  <p className="text-sm text-muted-foreground"><strong>Exit:</strong> Exit on Death Cross or when price closes significantly below 200 MA.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">11. Donchian Channel Strategy</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  A trend-following strategy using upper and lower Donchian channel bands to identify breakout opportunities. This was the core method of the famous Turtle Traders.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <p className="font-medium">Weeks to months</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trade Frequency:</span>
                    <p className="font-medium">10–15 trades/month</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notable Traders:</span>
                    <p className="font-medium">Richard Donchian, Turtle Traders</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2"><strong>Entry:</strong> Buy when price breaks above 20-day high (upper channel). Short when price breaks below 20-day low.</p>
                  <p className="text-sm text-muted-foreground"><strong>Exit:</strong> Use 10-day low for long exits, 10-day high for short exits. Trail as trend continues.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">12. Channel Trading</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Trade within parallel price channels, buying at support and selling at resistance. Combine with <Link to="/learn/trend-analysis" className="text-primary hover:underline">trendline analysis</Link> for dynamic S/R levels.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <p className="font-medium">Hours to weeks</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trade Frequency:</span>
                    <p className="font-medium">10–20 trades/month</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notable Traders:</span>
                    <p className="font-medium">Widely used in forex and stocks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ========== SECTION 3: TECHNICAL INDICATOR STRATEGIES ========== */}
          <h2 id="technical" className="text-2xl font-semibold mt-12 mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Technical Indicator Strategies
          </h2>
          
          <p className="text-muted-foreground mb-6">
            These strategies use mathematical indicators to generate buy/sell signals. Understanding indicators like <Link to="/learn/rsi-indicator" className="text-primary hover:underline">RSI</Link>, <Link to="/learn/macd-indicator" className="text-primary hover:underline">MACD</Link>, and <Link to="/learn/moving-averages" className="text-primary hover:underline">moving averages</Link> is crucial.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* RSI Strategy */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">13. RSI Strategy</h3>
                  <Badge variant="outline" className="bg-green-600/10 text-green-400 border-green-600/30">Beginner</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Use the <Link to="/learn/rsi-indicator" className="text-primary hover:underline">Relative Strength Index</Link> to identify overbought (above 70) and oversold (below 30) conditions.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Intraday to swing</p>
                  <p><strong>Frequency:</strong> 5–20 trades/month</p>
                  <p><strong>Creator:</strong> J. Welles Wilder Jr.</p>
                </div>
              </CardContent>
            </Card>

            {/* MACD Crossover */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">14. MACD Crossover</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Trade based on the <Link to="/learn/macd-indicator" className="text-primary hover:underline">MACD</Link> line crossing above or below the signal line for momentum confirmation.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to trend</p>
                  <p><strong>Frequency:</strong> 5–15 trades/month</p>
                  <p><strong>Creator:</strong> Gerald Appel</p>
                </div>
              </CardContent>
            </Card>

            {/* Bollinger Bands */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">15. Bollinger Bands</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Buy near the lower band (oversold) and sell near the upper band (overbought). Works best in ranging markets.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Intraday to swing</p>
                  <p><strong>Frequency:</strong> 10–25 trades/month</p>
                  <p><strong>Creator:</strong> John Bollinger</p>
                </div>
              </CardContent>
            </Card>

            {/* Fibonacci */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">16. Fibonacci Retracements</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Use <Link to="/learn/fibonacci-retracements" className="text-primary hover:underline">Fibonacci ratios</Link> (38.2%, 50%, 61.8%) to identify potential support/resistance levels.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to trend</p>
                  <p><strong>Frequency:</strong> 5–20 trades/month</p>
                  <p><strong>Origin:</strong> Leonardo Fibonacci</p>
                </div>
              </CardContent>
            </Card>

            {/* Stochastic */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">17. Stochastic Oscillator</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Compare closing price to price range over a period. Buy when %K crosses above %D in oversold zone.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing trading</p>
                  <p><strong>Frequency:</strong> 10–20 trades/month</p>
                  <p><strong>Use:</strong> Overbought/oversold + crossovers</p>
                </div>
              </CardContent>
            </Card>

            {/* RSI Divergence */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">18. RSI Divergence</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Look for divergences between price and <Link to="/learn/rsi-indicator" className="text-primary hover:underline">RSI</Link> to detect potential reversals before they happen.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing trading</p>
                  <p><strong>Frequency:</strong> 5–15 trades/month</p>
                  <p><strong>Signal:</strong> Price makes higher high, RSI makes lower high = bearish</p>
                </div>
              </CardContent>
            </Card>

            {/* MACD Divergence */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">19. MACD Divergence</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Trade based on divergence between <Link to="/learn/macd-indicator" className="text-primary hover:underline">MACD</Link> and price action to anticipate reversals.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing trading</p>
                  <p><strong>Frequency:</strong> 10–15 trades/month</p>
                  <p><strong>Use:</strong> Trend exhaustion signals</p>
                </div>
              </CardContent>
            </Card>

            {/* Volume Analysis */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">20. Volume-Based Entry</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Use <Link to="/learn/volume-analysis" className="text-primary hover:underline">volume analysis</Link> to confirm trend strength and determine entry/exit points.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Intraday to swing</p>
                  <p><strong>Frequency:</strong> Based on volume spikes</p>
                  <p><strong>Pioneer:</strong> Joseph Granville</p>
                </div>
              </CardContent>
            </Card>

            {/* EMA Crossover */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">21. EMA Crossover</h3>
                  <Badge variant="outline" className="bg-green-600/10 text-green-400 border-green-600/30">Beginner</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Generate buy/sell signals when a short-term EMA crosses a longer-term EMA. More responsive than SMA crossovers.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to trend</p>
                  <p><strong>Frequency:</strong> 10–20 trades/month</p>
                  <p><strong>Popular combo:</strong> 9 EMA / 21 EMA</p>
                </div>
              </CardContent>
            </Card>

            {/* Keltner Channel */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">22. Keltner Channel</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  A volatility-based indicator adjusting bands around price using ATR. Similar to Bollinger Bands but smoother.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing trading</p>
                  <p><strong>Frequency:</strong> Few trades/week</p>
                  <p><strong>Creator:</strong> Chester Keltner</p>
                </div>
              </CardContent>
            </Card>

            {/* Parabolic SAR */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">23. Parabolic SAR</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  A trend-following system placing dots above/below price to identify trend strength and reversals.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Intraday to swing</p>
                  <p><strong>Frequency:</strong> Multiple/week</p>
                  <p><strong>Best for:</strong> Trailing stops</p>
                </div>
              </CardContent>
            </Card>

            {/* Ichimoku Cloud */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">24. Ichimoku Cloud</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  A comprehensive indicator providing support, resistance, trend direction, and momentum in one view.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to trend</p>
                  <p><strong>Frequency:</strong> 10–20 trades/month</p>
                  <p><strong>Origin:</strong> Japanese institutional traders</p>
                </div>
              </CardContent>
            </Card>

            {/* ATR Stop Loss */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">25. ATR-Based Stop Loss</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Set stop losses based on Average True Range to account for volatility. Prevents being stopped out by normal price noise.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to trend</p>
                  <p><strong>Frequency:</strong> 5–15 trades/month</p>
                  <p><strong>Creator:</strong> J. Welles Wilder Jr.</p>
                </div>
              </CardContent>
            </Card>

            {/* VWMA */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">26. VWMA Strategy</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Volume Weighted Moving Average places more weight on high-volume periods. More responsive than standard MAs.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Intraday to swing</p>
                  <p><strong>Frequency:</strong> Few trades/day to week</p>
                  <p><strong>Use:</strong> Dynamic support/resistance</p>
                </div>
              </CardContent>
            </Card>

            {/* Pivot Points */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">27. Pivot Points</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Use calculated pivot points to determine potential S/R levels for intraday trades. Popular with floor traders.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Intraday to swing</p>
                  <p><strong>Frequency:</strong> 10–40 trades/month</p>
                  <p><strong>Origin:</strong> Floor traders, market makers</p>
                </div>
              </CardContent>
            </Card>

            {/* Market Breadth */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">28. Market Breadth</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Use indicators like Advance-Decline Line to measure overall market participation and confirm trends.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to long-term</p>
                  <p><strong>Frequency:</strong> Few trades/month</p>
                  <p><strong>Use:</strong> Broad market analysis</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ========== SECTION 4: CHART PATTERN STRATEGIES ========== */}
          <h2 id="patterns" className="text-2xl font-semibold mt-12 mb-6 flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Chart Pattern Strategies
          </h2>
          
          <p className="text-muted-foreground mb-6">
            Chart patterns provide visual cues for potential price movements. Master these by studying our pattern-specific guides in the <Link to="/chart-patterns/library" className="text-primary hover:underline">Pattern Library</Link>.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* Support & Resistance */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">29. Support & Resistance</h3>
                  <Badge variant="outline" className="bg-green-600/10 text-green-400 border-green-600/30">Beginner</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Buy near <Link to="/learn/support-resistance" className="text-primary hover:underline">support levels</Link> (price floors) and sell near resistance (price ceilings).
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Intraday to swing</p>
                  <p><strong>Frequency:</strong> 10–50 trades/month</p>
                  <p><strong>Notable:</strong> Mark Douglas</p>
                </div>
              </CardContent>
            </Card>

            {/* Range Trading */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">30. Range-Bound Trading</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Buy at the bottom and sell at the top of a clearly defined price range. Works in consolidating markets.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Days to weeks</p>
                  <p><strong>Frequency:</strong> 5–15 trades/month</p>
                  <p><strong>Notable:</strong> Paul Tudor Jones</p>
                </div>
              </CardContent>
            </Card>

            {/* Candlestick Patterns */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">31. Candlestick Patterns</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Trade based on <Link to="/learn/candlestick-patterns" className="text-primary hover:underline">candlestick formations</Link> like Doji, Hammer, and Engulfing patterns.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Intraday to swing</p>
                  <p><strong>Frequency:</strong> Varies by pattern</p>
                  <p><strong>Pioneer:</strong> Steve Nison</p>
                </div>
              </CardContent>
            </Card>

            {/* Price Action */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">32. Price Action Basics</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Trade purely based on <Link to="/learn/price-action-basics" className="text-primary hover:underline">market structure</Link>, candlesticks, and S/R without indicators.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Intraday to swing</p>
                  <p><strong>Frequency:</strong> Varies by setups</p>
                  <p><strong>Specialist:</strong> Al Brooks</p>
                </div>
              </CardContent>
            </Card>

            {/* Head and Shoulders */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">33. Head and Shoulders</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  A reversal pattern signaling trend changes. Study the full <Link to="/learn/head-and-shoulders" className="text-primary hover:underline">Head & Shoulders guide</Link>.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to position</p>
                  <p><strong>Frequency:</strong> 5–10 trades/month</p>
                  <p><strong>Signal:</strong> Trend exhaustion</p>
                </div>
              </CardContent>
            </Card>

            {/* Triangles */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">34. Triangle Patterns</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Trade <Link to="/learn/triangle-patterns" className="text-primary hover:underline">symmetrical, ascending, and descending triangles</Link> for breakout opportunities.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing trading</p>
                  <p><strong>Frequency:</strong> 10–15 trades/month</p>
                  <p><strong>Signal:</strong> Consolidation before breakout</p>
                </div>
              </CardContent>
            </Card>

            {/* Flags and Pennants */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">35. Flags & Pennants</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Trend continuation patterns indicating brief consolidation. See our <Link to="/learn/flag-pennant" className="text-primary hover:underline">Flag & Pennant guide</Link>.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing trading</p>
                  <p><strong>Frequency:</strong> 10–15 trades/month</p>
                  <p><strong>Signal:</strong> Trend continuation</p>
                </div>
              </CardContent>
            </Card>

            {/* Double Top/Bottom */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">36. Double Top/Bottom</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Classic reversal patterns. Study the full <Link to="/learn/double-top-bottom" className="text-primary hover:underline">Double Top/Bottom guide</Link>.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to position</p>
                  <p><strong>Frequency:</strong> 5–10 trades/month</p>
                  <p><strong>Signal:</strong> Trend reversal</p>
                </div>
              </CardContent>
            </Card>

            {/* Cup and Handle */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">37. Cup and Handle</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Bullish continuation pattern. Read our <Link to="/learn/cup-and-handle" className="text-primary hover:underline">Cup & Handle analysis</Link>.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to position</p>
                  <p><strong>Frequency:</strong> 3–8 trades/month</p>
                  <p><strong>Pioneer:</strong> William O'Neil</p>
                </div>
              </CardContent>
            </Card>

            {/* Wedge Patterns */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">38. Wedge Patterns</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Rising and falling wedges signal reversals. See <Link to="/learn/wedge-patterns" className="text-primary hover:underline">Wedge Patterns guide</Link>.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing trading</p>
                  <p><strong>Frequency:</strong> 5–10 trades/month</p>
                  <p><strong>Signal:</strong> Reversal after breakout</p>
                </div>
              </CardContent>
            </Card>

            {/* Harmonic Patterns */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">39. Harmonic Patterns</h3>
                  <Badge variant="outline" className="bg-red-600/10 text-red-400 border-red-600/30">Expert</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Gartley, Bat, Butterfly, Crab patterns using <Link to="/learn/fibonacci-retracements" className="text-primary hover:underline">Fibonacci</Link> for precise reversals.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to position</p>
                  <p><strong>Frequency:</strong> 5–10 trades/month</p>
                  <p><strong>Developer:</strong> Scott Carney</p>
                </div>
              </CardContent>
            </Card>

            {/* Elliott Wave */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">40. Elliott Wave Analysis</h3>
                  <Badge variant="outline" className="bg-red-600/10 text-red-400 border-red-600/30">Expert</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Identify cyclical price patterns using wave sequences to predict market trends.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to position</p>
                  <p><strong>Frequency:</strong> 5–10 trades/month</p>
                  <p><strong>Theorist:</strong> Ralph Nelson Elliott</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ========== SECTION 5: REVERSAL STRATEGIES ========== */}
          <h2 className="text-2xl font-semibold mt-12 mb-6 flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Reversal & Mean Reversion Strategies
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">41. Reversal Trading</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Anticipate market reversals using price action and divergence indicators. High risk, high reward.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Intraday to swing</p>
                  <p><strong>Frequency:</strong> 5–15 trades/month</p>
                  <p><strong>Notable:</strong> Steve Cohen</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">42. Mean Reversion</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Assume prices revert to historical averages after extreme movements. Works in ranging markets.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing trading</p>
                  <p><strong>Frequency:</strong> 5–15 trades/month</p>
                  <p><strong>Use:</strong> Oversold/overbought extremes</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">43. Gap Trading</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Trade price gaps between closing and opening prices. Gaps often fill, providing trade opportunities.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Intraday to swing</p>
                  <p><strong>Frequency:</strong> 10–20 trades/month</p>
                  <p><strong>Notable:</strong> Joel Greenblatt</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">44. Pin Bar Strategy</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Trade reversal <Link to="/learn/pin-bar-strategy" className="text-primary hover:underline">pin bar</Link> candlesticks at key S/R levels for high-probability entries.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing trading</p>
                  <p><strong>Frequency:</strong> 5–15 trades/month</p>
                  <p><strong>Signal:</strong> Rejection at key level</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ========== SECTION 6: RISK MANAGEMENT ========== */}
          <h2 id="risk" className="text-2xl font-semibold mt-12 mb-6 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Risk Management Strategies
          </h2>
          
          <p className="text-muted-foreground mb-6">
            These aren't standalone trading strategies but essential frameworks that improve any approach. Master <Link to="/learn/risk-management" className="text-primary hover:underline">risk management</Link> before risking real capital.
          </p>

          <div className="space-y-4 mb-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">45. Risk-Reward Ratio Management</h3>
                  <Badge variant="outline" className="bg-green-600/10 text-green-400 border-green-600/30">Essential</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Set predefined risk-to-reward ratios (e.g., 1:2 or 1:3) to manage losses and optimize profits. A 1:2 RR means risking $100 to make $200—even a 40% win rate is profitable.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <p className="font-medium">All timeframes</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Application:</span>
                    <p className="font-medium">Every single trade</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Expert:</span>
                    <p className="font-medium">Van Tharp (risk management pioneer)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">46. Position Sizing</h3>
                  <Badge variant="outline" className="bg-green-600/10 text-green-400 border-green-600/30">Essential</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Calculate <Link to="/learn/position-sizing" className="text-primary hover:underline">position size</Link> based on account risk (1-2%) and stop loss distance. Never risk more than you can afford to lose.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Rule:</span>
                    <p className="font-medium">Risk 1-2% per trade max</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Calculation:</span>
                    <p className="font-medium">Position = (Account × Risk%) / Stop Distance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">47. Dollar-Cost Averaging (DCA)</h3>
                  <Badge variant="outline" className="bg-green-600/10 text-green-400 border-green-600/30">Beginner</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Invest a fixed amount at regular intervals regardless of price. This mitigates timing risk and averages your entry over time.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <p className="font-medium">Long-term (months/years)</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frequency:</span>
                    <p className="font-medium">Weekly or monthly</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notable Advocates:</span>
                    <p className="font-medium">Warren Buffett, passive index investors</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">48. Dynamic Stop Loss</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Adjust stop-loss levels dynamically based on volatility, trend strength, or technical indicators instead of fixed prices.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Methods:</strong> Trailing ATR, Parabolic SAR, swing lows</p>
                  <p><strong>Benefit:</strong> Locks in profits while giving room to breathe</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">49. Time-Based Exit</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Close trades at a predefined time rather than price to reduce exposure to volatility. Common in day trading.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Advocate:</strong> Larry Williams</p>
                  <p><strong>Use:</strong> Day trading, avoiding overnight risk</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">50. Sector Diversification</h3>
                  <Badge variant="outline" className="bg-green-600/10 text-green-400 border-green-600/30">Beginner</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Allocate investments across different market sectors to minimize risk exposure. Core principle of modern portfolio theory.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Expert:</strong> Ray Dalio (Bridgewater Associates)</p>
                  <p><strong>Rebalance:</strong> Quarterly or annually</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ========== SECTION 7: ADVANCED STRATEGIES ========== */}
          <h2 id="advanced" className="text-2xl font-semibold mt-12 mb-6 flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Advanced Trading Strategies
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">51. Pairs Trading</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  A market-neutral strategy taking long and short positions in correlated assets, profiting from price divergence.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to position</p>
                  <p><strong>Use:</strong> Hedge funds, quant trading</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">52. Volume Spread Analysis</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Analyze price-<Link to="/learn/volume-analysis" className="text-primary hover:underline">volume</Link> relationships to detect hidden institutional activity.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Creator:</strong> Tom Williams</p>
                  <p><strong>Signal:</strong> Supply/demand imbalances</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">53. Wyckoff Method</h3>
                  <Badge variant="outline" className="bg-red-600/10 text-red-400 border-red-600/30">Expert</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Trade based on institutional order flow, accumulation, and distribution phases. "Smart money" analysis.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Developer:</strong> Richard Wyckoff</p>
                  <p><strong>Focus:</strong> Market structure phases</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">54. Market Profile Trading</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Examine price distribution over time to identify value areas and high-volume nodes for entries.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Day to swing</p>
                  <p><strong>Use:</strong> Futures, options trading</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">55. Order Flow / DOM Trading</h3>
                  <Badge variant="outline" className="bg-red-600/10 text-red-400 border-red-600/30">Expert</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Analyze real-time buy/sell orders using Depth of Market to anticipate price movements.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Intraday scalping</p>
                  <p><strong>Use:</strong> Prop traders, market makers</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">56. Footprint Analysis</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Visualize volume distribution at each price level to detect buying/selling pressure imbalances.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Use:</strong> Futures traders</p>
                  <p><strong>Signal:</strong> Volume delta at price</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">57. Wolfe Wave Trading</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Identify five-wave price structures to forecast precise breakout and reversal points.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Developer:</strong> Bill Wolfe</p>
                  <p><strong>Timeframe:</strong> Swing to position</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">58. Fractal-Based Trading</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Identify repeating patterns in charts to anticipate reversals and trend continuation.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Developer:</strong> Bill Williams</p>
                  <p><strong>Timeframe:</strong> Swing to position</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">59. Gann Theory</h3>
                  <Badge variant="outline" className="bg-red-600/10 text-red-400 border-red-600/30">Expert</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Trade using geometric angles and price-time relationships developed by W.D. Gann.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Developer:</strong> W.D. Gann</p>
                  <p><strong>Focus:</strong> Time cycles, geometric levels</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">60. Point-and-Figure Charts</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  A charting technique filtering out minor fluctuations to identify significant trends and breakouts.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to position</p>
                  <p><strong>Benefit:</strong> Removes time-based noise</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">61. Renko Chart Trading</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Price-based charting that removes noise and focuses on significant trends for clearer breakout signals.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to position</p>
                  <p><strong>Benefit:</strong> Clear trend visualization</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">62. Earnings Season Trading</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Trade stocks around earnings reports, capitalizing on pre/post announcement volatility.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing trading</p>
                  <p><strong>Frequency:</strong> 10–30 trades/quarter</p>
                  <p><strong>Notable:</strong> Peter Lynch</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">63. Forex Carry Trade</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Borrow low-interest currency and invest in high-interest currency, profiting from rate differential.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Long-term (months to years)</p>
                  <p><strong>Use:</strong> Institutional investors, hedge funds</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">64. Grid Trading</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Place buy/sell orders at predefined price intervals, profiting from market fluctuations systematically.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Intraday to swing</p>
                  <p><strong>Frequency:</strong> 50–200 trades/month (automated)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">65. Liquidity Zone Analysis</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Identify key price areas where institutional buying/selling occurs for potential reversals.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Intraday to swing</p>
                  <p><strong>Use:</strong> Order flow traders</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ========== SECTION 8: OPTIONS STRATEGIES ========== */}
          <h2 id="options" className="text-2xl font-semibold mt-12 mb-6 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Options Trading Strategies
          </h2>
          
          <p className="text-muted-foreground mb-6">
            Options offer leverage and flexibility but require understanding of Greeks, time decay, and volatility. These strategies range from income generation to directional speculation.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">66. Covered Call</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Hold stock and sell call options for passive income. Limited upside but generates consistent premium.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Position trading</p>
                  <p><strong>Best for:</strong> Income-focused investors</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">67. Iron Condor</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Neutral strategy selling OTM call and put spreads. Profits when price stays within a range.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to position</p>
                  <p><strong>Best for:</strong> Low volatility periods</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">68. Butterfly Spread</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Combine multiple strikes to benefit from minimal price movement. Profits from time decay.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Swing to position</p>
                  <p><strong>Use:</strong> Around earnings, low volatility</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">69. Straddle/Strangle</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Buy both call and put options, expecting significant price movement in either direction.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Days to weeks</p>
                  <p><strong>Best for:</strong> Before major news events</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">70. Delta Neutral Hedging</h3>
                  <Badge variant="outline" className="bg-red-600/10 text-red-400 border-red-600/30">Expert</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Adjust positions to remain neutral to directional changes while profiting from volatility.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Use:</strong> Options market makers</p>
                  <p><strong>Skill:</strong> Greeks understanding required</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">71. Gamma Scalping</h3>
                  <Badge variant="outline" className="bg-red-600/10 text-red-400 border-red-600/30">Expert</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Dynamic hedging strategy adjusting positions to profit from gamma exposure changes.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Intraday adjustments</p>
                  <p><strong>Use:</strong> Volatility traders</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ========== SECTION 9: ALGORITHMIC & QUANTITATIVE ========== */}
          <h2 id="algo" className="text-2xl font-semibold mt-12 mb-6 flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Algorithmic & Quantitative Strategies
          </h2>
          
          <p className="text-muted-foreground mb-6">
            These strategies use computer programs, mathematical models, and AI to execute trades. Many require programming skills or access to specialized platforms. Explore our <Link to="/members/scripts" className="text-primary hover:underline">Script Generator</Link> to create automated trading scripts.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">72. Algorithmic Trading</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Use computer programs to execute trades automatically based on predefined rules.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Frequency:</strong> Varies by algorithm</p>
                  <p><strong>Use:</strong> Hedge funds, institutions</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">73. High-Frequency Trading</h3>
                  <Badge variant="outline" className="bg-red-600/10 text-red-400 border-red-600/30">Expert</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Execute thousands of trades per second using ultra-low latency systems.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Microseconds</p>
                  <p><strong>Firms:</strong> Citadel, Virtu Financial</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">74. Arbitrage Trading</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Exploit price differences of the same asset across markets for risk-free profit.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Timeframe:</strong> Seconds to minutes</p>
                  <p><strong>Use:</strong> Quant funds, institutions</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">75. Quantitative Models</h3>
                  <Badge variant="outline" className="bg-red-600/10 text-red-400 border-red-600/30">Expert</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Use mathematical models and statistical methods for systematic trading.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Firms:</strong> Two Sigma, DE Shaw</p>
                  <p><strong>Skills:</strong> Math, statistics, programming</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">76. Statistical Arbitrage</h3>
                  <Badge variant="outline" className="bg-red-600/10 text-red-400 border-red-600/30">Expert</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Use mean-reversion techniques and statistical models to identify mispriced assets.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Use:</strong> Market-neutral hedge funds</p>
                  <p><strong>Frequency:</strong> Hundreds of trades/month</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">77. Market Making</h3>
                  <Badge variant="outline" className="bg-red-600/10 text-red-400 border-red-600/30">Expert</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Provide liquidity by placing buy/sell orders, profiting from bid-ask spreads.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Firms:</strong> Citadel Securities, Optiver</p>
                  <p><strong>Frequency:</strong> Thousands of trades/day</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">78. Sentiment Analysis Trading</h3>
                  <Badge variant="outline" className="bg-orange-600/10 text-orange-400 border-orange-600/30">Advanced</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Use AI to analyze news, social media, and sentiment to predict price movements.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Use:</strong> Hedge funds like Bridgewater</p>
                  <p><strong>Data:</strong> Twitter, news, Reddit</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">79. Dark Pool Analysis</h3>
                  <Badge variant="outline" className="bg-red-600/10 text-red-400 border-red-600/30">Expert</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Track institutional trading activity in dark pools to predict large market moves.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Use:</strong> Hedge funds, institutions</p>
                  <p><strong>Data:</strong> Hidden liquidity flows</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">80. Machine Learning Predictions</h3>
                  <Badge variant="outline" className="bg-red-600/10 text-red-400 border-red-600/30">Expert</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Use AI to analyze large datasets and predict market movements algorithmically.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Pioneer:</strong> Renaissance Technologies</p>
                  <p><strong>Skills:</strong> Python, ML, data science</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">81. Pine Script Automation</h3>
                  <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/30">Intermediate</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Create custom indicators and automated strategies using TradingView's Pine Script.
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Platform:</strong> TradingView</p>
                  <p><strong>Use:</strong> Custom indicators, alerts</p>
                </div>
                <Link to="/members/scripts" className="inline-flex items-center text-primary text-sm mt-2 hover:underline">
                  Try our Script Generator <ChevronRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Additional Strategies in Summary Cards */}
          <h2 className="text-2xl font-semibold mt-12 mb-6">More Strategies at a Glance</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 text-sm">
            {[
              { num: 82, name: "Martingale Strategy", level: "Expert", desc: "Double position after losses" },
              { num: 83, name: "Anti-Martingale", level: "Intermediate", desc: "Increase size on wins" },
              { num: 84, name: "Risk Parity Portfolio", level: "Advanced", desc: "Equal risk allocation" },
              { num: 85, name: "Crypto Arbitrage", level: "Advanced", desc: "Cross-exchange price gaps" },
              { num: 86, name: "Correlation Trading", level: "Advanced", desc: "Trade correlated pairs" },
              { num: 87, name: "Dark Cloud Cover", level: "Intermediate", desc: "Bearish reversal candle" },
              { num: 88, name: "Hedge Fund Replication", level: "Intermediate", desc: "Follow 13F filings" },
              { num: 89, name: "TPO Analysis", level: "Advanced", desc: "Time Price Opportunity" },
              { num: 90, name: "Advanced Fibonacci", level: "Advanced", desc: "Extensions and clusters" },
              { num: 91, name: "Algo Mean Reversion", level: "Expert", desc: "Automated reversion" },
              { num: 92, name: "News Event Trading", level: "Advanced", desc: "Trade around announcements" },
              { num: 93, name: "Sector Rotation", level: "Intermediate", desc: "Rotate across sectors" },
              { num: 94, name: "Value Investing", level: "Beginner", desc: "Fundamental analysis" },
              { num: 95, name: "Growth Investing", level: "Beginner", desc: "High-growth companies" },
              { num: 96, name: "Dividend Investing", level: "Beginner", desc: "Income-focused stocks" },
              { num: 97, name: "Index Investing", level: "Beginner", desc: "Passive ETF approach" },
              { num: 98, name: "Momentum Rotation", level: "Intermediate", desc: "Rotate to top performers" },
              { num: 99, name: "Factor Investing", level: "Advanced", desc: "Value, momentum, quality" },
              { num: 100, name: "Multi-Strategy Approach", level: "Expert", desc: "Combine multiple methods" },
            ].map(s => (
              <div key={s.num} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50">
                <span className="text-primary font-bold text-xs">{s.num}.</span>
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-muted-foreground text-xs">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trading Psychology Section */}
          <Card className="mb-8 bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                The Missing Strategy: Trading Psychology
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                No strategy works without the right mindset. Even the best system fails when emotions take over. Master these psychological skills alongside your technical approach:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <span><Link to="/learn/trading-psychology" className="text-primary hover:underline">Trading Psychology</Link> — Understanding your emotional triggers and biases</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <span><Link to="/learn/trading-discipline" className="text-primary hover:underline">Trading Discipline</Link> — Following your rules consistently</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <span><Link to="/learn/fear-and-greed" className="text-primary hover:underline">Fear and Greed</Link> — Managing the two dominant market emotions</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <span><Link to="/learn/trading-journal" className="text-primary hover:underline">Trading Journal</Link> — Documenting and learning from every trade</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Final CTA */}
          <Card>
            <CardHeader>
              <CardTitle>Put These Strategies Into Practice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Knowledge without action is just potential. Use our tools to backtest strategies, generate trading scripts, and practice in a risk-free environment before committing real capital.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link to="/chart-patterns/strategies">
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Explore Strategy Library
                  </button>
                </Link>
                <Link to="/strategy-workspace">
                  <button className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
                    Backtest Strategies
                  </button>
                </Link>
                <Link to="/members/scripts">
                  <button className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
                    Generate Trading Scripts
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </article>
      </div>
    </div>
  );
};

export default TradingStrategiesGuide;
