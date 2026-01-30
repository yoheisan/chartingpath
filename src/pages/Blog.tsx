import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, BarChart3, Target, Shield, Brain, GraduationCap } from "lucide-react";

const blogPosts = [
  {
    id: "head-and-shoulders",
    title: "Head and Shoulders Pattern: Complete Trading Guide",
    description: "From novice to professional — master pattern identification, entry strategies, volume confirmation, and risk management with visual examples.",
    category: "Chart Patterns",
    icon: BarChart3,
    readTime: "15 min read",
    skillLevels: ["Novice", "Intermediate", "Advanced", "Professional"]
  },
  {
    id: "double-top-bottom",
    title: "Double Top and Double Bottom Patterns: Complete Guide",
    description: "Comprehensive coverage from basics to advanced techniques — pattern validation, Adam/Eve variations, and professional execution strategies.",
    category: "Chart Patterns",
    icon: TrendingUp,
    readTime: "12 min read",
    skillLevels: ["Novice", "Intermediate", "Advanced"]
  },
  {
    id: "triangle-patterns",
    title: "Triangle Patterns: Ascending, Descending & Symmetrical",
    description: "Complete guide to trading triangle continuation patterns including breakout strategies, volume analysis, and measured move targets.",
    category: "Chart Patterns",
    icon: BarChart3,
    readTime: "14 min read",
    skillLevels: ["Novice", "Intermediate", "Advanced"]
  },
  {
    id: "wedge-patterns",
    title: "Rising and Falling Wedge Patterns",
    description: "Identify and trade wedge patterns with proper entry timing, target calculation, and risk management.",
    category: "Chart Patterns",
    icon: TrendingUp,
    readTime: "8 min read"
  },
  {
    id: "flag-pennant",
    title: "Flags and Pennants: Continuation Pattern Mastery",
    description: "Learn to spot and trade flag and pennant patterns for high-probability trend continuation trades.",
    category: "Chart Patterns",
    icon: BarChart3,
    readTime: "7 min read"
  },
  {
    id: "cup-and-handle",
    title: "Cup and Handle Pattern: Growth Stock Strategy",
    description: "Detailed analysis of the cup and handle pattern including formation criteria and breakout trading.",
    category: "Chart Patterns",
    icon: TrendingUp,
    readTime: "9 min read"
  },
  {
    id: "rectangle-pattern",
    title: "Rectangle Pattern: Trading Range Breakouts",
    description: "Master rectangle consolidation patterns and learn to trade powerful breakouts with high accuracy.",
    category: "Chart Patterns",
    icon: BarChart3,
    readTime: "8 min read"
  },
  {
    id: "support-resistance",
    title: "Support and Resistance: The Foundation of Technical Analysis",
    description: "Deep dive into identifying key support and resistance levels, psychological levels, and horizontal zones.",
    category: "Technical Analysis",
    icon: Target,
    readTime: "12 min read"
  },
  {
    id: "trend-analysis",
    title: "Trend Lines and Trend Analysis",
    description: "Master the art of drawing trend lines, identifying trend reversals, and trading with the trend.",
    category: "Technical Analysis",
    icon: TrendingUp,
    readTime: "9 min read"
  },
  {
    id: "volume-analysis",
    title: "Volume Analysis: Understanding Market Participation",
    description: "Learn how to use volume to confirm trends, identify reversals, and validate breakouts.",
    category: "Technical Analysis",
    icon: BarChart3,
    readTime: "8 min read"
  },
  {
    id: "moving-averages",
    title: "Moving Averages: Dynamic Support and Resistance",
    description: "Complete guide to Simple, Exponential, and Weighted Moving Averages for trend identification and trading signals.",
    category: "Technical Analysis",
    icon: TrendingUp,
    readTime: "10 min read"
  },
  {
    id: "rsi-indicator",
    title: "RSI Indicator: Identifying Overbought and Oversold Conditions",
    description: "Master the Relative Strength Index for momentum trading, divergences, and reversal signals.",
    category: "Technical Analysis",
    icon: BarChart3,
    readTime: "9 min read"
  },
  {
    id: "macd-indicator",
    title: "MACD Indicator: Trend Following and Momentum",
    description: "Learn to use the Moving Average Convergence Divergence indicator for entries, exits, and trend confirmation.",
    category: "Technical Analysis",
    icon: TrendingUp,
    readTime: "10 min read"
  },
  {
    id: "fibonacci-retracements",
    title: "Fibonacci Retracements: Finding Key Support and Resistance",
    description: "Use Fibonacci ratios to identify optimal entry points, profit targets, and reversal zones.",
    category: "Technical Analysis",
    icon: Target,
    readTime: "11 min read"
  },
  {
    id: "candlestick-patterns",
    title: "Japanese Candlestick Patterns Guide",
    description: "Complete guide to bullish and bearish candlestick patterns including doji, hammer, engulfing, and more.",
    category: "Price Action",
    icon: BarChart3,
    readTime: "15 min read"
  },
  {
    id: "price-action-basics",
    title: "Price Action Trading: Reading Raw Market Dynamics",
    description: "Master pure price action trading without indicators - read market structure, swings, and momentum.",
    category: "Price Action",
    icon: TrendingUp,
    readTime: "12 min read"
  },
  {
    id: "breakout-trading",
    title: "Breakout Trading Strategy: Capturing Strong Moves",
    description: "Learn to identify, confirm, and trade breakouts from consolidation patterns with precision.",
    category: "Price Action",
    icon: Target,
    readTime: "10 min read"
  },
  {
    id: "pin-bar-strategy",
    title: "Pin Bar Strategy: High-Probability Reversal Setups",
    description: "Trade pin bars (hammer/shooting star) at key levels for excellent risk-reward opportunities.",
    category: "Price Action",
    icon: BarChart3,
    readTime: "9 min read"
  },
  {
    id: "risk-management",
    title: "Risk Management Fundamentals for Traders",
    description: "Essential risk management principles including position sizing, stop-loss placement, and risk-reward ratios.",
    category: "Risk Management",
    icon: Shield,
    readTime: "10 min read"
  },
  {
    id: "position-sizing",
    title: "Position Sizing: The Key to Long-Term Survival",
    description: "Calculate optimal position sizes based on account risk, volatility, and market conditions.",
    category: "Risk Management",
    icon: Target,
    readTime: "9 min read"
  },
  {
    id: "money-management",
    title: "Money Management: Building and Protecting Capital",
    description: "Advanced capital allocation strategies, portfolio management, and drawdown recovery techniques.",
    category: "Risk Management",
    icon: Shield,
    readTime: "11 min read"
  },
  {
    id: "trading-psychology",
    title: "Trading Psychology: Mastering Your Mindset",
    description: "Overcome emotional trading, develop discipline, and build a winning trader's mindset.",
    category: "Psychology",
    icon: Brain,
    readTime: "11 min read"
  },
  {
    id: "trading-discipline",
    title: "Trading Discipline: Following Your Plan Consistently",
    description: "Build unshakeable discipline to follow your trading rules even during drawdowns and winning streaks.",
    category: "Psychology",
    icon: Target,
    readTime: "10 min read"
  },
  {
    id: "fear-and-greed",
    title: "Overcoming Fear and Greed: The Trader's Greatest Enemies",
    description: "Understand and control the two emotions that destroy more traders than any technical mistake.",
    category: "Psychology",
    icon: Brain,
    readTime: "9 min read"
  },
  {
    id: "trading-journal",
    title: "Trading Journal: Your Path to Consistent Improvement",
    description: "Learn how to maintain a comprehensive trading journal that accelerates your learning curve.",
    category: "Psychology",
    icon: BookOpen,
    readTime: "8 min read"
  },
  // Trading Strategies
  {
    id: "strategies/scalping",
    title: "Scalping Strategy: High-Frequency Trading Guide",
    description: "Master rapid-fire trading with sub-minute entries, tight stops, and high win-rate execution across liquid markets.",
    category: "Trading Strategies",
    icon: TrendingUp,
    readTime: "18 min read",
    skillLevels: ["Intermediate", "Advanced", "Professional"]
  },
  {
    id: "strategies/day-trading",
    title: "Day Trading: Complete Intraday Strategy Guide",
    description: "Close all positions by market close with Opening Range Breakouts, VWAP pullbacks, and momentum entries.",
    category: "Trading Strategies",
    icon: BarChart3,
    readTime: "20 min read",
    skillLevels: ["Novice", "Intermediate", "Advanced"]
  },
  {
    id: "strategies/trend-following",
    title: "Trend Following: Ride Major Market Moves",
    description: "Systematic approach to capturing extended trends using moving averages, ATR stops, and position scaling.",
    category: "Trading Strategies",
    icon: TrendingUp,
    readTime: "22 min read",
    skillLevels: ["Intermediate", "Advanced", "Professional"]
  },
  {
    id: "strategies/breakout",
    title: "Breakout Trading: Capture Explosive Moves",
    description: "Identify and trade powerful breakouts from consolidation patterns with volume confirmation and retest entries.",
    category: "Trading Strategies",
    icon: Target,
    readTime: "18 min read",
    skillLevels: ["Novice", "Intermediate", "Advanced"]
  },
  {
    id: "strategies/mean-reversion",
    title: "Mean Reversion: Counter-Trend Trading Guide",
    description: "Trade statistical extremes back to equilibrium using RSI, Bollinger Bands, and standard deviation analysis.",
    category: "Trading Strategies",
    icon: BarChart3,
    readTime: "20 min read",
    skillLevels: ["Intermediate", "Advanced", "Professional"]
  },
  {
    id: "strategies/momentum",
    title: "Momentum Trading: Ride Strong Price Moves",
    description: "Capture accelerating price action using RSI, MACD histogram, and relative strength analysis.",
    category: "Trading Strategies",
    icon: TrendingUp,
    readTime: "19 min read",
    skillLevels: ["Intermediate", "Advanced"]
  },
  {
    id: "strategies/swing-trading",
    title: "Swing Trading: Multi-Day Position Strategy",
    description: "Hold positions for days to weeks capturing medium-term trends with optimal entry timing.",
    category: "Trading Strategies",
    icon: BarChart3,
    readTime: "21 min read",
    skillLevels: ["Novice", "Intermediate", "Advanced"]
  },
  {
    id: "strategies/position-trading",
    title: "Position Trading: Long-Term Trend Strategy",
    description: "Build wealth through weeks-to-months positions using weekly charts and fundamental confluence.",
    category: "Trading Strategies",
    icon: Target,
    readTime: "23 min read",
    skillLevels: ["Intermediate", "Advanced", "Professional"]
  },
  {
    id: "strategies/macd-strategy",
    title: "MACD Trading Strategy: Signal Line Crossovers",
    description: "Master MACD histogram analysis, zero-line crosses, and divergence setups for trend entries.",
    category: "Trading Strategies",
    icon: BarChart3,
    readTime: "17 min read",
    skillLevels: ["Novice", "Intermediate", "Advanced"]
  },
  {
    id: "strategies/bollinger-bands",
    title: "Bollinger Bands Strategy: Volatility Trading",
    description: "Trade band squeezes, walks, and mean reversion using standard deviation envelopes.",
    category: "Trading Strategies",
    icon: TrendingUp,
    readTime: "18 min read",
    skillLevels: ["Intermediate", "Advanced"]
  },
  {
    id: "strategies/rsi-divergence",
    title: "RSI Divergence Strategy: Catching Reversals",
    description: "Identify trend reversals using regular and hidden RSI divergence patterns with confirmation techniques.",
    category: "Trading Strategies",
    icon: BarChart3,
    readTime: "12 min read",
    skillLevels: ["Intermediate", "Advanced"]
  },
  {
    id: "strategies/vwap",
    title: "VWAP Trading Strategy: Institutional Edge",
    description: "Trade with the institutional benchmark using VWAP bounces, breakouts, and intraday mean reversion.",
    category: "Trading Strategies",
    icon: Target,
    readTime: "10 min read",
    skillLevels: ["Intermediate", "Advanced"]
  },
  {
    id: "strategies/fibonacci",
    title: "Fibonacci Retracement Strategy: Natural Levels",
    description: "Master the Golden Pocket (61.8%) and other Fib levels for high-probability entries and targets.",
    category: "Trading Strategies",
    icon: TrendingUp,
    readTime: "14 min read",
    skillLevels: ["Intermediate", "Advanced"]
  },
  {
    id: "strategies/support-resistance",
    title: "Support & Resistance Strategy: Key Levels",
    description: "Trade bounces, breakouts, and role reversals at horizontal support and resistance zones.",
    category: "Trading Strategies",
    icon: Target,
    readTime: "12 min read",
    skillLevels: ["Novice", "Intermediate", "Advanced"]
  },
  {
    id: "strategies/gap-trading",
    title: "Gap Trading Strategy: Opening Range Plays",
    description: "Profit from price gaps using gap fill, gap-and-go, and opening range breakout strategies.",
    category: "Trading Strategies",
    icon: BarChart3,
    readTime: "11 min read",
    skillLevels: ["Intermediate", "Advanced"]
  }
];

const categories = ["All", "Chart Patterns", "Technical Analysis", "Price Action", "Risk Management", "Psychology", "Trading Strategies"];

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Filter posts based on selected category
  const filteredPosts = selectedCategory === "All" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            ChartingPath Learning Center
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive guides and tutorials to master chart patterns, technical analysis, and trading strategies
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full border transition-colors ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-accent"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => {
            const Icon = post.icon;
            const hasSkillLevels = 'skillLevels' in post && Array.isArray((post as any).skillLevels);
            return (
              <Link key={post.id} to={`/learn/${post.id}`}>
                <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        {hasSkillLevels && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <GraduationCap className="h-3 w-3" />
                            All Levels
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">{post.readTime}</span>
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {post.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm line-clamp-3">{post.description}</p>
                    {hasSkillLevels && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {((post as any).skillLevels as string[]).map((level: string) => (
                          <Badge 
                            key={level} 
                            variant="secondary" 
                            className="text-[10px] px-1.5 py-0"
                          >
                            {level}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Apply Your Knowledge?</CardTitle>
              <CardDescription className="text-base">
                Test your skills with our interactive quizzes and pattern recognition tools
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4 justify-center flex-wrap">
              <Link to="/quiz/trading-knowledge">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  Take Trading Quiz
                </button>
              </Link>
              <Link to="/chart-patterns/generator">
                <button className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
                  Practice Pattern Recognition
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Blog;
