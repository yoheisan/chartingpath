import { useEffect, useRef, memo } from 'react';
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
} from './chartConstants';

interface ThumbnailChartProps {
  bars: CompressedBar[];
  visualSpec: VisualSpec;
  quality?: PatternQuality;
  height?: number;
  onClick?: () => void;
  instrument?: string;
}

const ThumbnailChart = memo(({ bars, visualSpec, quality, height = 120, onClick, instrument }: ThumbnailChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || !bars || bars.length === 0) return;

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
    const normalizedBars = normalizeBarsForConsistentColoring(bars);

    // Transform bars to lightweight-charts format (defensive: floor time, filter NaNs)
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

    // Add volume histogram if volume data is available
    const hasVolume = bars.some(bar => bar.v && bar.v > 0);
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
        const bar = bars.find(b => Math.floor(new Date(b.t).getTime() / 1000) === (d.time as number));
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

          if (!timeSet.has(t) && Number.isInteger(pivot.index) && pivot.index >= 0 && pivot.index < bars.length) {
            t = Math.floor(new Date(bars[pivot.index].t).getTime() / 1000);
          }

          if (!timeSet.has(t)) return null;

          return {
            time: t as Time,
            position: (isHigh ? 'aboveBar' : 'belowBar') as 'aboveBar' | 'belowBar',
            color: isHigh ? PIVOT_COLORS.high : PIVOT_COLORS.low,
            shape: (isHigh ? 'arrowDown' : 'arrowUp') as SeriesMarkerShape,
            text: pivot.label || '',
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

    // Enable autoScale with tighter margins for more sensitive price display
    // scaleMargins: top/bottom ratio (0 = edge). Smaller values = taller candles.
    chart.priceScale('right').applyOptions({
      autoScale: true,
      scaleMargins: {
        top: 0.1,    // 10% padding at top
        bottom: 0.1, // 10% padding at bottom (80% for price action)
      },
    });
    
    // Fit content
    chart.timeScale().fitContent();

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
  }, [bars, visualSpec, height]);

  if (!bars || bars.length === 0) {
    return (
      <div 
        className="w-full bg-muted/30 rounded flex items-center justify-center text-muted-foreground text-xs"
        style={{ height }}
      >
        No chart data
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
