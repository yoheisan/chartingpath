import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { LazyPatternChart } from "@/components/LazyPatternChart";
import {
  SkillLevelSection,
  ProTip,
  CommonMistakes,
  StatisticsBox,
  TableOfContents
} from "@/components/blog/ArticleSection";

const CandlestickPatterns = () => {
  const tocSections = [
    { id: 'understanding', title: 'Understanding Candlesticks', level: 'novice' as const },
    { id: 'single', title: 'Single Candlestick Patterns', level: 'novice' as const },
    { id: 'two-candle', title: 'Two-Candlestick Patterns', level: 'intermediate' as const },
    { id: 'three-candle', title: 'Three-Candlestick Patterns', level: 'advanced' as const },
    { id: 'trading-rules', title: 'Trading Rules & Best Practices' },
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
            <Badge variant="outline">Pattern Recognition</Badge>
            <Badge variant="secondary">20 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Japanese Candlestick Patterns: The Complete Visual Guide</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Master the art of reading candlestick patterns with detailed visual examples. From single-bar reversals to complex three-candle formations — learn to identify high-probability trade setups.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Origin', value: '1700s', description: 'Japanese rice traders' },
              { label: 'Patterns', value: '40+', description: 'Documented patterns' },
              { label: 'Avg Win Rate', value: '55-75%', description: 'With confirmation' },
              { label: 'Best Timeframe', value: '4H-1D', description: 'Higher reliability' },
            ]}
            title="Candlestick Pattern Statistics"
          />

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <BarChart3 className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Candlestick patterns provide powerful insights into market psychology and potential price reversals. 
              Developed by Japanese rice traders in the 18th century, these patterns remain essential today.
            </AlertDescription>
          </Alert>

          {/* UNDERSTANDING CANDLESTICKS */}
          <section id="understanding">
            <SkillLevelSection level="novice" title="Understanding Candlesticks">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Each candlestick shows four key price points for a specific time period: <strong>Open</strong>, <strong>High</strong>, <strong>Low</strong>, and <strong>Close</strong> (OHLC). 
                The body shows the range between open and close, while wicks (shadows) show the high and low extremes.
              </p>

              {/* Candlestick Anatomy Diagram */}
              <div className="my-8 p-8 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/5">
                <h3 className="text-xl font-bold text-center mb-8">Candlestick Anatomy</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="w-20 h-48 mx-auto relative">
                      {/* Bullish Candle SVG */}
                      <svg viewBox="0 0 80 200" className="w-full h-full">
                        <line x1="40" y1="10" x2="40" y2="50" stroke="currentColor" strokeWidth="2" className="text-green-500"/>
                        <rect x="15" y="50" width="50" height="100" fill="currentColor" className="text-green-500"/>
                        <line x1="40" y1="150" x2="40" y2="190" stroke="currentColor" strokeWidth="2" className="text-green-500"/>
                        <text x="75" y="15" fontSize="10" fill="currentColor" className="text-muted-foreground">High</text>
                        <text x="75" y="55" fontSize="10" fill="currentColor" className="text-muted-foreground">Close</text>
                        <text x="75" y="155" fontSize="10" fill="currentColor" className="text-muted-foreground">Open</text>
                        <text x="75" y="195" fontSize="10" fill="currentColor" className="text-muted-foreground">Low</text>
                      </svg>
                    </div>
                    <p className="font-semibold text-green-500 mt-4">Bullish Candlestick</p>
                    <p className="text-sm text-muted-foreground">Close &gt; Open = Green body</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-48 mx-auto relative">
                      {/* Bearish Candle SVG */}
                      <svg viewBox="0 0 80 200" className="w-full h-full">
                        <line x1="40" y1="10" x2="40" y2="50" stroke="currentColor" strokeWidth="2" className="text-red-500"/>
                        <rect x="15" y="50" width="50" height="100" fill="currentColor" className="text-red-500"/>
                        <line x1="40" y1="150" x2="40" y2="190" stroke="currentColor" strokeWidth="2" className="text-red-500"/>
                        <text x="75" y="15" fontSize="10" fill="currentColor" className="text-muted-foreground">High</text>
                        <text x="75" y="55" fontSize="10" fill="currentColor" className="text-muted-foreground">Open</text>
                        <text x="75" y="155" fontSize="10" fill="currentColor" className="text-muted-foreground">Close</text>
                        <text x="75" y="195" fontSize="10" fill="currentColor" className="text-muted-foreground">Low</text>
                      </svg>
                    </div>
                    <p className="font-semibold text-red-500 mt-4">Bearish Candlestick</p>
                    <p className="text-sm text-muted-foreground">Close &lt; Open = Red body</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Bullish Candlestick
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    <p className="mb-3">Close is higher than open, creating a green (or white) body. Represents buying pressure and upward movement.</p>
                    <ul className="space-y-1 text-sm">
                      <li>• Long green body = Strong buying pressure</li>
                      <li>• Small green body = Weak buying, indecision</li>
                      <li>• Upper wick = Sellers pushed price down from highs</li>
                      <li>• Lower wick = Buyers rejected lower prices</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      Bearish Candlestick
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    <p className="mb-3">Close is lower than open, creating a red (or black) body. Represents selling pressure and downward movement.</p>
                    <ul className="space-y-1 text-sm">
                      <li>• Long red body = Strong selling pressure</li>
                      <li>• Small red body = Weak selling, indecision</li>
                      <li>• Upper wick = Sellers overwhelmed buyers at highs</li>
                      <li>• Lower wick = Some buying interest at lows</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </SkillLevelSection>
          </section>

          {/* SINGLE CANDLESTICK PATTERNS */}
          <section id="single">
            <SkillLevelSection level="novice" title="Single Candlestick Patterns">
              <p className="text-muted-foreground mb-6">
                Single candlestick patterns are the foundation of candlestick analysis. These one-bar formations reveal immediate shifts in market sentiment and often signal potential reversals when they appear at key levels.
              </p>

              {/* Doji Pattern */}
              <h3 className="text-xl font-semibold mt-8 mb-4">Doji</h3>
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <div className="rounded-xl overflow-hidden border border-border">
                  <LazyPatternChart patternType="doji" height={350} showTitle={false} />
                </div>
                <div className="bg-accent/50 p-6 rounded-lg">
                  <Badge className="mb-3 bg-yellow-500/20 text-yellow-600">Neutral / Reversal</Badge>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Formation:</strong> Open and close are virtually equal, creating a cross or plus sign shape. The body is extremely small or non-existent.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Psychology:</strong> Neither bulls nor bears are in control. The market opened, moved up and down during the session, but closed right where it started — complete indecision.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Trading Signal:</strong> At trend extremes, dojis often signal reversals. After a strong uptrend, a doji warns that buying momentum is exhausted. After a downtrend, it signals potential bottom.
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Success Rate:</strong> ~50% (needs confirmation candle)
                  </p>
                </div>
              </div>

              {/* Hammer Pattern */}
              <h3 className="text-xl font-semibold mt-8 mb-4">Hammer</h3>
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <div className="rounded-xl overflow-hidden border border-border">
                  <LazyPatternChart patternType="hammer" height={350} showTitle={false} />
                </div>
                <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg">
                  <Badge className="mb-3 bg-green-500/20 text-green-600">Bullish Reversal</Badge>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Formation:</strong> Small body at the top with a long lower wick (at least 2-3x body length). Little to no upper wick. Color of body is less important than shape.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Psychology:</strong> Sellers pushed price significantly lower during the session, but buyers stepped in aggressively and pushed price back up near the open. The long lower wick shows rejected selling pressure.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Requirements:</strong> Must appear after a downtrend. The longer the lower wick, the stronger the reversal signal.
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Success Rate:</strong> 60-70% with confirmation
                  </p>
                </div>
              </div>

              {/* Shooting Star Pattern */}
              <h3 className="text-xl font-semibold mt-8 mb-4">Shooting Star</h3>
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <div className="rounded-xl overflow-hidden border border-border">
                  <LazyPatternChart patternType="shooting-star" height={350} showTitle={false} />
                </div>
                <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-lg">
                  <Badge className="mb-3 bg-red-500/20 text-red-600">Bearish Reversal</Badge>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Formation:</strong> Small body at the bottom with a long upper wick (at least 2-3x body length). Little to no lower wick — the inverse of a hammer.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Psychology:</strong> Buyers pushed price significantly higher, but sellers overwhelmed them and pushed price back down near the open. The long upper wick shows rejected buying pressure.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Requirements:</strong> Must appear after an uptrend to be valid. The pattern "shoots up" like a star and falls back down.
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Success Rate:</strong> 65% with next candle confirmation
                  </p>
                </div>
              </div>

              {/* Spinning Top */}
              <h3 className="text-xl font-semibold mt-8 mb-4">Spinning Top</h3>
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <div className="rounded-xl overflow-hidden border border-border">
                  <LazyPatternChart patternType="spinning-top" height={350} showTitle={false} />
                </div>
                <div className="bg-accent/50 p-6 rounded-lg">
                  <Badge className="mb-3 bg-yellow-500/20 text-yellow-600">Indecision / Reversal</Badge>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Formation:</strong> Small body (bullish or bearish) with long upper and lower wicks of similar length. Like a doji but with a visible body.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Psychology:</strong> Intense battle between buyers and sellers with neither side gaining definitive control. Price moved significantly both up and down but closed near the open.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Context Matters:</strong> After strong trends, spinning tops indicate exhaustion. In consolidation zones, they confirm continued indecision. Always wait for the next candle for confirmation.
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Success Rate:</strong> 50-55% (weak signal alone)
                  </p>
                </div>
              </div>

              <ProTip>
                Single candlestick patterns are "warning signs" not "entry signals." They alert you to potential reversals but ALWAYS require confirmation from the next candle before acting. A hammer followed by a bearish candle is NOT a buy signal.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* TWO-CANDLESTICK PATTERNS */}
          <section id="two-candle">
            <SkillLevelSection level="intermediate" title="Two-Candlestick Patterns">
              <p className="text-muted-foreground mb-6">
                Two-candlestick patterns are more reliable than single-bar patterns because they show a shift in momentum over consecutive periods. The relationship between the two candles reveals changing market sentiment.
              </p>

              {/* Bullish Engulfing */}
              <h3 className="text-xl font-semibold mt-8 mb-4">Bullish Engulfing</h3>
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <div className="rounded-xl overflow-hidden border border-border">
                  <LazyPatternChart patternType="bullish-engulfing" height={350} showTitle={false} />
                </div>
                <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg">
                  <Badge className="mb-3 bg-green-500/20 text-green-600">Strong Bullish Reversal</Badge>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Formation:</strong> A small bearish candle followed by a larger bullish candle that completely engulfs (covers) the previous candle's body.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Psychology:</strong> Day 1 shows continued selling. Day 2 opens lower (gap down) but buyers aggressively push price up, closing above Day 1's open. Sellers are completely overwhelmed — a clear power shift.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Best Context:</strong> After a downtrend, at support levels, with high volume on the engulfing candle. The larger the second candle relative to the first, the stronger the signal.
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Success Rate:</strong> 63% at support levels
                  </p>
                </div>
              </div>

              {/* Bearish Engulfing */}
              <h3 className="text-xl font-semibold mt-8 mb-4">Bearish Engulfing</h3>
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <div className="rounded-xl overflow-hidden border border-border">
                  <LazyPatternChart patternType="bearish-engulfing" height={350} showTitle={false} />
                </div>
                <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-lg">
                  <Badge className="mb-3 bg-red-500/20 text-red-600">Strong Bearish Reversal</Badge>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Formation:</strong> A small bullish candle followed by a larger bearish candle that completely engulfs the previous candle's body.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Psychology:</strong> Day 1 shows continued buying. Day 2 opens higher (gap up) but sellers aggressively push price down, closing below Day 1's open. Buyers are completely overwhelmed.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Best Context:</strong> After an uptrend, at resistance levels, with high volume on the engulfing candle. One of the most reliable bearish reversal signals.
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Success Rate:</strong> 79% at resistance levels (strongest two-candle pattern)
                  </p>
                </div>
              </div>

              {/* Bullish Harami */}
              <h3 className="text-xl font-semibold mt-8 mb-4">Bullish Harami</h3>
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <div className="rounded-xl overflow-hidden border border-border">
                  <LazyPatternChart patternType="bullish-harami" height={350} showTitle={false} />
                </div>
                <div className="bg-accent/50 p-6 rounded-lg">
                  <Badge className="mb-3 bg-green-500/20 text-green-600">Moderate Bullish Reversal</Badge>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Formation:</strong> Large bearish candle followed by a small bullish candle that is completely contained within the previous candle's body. "Harami" means "pregnant" in Japanese.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Psychology:</strong> Day 1 shows strong selling. Day 2 opens higher and closes higher — but within Day 1's range. Selling pressure is decreasing but hasn't reversed. The small candle shows indecision.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Important:</strong> Weaker signal than engulfing. ALWAYS wait for a third candle to confirm the reversal before entering. The smaller the second candle, the more indecision exists.
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Success Rate:</strong> 53% (needs confirmation)
                  </p>
                </div>
              </div>

              {/* Bearish Harami */}
              <h3 className="text-xl font-semibold mt-8 mb-4">Bearish Harami</h3>
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <div className="rounded-xl overflow-hidden border border-border">
                  <LazyPatternChart patternType="bearish-harami" height={350} showTitle={false} />
                </div>
                <div className="bg-accent/50 p-6 rounded-lg">
                  <Badge className="mb-3 bg-red-500/20 text-red-600">Moderate Bearish Reversal</Badge>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Formation:</strong> Large bullish candle followed by a small bearish candle that is completely contained within the previous candle's body.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Psychology:</strong> Day 1 shows strong buying. Day 2 opens lower and closes lower — but within Day 1's range. Buying pressure is decreasing but hasn't fully reversed.
                  </p>
                  <p className="text-muted-foreground mb-3">
                    <strong className="text-foreground">Important:</strong> This is an early warning signal, not a confirmed reversal. The trend could easily continue. Wait for bearish confirmation on Day 3 before shorting.
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Success Rate:</strong> 51% (relatively weak signal)
                  </p>
                </div>
              </div>

              <ProTip>
                Engulfing patterns are much stronger than harami patterns because they show a decisive shift in control. A bearish engulfing at resistance with high volume is one of the highest-probability short setups in candlestick analysis.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* THREE-CANDLESTICK PATTERNS */}
          <section id="three-candle">
            <SkillLevelSection level="advanced" title="Three-Candlestick Patterns">
              <p className="text-muted-foreground mb-6">
                Three-candlestick patterns are the most reliable because they show a complete story: the trend, the turning point, and the confirmation. When these patterns form at key levels, they offer high-probability trade setups.
              </p>

              {/* Morning Star */}
              <h3 className="text-xl font-semibold mt-8 mb-4">Morning Star (Bullish)</h3>
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-green-500/20 text-green-600">Strong Bullish Reversal</Badge>
                  <Badge variant="outline">78% Success Rate</Badge>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                    <p className="text-2xl mb-2">📉</p>
                    <p className="font-semibold">Candle 1</p>
                    <p className="text-sm text-muted-foreground">Large bearish candle continuing the downtrend</p>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                    <p className="text-2xl mb-2">⭐</p>
                    <p className="font-semibold">Candle 2 (Star)</p>
                    <p className="text-sm text-muted-foreground">Small-bodied candle (any color) — the indecision point</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                    <p className="text-2xl mb-2">📈</p>
                    <p className="font-semibold">Candle 3</p>
                    <p className="text-sm text-muted-foreground">Large bullish candle confirming the reversal</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-3">
                  <strong className="text-foreground">Requirements:</strong> Third candle must close above the midpoint of the first candle's body. The "star" (middle candle) should gap down from Candle 1 for ideal formation.
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Psychology:</strong> Sellers control Day 1. Day 2 shows exhaustion and indecision (the "star" before dawn). Day 3 buyers take over aggressively, signaling the trend has reversed.
                </p>
              </div>

              {/* Evening Star */}
              <h3 className="text-xl font-semibold mt-8 mb-4">Evening Star (Bearish)</h3>
              <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-lg mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-red-500/20 text-red-600">Strong Bearish Reversal</Badge>
                  <Badge variant="outline">72% Success Rate</Badge>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                    <p className="text-2xl mb-2">📈</p>
                    <p className="font-semibold">Candle 1</p>
                    <p className="text-sm text-muted-foreground">Large bullish candle continuing the uptrend</p>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                    <p className="text-2xl mb-2">⭐</p>
                    <p className="font-semibold">Candle 2 (Star)</p>
                    <p className="text-sm text-muted-foreground">Small-bodied candle (any color) — hesitation at the top</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                    <p className="text-2xl mb-2">📉</p>
                    <p className="font-semibold">Candle 3</p>
                    <p className="text-sm text-muted-foreground">Large bearish candle confirming the reversal</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-3">
                  <strong className="text-foreground">Requirements:</strong> Third candle must close below the midpoint of the first candle's body. The star should gap up from Candle 1 for ideal formation.
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Psychology:</strong> Buyers control Day 1. Day 2 shows hesitation at the high (the "evening star" as the sun sets). Day 3 sellers take over, confirming the reversal.
                </p>
              </div>

              {/* Three White Soldiers */}
              <h3 className="text-xl font-semibold mt-8 mb-4">Three White Soldiers (Bullish)</h3>
              <div className="bg-accent/50 p-6 rounded-lg mb-8">
                <Badge className="mb-3 bg-green-500/20 text-green-600">Very Strong Bullish Continuation/Reversal</Badge>
                <p className="text-muted-foreground mb-3">
                  <strong className="text-foreground">Formation:</strong> Three consecutive long bullish candles, each with higher closes. Each candle opens within the previous candle's body and closes near its high.
                </p>
                <p className="text-muted-foreground mb-3">
                  <strong className="text-foreground">Psychology:</strong> Sustained buying pressure over three periods. Each day buyers enter early and maintain control until close. Very strong momentum signal.
                </p>
                <p className="text-muted-foreground mb-3">
                  <strong className="text-foreground">Warning:</strong> Watch for very long wicks on the third candle or diminishing candle sizes — these indicate weakening momentum and potential pullback.
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Best Context:</strong> After extended downtrend or at major support levels. High reliability when combined with volume confirmation.
                </p>
              </div>

              {/* Three Black Crows */}
              <h3 className="text-xl font-semibold mt-8 mb-4">Three Black Crows (Bearish)</h3>
              <div className="bg-accent/50 p-6 rounded-lg mb-8">
                <Badge className="mb-3 bg-red-500/20 text-red-600">Very Strong Bearish Continuation/Reversal</Badge>
                <p className="text-muted-foreground mb-3">
                  <strong className="text-foreground">Formation:</strong> Three consecutive long bearish candles, each with lower closes. Each candle opens within the previous candle's body and closes near its low.
                </p>
                <p className="text-muted-foreground mb-3">
                  <strong className="text-foreground">Psychology:</strong> Sustained selling pressure over three periods. Each day sellers dominate from open to close. Very strong downward momentum signal.
                </p>
                <p className="text-muted-foreground mb-3">
                  <strong className="text-foreground">Warning:</strong> If candles are extremely long or if you're already in a steep downtrend, this could indicate selling climax rather than continued downside.
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Best Context:</strong> After extended uptrend or at major resistance levels. The ominous "crows" signal that buyers have lost control.
                </p>
              </div>
            </SkillLevelSection>
          </section>

          {/* TRADING RULES */}
          <section id="trading-rules">
            <h2 className="text-2xl font-bold mt-12 mb-4">Trading Rules & Best Practices</h2>
            <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Context is King:</strong> Patterns work best at support/resistance levels or trend extremes. A hammer in the middle of a range is meaningless.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Volume Confirmation:</strong> Higher volume on the pattern candle increases reliability by 15-20%. Low volume patterns often fail.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Wait for Confirmation:</strong> Never enter on the pattern candle itself. Wait for the next candle to confirm the expected direction.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Higher Timeframes = Higher Reliability:</strong> Daily and 4H patterns are more reliable than 15M patterns. More participants = stronger signals.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Combine with Indicators:</strong> Use RSI divergence, MACD, or moving averages for confluence. Multiple confirmations improve win rate.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Set Proper Stops:</strong> Place stops beyond the pattern's extreme (e.g., below hammer's low, above shooting star's high).</span>
                </li>
              </ul>
            </div>
          </section>

          {/* COMMON MISTAKES */}
          <section id="mistakes">
            <h2 className="text-2xl font-bold mt-12 mb-4">Common Mistakes to Avoid</h2>
            <CommonMistakes 
              mistakes={[
                "Trading patterns in isolation without considering context (trend, S/R levels)",
                "Entering on the pattern candle instead of waiting for confirmation",
                "Ignoring volume — low volume patterns have high failure rates",
                "Taking every pattern signal (only trade high-probability setups at key levels)",
                "Using candlestick patterns on very short timeframes (1M, 5M are unreliable)",
                "Not combining with other analysis (support/resistance, trend lines, indicators)",
                "Setting stops too tight — patterns need room to work",
                "Trading patterns against the major trend (counter-trend patterns fail more often)"
              ]}
            />
          </section>

          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-12">
            <li>Candlestick patterns reveal market psychology and potential reversals</li>
            <li>Context matters most — patterns at S/R levels are most reliable</li>
            <li>Always wait for confirmation before entering trades</li>
            <li>Volume increases pattern reliability by 15-20%</li>
            <li>Engulfing patterns are stronger than harami patterns</li>
            <li>Three-candle patterns (morning/evening star) are the most reliable</li>
            <li>Higher timeframes produce more reliable signals</li>
            <li>Combine patterns with trend analysis and indicators for best results</li>
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
                  Combine candlestick patterns with S/R for highest probability trades.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/volume-analysis">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Volume Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Learn to confirm candlestick patterns with volume.
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandlestickPatterns;
