/**
 * PatternOverlayTogglePanel
 * 
 * Standardized toggle UI for pattern overlay visibility.
 * Used in StudyChart and any chart that shows historical pattern identifications.
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Layers, Eye, EyeOff } from 'lucide-react';
import type { PatternOverlayToggles } from './PatternOverlayRenderer';

interface PatternOverlayTogglePanelProps {
  toggles: PatternOverlayToggles;
  onToggle: (key: keyof PatternOverlayToggles) => void;
  patternCount: number;
  className?: string;
}

export const PatternOverlayTogglePanel = memo(({
  toggles,
  onToggle,
  patternCount,
  className,
}: PatternOverlayTogglePanelProps) => {
  const { t } = useTranslation();

  if (patternCount === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-7 px-2 bg-background/90 border-border/50 hover:bg-background ${className || ''}`}
        >
          {toggles.showPatterns ? (
            <Eye className="h-3.5 w-3.5 mr-1 text-primary" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
          )}
          <Layers className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">
            {t('chartOverlays.patterns', 'Patterns')}
            <span className="ml-1 text-muted-foreground">({patternCount})</span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-52 p-3 bg-popover border border-border shadow-lg z-50"
        align="start"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">{t('chartOverlays.patternOverlays', 'Pattern Overlays')}</Label>
            <Switch
              checked={toggles.showPatterns}
              onCheckedChange={() => onToggle('showPatterns')}
              className="scale-75"
            />
          </div>

          {toggles.showPatterns && (
            <div className="space-y-2.5 pl-1 border-l-2 border-border/50 ml-1">
              <ToggleRow 
                label={t('chartOverlays.entryLine', 'Entry Line')}
                color="#3b82f6"
                checked={toggles.showEntry}
                onChange={() => onToggle('showEntry')}
              />
              <ToggleRow 
                label={t('chartOverlays.stopLoss', 'Stop Loss')}
                color="#ef4444"
                checked={toggles.showStopLoss}
                onChange={() => onToggle('showStopLoss')}
              />
              <ToggleRow 
                label={t('chartOverlays.takeProfit', 'Take Profit')}
                color="#22c55e"
                checked={toggles.showTakeProfit}
                onChange={() => onToggle('showTakeProfit')}
              />
              <ToggleRow 
                label={t('chartOverlays.tradeZones', 'Trade Zones')}
                color="rgba(59, 130, 246, 0.5)"
                checked={toggles.showTradeZones}
                onChange={() => onToggle('showTradeZones')}
              />
              <ToggleRow 
                label={t('chartOverlays.zigzagLines', 'ZigZag Lines')}
                color="rgba(0, 200, 255, 0.85)"
                checked={toggles.showZigzag}
                onChange={() => onToggle('showZigzag')}
              />
              <ToggleRow 
                label={t('chartOverlays.patternLabels', 'Pattern Labels')}
                color="#f97316"
                checked={toggles.showLabels}
                onChange={() => onToggle('showLabels')}
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});

PatternOverlayTogglePanel.displayName = 'PatternOverlayTogglePanel';

function ToggleRow({ label, color, checked, onChange }: {
  label: string;
  color: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between pl-2">
      <div className="flex items-center gap-2">
        <span 
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <Label className="text-sm font-normal text-muted-foreground cursor-pointer" onClick={onChange}>
          {label}
        </Label>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="scale-[0.6]"
      />
    </div>
  );
}
