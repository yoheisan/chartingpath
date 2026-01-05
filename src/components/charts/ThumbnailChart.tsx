import { useEffect, useRef, memo } from 'react';
import { createChart, IChartApi, CandlestickData, Time, CandlestickSeries, createSeriesMarkers, SeriesMarkerShape } from 'lightweight-charts';
import { CompressedBar, VisualSpec, PatternQuality } from '@/types/VisualSpec';
import { CompactQualityScore } from './PatternQualityBadge';

interface ThumbnailChartProps {
  bars: CompressedBar[];
  visualSpec: VisualSpec;
  quality?: PatternQuality;
  height?: number;
  onClick?: () => void;
}

const ThumbnailChart = memo(({ bars, visualSpec, quality, height = 120, onClick }: ThumbnailChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || bars.length === 0) return;

    // Detect theme
    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? '#1a1a1a' : '#ffffff';
    const textColor = isDark ? '#888888' : '#666666';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: bgColor },
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      rightPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: false,
        borderVisible: false,
      },
      crosshair: {
        mode: 0, // disabled
      },
      handleScale: false,
      handleScroll: false,
    });

    chartRef.current = chart;

    // Create candlestick series (v5 API)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    // Transform bars to lightweight-charts format (defensive: floor time, filter NaNs, sort)
    const chartData: CandlestickData[] = bars
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
      )
      .sort((a, b) => (a.time as number) - (b.time as number));

    candleSeries.setData(chartData);

    // Add price lines for overlays
    visualSpec.overlays.forEach((overlay) => {
      if (overlay.type === 'hline') {
        const color =
          overlay.style === 'primary'
            ? '#3b82f6'
            : overlay.style === 'destructive'
              ? '#ef4444'
              : overlay.style === 'positive'
                ? '#22c55e'
                : '#888888';

        candleSeries.createPriceLine({
          price: overlay.price,
          color,
          lineWidth: 1,
          lineStyle: 2, // dashed
          axisLabelVisible: false,
        });
      }
    });

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
            color: isHigh ? '#f97316' : '#8b5cf6',
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

    // Set visible range based on yDomain
    chart.priceScale('right').applyOptions({
      autoScale: false,
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

  if (bars.length === 0) {
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
    </div>
  );
});

ThumbnailChart.displayName = 'ThumbnailChart';

export default ThumbnailChart;
