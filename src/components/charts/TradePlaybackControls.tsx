import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Target,
  Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradePlaybackControlsProps {
  isPlaying: boolean;
  progress: number;
  isAtStart: boolean;
  isAtEnd: boolean;
  isBeforeEntry: boolean;
  isAtExit: boolean;
  exitBarIndex: number | null;
  outcome?: 'hit_tp' | 'hit_sl' | 'timeout' | 'pending' | null;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onJumpToEntry: () => void;
  onJumpToExit: () => void;
  onSeek: (percentage: number) => void;
}

export const TradePlaybackControls = memo(function TradePlaybackControls({
  isPlaying,
  progress,
  isAtStart,
  isAtEnd,
  isBeforeEntry,
  isAtExit,
  exitBarIndex,
  outcome,
  onPlay,
  onPause,
  onReset,
  onStepForward,
  onStepBackward,
  onJumpToEntry,
  onJumpToExit,
  onSeek,
}: TradePlaybackControlsProps) {
  const getOutcomeLabel = () => {
    switch (outcome) {
      case 'hit_tp': return { label: 'TP Hit', color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' };
      case 'hit_sl': return { label: 'SL Hit', color: 'bg-red-500/20 text-red-600 border-red-500/30' };
      case 'timeout': return { label: 'Timeout', color: 'bg-amber-500/20 text-amber-600 border-amber-500/30' };
      case 'pending': return { label: 'Pending', color: 'bg-muted text-muted-foreground border-border' };
      default: return null;
    }
  };

  const outcomeInfo = getOutcomeLabel();

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-t border-border rounded-b-lg">
      {/* Main controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onReset}
          disabled={isAtStart}
          title="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onStepBackward}
          disabled={isAtStart}
          title="Step back"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          onClick={isPlaying ? onPause : onPlay}
          disabled={isAtEnd && !isPlaying}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onStepForward}
          disabled={isAtEnd}
          title="Step forward"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress slider */}
      <div className="flex-1 mx-2">
        <Slider
          value={[progress]}
          onValueChange={(values) => onSeek(values[0])}
          max={100}
          step={1}
          className="cursor-pointer"
        />
      </div>

      {/* Jump buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 text-xs gap-1",
            !isBeforeEntry && "text-amber-600"
          )}
          onClick={onJumpToEntry}
          title="Jump to entry"
        >
          <Target className="h-3 w-3" />
          Entry
        </Button>

        {exitBarIndex != null && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 text-xs gap-1",
              isAtExit && outcome === 'hit_tp' && "text-emerald-600",
              isAtExit && outcome === 'hit_sl' && "text-red-600"
            )}
            onClick={onJumpToExit}
            title="Jump to exit"
          >
            <Flag className="h-3 w-3" />
            Exit
          </Button>
        )}
      </div>

      {/* Outcome badge */}
      {outcomeInfo && isAtExit && (
        <Badge 
          variant="outline" 
          className={cn("text-xs ml-1", outcomeInfo.color)}
        >
          {outcomeInfo.label}
        </Badge>
      )}
    </div>
  );
});
