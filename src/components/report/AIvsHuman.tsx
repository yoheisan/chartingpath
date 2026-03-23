import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { splitByAttribution, calcWinRate, calcAvgR, calcTotalR, calcAvgHoldTime, type PaperTrade } from '@/hooks/useTradeReport';

interface Props { trades: PaperTrade[] }

function StatBlock({ label, value, color }: { label: string; value: string; color?: boolean }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-border/20 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-medium ${color === undefined ? 'text-foreground' : color ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}`}>
        {value}
      </span>
    </div>
  );
}

export function AIvsHuman({ trades }: Props) {
  const { t } = useTranslation();
  const { ai, human } = useMemo(() => splitByAttribution(trades), [trades]);

  const stats = (tr: PaperTrade[]) => {
    const wr = calcWinRate(tr);
    const avgR = calcAvgR(tr);
    const totalR = calcTotalR(tr);
    const hold = calcAvgHoldTime(tr);
    const sorted = [...tr].sort((a, b) => (b.outcome_r ?? 0) - (a.outcome_r ?? 0));
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    return { wr, avgR, totalR, hold, best, worst, count: tr.length };
  };

  const aiStats = useMemo(() => stats(ai), [ai]);
  const humanStats = useMemo(() => stats(human), [human]);

  const overrideCost = useMemo(() => calcTotalR(human), [human]);

  return (
    <div className="bg-card border border-border/40 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">{t('report.aiVsHuman')}</h2>

      <div className="grid md:grid-cols-2 gap-4">
        {/* AI column */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <h3 className="text-sm font-semibold text-blue-400 mb-3">{t('report.copilotAiApproved')}</h3>
          <StatBlock label={t('report.winRate')} value={`${aiStats.wr}%`} />
          <StatBlock label={t('report.avgRPerTrade')} value={`${aiStats.avgR >= 0 ? '+' : ''}${aiStats.avgR.toFixed(1)}R`} color={aiStats.avgR >= 0} />
          <StatBlock label={t('report.totalPnlR')} value={`${aiStats.totalR >= 0 ? '+' : ''}${aiStats.totalR.toFixed(1)}R`} color={aiStats.totalR >= 0} />
          <StatBlock label={t('report.tradeCount')} value={t('report.tradesUnit', { count: aiStats.count })} />
          {aiStats.best && <StatBlock label={t('report.bestTrade')} value={`${aiStats.best.symbol} +${(aiStats.best.outcome_r ?? 0).toFixed(1)}R`} color={true} />}
          {aiStats.worst && <StatBlock label={t('report.worstTrade')} value={`${aiStats.worst.symbol} ${(aiStats.worst.outcome_r ?? 0).toFixed(1)}R`} color={false} />}
          <StatBlock label={t('report.avgHoldTime')} value={t('report.holdTimeFormat', { hours: aiStats.hold.hours, mins: aiStats.hold.mins })} />
        </div>

        {/* Human column */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <h3 className="text-sm font-semibold text-amber-400 mb-3">{t('report.yourOverrides')}</h3>
          {humanStats.count === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t('report.noOverridesYet')}</p>
          ) : (
            <>
              <StatBlock label={t('report.winRate')} value={`${humanStats.wr}%`} />
              <StatBlock label={t('report.avgRPerTrade')} value={`${humanStats.avgR >= 0 ? '+' : ''}${humanStats.avgR.toFixed(1)}R`} color={humanStats.avgR >= 0} />
              <StatBlock label={t('report.totalPnlR')} value={`${humanStats.totalR >= 0 ? '+' : ''}${humanStats.totalR.toFixed(1)}R`} color={humanStats.totalR >= 0} />
              <StatBlock label={t('report.tradeCount')} value={t('report.tradesUnit', { count: humanStats.count })} />
              {humanStats.best && <StatBlock label={t('report.bestTrade')} value={`${humanStats.best.symbol} +${(humanStats.best.outcome_r ?? 0).toFixed(1)}R`} color={true} />}
              {humanStats.worst && <StatBlock label={t('report.worstTrade')} value={`${humanStats.worst.symbol} ${(humanStats.worst.outcome_r ?? 0).toFixed(1)}R`} color={false} />}
              <StatBlock label={t('report.avgHoldTime')} value={t('report.holdTimeFormat', { hours: humanStats.hold.hours, mins: humanStats.hold.mins })} />
            </>
          )}
        </div>
      </div>

      {human.length > 0 && (
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
          {overrideCost >= 0 ? t('report.overrideCostGained') : t('report.overrideCostLost')}{' '}
          <span className={overrideCost >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}>
            {Math.abs(overrideCost).toFixed(1)}R
          </span>{' '}
          {t('report.overrideCostOver', { count: human.length, humanWr: humanStats.wr, aiWr: aiStats.wr })}
        </p>
      )}
    </div>
  );
}
