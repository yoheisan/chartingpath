import { useState, useEffect, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  ExternalLink,
  Target,
  ShieldAlert,
  Maximize2,
} from 'lucide-react';
import { SetupWithVisuals, CompressedBar } from '@/types/VisualSpec';
import StudyChart from '@/components/charts/StudyChart';
import { InstrumentLogo } from '@/components/charts/InstrumentLogo';
import { cn } from '@/lib/utils';

interface PatternOverlayChartProps {
  setup: SetupWithVisuals | null;
  loading?: boolean;
  onClose: () => void;
  onOpenFullChart?: () => void;
}

const TIMEFRAMES = [
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
  { value: '1wk', label: '1W' },
];

export const PatternOverlayChart = memo(function PatternOverlayChart({
  setup,
  loading = false,
  onClose,
  onOpenFullChart,
}: PatternOverlayChartProps) {
  if (!setup) return null;

  const { instrument, patternName, direction, tradePlan, bars, visualSpec } = setup;
  const timeframe = visualSpec?.timeframe || '1d';

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(6);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Chart Header with Pattern Info */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <InstrumentLogo instrument={instrument} size="md" showName={false} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{instrument}</h2>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  direction === 'long' 
                    ? 'border-emerald-500/50 text-emerald-600' 
                    : 'border-red-500/50 text-red-600'
                )}
              >
                {direction === 'long' ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {direction.toUpperCase()}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="font-medium">{patternName}</span>
              <span>•</span>
              <span>{timeframe}</span>
            </div>
          </div>
        </div>

        {/* Trade Plan Summary */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Entry:</span>
            <span className="font-medium">{formatPrice(tradePlan.entry)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
            <span className="text-muted-foreground">SL:</span>
            <span className="font-medium">{formatPrice(tradePlan.stopLoss)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-muted-foreground">TP:</span>
            <span className="font-medium">{formatPrice(tradePlan.takeProfit)}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {tradePlan.rr.toFixed(1)}R
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onOpenFullChart && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onOpenFullChart}
              title="Open full chart"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            title="Back to study chart"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <Skeleton className="h-8 w-32 mx-auto" />
              <Skeleton className="h-[300px] w-full max-w-2xl" />
            </div>
          </div>
        ) : bars && bars.length > 0 ? (
          <div className="h-full p-2">
            <StudyChart 
              bars={bars} 
              symbol={instrument} 
              height={undefined}
              tradePlan={{
                entry: tradePlan.entry,
                stopLoss: tradePlan.stopLoss,
                takeProfit: tradePlan.takeProfit,
                direction: direction as 'long' | 'short',
              }}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No chart data available
          </div>
        )}
      </div>
    </div>
  );
});
