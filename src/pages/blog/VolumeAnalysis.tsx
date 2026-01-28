import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Volume2, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import {
  SkillLevelSection,
  ProTip,
  CommonMistakes,
  StatisticsBox,
  TableOfContents
} from "@/components/blog/ArticleSection";
import { EducationalChart, ChartGuideStep, CandleData } from "@/components/charts/EducationalChart";
import { generateEducationalCandleData } from "@/utils/contentMaturityScanner";

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

  // Generate educational chart data
  const uptrendVolumeData = useMemo(() => generateEducationalCandleData('uptrend-volume', 45), []);
  const breakoutData = useMemo(() => generateEducationalCandleData('breakout', 50), []);
  const divergenceData = useMemo(() => generateEducationalCandleData('divergence', 40), []);
  const accumulationData = useMemo(() => generateEducationalCandleData('accumulation', 35), []);

  // Interactive guide steps for healthy uptrend volume
  const uptrendGuideSteps: ChartGuideStep[] = [
    {
      title: "Observe the Price Trend",
      description: "Notice how price is making higher highs and higher lows. This is a healthy uptrend structure. Now let's see how volume confirms this move.",
      focusArea: { startIndex: 5, endIndex: 40 },
      annotations: [
        { type: 'arrow', fromIndex: 5, toIndex: 15, fromPrice: uptrendVolumeData[5]?.low, toPrice: uptrendVolumeData[15]?.high, label: "Higher High", color: "hsl(142, 76%, 36%)" },
        { type: 'arrow', fromIndex: 20, toIndex: 30, fromPrice: uptrendVolumeData[20]?.low, toPrice: uptrendVolumeData[30]?.high, label: "Higher High", color: "hsl(142, 76%, 36%)" },
      ]
    },
    {
      title: "Volume Increases on Up Days",
      description: "Look at the volume bars below. The GREEN (bullish) days show HIGHER volume than average - this is the 'fuel' driving price higher. The yellow dashed line shows the 20-period average.",
      highlightIndices: [8, 12, 18, 25, 32, 38],
      annotations: [
        { type: 'volume-highlight', fromIndex: 8, toIndex: 12, label: "Strong buying pressure", color: "hsl(142, 76%, 50%)" },
        { type: 'volume-highlight', fromIndex: 25, toIndex: 32, label: "Continued institutional interest", color: "hsl(142, 76%, 50%)" },
      ]
    },
    {
      title: "Volume Decreases on Pullbacks",
      description: "During pullbacks (red candles), volume is BELOW average. This shows sellers lack conviction - they're not committed. This is a healthy sign for continuation.",
      highlightIndices: [10, 16, 22, 28],
      annotations: [
        { type: 'volume-highlight', fromIndex: 10, toIndex: 11, label: "Low volume pullback", color: "hsl(0, 84%, 60%)" },
        { type: 'callout', index: 16, price: uptrendVolumeData[16]?.low, label: "Weak selling", color: "hsl(45, 93%, 47%)" },
      ]
    },
    {
      title: "The Complete Picture",
      description: "In a healthy uptrend: HIGH volume on advances + LOW volume on pullbacks = strong trend likely to continue. This is the volume signature of institutional accumulation.",
      annotations: [
        { type: 'zone', fromIndex: 0, toIndex: 44, fromPrice: uptrendVolumeData[0]?.close, toPrice: uptrendVolumeData[44]?.close, label: "Healthy Uptrend Zone" },
        { type: 'line', fromIndex: 0, toIndex: 44, price: uptrendVolumeData[20]?.close, label: "Trend support", color: "hsl(217, 91%, 60%)", style: 'dashed' },
      ]
    },
  ];

  // Breakout volume guide steps
  const breakoutGuideSteps: ChartGuideStep[] = [
    {
      title: "Identify the Resistance Level",
      description: "First, identify the key resistance level where price has been rejected multiple times. This is where breakout traders wait for confirmation.",
      focusArea: { startIndex: 15, endIndex: 38 },
      annotations: [
        { type: 'line', fromIndex: 15, toIndex: 45, price: 109, label: "Resistance", color: "hsl(0, 84%, 60%)", style: 'dashed' },
        { type: 'callout', index: 22, price: 109, label: "Rejection", color: "hsl(0, 84%, 60%)" },
        { type: 'callout', index: 30, price: 108.5, label: "Rejection", color: "hsl(0, 84%, 60%)" },
      ]
    },
    {
      title: "Notice Declining Volume During Consolidation",
      description: "As price consolidates below resistance, volume DECREASES. This is like a spring being compressed - energy is building for a big move.",
      focusArea: { startIndex: 18, endIndex: 38 },
      annotations: [
        { type: 'volume-highlight', fromIndex: 18, toIndex: 38, label: "Volume compression (building energy)", color: "hsl(45, 93%, 47%)" },
        { type: 'zone', fromIndex: 18, toIndex: 38, fromPrice: 105, toPrice: 110, label: "Consolidation Zone" },
      ]
    },
    {
      title: "The Breakout: Volume EXPLOSION",
      description: "When price breaks above resistance, volume SPIKES to 2-3x the average. This is the confirmation - institutions are committing capital. This is NOT a false breakout.",
      highlightIndices: [39, 40, 41, 42],
      annotations: [
        { type: 'volume-highlight', fromIndex: 39, toIndex: 42, label: "Volume spike >200% of average!", color: "hsl(142, 76%, 50%)" },
        { type: 'callout', index: 40, price: breakoutData[40]?.high, label: "Confirmed Breakout", color: "hsl(142, 76%, 50%)" },
        { type: 'arrow', fromIndex: 38, toIndex: 42, fromPrice: 109, toPrice: breakoutData[42]?.high, label: "Entry Zone", color: "hsl(217, 91%, 60%)" },
      ]
    },
    {
      title: "Trade Execution Plan",
      description: "Entry: On breakout candle close with volume >150% average. Stop Loss: Below the breakout level (old resistance = new support). Target: Measured move = height of consolidation added to breakout point.",
      annotations: [
        { type: 'line', fromIndex: 38, toIndex: 49, price: 109, label: "Support (former resistance)", color: "hsl(142, 76%, 50%)", style: 'dashed' },
        { type: 'callout', index: 41, price: breakoutData[41]?.close, label: "ENTRY", color: "hsl(217, 91%, 60%)" },
        { type: 'line', fromIndex: 40, toIndex: 49, price: 107, label: "Stop Loss", color: "hsl(0, 84%, 60%)", style: 'dashed' },
        { type: 'arrow', fromIndex: 42, toIndex: 48, fromPrice: breakoutData[42]?.close, toPrice: 118, label: "Target", color: "hsl(142, 76%, 50%)" },
      ]
    },
  ];

  // Divergence guide steps
  const divergenceGuideSteps: ChartGuideStep[] = [
    {
      title: "Price Making New Highs",
      description: "The price chart looks bullish - we see price making successively HIGHER HIGHS. At first glance, the trend looks strong. But is it?",
      annotations: [
        { type: 'callout', index: 12, price: divergenceData[12]?.high, label: "High 1", color: "hsl(142, 76%, 50%)" },
        { type: 'callout', index: 25, price: divergenceData[25]?.high, label: "High 2", color: "hsl(142, 76%, 50%)" },
        { type: 'callout', index: 38, price: divergenceData[38]?.high, label: "High 3", color: "hsl(142, 76%, 50%)" },
        { type: 'arrow', fromIndex: 12, toIndex: 38, fromPrice: divergenceData[12]?.high, toPrice: divergenceData[38]?.high, label: "Price: Higher Highs", color: "hsl(142, 76%, 50%)" },
      ]
    },
    {
      title: "Volume Tells a Different Story",
      description: "Now look at the volume bars. While price is rising, volume is DECLINING with each new high. The fuel is running out. Fewer traders are participating in each rally.",
      annotations: [
        { type: 'volume-highlight', fromIndex: 10, toIndex: 14, label: "High volume", color: "hsl(142, 76%, 50%)" },
        { type: 'volume-highlight', fromIndex: 23, toIndex: 27, label: "Lower volume", color: "hsl(45, 93%, 47%)" },
        { type: 'volume-highlight', fromIndex: 36, toIndex: 39, label: "Lowest volume", color: "hsl(0, 84%, 60%)" },
        { type: 'arrow', fromIndex: 12, toIndex: 38, fromPrice: divergenceData[38]?.low - 5, toPrice: divergenceData[38]?.low - 10, label: "Volume: Declining", color: "hsl(0, 84%, 60%)" },
      ]
    },
    {
      title: "Bearish Divergence Warning",
      description: "This is BEARISH DIVERGENCE: Price Higher + Volume Lower = Weakening Trend. Smart money is distributing (selling) while retail traders buy the 'breakout'.",
      focusArea: { startIndex: 30, endIndex: 39 },
      annotations: [
        { type: 'zone', fromIndex: 30, toIndex: 39, fromPrice: divergenceData[30]?.low, toPrice: divergenceData[38]?.high, label: "⚠️ DANGER ZONE" },
        { type: 'callout', index: 35, price: divergenceData[35]?.high, label: "Weak rally", color: "hsl(0, 84%, 60%)" },
      ]
    },
    {
      title: "Trading the Divergence",
      description: "Action: Do NOT buy new highs with declining volume. Consider: Taking profits on longs, tightening stops, or entering shorts with a stop above the final high.",
      annotations: [
        { type: 'callout', index: 38, price: divergenceData[38]?.high, label: "Potential Short Entry", color: "hsl(0, 84%, 60%)" },
        { type: 'line', fromIndex: 35, toIndex: 39, price: divergenceData[38]?.high + 2, label: "Stop Loss", color: "hsl(0, 84%, 60%)", style: 'dashed' },
        { type: 'arrow', fromIndex: 38, toIndex: 39, fromPrice: divergenceData[38]?.close, toPrice: divergenceData[38]?.close - 10, label: "Expected Move", color: "hsl(0, 84%, 60%)" },
      ]
    },
  ];

  // Accumulation guide steps  
  const accumulationGuideSteps: ChartGuideStep[] = [
    {
      title: "Price Goes Nowhere... Volume Increases",
      description: "The price action looks boring - moving sideways in a tight range. But look at the volume: it's INCREASING while price stays flat. Something is happening.",
      focusArea: { startIndex: 5, endIndex: 32 },
      annotations: [
        { type: 'zone', fromIndex: 5, toIndex: 32, fromPrice: 98, toPrice: 102, label: "Tight Trading Range" },
      ]
    },
    {
      title: "Volume Precedes Price",
      description: "This is accumulation: smart money is quietly buying at these levels. They can't buy all at once without moving the price, so they accumulate over time.",
      annotations: [
        { type: 'volume-highlight', fromIndex: 5, toIndex: 10, label: "Building position", color: "hsl(217, 91%, 60%)" },
        { type: 'volume-highlight', fromIndex: 18, toIndex: 25, label: "Heavy accumulation", color: "hsl(142, 76%, 50%)" },
        { type: 'volume-highlight', fromIndex: 28, toIndex: 34, label: "Final loading", color: "hsl(142, 76%, 70%)" },
      ]
    },
    {
      title: "The Telltale Signs",
      description: "Look for: Volume rising into a flat price range, each volume spike slightly higher than the last, tight price action suggesting equilibrium before a move.",
      highlightIndices: [15, 22, 30],
      annotations: [
        { type: 'callout', index: 15, price: 100, label: "Spike 1", color: "hsl(217, 91%, 60%)" },
        { type: 'callout', index: 22, price: 100, label: "Spike 2 (higher)", color: "hsl(142, 76%, 50%)" },
        { type: 'callout', index: 30, price: 100, label: "Spike 3 (highest)", color: "hsl(142, 76%, 70%)" },
      ]
    },
    {
      title: "Position for the Breakout",
      description: "Trade Plan: Wait for price to break above the range with volume confirmation. Entry: Above range high. Stop: Below range low. Target: Range height projected upward.",
      annotations: [
        { type: 'line', fromIndex: 0, toIndex: 34, price: 102, label: "Breakout Level", color: "hsl(142, 76%, 50%)", style: 'dashed' },
        { type: 'line', fromIndex: 0, toIndex: 34, price: 98, label: "Stop Loss Zone", color: "hsl(0, 84%, 60%)", style: 'dashed' },
        { type: 'arrow', fromIndex: 32, toIndex: 34, fromPrice: 102, toPrice: 106, label: "Expected Move", color: "hsl(142, 76%, 50%)" },
      ]
    },
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
            <Badge className="bg-green-500/20 text-green-500 flex items-center gap-1">
              <Play className="h-3 w-3" />
              Interactive
            </Badge>
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

              {/* Interactive Volume Education Chart */}
              <div className="my-8 rounded-xl overflow-hidden border border-border">
                <EducationalChart
                  candles={uptrendVolumeData}
                  guideSteps={uptrendGuideSteps}
                  title="Understanding Volume in an Uptrend"
                  subtitle="Interactive walkthrough - Use controls below to navigate"
                  width={900}
                  height={550}
                  showVolume={true}
                  showVolumeContext={true}
                  volumeAveragePeriod={20}
                  autoPlay={false}
                  stepDuration={5000}
                />
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

              {/* Accumulation Chart */}
              <div className="my-8 rounded-xl overflow-hidden border border-border">
                <EducationalChart
                  candles={accumulationData}
                  guideSteps={accumulationGuideSteps}
                  title="Volume Precedes Price: Accumulation"
                  subtitle="Watch how smart money accumulates before the move"
                  width={900}
                  height={500}
                  showVolume={true}
                  showVolumeContext={true}
                  volumeAveragePeriod={15}
                />
              </div>

              <ProTip>
                Always compare current volume to the 20-day or 50-day average volume. A "high volume" day should be at least 50% above average. 
                The yellow dashed line in our charts shows this average — use it as your reference!
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* VOLUME PATTERNS */}
          <section id="patterns">
            <SkillLevelSection level="intermediate" title="Volume Patterns and Signals">
              <p className="text-muted-foreground mb-6">
                Understanding how volume behaves during trends, at key levels, and during divergences will dramatically improve your trade selection.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-4">Volume Divergence: The Warning Signal</h3>
              
              <p className="text-muted-foreground mb-6">
                Divergence between price and volume is one of the most powerful warning signals in technical analysis. 
                When price and volume tell different stories, trust the volume — it reveals true market conviction.
              </p>

              {/* Divergence Chart */}
              <div className="my-8 rounded-xl overflow-hidden border border-border">
                <EducationalChart
                  candles={divergenceData}
                  guideSteps={divergenceGuideSteps}
                  title="Bearish Divergence: Early Warning System"
                  subtitle="Learn to spot when the trend is losing steam"
                  width={900}
                  height={520}
                  showVolume={true}
                  showVolumeContext={true}
                  volumeAveragePeriod={20}
                />
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

              {/* Breakout Chart */}
              <div className="my-8 rounded-xl overflow-hidden border border-border">
                <EducationalChart
                  candles={breakoutData}
                  guideSteps={breakoutGuideSteps}
                  title="Breakout Trading with Volume Confirmation"
                  subtitle="Step-by-step trade execution plan"
                  width={900}
                  height={550}
                  showVolume={true}
                  showVolumeContext={true}
                  volumeAveragePeriod={20}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <Card className="bg-green-500/5 border-green-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-green-500">
                      <CheckCircle className="h-4 w-4" />
                      Valid Breakout Checklist
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>✅ Volume spike &gt;150% of 20-day average</p>
                    <p>✅ Strong candle close above resistance</p>
                    <p>✅ Prior consolidation with declining volume</p>
                    <p>✅ Follow-through on subsequent bars</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-red-500/5 border-red-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-red-500">
                      <AlertTriangle className="h-4 w-4" />
                      False Breakout Warning Signs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>❌ Volume below or at average</p>
                    <p>❌ Long wicks / rejection candles</p>
                    <p>❌ Quick reversal back below level</p>
                    <p>❌ No volume confirmation on retest</p>
                  </CardContent>
                </Card>
              </div>

              <ProTip>
                The best breakout entries come on the retest: After an initial breakout with volume, price often pulls back to test the broken level. 
                If this retest holds on LOW volume, it's an even better entry with a tighter stop loss.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* VOLUME INDICATORS */}
          <section id="indicators">
            <SkillLevelSection level="advanced" title="Volume Indicators">
              <p className="text-muted-foreground mb-6">
                Beyond raw volume, several indicators help quantify and smooth volume data for better analysis.
              </p>

              <div className="grid gap-4 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">On-Balance Volume (OBV)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    <p className="mb-3">OBV adds volume on up days and subtracts on down days, creating a cumulative line. 
                    When OBV diverges from price, it signals potential reversals.</p>
                    <div className="p-3 bg-primary/5 rounded-lg text-sm">
                      <strong>Use:</strong> OBV making new highs while price consolidates = bullish accumulation
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Volume Price Trend (VPT)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    <p className="mb-3">VPT weights volume by the percentage price change, giving more significance to 
                    larger price moves with high volume.</p>
                    <div className="p-3 bg-primary/5 rounded-lg text-sm">
                      <strong>Use:</strong> Rising VPT confirms uptrend strength; falling VPT warns of weakness
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Volume Weighted Average Price (VWAP)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    <p className="mb-3">VWAP shows the average price weighted by volume throughout the day. 
                    Institutions use VWAP as a benchmark for execution quality.</p>
                    <div className="p-3 bg-primary/5 rounded-lg text-sm">
                      <strong>Use:</strong> Price above VWAP = bullish intraday bias; below VWAP = bearish bias
                    </div>
                  </CardContent>
                </Card>
              </div>
            </SkillLevelSection>
          </section>

          {/* STRATEGIES */}
          <section id="strategies">
            <h2 className="text-2xl font-bold mb-6">Trading Strategies Using Volume</h2>
            
            <div className="space-y-6 mb-8">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Strategy 1: Volume Breakout</h3>
                  <p className="text-muted-foreground mb-4">
                    Enter long when price breaks above resistance with volume &gt;150% of 20-day average.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">Entry</p>
                      <p className="text-muted-foreground">Close above level + volume spike</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">Stop Loss</p>
                      <p className="text-muted-foreground">Below breakout candle low</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">Target</p>
                      <p className="text-muted-foreground">1.5x - 2x risk distance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Strategy 2: Volume Divergence Fade</h3>
                  <p className="text-muted-foreground mb-4">
                    Enter short when price makes new high but volume makes lower high (bearish divergence).
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">Entry</p>
                      <p className="text-muted-foreground">On rejection candle at divergence peak</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">Stop Loss</p>
                      <p className="text-muted-foreground">Above the divergence high</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">Target</p>
                      <p className="text-muted-foreground">Previous swing low or 2:1 R:R</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Strategy 3: Accumulation Anticipation</h3>
                  <p className="text-muted-foreground mb-4">
                    Enter long when you spot accumulation (rising volume + flat price) before the breakout.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">Entry</p>
                      <p className="text-muted-foreground">On breakout of accumulation range</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">Stop Loss</p>
                      <p className="text-muted-foreground">Below accumulation range low</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">Target</p>
                      <p className="text-muted-foreground">Range height projected from breakout</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* COMMON MISTAKES */}
          <section id="mistakes">
            <CommonMistakes mistakes={[
              "Looking at volume bars in isolation — Always compare to the 20-period average volume line (the yellow dashed line in our charts)",
              "Ignoring volume on breakouts — Only trade breakouts with volume >150% of average; this single rule eliminates most failed breakouts",
              "Expecting instant reversals after divergence — Divergence is a warning, not a timing signal. Wait for price confirmation (rejection candle, break of support)",
              "Using volume the same way across all markets — Forex has no centralized volume (use tick volume as a proxy). Crypto runs 24/7, so daily volume patterns differ from stocks",
              "Chasing low-volume rallies — If volume doesn't confirm the move, assume it will fail. Better entries come on pullbacks with proper volume confirmation"
            ]} />
          </section>

          {/* Summary Box */}
          <Card className="mt-12 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-4">Volume Analysis Summary</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-green-500">Key Bullish Signals</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• High volume on advances, low on pullbacks</li>
                    <li>• Volume spike on resistance breakout</li>
                    <li>• Accumulation (rising volume + flat price)</li>
                    <li>• Bullish divergence at lows</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-red-500">Key Bearish Signals</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• High volume on declines, low on bounces</li>
                    <li>• Volume spike on support breakdown</li>
                    <li>• Distribution (rising volume + flat price at highs)</li>
                    <li>• Bearish divergence at highs</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

        </article>
      </div>
    </div>
  );
};

export default VolumeAnalysis;
