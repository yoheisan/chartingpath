import React, { useMemo } from 'react';
import { AgentWeights } from '../../../engine/backtester-v2/agents/types';
import { useTranslation } from 'react-i18next';

interface AgentImpactSimulatorProps {
  weights: AgentWeights;
  takeCutoff: number;
  watchCutoff: number;
}

export const AgentImpactSimulator: React.FC<AgentImpactSimulatorProps> = ({
  weights, takeCutoff, watchCutoff,
}) => {
  const { t } = useTranslation();

  const SCENARIOS = useMemo(() => [
    {
      name: t('agentScoring.strongSignalLowRisk'),
      emoji: '🟢',
      rawScores: { analyst: 0.92, risk: 0.85, timing: 0.7, portfolio: 0.75 },
      description: t('agentScoring.strongSignalLowRiskDesc'),
    },
    {
      name: t('agentScoring.weakSignalSafeTiming'),
      emoji: '🟡',
      rawScores: { analyst: 0.45, risk: 0.6, timing: 0.9, portfolio: 0.8 },
      description: t('agentScoring.weakSignalSafeTimingDesc'),
    },
    {
      name: t('agentScoring.greatSignalOverexposed'),
      emoji: '🟠',
      rawScores: { analyst: 0.95, risk: 0.7, timing: 0.6, portfolio: 0.3 },
      description: t('agentScoring.greatSignalOverexposedDesc'),
    },
    {
      name: t('agentScoring.preFomcUncertainty'),
      emoji: '🔴',
      rawScores: { analyst: 0.7, risk: 0.5, timing: 0.15, portfolio: 0.65 },
      description: t('agentScoring.preFomcUncertaintyDesc'),
    },
  ], [t]);

  const results = useMemo(() => {
    return SCENARIOS.map((scenario) => {
      const analyst = scenario.rawScores.analyst * weights.analyst;
      const risk = scenario.rawScores.risk * weights.risk;
      const timing = scenario.rawScores.timing * weights.timing;
      const portfolio = scenario.rawScores.portfolio * weights.portfolio;
      const composite = analyst + risk + timing + portfolio;
      const verdict = composite >= takeCutoff ? 'TAKE' : composite >= watchCutoff ? 'WATCH' : 'SKIP';
      return { ...scenario, scores: { analyst, risk, timing, portfolio }, composite, verdict };
    });
  }, [weights, takeCutoff, watchCutoff, SCENARIOS]);

  const verdictStyle: Record<string, string> = {
    TAKE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    WATCH: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    SKIP: 'text-red-400 bg-red-500/10 border-red-500/30',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{t('agentScoring.liveScenarioSimulator')}</label>
        <span className="text-sm text-muted-foreground uppercase tracking-wider">{t('agentScoring.updatesAsYouAdjust')}</span>
      </div>

      <div className="grid gap-2">
        {results.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50 transition-all duration-300"
          >
            <span className="text-lg shrink-0">{r.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground truncate">{r.name}</span>
                <span className={`text-sm font-bold px-1.5 py-0.5 rounded border ${verdictStyle[r.verdict]} shrink-0`}>
                  {r.verdict}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{r.description}</p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {(['analyst', 'risk', 'timing', 'portfolio'] as const).map((key) => {
                const pct = weights[key] > 0 ? (r.scores[key] / weights[key]) * 100 : 0;
                const colors: Record<string, string> = {
                  analyst: 'bg-blue-500',
                  risk: 'bg-amber-500',
                  timing: 'bg-purple-500',
                  portfolio: 'bg-emerald-500',
                };
                return (
                  <div key={key} className="w-1.5 h-8 bg-muted/30 rounded-full overflow-hidden flex flex-col-reverse">
                    <div
                      className={`${colors[key]} rounded-full transition-all duration-500`}
                      style={{ height: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <span className={`font-mono text-sm font-bold w-8 text-right ${
              r.verdict === 'TAKE' ? 'text-emerald-400' : r.verdict === 'WATCH' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {r.composite.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
