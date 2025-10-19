import { Link } from "react-router-dom";
import { ArrowLeft, TrendingDown, TrendingUp, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import wedgePatterns from "@/assets/wedge-patterns.png";

const WedgePatterns = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Rising and Falling Wedge Patterns</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Chart Patterns</span>
            <span>•</span>
            <span>8 min read</span>
            <span>•</span>
            <span>Reversal Patterns</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <TrendingDown className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Wedge patterns are powerful reversal formations with 68% success rates. Unlike triangles, 
              wedges slope in the direction of the prior trend before reversing.
            </AlertDescription>
          </Alert>

          <div className="my-8 rounded-lg overflow-hidden border border-border">
            <img 
              src={wedgePatterns} 
              alt="Rising and Falling Wedge Patterns" 
              className="w-full h-auto"
            />
          </div>

          {/* Rising Wedge */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Rising Wedge (Bearish Reversal)</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The Rising Wedge forms during an uptrend with both support and resistance lines sloping upward, 
            but converging. This indicates weakening momentum despite higher prices—a classic sign of exhaustion.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-4">Pattern Characteristics</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Both trend lines slope upward and converge</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Lower line (support) rises faster than upper line (resistance)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Volume decreases as pattern develops</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Breaks downward 68% of time (Bulkowski)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Average decline of 19% after breakdown</span>
              </li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Trading the Rising Wedge
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Entry:</strong> Enter short when price breaks below support line with increased volume.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Stop Loss:</strong> Place above the most recent swing high or above resistance line.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            <strong>Target:</strong> Measure pattern height at widest point, subtract from breakdown level. 
            Conservative target is 50% of measured move.
          </p>

          {/* Falling Wedge */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Falling Wedge (Bullish Reversal)</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The Falling Wedge forms during a downtrend with both lines sloping downward but converging. 
            This shows weakening selling pressure despite lower prices—buyers are stepping in.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-4">Pattern Characteristics</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Both trend lines slope downward and converge</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Upper line (resistance) falls faster than lower line (support)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Volume contracts during formation</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Breaks upward 68% of time (Bulkowski)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Average rise of 35% after breakout</span>
              </li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Trading the Falling Wedge
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Entry:</strong> Enter long when price breaks above resistance line with strong volume.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Stop Loss:</strong> Place below the most recent swing low or below support line.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            <strong>Target:</strong> Measure pattern height at widest point, add to breakout level. 
            Target full measured move for optimal risk-reward.
          </p>

          {/* Key Differences from Triangles */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Wedges vs. Triangles: Key Differences</h2>
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Direction of Slope</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <strong>Wedges:</strong> Both lines slope in same direction (up or down).<br/>
                <strong>Triangles:</strong> Lines slope in opposite directions or one is horizontal.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pattern Type</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <strong>Wedges:</strong> Primarily reversal patterns (go against the wedge slope).<br/>
                <strong>Triangles:</strong> Primarily continuation patterns (follow prior trend).
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Breakout Direction</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <strong>Wedges:</strong> Break opposite to slope direction.<br/>
                <strong>Triangles:</strong> Can break either direction, often continuing trend.
              </CardContent>
            </Card>
          </div>

          {/* Volume Analysis */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Volume Confirmation</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Volume behavior is critical for wedge pattern reliability:
          </p>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Volume should steadily decrease during wedge formation</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Breakout requires 50%+ above average volume for confirmation</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Declining volume shows weakening momentum—key reversal signal</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Volume spike on breakout validates pattern and increases success rate</span>
              </li>
            </ul>
          </div>

          {/* Common Mistakes */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Common Trading Mistakes</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Confusing wedges with triangles—check slope direction</li>
                <li>• Trading against the expected breakout direction</li>
                <li>• Entering before clear boundary violation</li>
                <li>• Ignoring volume—low-volume breakouts often fail</li>
                <li>• Setting profit targets too conservatively (aim for full measured move)</li>
                <li>• Not waiting for daily close confirmation</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Statistics */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Performance Statistics</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <h3 className="font-semibold mb-3">Rising Wedge (Bearish):</h3>
            <ul className="space-y-2 text-muted-foreground mb-6">
              <li>✓ Success Rate: 68%</li>
              <li>✓ Average Decline: 19%</li>
              <li>✓ Formation Time: 1-3 months typical</li>
              <li>✓ Throwback Rate: 54%</li>
            </ul>
            <h3 className="font-semibold mb-3">Falling Wedge (Bullish):</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ Success Rate: 68%</li>
              <li>✓ Average Rise: 35%</li>
              <li>✓ Formation Time: 1-3 months typical</li>
              <li>✓ Pullback Rate: 55%</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Pro Tips</h2>
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Multiple Timeframe Confirmation</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Check higher timeframes to confirm overall trend context. Wedges forming as part of larger 
                patterns have higher reliability.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Early Warning Signs</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Watch for momentum divergence on RSI or MACD. Bearish divergence in rising wedge and bullish 
                divergence in falling wedge increase pattern reliability.
              </CardContent>
            </Card>
          </div>
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
                  Compare and contrast wedges with triangle continuation patterns.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/volume-analysis">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Volume Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Master volume confirmation techniques essential for wedge patterns.
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Quiz CTA */}
        <div className="mt-12">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold mb-2">Test Your Knowledge</h3>
              <p className="text-muted-foreground mb-6">
                Practice identifying wedge patterns and their breakout directions
              </p>
              <Link to="/quiz/trading-knowledge">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  Take the Quiz
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WedgePatterns;
