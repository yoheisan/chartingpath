import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

interface GaugeProps {
  value: number;
  label: string;
  tooltip: string;
  color: string;
}

const Gauge: React.FC<GaugeProps> = ({ value, label, tooltip, color }) => {
  const radius = 44;
  const circumference = Math.PI * radius;
  const progress = (value / 100) * circumference;

  const strokeColors: Record<string, string> = {
    emerald: 'hsl(160, 84%, 39%)',
    amber: 'hsl(38, 92%, 50%)',
    red: 'hsl(0, 84%, 60%)',
    blue: 'hsl(217, 91%, 60%)',
  };

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path d="M 12 62 A 48 48 0 0 1 108 62" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" opacity="0.3" strokeLinecap="round" />
        <path d="M 12 62 A 48 48 0 0 1 108 62" fill="none" stroke={strokeColors[color] || strokeColors.blue} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${progress} ${circumference}`} className="transition-all duration-700 ease-out" />
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
              <TooltipContent side="bottom" className="max-w-sm whitespace-normal text-xs leading-relaxed">
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
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-4 gap-4">
      <Gauge value={takeRate} label={t('agentScoring.takeRate')} tooltip={t('agentScoring.takeRateTooltip')} color="emerald" />
      <Gauge value={watchRate} label={t('agentScoring.watchRate')} tooltip={t('agentScoring.watchRateTooltip')} color="amber" />
      <Gauge value={skipRate} label={t('agentScoring.skipRate')} tooltip={t('agentScoring.skipRateTooltip')} color="red" />
      <Gauge value={avgScore} label={t('agentScoring.avgScore')} tooltip={t('agentScoring.avgScoreTooltip')} color="blue" />
    </div>
  );
};
