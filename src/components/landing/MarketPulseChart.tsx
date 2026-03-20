import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface DailyCount {
  date: string;
  long: number;
  short: number;
}

const chartConfig: ChartConfig = {
  long: {
    label: 'Long',
    color: 'hsl(142 71% 45%)',
  },
  short: {
    label: 'Short',
    color: 'hsl(0 72% 51%)',
  },
};

export default function MarketPulseChart() {
  const { t } = useTranslation();
  const [raw, setRaw] = useState<{ direction: string; first_detected_at: string }[] | null>(null);

  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    supabase
      .from('live_pattern_detections')
      .select('direction, first_detected_at')
      .gte('first_detected_at', thirtyDaysAgo.toISOString())
      .then(({ data }) => setRaw(data ?? []));
  }, []);

  const { chartData, totalLong, totalShort, peakDay } = useMemo(() => {
    if (!raw) return { chartData: [] as DailyCount[], totalLong: 0, totalShort: 0, peakDay: '' };
    const map = new Map<string, { long: number; short: number }>();

    let tLong = 0;
    let tShort = 0;

    for (const row of raw) {
      const day = row.first_detected_at.slice(0, 10);
      const bucket = map.get(day) ?? { long: 0, short: 0 };
      if (row.direction === 'long') { bucket.long++; tLong++; }
      else { bucket.short++; tShort++; }
      map.set(day, bucket);
    }

    const sorted = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    let peak = '';
    let peakTotal = 0;
    for (const d of sorted) {
      const total = d.long + d.short;
      if (total > peakTotal) { peakTotal = total; peak = d.date; }
    }

    return { chartData: sorted, totalLong: tLong, totalShort: tShort, peakDay: peak };
  }, [raw]);

  const formatDate = (val: string) => {
    const d = new Date(val + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const total = totalLong + totalShort;
  const longPct = total > 0 ? Math.round((totalLong / total) * 100) : 50;

  if (raw === null) {
    return (
      <section className="py-16 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            <Skeleton className="h-[360px] rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (chartData.length === 0) return null;

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 border-t border-border/20">
      <div className="container mx-auto max-w-7xl">
        {/* Header — left-aligned like TradingView */}
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('landing.marketPulse.title', 'Market Pulse')}
          </h2>
        </div>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          {t('landing.marketPulse.subtitle', 'Bullish vs bearish patterns detected daily across all instruments — last 30 days')}
        </p>

        {/* Wide layout: chart + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Chart panel */}
          <div className="rounded-xl border border-border/40 bg-card/60 p-4 md:p-6">
            <ChartContainer config={chartConfig} className="h-[340px] w-full">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  labelFormatter={formatDate}
                />
                <Bar
                  dataKey="long"
                  stackId="a"
                  fill="var(--color-long)"
                  radius={[0, 0, 0, 0]}
                  name={t('landing.marketPulse.long', 'Long (Bullish)')}
                />
                <Bar
                  dataKey="short"
                  stackId="a"
                  fill="var(--color-short)"
                  radius={[4, 4, 0, 0]}
                  name={t('landing.marketPulse.short', 'Short (Bearish)')}
                />
              </BarChart>
            </ChartContainer>
          </div>

          {/* Sidebar stats */}
          <div className="flex flex-col gap-4">
            {/* Total detections */}
            <div className="rounded-xl border border-border/40 bg-card/60 p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <BarChart3 className="h-4 w-4" />
                <span>{t('landing.marketPulse.totalDetections', 'Total Detections')}</span>
              </div>
              <p className="text-3xl font-bold tabular-nums text-foreground">{total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('landing.marketPulse.last30Days', 'Last 30 days')}
              </p>
            </div>

            {/* Long / Bullish */}
            <div className="rounded-xl border border-border/40 bg-card/60 p-5">
              <div className="flex items-center gap-2 text-sm mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-muted-foreground">{t('landing.marketPulse.long', 'Long (Bullish)')}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <p className="text-2xl font-bold tabular-nums text-foreground">{totalLong.toLocaleString()}</p>
                <span className="text-sm font-medium text-emerald-500">{longPct}%</span>
              </div>
              {/* Ratio bar */}
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${longPct}%` }}
                />
              </div>
            </div>

            {/* Short / Bearish */}
            <div className="rounded-xl border border-border/40 bg-card/60 p-5">
              <div className="flex items-center gap-2 text-sm mb-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-muted-foreground">{t('landing.marketPulse.short', 'Short (Bearish)')}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <p className="text-2xl font-bold tabular-nums text-foreground">{totalShort.toLocaleString()}</p>
                <span className="text-sm font-medium text-red-500">{100 - longPct}%</span>
              </div>
            </div>

            {/* Peak day */}
            {peakDay && (
              <div className="rounded-xl border border-border/40 bg-card/60 p-5">
                <p className="text-sm text-muted-foreground mb-1">
                  {t('landing.marketPulse.peakDay', 'Most Active Day')}
                </p>
                <p className="text-lg font-semibold text-foreground">{formatDate(peakDay)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
