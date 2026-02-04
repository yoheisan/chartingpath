import { memo, useMemo } from 'react';
import { CompressedBar } from '@/types/VisualSpec';
import StudyChart from './StudyChart';
import { TradePlaybackControls } from './TradePlaybackControls';
import { useTradePlayback } from '@/hooks/useTradePlayback';

interface TradePlanOverlay {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  direction?: 'long' | 'short';
}

interface TradePlaybackChartProps {
  bars: CompressedBar[];
  symbol: string;
  height?: number;
  tradePlan: TradePlanOverlay;
  /** Index of the entry bar within the bars array */
  entryBarIndex?: number;
  /** Number of bars from entry to outcome */
  barsToOutcome?: number | null;
  /** Trade outcome */
  outcome?: 'hit_tp' | 'hit_sl' | 'timeout' | 'pending' | null;
  /** Whether to enable playback mode (defaults to true if entryBarIndex provided) */
  enablePlayback?: boolean;
}

/**
 * TradePlaybackChart - Wraps StudyChart with trade lifecycle playback controls.
 * 
 * Features:
 * - Play/pause animated bar-by-bar trade replay
 * - Progress slider to scrub through the trade
 * - Jump to entry / exit buttons
 * - Shows outcome badge when at exit
 */
export const TradePlaybackChart = memo(function TradePlaybackChart({
  bars,
  symbol,
  height = 350,
  tradePlan,
  entryBarIndex: providedEntryBarIndex,
  barsToOutcome,
  outcome,
  enablePlayback = true,
}: TradePlaybackChartProps) {
  // Calculate entry bar index if not provided
  // Default to 30 bars before end (matching the seeding logic)
  const entryBarIndex = providedEntryBarIndex ?? Math.max(0, bars.length - (barsToOutcome ?? 1) - 1);
  
  // Disable auto-play - user must manually start playback
  const playback = useTradePlayback({
    bars,
    entryBarIndex,
    barsToOutcome,
    playbackSpeed: 350, // Slightly faster for smooth animation
    autoPlay: false,
  });

  // Determine if we should show playback controls
  const showPlayback = enablePlayback && bars.length > 1 && barsToOutcome != null;

  // Calculate markers for entry and exit on the current visible bars
  const markers = useMemo(() => {
    if (!showPlayback) return undefined;
    
    const result: Array<{
      type: 'entry' | 'exit';
      barIndex: number;
      price: number;
    }> = [];

    // Entry marker
    if (playback.currentBarIndex >= entryBarIndex && entryBarIndex < playback.visibleBars.length) {
      result.push({
        type: 'entry',
        barIndex: entryBarIndex,
        price: tradePlan.entry,
      });
    }

    // Exit marker (only if we've reached that point)
    if (playback.exitBarIndex != null && 
        playback.currentBarIndex >= playback.exitBarIndex && 
        playback.exitBarIndex < playback.visibleBars.length) {
      const exitPrice = outcome === 'hit_tp' 
        ? tradePlan.takeProfit 
        : outcome === 'hit_sl' 
          ? tradePlan.stopLoss 
          : tradePlan.entry; // For timeout/pending, use entry as approximate
      result.push({
        type: 'exit',
        barIndex: playback.exitBarIndex,
        price: exitPrice,
      });
    }

    return result;
  }, [showPlayback, playback.currentBarIndex, playback.visibleBars.length, playback.exitBarIndex, entryBarIndex, tradePlan, outcome]);

  // If no playback, render normal chart with all bars
  if (!showPlayback) {
    return (
      <StudyChart
        bars={bars}
        symbol={symbol}
        height={height}
        tradePlan={tradePlan}
      />
    );
  }

  return (
    <div className="flex flex-col">
      <StudyChart
        bars={playback.visibleBars}
        symbol={symbol}
        height={height}
        tradePlan={playback.isAfterEntry ? tradePlan : undefined}
      />
      
      <TradePlaybackControls
        isPlaying={playback.isPlaying}
        progress={playback.progress}
        isAtStart={playback.isAtStart}
        isAtEnd={playback.isAtEnd}
        isBeforeEntry={playback.isBeforeEntry}
        isAtExit={playback.isAtExit}
        exitBarIndex={playback.exitBarIndex}
        outcome={outcome}
        onPlay={playback.play}
        onPause={playback.pause}
        onReset={playback.reset}
        onStepForward={playback.stepForward}
        onStepBackward={playback.stepBackward}
        onJumpToEntry={playback.jumpToEntry}
        onJumpToExit={playback.jumpToExit}
        onSeek={playback.seekTo}
      />
    </div>
  );
});
