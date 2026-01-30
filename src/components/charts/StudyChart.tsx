import { useEffect, useRef, memo } from 'react';
import {
  createChart,
  IChartApi,
  CandlestickData,
  Time,
  CandlestickSeries,
  LineSeries,
} from 'lightweight-charts';
import { CompressedBar } from '@/types/VisualSpec';
import {
  calculateEMA,
  calculateSMA,
  calculateBollingerBands,
  calculateVWAP,
} from '@/utils/chartIndicators';

interface StudyChartProps {
  bars: CompressedBar[];
  symbol: string;
  height?: number;
}

/**
 * StudyChart - Full-featured chart for study pages with:
 * - Price ruler (right axis)
 * - Time series (bottom axis)
 * - EMA 20, EMA 50, SMA 200
 * - Bollinger Bands
 * - VWAP
 */
const StudyChart = memo(({ bars, symbol, height = 350 }: StudyChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || !bars || bars.length === 0) return;

    // Detect theme
    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? '#0f0f0f' : '#ffffff';
    const textColor = isDark ? '#a1a1a1' : '#666666';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

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
        visible: true,
        borderColor: gridColor,
      },
      timeScale: {
        visible: true,
        borderVisible: true,
        borderColor: gridColor,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
    });

    chartRef.current = chart;

    // Candlestick series - solid filled
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    // Transform bars to lightweight-charts format
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

    // === TECHNICAL INDICATORS ===

    // EMA 20 (fast) - Orange
    const ema20Data = calculateEMA(bars, 20);
    if (ema20Data.length > 0) {
      const ema20Series = chart.addSeries(LineSeries, {
        color: '#f97316',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      ema20Series.setData(ema20Data.map(p => ({ time: p.time as Time, value: p.value })));
    }

    // EMA 50 (slow) - Blue
    const ema50Data = calculateEMA(bars, 50);
    if (ema50Data.length > 0) {
      const ema50Series = chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      ema50Series.setData(ema50Data.map(p => ({ time: p.time as Time, value: p.value })));
    }

    // SMA 200 (trend) - Purple dashed
    const sma200Data = calculateSMA(bars, 200);
    if (sma200Data.length > 0) {
      const sma200Series = chart.addSeries(LineSeries, {
        color: '#8b5cf6',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      sma200Series.setData(sma200Data.map(p => ({ time: p.time as Time, value: p.value })));
    }

    // Bollinger Bands (20, 2) - Gray translucent
    const bbData = calculateBollingerBands(bars, 20, 2);
    if (bbData.length > 0) {
      const bbUpperSeries = chart.addSeries(LineSeries, {
        color: 'rgba(156, 163, 175, 0.5)',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      bbUpperSeries.setData(bbData.map(p => ({ time: p.time as Time, value: p.upper })));

      const bbLowerSeries = chart.addSeries(LineSeries, {
        color: 'rgba(156, 163, 175, 0.5)',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      bbLowerSeries.setData(bbData.map(p => ({ time: p.time as Time, value: p.lower })));
    }

    // VWAP - Cyan dashed
    const vwapData = calculateVWAP(bars);
    if (vwapData.length > 0) {
      const vwapSeries = chart.addSeries(LineSeries, {
        color: '#06b6d4',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      vwapSeries.setData(vwapData.map(p => ({ time: p.time as Time, value: p.value })));
    }

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0] && chartRef.current) {
        chartRef.current.applyOptions({
          width: entries[0].contentRect.width,
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [bars, height]);

  if (!bars || bars.length === 0) {
    return (
      <div
        className="w-full bg-muted/30 rounded flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        No price data available
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full rounded overflow-hidden border border-border/50"
        style={{ height }}
      />
      {/* Indicator Legend */}
      <div className="absolute top-2 left-2 flex flex-wrap gap-2 text-[10px] pointer-events-none">
        <span className="px-1.5 py-0.5 rounded bg-background/80 text-orange-500">EMA 20</span>
        <span className="px-1.5 py-0.5 rounded bg-background/80 text-blue-500">EMA 50</span>
        <span className="px-1.5 py-0.5 rounded bg-background/80 text-purple-500">SMA 200</span>
        <span className="px-1.5 py-0.5 rounded bg-background/80 text-gray-400">BB(20,2)</span>
        <span className="px-1.5 py-0.5 rounded bg-background/80 text-cyan-500">VWAP</span>
      </div>
    </div>
  );
});

StudyChart.displayName = 'StudyChart';

export default StudyChart;
