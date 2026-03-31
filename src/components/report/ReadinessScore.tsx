import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import {
  calcReadinessScore,
  type PaperTrade,
  type SessionLog,
} from '@/hooks/useTradeReport';

interface Props {
  trades: PaperTrade[];
  sessions: SessionLog[];
}

function scoreColor(score: number) {
  if (score >= 80) return 'hsl(var(--bullish))';
  if (score >= 60) return 'hsl(142 76% 50%)';
  if (score >= 40) return 'hsl(45 93% 47%)';
  return 'hsl(var(--bearish))';
}

interface ComponentExplanation {
  currentValue: string;
  threshold: string;
  description: string;
  action: string;
}

function getExplanation(
  label: string,
  score: number,
  max: number,
  meta: { count: number; avgR: number; wr: number; profitable: number; overrides: number },
  t: (key: string, opts?: Record<string, any>) => string
): ComponentExplanation {
  switch (label) {
    case 'Sample size':
      return {
        currentValue: t('report.readinessSampleSize', { count: meta.count }),
        threshold: t('report.readinessSampleThreshold'),
        description: t('report.readinessSampleDesc'),
        action: meta.count < 50
          ? t('report.readinessSampleAction', { count: 50 - meta.count })
          : t('report.readinessSampleDone'),
      };
    case 'Plan profitability':
      return {
        currentValue: t('report.readinessProfitValue', { value: `${meta.avgR >= 0 ? '+' : ''}${meta.avgR.toFixed(2)}` }),
        threshold: t('report.readinessProfitThreshold'),
        description: t('report.readinessProfitDesc'),
        action: meta.avgR < 0.5
          ? t('report.readinessProfitActionLow')
          : meta.avgR < 1.5
          ? t('report.readinessProfitActionMid')
          : t('report.readinessProfitActionHigh'),
      };
    case 'Win rate':
      return {
        currentValue: t('report.readinessWinValue', { wr: meta.wr }),
        threshold: t('report.readinessWinThreshold'),
        description: t('report.readinessWinDesc'),
        action: meta.wr < 50
          ? t('report.readinessWinActionLow')
          : meta.wr < 60
          ? t('report.readinessWinActionMid', { count: Math.ceil((0.6 * meta.count - meta.wr * meta.count / 100)) })
          : t('report.readinessWinActionHigh'),
      };
    case 'Consistency':
      return {
        currentValue: t('report.readinessConsistencyValue', { count: meta.profitable }),
        threshold: t('report.readinessConsistencyThreshold'),
        description: t('report.readinessConsistencyDesc'),
        action: meta.profitable < 3
          ? t('report.readinessConsistencyActionLow')
          : t('report.readinessConsistencyActionMid', { count: 4 - meta.profitable }),
      };
    case 'Plan discipline':
      return {
        currentValue: t('report.readinessDisciplineValue', { overrides: meta.overrides, pct: meta.count > 0 ? Math.round((meta.overrides / Math.min(meta.count, 20)) * 100) : 0 }),
        threshold: t('report.readinessDisciplineThreshold'),
        description: t('report.readinessDisciplineDesc'),
        action: meta.overrides > 0
          ? t('report.readinessDisciplineActionBad', { count: meta.overrides })
          : t('report.readinessDisciplineActionGood'),
      };
    default:
      return {
        currentValue: `${score}/${max}`,
        threshold: `${max} pts max`,
        description: '',
        action: '',
      };
  }
}

export function ReadinessScore({ trades, sessions }: Props) {
  const { t } = useTranslation();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const { total, components, meta } = useMemo(
    () => calcReadinessScore(trades, sessions),
    [trades, sessions]
  );

  const verdictText = useMemo(() => {
    const { count, wr, avgR } = meta;
    if (total >= 80)
      return t('report.goLiveReady', { count, wr, avgR: avgR.toFixed(1) });
    if (total >= 60)
      return t('report.goLivePromising', { remaining: Math.max(0, 50 - count) });
    if (total >= 40) {
      const weakest = components.reduce((a, b) => (a.score / a.max < b.score / b.max ? a : b));
      return t('report.goLiveAdjust', { weakest: weakest.label });
    }
    const weakest = components.reduce((a, b) => (a.score / a.max < b.score / b.max ? a : b));
    return t('report.goLiveNotReady', { weakest: weakest.label });
  }, [total, components, meta, t]);

  const pct = Math.min(100, total);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="bg-card border border-border/40 rounded-xl p-6">
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Score ring */}
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={scoreColor(total)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 60 60)"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground" style={{ color: scoreColor(total) }}>
              {total}
            </span>
            <span className="text-sm text-muted-foreground font-medium">{t('report.goLiveReadiness')}</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 w-full space-y-1">
          {components.map(c => {
            const labelMap: Record<string, string> = {
              'Sample size': t('report.sampleSize'),
              'Plan profitability': t('report.planProfitability'),
              'Win rate': t('report.winRateLabel'),
              'Consistency': t('report.consistency'),
              'Plan discipline': t('report.planDiscipline'),
            };
            const isExpanded = expandedRow === c.label;
            const explanation = getExplanation(c.label, c.score, c.max, meta, t);
            return (
              <div key={c.label}>
                <button
                  onClick={() => setExpandedRow(isExpanded ? null : c.label)}
                  className="w-full flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-md hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <span className="text-xs text-muted-foreground w-28 flex-shrink-0 text-left">{labelMap[c.label] ?? c.label}</span>
                  <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(c.score / c.max) * 100}%`,
                        backgroundColor: scoreColor((c.score / c.max) * 100),
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-12 text-right">
                    {c.score}/{c.max}
                  </span>
                  <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} opacity-0 group-hover:opacity-100`} />
                </button>
                {isExpanded && (
                  <div className="ml-2 mr-2 mb-2 mt-0.5 p-3 rounded-lg bg-muted/20 border border-border/20 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-foreground">{explanation.currentValue}</span>
                      <span className="text-[10px] text-muted-foreground">→ {explanation.threshold}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{explanation.description}</p>
                    <p className="text-xs text-primary leading-relaxed">💡 {explanation.action}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Verdict */}
      <div className="mt-6 pt-5 border-t border-border/30">
        <p className="text-sm text-muted-foreground leading-relaxed">{verdictText}</p>
        <div className="mt-4">
          {total >= 60 ? (
            <Link
              to="/copilot"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {t('report.goLiveButton')}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-muted text-muted-foreground rounded-md cursor-not-allowed" title={t('report.goLiveDisabledHint')}>
              {t('report.goLiveButton')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
