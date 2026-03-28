import { memo, useRef, useEffect, useState, useCallback } from 'react';
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
  getOverlayColor,
  normalizeBarsForConsistentColoring,
  calculateOptimalPriceMargins,
  calculatePricePrecision,
} from './chartConstants';
import { IndicatorSettings } from './FullChartViewer';
import { VisualSpec } from '@/types/VisualSpec';
import { deriveFormationOverlay, buildZonePoints } from '@/utils/formationOverlay';
import { renderNeckline } from './PatternOverlayRenderer';

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
  ema50: true,
  ema200: true,
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
  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);

  const playback = useTradePlayback({
    bars,
    entryBarIndex,
    entryBarTimestamp: visualSpec?.entryBarTimestamp,
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

        // Dedupe + sort timestamps to prevent "data must be asc ordered" crashes
        const seen = new Map<number, CandlestickData>();
        for (const d of chartData) {
          seen.set(d.time as number, d);
        }
        const safeChartData = [...seen.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);

        candleSeries.setData(safeChartData);

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
          const volumeData = safeChartData.map((d) => {
            const bar = playback.visibleBars.find(b => Math.floor(new Date(b.t).getTime() / 1000) === (d.time as number));
            const isUp = bar ? bar.c >= bar.o : true;
            return {
              time: d.time,
              value: bar?.v || 0,
              color: getVolumeColor(isUp),
            };
          });
          // Dedupe volume data
          const seenVol = new Map<number, typeof volumeData[0]>();
          for (const v of volumeData) seenVol.set(v.time as number, v);
          volumeSeries.setData([...seenVol.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v));
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

        if (indicators.ema200) {
          const ema200Data = calculateEMA(playback.visibleBars, 200);
          if (ema200Data.length > 0) {
            const series = chart.addSeries(LineSeries, {
              color: INDICATOR_COLORS.ema200,
              lineWidth: 1,
              lineStyle: 2,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            series.setData(ema200Data.map(p => ({ time: p.time as Time, value: p.value })));
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

        // ─── Formation Overlay: ZigZag + Trendlines + Shaded Zone ───
        const formation = deriveFormationOverlay(
          visualSpec?.pivots,
          playback.visibleBars,
          visualSpec?.patternId
        );

        if (formation && formation.zigzag.length >= 2) {
          // ZigZag polyline — uses segment-split styling for flags/H&S
          renderZigZagSeries(chart, formation);

          // Dedupe helper for trendlines
          const dedupeLineData = (data: typeof formation.zigzag) => {
            const m = new Map<number, typeof data[0]>();
            for (const d of data) m.set(d.time as number, d);
            return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
          };

          // Upper trendline (green, dashed)
          if (formation.upperTrend.length >= 2) {
            const upperSeries = chart.addSeries(LineSeries, {
              color: 'rgba(34, 197, 94, 0.6)',
              lineWidth: 1,
              lineStyle: 2, // dashed
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            });
            upperSeries.setData(dedupeLineData(formation.upperTrend));
          }

          // Lower trendline (red, dashed)
          if (formation.lowerTrend.length >= 2) {
            const lowerSeries = chart.addSeries(LineSeries, {
              color: 'rgba(239, 68, 68, 0.6)',
              lineWidth: 1,
              lineStyle: 2,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            });
            lowerSeries.setData(dedupeLineData(formation.lowerTrend));
          }

          // Neckline for reversal patterns
          renderNeckline(chart, candleSeries, visualSpec?.pivots, visualSpec?.patternId, playback.visibleBars);

          // Shaded formation zone (canvas overlay)
          if (formation.hasZone) {
            const zonePoints = buildZonePoints(formation.upperTrend, formation.lowerTrend);
            if (zonePoints.length >= 2) {
              const drawZone = () => {
                const canvas = canvasOverlayRef.current;
                if (!canvas || !chartRef.current) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const chartEl = containerEl;
                const rect = chartEl.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                canvas.width = Math.floor(rect.width) * dpr;
                canvas.height = Math.floor(rect.height) * dpr;
                canvas.style.width = `${Math.floor(rect.width)}px`;
                canvas.style.height = `${Math.floor(rect.height)}px`;
                ctx.scale(dpr, dpr);
                ctx.clearRect(0, 0, rect.width, rect.height);

                const ts = chartRef.current.timeScale();
                const ps = chartRef.current.priceScale('right');

                // Convert data points to pixel coordinates
                const pixelPoints: { x: number; upper: number; lower: number }[] = [];
                for (const pt of zonePoints) {
                  try {
                    const x = (ts as any).timeToCoordinate?.(pt.time as any);
                    const yUp = (ps as any).priceToCoordinate?.(pt.upper);
                    const yLo = (ps as any).priceToCoordinate?.(pt.lower);
                    if (x != null && yUp != null && yLo != null && 
                        Number.isFinite(x) && Number.isFinite(yUp) && Number.isFinite(yLo)) {
                      pixelPoints.push({ x, upper: yUp, lower: yLo });
                    }
                  } catch {
                    // coordinate conversion may fail
                  }
                }

                if (pixelPoints.length < 2) return;

                // Draw filled polygon
                ctx.beginPath();
                ctx.moveTo(pixelPoints[0].x, pixelPoints[0].upper);
                for (let i = 1; i < pixelPoints.length; i++) {
                  ctx.lineTo(pixelPoints[i].x, pixelPoints[i].upper);
                }
                for (let i = pixelPoints.length - 1; i >= 0; i--) {
                  ctx.lineTo(pixelPoints[i].x, pixelPoints[i].lower);
                }
                ctx.closePath();
                ctx.fillStyle = 'rgba(0, 200, 255, 0.06)';
                ctx.fill();

                // Subtle border
                ctx.strokeStyle = 'rgba(0, 200, 255, 0.15)';
                ctx.lineWidth = 1;
                ctx.stroke();
              };

              // Draw initially and on range changes
              requestAnimationFrame(drawZone);
              chart.timeScale().subscribeVisibleLogicalRangeChange(drawZone);
            }
          }
        }

        // Trade plan overlays (only show after entry) — matches prescriptive standard
        if (playback.isAfterEntry) {
          // Entry line — solid blue
          candleSeries.createPriceLine({
            price: tradePlan.entry,
            color: '#3b82f6',
            lineWidth: 2,
            lineStyle: 0, // Solid
            axisLabelVisible: true,
            title: 'ENTRY',
          });
          // Stop Loss — dashed red
          candleSeries.createPriceLine({
            price: tradePlan.stopLoss,
            color: '#ef4444',
            lineWidth: 2,
            lineStyle: 2, // Dashed
            axisLabelVisible: true,
            title: 'SL',
          });
          // Take Profit — dashed green
          candleSeries.createPriceLine({
            price: tradePlan.takeProfit,
            color: '#22c55e',
            lineWidth: 2,
            lineStyle: 2, // Dashed
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

        // Add pattern pivot markers (skip "Entry" — redundant with blue entry marker)
        // Uses nearest-candle snapping to guarantee markers render even if pivot
        // timestamps don't exactly match chart candle times (root cause of missing
        // "Bottom 1 / Bottom 2" markers on Double Bottom patterns).
        if (visualSpec?.pivots && visualSpec.pivots.length > 0) {
          const sortedTimes = chartData.map(d => d.time as number).sort((a, b) => a - b);
          const snapToNearest = (ts: number): number => {
            if (timeSet.has(ts)) return ts;
            let best = sortedTimes[0];
            let bestDist = Math.abs(ts - best);
            for (const ct of sortedTimes) {
              const d = Math.abs(ts - ct);
              if (d < bestDist) { bestDist = d; best = ct; }
              if (ct > ts && d > bestDist) break;
            }
            return best;
          };

          visualSpec.pivots.forEach((pivot) => {
            // Skip "Entry" pivots — entry is already shown by the blue triangle marker
            if ((pivot.label || '').toLowerCase().includes('entry')) return;

            const isHigh = pivot.type === 'high';
            const isBreakout = (pivot.label || '').toLowerCase().includes('breakout');
            
            // Resolve pivot time: prefer index-based lookup, then timestamp, always snap
            let pivotTime: number;
            if (Number.isInteger(pivot.index) && pivot.index >= 0 && pivot.index < playback.visibleBars.length) {
              pivotTime = Math.floor(new Date(playback.visibleBars[pivot.index].t).getTime() / 1000);
            } else {
              pivotTime = Math.floor(new Date(pivot.timestamp).getTime() / 1000);
            }
            pivotTime = snapToNearest(pivotTime);
            
            if (isBreakout) {
              allMarkers.push({
                time: pivotTime as Time,
                position: direction === 'long' ? 'belowBar' : 'aboveBar',
                color: '#3b82f6',
                shape: direction === 'long' ? 'arrowUp' : 'arrowDown',
                text: pivot.label || 'Breakout Level',
              });
            } else {
              allMarkers.push({
                time: pivotTime as Time,
                position: isHigh ? 'aboveBar' : 'belowBar',
                color: isHigh ? PIVOT_COLORS.high : PIVOT_COLORS.low,
                shape: isHigh ? 'arrowDown' : 'arrowUp',
                text: pivot.role || pivot.label || '',
              });
            }
          });
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
                color: '#3b82f6', // Blue to match prescriptive standard
                shape: direction === 'long' ? 'arrowUp' : 'arrowDown',
                text: '',
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
      <div className="relative flex-1 min-h-[250px] w-full rounded-t-lg overflow-hidden border border-border/50">
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={height ? { height } : undefined}
        />
        <canvas
          ref={canvasOverlayRef}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 10 }}
        />
      </div>
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
