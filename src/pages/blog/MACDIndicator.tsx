import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MACDIndicator = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">MACD Indicator: Trend Following and Momentum</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Technical Analysis</span>
            <span>•</span>
            <span>10 min read</span>
            <span>•</span>
            <span>Trend Indicator</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <TrendingUp className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              MACD (Moving Average Convergence Divergence) is a trend-following momentum indicator that shows the relationship 
              between two moving averages. It's one of the most versatile and widely-used indicators by professional traders.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">MACD Components</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">MACD Line (Blue Line)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Difference between 12-period EMA and 26-period EMA. This is the faster moving line that generates signals.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Signal Line (Red Line)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                9-period EMA of the MACD Line. Acts as a trigger line for buy/sell signals when MACD crosses it.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histogram (Bars)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Difference between MACD Line and Signal Line. Visualizes the distance between the two lines. 
                Expanding histogram shows strengthening momentum.
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">MACD Trading Signals</h2>

          <h3 className="text-xl font-semibold mt-8 mb-4">1. MACD Line Crossovers</h3>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-4">
              <strong className="text-foreground">Bullish Crossover:</strong> MACD Line crosses above Signal Line. 
              Indicates momentum shifting bullish. Buy signal.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Bearish Crossover:</strong> MACD Line crosses below Signal Line. 
              Indicates momentum shifting bearish. Sell signal.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">2. Zero Line Crossovers</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-4">
              <strong className="text-foreground">Bullish:</strong> MACD Line crosses above zero line. Confirms uptrend as 
              12-EMA is now above 26-EMA. Strong buy confirmation.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Bearish:</strong> MACD Line crosses below zero line. Confirms downtrend as 
              12-EMA is now below 26-EMA. Strong sell confirmation.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">3. MACD Divergence</h3>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <p className="text-muted-foreground mb-4">
              <strong className="text-foreground">Bullish Divergence:</strong> Price makes lower lows while MACD makes higher lows. 
              Signals weakening bearish momentum and potential reversal up.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Bearish Divergence:</strong> Price makes higher highs while MACD makes lower highs. 
              Signals weakening bullish momentum and potential reversal down.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Trading Strategy</h2>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              <li>Wait for MACD bullish crossover (MACD crosses above Signal Line)</li>
              <li>Confirm with histogram expanding (bars getting larger)</li>
              <li>Enter long position when next candle opens</li>
              <li>Place stop loss below recent swing low</li>
              <li>Exit when MACD crosses back below Signal Line (bearish crossover)</li>
            </ol>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">MACD Settings</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ul className="space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Standard: (12,26,9)</strong> - Most common, works well for daily charts</li>
              <li><strong className="text-foreground">Fast: (5,13,5)</strong> - More sensitive for active traders</li>
              <li><strong className="text-foreground">Slow: (19,39,9)</strong> - Smoother for swing traders</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Common Mistakes</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Trading every crossover without considering trend direction</li>
                <li>• Ignoring divergences - they're powerful reversal signals</li>
                <li>• Using MACD alone without price action confirmation</li>
                <li>• Not waiting for histogram expansion for confirmation</li>
                <li>• Trading MACD signals in choppy, sideways markets</li>
              </ul>
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-12">
            <li>MACD identifies trend direction and momentum shifts</li>
            <li>Crossovers generate buy/sell signals</li>
            <li>Zero line crossovers confirm trend changes</li>
            <li>Divergences signal potential reversals</li>
            <li>Histogram shows momentum strength</li>
            <li>Combine MACD with price action and support/resistance</li>
          </ol>
        </article>
      </div>
    </div>
  );
};

export default MACDIndicator;
