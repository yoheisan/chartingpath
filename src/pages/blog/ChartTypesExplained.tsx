import { Suspense, lazy, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Maximize2, Play, MousePointer, Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { generateDemoBars } from '@/utils/chartIndicators';
import { CompressedBar, VisualSpec, PatternQuality } from '@/types/VisualSpec';

// Lazy load chart components
const StudyChart = lazy(() => import('@/components/charts/StudyChart'));
const ThumbnailChart = lazy(() => import('@/components/charts/ThumbnailChart'));

/**
 * Chart Types Explained - Documentation page with real embedded charts
 * 
 * This page showcases the actual chart components used throughout ChartingPath,
 * giving users an authentic preview of each chart type.
 */
const ChartTypesExplained = () => {
  // Generate stable demo data for charts
  const studyChartBars = useMemo(() => generateDemoBars(120), []);
  const thumbnailBars = useMemo(() => generateDemoBars(40), []);
  const signalChartBars = useMemo(() => generateDemoBars(60), []);
  
  // Complete VisualSpec for thumbnail/signal chart demos
  const sampleVisualSpec: VisualSpec = useMemo(() => ({
    version: '2.0.0',
    symbol: 'DEMO',
    timeframe: '1D',
    patternId: 'demo-pattern',
    signalTs: new Date().toISOString(),
    window: {
      startTs: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      endTs: new Date().toISOString(),
    },
    yDomain: { min: 150, max: 200 },
    overlays: [
      { type: 'hline', id: 'entry', price: 172, label: 'Entry', style: 'primary' },
      { type: 'hline', id: 'sl', price: 160, label: 'Stop Loss', style: 'destructive' },
      { type: 'hline', id: 'tp', price: 188, label: 'Take Profit', style: 'positive' },
    ],
    pivots: [
      { index: 10, type: 'high', price: 175, timestamp: new Date().toISOString() },
      { index: 18, type: 'low', price: 162, timestamp: new Date().toISOString() },
      { index: 28, type: 'high', price: 180, timestamp: new Date().toISOString() },
    ],
    entryBarIndex: 32,
  }), []);

  // Complete PatternQuality for demos
  const createQuality = (score: number, grade: 'A' | 'B' | 'C' | 'D' | 'F'): PatternQuality => ({
    score,
    grade,
    confidence: score * 10,
    reasons: ['Strong trend alignment', 'Clean structure'],
    warnings: [],
    tradeable: score >= 6,
  });

  // Trade plan for signal chart demo
  const tradePlan = useMemo(() => ({
    entry: 172,
    stopLoss: 160,
    takeProfit: 188,
    direction: 'long' as const,
  }), []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <Link 
            to="/learn" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Learning Center
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Chart Types Explained</h1>
          <p className="text-muted-foreground mt-1">
            Interactive examples of every chart used on ChartingPath
          </p>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Visual Design Standard */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Visual Design Standard</h2>
          <Card className="bg-card border-border/50">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-10 bg-positive rounded" />
                  <div>
                    <p className="font-medium">Green Candles</p>
                    <p className="text-xs text-muted-foreground">Price up from previous close</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-10 bg-destructive rounded" />
                  <div>
                    <p className="font-medium">Red Candles</p>
                    <p className="text-xs text-muted-foreground">Price down from previous close</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-3 bg-background border border-border rounded" />
                  <div>
                    <p className="font-medium">Background</p>
                    <p className="text-xs text-muted-foreground">Dark theme (#0f0f0f)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Study Chart Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="text-primary border-primary">Primary</Badge>
            <h2 className="text-xl font-semibold">Study Chart</h2>
          </div>
          
          <p className="text-muted-foreground mb-4">
            The <strong className="text-foreground">Study Chart</strong> is your primary research workspace. It features full candlestick 
            display with volume, technical indicators (EMA, SMA, Bollinger Bands, VWAP), and professional 
            interactivity for deep analysis.
          </p>

          <Card className="mb-4 overflow-hidden">
            <CardHeader className="pb-2 border-b bg-muted/30">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Live Study Chart Example
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[400px] bg-background">
                <Suspense fallback={<Skeleton className="w-full h-full" />}>
                  <StudyChart 
                    bars={studyChartBars} 
                    symbol="DEMO" 
                    autoHeight 
                  />
                </Suspense>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Where to Find It</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-1">
                  <li>• Ticker Pages (<code className="text-xs bg-muted px-1 rounded">/study/AAPL</code>)</li>
                  <li>• Command Center dashboard</li>
                  <li>• Pattern detail views</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-1">
                  <li>• <strong className="text-foreground">Scroll</strong> to zoom time axis</li>
                  <li>• <strong className="text-foreground">Shift + Drag</strong> to pan vertically</li>
                  <li>• <strong className="text-foreground">Drag price scale</strong> to adjust range</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Full Chart Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="text-info border-info">Expanded</Badge>
            <h2 className="text-xl font-semibold">Full Chart</h2>
          </div>
          
          <p className="text-muted-foreground mb-4">
            The <strong className="text-foreground">Full Chart</strong> is an expanded modal view for deep analysis. It includes everything 
            from Study Chart plus trade overlay lines (Entry, Stop Loss, Take Profit), pattern zone markers, 
            and Trade Playback controls.
          </p>

          <Card className="mb-4 overflow-hidden">
            <CardHeader className="pb-2 border-b bg-muted/30">
              <CardTitle className="text-sm flex items-center gap-2">
                <Maximize2 className="h-4 w-4" />
                Full Chart with Trade Overlays
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[400px] bg-background">
                <Suspense fallback={<Skeleton className="w-full h-full" />}>
                  <StudyChart 
                    bars={signalChartBars} 
                    symbol="DEMO" 
                    autoHeight
                    tradePlan={tradePlan}
                  />
                </Suspense>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-warning" />
              <span className="text-sm">Entry Price</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 border-t-2 border-dashed border-destructive" />
              <span className="text-sm">Stop Loss</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 border-t-2 border-dashed border-positive" />
              <span className="text-sm">Take Profit</span>
            </div>
          </div>

          <Card className="bg-info/10 border-info/30">
            <CardContent className="p-4 text-sm">
              <p className="flex items-center gap-2">
                <Play className="h-4 w-4 text-info" />
                <strong className="text-foreground">Trade Playback:</strong> Full Charts support bar-by-bar animated replay of historical 
                trades, letting you study how setups evolved in real-time.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Thumbnail Chart Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="text-secondary-foreground border-secondary">Compact</Badge>
            <h2 className="text-xl font-semibold">Thumbnail Chart</h2>
          </div>
          
          <p className="text-muted-foreground mb-4">
            The <strong className="text-foreground">Thumbnail Chart</strong> is a compact, read-only preview designed for quick pattern 
            scanning. It appears in cards, tables, and galleries to let you scan dozens of patterns at a glance.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-[120px] bg-background">
                  <Suspense fallback={<Skeleton className="w-full h-full" />}>
                    <ThumbnailChart 
                      bars={thumbnailBars} 
                      visualSpec={sampleVisualSpec}
                      quality={createQuality(7.5 + i * 0.3, i >= 3 ? 'A' : 'B')}
                      height={120}
                    />
                  </Suspense>
                </div>
                <CardContent className="p-2 bg-muted/30">
                  <p className="text-xs font-medium">Sample Pattern {i}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-muted/30">
            <CardContent className="p-4 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">No interactivity</strong> — Thumbnails are optimized for fast rendering across 
                lists and galleries. Click any thumbnail to open the full detail view with interactive controls.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Signal Chart Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="text-warning border-warning">Detection</Badge>
            <h2 className="text-xl font-semibold">Signal Chart</h2>
          </div>
          
          <p className="text-muted-foreground mb-4">
            The <strong className="text-foreground">Signal Chart</strong> is specialized for detected patterns with trade execution overlays. 
            It displays pattern zones, entry markers, quality grades, and complete trade plans.
          </p>

          <Card className="mb-4 overflow-hidden">
            <CardHeader className="pb-2 border-b bg-muted/30">
              <CardTitle className="text-sm">Signal Chart with Pattern Overlays</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[180px] bg-background">
                <Suspense fallback={<Skeleton className="w-full h-full" />}>
                  <ThumbnailChart 
                    bars={signalChartBars} 
                    visualSpec={sampleVisualSpec}
                    quality={createQuality(8.2, 'A')}
                    height={180}
                    instrument="AAPL"
                  />
                </Suspense>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-secondary/30 border border-secondary rounded" />
              <span className="text-sm">Pattern Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-warning rounded-full flex items-center justify-center">
                <span className="text-[8px] text-warning-foreground">▲</span>
              </div>
              <span className="text-sm">Entry Marker</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-positive/20 text-positive text-xs">A</Badge>
              <span className="text-sm">Quality Grade</span>
            </div>
          </div>
        </section>

        {/* Controls Reference */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Chart Controls Reference</h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">Action</th>
                    <th className="text-left p-3 font-medium">Desktop</th>
                    <th className="text-left p-3 font-medium">Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">Zoom time axis</td>
                    <td className="p-3 text-muted-foreground">Scroll wheel</td>
                    <td className="p-3 text-muted-foreground">Pinch</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Pan horizontally</td>
                    <td className="p-3 text-muted-foreground">Click + drag</td>
                    <td className="p-3 text-muted-foreground">Swipe</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Pan vertically</td>
                    <td className="p-3 text-muted-foreground">Shift + drag</td>
                    <td className="p-3 text-muted-foreground">Two-finger drag</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Adjust price scale</td>
                    <td className="p-3 text-muted-foreground">Drag right axis</td>
                    <td className="p-3 text-muted-foreground">Drag right edge</td>
                  </tr>
                  <tr>
                    <td className="p-3">Reset view</td>
                    <td className="p-3 text-muted-foreground">Click ↺ button</td>
                    <td className="p-3 text-muted-foreground">Tap ↺ button</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        {/* When to Use */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">When to Use Each Chart</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Study Chart</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Daily research, instrument analysis, indicator studies
              </CardContent>
            </Card>
            <Card className="border-info/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Full Chart</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Deep analysis, trade planning, playback review
              </CardContent>
            </Card>
            <Card className="border-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Thumbnail Chart</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Quick scanning, pattern comparison, galleries
              </CardContent>
            </Card>
            <Card className="border-warning/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Signal Chart</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Trade decisions, entry/exit planning, alerts
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Related Guides */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Related Guides</h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/blog/command-center-guide">
              <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                Command Center Guide
              </Badge>
            </Link>
            <Link to="/blog/platform-glossary">
              <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                Platform Glossary
              </Badge>
            </Link>
            <Link to="/blog/platform-faq">
              <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                Platform FAQ
              </Badge>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ChartTypesExplained;
