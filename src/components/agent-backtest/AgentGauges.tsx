import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const GAUGE_TOOLTIPS: Record<string, string> = {
  'Take Rate': 'Percentage of scanned setups that scored ≥70 (TAKE verdict). A high Take Rate means your current weights are accepting more trades — good for aggressive styles, but watch for quality dilution.',
  'Watch Rate': 'Percentage of setups scoring 50–69 (WATCH verdict). These are borderline opportunities worth monitoring but not yet actionable. A high Watch Rate suggests many setups are close to your threshold.',
  'Skip Rate': 'Percentage of setups scoring below 50 (SKIP verdict). A high Skip Rate means your agents are filtering aggressively — typical of conservative presets. This protects capital but may miss opportunities.',
  'Avg Score': 'The mean composite score (0–100) across all scanned setups, weighted by your agent configuration. Compare this across presets to see how your weighting strategy shifts overall market sentiment.',
};

interface GaugeProps {
  value: number;
  label: string;
  color: string;
}

const Gauge: React.FC<GaugeProps> = ({ value, label, color }) => {
  const radius = 44;
  const circumference = Math.PI * radius;
  const progress = (value / 100) * circumference;

  const strokeColors: Record<string, string> = {
    emerald: 'hsl(160, 84%, 39%)',
    amber: 'hsl(38, 92%, 50%)',
    red: 'hsl(0, 84%, 60%)',
    blue: 'hsl(217, 91%, 60%)',
  };

  const tooltip = GAUGE_TOOLTIPS[label];

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="70" viewBox="0 0 120 70">
        {/* Background arc */}
        <path
          d="M 12 62 A 48 48 0 0 1 108 62"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="7"
          opacity="0.3"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 12 62 A 48 48 0 0 1 108 62"
          fill="none"
          stroke={strokeColors[color] || strokeColors.blue}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          className="transition-all duration-700 ease-out"
        />
        {/* Center value */}
        <text x="60" y="55" textAnchor="middle" className="fill-foreground text-base font-bold font-mono">
          {value.toFixed(0)}%
        </text>
      </svg>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        {tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] text-xs leading-relaxed">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

interface AgentGaugesProps {
  takeRate: number;
  watchRate: number;
  skipRate: number;
  avgScore: number;
}

export const AgentGauges: React.FC<AgentGaugesProps> = ({ takeRate, watchRate, skipRate, avgScore }) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Gauge value={takeRate} label="Take Rate" color="emerald" />
      <Gauge value={watchRate} label="Watch Rate" color="amber" />
      <Gauge value={skipRate} label="Skip Rate" color="red" />
      <Gauge value={avgScore} label="Avg Score" color="blue" />
    </div>
  );
};
