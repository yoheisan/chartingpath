import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PatternChartDisplay } from "@/components/PatternChartDisplay";

const RectanglePattern = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Rectangle Pattern: Trading Range Breakouts</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Chart Patterns</span>
            <span>•</span>
            <span>8 min read</span>
            <span>•</span>
            <span>Continuation Pattern</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <BarChart3 className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Rectangle patterns form during consolidation phases and offer excellent risk-reward ratios for breakout traders. 
              Success rate: 73% according to Bulkowski's research.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">What is a Rectangle Pattern?</h2>
          
          <div className="my-8 rounded-lg overflow-hidden border border-border bg-[hsl(223,39%,4%)]">
            <PatternChartDisplay patternType="rectangle" />
          </div>

          <p className="text-muted-foreground leading-relaxed mb-6">
            A rectangle pattern forms when price trades between two parallel horizontal levels - a support level at the bottom 
            and a resistance level at the top. This creates a rectangular box where price bounces back and forth until a 
            breakout occurs.
          </p>

          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Formation Characteristics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-muted-foreground">
                <p>• Horizontal support and resistance lines</p>
                <p>• At least 2 touches on each boundary (ideally 3+)</p>
                <p>• Declining volume during consolidation</p>
                <p>• Duration: 1-6 weeks typically</p>
                <p>• Price oscillates within defined range</p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Types of Rectangle Patterns</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bullish Rectangle (Continuation)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Forms during an uptrend. After breakout above resistance, price typically continues higher. 
                Average gain: 38% post-breakout.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bearish Rectangle (Continuation)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Forms during a downtrend. Breakdown below support usually leads to further decline. 
                Average decline: 22% post-breakdown.
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Trading the Rectangle Pattern</h2>

          <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Entry Strategies
          </h3>
          
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-4">
              <strong className="text-foreground">Conservative Entry:</strong> Wait for breakout above resistance (bullish) 
              or below support (bearish) with volume 50%+ above average. Enter on close beyond boundary.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Aggressive Entry:</strong> Trade bounces within the rectangle. 
              Buy near support, sell near resistance. This requires tighter stops and quick exits.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Stop Loss Placement</h3>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
            <li><strong>Breakout Trades:</strong> Place stop inside rectangle, below support for longs or above resistance for shorts</li>
            <li><strong>Range Trades:</strong> Stop just beyond opposite boundary (stop above resistance for longs at support)</li>
            <li><strong>Buffer Zone:</strong> Allow 2-5% buffer to avoid premature stop-outs from false breaks</li>
          </ul>

          <h3 className="text-xl font-semibold mt-8 mb-4">Profit Targets</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Measured Move Method:</strong> Calculate rectangle height (resistance - support), 
              then project that distance from breakout point.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Example:</strong> If rectangle trades between $50-$60 ($10 range) and breaks out at $60, 
              target is $70 ($60 + $10).
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Volume Analysis</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>During Formation:</strong> Volume should contract/decrease as rectangle develops</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>At Breakout:</strong> Volume must spike significantly (50-100% above average)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>False Breakouts:</strong> Low volume breakouts have high failure rates</span>
              </li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Common Mistakes</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Trading breakouts without volume confirmation</li>
                <li>• Drawing rectangles with sloppy, non-horizontal boundaries</li>
                <li>• Entering too early before clear breakout</li>
                <li>• Not waiting for rectangle to form properly (minimum 4 touches total)</li>
                <li>• Ignoring the prior trend direction</li>
                <li>• Setting profit targets too aggressively</li>
              </ul>
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Key Statistics (Bulkowski)</h2>
          <div className="bg-accent/50 p-6 rounded-lg mb-12">
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ Success Rate: 73% (continuation in trend direction)</li>
              <li>✓ Average Gain: 38% (bullish), 22% decline (bearish)</li>
              <li>✓ Pullback Rate: 60% (price returns to test breakout level)</li>
              <li>✓ Optimal Duration: 3-8 weeks for highest success</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-12">
            <li>Rectangles are high-probability continuation patterns</li>
            <li>Require at least 4 boundary touches for validation</li>
            <li>Volume must confirm breakout direction</li>
            <li>Use measured move method for profit targets</li>
            <li>60% of patterns see pullback after breakout - be patient</li>
          </ol>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/triangle-patterns">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Triangle Patterns</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Learn about other consolidation patterns like triangles.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/breakout-trading">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Breakout Trading Strategy</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Master the art of trading breakouts from all pattern types.
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RectanglePattern;
