import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CandlestickPatterns = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Japanese Candlestick Patterns Guide</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Price Action</span>
            <span>•</span>
            <span>15 min read</span>
            <span>•</span>
            <span>Pattern Recognition</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <BarChart3 className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Candlestick patterns provide powerful insights into market psychology and potential price reversals. 
              Developed by Japanese rice traders in the 18th century, these patterns remain essential today.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Understanding Candlesticks</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Each candlestick shows four key price points for a specific time period: Open, High, Low, and Close (OHLC). 
            The body shows the range between open and close, while wicks (shadows) show the high and low.
          </p>

          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Bullish Candlestick
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Close is higher than open, creating a green (or white) body. Represents buying pressure and upward movement.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Bearish Candlestick
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Close is lower than open, creating a red (or black) body. Represents selling pressure and downward movement.
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Single Candlestick Patterns</h2>

          <h3 className="text-xl font-semibold mt-8 mb-4">Doji</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Formation:</strong> Open and close are virtually equal, creating a cross or plus sign shape.
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Signal:</strong> Market indecision. Neither bulls nor bears are in control.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Trading:</strong> At trend extremes, dojis often signal reversals. 
              In sideways markets, they indicate continuation of uncertainty.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Hammer</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Formation:</strong> Small body at top, long lower wick (2-3x body length), little to no upper wick.
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Signal:</strong> Bullish reversal after downtrend. Buyers rejected lower prices.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Confirmation:</strong> Next candle should close above hammer body. Success rate: 60-70%.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Shooting Star</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Formation:</strong> Small body at bottom, long upper wick (2-3x body length), little to no lower wick.
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Signal:</strong> Bearish reversal after uptrend. Sellers rejected higher prices.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Confirmation:</strong> Next candle should close below shooting star body. Success rate: 65%.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Spinning Top</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Formation:</strong> Small body (bullish or bearish) with long upper and lower wicks of similar length.
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Signal:</strong> Indecision between buyers and sellers. Potential reversal at trend extremes.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Context Matters:</strong> After strong trends, indicates exhaustion. In consolidation, indicates uncertainty.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Two-Candlestick Patterns</h2>

          <h3 className="text-xl font-semibold mt-8 mb-4">Bullish Engulfing</h3>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Formation:</strong> Small bearish candle followed by larger bullish candle that completely engulfs the previous body.
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Signal:</strong> Strong bullish reversal. Buyers overwhelmed sellers.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Best Results:</strong> After downtrend, at support levels, with high volume. Success rate: 63%.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Bearish Engulfing</h3>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Formation:</strong> Small bullish candle followed by larger bearish candle that completely engulfs the previous body.
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Signal:</strong> Strong bearish reversal. Sellers overwhelmed buyers.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Best Results:</strong> After uptrend, at resistance levels, with high volume. Success rate: 79%.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Bullish Harami</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Formation:</strong> Large bearish candle followed by small bullish candle contained within previous body.
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Signal:</strong> Potential bullish reversal. Selling pressure decreasing.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Confirmation:</strong> Weaker than engulfing. Wait for third candle confirmation. Success rate: 53%.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Bearish Harami</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Formation:</strong> Large bullish candle followed by small bearish candle contained within previous body.
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Signal:</strong> Potential bearish reversal. Buying pressure decreasing.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Confirmation:</strong> Relatively weak signal. Needs additional bearish confirmation. Success rate: 51%.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Three-Candlestick Patterns</h2>

          <h3 className="text-xl font-semibold mt-8 mb-4">Morning Star (Bullish)</h3>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Formation:</strong> Large bearish candle, small-bodied candle (any color), large bullish candle.
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Signal:</strong> Strong bullish reversal. The "star" (middle candle) shows indecision before buyers take control.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Requirements:</strong> Third candle should close above midpoint of first candle. Success rate: 78%.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Evening Star (Bearish)</h3>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Formation:</strong> Large bullish candle, small-bodied candle (any color), large bearish candle.
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Signal:</strong> Strong bearish reversal. The "star" shows hesitation before sellers dominate.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Requirements:</strong> Third candle should close below midpoint of first candle. Success rate: 72%.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Three White Soldiers (Bullish)</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Formation:</strong> Three consecutive long bullish candles with higher closes, each opening within previous body.
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Signal:</strong> Very strong bullish reversal or continuation. Sustained buying pressure.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Best Context:</strong> After extended downtrend or at major support. High reliability pattern.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Three Black Crows (Bearish)</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Formation:</strong> Three consecutive long bearish candles with lower closes, each opening within previous body.
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Signal:</strong> Very strong bearish reversal or continuation. Sustained selling pressure.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Best Context:</strong> After extended uptrend or at major resistance. High reliability pattern.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Trading Rules</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Context is King:</strong> Patterns work best at support/resistance or trend extremes</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Volume Confirmation:</strong> Higher volume increases pattern reliability</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Wait for Confirmation:</strong> Next candle should confirm the pattern direction</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Combine with Indicators:</strong> Use RSI, MACD, or other tools for confluence</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Set Stops:</strong> Place stops beyond pattern high/low for safety</span>
              </li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Common Mistakes</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Trading patterns in isolation without considering context</li>
                <li>• Not waiting for confirmation candle</li>
                <li>• Ignoring volume during pattern formation</li>
                <li>• Taking every pattern signal (only trade high-probability setups)</li>
                <li>• Using patterns on very short timeframes (less reliable)</li>
                <li>• Not combining with support/resistance analysis</li>
                <li>• Poor stop-loss placement (too tight or too wide)</li>
              </ul>
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-12">
            <li>Candlestick patterns reveal market psychology and potential reversals</li>
            <li>Context matters most - patterns at S/R levels are most reliable</li>
            <li>Always wait for confirmation before entering trades</li>
            <li>Volume increases pattern reliability significantly</li>
            <li>Combine patterns with trend analysis and indicators</li>
            <li>Practice pattern recognition on historical charts before live trading</li>
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
                  Combine candlestick patterns with S/R for highest probability trades.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/volume-analysis">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Volume Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Learn to confirm candlestick patterns with volume.
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandlestickPatterns;
