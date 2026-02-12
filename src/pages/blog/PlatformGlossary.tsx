import { Suspense, lazy, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, BookOpen, BarChart3, Target, Shield, TrendingUp, TrendingDown, Zap, Bell, Calculator, Activity, Command, Monitor, Layout } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { generateDemoBars } from '@/utils/chartIndicators';

// Lazy load chart components
const ThumbnailChart = lazy(() => import('@/components/charts/ThumbnailChart'));

interface GlossaryTerm {
  term: string;
  definition: string;
  category: 'charts' | 'patterns' | 'trading' | 'platform' | 'metrics';
  visual?: React.ReactNode;
}

/**
 * Platform Glossary - Visual reference for all ChartingPath terminology
 */
const PlatformGlossary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Demo data for chart visualizations
  const demoBars = useMemo(() => generateDemoBars(30), []);
  const demoVisualSpec = useMemo(() => ({
    version: '2.0.0',
    symbol: 'DEMO',
    timeframe: '1D',
    patternId: 'demo',
    signalTs: new Date().toISOString(),
    window: { startTs: new Date().toISOString(), endTs: new Date().toISOString() },
    yDomain: { min: 150, max: 200 },
    overlays: [],
  }), []);

  const glossaryTerms: GlossaryTerm[] = useMemo(() => [
    // Charts Category
    {
      term: 'Study Chart',
      definition: 'The primary research chart with full candlesticks, volume, and technical indicators (EMA, SMA, Bollinger Bands, VWAP). Found on ticker pages and the Command Center.',
      category: 'charts',
      visual: (
        <div className="h-20 bg-background rounded overflow-hidden">
          <Suspense fallback={<Skeleton className="w-full h-full" />}>
            <ThumbnailChart bars={demoBars} visualSpec={demoVisualSpec} height={80} />
          </Suspense>
        </div>
      ),
    },
    {
      term: 'Full Chart',
      definition: 'An expanded modal view of the Study Chart with trade overlays (Entry, Stop Loss, Take Profit lines), pattern zone markers, and Trade Playback controls.',
      category: 'charts',
      visual: (
        <div className="space-y-2">
          <div className="h-20 bg-background rounded overflow-hidden border">
            <Suspense fallback={<Skeleton className="w-full h-full" />}>
              <ThumbnailChart 
                bars={demoBars} 
                visualSpec={{
                  ...demoVisualSpec,
                  overlays: [
                    { type: 'hline' as const, id: 'entry', price: 175, label: 'Entry', style: 'primary' as const },
                    { type: 'hline' as const, id: 'sl', price: 168, label: 'SL', style: 'destructive' as const },
                    { type: 'hline' as const, id: 'tp', price: 189, label: 'TP', style: 'positive' as const },
                  ],
                }} 
                height={80} 
              />
            </Suspense>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-8 h-0.5 bg-warning" />
              <span className="text-muted-foreground">Entry</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-8 border-t border-dashed" style={{ borderColor: '#ef4444' }} />
              <span className="text-muted-foreground">SL</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-8 border-t border-dashed" style={{ borderColor: '#22c55e' }} />
              <span className="text-muted-foreground">TP</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      term: 'Thumbnail Chart',
      definition: 'A compact, read-only chart preview used in pattern cards and galleries. Optimized for fast scanning without interactive controls.',
      category: 'charts',
      visual: (
        <div className="grid grid-cols-3 gap-2">
          {[60, 70, 65].map((h, i) => (
            <div key={i} className="h-12 bg-background rounded overflow-hidden border">
              <Suspense fallback={<Skeleton className="w-full h-full" />}>
                <ThumbnailChart bars={demoBars.slice(i * 5)} visualSpec={demoVisualSpec} height={48} />
              </Suspense>
            </div>
          ))}
        </div>
      ),
    },
    {
      term: 'Signal Chart',
      definition: 'A specialized chart for detected patterns showing entry markers, price levels, pattern zones, and quality grades.',
      category: 'charts',
      visual: (
        <div className="flex items-center gap-3">
          <div className="h-16 flex-1 bg-background rounded overflow-hidden border">
            <Suspense fallback={<Skeleton className="w-full h-full" />}>
              <ThumbnailChart 
                bars={demoBars} 
                visualSpec={{
                  ...demoVisualSpec,
                  overlays: [
                    { type: 'hline' as const, id: 'entry', price: 175, label: 'Entry', style: 'primary' as const },
                  ],
                }}
                quality={{ score: 8.5, grade: 'A' as const, reasons: [], confidence: 0.85, warnings: [], tradeable: true }}
                height={64} 
              />
            </Suspense>
          </div>
          <GradeBadge grade="A" size="sm" showTooltip={false} />
        </div>
      ),
    },
    {
      term: 'Candlestick',
      definition: 'A price bar showing Open, High, Low, and Close (OHLC) for a time period. Green = price up from previous close; Red = price down.',
      category: 'charts',
      visual: (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-8 rounded" style={{ backgroundColor: '#22c55e' }} />
            <span className="text-xs text-muted-foreground">Bullish</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-8 rounded" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-xs text-muted-foreground">Bearish</span>
          </div>
        </div>
      ),
    },
    
    // Patterns Category
    {
      term: 'Bull Flag / Bear Flag',
      definition: 'Continuation patterns requiring: (1) a strong prior "pole" move of ≥5% (up for Bull, down for Bear), (2) a tight consolidation flag with <5% price range, and (3) flag retracement <50% of the pole height. These filters ensure the flag represents orderly profit-taking, not a trend reversal.',
      category: 'patterns',
    },
    {
      term: 'Cup & Handle',
      definition: 'A bullish continuation pattern validated with Bulkowski-grade criteria: (1) prior uptrend ≥5%, (2) cup depth between 12-33% of the prior move (shallower = noise, deeper = structural damage), (3) handle retracement <50% of the cup depth, and (4) approximate rim symmetry. The handle confirms buyer support before breakout.',
      category: 'patterns',
    },
    {
      term: 'Head and Shoulders / Inverse H&S',
      definition: 'A reversal pattern with three peaks (H&S) or troughs (iH&S). Detection requires: (1) head within 5% of window extreme, (2) prior trend ≥3% (uptrend for H&S, downtrend for iH&S), (3) minimum 5-bar separation between shoulders and head, (4) shoulder symmetry within 25%, and (5) neckline break confirmation with 0.2% margin.',
      category: 'patterns',
    },
    {
      term: 'Rising Wedge / Falling Wedge',
      definition: 'Reversal patterns with converging trendlines. Rising Wedge (bearish) requires a prior uptrend ≥2%; Falling Wedge (bullish) requires a prior downtrend ≥2%. Both require 15%+ range convergence and a trendline break confirmation. Without these prior trend filters, any converging channel would be flagged.',
      category: 'patterns',
    },
    {
      term: 'Double Top/Bottom',
      definition: 'A reversal pattern where price tests a level twice and fails, creating an "M" shape (top) or "W" shape (bottom). Detection requires: (1) both peaks/troughs within 5% of the window extreme, (2) 2-3% price similarity between the two tests (Bulkowski standard), (3) a prior uptrend (for tops) or downtrend (for bottoms) of at least 2%, (4) minimum 5-bar separation between tests, and (5) neckline break confirmation with 0.2% margin.',
      category: 'patterns',
    },
    {
      term: 'Ascending / Descending Triangle',
      definition: 'Continuation patterns requiring prior trend context: Ascending Triangle needs ≥2% prior uptrend, ≥3 resistance touches, and rising lows. Descending Triangle needs ≥2% prior downtrend, ≥3 support touches, and falling highs. These filters prevent false signals in directionless markets.',
      category: 'patterns',
    },
    {
      term: 'Donchian Breakout',
      definition: 'A momentum breakout signal filtered with two institutional-grade rules: (1) close-based confirmation (price must close beyond the channel, not just wick through), and (2) ADX >20 trending environment filter. Without these filters, any price expansion in choppy markets would generate false breakouts.',
      category: 'patterns',
    },
    
    // Trading Category
    {
      term: 'Entry Price',
      definition: 'The recommended price level to enter a trade. Displayed as an amber horizontal line on Signal Charts.',
      category: 'trading',
      visual: (
        <div className="flex items-center gap-2">
          <div className="w-16 h-0.5 bg-warning" />
          <span className="text-xs">Entry</span>
        </div>
      ),
    },
    {
      term: 'Stop Loss (SL)',
      definition: 'The price level where a losing trade is automatically exited to limit losses. Calculated at 2× ATR from entry.',
      category: 'trading',
      visual: (
        <div className="flex items-center gap-2">
          <div className="w-16 border-t-2 border-dashed border-destructive" />
          <span className="text-xs">Stop Loss</span>
        </div>
      ),
    },
    {
      term: 'Take Profit (TP)',
      definition: 'The price level where a winning trade is automatically closed to lock in profits. Calculated at 4× ATR from entry.',
      category: 'trading',
      visual: (
        <div className="flex items-center gap-2">
          <div className="w-16 border-t-2 border-dashed" style={{ borderColor: '#22c55e' }} />
          <span className="text-xs">Take Profit</span>
        </div>
      ),
    },
    {
      term: 'Risk/Reward Ratio (R:R)',
      definition: 'The ratio of potential profit to potential loss. ChartingPath uses a standard 2:1 R:R (4× ATR profit vs 2× ATR loss).',
      category: 'trading',
    },
    {
      term: 'ATR (Average True Range)',
      definition: 'A volatility indicator measuring average price movement. Used to calculate dynamic stop loss and take profit levels.',
      category: 'trading',
    },
    {
      term: 'Time Stop',
      definition: 'A trade exit triggered when neither TP nor SL is hit within 100 bars. Results in a "timeout" outcome.',
      category: 'trading',
    },
    
    // Platform Category
    {
      term: 'Command Center',
      definition: 'The central AI-powered hub for navigation, research, and trade management. Access with ⌘K (Mac) or Ctrl+K (Windows).',
      category: 'platform',
      visual: (
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">⌘K</kbd>
          <span className="text-xs text-muted-foreground">or</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+K</kbd>
        </div>
      ),
    },
    {
      term: 'Market Breadth',
      definition: 'A market internals monitor showing the health of the overall market through advance/decline ratios, new highs/lows, and sector performance.',
      category: 'platform',
    },
    {
      term: 'Pattern Screener',
      definition: 'A real-time scanner that detects chart patterns across stocks, forex, crypto, and commodities using proprietary algorithms.',
      category: 'platform',
    },
    {
      term: 'Watchlist',
      definition: 'A personalized list of instruments to monitor. Patterns detected on watchlist items trigger priority alerts.',
      category: 'platform',
    },
    {
      term: 'Trade Playback',
      definition: 'An interactive bar-by-bar replay of historical pattern occurrences showing how trades evolved over time.',
      category: 'platform',
    },
    
    // Metrics Category
    {
      term: 'Quality Score',
      definition: 'A 0-10 numeric rating of pattern quality based on trend alignment, volume confirmation, structure clarity, and historical performance.',
      category: 'metrics',
      visual: (
        <div className="flex items-center gap-2">
          <Badge className="bg-positive/20 text-positive">8.5</Badge>
          <span className="text-xs text-muted-foreground">High quality</span>
        </div>
      ),
    },
    {
      term: 'Quality Grade',
      definition: 'A letter grade (A-F) derived from the quality score. A = Excellent (8+), B = Good (6-8), C = Fair (5-6), D = Weak (3.5-5), F = Poor (<3.5).',
      category: 'metrics',
      visual: (
        <div className="flex items-center gap-2">
          {(['A', 'B', 'C', 'D', 'F'] as const).map((grade) => (
            <GradeBadge key={grade} grade={grade} size="sm" showTooltip={false} />
          ))}
        </div>
      ),
    },
    {
      term: 'Win Rate',
      definition: 'The percentage of historical pattern occurrences that hit Take Profit before Stop Loss or timeout.',
      category: 'metrics',
    },
    {
      term: 'R-Multiple',
      definition: 'Profit/loss expressed as a multiple of initial risk (R). A 2R win means you made 2× what you risked.',
      category: 'metrics',
    },
    {
      term: 'Hit Rate',
      definition: 'Historical success rate of a specific pattern type, calculated from verified outcomes in the database.',
      category: 'metrics',
    },
    {
      term: 'Trend Alignment',
      definition: 'Whether a pattern trades in the same direction as the higher-timeframe trend. "With Trend" patterns have higher success rates.',
      category: 'metrics',
      visual: (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-positive border-positive text-xs">With Trend ↑</Badge>
          <Badge variant="outline" className="text-muted-foreground border-muted text-xs">Counter ↓</Badge>
        </div>
      ),
    },
  ], [demoBars, demoVisualSpec]);

  const categories = [
    { id: 'all', label: 'All', icon: BookOpen },
    { id: 'charts', label: 'Charts', icon: BarChart3 },
    { id: 'patterns', label: 'Patterns', icon: Activity },
    { id: 'trading', label: 'Trading', icon: Target },
    { id: 'platform', label: 'Platform', icon: Layout },
    { id: 'metrics', label: 'Metrics', icon: Calculator },
  ];

  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTerms = glossaryTerms.filter(term => {
    const matchesSearch = searchQuery === '' || 
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || term.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'charts': return <BarChart3 className="h-3 w-3" />;
      case 'patterns': return <Activity className="h-3 w-3" />;
      case 'trading': return <Target className="h-3 w-3" />;
      case 'platform': return <Layout className="h-3 w-3" />;
      case 'metrics': return <Calculator className="h-3 w-3" />;
      default: return <BookOpen className="h-3 w-3" />;
    }
  };

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
          <h1 className="text-2xl md:text-3xl font-bold">ChartingPath Glossary</h1>
          <p className="text-muted-foreground mt-1">
            Complete reference for platform terminology with visual examples
          </p>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Badge
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-muted transition-colors"
                onClick={() => setActiveCategory(cat.id)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {cat.label}
              </Badge>
            );
          })}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredTerms.length} term{filteredTerms.length !== 1 ? 's' : ''} found
        </p>

        {/* Glossary Terms */}
        <div className="space-y-4">
          {filteredTerms.map((item, index) => (
            <Card key={index} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg">{item.term}</CardTitle>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {getCategoryIcon(item.category)}
                    <span className="ml-1 capitalize">{item.category}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-3">{item.definition}</p>
                {item.visual && (
                  <div className="pt-3 border-t">
                    {item.visual}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTerms.length === 0 && (
          <Card className="bg-muted/30">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No terms match your search.</p>
            </CardContent>
          </Card>
        )}

        {/* Related Guides */}
        <section className="mt-12 pt-8 border-t">
          <h2 className="text-xl font-semibold mb-4">Related Guides</h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/blog/chart-types-explained">
              <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                Chart Types Explained
              </Badge>
            </Link>
            <Link to="/blog/command-center-guide">
              <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                Command Center Guide
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

export default PlatformGlossary;
