import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Target,
  ShieldAlert,
  Maximize2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { SetupWithVisuals } from '@/types/VisualSpec';
import { FullChartPlaybackView } from '@/components/charts/FullChartPlaybackView';
import StudyChart from '@/components/charts/StudyChart';
import { InstrumentLogo } from '@/components/charts/InstrumentLogo';
import { translatePatternName } from '@/utils/translatePatternName';
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
  const { t } = useTranslation();
  if (loading || !setup) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 bg-background">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[60%] w-[90%]" />
        <p className="text-xs text-muted-foreground">{loading ? 'Loading pattern chart…' : 'No pattern data'}</p>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4 mr-1" /> Close
        </Button>
      </div>
    );
  }

  const { instrument, patternName, direction, tradePlan, bars, visualSpec, outcome, barsToOutcome, entryBarIndex } = setup;
  const timeframe = visualSpec?.timeframe || '1d';
  
  // Check if this is a historical pattern with outcome data
  const isHistoricalPattern = outcome != null || barsToOutcome != null;
  
  // Calculate entry bar index from visualSpec or setup, with fallback computation
  const computedEntryBarIndex = entryBarIndex 
    ?? visualSpec?.entryBarIndex 
    ?? (barsToOutcome != null && bars && bars.length > 0 
        ? Math.max(0, bars.length - barsToOutcome - 1) 
        : undefined);
  
  // Compute barsToOutcome fallback: use remaining bars after entry as the outcome window
  const computedBarsToOutcome = barsToOutcome 
    ?? (computedEntryBarIndex != null && bars && bars.length > 0 
        ? bars.length - 1 - computedEntryBarIndex 
        : null);
  
  // Enable playback only for historical patterns with sufficient data
  const canPlayback = isHistoricalPattern && bars && bars.length > 1 && computedEntryBarIndex != null && computedBarsToOutcome != null;

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(6);
  };

  const getOutcomeInfo = () => {
    switch (outcome) {
      case 'hit_tp': 
        return { 
          label: t('commandCenter.outcomeTpHit', 'TP Hit'), 
          color: 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10',
          Icon: CheckCircle2
        };
      case 'hit_sl': 
        return { 
          label: t('commandCenter.outcomeSlHit', 'SL Hit'), 
          color: 'border-red-500/50 text-red-600 bg-red-500/10',
          Icon: XCircle
        };
      case 'timeout': 
        return { 
          label: t('commandCenter.outcomeTimeout', 'Timeout'), 
          color: 'border-amber-500/50 text-amber-600 bg-amber-500/10',
          Icon: Clock
        };
      case 'pending': 
        return { 
          label: t('commandCenter.outcomePending', 'Pending'), 
          color: 'border-border text-muted-foreground bg-muted',
          Icon: Clock
        };
      default: 
        return null;
    }
  };

  const outcomeInfo = getOutcomeInfo();

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
              {/* Outcome badge for historical patterns */}
              {outcomeInfo && (
                <Badge variant="outline" className={cn("text-xs", outcomeInfo.color)}>
                  <outcomeInfo.Icon className="h-3 w-3 mr-1" />
                  {outcomeInfo.label}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="font-medium">{patternName}</span>
              <span>•</span>
              <span>{timeframe}</span>
              {isHistoricalPattern && (
                <>
                  <span>•</span>
                  <span className="text-xs">Historical</span>
                </>
              )}
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
      <div className="flex-1 min-h-0 overflow-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <Skeleton className="h-8 w-32 mx-auto" />
              <Skeleton className="h-[300px] w-full max-w-2xl" />
            </div>
          </div>
        ) : bars && bars.length > 0 ? (
          <div className="h-full flex flex-col">
            {canPlayback && computedEntryBarIndex != null && computedBarsToOutcome != null ? (
              // Use playback chart for all patterns with bars
              <FullChartPlaybackView
                bars={bars}
                visualSpec={visualSpec}
                direction={direction as 'long' | 'short'}
                tradePlan={{
                  entry: tradePlan.entry,
                  stopLoss: tradePlan.stopLoss,
                  takeProfit: tradePlan.takeProfit,
                }}
                entryBarIndex={computedEntryBarIndex}
                barsToOutcome={computedBarsToOutcome}
                outcome={outcome}
                autoPlay={false}
              />
            ) : (
              // Fallback to standard chart if insufficient data
              <StudyChart 
                bars={bars} 
                symbol={instrument} 
                autoHeight
                tradePlan={{
                  entry: tradePlan.entry,
                  stopLoss: tradePlan.stopLoss,
                  takeProfit: tradePlan.takeProfit,
                  direction: direction as 'long' | 'short',
                }}
              />
            )}
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
