import { Link } from "react-router-dom";
import { ArrowLeft, TrendingDown, Target, Shield, BarChart3, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DynamicPatternChart } from "@/components/DynamicPatternChart";
import {
  SkillLevelSection,
  TradingRule,
  PatternChecklist,
  CommonMistakes,
  ProTip,
  RiskManagementBox,
  StatisticsBox,
  TableOfContents
} from "@/components/blog/ArticleSection";

const MeanReversionStrategy = () => {
  const tocSections = [
    { id: 'introduction', title: 'What is Mean Reversion?' },
    { id: 'theory', title: 'The Theory Behind Mean Reversion', level: 'novice' as const },
    { id: 'indicators', title: 'Key Indicators', level: 'novice' as const },
    { id: 'entry-setups', title: 'Entry Setups', level: 'intermediate' as const },
    { id: 'exit-strategies', title: 'Exit Strategies', level: 'intermediate' as const },
    { id: 'risk-management', title: 'Risk Management', level: 'advanced' as const },
    { id: 'pro-techniques', title: 'Professional Techniques', level: 'professional' as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn/trading-strategies-guide" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Strategy Guide
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400">Counter-Trend</Badge>
            <Badge variant="outline">Statistical Strategy</Badge>
            <Badge variant="secondary">16 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Mean Reversion: Trading the Return to Average</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Exploit the statistical tendency of prices to revert to their historical average. 
            Buy oversold conditions, sell overbought — the contrarian's edge in ranging markets.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Win Rate', value: '55-70%', description: 'Higher than trend following' },
              { label: 'Risk-Reward', value: '0.5:1 to 1.5:1', description: 'Lower targets' },
              { label: 'Best Markets', value: 'Ranging', description: 'Not trending' },
              { label: 'Hold Time', value: 'Hours-Days', description: 'Short-term bias' },
            ]}
            title="Mean Reversion Statistics"
          />

          {/* Introduction */}
          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <RefreshCw className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                Mean reversion is based on the statistical observation that extreme price moves tend to 
                revert toward the average over time. Buy when price is below average, sell when above.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">
              While trend followers bet on momentum continuing, mean reversion traders bet on momentum 
              exhausting. This counter-trend approach works best in range-bound, mean-reverting markets 
              and is the foundation of many quantitative hedge fund strategies. The key is identifying 
              when a move is "stretched" and likely to snap back.
            </p>

            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="double-bottom" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>Chart:</strong> A double bottom showing mean reversion — price falls to an extreme, 
                finds support, and reverts toward the mean.
              </div>
            </div>
          </section>

          {/* Theory */}
          <section id="theory">
            <SkillLevelSection level="novice" title="The Theory Behind Mean Reversion">
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
                <h4 className="font-semibold mb-3">Why Prices Revert to the Mean</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Statistical Tendency:</strong> Random fluctuations 
                    around a true value will, on average, return to that value over time.
                  </li>
                  <li>
                    <strong className="text-foreground">Profit Taking:</strong> Extreme moves attract 
                    profit-taking from existing holders, reversing momentum.
                  </li>
                  <li>
                    <strong className="text-foreground">Value Buyers/Sellers:</strong> Extreme prices 
                    attract value-oriented traders who fade the move.
                  </li>
                  <li>
                    <strong className="text-foreground">Market Microstructure:</strong> Market makers 
                    fade extreme moves to provide liquidity and capture spread.
                  </li>
                </ul>
              </div>

              <Alert>
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  <strong>Critical Warning:</strong> Mean reversion FAILS in trending markets. 
                  Trading reversion during a strong trend is a common cause of blown accounts. 
                  Always confirm the market is range-bound before applying this strategy.
                </AlertDescription>
              </Alert>
            </SkillLevelSection>
          </section>

          {/* Key Indicators */}
          <section id="indicators">
            <SkillLevelSection level="novice" title="Key Mean Reversion Indicators">
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-500" />
                      Bollinger Bands
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Price at the upper band = overbought, lower band = oversold. 
                    Mean reversion targets the middle band (20 SMA). Works best when bands are 
                    contracting (low volatility).
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-blue-500" />
                      RSI (Relative Strength Index)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    RSI below 30 = oversold, above 70 = overbought. For mean reversion, 
                    use RSI(2) for more sensitive readings. Buy when RSI(2) &lt; 10, 
                    sell when RSI(2) &gt; 90.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-green-500" />
                      Distance from MA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Measure how far price has deviated from a moving average (e.g., 20 SMA). 
                    Extreme deviations (2+ standard deviations) signal potential reversion.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-amber-500" />
                      Z-Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Z-Score = (Price - Mean) / Standard Deviation. Z-Score above +2 = overbought, 
                    below -2 = oversold. More statistically rigorous than simple indicators.
                  </CardContent>
                </Card>
              </div>

              <ProTip>
                The 2-period RSI (RSI-2) is one of the most powerful mean reversion indicators. 
                Research by Larry Connors shows that buying when RSI-2 drops below 5 and selling 
                when it rises above 95 generates significant edge in equity indices.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* Entry Setups */}
          <section id="entry-setups">
            <SkillLevelSection level="intermediate" title="Mean Reversion Entry Setups">
              <h4 className="text-lg font-semibold mb-4">1. RSI-2 Strategy (Connors Method)</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title="Long Entry">
                  Buy when RSI(2) closes below 5 AND price is above the 200 MA 
                  (confirms we're in an overall uptrend).
                </TradingRule>
                <TradingRule type="exit" title="Exit Signal">
                  Sell when RSI(2) closes above 70 OR after 5 days, whichever comes first.
                </TradingRule>
                <TradingRule type="stop" title="Stop Loss">
                  Exit if price closes below a significant swing low or 3% below entry.
                </TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">2. Bollinger Band Reversion</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title="Long Entry">
                  Buy when price closes below the lower Bollinger Band (20,2) 
                  and shows a bullish reversal candle (hammer, bullish engulfing).
                </TradingRule>
                <TradingRule type="target" title="Profit Target">
                  Target the middle band (20 SMA) or the upper band for extended moves.
                </TradingRule>
                <TradingRule type="stop" title="Stop Loss">
                  Place stop below the swing low or 1-1.5x ATR below entry.
                </TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">3. Multi-Day Pullback</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title="Long Entry">
                  After 3-5 consecutive down days in an uptrend (price above 200 MA), 
                  buy on the first up close.
                </TradingRule>
                <TradingRule type="exit" title="Exit Signal">
                  Exit after 3-5 days or when price reaches the 10-day high.
                </TradingRule>
              </div>
            </SkillLevelSection>
          </section>

          {/* Exit Strategies */}
          <section id="exit-strategies">
            <SkillLevelSection level="intermediate" title="Exit Strategies">
              <div className="grid gap-4 mb-6">
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                      Time-Based Exit
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Exit after a fixed number of days (3-10 days) regardless of profit. 
                      Mean reversion is a short-term edge that decays quickly.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-blue-500/10 border-blue-500/30">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                      Target-Based Exit
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Exit when price returns to the mean (moving average) or when the 
                      overbought/oversold indicator returns to neutral (RSI 50).
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-amber-500/10 border-amber-500/30">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">
                      Indicator Reversal Exit
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Exit when the indicator reaches the opposite extreme. If you bought on 
                      RSI &lt; 10, sell on RSI &gt; 90.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <CommonMistakes 
                mistakes={[
                  'Fighting strong trends (just because it\'s overbought doesn\'t mean it will reverse)',
                  'Averaging down on losers (turns small losses into catastrophic ones)',
                  'Holding positions too long (mean reversion edge decays quickly)',
                  'Using fixed profit targets that are too ambitious',
                  'Not filtering for overall market regime (trend vs. range)',
                  'Trading mean reversion without stop losses',
                ]}
              />
            </SkillLevelSection>
          </section>

          {/* Risk Management */}
          <section id="risk-management">
            <SkillLevelSection level="advanced" title="Risk Management for Mean Reversion">
              <RiskManagementBox 
                positionSize="0.5-1% of account per trade"
                stopLoss="Below swing low or 1.5x ATR"
                riskReward="0.5:1 to 1.5:1"
                maxRisk="3-5 correlated trades max"
              />

              <Alert className="mt-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  <strong>The Danger of Averaging Down:</strong> The biggest risk in mean reversion 
                  is thinking "it's even more oversold now, I'll add more." This can lead to massive 
                  losses when an extreme move continues. NEVER add to losing positions.
                </AlertDescription>
              </Alert>
            </SkillLevelSection>
          </section>

          {/* Professional Techniques */}
          <section id="pro-techniques">
            <SkillLevelSection level="professional" title="Professional Mean Reversion Techniques">
              <h4 className="text-lg font-semibold mb-4">Regime Detection</h4>
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Only trade mean reversion when the market is in a ranging regime:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>ADX &lt; 25:</strong> Weak trend = good for mean reversion</li>
                  <li>• <strong>Bollinger Band Width:</strong> Narrow bands = ranging market</li>
                  <li>• <strong>Price oscillating around MA:</strong> No clear direction</li>
                  <li>• <strong>Turn off mean reversion when ADX &gt; 30</strong></li>
                </ul>
              </div>

              <h4 className="text-lg font-semibold mb-4">Pairs Trading (Statistical Arbitrage)</h4>
              <p className="text-muted-foreground mb-4">
                Trade the spread between two correlated instruments (e.g., Coca-Cola vs. PepsiCo). 
                When the spread deviates from its historical mean, bet on convergence. This is market-neutral 
                and doesn't depend on overall direction.
              </p>

              <h4 className="text-lg font-semibold mb-4">Intraday Mean Reversion</h4>
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">
                  Fade extreme moves during the trading day:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• Trade against gap opens that are &gt;2% from previous close</li>
                  <li>• VWAP reversion: Price extended from VWAP tends to return</li>
                  <li>• Opening range: Fade breaks of opening range during lunch hours</li>
                </ul>
              </div>

              <PatternChecklist 
                title="Mean Reversion Trade Checklist"
                items={[
                  { text: 'Confirm market is in ranging regime (ADX < 25)', critical: true },
                  { text: 'Indicator shows extreme reading (RSI < 10 or > 90)', critical: true },
                  { text: 'Price is still above 200 MA for longs (or below for shorts)', critical: true },
                  { text: 'No major news event imminent' },
                  { text: 'Reversal candle pattern present' },
                  { text: 'Position size calculated based on stop distance' },
                ]}
              />
            </SkillLevelSection>
          </section>

          {/* Summary */}
          <section className="mt-12">
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
              <CardHeader>
                <CardTitle>Mean Reversion Strategy Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Best For:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Contrarian-minded traders</li>
                      <li>• Range-bound market conditions</li>
                      <li>• Those who prefer higher win rates</li>
                      <li>• Short-term trading horizons</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Not Ideal For:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Trending market conditions</li>
                      <li>• Those who struggle cutting losses</li>
                      <li>• Traders prone to averaging down</li>
                      <li>• Long-term position holding</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Related Strategies */}
          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Related Strategies</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/learn/rsi-indicator" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">RSI Indicator</h4>
                    <p className="text-sm text-muted-foreground">Core mean reversion tool</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/learn/strategies/bollinger-bands" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Bollinger Bands</h4>
                    <p className="text-sm text-muted-foreground">Volatility-based reversion</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/learn/support-resistance" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Support & Resistance</h4>
                    <p className="text-sm text-muted-foreground">Key reversion levels</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};

export default MeanReversionStrategy;
