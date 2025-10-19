import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, Target, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import doubleTopPattern from "@/assets/double-top-pattern.png";
import doubleBottomPattern from "@/assets/double-bottom-pattern.png";

const DoubleTopBottom = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Double Top and Double Bottom Patterns</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Chart Patterns</span>
            <span>•</span>
            <span>7 min read</span>
            <span>•</span>
            <span>Reversal Patterns</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <TrendingDown className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Double Tops and Double Bottoms are among the most common reversal patterns, with 79% success rate 
              according to Bulkowski's research. These patterns signal trend exhaustion and potential reversals.
            </AlertDescription>
          </Alert>

          {/* Double Top Section */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Double Top Pattern (Bearish Reversal)</h2>
          
          <div className="my-8 rounded-lg overflow-hidden border border-border">
            <img 
              src={doubleTopPattern} 
              alt="Double Top Pattern Chart" 
              className="w-full h-auto"
            />
          </div>

          <p className="text-muted-foreground leading-relaxed mb-6">
            The Double Top is a bearish reversal pattern that forms after an uptrend. It consists of two peaks 
            at approximately the same price level, separated by a moderate trough.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-4">Pattern Characteristics</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Two peaks at similar price levels (within 3-4% of each other)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Moderate valley between peaks (at least 10% decline)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Volume higher on first peak, lower on second peak</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Neckline drawn at the low point between peaks</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Pattern confirmed when price breaks below neckline</span>
              </li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Trading the Double Top
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Entry:</strong> Enter short when price closes below the neckline with increased volume.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Stop Loss:</strong> Place stop loss above the highest peak, adding a small buffer (1-2%).
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            <strong>Target:</strong> Measure the distance from peaks to neckline, project downward from breakpoint. 
            Average decline is 20% according to Bulkowski.
          </p>

          {/* Double Bottom Section */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Double Bottom Pattern (Bullish Reversal)</h2>
          
          <div className="my-8 rounded-lg overflow-hidden border border-border">
            <img 
              src={doubleBottomPattern} 
              alt="Double Bottom Pattern Chart" 
              className="w-full h-auto"
            />
          </div>

          <p className="text-muted-foreground leading-relaxed mb-6">
            The Double Bottom is a bullish reversal pattern forming after a downtrend. It consists of two troughs 
            at approximately the same price level, separated by a moderate peak.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-4">Pattern Characteristics</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Two troughs at similar price levels (within 3-4%)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Moderate peak between troughs (at least 10% rise)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Volume higher on second bottom (buying interest)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Neckline drawn at the peak between troughs</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Confirmed on breakout above neckline with volume spike</span>
              </li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Trading the Double Bottom
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Entry:</strong> Enter long when price closes above the neckline with strong volume.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>Stop Loss:</strong> Place stop loss below the lowest trough, minus 1-2% buffer.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            <strong>Target:</strong> Measure distance from troughs to neckline, project upward from breakpoint. 
            Average rise is 35% per Bulkowski's data.
          </p>

          {/* Key Differences */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Key Success Factors</h2>
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volume Confirmation</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Volume should be higher on the first peak/trough and decrease on the second. Breakout must show 
                50%+ increase in volume.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Time Between Peaks/Troughs</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Optimal spacing is 4 weeks to 3 months. Too close (under 2 weeks) or too far (over 6 months) 
                reduces reliability.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Price Symmetry</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                The two peaks/troughs should be within 3-4% of each other. Greater variation suggests a 
                different pattern may be forming.
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Bulkowski's Research Data</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <h3 className="font-semibold mb-3">Double Top Statistics:</h3>
            <ul className="space-y-2 text-muted-foreground mb-6">
              <li>✓ Success Rate: 79%</li>
              <li>✓ Average Decline: 20%</li>
              <li>✓ Formation Time: 2-3 months typical</li>
              <li>✓ Throwback Rate: 60% (price retests neckline)</li>
            </ul>
            <h3 className="font-semibold mb-3">Double Bottom Statistics:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ Success Rate: 79%</li>
              <li>✓ Average Rise: 35%</li>
              <li>✓ Formation Time: 2-3 months typical</li>
              <li>✓ Pullback Rate: 64% (price retests neckline)</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Common Mistakes</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Trading before neckline break confirmation</li>
                <li>• Ignoring volume patterns during formation</li>
                <li>• Expecting exact symmetry (3-4% variance is normal)</li>
                <li>• Not waiting for daily close beyond neckline</li>
                <li>• Setting stops too tight near pattern boundaries</li>
              </ul>
            </AlertDescription>
          </Alert>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/head-and-shoulders">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Head and Shoulders Pattern</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Learn about this powerful three-peak reversal pattern with 93% success rate.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/volume-analysis">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Volume Analysis Guide</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Master volume confirmation techniques essential for pattern trading.
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
                Take our quiz to practice identifying Double Tops and Bottoms
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

export default DoubleTopBottom;
