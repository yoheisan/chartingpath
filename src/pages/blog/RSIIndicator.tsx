import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import rsiChart from "@/assets/rsi-indicator-chart.png";

const RSIIndicator = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">RSI Indicator: Identifying Overbought and Oversold Conditions</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Technical Analysis</span>
            <span>•</span>
            <span>9 min read</span>
            <span>•</span>
            <span>Momentum Indicator</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <BarChart3 className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              The Relative Strength Index (RSI) is one of the most popular momentum oscillators. It measures the speed 
              and magnitude of price changes to identify overbought and oversold conditions.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Understanding RSI</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            RSI oscillates between 0 and 100. It's calculated based on average gains and losses over a specified period (typically 14 periods). 
            RSI helps traders identify potential reversal points and momentum strength.
          </p>

          {/* Chart Image */}
          <div className="my-8 rounded-lg overflow-hidden border border-border">
            <img src={rsiChart} alt="RSI Indicator with Overbought and Oversold Levels" className="w-full h-auto" />
          </div>

          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">RSI Above 70: Overbought</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                When RSI exceeds 70, the asset is considered overbought. This suggests the price may be due for a 
                pullback or reversal. However, strong trends can remain overbought for extended periods.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">RSI Below 30: Oversold</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                When RSI falls below 30, the asset is considered oversold. This suggests the price may be due for a 
                bounce or reversal. Strong downtrends can stay oversold for long periods.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">RSI 40-60: Neutral Zone</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                RSI in the middle range indicates balanced momentum with no extreme conditions. Often seen during 
                consolidation or range-bound markets.
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">RSI Trading Strategies</h2>

          <h3 className="text-xl font-semibold mt-8 mb-4">1. Overbought/Oversold Strategy</h3>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-4">
              <strong className="text-foreground">Buy Signal:</strong> RSI drops below 30 (oversold), then crosses back above 30. 
              Confirms buying pressure returning.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Sell Signal:</strong> RSI rises above 70 (overbought), then crosses back below 70. 
              Confirms selling pressure increasing.
            </p>
          </div>

          <Alert className="mb-8">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription>
              <strong>Important:</strong> In strong trends, RSI can remain overbought ({">"} 70) or oversold ({"<"} 30) for extended periods. 
              Don't counter-trade strong trends solely based on overbought/oversold readings.
            </AlertDescription>
          </Alert>

          <h3 className="text-xl font-semibold mt-8 mb-4">2. RSI Divergence Strategy</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-4">
              <strong className="text-foreground">Bullish Divergence:</strong> Price makes lower lows while RSI makes higher lows. 
              Signals weakening downward momentum and potential reversal up.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Bearish Divergence:</strong> Price makes higher highs while RSI makes lower highs. 
              Signals weakening upward momentum and potential reversal down.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">3. RSI Centerline Cross Strategy</h3>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <p className="text-muted-foreground mb-4">
              <strong className="text-foreground">Bullish:</strong> RSI crosses above 50 (centerline). Confirms momentum shifting bullish. 
              Useful in trending markets.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Bearish:</strong> RSI crosses below 50 (centerline). Confirms momentum shifting bearish.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Advanced RSI Concepts</h2>

          <h3 className="text-xl font-semibold mt-8 mb-4">RSI Support and Resistance</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Draw trend lines on the RSI indicator itself. RSI trend line breaks often precede price trend line breaks, 
            providing early warning signals.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-4">Failure Swings</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Bullish Failure Swing:</strong> RSI drops below 30, bounces above 30, pulls back but stays 
              above 30, then breaks above previous peak. Strong buy signal.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Bearish Failure Swing:</strong> RSI rises above 70, drops below 70, bounces but stays 
              below 70, then breaks below previous trough. Strong sell signal.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">RSI Settings</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ul className="space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Standard: 14 periods</strong> - Most common, balanced approach</li>
              <li><strong className="text-foreground">Short-term: 7-9 periods</strong> - More sensitive, more signals (more false signals too)</li>
              <li><strong className="text-foreground">Long-term: 21-25 periods</strong> - Smoother, fewer but more reliable signals</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Trading Rules</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Use RSI with trend analysis - don't fight strong trends</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Divergences are most powerful at major S/R levels</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Combine RSI with volume for confirmation</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Wait for price confirmation before entering</span>
              </li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Common Mistakes</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Selling just because RSI is overbought in a strong uptrend</li>
                <li>• Buying just because RSI is oversold in a strong downtrend</li>
                <li>• Using RSI alone without price action confirmation</li>
                <li>• Ignoring divergences - they're the most powerful RSI signal</li>
                <li>• Not adjusting RSI periods for different markets and timeframes</li>
              </ul>
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-12">
            <li>RSI measures momentum and identifies overbought/oversold conditions</li>
            <li>RSI {">"} 70 = overbought, RSI {"<"} 30 = oversold</li>
            <li>Divergences are the most reliable RSI signals</li>
            <li>Don't counter-trade strong trends based solely on RSI</li>
            <li>Combine RSI with trend analysis and price action</li>
            <li>14-period RSI is standard, but adjust for your trading style</li>
          </ol>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/macd-indicator">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>MACD Indicator</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Learn another powerful momentum indicator to combine with RSI.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/support-resistance">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Support and Resistance</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  RSI works best when combined with key S/R levels.
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSIIndicator;
