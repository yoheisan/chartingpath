import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import trianglePatterns from "@/assets/triangle-patterns.png";

const TrianglePatterns = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Triangle Patterns: Complete Trading Guide</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Chart Patterns</span>
            <span>•</span>
            <span>10 min read</span>
            <span>•</span>
            <span>Continuation Patterns</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <TrendingUp className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Triangle patterns are among the most reliable continuation patterns in technical analysis. 
              Understanding the three types and their directional biases is essential for successful trading.
            </AlertDescription>
          </Alert>

          {/* Main Image */}
          <div className="my-8 rounded-lg overflow-hidden border border-border">
            <img 
              src={trianglePatterns} 
              alt="Triangle Patterns Comparison Chart" 
              className="w-full h-auto"
            />
          </div>

          {/* Ascending Triangle */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Ascending Triangle (Bullish)</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The Ascending Triangle features a flat horizontal resistance line at the top and a rising support line 
            at the bottom. This pattern demonstrates buyers becoming increasingly aggressive while sellers hold a 
            consistent price level.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-4">Key Characteristics</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Horizontal resistance at consistent price level</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Rising support line connecting higher lows</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Breaks upward 73% of time (Bulkowski)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Average rise of 38% after breakout</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Requires at least 2 touches on each line</span>
              </li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Trading Strategy
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Entry:</strong> Enter long on breakout above resistance with volume 50% above average.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Stop Loss:</strong> Place below the most recent higher low on the rising support line.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            <strong>Target:</strong> Measure triangle height at widest point, add to breakout level.
          </p>

          {/* Descending Triangle */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Descending Triangle (Bearish)</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The Descending Triangle has a flat horizontal support line at the bottom and a falling resistance line 
            at the top. Sellers become increasingly aggressive while buyers defend a specific price level.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-4">Key Characteristics</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Horizontal support at consistent price level</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Falling resistance line connecting lower highs</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Breaks downward 64% of time (Bulkowski)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Average decline of 21% after breakdown</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Minimum 2 touches required on each boundary</span>
              </li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Trading Strategy
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Entry:</strong> Enter short on breakdown below support with increased volume.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Stop Loss:</strong> Place above the most recent lower high on the falling resistance line.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            <strong>Target:</strong> Measure triangle height at widest point, subtract from breakdown level.
          </p>

          {/* Symmetrical Triangle */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Symmetrical Triangle (Neutral)</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The Symmetrical Triangle features both lines converging—a rising support line and a falling resistance line. 
            This represents market equilibrium with gradually decreasing volatility before the breakout.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-4">Key Characteristics</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Rising support line and falling resistance line converge</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Breaks upward 54% of time (slight bullish bias)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Breakout typically occurs at 2/3 to 3/4 of pattern width</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Volume decreases during formation, spikes on breakout</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Direction often continues prior trend</span>
              </li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Trading Strategy
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Entry:</strong> Wait for breakout in either direction with volume confirmation.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Stop Loss:</strong> Place on opposite side of breakout, just inside the triangle boundary.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            <strong>Target:</strong> Measure height at widest point, project in direction of breakout.
          </p>

          {/* Universal Triangle Rules */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Universal Triangle Trading Rules</h2>
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Formation Duration</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Triangles typically form over 1-3 months. Patterns under 3 weeks or over 6 months have lower reliability.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volume Pattern</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Volume should decrease as triangle forms, then spike 50%+ above average on breakout for confirmation.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Breakout Timing</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Breakouts near the apex (convergence point) are less reliable. Best breakouts occur at 2/3 to 3/4 of pattern width.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">False Breakouts</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Wait for daily close beyond boundary line. Intraday violations often return inside the pattern.
              </CardContent>
            </Card>
          </div>

          {/* Statistics Table */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Bulkowski's Performance Data</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-muted-foreground">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">Pattern</th>
                    <th className="text-left py-3 px-4">Success Rate</th>
                    <th className="text-left py-3 px-4">Avg Move</th>
                    <th className="text-left py-3 px-4">Breakout Direction</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-semibold">Ascending</td>
                    <td className="py-3 px-4">73%</td>
                    <td className="py-3 px-4">+38%</td>
                    <td className="py-3 px-4">73% upward</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-semibold">Descending</td>
                    <td className="py-3 px-4">64%</td>
                    <td className="py-3 px-4">-21%</td>
                    <td className="py-3 px-4">64% downward</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Symmetrical</td>
                    <td className="py-3 px-4">71%</td>
                    <td className="py-3 px-4">±32%</td>
                    <td className="py-3 px-4">54% upward</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Common Mistakes */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Common Mistakes to Avoid</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Trading on intraday breakouts without daily close confirmation</li>
                <li>• Entering too early before clear boundary violation</li>
                <li>• Ignoring volume—breakouts without volume spike often fail</li>
                <li>• Drawing trend lines with only one touch point</li>
                <li>• Holding positions when breakout occurs too close to apex</li>
              </ul>
            </AlertDescription>
          </Alert>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/wedge-patterns">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Wedge Patterns</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Learn about rising and falling wedges, similar but distinct from triangles.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/flag-pennant">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Flags and Pennants</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Master these short-term continuation patterns for quick trades.
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
                Practice identifying triangle patterns in our interactive quiz
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

export default TrianglePatterns;
