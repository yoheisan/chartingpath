import { useEffect, useRef, memo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings2 } from 'lucide-react';

export interface IndicatorSettings {
  ema20: boolean;
  ema50: boolean;
  sma200: boolean;
  bollingerBands: boolean;
  vwap: boolean;
}

const DEFAULT_INDICATORS: IndicatorSettings = {
  ema20: true,
  ema50: true,
  sma200: true,
  bollingerBands: true,
  vwap: true,
};

// Persist settings in localStorage
const STORAGE_KEY = 'chartingpath_study_indicators';

function loadIndicatorSettings(): IndicatorSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_INDICATORS, ...JSON.parse(saved) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_INDICATORS;
}

function saveIndicatorSettings(settings: IndicatorSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

interface StudyChartProps {
  bars: CompressedBar[];
  symbol: string;
  height?: number;
}

/**
 * StudyChart - Full-featured chart for study pages with toggleable indicators:
 * - Price ruler (right axis)
 * - Time series (bottom axis)
 * - EMA 20, EMA 50, SMA 200
 * - Bollinger Bands
 * - VWAP
 */
const StudyChart = memo(({ bars, symbol, height = 350 }: StudyChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [indicators, setIndicators] = useState<IndicatorSettings>(loadIndicatorSettings);

  const handleToggle = (key: keyof IndicatorSettings) => {
    setIndicators((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      saveIndicatorSettings(updated);
      return updated;
    });
  };

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
    if (indicators.ema20) {
      const ema20Data = calculateEMA(bars, 20);
      if (ema20Data.length > 0) {
        const ema20Series = chart.addSeries(LineSeries, {
          color: '#f97316',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        ema20Series.setData(ema20Data.map((p) => ({ time: p.time as Time, value: p.value })));
      }
    }

    // EMA 50 (slow) - Blue
    if (indicators.ema50) {
      const ema50Data = calculateEMA(bars, 50);
      if (ema50Data.length > 0) {
        const ema50Series = chart.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        ema50Series.setData(ema50Data.map((p) => ({ time: p.time as Time, value: p.value })));
      }
    }

    // SMA 200 (trend) - Purple dashed
    if (indicators.sma200) {
      const sma200Data = calculateSMA(bars, 200);
      if (sma200Data.length > 0) {
        const sma200Series = chart.addSeries(LineSeries, {
          color: '#8b5cf6',
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        sma200Series.setData(sma200Data.map((p) => ({ time: p.time as Time, value: p.value })));
      }
    }

    // Bollinger Bands (20, 2) - Gray translucent
    if (indicators.bollingerBands) {
      const bbData = calculateBollingerBands(bars, 20, 2);
      if (bbData.length > 0) {
        const bbUpperSeries = chart.addSeries(LineSeries, {
          color: 'rgba(156, 163, 175, 0.5)',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        bbUpperSeries.setData(bbData.map((p) => ({ time: p.time as Time, value: p.upper })));

        const bbLowerSeries = chart.addSeries(LineSeries, {
          color: 'rgba(156, 163, 175, 0.5)',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        bbLowerSeries.setData(bbData.map((p) => ({ time: p.time as Time, value: p.lower })));
      }
    }

    // VWAP - Cyan dashed
    if (indicators.vwap) {
      const vwapData = calculateVWAP(bars);
      if (vwapData.length > 0) {
        const vwapSeries = chart.addSeries(LineSeries, {
          color: '#06b6d4',
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        vwapSeries.setData(vwapData.map((p) => ({ time: p.time as Time, value: p.value })));
      }
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
  }, [bars, height, indicators]);

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

  // Count active indicators for legend
  const activeIndicators = Object.entries(indicators).filter(([, v]) => v);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full rounded overflow-hidden border border-border/50"
        style={{ height }}
      />

      {/* Indicator Legend - only show active ones */}
      <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 text-[10px] pointer-events-none">
        {indicators.ema20 && (
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-border/50 text-orange-500">
            EMA 20
          </span>
        )}
        {indicators.ema50 && (
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-border/50 text-blue-500">
            EMA 50
          </span>
        )}
        {indicators.sma200 && (
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-border/50 text-purple-500">
            SMA 200
          </span>
        )}
        {indicators.bollingerBands && (
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-border/50 text-gray-400">
            BB(20,2)
          </span>
        )}
        {indicators.vwap && (
          <span className="px-1.5 py-0.5 rounded bg-background/90 border border-border/50 text-cyan-500">
            VWAP
          </span>
        )}
      </div>

      {/* Settings Button */}
      <div className="absolute top-2 right-2 z-20">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 bg-background/90 border-border/50 hover:bg-background"
            >
              <Settings2 className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Indicators</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-56 p-3 bg-popover border border-border shadow-lg z-50" 
            align="end"
            sideOffset={4}
          >
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Toggle Indicators
              </p>
              
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ema20" className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    EMA 20
                  </Label>
                  <Switch
                    id="ema20"
                    checked={indicators.ema20}
                    onCheckedChange={() => handleToggle('ema20')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="ema50" className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    EMA 50
                  </Label>
                  <Switch
                    id="ema50"
                    checked={indicators.ema50}
                    onCheckedChange={() => handleToggle('ema50')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sma200" className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    SMA 200
                  </Label>
                  <Switch
                    id="sma200"
                    checked={indicators.sma200}
                    onCheckedChange={() => handleToggle('sma200')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="bb" className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    Bollinger Bands
                  </Label>
                  <Switch
                    id="bb"
                    checked={indicators.bollingerBands}
                    onCheckedChange={() => handleToggle('bollingerBands')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="vwap" className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    VWAP
                  </Label>
                  <Switch
                    id="vwap"
                    checked={indicators.vwap}
                    onCheckedChange={() => handleToggle('vwap')}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground">
                  {activeIndicators.length} of 5 indicators active
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
});

StudyChart.displayName = 'StudyChart';

export default StudyChart;
