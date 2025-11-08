import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import movingAveragesChart from "@/assets/moving-averages-chart.png";

const MovingAverages = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Moving Averages: Dynamic Support and Resistance</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Technical Analysis</span>
            <span>•</span>
            <span>10 min read</span>
            <span>•</span>
            <span>Trend Indicators</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <TrendingUp className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Moving averages are one of the most widely used technical indicators. They smooth out price data to identify 
              trends, provide dynamic support/resistance, and generate trading signals.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Types of Moving Averages</h2>
          
          {/* Chart Image */}
          <div className="my-8 rounded-lg overflow-hidden border border-border">
            <img src={movingAveragesChart} alt="Moving Averages Chart - Golden Cross" className="w-full h-auto" />
          </div>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Simple Moving Average (SMA)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Calculates the average price over a specific number of periods. All data points weighted equally. 
                Most common: 20-day, 50-day, 200-day SMA.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exponential Moving Average (EMA)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Gives more weight to recent prices, making it more responsive to new information. 
                Preferred by active traders for faster signals.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weighted Moving Average (WMA)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Assigns linearly decreasing weights to older data. More responsive than SMA but less than EMA. 
                Less commonly used in retail trading.
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Popular Moving Average Periods</h2>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3 text-muted-foreground">
              <li><strong className="text-foreground">10-20 day MA:</strong> Short-term trends, day trading and swing trading</li>
              <li><strong className="text-foreground">50-day MA:</strong> Intermediate trend, widely watched institutional level</li>
              <li><strong className="text-foreground">100-day MA:</strong> Medium-term trend indicator</li>
              <li><strong className="text-foreground">200-day MA:</strong> Long-term trend, most significant MA for investors</li>
              <li><strong className="text-foreground">20/50 EMA:</strong> Common combination for trend-following systems</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Moving Average as Dynamic Support/Resistance</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            In trending markets, moving averages act as dynamic support (uptrends) or resistance (downtrends). 
            Price often pulls back to test these levels before continuing in the trend direction.
          </p>

          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold mb-4">Trading Strategy:</h3>
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              <li>Identify trending market (price consistently above/below MA)</li>
              <li>Wait for pullback to moving average</li>
              <li>Look for bounce confirmation (bullish candle, volume increase)</li>
              <li>Enter in trend direction when price rebounds off MA</li>
              <li>Place stop below MA (uptrend) or above MA (downtrend)</li>
            </ol>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Moving Average Crossovers</h2>
          
          <h3 className="text-xl font-semibold mt-8 mb-4">Golden Cross (Bullish)</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Signal:</strong> When 50-day MA crosses above 200-day MA
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Meaning:</strong> Strong bullish signal indicating potential long-term uptrend
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Action:</strong> Consider long positions, avoid shorting
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Death Cross (Bearish)</h3>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Signal:</strong> When 50-day MA crosses below 200-day MA
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Meaning:</strong> Strong bearish signal indicating potential long-term downtrend
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Action:</strong> Consider short positions or avoid longs
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Multiple Moving Average System</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Using multiple MAs together provides better trend confirmation and filters false signals.
          </p>

          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Triple MA System (20/50/200)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <strong>Bullish Alignment:</strong> Price {">"} 20MA {">"} 50MA {">"} 200MA. Strong uptrend.<br/>
                <strong>Bearish Alignment:</strong> Price {"<"} 20MA {"<"} 50MA {"<"} 200MA. Strong downtrend.
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Trading Rules</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Trend Following:</strong> Only take long trades when price is above MA, short trades below</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Avoid Choppy Markets:</strong> MAs give false signals in sideways/ranging markets</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Combine with Volume:</strong> Volume should confirm MA crossovers for best results</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Slope Matters:</strong> Steeper MA angle indicates stronger trend</span>
              </li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Common Mistakes</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Using MAs in sideways/choppy markets - creates whipsaws</li>
                <li>• Relying solely on MA crosses without other confirmation</li>
                <li>• Not adjusting MA periods for different timeframes</li>
                <li>• Ignoring price action and focusing only on MAs</li>
                <li>• Trading against higher timeframe MA trends</li>
                <li>• Using too many MAs which creates confusion</li>
              </ul>
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-12">
            <li>Moving averages identify trend direction and provide dynamic S/R</li>
            <li>EMAs react faster than SMAs to price changes</li>
            <li>Golden/Death crosses signal major trend changes</li>
            <li>MAs work best in trending markets, poorly in ranges</li>
            <li>Combine multiple MAs for better trend confirmation</li>
            <li>Always use MAs with other indicators and price action</li>
          </ol>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/trend-analysis">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Trend Lines and Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Combine MAs with trend line analysis for powerful signals.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/macd-indicator">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>MACD Indicator</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  MACD uses moving averages to generate momentum signals.
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovingAverages;
