import { memo, useRef, useEffect, useState } from 'react';
import {
  createChart,
  IChartApi,
  CandlestickData,
  Time,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  createSeriesMarkers,
  SeriesMarkerShape,
} from 'lightweight-charts';
import { CompressedBar } from '@/types/VisualSpec';
import { TradePlaybackControls } from './TradePlaybackControls';
import { useTradePlayback } from '@/hooks/useTradePlayback';
import {
  calculateEMA,
  calculateSMA,
  calculateBollingerBands,
  calculateVWAP,
} from '@/utils/chartIndicators';
import {
  getThemeColors,
  CANDLE_COLORS,
  VOLUME_COLORS,
  VOLUME_SCALE_MARGINS,
  getVolumeColor,
  INDICATOR_COLORS,
  PIVOT_COLORS,
  PATTERN_SHAPE_COLOR,
  getOverlayColor,
  normalizeBarsForConsistentColoring,
  calculateOptimalPriceMargins,
  calculatePricePrecision,
} from './chartConstants';
import { IndicatorSettings } from './FullChartViewer';
import { VisualSpec } from '@/types/VisualSpec';

interface FullChartPlaybackViewProps {
  bars: CompressedBar[];
  visualSpec?: VisualSpec;
  direction: 'long' | 'short';
  entryBarIndex: number;
  barsToOutcome: number | null;
  outcome?: 'hit_tp' | 'hit_sl' | 'timeout' | 'pending' | null;
  tradePlan: {
    entry: number;
    stopLoss: number;
    takeProfit: number;
  };
  indicators?: IndicatorSettings;
  height?: number;
  /** Auto-start playback animation */
  autoPlay?: boolean;
}

// Default indicators for standalone usage
const DEFAULT_INDICATORS: IndicatorSettings = {
  ema20: false,
  ema50: false,
  sma200: false,
  bollingerBands: false,
  vwap: false,
};

/**
 * FullChartPlaybackView - Playback-enabled chart for historical pattern occurrences.
 * Renders an interactive bar-by-bar replay with entry/exit markers and outcome visualization.
 */
export const FullChartPlaybackView = memo(function FullChartPlaybackView({
  bars,
  visualSpec,
  direction,
  entryBarIndex,
  barsToOutcome,
  outcome,
  tradePlan,
  indicators = DEFAULT_INDICATORS,
  height = 420,
  autoPlay = false,
}: FullChartPlaybackViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const playback = useTradePlayback({
    bars,
    entryBarIndex,
    barsToOutcome,
    playbackSpeed: 350, // Slightly faster for smoother animation
    autoPlay,
  });

  // Rebuild chart when visible bars change
  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl || playback.visibleBars.length === 0) return;

    let cleanedUp = false;
    let resizeObserver: ResizeObserver | null = null;
    let rafId: number | null = null;
    let attempts = 0;

    const initChart = () => {
      if (cleanedUp || !containerEl) return;

      const rect = containerEl.getBoundingClientRect();
      const containerWidth = Math.floor(rect.width);
      const containerHeight = Math.floor(rect.height);

      if (containerWidth <= 0 || containerHeight <= 0) {
        attempts += 1;
        if (attempts > 60) return;
        rafId = window.requestAnimationFrame(initChart);
        return;
      }

      try {
        const theme = getThemeColors();

        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }

        const chart = createChart(containerEl, {
          width: containerWidth,
          height: Math.max(containerHeight, 300),
          layout: {
            background: { color: theme.background },
            textColor: theme.text,
          },
          grid: {
            vertLines: { color: theme.grid },
            horzLines: { color: theme.grid },
          },
          rightPriceScale: {
            borderColor: theme.grid,
            visible: true,
            mode: 0,
            autoScale: true,
          },
          timeScale: {
            borderColor: theme.grid,
            timeVisible: true,
            secondsVisible: false,
            visible: true,
          },
          crosshair: { mode: 0 },
          handleScroll: {
            vertTouchDrag: true,
            mouseWheel: true,
            pressedMouseMove: true,
          },
          handleScale: {
            axisPressedMouseMove: { price: true, time: true },
            mouseWheel: true,
            pinch: true,
          },
        });

        chartRef.current = chart;

        const normalizedBars = normalizeBarsForConsistentColoring(playback.visibleBars);
        const representativePrice = normalizedBars.length > 0 ? normalizedBars[normalizedBars.length - 1].c : 1;
        const { precision, minMove } = calculatePricePrecision(representativePrice);

        const candleSeries = chart.addSeries(CandlestickSeries, {
          ...CANDLE_COLORS,
          priceFormat: {
            type: 'price',
            precision,
            minMove,
          },
        });

        const chartData: CandlestickData[] = normalizedBars
          .map((bar) => {
            const ts = Math.floor(new Date(bar.t).getTime() / 1000);
            return {
              time: ts as Time,
              open: bar.o,
              high: bar.h,
              low: bar.l,
              close: bar.c,
            };
          })
          .filter(
            (d) =>
              Number.isFinite(d.time as number) &&
              Number.isFinite(d.open) &&
              Number.isFinite(d.high) &&
              Number.isFinite(d.low) &&
              Number.isFinite(d.close)
          );

        candleSeries.setData(chartData);

        // Volume
        const hasVolume = playback.visibleBars.some(bar => bar.v && bar.v > 0);
        if (hasVolume) {
          const volumeSeries = chart.addSeries(HistogramSeries, {
            color: VOLUME_COLORS.default,
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
          });
          chart.priceScale('volume').applyOptions({
            scaleMargins: VOLUME_SCALE_MARGINS.standard,
            borderVisible: false,
          });
          const volumeData = chartData.map((d) => {
            const bar = playback.visibleBars.find(b => Math.floor(new Date(b.t).getTime() / 1000) === (d.time as number));
            const isUp = bar ? bar.c >= bar.o : true;
            return {
              time: d.time,
              value: bar?.v || 0,
              color: getVolumeColor(isUp),
            };
          });
          volumeSeries.setData(volumeData);
        }

        // Indicators (only add if enabled)
        if (indicators.ema20) {
          const ema20Data = calculateEMA(playback.visibleBars, 20);
          if (ema20Data.length > 0) {
            const series = chart.addSeries(LineSeries, {
              color: INDICATOR_COLORS.ema20,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            series.setData(ema20Data.map(p => ({ time: p.time as Time, value: p.value })));
          }
        }

        if (indicators.ema50) {
          const ema50Data = calculateEMA(playback.visibleBars, 50);
          if (ema50Data.length > 0) {
            const series = chart.addSeries(LineSeries, {
              color: INDICATOR_COLORS.ema50,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            series.setData(ema50Data.map(p => ({ time: p.time as Time, value: p.value })));
          }
        }

        if (indicators.sma200) {
          const sma200Data = calculateSMA(playback.visibleBars, 200);
          if (sma200Data.length > 0) {
            const series = chart.addSeries(LineSeries, {
              color: INDICATOR_COLORS.sma200,
              lineWidth: 1,
              lineStyle: 2,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            series.setData(sma200Data.map(p => ({ time: p.time as Time, value: p.value })));
          }
        }

        if (indicators.bollingerBands) {
          const bbData = calculateBollingerBands(playback.visibleBars, 20, 2);
          if (bbData.length > 0) {
            const upperSeries = chart.addSeries(LineSeries, {
              color: INDICATOR_COLORS.bollingerBands,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            upperSeries.setData(bbData.map(p => ({ time: p.time as Time, value: p.upper })));
            const lowerSeries = chart.addSeries(LineSeries, {
              color: INDICATOR_COLORS.bollingerBands,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            lowerSeries.setData(bbData.map(p => ({ time: p.time as Time, value: p.lower })));
          }
        }

        if (indicators.vwap) {
          const vwapData = calculateVWAP(playback.visibleBars);
          if (vwapData.length > 0) {
            const series = chart.addSeries(LineSeries, {
              color: INDICATOR_COLORS.vwap,
              lineWidth: 1,
              lineStyle: 2,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            series.setData(vwapData.map(p => ({ time: p.time as Time, value: p.value })));
          }
        }

        // Add pattern overlay lines from visualSpec (same as audit page)
        // These show key levels identified by pattern detection
        if (visualSpec?.overlays && Array.isArray(visualSpec.overlays)) {
          visualSpec.overlays.forEach((overlay) => {
            if (overlay.type === 'hline') {
              candleSeries.createPriceLine({
                price: overlay.price,
                color: getOverlayColor(overlay.style),
                lineWidth: 1,
                lineStyle: 2, // dashed
                axisLabelVisible: false,
                title: overlay.label || '',
              });
            }
          });
        }

        // Trade plan overlays (only show after entry)
        if (playback.isAfterEntry) {
          candleSeries.createPriceLine({
            price: tradePlan.entry,
            color: '#f59e0b',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: 'Entry',
          });
          candleSeries.createPriceLine({
            price: tradePlan.stopLoss,
            color: '#ef4444',
            lineWidth: 2,
            lineStyle: 2,
            axisLabelVisible: true,
            title: 'Stop',
          });
          candleSeries.createPriceLine({
            price: tradePlan.takeProfit,
            color: '#22c55e',
            lineWidth: 2,
            lineStyle: 2,
            axisLabelVisible: true,
            title: 'TP',
          });
        }

        // Markers: Pattern pivots, Pattern zone, Entry, Exit
        const timeSet = new Set<number>(chartData.map((d) => d.time as number));
        const allMarkers: Array<{
          time: Time;
          position: 'aboveBar' | 'belowBar';
          color: string;
          shape: SeriesMarkerShape;
          text: string;
        }> = [];

        // Add pattern pivot markers from visualSpec (same as audit page)
        // These show the structural points of the pattern (highs/lows)
        if (visualSpec?.pivots && visualSpec.pivots.length > 0) {
          visualSpec.pivots.forEach((pivot) => {
            const isHigh = pivot.type === 'high';
            
            // Try to match pivot to a bar time
            let pivotTime = Math.floor(new Date(pivot.timestamp).getTime() / 1000);
            
            // If timestamp doesn't match, try using the index
            if (!timeSet.has(pivotTime) && Number.isInteger(pivot.index) && pivot.index >= 0 && pivot.index < playback.visibleBars.length) {
              pivotTime = Math.floor(new Date(playback.visibleBars[pivot.index].t).getTime() / 1000);
            }
            
            if (timeSet.has(pivotTime)) {
              allMarkers.push({
                time: pivotTime as Time,
                position: isHigh ? 'aboveBar' : 'belowBar',
                color: isHigh ? PIVOT_COLORS.high : PIVOT_COLORS.low,
                shape: isHigh ? 'arrowDown' : 'arrowUp',
                text: pivot.label || '',
              });
            }
          });
        }

        // === Pattern Shape Overlay (blue zigzag connecting pivots visible so far) ===
        if (visualSpec?.pivots && visualSpec.pivots.length >= 2) {
          const pivotLineData = visualSpec.pivots
            .map((pivot) => {
              let pivotTime = Math.floor(new Date(pivot.timestamp).getTime() / 1000);
              if (!timeSet.has(pivotTime) && Number.isInteger(pivot.index) && pivot.index >= 0 && pivot.index < playback.visibleBars.length) {
                pivotTime = Math.floor(new Date(playback.visibleBars[pivot.index].t).getTime() / 1000);
              }
              if (!timeSet.has(pivotTime)) return null;
              return { time: pivotTime as Time, value: pivot.price };
            })
            .filter(Boolean) as { time: Time; value: number }[];

          pivotLineData.sort((a, b) => (a.time as number) - (b.time as number));

          if (pivotLineData.length >= 2) {
            const shapeSeries = chart.addSeries(LineSeries, {
              color: PATTERN_SHAPE_COLOR,
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            });
            shapeSeries.setData(pivotLineData);
          }
        }

        // Pattern identification marker (if no pivots, show a simple zone marker)
        if (!visualSpec?.pivots || visualSpec.pivots.length === 0) {
          const patternEndIndex = Math.max(0, entryBarIndex - 1);
          const patternStartIndex = Math.max(0, patternEndIndex - 5);
          
          if (patternStartIndex < playback.visibleBars.length) {
            const patternStartBar = playback.visibleBars[patternStartIndex];
            if (patternStartBar) {
              const patternStartTime = Math.floor(new Date(patternStartBar.t).getTime() / 1000);
              if (timeSet.has(patternStartTime)) {
                allMarkers.push({
                  time: patternStartTime as Time,
                  position: 'belowBar',
                  color: '#8b5cf6', // Purple for pattern identification
                  shape: 'square',
                  text: 'Pattern',
                });
              }
            }
          }
        }

        // Entry marker (show after we've reached the entry bar in playback)
        if (playback.isAfterEntry && entryBarIndex < playback.visibleBars.length) {
          const entryBar = playback.visibleBars[entryBarIndex];
          if (entryBar) {
            const entryTime = Math.floor(new Date(entryBar.t).getTime() / 1000);
            if (timeSet.has(entryTime)) {
              allMarkers.push({
                time: entryTime as Time,
                position: direction === 'long' ? 'belowBar' : 'aboveBar',
                color: '#f59e0b',
                shape: direction === 'long' ? 'arrowUp' : 'arrowDown',
                text: 'Entry',
              });
            }
          }
        }

        // Exit marker (if reached)
        if (playback.isAtExit && playback.exitBarIndex != null && playback.exitBarIndex < playback.visibleBars.length) {
          const exitBar = playback.visibleBars[playback.exitBarIndex];
          if (exitBar) {
            const exitTime = Math.floor(new Date(exitBar.t).getTime() / 1000);
            if (timeSet.has(exitTime)) {
              const isWin = outcome === 'hit_tp';
              allMarkers.push({
                time: exitTime as Time,
                position: direction === 'long' ? 'aboveBar' : 'belowBar',
                color: isWin ? '#22c55e' : outcome === 'hit_sl' ? '#ef4444' : '#f59e0b',
                shape: 'circle',
                text: outcome === 'hit_tp' ? 'TP' : outcome === 'hit_sl' ? 'SL' : 'Exit',
              });
            }
          }
        }

        allMarkers.sort((a, b) => (a.time as number) - (b.time as number));
        if (allMarkers.length > 0) {
          try {
            createSeriesMarkers(candleSeries, allMarkers);
          } catch {
            // Ignore marker errors
          }
        }

        // Fit content with optimal margins
        const optimalMargins = calculateOptimalPriceMargins(playback.visibleBars, true);
        chart.priceScale('right').applyOptions({
          autoScale: true,
          scaleMargins: optimalMargins,
        });
        chart.timeScale().fitContent();

        resizeObserver = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (!entry || !chartRef.current) return;
          chartRef.current.applyOptions({
            width: Math.floor(entry.contentRect.width),
            height: Math.max(Math.floor(entry.contentRect.height || 0), 300),
          });
        });
        resizeObserver.observe(containerEl);
      } catch (e) {
        console.error('FullChartPlaybackView chart init failed:', e);
      }
    };

    rafId = window.requestAnimationFrame(initChart);

    return () => {
      cleanedUp = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      if (resizeObserver) resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [playback.visibleBars, playback.isAfterEntry, playback.isAtExit, playback.exitBarIndex, indicators, tradePlan, direction, entryBarIndex, outcome]);

  // Use dynamic height if not specified
  const chartHeight = height || 'calc(100% - 48px)';

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        className="flex-1 min-h-[250px] w-full rounded-t-lg overflow-hidden border border-border/50"
        style={height ? { height } : undefined}
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
