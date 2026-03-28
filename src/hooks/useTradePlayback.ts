import { useState, useCallback, useRef, useEffect } from 'react';
import { CompressedBar } from '@/types/VisualSpec';

export interface TradePlaybackState {
  isPlaying: boolean;
  currentBarIndex: number;
  visibleBars: CompressedBar[];
  progress: number; // 0-100
  totalBars: number;
  entryBarIndex: number;
  exitBarIndex: number | null;
}

export interface UseTradePlaybackOptions {
  bars: CompressedBar[];
  entryBarIndex: number;
  /** Unix timestamp (seconds) of the entry bar. When provided, isAfterEntry uses timestamp comparison instead of index. */
  entryBarTimestamp?: number;
  barsToOutcome?: number | null;
  playbackSpeed?: number; // ms per bar
  autoPlay?: boolean;
}

export function useTradePlayback({
  bars,
  entryBarIndex,
  entryBarTimestamp,
  barsToOutcome,
  playbackSpeed = 500,
  autoPlay = false,
}: UseTradePlaybackOptions) {
  // Calculate exit bar index
  const exitBarIndex = barsToOutcome != null ? entryBarIndex + barsToOutcome : null;
  
  // Start from just before entry to give context
  const startIndex = Math.max(0, entryBarIndex - 2);
  const endIndex = exitBarIndex != null ? Math.min(exitBarIndex + 1, bars.length) : bars.length;
  
  const [currentBarIndex, setCurrentBarIndex] = useState(startIndex);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate visible bars (from start up to current bar)
  const visibleBars = bars.slice(0, currentBarIndex + 1);
  
  // Calculate progress percentage
  const totalBars = endIndex - startIndex;
  const progress = totalBars > 0 ? ((currentBarIndex - startIndex) / (totalBars - 1)) * 100 : 0;

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentBarIndex(startIndex);
  }, [startIndex]);

  const stepForward = useCallback(() => {
    setCurrentBarIndex((prev) => Math.min(prev + 1, endIndex - 1));
  }, [endIndex]);

  const stepBackward = useCallback(() => {
    setCurrentBarIndex((prev) => Math.max(prev - 1, startIndex));
  }, [startIndex]);

  const jumpToEntry = useCallback(() => {
    setCurrentBarIndex(entryBarIndex);
    setIsPlaying(false);
  }, [entryBarIndex]);

  const jumpToExit = useCallback(() => {
    if (exitBarIndex != null) {
      setCurrentBarIndex(Math.min(exitBarIndex, bars.length - 1));
      setIsPlaying(false);
    }
  }, [exitBarIndex, bars.length]);

  const seekTo = useCallback((percentage: number) => {
    const targetIndex = Math.round(startIndex + ((endIndex - startIndex - 1) * percentage) / 100);
    setCurrentBarIndex(Math.min(Math.max(targetIndex, startIndex), endIndex - 1));
  }, [startIndex, endIndex]);

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentBarIndex((prev) => {
          if (prev >= endIndex - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, endIndex]);

  // Reset when bars change
  useEffect(() => {
    setCurrentBarIndex(startIndex);
    setIsPlaying(autoPlay);
  }, [bars, startIndex, autoPlay]);

  return {
    // State
    isPlaying,
    currentBarIndex,
    visibleBars,
    progress,
    totalBars,
    entryBarIndex,
    exitBarIndex,
    
    // Actions
    play,
    pause,
    reset,
    stepForward,
    stepBackward,
    jumpToEntry,
    jumpToExit,
    seekTo,
    
    // Computed
    isAtStart: currentBarIndex <= startIndex,
    isAtEnd: currentBarIndex >= endIndex - 1,
    isBeforeEntry: currentBarIndex < entryBarIndex,
    // Timestamp-based isAfterEntry when entryBarTimestamp is provided
    isAfterEntry: entryBarTimestamp != null && bars[currentBarIndex]
      ? Math.floor(new Date(bars[currentBarIndex].t).getTime() / 1000) >= entryBarTimestamp
      : currentBarIndex >= entryBarIndex,
    isAtExit: exitBarIndex != null && currentBarIndex >= exitBarIndex,
  };
}
