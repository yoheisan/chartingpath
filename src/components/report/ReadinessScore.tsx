import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

export function ReadinessScore({ trades, sessions }: Props) {
  const { t } = useTranslation();
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
            <span className="text-[10px] text-muted-foreground font-medium">{t('report.goLiveReadiness')}</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 w-full space-y-3">
          {components.map(c => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{c.label}</span>
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
            </div>
          ))}
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
