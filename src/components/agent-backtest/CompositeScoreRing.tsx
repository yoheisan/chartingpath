import React from 'react';
import { CheckCircle, Eye, AlertTriangle } from 'lucide-react';

interface CompositeScoreRingProps {
  score: number;
  takeCutoff: number;
  watchCutoff: number;
  agentBreakdown: { key: string; label: string; score: number; max: number; color: string }[];
}

export const CompositeScoreRing: React.FC<CompositeScoreRingProps> = ({
  score, takeCutoff, watchCutoff, agentBreakdown,
}) => {
  const verdict = score >= takeCutoff ? 'TAKE' : score >= watchCutoff ? 'WATCH' : 'SKIP';
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const verdictConfig = {
    TAKE: { color: 'text-emerald-400', stroke: 'hsl(160, 84%, 39%)', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle, label: 'TAKE TRADE' },
    WATCH: { color: 'text-amber-400', stroke: 'hsl(38, 92%, 50%)', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Eye, label: 'WATCHLIST' },
    SKIP: { color: 'text-red-400', stroke: 'hsl(0, 84%, 60%)', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertTriangle, label: 'SKIP' },
  };

  const vc = verdictConfig[verdict];
  const VerdictIcon = vc.icon;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ring */}
      <div className="relative">
        <svg width="180" height="180" viewBox="0 0 180 180">
          {/* Background ring */}
          <circle cx="90" cy="90" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" opacity="0.3" />
          {/* Score ring */}
          <circle
            cx="90" cy="90" r={radius}
            fill="none"
            stroke={vc.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            transform="rotate(-90 90 90)"
            className="transition-all duration-700 ease-out"
          />
          {/* Agent segment indicators */}
          {agentBreakdown.map((agent, i) => {
            const segRadius = 58;
            const segCirc = 2 * Math.PI * segRadius;
            const segSize = (agent.max / 100) * segCirc;
            const segFill = (agent.score / 100) * segCirc;
            const offset = agentBreakdown.slice(0, i).reduce((a, b) => a + (b.max / 100) * segCirc, 0);
            return (
              <circle
                key={agent.key}
                cx="90" cy="90" r={segRadius}
                fill="none"
                stroke={getAgentStroke(agent.color)}
                strokeWidth="4"
                strokeDasharray={`${segFill} ${segCirc - segFill}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 90 90)"
                opacity="0.6"
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-mono font-bold ${vc.color} transition-colors duration-300`}>
            {score}
          </span>
          <span className="text-sm text-muted-foreground uppercase tracking-widest">/ 100</span>
        </div>
      </div>

      {/* Verdict Badge */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${vc.bg} ${vc.border} transition-all duration-300`}>
        <VerdictIcon className={`h-4 w-4 ${vc.color}`} />
        <span className={`text-sm font-semibold ${vc.color} tracking-wide`}>{vc.label}</span>
      </div>

      {/* Agent Breakdown Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-1">
        {agentBreakdown.map((agent) => (
          <div key={agent.key} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: getAgentStroke(agent.color) }} />
            <span className="text-muted-foreground">{agent.label}</span>
            <span className="font-mono font-medium text-foreground ml-auto">{agent.score.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

function getAgentStroke(twClass: string): string {
  if (twClass.includes('blue')) return 'hsl(217, 91%, 60%)';
  if (twClass.includes('amber')) return 'hsl(38, 92%, 50%)';
  if (twClass.includes('purple')) return 'hsl(271, 91%, 65%)';
  if (twClass.includes('emerald')) return 'hsl(160, 84%, 39%)';
  return 'hsl(var(--primary))';
}
