import { useEffect, useMemo, useRef, useState, memo } from 'react';
import { createChart, IChartApi, CandlestickData, Time, CandlestickSeries, HistogramSeries, createSeriesMarkers, SeriesMarkerShape } from 'lightweight-charts';
import { CompressedBar, VisualSpec, PatternQuality } from '@/types/VisualSpec';
import { CompactQualityScore } from './PatternQualityBadge';
import { InstrumentLogo } from './InstrumentLogo';
import { 
  getThemeColors, 
  CANDLE_COLORS, 
  VOLUME_COLORS, 
  VOLUME_SCALE_MARGINS, 
  getVolumeColor, 
  getOverlayColor,
  PIVOT_COLORS,
  normalizeBarsForConsistentColoring,
  calculateOptimalPriceMargins,
} from './chartConstants';

interface ThumbnailChartProps {
  // Some DB rows store legacy bar objects (date/open/high/low/close/volume).
  // We coerce them into CompressedBar format inside the component.
  bars: any[];
  visualSpec: VisualSpec;
  quality?: PatternQuality;
  height?: number;
  onClick?: () => void;
  instrument?: string;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function coerceBars(input: any[] | undefined | null): CompressedBar[] {
  if (!Array.isArray(input) || input.length === 0) return [];

  const out: CompressedBar[] = [];
  for (const b of input) {
    const t = typeof b?.t === 'string'
      ? b.t
      : typeof b?.date === 'string'
        ? b.date
        : typeof b?.time === 'string'
          ? b.time
          : typeof b?.timestamp === 'string'
            ? b.timestamp
            : null;

    if (!t) continue;
    const ts = new Date(t).getTime();
    if (!Number.isFinite(ts)) continue;

    const o = typeof b?.o === 'number' ? b.o : Number(b?.open);
    const h = typeof b?.h === 'number' ? b.h : Number(b?.high);
    const l = typeof b?.l === 'number' ? b.l : Number(b?.low);
    const c = typeof b?.c === 'number' ? b.c : Number(b?.close);
    const vRaw = typeof b?.v === 'number' ? b.v : b?.volume;
    const v = Number(vRaw ?? 0);

    if (![o, h, l, c].every(isFiniteNumber)) continue;

    out.push({ t, o, h, l, c, v: Number.isFinite(v) ? v : 0 });
  }

  return out;
}

const MAX_THUMBNAIL_BARS = 80; // Cap bars for performance — keeps chart snappy

const ThumbnailChart = memo(({ bars, visualSpec, quality, height = 120, onClick, instrument }: ThumbnailChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  // Coerce then trim to last N bars for performance — always shows latest candles
  const coercedBars = useMemo(() => {
    const all = coerceBars(bars);
    return all.length > MAX_THUMBNAIL_BARS ? all.slice(-MAX_THUMBNAIL_BARS) : all;
  }, [bars]);

  useEffect(() => {
    // Always clean up any existing chart instance before rebuilding.
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    if (!containerRef.current) return;

    if (!coercedBars || coercedBars.length === 0) {
      setFallbackReason('No chart data');
      return;
    }

    setFallbackReason(null);

    // Use unified theme colors
    const theme = getThemeColors();

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: theme.background },
        textColor: theme.text,
      },
      grid: {
        vertLines: { color: theme.grid },
        horzLines: { color: theme.grid },
      },
      rightPriceScale: {
        visible: true,
        borderColor: theme.grid,
      },
      timeScale: {
        visible: true,
        borderVisible: true,
        borderColor: theme.grid,
        timeVisible: false, // Compact view
      },
      crosshair: {
        mode: 0, // disabled
      },
      handleScale: false,
      handleScroll: false,
    });

    chartRef.current = chart;

    // Use unified candlestick colors
    const candleSeries = chart.addSeries(CandlestickSeries, CANDLE_COLORS);

    // Normalize bars for consistent day-to-day coloring (green = up, red = down)
    const normalizedBars = normalizeBarsForConsistentColoring(coercedBars);

    // Transform bars to lightweight-charts format (defensive: floor time, filter NaNs)
    // lightweight-charts REQUIRES sorted ascending unique timestamps
    const chartDataRaw: CandlestickData[] = normalizedBars
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

    // Sort ascending and dedupe by time
    chartDataRaw.sort((a, b) => (a.time as number) - (b.time as number));
    const seenTimes = new Set<number>();
    const chartData: CandlestickData[] = [];
    for (const d of chartDataRaw) {
      const t = d.time as number;
      if (!seenTimes.has(t)) {
        seenTimes.add(t);
        chartData.push(d);
      }
    }

    // If no valid chart data after filtering, clean up and show fallback
    if (chartData.length === 0) {
      chart.remove();
      chartRef.current = null;
      setFallbackReason('No chart data');
      return;
    }

    try {
      candleSeries.setData(chartData);
    } catch (e) {
      console.warn('ThumbnailChart: setData failed', e);
      chart.remove();
      chartRef.current = null;
      setFallbackReason('Chart render error');
      return;
    }

    // Add volume histogram if volume data is available
    const hasVolume = coercedBars.some(bar => bar.v && bar.v > 0);
    if (hasVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: VOLUME_COLORS.default,
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });

      chart.priceScale('volume').applyOptions({
        scaleMargins: VOLUME_SCALE_MARGINS.compact,
        borderVisible: false,
      });

      const volumeData = chartData.map((d) => {
        const bar = coercedBars.find(b => Math.floor(new Date(b.t).getTime() / 1000) === (d.time as number));
        const isUp = bar ? bar.c >= bar.o : true;
        return {
          time: d.time,
          value: bar?.v || 0,
          color: getVolumeColor(isUp),
        };
      });

      volumeSeries.setData(volumeData);
    }

    // Add price lines for overlays (defensive: check if overlays exist)
    if (visualSpec?.overlays && Array.isArray(visualSpec.overlays)) {
      visualSpec.overlays.forEach((overlay) => {
        if (overlay.type === 'hline') {
          candleSeries.createPriceLine({
            price: overlay.price,
            color: getOverlayColor(overlay.style),
            lineWidth: 1,
            lineStyle: 2, // dashed
            axisLabelVisible: false,
          });
        }
      });
    }

    // Add pattern pivot markers as candle-level visual markers
    // Pivots can carry intraday timestamps while bars are daily; markers must snap to an existing bar time.
    const timeSet = new Set<number>(chartData.map((d) => d.time as number));

    if (visualSpec.pivots && visualSpec.pivots.length > 0) {
      const markers = visualSpec.pivots
        .map((pivot) => {
          const isHigh = pivot.type === 'high';

          let t = Math.floor(new Date(pivot.timestamp).getTime() / 1000);

          if (!timeSet.has(t) && Number.isInteger(pivot.index) && pivot.index >= 0 && pivot.index < coercedBars.length) {
            t = Math.floor(new Date(coercedBars[pivot.index].t).getTime() / 1000);
          }

          if (!timeSet.has(t)) return null;

          return {
            time: t as Time,
            position: (isHigh ? 'aboveBar' : 'belowBar') as 'aboveBar' | 'belowBar',
            color: isHigh ? PIVOT_COLORS.high : PIVOT_COLORS.low,
            shape: (isHigh ? 'arrowDown' : 'arrowUp') as SeriesMarkerShape,
            text: pivot.role || pivot.label || '',
          };
        })
        .filter((m): m is any => Boolean(m));

      // Sort markers by time (required by lightweight-charts)
      markers.sort((a, b) => (a.time as number) - (b.time as number));

      try {
        createSeriesMarkers(candleSeries, markers);
      } catch (e) {
        // Never break thumbnails if markers fail.
        console.warn('Failed to render thumbnail markers:', e);
      }
    }

    // Calculate optimal price margins based on actual data volatility
    // This ensures charts never look "flat" - low volatility = tighter margins
    const hasOverlays = visualSpec?.overlays && visualSpec.overlays.length > 0;
    const optimalMargins = calculateOptimalPriceMargins(coercedBars, hasOverlays);
    
    chart.priceScale('right').applyOptions({
      autoScale: true,
      scaleMargins: optimalMargins,
    });
    
    // Show the latest candles — scroll to the right edge so the most recent
    // bar is always visible. fitContent() centres all bars and can leave the
    // viewport stuck in the middle on wide datasets.
    const ts = chart.timeScale();
    ts.fitContent();
    // After fitting, nudge the visible range so the rightmost bar is flush
    // with the right edge. scrollToRealTime() ensures the latest bar is shown.
    ts.scrollToRealTime();

    // Handle resize
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0] && chartRef.current) {
        chartRef.current.applyOptions({
          width: entries[0].contentRect.width,
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [coercedBars, visualSpec, height]);

  if (fallbackReason) {
    return (
      <div 
        className="w-full bg-muted/30 rounded flex items-center justify-center text-muted-foreground text-xs"
        style={{ height }}
      >
        {fallbackReason}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full rounded overflow-hidden"
        style={{ height }}
      />

      {onClick && (
        <button
          type="button"
          aria-label="Open full chart"
          className="absolute inset-0 z-10 rounded cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          onClick={onClick}
        />
      )}

      {quality && typeof quality.score === 'number' && (
        <div className="absolute top-2 right-2 z-20 pointer-events-none">
          <CompactQualityScore score={quality.score} />
        </div>
      )}

      {instrument && (
        <div className="absolute top-2 left-2 z-20 pointer-events-none">
          <InstrumentLogo instrument={instrument} size="sm" />
        </div>
      )}
    </div>
  );
});

ThumbnailChart.displayName = 'ThumbnailChart';

export default ThumbnailChart;
