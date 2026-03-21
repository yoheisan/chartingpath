import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from 'react-i18next';

interface AgentCardProps {
  agentKey: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  weight: number;
  onWeightChange: (value: number) => void;
  description: string;
  liveScore?: number;
  factors?: string[];
}

export const AgentCard: React.FC<AgentCardProps> = ({
  label, icon: Icon, color, bgColor, borderColor,
  weight, onWeightChange, description, liveScore, factors,
}) => {
  const { t } = useTranslation();
  const scorePercent = liveScore != null ? (liveScore / weight) * 100 : 0;

  return (
    <div className={`relative rounded-xl border ${borderColor} ${bgColor} p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${bgColor} ring-1 ${borderColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{label}</h3>
            <p className="text-sm text-muted-foreground leading-tight">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-mono font-bold ${color}`}>{weight}</div>
          <div className="text-sm text-muted-foreground uppercase tracking-wider">{t('agentScoring.weight')}</div>
        </div>
      </div>

      {/* Weight Slider */}
      <div className="mb-3">
        <Slider
          value={[weight]}
          onValueChange={([v]) => onWeightChange(v)}
          min={0}
          max={50}
          step={1}
          className="w-full"
        />
      </div>

      {/* Live Score Bar */}
      {liveScore != null && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">{t('agentScoring.lastScore')}</span>
            <span className={`font-mono font-semibold ${color}`}>{liveScore.toFixed(1)}/{weight}</span>
          </div>
          <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out`}
              style={{
                width: `${Math.min(scorePercent, 100)}%`,
                background: `linear-gradient(90deg, hsl(var(--muted)) 0%, ${getComputedColor(color)} 100%)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Factor Tags */}
      {factors && factors.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {factors.map((f) => (
            <span key={f} className="text-sm px-1.5 py-0.5 rounded-md bg-muted/40 text-muted-foreground">
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

function getComputedColor(twClass: string): string {
  if (twClass.includes('blue')) return 'hsl(217, 91%, 60%)';
  if (twClass.includes('amber')) return 'hsl(38, 92%, 50%)';
  if (twClass.includes('purple')) return 'hsl(271, 91%, 65%)';
  if (twClass.includes('emerald')) return 'hsl(160, 84%, 39%)';
  return 'hsl(var(--primary))';
}
