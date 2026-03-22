import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useTradeReport, type DateRange } from '@/hooks/useTradeReport';
import { CopilotAuthGate } from '@/components/copilot/CopilotAuthGate';
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

const ranges: { label: string; value: DateRange }[] = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: 'All time', value: 'all' },
];

const CopilotReport = () => {
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const data = useTradeReport(dateRange);
  const { closedTrades, sessions, plans, loading, firstTradeDate } = data;

  return (
    <CopilotAuthGate>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Link to="/copilot" className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to Copilot desk
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Your trading plan report</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Based on {closedTrades.length} paper trades
                {firstTradeDate && ` since ${format(new Date(firstTradeDate), 'MMM d, yyyy')}`}
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
                <Download className="h-3 w-3" /> Export PDF
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Section 1 — Go Live Readiness */}
              <ReadinessScore trades={closedTrades} sessions={sessions} />

              {/* Section 2 — Key Metrics */}
              <KeyMetricsRow trades={closedTrades} />

              {closedTrades.length < 5 ? (
                <ReportEmptyState tradeCount={closedTrades.length} />
              ) : (
                <>
                  {/* Section 3 — Equity Curve */}
                  <EquityCurve trades={closedTrades} />

                  {/* Section 4 — AI vs Human */}
                  <AIvsHuman trades={closedTrades} />

                  {/* Section 5 — Win Rate by Pattern */}
                  <PatternWinRate trades={closedTrades} />

                  {/* Section 6 — Best & Worst Trades */}
                  <BestWorstTrades trades={closedTrades} />

                  {/* Section 7 — Time of Day */}
                  <TimeOfDayHeatmap trades={closedTrades} />

                  {/* Section 8 — Plan Change History */}
                  <PlanChangeHistory trades={closedTrades} plans={plans} />

                  {/* Section 9 — Peer Comparison */}
                  <PeerComparison trades={closedTrades} sessions={sessions} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </CopilotAuthGate>
  );
};

export default CopilotReport;
