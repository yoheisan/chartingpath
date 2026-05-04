import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { type DateRange, useTradeReport } from '@/hooks/useTradeReport';
import { ReadinessScore } from '@/components/report/ReadinessScore';
import { KeyMetricsRow } from '@/components/report/KeyMetricsRow';
import { EquityCurve } from '@/components/report/EquityCurve';
import { AIvsHuman } from '@/components/report/AIvsHuman';
import { PatternWinRate } from '@/components/report/PatternWinRate';
import { ReportEmptyState } from '@/components/report/ReportEmptyState';

/**
 * Mobile-friendly Stats tab — surfaces Copilot performance analytics
 * inside the bottom-nav shell so mobile users can see win rates, equity
 * curve, AI-vs-Human and Readiness Score without leaving the Copilot.
 */
export function MobileStatsTab() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const { closedTrades, sessions, loading } = useTradeReport(dateRange);

  const ranges: { label: string; value: DateRange }[] = [
    { label: t('report.range7d', '7d'), value: '7d' },
    { label: t('report.range30d', '30d'), value: '30d' },
    { label: t('report.rangeAll', 'All'), value: 'all' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t('copilotMobile.statsTitle', 'Your Performance')}
        </h2>
        <Link
          to="/copilot/report"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          {t('copilotMobile.fullReport', 'Full report')}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex bg-muted/40 rounded-md p-0.5 w-fit">
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          <ReadinessScore trades={closedTrades} sessions={sessions} />
          <KeyMetricsRow trades={closedTrades} />
          {closedTrades.length < 5 ? (
            <ReportEmptyState tradeCount={closedTrades.length} />
          ) : (
            <>
              <EquityCurve trades={closedTrades} />
              <AIvsHuman trades={closedTrades} />
              <PatternWinRate trades={closedTrades} />
            </>
          )}
        </div>
      )}
    </div>
  );
}