import { Link } from "react-router-dom";
import { ArrowLeft, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FibonacciRetracements = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Fibonacci Retracements: Finding Key Support and Resistance</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Technical Analysis</span>
            <span>•</span>
            <span>11 min read</span>
            <span>•</span>
            <span>Price Levels</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <Target className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Fibonacci retracements use mathematical ratios found throughout nature to identify potential support and resistance levels. 
              These levels often coincide with significant price reversals.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Key Fibonacci Levels</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">23.6% Retracement</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Shallow retracement indicating very strong trend. Often seen in parabolic moves. Less commonly used.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">38.2% Retracement</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                First significant retracement level. In strong trends, price often bounces here without deeper pullback.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">50% Retracement</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Not a Fibonacci number but widely watched. Represents half-way point and psychological level. Very significant in practice.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">61.8% Retracement (Golden Ratio)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                The most important Fibonacci level. Known as the Golden Ratio. Price often reverses strongly at this level. 
                Used for high-probability trade entries.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">78.6% Retracement</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Deep retracement level. If price reaches here, trend may be weakening significantly. Often final chance before trend reversal.
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">How to Draw Fibonacci Retracements</h2>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold mb-4">Uptrend Retracements:</h3>
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-6">
              <li>Identify a significant swing low (starting point)</li>
              <li>Identify the most recent swing high (ending point)</li>
              <li>Draw Fibonacci retracement from low to high</li>
              <li>Retracement levels appear below current price</li>
              <li>These levels act as potential support during pullbacks</li>
            </ol>
            <h3 className="text-xl font-semibold mb-4">Downtrend Retracements:</h3>
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              <li>Identify a significant swing high (starting point)</li>
              <li>Identify the most recent swing low (ending point)</li>
              <li>Draw Fibonacci retracement from high to low</li>
              <li>Retracement levels appear above current price</li>
              <li>These levels act as potential resistance during rallies</li>
            </ol>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Trading with Fibonacci Retracements</h2>

          <h3 className="text-xl font-semibold mt-8 mb-4">Entry Strategy</h3>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              <li>Identify strong trend (uptrend or downtrend)</li>
              <li>Draw Fibonacci retracement levels</li>
              <li>Wait for price to pullback to key Fib level (38.2%, 50%, or 61.8%)</li>
              <li>Look for reversal confirmation (candlestick pattern, volume, RSI divergence)</li>
              <li>Enter in trend direction when price bounces off Fib level</li>
            </ol>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Stop Loss and Take Profit</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Stop Loss:</strong> Place beyond next Fibonacci level or recent swing point. 
              If entering at 61.8%, stop goes below 78.6% or swing low.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Take Profit:</strong> Target previous swing high/low, or use Fibonacci extensions (127.2%, 161.8%) 
              for profit targets beyond the original move.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Fibonacci Extensions</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Extensions (127.2%, 161.8%, 261.8%) project potential profit targets beyond the original price move. Used to identify 
            where price might go after completing retracement.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Confluence Zones</h2>
          <Alert className="mb-8">
            <CheckCircle className="h-5 w-5" />
            <AlertDescription>
              <strong>Power of Confluence:</strong> Fibonacci levels become much more powerful when they align with other technical factors 
              like horizontal S/R, moving averages, trend lines, or previous swing points. These "confluence zones" offer highest probability trades.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Common Mistakes</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Drawing Fibs on minor swings instead of significant moves</li>
                <li>• Not waiting for confirmation before entering at Fib levels</li>
                <li>• Using Fibonacci alone without other technical analysis</li>
                <li>• Forcing Fibonacci to fit your bias - be objective</li>
                <li>• Trading against the dominant trend</li>
                <li>• Expecting price to respect every Fib level perfectly</li>
              </ul>
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-12">
            <li>61.8% (Golden Ratio) is the most important Fibonacci level</li>
            <li>50% retracement is not a Fibonacci number but very significant</li>
            <li>Draw from significant swing points, not minor fluctuations</li>
            <li>Wait for confirmation before trading Fib levels</li>
            <li>Confluence zones (Fib + S/R + MA) offer best trades</li>
            <li>Use extensions for profit targets beyond original move</li>
          </ol>
        </article>
      </div>
    </div>
  );
};

export default FibonacciRetracements;
