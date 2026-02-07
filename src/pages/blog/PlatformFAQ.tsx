import { Suspense, lazy, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Search, ChevronDown, BarChart3, TrendingUp, Shield, Zap, Bell, Calculator, Globe, Clock, Target, Award, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { generateDemoBars } from '@/utils/chartIndicators';
import { cn } from '@/lib/utils';

// Lazy load chart components
const ThumbnailChart = lazy(() => import('@/components/charts/ThumbnailChart'));

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
  category: 'patterns' | 'charts' | 'trading' | 'platform' | 'data';
}

/**
 * Platform FAQ - Frequently Asked Questions with visual answers
 */
const PlatformFAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0]));
  const [activeCategory, setActiveCategory] = useState('all');

  // Demo data for visual answers
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

  const toggleItem = (index: number) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const faqItems: FAQItem[] = useMemo(() => [
    // Patterns Category
    {
      question: 'What patterns does ChartingPath detect?',
      answer: (
        <div>
          <p className="mb-4">ChartingPath detects 15+ professional chart patterns including:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {['Bull Flag', 'Bear Flag', 'Head & Shoulders', 'Inverse H&S', 'Double Top', 'Double Bottom', 'Triple Top', 'Triple Bottom', 'Cup & Handle', 'Ascending Triangle', 'Descending Triangle', 'Symmetrical Triangle', 'Rising Wedge', 'Falling Wedge', 'Rectangle'].map(p => (
              <Badge key={p} variant="outline" className="justify-center text-xs">{p}</Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Each pattern includes entry price, stop loss, take profit, and quality grade.</p>
        </div>
      ),
      category: 'patterns',
    },
    {
      question: 'What do the quality grades (A-F) mean?',
      answer: (
        <div>
          <p className="mb-4">Quality grades reflect the overall strength of a pattern setup:</p>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-3">
              <GradeBadge grade="A" size="sm" showTooltip={false} />
              <span className="text-sm"><strong>Excellent (8-10)</strong> — Highest quality, textbook formation, strong trend alignment</span>
            </div>
            <div className="flex items-center gap-3">
              <GradeBadge grade="B" size="sm" showTooltip={false} />
              <span className="text-sm"><strong>Good (6-8)</strong> — Solid setup with minor imperfections</span>
            </div>
            <div className="flex items-center gap-3">
              <GradeBadge grade="C" size="sm" showTooltip={false} />
              <span className="text-sm"><strong>Fair (5-6)</strong> — Tradeable but requires more confirmation</span>
            </div>
            <div className="flex items-center gap-3">
              <GradeBadge grade="D" size="sm" showTooltip={false} />
              <span className="text-sm"><strong>Weak (3.5-5)</strong> — Low confidence, consider skipping</span>
            </div>
            <div className="flex items-center gap-3">
              <GradeBadge grade="F" size="sm" showTooltip={false} />
              <span className="text-sm"><strong>Poor (&lt;3.5)</strong> — Not recommended for trading</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Grades are calculated from: trend alignment, volume confirmation, structure clarity, and historical win rate.</p>
        </div>
      ),
      category: 'patterns',
    },
    {
      question: 'How is the pattern quality score calculated?',
      answer: (
        <div>
          <p className="mb-3">The quality score (0-10) is a weighted average of multiple factors:</p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-positive shrink-0 mt-0.5" />
              <span className="text-sm"><strong>Trend Alignment (30%)</strong> — Does the pattern trade with the higher-timeframe trend?</span>
            </li>
            <li className="flex items-start gap-2">
              <BarChart3 className="h-4 w-4 text-info shrink-0 mt-0.5" />
              <span className="text-sm"><strong>Volume Confirmation (25%)</strong> — Volume expanding on breakouts, contracting on consolidation</span>
            </li>
            <li className="flex items-start gap-2">
              <Target className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <span className="text-sm"><strong>Structure Clarity (25%)</strong> — How well-defined are the pattern's boundaries?</span>
            </li>
            <li className="flex items-start gap-2">
              <Award className="h-4 w-4 text-secondary-foreground shrink-0 mt-0.5" />
              <span className="text-sm"><strong>Historical Performance (20%)</strong> — Win rate of similar patterns in the database</span>
            </li>
          </ul>
        </div>
      ),
      category: 'patterns',
    },

    // Charts Category
    {
      question: "What's the difference between chart types?",
      answer: (
        <div>
          <p className="mb-4">ChartingPath has 4 chart types for different use cases:</p>
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium">Study Chart</p>
                <p className="text-sm text-muted-foreground">Primary research chart with indicators (EMA, SMA, Bollinger, VWAP)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Target className="h-5 w-5 text-info shrink-0" />
              <div>
                <p className="font-medium">Full Chart</p>
                <p className="text-sm text-muted-foreground">Expanded view with trade overlays (Entry/SL/TP lines) and playback</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Zap className="h-5 w-5 text-warning shrink-0" />
              <div>
                <p className="font-medium">Thumbnail Chart</p>
                <p className="text-sm text-muted-foreground">Compact preview for pattern galleries (read-only)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Bell className="h-5 w-5 text-positive shrink-0" />
              <div>
                <p className="font-medium">Signal Chart</p>
                <p className="text-sm text-muted-foreground">Pattern detection view with quality badge and trade plan</p>
              </div>
            </div>
          </div>
          <Link to="/blog/chart-types-explained" className="text-sm text-primary hover:underline">
            See interactive examples →
          </Link>
        </div>
      ),
      category: 'charts',
    },
    {
      question: 'Why are green/red candles colored that way?',
      answer: (
        <div>
          <p className="mb-4">ChartingPath uses <strong>close-to-close</strong> coloring for consistent trend visualization:</p>
          <div className="flex items-center gap-6 mb-4 p-4 bg-background rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-10 rounded" style={{ backgroundColor: '#22c55e' }} />
              <div>
                <p className="font-medium" style={{ color: '#22c55e' }}>Green</p>
                <p className="text-xs text-muted-foreground">Close &gt; Previous Close</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-10 rounded" style={{ backgroundColor: '#ef4444' }} />
              <div>
                <p className="font-medium" style={{ color: '#ef4444' }}>Red</p>
                <p className="text-xs text-muted-foreground">Close &lt; Previous Close</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            This differs from traditional open-to-close coloring. It ensures candle colors accurately reflect the asset's direction relative to the prior day.
          </p>
        </div>
      ),
      category: 'charts',
    },
    {
      question: 'How do I pan and zoom the charts?',
      answer: (
        <div>
          <p className="mb-4">Interactive charts (Study & Full) support professional controls:</p>
          <table className="w-full text-sm mb-4">
            <tbody>
              <tr className="border-b">
                <td className="py-2 font-medium">Zoom time axis</td>
                <td className="py-2 text-muted-foreground">Scroll wheel / Pinch</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">Pan horizontally</td>
                <td className="py-2 text-muted-foreground">Click + Drag / Swipe</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">Pan vertically</td>
                <td className="py-2 text-muted-foreground">Shift + Drag / Two-finger drag</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">Adjust price scale</td>
                <td className="py-2 text-muted-foreground">Drag right axis</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Reset view</td>
                <td className="py-2 text-muted-foreground">Click ↺ button</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
      category: 'charts',
    },

    // Trading Category
    {
      question: 'How are Stop Loss and Take Profit calculated?',
      answer: (
        <div>
          <p className="mb-4">Trade levels are calculated using ATR (Average True Range) for dynamic volatility adjustment:</p>
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
              <div className="w-16 border-t-2 border-dashed border-destructive" />
              <div>
                <p className="font-medium">Stop Loss = Entry ± 2× ATR</p>
                <p className="text-xs text-muted-foreground">Protects against normal volatility while allowing room to breathe</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
              <div className="w-16 border-t-2 border-dashed border-positive" />
              <div>
                <p className="font-medium">Take Profit = Entry ± 4× ATR</p>
                <p className="text-xs text-muted-foreground">Targets 2:1 reward-to-risk ratio</p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-warning/10 border-l-2 border-warning rounded-r-lg">
            <p className="text-sm"><strong>Time Stop:</strong> If neither TP nor SL is hit within 100 bars, the trade is exited at market price ("timeout").</p>
          </div>
        </div>
      ),
      category: 'trading',
    },
    {
      question: 'What does "Trend Alignment" mean?',
      answer: (
        <div>
          <p className="mb-4">Trend alignment shows whether a pattern trades with or against the higher-timeframe trend:</p>
          <div className="flex items-center gap-4 mb-4">
            <Badge className="bg-positive/20 text-positive">
              <TrendingUp className="h-3 w-3 mr-1" />
              With Trend
            </Badge>
            <span className="text-sm text-muted-foreground">Pattern direction matches the EMA 20/50 trend</span>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <Badge className="bg-warning/20 text-warning">
              <TrendingUp className="h-3 w-3 mr-1 rotate-45" />
              Counter Trend
            </Badge>
            <span className="text-sm text-muted-foreground">Pattern trades against the prevailing trend</span>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Pro tip:</strong> "With Trend" setups historically have 15-20% higher win rates than counter-trend setups.
          </p>
        </div>
      ),
      category: 'trading',
    },
    {
      question: 'What is a "timeout" outcome?',
      answer: 'A timeout occurs when a trade neither hits Take Profit nor Stop Loss within 100 bars. The trade is exited at the closing price of the 100th bar. Timeouts are counted separately from wins and losses in performance statistics.',
      category: 'trading',
    },

    // Platform Category
    {
      question: 'How do I access the Command Center?',
      answer: (
        <div>
          <p className="mb-4">The Command Center is your AI-powered trading hub:</p>
          <div className="flex items-center gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
            <kbd className="px-3 py-1.5 bg-muted rounded-lg text-sm font-mono font-semibold">⌘K</kbd>
            <span className="text-muted-foreground">or</span>
            <kbd className="px-3 py-1.5 bg-muted rounded-lg text-sm font-mono font-semibold">Ctrl+K</kbd>
            <span className="text-sm">on any page</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">Features include:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Universal instrument search</li>
            <li>• AI-powered trading assistant</li>
            <li>• Smart watchlist with pattern alerts</li>
            <li>• Live pattern detection panel</li>
          </ul>
          <Link to="/blog/command-center-guide" className="text-sm text-primary hover:underline block mt-3">
            Read the full guide →
          </Link>
        </div>
      ),
      category: 'platform',
    },
    {
      question: 'What markets does ChartingPath cover?',
      answer: (
        <div>
          <p className="mb-4">ChartingPath provides pattern detection across 4 major markets:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <Globe className="h-4 w-4 text-primary mb-1" />
              <p className="font-medium text-sm">Stocks</p>
              <p className="text-xs text-muted-foreground">US equities, major indices</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <Globe className="h-4 w-4 text-info mb-1" />
              <p className="font-medium text-sm">Forex</p>
              <p className="text-xs text-muted-foreground">Major & cross pairs</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <Globe className="h-4 w-4 text-warning mb-1" />
              <p className="font-medium text-sm">Crypto</p>
              <p className="text-xs text-muted-foreground">BTC, ETH, major alts</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <Globe className="h-4 w-4 text-positive mb-1" />
              <p className="font-medium text-sm">Commodities</p>
              <p className="text-xs text-muted-foreground">Gold, oil, agriculture</p>
            </div>
          </div>
        </div>
      ),
      category: 'platform',
    },
    {
      question: 'What timeframes are supported?',
      answer: (
        <div>
          <p className="mb-4">Pattern detection runs on multiple timeframes:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {['1H', '4H', '1D', '1W'].map(tf => (
              <Badge key={tf} variant="outline" className="text-sm">{tf}</Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Daily (1D)</strong> is the default and most reliable for swing trading. 
            <strong> Weekly (1W)</strong> is best for position trading and macro analysis.
          </p>
        </div>
      ),
      category: 'platform',
    },

    // Data Category
    {
      question: 'How often is pattern data updated?',
      answer: (
        <div>
          <p className="mb-3">Pattern detection runs on different schedules based on timeframe:</p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm"><strong>Daily patterns:</strong> Updated at market close (4 PM ET for US stocks)</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm"><strong>4H patterns:</strong> Updated every 4 hours during market hours</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm"><strong>Weekly patterns:</strong> Updated at weekend close</span>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">Crypto markets update 24/7 since they trade continuously.</p>
        </div>
      ),
      category: 'data',
    },
    {
      question: 'Where does the price data come from?',
      answer: 'ChartingPath aggregates price data from multiple institutional-grade sources. Daily price data is sourced from EODHD for the core universe (~5,500 symbols). For symbols outside the core universe or for real-time fallback, data is fetched from Yahoo Finance.',
      category: 'data',
    },
    {
      question: 'How is historical pattern performance tracked?',
      answer: 'Every detected pattern is automatically tracked for 100 bars after entry. The system records whether the trade hit Take Profit (win), Stop Loss (loss), or timed out. This data is used to calculate win rates and improve the quality scoring algorithm.',
      category: 'data',
    },
  ], [demoBars, demoVisualSpec]);

  const categories = [
    { id: 'all', label: 'All Questions', icon: HelpCircle },
    { id: 'patterns', label: 'Patterns', icon: BarChart3 },
    { id: 'charts', label: 'Charts', icon: Target },
    { id: 'trading', label: 'Trading', icon: TrendingUp },
    { id: 'platform', label: 'Platform', icon: Zap },
    { id: 'data', label: 'Data', icon: Globe },
  ];

  const filteredFAQ = faqItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof item.answer === 'string' && item.answer.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-2xl md:text-3xl font-bold">Frequently Asked Questions</h1>
          <p className="text-muted-foreground mt-1">
            Common questions answered with visual examples
          </p>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
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

        {/* FAQ Items */}
        <div className="space-y-3">
          {filteredFAQ.map((item, index) => (
            <Collapsible
              key={index}
              open={openItems.has(index)}
              onOpenChange={() => toggleItem(index)}
            >
              <Card className={cn(
                "transition-all",
                openItems.has(index) && "border-primary/30"
              )}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <CardTitle className="text-base text-left flex-1">{item.question}</CardTitle>
                      <ChevronDown className={cn(
                        "h-5 w-5 text-muted-foreground shrink-0 transition-transform",
                        openItems.has(index) && "rotate-180"
                      )} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="pl-8 text-muted-foreground">
                      {typeof item.answer === 'string' ? (
                        <p>{item.answer}</p>
                      ) : (
                        item.answer
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>

        {filteredFAQ.length === 0 && (
          <Card className="bg-muted/30">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No questions match your search.</p>
            </CardContent>
          </Card>
        )}

        {/* Still have questions? */}
        <Card className="mt-12 bg-gradient-to-br from-primary/5 to-background border-primary/20">
          <CardContent className="p-6 text-center">
            <HelpCircle className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Still have questions?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ask the AI Copilot in the Command Center for instant answers.
            </p>
            <div className="flex justify-center gap-2">
              <kbd className="px-3 py-1.5 bg-muted rounded-lg text-sm font-mono">⌘K</kbd>
              <span className="text-muted-foreground">to open</span>
            </div>
          </CardContent>
        </Card>

        {/* Related Guides */}
        <section className="mt-12 pt-8 border-t">
          <h2 className="text-xl font-semibold mb-4">Related Guides</h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/blog/chart-types-explained">
              <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                Chart Types Explained
              </Badge>
            </Link>
            <Link to="/blog/platform-glossary">
              <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                Platform Glossary
              </Badge>
            </Link>
            <Link to="/blog/command-center-guide">
              <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                Command Center Guide
              </Badge>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PlatformFAQ;
