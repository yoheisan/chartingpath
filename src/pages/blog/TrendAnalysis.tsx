import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TrendAnalysis = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Trend Lines and Trend Analysis</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Technical Analysis</span>
            <span>•</span>
            <span>9 min read</span>
            <span>•</span>
            <span>Core Concepts</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <TrendingUp className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              "The trend is your friend" - One of the most important principles in trading. 
              Understanding trends and how to trade with them is essential for consistent profitability.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">What is a Trend?</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            A trend is the general direction in which the price of an asset is moving. Trends can persist for 
            extended periods and understanding them helps traders align their positions with market momentum.
          </p>

          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Uptrend (Bull Market)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Characterized by higher highs and higher lows. Each peak and trough is higher than the previous one, 
                indicating strong buying pressure and bullish sentiment.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Downtrend (Bear Market)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Characterized by lower highs and lower lows. Each peak and trough is lower than the previous one, 
                indicating strong selling pressure and bearish sentiment.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sideways Trend (Range-Bound)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Price moves horizontally with no clear direction. Characterized by relatively equal highs and lows, 
                indicating market indecision and equilibrium between buyers and sellers.
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">How to Draw Trend Lines</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Trend lines are straight lines drawn on a chart connecting significant swing points to visualize the trend direction.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-4">Uptrend Line (Support Line)</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-6">
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              <li>Identify at least two swing lows during an uptrend</li>
              <li>Draw a straight line connecting these lows</li>
              <li>The line should slope upward (rising from left to right)</li>
              <li>Validate with a third touch point for confirmation</li>
              <li>The more touches, the stronger and more significant the trend line</li>
            </ol>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Downtrend Line (Resistance Line)</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              <li>Identify at least two swing highs during a downtrend</li>
              <li>Draw a straight line connecting these highs</li>
              <li>The line should slope downward (falling from left to right)</li>
              <li>Validate with a third touch point for confirmation</li>
              <li>Steeper angles often indicate unsustainable trends</li>
            </ol>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Trend Line Principles</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Validation Rule:</strong> A trend line is valid with at least 2 touches, reliable with 3+</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Angle Matters:</strong> Steep trends break faster; gentle slopes last longer</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Never Force It:</strong> If you have to adjust too much, the line isn't significant</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Timeframe Context:</strong> Weekly/daily trend lines are more powerful than hourly</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Break Confirmation:</strong> Wait for close beyond line, not just a wick</span>
              </li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Trading with Trend Lines</h2>
          
          <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Buy at Trend Line Support (Uptrend)
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            In an uptrend, the trend line acts as dynamic support. Strategy:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
            <li>Wait for price to approach the trend line</li>
            <li>Look for bullish confirmation (hammer, bullish engulfing, volume spike)</li>
            <li>Enter long position when price bounces off the line</li>
            <li>Place stop loss just below the trend line (2-5% buffer)</li>
            <li>Take profit at recent resistance or next target level</li>
          </ul>

          <h3 className="text-xl font-semibold mt-8 mb-4">Sell at Trend Line Resistance (Downtrend)</h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            In a downtrend, the trend line acts as dynamic resistance. Strategy:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-8">
            <li>Wait for price to approach the downward trend line</li>
            <li>Look for bearish confirmation (shooting star, bearish engulfing)</li>
            <li>Enter short position when price rejects the line</li>
            <li>Place stop loss just above the trend line (2-5% buffer)</li>
            <li>Take profit at recent support or next downside target</li>
          </ul>

          <h2 className="text-2xl font-bold mt-12 mb-4">Trend Line Breaks: Trading Reversals</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            When a trend line is broken, it often signals a potential trend reversal or at minimum a pause in the current trend.
          </p>

          <Alert className="mb-8">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription>
              <strong>Important:</strong> A single candle touching or slightly breaking a trend line does not confirm a break. 
              Wait for a decisive close beyond the trend line with increased volume for confirmation.
            </AlertDescription>
          </Alert>

          <h3 className="text-xl font-semibold mt-8 mb-4">Breakout Trading Strategy</h3>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-3 mb-8">
            <li>
              <strong>Confirm the Break:</strong> Wait for candle close beyond trend line (not just a wick)
            </li>
            <li>
              <strong>Volume Check:</strong> Look for volume increase (50%+ above average) on the break
            </li>
            <li>
              <strong>Wait for Retest:</strong> Often price returns to test the broken trend line (now acts as support/resistance)
            </li>
            <li>
              <strong>Enter on Confirmation:</strong> Enter when price rejects the retest or continues in breakout direction
            </li>
            <li>
              <strong>Set Stop Loss:</strong> Place stop beyond the retest level or the opposite side of trend line
            </li>
          </ol>

          <h2 className="text-2xl font-bold mt-12 mb-4">Advanced Trend Concepts</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Internal Trend Lines</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Shorter-term trend lines within the major trend. Help identify entry points within the broader trend. 
                Breaking an internal line doesn't necessarily mean the major trend is over.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trend Channels</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Two parallel trend lines (support and resistance). Price oscillates within the channel. 
                Trade bounces off channel boundaries or breakouts beyond the channel.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Multiple Timeframe Analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                The strongest signals occur when trends align across timeframes. For example, weekly uptrend + daily uptrend = 
                high probability long setups.
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Common Mistakes</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Trading against the trend - "catching a falling knife"</li>
                <li>• Drawing trend lines to fit your bias - remain objective</li>
                <li>• Using only one touch point - not valid</li>
                <li>• Ignoring higher timeframe trends</li>
                <li>• Overreacting to minor breaks or wicks through trend lines</li>
                <li>• Drawing too many lines - focus on the most obvious ones</li>
              </ul>
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-12">
            <li>The trend is your friend - trade with the trend, not against it</li>
            <li>Valid trend lines need at least 2 touches, ideally 3 or more</li>
            <li>Steeper trend lines break faster; gentle slopes are more sustainable</li>
            <li>Wait for close beyond trend line for break confirmation</li>
            <li>Use volume to confirm trend line breaks and bounces</li>
            <li>Multiple timeframe alignment provides highest probability setups</li>
          </ol>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/support-resistance">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Support and Resistance</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Master the foundation of technical analysis with S/R levels.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/triangle-patterns">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Triangle Patterns</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Learn to trade triangle patterns that form along trend lines.
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;
