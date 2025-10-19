import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const PinBarStrategy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Pin Bar Strategy: High-Probability Reversal Setups
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Master the pin bar candlestick pattern to identify powerful reversal opportunities with excellent risk-reward ratios at key market levels.
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                What is a Pin Bar?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                A pin bar (also known as a hammer or shooting star) is a single candlestick pattern that shows rejection of a price level. It consists of a small body with a long wick (tail) that extends in one direction, indicating that sellers or buyers attempted to push price in that direction but failed, causing a strong reversal.
              </p>
              <p className="text-muted-foreground">
                The pattern gets its name from being shaped like a pin with a head (the body) and a long tail (the wick). The longer the tail relative to the body, the stronger the rejection signal.
              </p>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Pin Bar Anatomy</h2>
          
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bullish Pin Bar (Hammer)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">Characteristics:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Long lower wick (tail)</li>
                  <li>Small body at the top</li>
                  <li>Little to no upper wick</li>
                  <li>Body can be bullish or bearish</li>
                  <li>Shows rejection of lower prices</li>
                </ul>
                <p className="mt-3 font-semibold text-foreground">Signal: Buyers in control, potential upward reversal</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bearish Pin Bar (Shooting Star)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">Characteristics:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Long upper wick (tail)</li>
                  <li>Small body at the bottom</li>
                  <li>Little to no lower wick</li>
                  <li>Body can be bullish or bearish</li>
                  <li>Shows rejection of higher prices</li>
                </ul>
                <p className="mt-3 font-semibold text-foreground">Signal: Sellers in control, potential downward reversal</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Perfect Pin Bar Criteria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Long Tail:</strong> The wick should be at least 2/3 of the total candle length (66% or more)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Small Body:</strong> The body should be in the top/bottom third of the candle range
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Minimal Opposite Wick:</strong> Little to no wick on the opposite end of the tail
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Clear Rejection:</strong> Tail should extend well beyond recent price action
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Key Level Confluence:</strong> Pin bar forms at support, resistance, or Fibonacci levels
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Where to Trade Pin Bars</h2>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>High-Probability Pin Bar Locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">1. Major Support and Resistance Levels</h3>
                <p>The most powerful pin bars form at key horizontal support and resistance zones that have been tested multiple times. These areas have proven significance in the market.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">2. Dynamic Moving Averages</h3>
                <p>Pin bars at major moving averages (50, 100, 200 EMA/SMA) often signal strong reversals, especially in trending markets where MA acts as dynamic support/resistance.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">3. Fibonacci Retracement Levels</h3>
                <p>Pin bars at 50%, 61.8%, or 78.6% Fibonacci levels provide excellent entries for trend continuation trades with confluence of multiple factors.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">4. Trend Lines</h3>
                <p>Pin bars forming at ascending or descending trend lines offer clear risk management points and high probability setups in the direction of the trend.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">5. Round Numbers and Psychological Levels</h3>
                <p>Major round numbers (1.3000, 1.2500 in forex, $50, $100 in stocks) often see pin bar formations as traders place orders at these psychologically significant levels.</p>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Pin Bar Trading Strategy</h2>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Entry and Exit Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Entry Methods</h3>
                <p className="mb-2"><strong className="text-foreground">Aggressive Entry:</strong> Enter at the close of the pin bar candle</p>
                <ul className="list-disc pl-6 mb-3 space-y-1">
                  <li>Pro: Get in early with better risk-reward</li>
                  <li>Con: No confirmation, higher risk of failure</li>
                </ul>
                
                <p className="mb-2"><strong className="text-foreground">Conservative Entry:</strong> Wait for the next candle to break the pin bar high/low</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Pro: Confirmation of reversal, higher win rate</li>
                  <li>Con: Worse risk-reward ratio</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Stop Loss Placement</h3>
                <p className="mb-2">Place stop loss beyond the tail of the pin bar:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Bullish pin bar: Stop 10-20 pips below the tail low</li>
                  <li>Bearish pin bar: Stop 10-20 pips above the tail high</li>
                  <li>Adjust buffer based on volatility and timeframe</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Profit Targets</h3>
                <p className="mb-2">Multiple target approach:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Target 1 (50% position): 1.5-2R (reward-to-risk ratio)</li>
                  <li>Target 2 (30% position): 3R or next major level</li>
                  <li>Target 3 (20% position): Trail with moving stop</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Pin Bar Confluence Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The best pin bar setups have multiple confluence factors. Look for at least 2-3 of these:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Pin bar forms at major support/resistance level</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Aligns with higher timeframe trend direction</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Fibonacci level confluence (38.2%, 50%, 61.8%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Moving average support/resistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Trend line bounce or break</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Round number psychological level</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Oversold/overbought indicator readings (RSI, Stochastic)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8 bg-destructive/10 border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Pin Bars to Avoid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span><strong className="text-foreground">Mid-Range Pin Bars:</strong> Forming in the middle of nowhere with no nearby support or resistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span><strong className="text-foreground">Short Tails:</strong> Pin bars with tails less than 50% of total candle range</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span><strong className="text-foreground">Large Bodies:</strong> Pin bars where the body is more than 1/3 of the total range</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span><strong className="text-foreground">Double Wicks:</strong> Candles with long wicks on both ends (indecision, not rejection)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span><strong className="text-foreground">Counter-Trend Without Setup:</strong> Trading against strong trends without proper structure</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span><strong className="text-foreground">Low Volume:</strong> Pin bars on very low volume lack conviction</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Advanced Pin Bar Techniques</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pin Bar Clusters</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">Multiple pin bars forming at the same level over time create "pin bar clusters" - extremely powerful reversal zones.</p>
                <p className="font-semibold text-foreground">Trading Approach:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Wait for 2-3 pin bars to form at the same level</li>
                  <li>Enter aggressively on the 3rd pin bar</li>
                  <li>Use a wider stop to account for multiple rejections</li>
                  <li>Targets should be larger (3R+) due to strong setup</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inside Bar + Pin Bar Combo</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">When a pin bar forms after one or more inside bars, it signals consolidation followed by rejection - a very high probability setup.</p>
                <p className="font-semibold text-foreground">Entry Rules:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Wait for inside bar(s) to form first (consolidation)</li>
                  <li>Pin bar should break the inside bar high/low</li>
                  <li>Enter on pin bar close or break of pin bar high/low</li>
                  <li>Stop goes beyond the pin bar tail as usual</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Multiple Timeframe Pin Bar Analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">Analyze pin bars across multiple timeframes for the strongest setups:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Higher timeframe (daily/weekly) identifies the trend</li>
                  <li>Medium timeframe (4H) shows key levels and structure</li>
                  <li>Lower timeframe (1H) provides precise pin bar entry</li>
                  <li>All timeframes should align for best results</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Risk Management for Pin Bar Trading</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Position Sizing</h3>
                <p>Risk 1-2% of your account per trade. Calculate position size based on the distance from entry to stop loss beyond the pin bar tail.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Win Rate Expectations</h3>
                <p>Good pin bar traders achieve 50-60% win rate with proper level selection. Focus on 2:1 or better risk-reward for profitable trading.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Scaling In and Out</h3>
                <p>Take partial profits at first target (1.5-2R), move stop to breakeven, and let remaining position run to larger targets or trail with stops.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Practice Pin Bar Trading</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Develop your pin bar recognition skills and build trading strategies based on this powerful price action pattern.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link to="/chart-patterns/generator">
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Pattern Recognition
                  </button>
                </Link>
                <Link to="/strategy-workspace?tab=builder">
                  <button className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
                    Build Pin Bar Strategy
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </article>
      </div>
    </div>
  );
};

export default PinBarStrategy;
