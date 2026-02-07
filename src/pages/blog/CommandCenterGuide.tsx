import { Suspense, lazy, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Command, Search, Star, Bell, TrendingUp, TrendingDown, Keyboard, Smartphone, Monitor, Zap, MessageSquare, BarChart3, Target, History, Settings, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateDemoBars } from '@/utils/chartIndicators';
import { GradeBadge } from '@/components/ui/GradeBadge';

// Lazy load chart components
const ThumbnailChart = lazy(() => import('@/components/charts/ThumbnailChart'));

/**
 * Command Center Guide - Interactive walkthrough of the AI-powered trading hub
 */
const CommandCenterGuide = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Demo data
  const demoBars = useMemo(() => generateDemoBars(40), []);
  const demoVisualSpec = useMemo(() => ({
    version: '2.0.0',
    symbol: 'AAPL',
    timeframe: '1D',
    patternId: 'demo',
    signalTs: new Date().toISOString(),
    window: { startTs: new Date().toISOString(), endTs: new Date().toISOString() },
    yDomain: { min: 150, max: 200 },
    overlays: [
      { type: 'hline' as const, id: 'entry', price: 175, label: 'Entry', style: 'primary' as const },
      { type: 'hline' as const, id: 'sl', price: 168, label: 'SL', style: 'destructive' as const },
      { type: 'hline' as const, id: 'tp', price: 189, label: 'TP', style: 'positive' as const },
    ],
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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Command className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Command Center Guide</h1>
              <p className="text-muted-foreground">Your AI-powered trading hub</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Quick Access Demo */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
          <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <p className="text-muted-foreground mb-4">
                    Open the Command Center instantly from anywhere on the platform:
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Desktop:</span>
                      <kbd className="px-3 py-1.5 bg-muted rounded-lg text-sm font-mono font-semibold">⌘K</kbd>
                      <span className="text-xs text-muted-foreground">or</span>
                      <kbd className="px-3 py-1.5 bg-muted rounded-lg text-sm font-mono font-semibold">Ctrl+K</kbd>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Mobile:</span>
                    <span className="text-sm text-muted-foreground">Tap the search icon in the header</span>
                  </div>
                </div>
                <div className="p-4 bg-background rounded-lg border shadow-sm">
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-md border">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">Search or ask anything...</span>
                    <kbd className="ml-auto px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘K</kbd>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Feature Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="research">Research</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            <TabsTrigger value="ai">AI Copilot</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    Universal Search
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Search any stock, forex pair, crypto, or commodity. Just start typing and results appear instantly.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-warning" />
                    Smart Watchlist
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Your personalized instrument list with real-time pattern detection and price alerts.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-info" />
                    Live Chart
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Full-featured Study Chart with multi-timeframe analysis, indicators, and pattern overlays.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-positive" />
                    AI Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Ask questions about patterns, strategies, or market analysis in natural language.
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="research" className="mt-6">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Pattern Detection Panel</CardTitle>
                <CardDescription>View detected patterns with trade plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Mock pattern detection */}
                  <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    <div className="w-24 h-16 bg-background rounded overflow-hidden shrink-0">
                      <Suspense fallback={<Skeleton className="w-full h-full" />}>
                        <ThumbnailChart 
                          bars={demoBars} 
                          visualSpec={demoVisualSpec}
                          height={64}
                        />
                      </Suspense>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">AAPL</span>
                        <Badge variant="outline" className="text-xs">Bull Flag</Badge>
                        <GradeBadge grade="A" size="sm" showTooltip={false} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Entry: $175.00</span>
                        <span className="text-destructive">SL: $168.00</span>
                        <span className="text-positive">TP: $189.00</span>
                      </div>
                    </div>
                    <Badge className="bg-positive/20 text-positive shrink-0">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Long
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    <div className="w-24 h-16 bg-background rounded overflow-hidden shrink-0">
                      <Suspense fallback={<Skeleton className="w-full h-full" />}>
                        <ThumbnailChart 
                          bars={demoBars} 
                          visualSpec={demoVisualSpec}
                          height={64}
                        />
                      </Suspense>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">EUR/USD</span>
                        <Badge variant="outline" className="text-xs">Double Bottom</Badge>
                        <GradeBadge grade="B" size="sm" showTooltip={false} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Entry: 1.0850</span>
                        <span className="text-destructive">SL: 1.0780</span>
                        <span className="text-positive">TP: 1.0990</span>
                      </div>
                    </div>
                    <Badge className="bg-positive/20 text-positive shrink-0">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Long
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
              Click any pattern to load it in the chart view with full trade plan overlays and historical performance data.
            </p>
          </TabsContent>

          <TabsContent value="watchlist" className="mt-6">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-warning" />
                  Your Watchlist
                </CardTitle>
                <CardDescription>Monitor your favorite instruments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { symbol: 'AAPL', name: 'Apple Inc.', price: 178.50, change: 2.35, alert: true },
                    { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.20, change: -1.82, alert: false },
                    { symbol: 'BTC/USD', name: 'Bitcoin', price: 43250, change: 3.41, alert: true },
                    { symbol: 'EUR/USD', name: 'Euro/Dollar', price: 1.0852, change: 0.15, alert: false },
                  ].map((item) => (
                    <div key={item.symbol} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.symbol}</span>
                          {item.alert && (
                            <Badge variant="outline" className="text-xs text-warning border-warning">
                              <Bell className="h-3 w-3 mr-1" />
                              Pattern
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">{typeof item.price === 'number' && item.price < 10 ? item.price.toFixed(4) : item.price.toLocaleString()}</p>
                        <p className={`text-xs ${item.change >= 0 ? 'text-positive' : 'text-destructive'}`}>
                          {item.change >= 0 ? '+' : ''}{item.change}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-warning" />
              <span>Watchlist items with detected patterns are highlighted automatically</span>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  AI Trading Copilot
                </CardTitle>
                <CardDescription>Ask anything about trading, patterns, or markets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Example conversation */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">You</p>
                    <p className="text-sm text-muted-foreground">What bull flag patterns are currently forming?</p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-3 border-l-2 border-primary">
                    <p className="text-sm font-medium mb-1">AI Copilot</p>
                    <p className="text-sm text-muted-foreground">
                      I found 3 bull flag patterns forming right now:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• <strong className="text-foreground">AAPL</strong> - Grade A, 2.1:1 R:R on daily</li>
                      <li>• <strong className="text-foreground">MSFT</strong> - Grade B, 1.8:1 R:R on 4H</li>
                      <li>• <strong className="text-foreground">NVDA</strong> - Grade A, 2.3:1 R:R on daily</li>
                    </ul>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">You</p>
                    <p className="text-sm text-muted-foreground">Show me the AAPL setup</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Example questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'What patterns work best in downtrends?',
                      'Explain the head and shoulders pattern',
                      'Find crypto with breakout setups',
                    ].map((q, i) => (
                      <Badge key={i} variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                        {q}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Keyboard Shortcuts */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">Action</th>
                    <th className="text-left p-3 font-medium">Shortcut</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { action: 'Open Command Center', shortcut: '⌘K / Ctrl+K' },
                    { action: 'Close Command Center', shortcut: 'Esc' },
                    { action: 'Navigate results', shortcut: '↑ / ↓' },
                    { action: 'Select result', shortcut: 'Enter' },
                    { action: 'Switch to AI chat', shortcut: 'Tab (when searching)' },
                    { action: 'Clear search', shortcut: '⌘⌫ / Ctrl+Backspace' },
                  ].map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3">{item.action}</td>
                      <td className="p-3">
                        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{item.shortcut}</kbd>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        {/* Pro Tips */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Pro Tips</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-positive/5 border-positive/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-positive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Type "/" for quick actions</p>
                    <p className="text-sm text-muted-foreground">Access commands like /watchlist, /alerts, /settings directly from search.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-info/5 border-info/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <History className="h-5 w-5 text-info shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Recent searches saved</p>
                    <p className="text-sm text-muted-foreground">Your search history persists, making repeat lookups instant.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-warning/5 border-warning/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Star from search</p>
                    <p className="text-sm text-muted-foreground">Add instruments to your watchlist directly from search results without opening them.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/5 border-secondary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-secondary-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Pattern quick-view</p>
                    <p className="text-sm text-muted-foreground">Click any detected pattern to instantly load it in the chart panel with trade levels.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Example Commands */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            10 Powerful Commands to Try
          </h2>
          <p className="text-muted-foreground mb-4">
            Type these directly into the Command Center to unlock powerful research and analysis:
          </p>
          <div className="space-y-3">
            {[
              {
                command: 'Find bull flag patterns with grade A quality',
                description: 'Search for high-quality bull flag continuation patterns across all instruments',
                category: 'Pattern Search',
              },
              {
                command: 'Add TSLA to my watchlist',
                description: 'Instantly add Tesla to your watchlist for pattern monitoring',
                category: 'Execution',
              },
              {
                command: 'What is the win rate for head and shoulders?',
                description: 'Get historical performance statistics including win rate and average R-multiple',
                category: 'Statistics',
              },
              {
                command: 'How is the market breadth looking?',
                description: 'Get current advance/decline ratios and overall market sentiment',
                category: 'Research',
              },
              {
                command: 'Find articles about trend following strategies',
                description: 'Search 120+ strategy guides in the Learning Center',
                category: 'Content',
              },
              {
                command: 'Explain the double bottom pattern',
                description: 'Learn the psychology, entry rules, stop placement, and targets for this reversal pattern',
                category: 'Education',
              },
              {
                command: 'Show me bearish patterns on AAPL',
                description: 'Find all active bearish setups forming on Apple stock',
                category: 'Pattern Search',
              },
              {
                command: 'Generate Pine Script for ascending triangle on NVDA',
                description: 'Create a ready-to-use TradingView strategy with alerts and ATR-based exits',
                category: 'Automation',
              },
              {
                command: 'Find risk management guides',
                description: 'Discover articles about position sizing, stop-losses, and portfolio protection',
                category: 'Content',
              },
              {
                command: 'What are the stats for bull flag on BTCUSD?',
                description: 'Get instrument-specific historical performance for Bitcoin bull flags',
                category: 'Statistics',
              },
            ].map((item, i) => (
              <Card key={i} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <span className="text-lg font-bold text-muted-foreground/50 shrink-0 w-6">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <code className="text-sm font-medium bg-muted px-2 py-0.5 rounded">
                          {item.command}
                        </code>
                        <Badge variant="outline" className="text-xs shrink-0">{item.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Related Guides */}
        <section className="pt-8 border-t">
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

export default CommandCenterGuide;
