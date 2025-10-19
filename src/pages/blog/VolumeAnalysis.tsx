import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const VolumeAnalysis = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Volume Analysis: Understanding Market Participation</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Technical Analysis</span>
            <span>•</span>
            <span>8 min read</span>
            <span>•</span>
            <span>Core Concepts</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <BarChart3 className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Volume is the fuel that moves prices. Understanding volume analysis helps confirm trends, 
              identify reversals, and validate breakouts before they occur.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">What is Volume?</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Volume represents the total number of shares or contracts traded during a specific period. 
            It measures market participation and the strength behind price movements.
          </p>

          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold mb-4">Why Volume Matters:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Confirms the strength of price moves</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Validates breakouts and prevents false signals</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Identifies potential reversals through divergence</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Shows institutional accumulation or distribution</span>
              </li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Volume Principles</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">High Volume = Strong Moves</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                When price moves on high volume, it indicates strong conviction. These moves are more likely 
                to continue as they represent genuine shifts in supply and demand.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Low Volume = Weak Moves</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Price moves on low volume lack conviction and are more likely to reverse. These moves often 
                represent temporary fluctuations rather than meaningful trends.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volume Precedes Price</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Smart money often accumulates or distributes before major price moves. Unusual volume 
                increases can signal upcoming significant price action.
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Volume Patterns and Signals</h2>

          <h3 className="text-xl font-semibold mt-8 mb-4">Volume in Trends</h3>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-4">
              <strong className="text-foreground">Healthy Uptrend:</strong> Volume increases on up days, 
              decreases on down days (pullbacks). This shows strong buying interest and weak selling pressure.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Healthy Downtrend:</strong> Volume increases on down days, 
              decreases on up days (bounces). This shows strong selling pressure and weak buying interest.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Volume Divergence</h3>
          <Alert className="mb-8">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription>
              <p className="mb-2">
                <strong>Bearish Divergence:</strong> Price makes new highs but volume decreases. 
                Indicates weakening momentum and potential reversal.
              </p>
              <p>
                <strong>Bullish Divergence:</strong> Price makes new lows but volume decreases. 
                Indicates selling exhaustion and potential bounce.
              </p>
            </AlertDescription>
          </Alert>

          <h3 className="text-xl font-semibold mt-8 mb-4">Volume at Key Levels</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Support Test:</strong> Low volume at support = weak bounce likely; High volume = strong support</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Resistance Test:</strong> Low volume at resistance = weak rejection; High volume = strong resistance</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Consolidation:</strong> Decreasing volume during range-bound movement = preparing for breakout</span>
              </li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Volume Confirmation for Breakouts</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Volume is crucial for confirming the validity of breakouts. Most false breakouts occur on low volume.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-4">Valid Breakout Criteria</h3>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-3 mb-8">
            <li>
              <strong>Volume Surge:</strong> Breakout volume should be 50-100% higher than average
            </li>
            <li>
              <strong>Decreasing Volume Before Break:</strong> Low volume consolidation followed by volume spike
            </li>
            <li>
              <strong>Sustained Volume:</strong> Volume remains elevated for 2-3 bars after breakout
            </li>
            <li>
              <strong>Retest Volume:</strong> Lower volume on pullback to breakout level (retest)
            </li>
          </ol>

          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <strong>False Breakout Warning:</strong> Breakouts on below-average volume have a high failure rate. 
              Wait for volume confirmation before entering breakout trades to avoid traps.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Volume Indicators</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volume Bars</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                The basic volume histogram shown below the price chart. Green bars indicate volume on up days, 
                red bars on down days. Look for spikes relative to average volume.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volume Moving Average</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                A moving average (20-50 period) of volume helps identify when current volume is above or below average. 
                Volume above the MA suggests strong participation.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">On-Balance Volume (OBV)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Cumulative volume indicator that adds volume on up days and subtracts on down days. 
                Divergences between OBV and price can signal reversals.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volume Profile</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Shows volume distribution at different price levels. High volume nodes act as strong support/resistance. 
                Useful for identifying value areas and key price levels.
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Trading Strategies Using Volume</h2>

          <h3 className="text-xl font-semibold mt-8 mb-4">Volume Spike Breakout</h3>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              <li>Identify consolidation with decreasing volume</li>
              <li>Wait for breakout with 50%+ volume increase</li>
              <li>Enter on close above/below consolidation</li>
              <li>Place stop inside consolidation range</li>
              <li>Target measured move (consolidation height)</li>
            </ol>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Volume Divergence Reversal</h3>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              <li>Identify trend with diverging volume (price up/volume down or vice versa)</li>
              <li>Wait for trend line break or reversal pattern</li>
              <li>Enter when volume confirms reversal direction</li>
              <li>Place stop beyond recent high/low</li>
              <li>Target previous support/resistance level</li>
            </ol>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Common Volume Mistakes</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Trading breakouts without volume confirmation</li>
                <li>• Ignoring volume divergences at trend extremes</li>
                <li>• Not comparing current volume to average volume</li>
                <li>• Using volume as the only signal (always combine with price action)</li>
                <li>• Expecting high volume every day (low volume days are normal)</li>
                <li>• Not accounting for time of day or market sessions in intraday trading</li>
              </ul>
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-12">
            <li>Volume confirms the strength of price movements</li>
            <li>High volume breakouts are more reliable than low volume ones</li>
            <li>Volume should increase in the direction of the trend</li>
            <li>Volume divergence can signal trend exhaustion</li>
            <li>Always compare current volume to average volume</li>
            <li>Combine volume analysis with price action and patterns</li>
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
                  Use volume to validate support and resistance levels.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/head-and-shoulders">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Head and Shoulders Pattern</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Learn how volume confirms the H&S pattern formation.
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeAnalysis;
