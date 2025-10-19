import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import cupHandlePattern from "@/assets/cup-handle-pattern.png";

const CupAndHandle = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Cup and Handle Pattern: Growth Stock Strategy</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Chart Patterns</span>
            <span>•</span>
            <span>9 min read</span>
            <span>•</span>
            <span>Bullish Continuation</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <TrendingUp className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              The Cup and Handle is one of the most profitable bullish patterns with 86% success rate and 
              45% average gain according to Bulkowski. A favorite among growth stock traders.
            </AlertDescription>
          </Alert>

          <div className="my-8 rounded-lg overflow-hidden border border-border">
            <img 
              src={cupHandlePattern} 
              alt="Cup and Handle Pattern Chart" 
              className="w-full h-auto"
            />
          </div>

          {/* Pattern Structure */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Pattern Structure</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The Cup and Handle pattern consists of two distinct phases: a rounded bottom "cup" followed by a 
            small downward drift "handle" before the breakout. This pattern typically forms over 1-6 months.
          </p>

          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">The Cup (7 weeks to 6 months)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Forms a "U" shape with rounded bottom. Left side shows decline, bottom shows consolidation, 
                right side shows recovery to prior high level. Should be smooth and gradual, not V-shaped.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">The Handle (1-4 weeks)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                A short pullback or sideways consolidation after cup forms. Should retrace no more than 38% 
                of the cup's advance. Often slopes slightly downward.
              </CardContent>
            </Card>
          </div>

          {/* Key Characteristics */}
          <h3 className="text-xl font-semibold mt-8 mb-4">Critical Pattern Rules</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Prior Uptrend:</strong> Pattern must form after upward trend</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Rounded Bottom:</strong> Cup must be U-shaped, not V-shaped</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Cup Depth:</strong> Typically 12-33% correction from prior high</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Handle Depth:</strong> Must retrace less than 38% of cup's gain</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Handle Duration:</strong> 1-4 weeks typical, no more than 1/3 of cup</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Volume Pattern:</strong> Decreases in cup/handle, spikes on breakout</span>
              </li>
            </ul>
          </div>

          {/* Volume Analysis */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Volume Confirmation</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Volume behavior is crucial for Cup and Handle success:
          </p>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Left Side of Cup:</strong> High volume during initial decline</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Cup Bottom:</strong> Volume decreases as selling exhausts</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Right Side of Cup:</strong> Volume gradually increases on recovery</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Handle Formation:</strong> Volume decreases again (low interest)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Breakout:</strong> Volume must spike 50%+ above average (demand surge)</span>
              </li>
            </ul>
          </div>

          {/* Trading Strategy */}
          <h2 className="text-2xl font-bold mt-12 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Trading Strategy
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Entry Point:</strong> Enter long when price closes above the handle's resistance with 
            volume 50%+ above average. Conservative entry waits for daily close; aggressive enters on breakout bar.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Stop Loss:</strong> Place below the handle's lowest point. Alternative: Place below the 
            lowest point of the cup for wider stop (less likely to trigger on pullback).
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            <strong>Profit Target:</strong> Measure cup depth from bottom to rim, add to breakout point. 
            Bulkowski's research shows 45% average gain, so many traders scale out at 30-40% and let remainder run.
          </p>

          {/* Ideal Pattern Checklist */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Ideal Pattern Checklist</h2>
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cup Symmetry</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Best patterns have relatively symmetrical cups—time to decline roughly equals time to recover. 
                Avoid lopsided formations.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Strong Left Side</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Left side should show steady decline, not crash. Gradual decline indicates healthy correction 
                rather than panic selling.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tight Handle</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Handle should be small relative to cup—ideally less than 1/3 the duration and depth. 
                Tighter handles lead to more explosive breakouts.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">New Highs</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Best results when cup forms at or near stock's all-time highs. Breaking out to new highs 
                removes overhead resistance.
              </CardContent>
            </Card>
          </div>

          {/* Common Mistakes */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Common Trading Mistakes</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Trading V-shaped bottoms instead of U-shaped cups</li>
                <li>• Accepting handles deeper than 38% retrace (too volatile)</li>
                <li>• Entering before clear breakout above handle resistance</li>
                <li>• Ignoring volume—low-volume breakouts often fail</li>
                <li>• Trading cups that form in downtrends (not continuation)</li>
                <li>• Setting stops too tight within the handle</li>
                <li>• Not scaling out—taking full profits at measured move</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Statistics */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Bulkowski's Research Statistics</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ <strong>Success Rate:</strong> 86% (one of highest among all patterns)</li>
              <li>✓ <strong>Average Gain:</strong> 45% from breakout to ultimate high</li>
              <li>✓ <strong>Formation Time:</strong> 1-6 months typical (median 3 months)</li>
              <li>✓ <strong>Pullback Rate:</strong> 45% of patterns show minor pullback after breakout</li>
              <li>✓ <strong>Best Market:</strong> Bull markets and growth stocks</li>
              <li>✓ <strong>Optimal Volume:</strong> 50%+ spike on breakout</li>
            </ul>
          </div>

          {/* Real-World Application */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Best Market Conditions</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Cup and Handle patterns work best in specific conditions:
          </p>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3 text-muted-foreground">
              <li>✓ <strong>Bull Markets:</strong> Strong overall market trend enhances pattern success</li>
              <li>✓ <strong>Growth Stocks:</strong> Technology and growth sectors show best results</li>
              <li>✓ <strong>High Relative Strength:</strong> Stocks outperforming market during cup formation</li>
              <li>✓ <strong>Strong Fundamentals:</strong> Increasing earnings, revenue growth</li>
              <li>✓ <strong>Institutional Interest:</strong> Accumulation visible in volume patterns</li>
            </ul>
          </div>

          {/* Pro Tips */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Professional Tips</h2>
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Multiple Timeframe Analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Check weekly charts for larger cup formations. Daily chart handles within weekly cup patterns 
                can offer excellent low-risk entry points.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fundamental Catalyst</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Best breakouts often coincide with positive news, earnings beats, or new product launches. 
                Combine technical with fundamental catalysts.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scaling Strategy</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Take partial profits at measured move (cup depth), move stop to breakeven, let remainder run 
                for extended gains beyond 45% average.
              </CardContent>
            </Card>
          </div>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/double-top-bottom">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Double Bottom Pattern</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Compare Cup and Handle with Double Bottom reversal patterns.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/volume-analysis">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Volume Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Master volume confirmation essential for Cup and Handle breakouts.
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
                Practice identifying Cup and Handle patterns for profitable growth stock trades
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

export default CupAndHandle;
