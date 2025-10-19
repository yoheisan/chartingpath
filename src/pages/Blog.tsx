import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, TrendingUp, BarChart3, Target, Shield, Brain } from "lucide-react";

const blogPosts = [
  {
    id: "head-and-shoulders",
    title: "Head and Shoulders Pattern: Complete Trading Guide",
    description: "Master the Head and Shoulders reversal pattern with detailed analysis, entry strategies, and risk management techniques.",
    category: "Chart Patterns",
    icon: BarChart3,
    readTime: "8 min read"
  },
  {
    id: "double-top-bottom",
    title: "Double Top and Double Bottom Patterns",
    description: "Learn to identify and trade these powerful reversal patterns with high probability setups and confirmation strategies.",
    category: "Chart Patterns",
    icon: TrendingUp,
    readTime: "7 min read"
  },
  {
    id: "triangle-patterns",
    title: "Triangle Patterns: Ascending, Descending & Symmetrical",
    description: "Comprehensive guide to trading triangle continuation patterns including breakout strategies and volume analysis.",
    category: "Chart Patterns",
    icon: BarChart3,
    readTime: "10 min read"
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
    id: "candlestick-patterns",
    title: "Japanese Candlestick Patterns Guide",
    description: "Complete guide to bullish and bearish candlestick patterns including doji, hammer, engulfing, and more.",
    category: "Price Action",
    icon: BarChart3,
    readTime: "15 min read"
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
    id: "trading-psychology",
    title: "Trading Psychology: Mastering Your Mindset",
    description: "Overcome emotional trading, develop discipline, and build a winning trader's mindset.",
    category: "Psychology",
    icon: Brain,
    readTime: "11 min read"
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
  }
];

const categories = ["All", "Chart Patterns", "Technical Analysis", "Price Action", "Risk Management", "Psychology"];

const Blog = () => {
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
              className="px-4 py-2 rounded-full border border-border hover:bg-accent transition-colors"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => {
            const Icon = post.icon;
            return (
              <Link key={post.id} to={`/learn/${post.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm text-muted-foreground">{post.readTime}</span>
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {post.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{post.description}</p>
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
