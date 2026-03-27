import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { type DateRange } from '@/hooks/useTradeReport';
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
import {
  MOCK_TRADES,
  MOCK_SESSIONS,
  MOCK_PLANS,
  MOCK_FIRST_TRADE_DATE,
} from '@/components/report/mockReportData';

// ⚠️ TEMPORARY: Set to false when ready to use real Supabase data
const USE_MOCK = true;

const CopilotReport = () => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRange>('all');

  // Mock data — bypass auth & Supabase
  const closedTrades = MOCK_TRADES;
  const sessions = MOCK_SESSIONS;
  const plans = MOCK_PLANS;
  const loading = false;
  const firstTradeDate = MOCK_FIRST_TRADE_DATE;

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
              {USE_MOCK && (
                <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-mono rounded">
                  MOCK DATA
                </span>
              )}
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
            <ReadinessScore trades={closedTrades} sessions={sessions} />
            <KeyMetricsRow trades={closedTrades} />

            {closedTrades.length < 5 ? (
              <ReportEmptyState tradeCount={closedTrades.length} />
            ) : (
              <>
                <EquityCurve trades={closedTrades} />
                <AIvsHuman trades={closedTrades} />
                <PatternWinRate trades={closedTrades} />
                <BestWorstTrades trades={closedTrades} />
                <TimeOfDayHeatmap trades={closedTrades} />
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
