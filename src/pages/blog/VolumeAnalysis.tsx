import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  SkillLevelSection,
  ProTip,
  CommonMistakes,
  StatisticsBox,
  TableOfContents
} from "@/components/blog/ArticleSection";

const VolumeAnalysis = () => {
  const tocSections = [
    { id: 'what-is-volume', title: 'What is Volume?', level: 'novice' as const },
    { id: 'principles', title: 'Core Volume Principles', level: 'novice' as const },
    { id: 'patterns', title: 'Volume Patterns & Signals', level: 'intermediate' as const },
    { id: 'breakouts', title: 'Volume Confirmation for Breakouts', level: 'intermediate' as const },
    { id: 'indicators', title: 'Volume Indicators', level: 'advanced' as const },
    { id: 'strategies', title: 'Trading Strategies Using Volume' },
    { id: 'mistakes', title: 'Common Mistakes to Avoid' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-primary/20 text-primary">Technical Analysis</Badge>
            <Badge variant="outline">Core Concepts</Badge>
            <Badge variant="secondary">15 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Volume Analysis: The Fuel Behind Price Movements</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Learn how to use volume to confirm trends, identify reversals, and validate breakouts. Volume is the one indicator that cannot be faked — it reveals true market participation.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Breakout Success', value: '+40%', description: 'With high volume' },
              { label: 'False Breakout', value: '70%', description: 'Without volume' },
              { label: 'Divergence Signal', value: '65%', description: 'Win rate' },
              { label: 'Volume Spike', value: '>150%', description: 'For valid breakout' },
            ]}
            title="Volume Analysis Statistics"
          />

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <BarChart3 className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              "Volume is the fuel that moves prices." Understanding volume analysis helps confirm trends, 
              identify reversals, and validate breakouts before they occur. It's the one indicator that shows real market conviction.
            </AlertDescription>
          </Alert>

          {/* WHAT IS VOLUME */}
          <section id="what-is-volume">
            <SkillLevelSection level="novice" title="What is Volume?">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Volume represents the total number of shares or contracts traded during a specific period. 
                It measures market participation and the strength behind price movements. When you see a tall green or red bar 
                below the price chart, that's showing you how much trading activity occurred during that candle.
              </p>

              {/* Volume Visualization */}
              <div className="my-8 p-8 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/5">
                <h3 className="text-xl font-bold text-center mb-8">Reading Volume Bars</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-32 bg-green-500/80 rounded-sm"></div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-500">High Volume + Bullish Candle</p>
                      <p className="text-sm text-muted-foreground">Strong buying conviction. Price likely to continue higher. Institutional participation.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-32 bg-red-500/80 rounded-sm"></div>
                    <div className="flex-1">
                      <p className="font-semibold text-red-500">High Volume + Bearish Candle</p>
                      <p className="text-sm text-muted-foreground">Strong selling conviction. Price likely to continue lower. Capitulation or distribution.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 bg-muted rounded-sm"></div>
                    <div className="flex-1">
                      <p className="font-semibold text-muted-foreground">Low Volume</p>
                      <p className="text-sm text-muted-foreground">Weak conviction. Move is unreliable. Often precedes breakouts or indicates consolidation.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-accent/50 p-6 rounded-lg mb-8">
                <h3 className="text-xl font-semibold mb-4">Why Volume Matters:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground"><strong className="text-foreground">Confirms Strength:</strong> High volume validates price moves. Low volume signals weak, unreliable moves.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground"><strong className="text-foreground">Validates Breakouts:</strong> Real breakouts occur on high volume. False breakouts happen on low volume.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground"><strong className="text-foreground">Identifies Reversals:</strong> Divergence between price and volume often signals trend exhaustion.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground"><strong className="text-foreground">Shows Smart Money:</strong> Unusual volume increases reveal institutional accumulation or distribution.</span>
                  </li>
                </ul>
              </div>
            </SkillLevelSection>
          </section>

          {/* CORE PRINCIPLES */}
          <section id="principles">
            <SkillLevelSection level="novice" title="Core Volume Principles">
              <p className="text-muted-foreground mb-6">
                These three principles form the foundation of volume analysis. Master these concepts before moving to advanced techniques.
              </p>

              <div className="grid gap-4 mb-8">
                <Card className="bg-green-500/5 border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Principle 1: High Volume = Strong Moves
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    <p className="mb-3">When price moves on high volume, it indicates strong conviction. These moves are more likely 
                    to continue as they represent genuine shifts in supply and demand.</p>
                    <div className="p-3 bg-green-500/10 rounded-lg text-sm">
                      <strong>Example:</strong> Stock breaks resistance on 200% average volume → High probability the breakout holds
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-500/5 border-red-500/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      Principle 2: Low Volume = Weak Moves
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    <p className="mb-3">Price moves on low volume lack conviction and are more likely to reverse. These moves often 
                    represent temporary fluctuations rather than meaningful trends.</p>
                    <div className="p-3 bg-red-500/10 rounded-lg text-sm">
                      <strong>Warning:</strong> Rally on 50% below-average volume → Likely a "dead cat bounce" that will fail
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Volume2 className="h-5 w-5 text-primary" />
                      Principle 3: Volume Precedes Price
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    <p className="mb-3">Smart money often accumulates or distributes before major price moves. Unusual volume 
                    increases can signal upcoming significant price action — even before price moves.</p>
                    <div className="p-3 bg-primary/10 rounded-lg text-sm">
                      <strong>Watch for:</strong> Volume spikes with small price moves → Institutions building positions quietly
                    </div>
                  </CardContent>
                </Card>
              </div>

              <ProTip>
                Always compare current volume to the 20-day or 50-day average volume. A "high volume" day should be at least 50% above average. Without this context, you can't properly assess if volume is truly elevated.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* VOLUME PATTERNS */}
          <section id="patterns">
            <SkillLevelSection level="intermediate" title="Volume Patterns and Signals">
              <p className="text-muted-foreground mb-6">
                Understanding how volume behaves during trends, at key levels, and during divergences will dramatically improve your trade selection.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-4">Volume in Trends</h3>
              
              {/* Trend Volume Visualization */}
              <div className="my-8 p-6 rounded-xl border border-border bg-gradient-to-br from-green-500/5 to-red-500/5">
                <h4 className="font-semibold text-center mb-6">Healthy Trend Volume Pattern</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-end justify-center gap-1 h-24 mb-4">
                      <div className="w-4 h-16 bg-green-500 rounded-sm"></div>
                      <div className="w-4 h-8 bg-red-400/50 rounded-sm"></div>
                      <div className="w-4 h-20 bg-green-500 rounded-sm"></div>
                      <div className="w-4 h-6 bg-red-400/50 rounded-sm"></div>
                      <div className="w-4 h-24 bg-green-500 rounded-sm"></div>
                    </div>
                    <p className="font-semibold text-green-500">Healthy Uptrend</p>
                    <p className="text-sm text-muted-foreground">High volume on up days, low volume on pullbacks</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex items-end justify-center gap-1 h-24 mb-4">
                      <div className="w-4 h-16 bg-red-500 rounded-sm"></div>
                      <div className="w-4 h-8 bg-green-400/50 rounded-sm"></div>
                      <div className="w-4 h-20 bg-red-500 rounded-sm"></div>
                      <div className="w-4 h-6 bg-green-400/50 rounded-sm"></div>
                      <div className="w-4 h-24 bg-red-500 rounded-sm"></div>
                    </div>
                    <p className="font-semibold text-red-500">Healthy Downtrend</p>
                    <p className="text-sm text-muted-foreground">High volume on down days, low volume on bounces</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
                <p className="text-muted-foreground mb-4">
                  <strong className="text-foreground">Healthy Uptrend:</strong> Volume increases on up days, 
                  decreases on down days (pullbacks). This shows strong buying interest and weak selling pressure.
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Healthy Downtrend:</strong> Volume increases on down days, 
                  decreases on up days (bounces). This shows strong selling pressure and weak buying interest.
                </p>
              </div>

              <h3 className="text-xl font-semibold mt-8 mb-4">Volume Divergence</h3>
              
              {/* Divergence Visualization */}
              <div className="my-8 p-6 rounded-xl border border-border">
                <h4 className="font-semibold text-center mb-6">Volume Divergence Warning Signals</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="text-center">
                        <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-1" />
                        <p className="text-xs">Price: Higher High</p>
                      </div>
                      <span className="text-2xl">+</span>
                      <div className="text-center">
                        <TrendingDown className="h-8 w-8 text-red-500 mx-auto mb-1" />
                        <p className="text-xs">Volume: Decreasing</p>
                      </div>
                    </div>
                    <p className="font-semibold text-red-500 text-center">Bearish Divergence</p>
                    <p className="text-sm text-muted-foreground text-center">Weakening momentum → Potential reversal down</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="text-center">
                        <TrendingDown className="h-8 w-8 text-red-500 mx-auto mb-1" />
                        <p className="text-xs">Price: Lower Low</p>
                      </div>
                      <span className="text-2xl">+</span>
                      <div className="text-center">
                        <TrendingDown className="h-8 w-8 text-red-500 mx-auto mb-1" />
                        <p className="text-xs">Volume: Decreasing</p>
                      </div>
                    </div>
                    <p className="font-semibold text-green-500 text-center">Bullish Divergence</p>
                    <p className="text-sm text-muted-foreground text-center">Selling exhaustion → Potential reversal up</p>
                  </div>
                </div>
              </div>

              <Alert className="mb-8">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  <p className="mb-2">
                    <strong>Bearish Divergence:</strong> Price makes new highs but volume decreases with each high. 
                    Indicates weakening momentum and potential reversal.
                  </p>
                  <p>
                    <strong>Bullish Divergence:</strong> Price makes new lows but volume decreases with each low. 
                    Indicates selling exhaustion and potential bounce.
                  </p>
                </AlertDescription>
              </Alert>

              <h3 className="text-xl font-semibold mt-8 mb-4">Volume at Key Levels</h3>
              <div className="bg-accent/50 p-6 rounded-lg mb-8">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Support Test:</strong> Low volume at support = weak bounce likely to fail. High volume = strong support confirmation.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Resistance Test:</strong> Low volume at resistance = weak rejection, likely to break. High volume rejection = strong resistance.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Consolidation:</strong> Decreasing volume during range-bound movement = energy building for a breakout. The longer the compression, the bigger the eventual move.</span>
                  </li>
                </ul>
              </div>
            </SkillLevelSection>
          </section>

          {/* BREAKOUT CONFIRMATION */}
          <section id="breakouts">
            <SkillLevelSection level="intermediate" title="Volume Confirmation for Breakouts">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Volume is crucial for confirming the validity of breakouts. Studies show that <strong>70% of breakouts without volume confirmation fail</strong>. 
                This is where most traders lose money — entering breakouts that immediately reverse.
              </p>

              {/* Breakout Visualization */}
              <div className="my-8 p-6 rounded-xl border border-border bg-gradient-to-br from-green-500/5 to-primary/5">
                <h4 className="font-semibold text-center mb-6">Valid vs Invalid Breakout</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex flex-col items-center gap-2 mb-4">
                      <div className="w-full h-1 bg-muted"></div>
                      <span className="text-xs text-muted-foreground">Resistance Level</span>
                      <div className="flex items-end justify-center gap-1 h-20">
                        <div className="w-3 h-6 bg-green-400/50 rounded-sm"></div>
                        <div className="w-3 h-8 bg-green-400/50 rounded-sm"></div>
                        <div className="w-3 h-5 bg-green-400/50 rounded-sm"></div>
                        <div className="w-3 h-20 bg-green-500 rounded-sm"></div>
                      </div>
                    </div>
                    <p className="font-semibold text-green-500">✓ Valid Breakout</p>
                    <p className="text-sm text-muted-foreground">Volume spike 150%+ above average on breakout bar</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex flex-col items-center gap-2 mb-4">
                      <div className="w-full h-1 bg-muted"></div>
                      <span className="text-xs text-muted-foreground">Resistance Level</span>
                      <div className="flex items-end justify-center gap-1 h-20">
                        <div className="w-3 h-8 bg-muted rounded-sm"></div>
                        <div className="w-3 h-6 bg-muted rounded-sm"></div>
                        <div className="w-3 h-7 bg-muted rounded-sm"></div>
                        <div className="w-3 h-5 bg-muted rounded-sm"></div>
                      </div>
                    </div>
                    <p className="font-semibold text-red-500">✗ Invalid Breakout</p>
                    <p className="text-sm text-muted-foreground">Low or declining volume — likely to fail and reverse</p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold mt-8 mb-4">Valid Breakout Criteria</h3>
              <ol className="list-decimal pl-6 text-muted-foreground space-y-3 mb-8">
                <li>
                  <strong className="text-foreground">Volume Surge:</strong> Breakout volume should be 50-100% higher than the 20-day average. The bigger the surge, the more reliable the breakout.
                </li>
                <li>
                  <strong className="text-foreground">Decreasing Volume Before:</strong> Ideal setups show low volume consolidation (energy compression) followed by volume spike on breakout.
                </li>
                <li>
                  <strong className="text-foreground">Sustained Volume:</strong> Volume should remain elevated for 2-3 bars after breakout, confirming follow-through interest.
                </li>
                <li>
                  <strong className="text-foreground">Retest Volume:</strong> When price retests the breakout level, volume should be significantly lower than breakout volume. Low volume retest = healthy consolidation.
                </li>
              </ol>

              <Alert className="mb-8 border-destructive/50 bg-destructive/5">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <AlertDescription>
                  <strong>False Breakout Warning:</strong> Breakouts on below-average volume have a 70%+ failure rate. 
                  Wait for volume confirmation before entering breakout trades. Many traders get trapped buying false breakouts.
                </AlertDescription>
              </Alert>

              <ProTip>
                The best breakout setups show a "volume dry-up" pattern: declining volume over 5-10 days during consolidation, then a massive volume spike (200%+ average) on the breakout bar. This pattern has the highest success rate.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* VOLUME INDICATORS */}
          <section id="indicators">
            <SkillLevelSection level="advanced" title="Volume Indicators">
              <p className="text-muted-foreground mb-6">
                While raw volume bars are powerful, these derived indicators provide additional insight into accumulation, distribution, and momentum.
              </p>
              
              <div className="grid gap-4 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Volume Bars + Moving Average</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    <p className="mb-3">The basic volume histogram shown below the price chart. Add a 20 or 50-period moving average of volume to identify when current volume is above or below average.</p>
                    <div className="p-3 bg-primary/10 rounded-lg text-sm">
                      <strong>How to use:</strong> Volume bars above the MA line indicate above-average participation. Multiple consecutive bars above MA confirm strong moves.
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">On-Balance Volume (OBV)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    <p className="mb-3">Cumulative indicator that adds volume on up days and subtracts volume on down days. Creates a running total that trends with price.</p>
                    <div className="p-3 bg-primary/10 rounded-lg text-sm">
                      <strong>Key Signal:</strong> When OBV makes new highs/lows before price, it's a leading indicator. OBV divergence from price often precedes reversals by 2-5 days.
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Volume Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    <p className="mb-3">Shows volume distribution at different price levels (horizontal histogram). Reveals where most trading occurred — these become magnetic price levels.</p>
                    <div className="p-3 bg-primary/10 rounded-lg text-sm">
                      <strong>Key Concepts:</strong> High Volume Nodes (HVN) = strong S/R levels. Low Volume Nodes (LVN) = price moves quickly through these areas. Point of Control (POC) = highest volume price level.
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">VWAP (Volume Weighted Average Price)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    <p className="mb-3">The average price weighted by volume. Shows the "fair value" price where most volume traded. Institutional benchmark for execution quality.</p>
                    <div className="p-3 bg-primary/10 rounded-lg text-sm">
                      <strong>Trading Rule:</strong> Price above VWAP = bullish bias. Price below VWAP = bearish bias. Intraday traders use VWAP as dynamic support/resistance.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </SkillLevelSection>
          </section>

          {/* TRADING STRATEGIES */}
          <section id="strategies">
            <h2 className="text-2xl font-bold mt-12 mb-4">Trading Strategies Using Volume</h2>

            <h3 className="text-xl font-semibold mt-8 mb-4">Strategy 1: Volume Spike Breakout</h3>
            <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
              <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Identify consolidation</strong> with decreasing volume (5-10+ days)</li>
                <li><strong className="text-foreground">Set alerts</strong> at resistance with volume filter (&gt;150% average)</li>
                <li><strong className="text-foreground">Enter on breakout</strong> when price closes above resistance with volume surge</li>
                <li><strong className="text-foreground">Place stop</strong> inside consolidation range (below breakout bar low)</li>
                <li><strong className="text-foreground">Target</strong> measured move (consolidation height) or next resistance</li>
              </ol>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-4">Strategy 2: Volume Divergence Reversal</h3>
            <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
              <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Identify divergence:</strong> Price making new highs/lows with declining volume</li>
                <li><strong className="text-foreground">Wait for trigger:</strong> Trendline break, pattern completion, or momentum shift</li>
                <li><strong className="text-foreground">Confirm with volume:</strong> Entry candle should have above-average volume in reversal direction</li>
                <li><strong className="text-foreground">Place stop</strong> beyond recent high/low (the divergence extreme)</li>
                <li><strong className="text-foreground">Target</strong> previous support/resistance or measured move</li>
              </ol>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-4">Strategy 3: Climactic Volume Reversal</h3>
            <div className="bg-accent/50 p-6 rounded-lg mb-8">
              <p className="text-muted-foreground mb-3">
                <strong className="text-foreground">Concept:</strong> Extremely high volume (300%+ average) often marks exhaustion points — climax selling at bottoms or climax buying at tops.
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                <li>Look for volume spike 3x+ normal at trend extremes</li>
                <li>Wait for reversal candlestick pattern (hammer, engulfing, etc.)</li>
                <li>Enter on confirmation of reversal direction</li>
                <li>Stop beyond the climax candle high/low</li>
                <li>Target retracement to prior structure</li>
              </ol>
            </div>
          </section>

          {/* COMMON MISTAKES */}
          <section id="mistakes">
            <h2 className="text-2xl font-bold mt-12 mb-4">Common Volume Analysis Mistakes</h2>
            <CommonMistakes 
              mistakes={[
                "Trading breakouts without volume confirmation — 70% of low-volume breakouts fail",
                "Ignoring volume divergences at trend extremes — key reversal warning",
                "Not comparing current volume to average volume — context matters",
                "Using volume as the only signal — always combine with price action",
                "Expecting high volume every day — low volume days during consolidation are normal",
                "Not accounting for time of day in intraday trading — volume varies by session",
                "Ignoring the 'volume dry-up' before breakouts — best setups show this pattern",
                "Buying into climactic volume thinking momentum continues — often marks exhaustion"
              ]}
            />
          </section>

          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-12">
            <li>Volume confirms the strength and conviction behind price movements</li>
            <li>High volume breakouts are 40% more likely to succeed than low volume ones</li>
            <li>Volume should increase in the direction of the trend (healthy trend)</li>
            <li>Volume divergence from price often signals trend exhaustion 2-5 days early</li>
            <li>Always compare current volume to 20-day or 50-day average volume</li>
            <li>Climactic volume (300%+) often marks reversal points — buying/selling exhaustion</li>
            <li>Low volume "dry-up" before breakouts is a bullish pattern</li>
            <li>Combine volume analysis with price action and patterns for best results</li>
          </ol>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/support-resistance">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Support and Resistance</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Use volume to validate support and resistance levels.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/head-and-shoulders">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Head and Shoulders Pattern</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Learn how volume confirms the H&S pattern formation.
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeAnalysis;
