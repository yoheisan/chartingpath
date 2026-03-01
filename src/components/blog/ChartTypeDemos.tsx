import { memo, useMemo, Suspense, lazy, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { CompressedBar } from '@/types/VisualSpec';
import { supabase } from '@/integrations/supabase/client';

const StudyChart = lazy(() => import('@/components/charts/StudyChart'));
const ThumbnailChart = lazy(() => import('@/components/charts/ThumbnailChart'));

// Generate realistic-looking demo bars
function generateDemoBars(count: number, seed: number = 42): CompressedBar[] {
  const bars: CompressedBar[] = [];
  let price = 180 + seed * 0.1;
  const baseDate = new Date('2024-06-01');

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const volatility = 0.015 + Math.sin(i * 0.05) * 0.005;
    const trend = Math.sin(i * 0.02) * 0.003;
    const change = (Math.random() - 0.48 + trend) * volatility * price;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * price * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * price * 0.5;
    const volume = Math.floor(50000000 + Math.random() * 80000000);

    bars.push({
      t: date.toISOString().split('T')[0],
      o: +open.toFixed(2),
      h: +high.toFixed(2),
      l: +low.toFixed(2),
      c: +close.toFixed(2),
      v: volume,
    });

    price = close;
  }
  return bars;
}

// Build a simple visual spec for thumbnail/signal demos
function buildDemoVisualSpec(bars: CompressedBar[]) {
  if (bars.length < 20) return { formation: { pivots: [], type: 'channel' as const } };
  const mid = Math.floor(bars.length * 0.6);
  const end = Math.floor(bars.length * 0.8);
  return {
    formation: {
      pivots: [
        { barIndex: mid, price: bars[mid]?.h || 0, type: 'high' as const },
        { barIndex: end, price: bars[end]?.l || 0, type: 'low' as const },
      ],
      type: 'channel' as const,
    },
    entry: { price: bars[end]?.c || 0, barIndex: end },
    stopLoss: { price: (bars[end]?.l || 0) * 0.98 },
    takeProfit: { price: (bars[end]?.h || 0) * 1.04 },
  };
}

interface ChartDemoCardProps {
  title: string;
  description: string;
  chartType: 'study' | 'full' | 'thumbnail' | 'signal';
  bars: CompressedBar[];
}

const ChartDemoCard = memo(function ChartDemoCard({ title, description, chartType, bars }: ChartDemoCardProps) {
  const visualSpec = useMemo(() => buildDemoVisualSpec(bars), [bars]);

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="outline" className="text-xs capitalize">{chartType}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t border-border/30">
          <Suspense fallback={<Skeleton className="w-full h-[280px]" />}>
            {chartType === 'study' || chartType === 'full' ? (
              <StudyChart
                bars={bars}
                symbol="AAPL"
                height={300}
                hideAnalysisToolbar
              />
            ) : chartType === 'thumbnail' ? (
              <div className="p-4">
                <ThumbnailChart
                  bars={bars.slice(-60)}
                  visualSpec={visualSpec as any}
                  height={200}
                  instrument="AAPL"
                />
              </div>
            ) : (
              // Signal chart — use StudyChart with trade overlays via visualSpec
              <StudyChart
                bars={bars}
                symbol="AAPL"
                height={300}
                hideAnalysisToolbar
                tradePlan={{
                  entryPrice: visualSpec.entry?.price || 0,
                  stopLossPrice: visualSpec.stopLoss?.price || 0,
                  takeProfitPrice: visualSpec.takeProfit?.price || 0,
                }}
              />
            )}
          </Suspense>
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * ChartTypeDemos — Renders live interactive chart demos for the chart-types-explained article.
 * Replaces broken static image references with dynamic, always up-to-date chart renders.
 */
const ChartTypeDemos = memo(function ChartTypeDemos() {
  const { t } = useTranslation();
  const [liveBars, setLiveBars] = useState<CompressedBar[] | null>(null);

  // Try to load real AAPL data, fall back to generated bars
  useEffect(() => {
    const fetchBars = async () => {
      try {
        const { data } = await supabase
          .from('historical_prices')
          .select('date, open, high, low, close, volume')
          .eq('symbol', 'AAPL')
          .eq('timeframe', '1D')
          .order('date', { ascending: true })
          .limit(200);

        if (data && data.length > 50) {
          setLiveBars(data.map(d => ({
            t: d.date,
            o: d.open,
            h: d.high,
            l: d.low,
            c: d.close,
            v: d.volume || 0,
          })));
          return;
        }
      } catch {
        // Fall through to demo bars
      }
      setLiveBars(generateDemoBars(200));
    };
    fetchBars();
  }, []);

  const bars = liveBars || generateDemoBars(200);
  const shortBars = useMemo(() => bars.slice(-80), [bars]);

  const demos: ChartDemoCardProps[] = useMemo(() => [
    {
      title: t('chartTypeDemos.studyChart', 'Study Chart'),
      description: t('chartTypeDemos.studyDesc', 'Primary research workspace with full candlestick display, volume, and multi-timeframe support.'),
      chartType: 'study' as const,
      bars,
    },
    {
      title: t('chartTypeDemos.fullChart', 'Full Chart'),
      description: t('chartTypeDemos.fullDesc', 'Expanded modal view with trade overlay lines, pattern zone markers, and playback controls.'),
      chartType: 'full' as const,
      bars,
    },
    {
      title: t('chartTypeDemos.thumbnailChart', 'Thumbnail Chart'),
      description: t('chartTypeDemos.thumbnailDesc', 'Compact read-only preview optimized for scanning multiple patterns at a glance.'),
      chartType: 'thumbnail' as const,
      bars: shortBars,
    },
    {
      title: t('chartTypeDemos.signalChart', 'Signal Chart'),
      description: t('chartTypeDemos.signalDesc', 'Specialized view with entry, stop loss, and take profit price levels for trade execution.'),
      chartType: 'signal' as const,
      bars: shortBars,
    },
  ], [bars, shortBars, t]);

  return (
    <div className="space-y-6 my-8">
      {demos.map((demo) => (
        <ChartDemoCard key={demo.chartType} {...demo} />
      ))}
    </div>
  );
});

export default ChartTypeDemos;
