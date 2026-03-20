import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';

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

  const chartData = useMemo<DailyCount[]>(() => {
    if (!raw) return [];
    const map = new Map<string, { long: number; short: number }>();

    for (const row of raw) {
      const day = row.first_detected_at.slice(0, 10); // YYYY-MM-DD
      const bucket = map.get(day) ?? { long: 0, short: 0 };
      if (row.direction === 'long') bucket.long++;
      else bucket.short++;
      map.set(day, bucket);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));
  }, [raw]);

  if (raw === null) {
    return (
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-5xl">
          <Skeleton className="h-8 w-64 mb-2 mx-auto" />
          <Skeleton className="h-5 w-96 mb-8 mx-auto" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </section>
    );
  }

  if (chartData.length === 0) return null;

  const formatDate = (val: string) => {
    const d = new Date(val + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <section className="py-16 px-6 border-t border-border/20">
      <div className="container mx-auto max-w-5xl text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('landing.marketPulse.title', 'Market Pulse')}
          </h2>
        </div>
        <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
          {t('landing.marketPulse.subtitle', 'Bullish vs bearish patterns detected daily across all instruments — last 30 days')}
        </p>

        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
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
    </section>
  );
}
