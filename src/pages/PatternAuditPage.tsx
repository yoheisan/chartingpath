import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, RefreshCw, Download, Eye, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import ThumbnailChart from '@/components/charts/ThumbnailChart';
import { ALL_PATTERN_IDS, PATTERN_DISPLAY_NAMES } from '@/hooks/useScreenerCaps';
import { CompressedBar, VisualSpec } from '@/types/VisualSpec';

interface PatternExample {
  id: string;
  symbol: string;
  pattern_id: string;
  pattern_name: string;
  direction: string;
  timeframe: string;
  quality_score: string;
  bars: CompressedBar[];
  visual_spec: VisualSpec;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  outcome?: string;
}

interface PatternAuditData {
  patternId: string;
  displayName: string;
  totalSamples: number;
  examples: PatternExample[];
  hasData: boolean;
}

const TIMEFRAMES = ['1d', '4h', '1h'];

const PatternAuditPage = () => {
  const [auditData, setAuditData] = useState<PatternAuditData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [zoomedExample, setZoomedExample] = useState<PatternExample | null>(null);

  useEffect(() => {
    fetchAuditData();
  }, [selectedTimeframe]);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      // Fetch sample counts for each pattern
      const { data: counts, error: countError } = await supabase
        .from('historical_pattern_occurrences')
        .select('pattern_id, id')
        .eq('timeframe', selectedTimeframe);

      if (countError) throw countError;

      // Count by pattern_id
      const patternCounts: Record<string, number> = {};
      counts?.forEach(row => {
        patternCounts[row.pattern_id] = (patternCounts[row.pattern_id] || 0) + 1;
      });

      // Fetch 3 examples per pattern with highest quality
      const auditResults: PatternAuditData[] = [];

      for (const patternId of ALL_PATTERN_IDS) {
        const { data: examples, error: exampleError } = await supabase
          .from('historical_pattern_occurrences')
          .select('id, symbol, pattern_id, pattern_name, direction, timeframe, quality_score, bars, visual_spec, entry_price, stop_loss_price, take_profit_price, outcome')
          .eq('pattern_id', patternId)
          .eq('timeframe', selectedTimeframe)
          .in('quality_score', ['A', 'B', 'C'])
          .order('quality_score', { ascending: true })
          .limit(6);

        if (exampleError) {
          console.error(`Error fetching ${patternId}:`, exampleError);
          continue;
        }

        // Prepare enhanced visual_spec with entry/sl/tp for display
        const mappedExamples = (examples || []).map(e => {
          const spec = e.visual_spec as unknown as VisualSpec;
          return {
            ...e,
            bars: coerceBars(e.bars),
            visual_spec: {
              ...spec,
              entryPrice: e.entry_price,
              stopLoss: e.stop_loss_price,
              takeProfit: e.take_profit_price,
            } as VisualSpec
          };
        });

        auditResults.push({
          patternId,
          displayName: PATTERN_DISPLAY_NAMES[patternId] || patternId,
          totalSamples: patternCounts[patternId] || 0,
          examples: mappedExamples as PatternExample[],
          hasData: (examples?.length || 0) > 0
        });
      }

      setAuditData(auditResults);
    } catch (err) {
      console.error('Audit fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to coerce bars to CompressedBar format
  const coerceBars = (bars: any): CompressedBar[] => {
    if (!Array.isArray(bars)) return [];
    return bars.map((bar: any) => ({
      t: bar.t || bar.date || bar.timestamp,
      o: bar.o ?? bar.open ?? bar.close,
      h: bar.h ?? bar.high ?? bar.close,
      l: bar.l ?? bar.low ?? bar.close,
      c: bar.c ?? bar.close,
      v: bar.v ?? bar.volume ?? 0
    }));
  };

  const summary = useMemo(() => {
    const withData = auditData.filter(p => p.hasData);
    const withoutData = auditData.filter(p => !p.hasData);
    return {
      total: auditData.length,
      withExamples: withData.length,
      missingData: withoutData.map(p => p.displayName),
      totalSamples: auditData.reduce((sum, p) => sum + p.totalSamples, 0)
    };
  }, [auditData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading pattern examples for visual audit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link to="/projects/pattern-lab" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Pattern Lab
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Pattern Visual Audit</h1>
              <p className="text-muted-foreground mt-1">
                Review real detected patterns to verify they meet professional standards
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map(tf => (
                    <SelectItem key={tf} value={tf}>{tf.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchAuditData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{summary.total}</div>
                <div className="text-sm text-muted-foreground">Pattern Types</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">{summary.withExamples}</div>
                <div className="text-sm text-muted-foreground">With Examples</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500">{summary.total - summary.withExamples}</div>
                <div className="text-sm text-muted-foreground">Missing Data</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{summary.totalSamples.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Samples ({selectedTimeframe})</div>
              </div>
            </div>
            
            {summary.missingData.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Missing historical data for:</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {summary.missingData.map(name => (
                    <Badge key={name} variant="outline" className="text-yellow-600 border-yellow-500/50">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pattern Cards Grid */}
        <div className="space-y-6">
          {auditData.map((pattern) => (
            <Card 
              key={pattern.patternId} 
              className={`transition-all ${pattern.hasData ? 'border-green-500/30' : 'border-yellow-500/30 opacity-70'}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {pattern.hasData ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    <CardTitle className="text-lg">{pattern.displayName}</CardTitle>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {pattern.patternId}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {pattern.totalSamples.toLocaleString()} samples
                    </Badge>
                    {pattern.hasData && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setExpandedPattern(
                          expandedPattern === pattern.patternId ? null : pattern.patternId
                        )}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {expandedPattern === pattern.patternId ? 'Collapse' : 'Expand'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {pattern.hasData && (
                <CardContent>
                  {/* Compact view - show 3 examples */}
                  <div className={`grid ${expandedPattern === pattern.patternId ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-3 lg:grid-cols-6'} gap-4`}>
                    {pattern.examples.slice(0, expandedPattern === pattern.patternId ? 6 : 3).map((example, idx) => (
                      <div key={example.id} className="space-y-2">
                        <div 
                          className="aspect-[16/10] bg-[#0f0f0f] rounded-lg overflow-hidden border border-border/50 cursor-pointer hover:border-primary/50 hover:ring-1 hover:ring-primary/20 transition-all"
                          onDoubleClick={() => setZoomedExample(example)}
                          title="Double-click to enlarge"
                        >
                          <ThumbnailChart
                            bars={example.bars}
                            visualSpec={example.visual_spec}
                            height={expandedPattern === pattern.patternId ? 200 : 120}
                          />
                        </div>
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{example.symbol}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-sm ${
                                example.quality_score === 'A' ? 'border-emerald-500 text-emerald-500' :
                                example.quality_score === 'B' ? 'border-blue-500 text-blue-500' :
                                'border-yellow-500 text-yellow-500'
                              }`}
                            >
                              Grade {example.quality_score}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className={example.direction === 'bullish' ? 'text-green-500' : 'text-red-500'}>
                              {example.direction === 'bullish' ? '▲ Long' : '▼ Short'}
                            </span>
                            {example.outcome && (
                              <Badge 
                                variant="outline" 
                                className={`text-sm ${
                                  example.outcome === 'hit_tp' ? 'border-green-500 text-green-500' :
                                  example.outcome === 'hit_sl' ? 'border-red-500 text-red-500' :
                                  'border-muted-foreground'
                                }`}
                              >
                                {example.outcome === 'hit_tp' ? 'WIN' : 
                                 example.outcome === 'hit_sl' ? 'LOSS' : 'Timeout'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pattern Details when expanded */}
                  {expandedPattern === pattern.patternId && pattern.examples.length > 0 && (
                    <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-medium mb-3">Detection Details</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Direction</div>
                          <div className="font-medium">
                            {pattern.examples[0].direction === 'bullish' ? 'Long (Bullish)' : 'Short (Bearish)'}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Sample Entry</div>
                          <div className="font-medium text-amber-500">
                            {pattern.examples[0].entry_price?.toFixed(4)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Sample SL</div>
                          <div className="font-medium text-red-500">
                            {pattern.examples[0].stop_loss_price?.toFixed(4)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Sample TP</div>
                          <div className="font-medium text-green-500">
                            {pattern.examples[0].take_profit_price?.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}

              {!pattern.hasData && (
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <p>No historical examples found for {selectedTimeframe} timeframe</p>
                    <p className="text-xs mt-1">This pattern may need seeding or detection updates</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Legend */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Audit Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Has Examples (Passing)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Missing Data (Needs Seeding)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm border-emerald-500 text-emerald-500">A</Badge>
                <span>Excellent Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm border-blue-500 text-blue-500">B</Badge>
                <span>Good Quality</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zoomed Chart Dialog */}
        <Dialog open={!!zoomedExample} onOpenChange={(open) => !open && setZoomedExample(null)}>
          <DialogContent className="max-w-4xl w-[90vw] p-0 gap-0">
            {zoomedExample && (
              <>
                <DialogHeader className="px-6 pt-6 pb-3">
                  <DialogTitle className="flex items-center gap-3">
                    <span>{PATTERN_DISPLAY_NAMES[zoomedExample.pattern_id] || zoomedExample.pattern_name}</span>
                    <Badge variant="secondary" className="font-mono text-xs">{zoomedExample.symbol}</Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        zoomedExample.quality_score === 'A' ? 'border-emerald-500 text-emerald-500' :
                        zoomedExample.quality_score === 'B' ? 'border-blue-500 text-blue-500' :
                        'border-yellow-500 text-yellow-500'
                      }`}
                    >
                      Grade {zoomedExample.quality_score}
                    </Badge>
                    {zoomedExample.outcome && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          zoomedExample.outcome === 'hit_tp' ? 'border-green-500 text-green-500' :
                          zoomedExample.outcome === 'hit_sl' ? 'border-red-500 text-red-500' :
                          'border-muted-foreground'
                        }`}
                      >
                        {zoomedExample.outcome === 'hit_tp' ? 'WIN' : 
                         zoomedExample.outcome === 'hit_sl' ? 'LOSS' : 'Timeout'}
                      </Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-2">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Entry</span>
                      <span className="ml-2 font-mono text-amber-500">{zoomedExample.entry_price?.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SL</span>
                      <span className="ml-2 font-mono text-red-500">{zoomedExample.stop_loss_price?.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">TP</span>
                      <span className="ml-2 font-mono text-green-500">{zoomedExample.take_profit_price?.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#0f0f0f] rounded-b-lg overflow-hidden">
                  <ThumbnailChart
                    bars={zoomedExample.bars}
                    visualSpec={zoomedExample.visual_spec}
                    height={500}
                  />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PatternAuditPage;
