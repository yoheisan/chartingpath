import { Link } from "react-router-dom";
import { ArrowLeft, Target, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import supportResistanceChart from "@/assets/support-resistance-chart.png";

const SupportResistance = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Support and Resistance: The Foundation of Technical Analysis</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Technical Analysis</span>
            <span>•</span>
            <span>12 min read</span>
            <span>•</span>
            <span>Core Concepts</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <Target className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Support and resistance levels are the most fundamental concepts in technical analysis. 
              Understanding these levels is essential for identifying entry and exit points in any market.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">What is Support?</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Support is a price level where demand is strong enough to prevent the price from falling further. 
            It acts as a "floor" where buyers consistently step in, creating buying pressure that pushes prices back up.
          </p>

          {/* Chart Image */}
          <div className="my-8 rounded-lg overflow-hidden border border-border">
            <img src={supportResistanceChart} alt="Support and Resistance Levels Chart" className="w-full h-auto" />
          </div>

          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold mb-4">Key Support Characteristics:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Price bounces multiple times off the same level</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Higher volume near support indicates strong buying interest</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">The more times tested, the stronger the support becomes</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Broken support often becomes new resistance</span>
              </li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">What is Resistance?</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Resistance is a price level where selling pressure is strong enough to prevent the price from rising further. 
            It acts as a "ceiling" where sellers consistently enter the market, creating selling pressure that pushes prices back down.
          </p>

          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold mb-4">Key Resistance Characteristics:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Price reverses multiple times at the same level</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Previous highs often become resistance zones</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Psychological round numbers act as strong resistance</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Broken resistance becomes new support</span>
              </li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Types of Support and Resistance</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Horizontal S/R</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                The most common type - straight horizontal lines drawn at previous swing highs (resistance) 
                or swing lows (support). Connect at least 2-3 touch points for validation.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dynamic S/R (Moving Averages)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Moving averages like the 50-day or 200-day MA act as dynamic support/resistance that moves with price. 
                Popular in trending markets.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Psychological Levels</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Round numbers like $100, $1000, or psychological levels like previous all-time highs. 
                These attract significant buying/selling interest.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fibonacci Levels</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Retracement levels at 38.2%, 50%, and 61.8% often act as support/resistance zones. 
                Based on the Fibonacci sequence found throughout nature.
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Role Reversal Concept</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            One of the most important concepts in technical analysis is that support becomes resistance and vice versa:
          </p>
          
          <Alert className="mb-8">
            <TrendingUp className="h-5 w-5" />
            <AlertDescription>
              <strong>Key Principle:</strong> When price breaks through resistance, that level often becomes new support. 
              When price breaks below support, that level typically becomes new resistance. This "role reversal" 
              occurs because traders remember these important levels.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">How to Draw Support and Resistance</h2>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-4 mb-8">
            <li>
              <strong>Use a line chart:</strong> Candlestick wicks can be misleading. Line charts show the clearest levels.
            </li>
            <li>
              <strong>Connect swing points:</strong> Draw lines connecting at least 2-3 swing lows (support) or swing highs (resistance).
            </li>
            <li>
              <strong>Think zones, not lines:</strong> S/R is better viewed as a zone or area rather than an exact price.
            </li>
            <li>
              <strong>Higher timeframes matter more:</strong> Daily and weekly levels are stronger than intraday levels.
            </li>
            <li>
              <strong>Adjust for clarity:</strong> Don't force levels. If it's not obvious, it's probably not significant.
            </li>
          </ol>

          <h2 className="text-2xl font-bold mt-12 mb-4">Trading with Support and Resistance</h2>
          
          <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Entry Strategies
          </h3>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="font-semibold text-foreground">Buy at Support:</span>
                <span>Look for bullish confirmation (candlestick patterns, volume increase) near support before entering long.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-semibold text-foreground">Sell at Resistance:</span>
                <span>Look for bearish confirmation near resistance before entering short positions.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-semibold text-foreground">Breakout Trading:</span>
                <span>Trade the break of S/R with volume confirmation. Wait for retest for higher probability entry.</span>
              </li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Stop Loss Placement</h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Always place stop losses beyond S/R levels to avoid premature stop-outs:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-8">
            <li>For long positions: Place stop 2-5% below support level</li>
            <li>For short positions: Place stop 2-5% above resistance level</li>
            <li>Account for normal price fluctuation and volatility</li>
            <li>Use ATR (Average True Range) to determine appropriate buffer</li>
          </ul>

          <h2 className="text-2xl font-bold mt-12 mb-4">Common Mistakes to Avoid</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Drawing too many lines - focus on the most obvious levels</li>
                <li>• Expecting exact bounces - think zones, not precise prices</li>
                <li>• Ignoring timeframe context - daily/weekly levels are strongest</li>
                <li>• Trading without confirmation - wait for price action signals</li>
                <li>• Placing stops exactly at S/R - use buffer for safety</li>
                <li>• Not adjusting levels as market evolves</li>
              </ul>
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Confluence: The Power of Multiple Levels</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The strongest S/R levels occur when multiple technical factors align (confluence):
          </p>
          <div className="bg-accent/50 p-6 rounded-lg mb-12">
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ Horizontal S/R + 200-day MA = Strong confluence</li>
              <li>✓ Previous high/low + Fibonacci 61.8% = High probability zone</li>
              <li>✓ Psychological level + Trend line = Significant level</li>
              <li>✓ Multiple timeframe S/R alignment = Strongest zones</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-12">
            <li>Support and resistance are the foundation of technical analysis</li>
            <li>View S/R as zones or areas, not exact price points</li>
            <li>Broken support becomes resistance; broken resistance becomes support</li>
            <li>Always wait for confirmation before trading at S/R levels</li>
            <li>Place stops beyond S/R with appropriate buffer</li>
            <li>Confluence zones (multiple factors) offer highest probability trades</li>
          </ol>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/trend-analysis">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Trend Lines and Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Learn how to identify and trade with trend lines to maximize profits.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/volume-analysis">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Volume Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Use volume to confirm breakouts and validate S/R levels.
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportResistance;
