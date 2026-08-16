import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { type DateRange, useTradeReport } from '@/hooks/useTradeReport';
import { ReadinessScore } from '@/components/report/ReadinessScore';
import { KeyMetricsRow } from '@/components/report/KeyMetricsRow';
import { EquityCurve } from '@/components/report/EquityCurve';
import { AIvsHuman } from '@/components/report/AIvsHuman';
import { PatternWinRate } from '@/components/report/PatternWinRate';
import { BestWorstTrades } from '@/components/report/BestWorstTrades';
import { TimeOfDayHeatmap } from '@/components/report/TimeOfDayHeatmap';
import { PlanChangeHistory } from '@/components/report/PlanChangeHistory';
import { PeerComparison } from '@/components/report/PeerComparison';
import { ReportEmptyState } from '@/components/report/ReportEmptyState';
import { ForwardEvidencePanels } from '@/components/report/ForwardEvidencePanels';
import { useAuth } from '@/contexts/AuthContext';
import { MIN_FORWARD_SAMPLE } from '@/config/sampleSize';

const CopilotReport = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>('all');

  const { closedTrades, sessions, plans, loading, firstTradeDate, suspectCount } = useTradeReport(dateRange);

  // Per-bucket panels stay hidden until any bucket clears the sample floor.
  // Recommending behaviour changes off a handful of trades is how we got here.
  const buckets = useMemo(() => {
    const byPattern = new Map<string, number>();
    const byHour = new Map<number, number>();
    for (const tr of closedTrades as any[]) {
      const p = tr.setup_type || tr.pattern_id || 'unknown';
      byPattern.set(p, (byPattern.get(p) ?? 0) + 1);
      const h = tr.entry_time ? new Date(tr.entry_time).getUTCHours() : null;
      if (h != null) byHour.set(h, (byHour.get(h) ?? 0) + 1);
    }
    return {
      maxPattern: Math.max(0, ...byPattern.values()),
      maxHour: Math.max(0, ...byHour.values()),
    };
  }, [closedTrades]);

  const ranges: { label: string; value: DateRange }[] = [
    { label: t('report.range7d'), value: '7d' },
    { label: t('report.range30d'), value: '30d' },
    { label: t('report.rangeAll'), value: 'all' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link to="/copilot" className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> {t('report.backToCopilot')}
            </Link>
            <h1 className="text-2xl font-bold text-foreground">{t('report.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {firstTradeDate
                ? t('report.basedOnSince', { count: closedTrades.length, date: format(new Date(firstTradeDate), 'MMM d, yyyy') })
                : t('report.basedOn', { count: closedTrades.length })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-muted/40 rounded-md p-0.5">
              {ranges.map(r => (
                <button
                  key={r.value}
                  onClick={() => setDateRange(r.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    dateRange === r.value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-primary/50 text-primary rounded-md hover:bg-primary/10 transition-colors">
              <Download className="h-3 w-3" /> {t('report.exportPdf')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {suspectCount > 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
                {t('report.suspectExcluded', '{{count}} closed trades were excluded because their recorded exit price failed the data-integrity check. No figure on this page uses them.', { count: suspectCount })}
              </div>
            )}
            <ReadinessScore trades={closedTrades} sessions={sessions} />
            <KeyMetricsRow trades={closedTrades} />
            <ForwardEvidencePanels userId={user?.id} />

            {closedTrades.length < 5 ? (
              <ReportEmptyState tradeCount={closedTrades.length} />
            ) : (
              <>
                <EquityCurve trades={closedTrades} />
                <AIvsHuman trades={closedTrades} />
                {buckets.maxPattern >= MIN_FORWARD_SAMPLE ? (
                  <>
                    <PatternWinRate trades={closedTrades} />
                    <BestWorstTrades trades={closedTrades} />
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
                    Per-pattern breakdown returns once a single pattern has {MIN_FORWARD_SAMPLE} resolved trades
                    (largest bucket so far: {buckets.maxPattern}).
                  </p>
                )}
                {buckets.maxHour >= MIN_FORWARD_SAMPLE ? (
                  <TimeOfDayHeatmap trades={closedTrades} />
                ) : (
                  <p className="text-xs text-muted-foreground rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
                    Time-of-day breakdown returns once a single hour has {MIN_FORWARD_SAMPLE} resolved trades
                    (largest bucket so far: {buckets.maxHour}).
                  </p>
                )}
                <PlanChangeHistory trades={closedTrades} plans={plans} />
                <PeerComparison trades={closedTrades} sessions={sessions} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CopilotReport;
