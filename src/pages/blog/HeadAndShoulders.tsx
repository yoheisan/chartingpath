import { Link } from "react-router-dom";
import { ArrowLeft, TrendingDown, AlertTriangle, Target, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import headShouldersPattern from "@/assets/head-shoulders-pattern.png";
import inverseHeadShouldersPattern from "@/assets/inverse-head-shoulders-pattern.png";

const HeadAndShoulders = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Navigation */}
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        {/* Article Header */}
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Head and Shoulders Pattern: Complete Trading Guide</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Chart Patterns</span>
            <span>•</span>
            <span>8 min read</span>
            <span>•</span>
            <span>Reversal Pattern</span>
          </div>

          {/* Introduction */}
          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <TrendingDown className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              The Head and Shoulders pattern is one of the most reliable reversal patterns in technical analysis, 
              signaling a potential trend change from bullish to bearish.
            </AlertDescription>
          </Alert>

          {/* Pattern Structure */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Pattern Structure</h2>
          
          {/* Chart Image */}
          <div className="my-8 rounded-lg overflow-hidden border border-border">
            <img 
              src={headShouldersPattern} 
              alt="Head and Shoulders Pattern Chart with detailed annotations showing left shoulder, head, right shoulder, neckline, entry point, target, and stop loss levels" 
              className="w-full h-auto"
            />
          </div>

          <p className="text-muted-foreground leading-relaxed mb-6">
            The Head and Shoulders pattern consists of three distinct peaks:
          </p>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Left Shoulder</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                The first peak formed during an uptrend, followed by a pullback to create the first trough.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Head</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                The highest peak, representing the final push to new highs before the reversal begins.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Right Shoulder</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                A lower peak than the head, indicating weakening momentum and buyer exhaustion.
              </CardContent>
            </Card>
          </div>

          {/* Neckline */}
          <h2 className="text-2xl font-bold mt-12 mb-4">The Neckline: Critical Support Level</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The neckline is drawn by connecting the two troughs (lows) between the shoulders and head. 
            This line represents a critical support level, and its break confirms the pattern.
          </p>

          <Alert className="mb-8">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription>
              <strong>Key Point:</strong> The neckline doesn't need to be horizontal—it can slope up or down. 
              A downward-sloping neckline is considered more bearish.
            </AlertDescription>
          </Alert>

          {/* Trading Strategy */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Trading Strategy</h2>
          
          <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Entry Point
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The conservative entry is taken when the price closes below the neckline with increased volume. 
            Aggressive traders may enter on the break of the right shoulder.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-4">Stop Loss Placement</h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Place your stop loss just above the right shoulder or the head, depending on your risk tolerance:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
            <li><strong>Conservative:</strong> Above the head (wider stop, lower risk of premature stop-out)</li>
            <li><strong>Aggressive:</strong> Above the right shoulder (tighter stop, higher risk but better R:R)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-8 mb-4">Profit Target</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The profit target is calculated by measuring the vertical distance from the head to the neckline, 
            then projecting that distance downward from the neckline break point.
          </p>

          {/* Volume Confirmation */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Volume Confirmation</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Volume analysis is crucial for validating the Head and Shoulders pattern:
          </p>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Volume should be highest during the left shoulder formation</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Volume typically decreases during the head formation</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Volume should be even lower during right shoulder formation</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Volume must spike on the neckline break for confirmation</span>
              </li>
            </ul>
          </div>

          {/* Common Mistakes */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Common Mistakes to Avoid</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Entering before neckline break confirmation</li>
                <li>• Ignoring volume analysis during pattern formation</li>
                <li>• Setting stop loss too tight (above right shoulder only)</li>
                <li>• Not waiting for a daily close below the neckline</li>
                <li>• Trading the pattern in low-liquidity markets</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Inverse Pattern */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Inverse Head and Shoulders</h2>
          
          {/* Inverse Pattern Chart Image */}
          <div className="my-8 rounded-lg overflow-hidden border border-border">
            <img 
              src={inverseHeadShouldersPattern} 
              alt="Inverse Head and Shoulders Pattern Chart with detailed annotations showing bullish reversal setup with left shoulder, head, right shoulder, neckline resistance, entry, target, and stop loss levels" 
              className="w-full h-auto"
            />
          </div>

          <p className="text-muted-foreground leading-relaxed mb-6">
            The Inverse Head and Shoulders is the bullish counterpart, appearing at the end of a downtrend. 
            All the same principles apply, but in reverse:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-8">
            <li>Three troughs instead of peaks</li>
            <li>Neckline acts as resistance instead of support</li>
            <li>Breakout occurs to the upside</li>
            <li>Volume increases on the breakout above neckline</li>
          </ul>

          {/* Real-World Application */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Real-World Application</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Head and Shoulders patterns work best when:
          </p>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ They appear after a strong, extended trend</li>
              <li>✓ The pattern takes several weeks to months to form</li>
              <li>✓ Volume characteristics align with the ideal pattern</li>
              <li>✓ The neckline is clearly defined and tested multiple times</li>
              <li>✓ There's high liquidity in the traded instrument</li>
            </ul>
          </div>

          {/* Conclusion */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The Head and Shoulders pattern is a powerful tool when used correctly. Remember to:
          </p>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-12">
            <li>Wait for neckline break confirmation</li>
            <li>Analyze volume throughout pattern formation</li>
            <li>Use proper risk management with appropriate stop losses</li>
            <li>Calculate realistic profit targets based on pattern height</li>
            <li>Practice identifying patterns on historical charts</li>
          </ol>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/double-top-bottom">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Double Top and Bottom Patterns</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Learn about these powerful reversal patterns and how they compare to Head and Shoulders.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/volume-analysis">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Volume Analysis Guide</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Master volume analysis to confirm pattern breakouts and identify false signals.
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
                Take our comprehensive trading quiz to reinforce what you've learned
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

export default HeadAndShoulders;
