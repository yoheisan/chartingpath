import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PatternChartDisplay } from "@/components/PatternChartDisplay";

const FlagPennant = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Flags and Pennants: Continuation Pattern Mastery</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Chart Patterns</span>
            <span>•</span>
            <span>7 min read</span>
            <span>•</span>
            <span>Continuation Patterns</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <Zap className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Flags and Pennants are high-probability short-term continuation patterns with 80%+ success rates. 
              They represent brief consolidations before trend resumption—perfect for swing traders.
            </AlertDescription>
          </Alert>

          {/* Bull Flag */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Bull Flag Pattern</h2>
          
          <div className="my-8 rounded-lg overflow-hidden border border-border bg-[hsl(223,39%,4%)]">
            <PatternChartDisplay patternType="bull-flag" />
          </div>
          
          <p className="text-muted-foreground leading-relaxed mb-6">
            The Bull Flag forms during a strong uptrend. After a sharp price advance (the "flagpole"), 
            price consolidates in a tight downward-sloping channel before breaking out to continue the uptrend.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-4">Pattern Characteristics</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Sharp upward price move (flagpole) precedes pattern</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Consolidation forms parallel channel sloping slightly downward</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Flag portion typically lasts 5-15 days</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Volume decreases during consolidation</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">88% success rate with 8-day average duration (Bulkowski)</span>
              </li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Trading Bull Flags
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Entry:</strong> Enter long on breakout above upper channel line with volume spike.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Stop Loss:</strong> Place below the lower channel line or recent swing low.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            <strong>Target:</strong> Measure flagpole height, add to breakout point. Target equals or exceeds pole length.
          </p>

          {/* Bear Flag */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Bear Flag Pattern</h2>
          
          <div className="my-8 rounded-lg overflow-hidden border border-border bg-[hsl(223,39%,4%)]">
            <PatternChartDisplay patternType="bear-flag" />
          </div>
          
          <p className="text-muted-foreground leading-relaxed mb-6">
            The Bear Flag forms during a downtrend. After a sharp decline (flagpole), price consolidates in a 
            tight upward-sloping channel before breaking down to continue the downtrend.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-4">Pattern Characteristics</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Sharp downward move (flagpole) precedes pattern</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Consolidation forms parallel channel sloping slightly upward</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Flag typically lasts 9 days on average</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Volume contracts during consolidation</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">90% success rate (Bulkowski)</span>
              </li>
            </ul>
          </div>

          {/* Pennants */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Pennant Patterns</h2>
          
          <div className="my-8 rounded-lg overflow-hidden border border-border bg-[hsl(223,39%,4%)]">
            <PatternChartDisplay patternType="pennant" />
          </div>
          
          <p className="text-muted-foreground leading-relaxed mb-6">
            Pennants are similar to flags but form small symmetrical triangles instead of channels. 
            They indicate even tighter consolidation and often lead to explosive breakouts.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-4">Bull Pennant Characteristics</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Sharp upward flagpole followed by small symmetrical triangle</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Converging trend lines form pennant shape</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Duration typically 14 days (Bulkowski)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">84% success rate for bull pennants</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">80% success rate for bear pennants</span>
              </li>
            </ul>
          </div>

          {/* Key Differences */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Flags vs. Pennants: Key Differences</h2>
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consolidation Shape</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <strong>Flags:</strong> Parallel channel (rectangular shape).<br/>
                <strong>Pennants:</strong> Converging trend lines (small triangle).
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Duration</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <strong>Flags:</strong> 8-9 days average.<br/>
                <strong>Pennants:</strong> 14 days average (slightly longer).
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volume Pattern</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Both show decreasing volume during consolidation and spike on breakout. 
                Pennants often show more pronounced volume decline.
              </CardContent>
            </Card>
          </div>

          {/* Trading Rules */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Universal Trading Rules</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Strong Flagpole Required:</strong> The prior move must be sharp and strong (at least 10%)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Short Duration:</strong> Patterns lasting over 3 weeks lose reliability</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Volume Confirmation:</strong> Breakout needs 50%+ above average volume</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Flagpole Target:</strong> Measure pole height, project from breakout</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Trend Context:</strong> Only trade in direction of strong prior trend</span>
              </li>
            </ul>
          </div>

          {/* Common Mistakes */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Common Mistakes</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Trading patterns without strong flagpole (weak prior trend)</li>
                <li>• Entering during consolidation instead of waiting for breakout</li>
                <li>• Accepting low-volume breakouts (often fail)</li>
                <li>• Trading flags/pennants that last too long (over 3 weeks)</li>
                <li>• Setting profit targets too conservatively (aim for pole length)</li>
                <li>• Ignoring overall market context and sector strength</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Performance Data */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Bulkowski's Performance Statistics</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Bull Flags:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✓ Success Rate: 88%</li>
                  <li>✓ Avg Duration: 8 days</li>
                  <li>✓ Avg Rise: 25-35%</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Bear Flags:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✓ Success Rate: 90%</li>
                  <li>✓ Avg Duration: 9 days</li>
                  <li>✓ Avg Decline: 20-30%</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Bull Pennants:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✓ Success Rate: 84%</li>
                  <li>✓ Avg Duration: 14 days</li>
                  <li>✓ Avg Rise: 30-40%</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Bear Pennants:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✓ Success Rate: 80%</li>
                  <li>✓ Avg Duration: 14 days</li>
                  <li>✓ Avg Decline: 25-35%</li>
                </ul>
              </div>
            </div>
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
                  Compare pennants with symmetrical triangles and other consolidation patterns.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/volume-analysis">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Volume Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Master volume confirmation crucial for flag and pennant breakouts.
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
                Practice identifying flags and pennants for quick profitable trades
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

export default FlagPennant;
