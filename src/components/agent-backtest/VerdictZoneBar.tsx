import React from 'react';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from 'react-i18next';

interface VerdictZoneBarProps {
  takeCutoff: number;
  watchCutoff: number;
  onTakeChange: (v: number) => void;
  onWatchChange: (v: number) => void;
  currentScore?: number;
}

export const VerdictZoneBar: React.FC<VerdictZoneBarProps> = ({
  takeCutoff, watchCutoff, onTakeChange, onWatchChange, currentScore,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <label className="text-sm font-semibold text-foreground">{t('agentScoring.verdictZones')}</label>

      {/* Visual zone bar */}
      <div className="relative h-10 rounded-lg overflow-hidden flex">
        <div
          className="bg-red-500/20 border-r border-red-500/40 flex items-center justify-center"
          style={{ width: `${watchCutoff}%` }}
        >
          <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">{t('agentScoring.skip')}</span>
        </div>
        <div
          className="bg-amber-500/20 border-r border-amber-500/40 flex items-center justify-center"
          style={{ width: `${takeCutoff - watchCutoff}%` }}
        >
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">{t('agentScoring.watch')}</span>
        </div>
        <div
          className="bg-emerald-500/20 flex items-center justify-center"
          style={{ width: `${100 - takeCutoff}%` }}
        >
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">{t('agentScoring.take')}</span>
        </div>

        {currentScore != null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-foreground transition-all duration-500"
            style={{ left: `${currentScore}%` }}
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-foreground bg-background px-1.5 rounded">
              {currentScore}
            </div>
          </div>
        )}
      </div>

      {/* Cutoff sliders */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">TAKE ≥</span>
            <span className="font-mono font-semibold text-emerald-400">{takeCutoff}</span>
          </div>
          <Slider value={[takeCutoff]} onValueChange={([v]) => onTakeChange(v)} min={50} max={95} step={1} />
        </div>
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">WATCH ≥</span>
            <span className="font-mono font-semibold text-amber-400">{watchCutoff}</span>
          </div>
          <Slider value={[watchCutoff]} onValueChange={([v]) => onWatchChange(v)} min={20} max={80} step={1} />
        </div>
      </div>
    </div>
  );
};
